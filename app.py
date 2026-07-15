"""
SysNotes - Backend
Author: aloysiuspattath
GitHub: https://github.com/aloysiuspattath
"""
from flask import Flask, request, jsonify, send_from_directory, render_template
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from database import init_db, get_db, DATABASE_PATH, UPLOADS_DIR
from backup_service import start_backup_service
from auth import login_required, admin_required, generate_token, decode_token
import sqlite3
import os
import re
import uuid
from datetime import datetime
from dotenv import load_dotenv
import secrets
from functools import wraps

import requests
import xml.etree.ElementTree as ET
import html
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

def check_ad_login(username, password):
    url = os.environ.get('AD_SERVER_URL', 'https://10.250.7.210/sso/adloginwithRoles.asmx')
    username = html.escape(username)
    password = html.escape(password)

    payload = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <userAttributes xmlns="http://tempuri.org/">
      <username>{username}</username>
      <password>{password}</password>
    </userAttributes>
  </soap12:Body>
</soap12:Envelope>"""

    headers = {'Content-Type': 'application/soap+xml'}

    try:
        response = requests.post(url, headers=headers, data=payload, verify=False, timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"AD server connection failed: {e}")
        return ("ERROR", None)

    root = ET.fromstring(response.text)
    result_element = root.find('.//{*}Result')
    name_element = root.find('.//{*}Name')
    if result_element is not None:
        return (result_element.text, name_element.text if name_element is not None else username)
    else:
        return ("FAILED", None)


# Load environment variables from .env if present
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

def get_secret_key():
    secret_file = os.path.join(os.path.dirname(__file__), '.secret_key')
    if os.environ.get('SECRET_KEY'):
        return os.environ.get('SECRET_KEY')
    if os.path.exists(secret_file):
        with open(secret_file, 'r') as f:
            return f.read().strip()
    new_key = secrets.token_hex(32)
    with open(secret_file, 'w') as f:
        f.write(new_key)
    return new_key

app.config['SECRET_KEY'] = get_secret_key()
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max upload

# Password complexity validation
def validate_password(password):
    """Enforce minimum password complexity requirements."""
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    if not any(c.isdigit() for c in password):
        return False, 'Password must contain at least one number'
    if not any(c.isupper() for c in password):
        return False, 'Password must contain at least one uppercase letter'
    return True, ''

# Login rate limiting constants
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
_login_attempts = {}  # {username: {'count': N, 'locked_until': datetime}}

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Ensure database is always initialized (creates tables if they don't exist)
init_db()

# Start daily backup service (runs in a daemon thread)
if not os.environ.get('TESTING'):
    start_backup_service('sysadmin_notes.db')

def get_base_url():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = 'reverse_proxy_url'")
    row = cursor.fetchone()
    conn.close()
    url = row['value'] if row and row['value'] else '/'
    if not url.endswith('/'):
        url += '/'
    return url

class ProxyDispatcherMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        # We need a new db connection per request for thread safety, 
        # but calling get_base_url() inside WSGI middleware is safe.
        prefix = get_base_url().rstrip('/')
        if prefix and environ.get('PATH_INFO', '').startswith(prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(prefix):]
            if not environ['PATH_INFO']:
                environ['PATH_INFO'] = '/'
            environ['SCRIPT_NAME'] = prefix
        return self.app(environ, start_response)

app.wsgi_app = ProxyDispatcherMiddleware(app.wsgi_app)

@app.before_request
def force_https():
    request.environ['wsgi.url_scheme'] = 'https'

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    with open('error_log.txt', 'a') as f:
        f.write(traceback.format_exc() + '\n')
    return "Internal Server Error", 500

# Serve Frontend SPA
@app.route('/')
def serve_index():
    return render_template('index.html', base_url=get_base_url())

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/t/<team_name>')
@app.route('/<team_name>')
def serve_team_index(team_name):
    # Exclude system folders, favicon and static assets
    if team_name in ['static', 'uploads', 'api', 'note', 'favicon.ico', 'robots.txt'] or '.' in team_name:
        from flask import abort
        abort(404)
        
    conn = get_db()
    try:
        cursor = conn.cursor()
        # Find if the team name exists in the database
        cursor.execute("SELECT name FROM teams WHERE LOWER(name) = ?", (team_name.lower(),))
        row = cursor.fetchone()
        if row:
            # Render index.html with the selected team
            return render_template('index.html', base_url=get_base_url(), default_team=row['name'])
    finally:
        conn.close()
        
    from flask import abort
    abort(404)

# Serve uploaded images
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    mimetype = None
    if ext == 'pdf':
        mimetype = 'application/pdf'
    elif ext == 'txt':
        mimetype = 'text/plain'
    elif ext == 'csv':
        mimetype = 'text/csv'
    
    if mimetype:
        resp = send_from_directory(UPLOADS_DIR, filename, mimetype=mimetype)
        if ext == 'pdf':
            resp.headers['Content-Disposition'] = f'inline; filename="{filename}"'
        return resp
    return send_from_directory(UPLOADS_DIR, filename)

# Note detail page
@app.route('/note/<int:note_id>')
def note_detail_page(note_id):
    return render_template('note_detail.html', note_id=note_id, base_url=get_base_url())

# Single note JSON API
@app.route('/api/notes/<int:note_id>', methods=['GET'])
def get_note_by_id(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        sql = (
            "SELECT n.id, n.title, n.command, n.description, n.note_type,"
            " n.category_id, c.name as category_name,"
            " n.created_at, n.updated_at, n.created_by,"
            " u.username as created_by_username, n.approved, n.reference_links,"
            " n.status, n.team_id, n.visibility, tm.name as team_name"
            " FROM notes n"
            " LEFT JOIN categories c ON n.category_id = c.id"
            " LEFT JOIN users u ON n.created_by = u.id"
            " LEFT JOIN teams tm ON n.team_id = tm.id"
            " WHERE n.id = ?"
        )
        cursor.execute(sql, (note_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Note not found"}), 404
        note = dict(row)

        # Check authorization
        current_user_id = None
        current_role = None
        user_team_ids = []
        token = request.headers.get('Authorization')
        if token:
            if token.startswith('Bearer '):
                token = token[7:]
            payload = decode_token(token)
            if not isinstance(payload, str):
                current_user_id = payload.get('sub')
                current_role = payload.get('role')
                user_team_ids = payload.get('teams', [])

        if current_role != 'admin':
            is_creator = (current_user_id == note['created_by'])
            is_moderator = (current_role == 'moderator')
            
            if note.get('status') == 'draft' and not is_creator:
                return jsonify({"message": "Access denied"}), 403
                
            if not note.get('approved') and not is_creator and not is_moderator:
                return jsonify({"message": "Access denied"}), 403
                
            is_global = (note.get('visibility') == 'global')
            has_team_access = (note.get('team_id') in user_team_ids)
            
            if not is_global and not has_team_access:
                return jsonify({"message": "Access denied (Team Restricted)"}), 403
        cursor.execute(
            "SELECT t.name FROM tags t"
            " JOIN note_tags nt ON nt.tag_id = t.id"
            " WHERE nt.note_id = ?",
            (note_id,)
        )
        note["tags"] = [r["name"] for r in cursor.fetchall()]
        cursor.execute(
            "SELECT id, step_order, title, command, description, blocks"
            " FROM note_steps WHERE note_id = ? ORDER BY step_order",
            (note_id,)
        )
        steps = [dict(r) for r in cursor.fetchall()]
        import json
        for step in steps:
            if step.get('blocks'):
                try:
                    step['blocks'] = json.loads(step['blocks'])
                except:
                    step['blocks'] = []
            else:
                step['blocks'] = []
            
            cursor.execute(
                "SELECT id, filename, original_name FROM note_images"
                " WHERE note_id = ? AND step_id = ? ORDER BY id",
                (note_id, step["id"])
            )
            step["images"] = [
                {"id": r["id"], "url": "/uploads/" + r["filename"], "name": r["original_name"]}
                for r in cursor.fetchall()
            ]
        note["steps"] = steps
        cursor.execute(
            "SELECT id, filename, original_name FROM note_images"
            " WHERE note_id = ? AND step_id IS NULL ORDER BY id",
            (note_id,)
        )
        note["images"] = [
            {"id": r["id"], "url": "/uploads/" + r["filename"], "name": r["original_name"]}
            for r in cursor.fetchall()
        ]
        return jsonify(note)
    finally:
        conn.close()


# ================= AUTHENTICATION ================= #

@app.route('/api/login', methods=['POST'])
def login():
    conn = get_db()
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        requested_login_type = data.get('login_type')

        if not username or not password:
            return jsonify({'message': 'Invalid credentials'}), 401

        # Rate limiting: check if account is locked in DB for local users
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401

        login_type = user['auth_type']
        
        # Enforce that the user selected the correct authentication type
        if requested_login_type and requested_login_type != login_type:
            return jsonify({'message': 'Invalid credentials'}), 401

        if login_type == 'local':
            import datetime as _dt
            if user['locked_until']:
                locked_until = _dt.datetime.strptime(user['locked_until'], '%Y-%m-%d %H:%M:%S')
                now = _dt.datetime.utcnow()
                if now < locked_until:
                    remaining = int((locked_until - now).total_seconds() // 60) + 1
                    return jsonify({'message': f'Account temporarily locked. Try again in {remaining} minute(s)'}), 429
                else:
                    # Lock expired, reset failed attempts
                    cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", (user['id'],))
                    conn.commit()

        auth_success = False
        display_name = None

        if login_type == 'ad':
            loginFlg, ADName = check_ad_login(username, password)
            if loginFlg == 'SUCCESS':
                auth_success = True
                display_name = ADName
        else:
            if check_password_hash(user['password_hash'], password):
                auth_success = True

        if auth_success:
            if login_type == 'local':
                cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", (user['id'],))
                conn.commit()
            
            token = generate_token(user['id'], user['username'], user['role'])
            from database import get_user_teams
            teams = get_user_teams(user['id'])
            resp = {
                'token': token, 
                'role': user['role'], 
                'username': user['username'], 
                'teams': [{'id': t['id'], 'name': t['name']} for t in teams]
            }
            if display_name:
                resp['display_name'] = display_name
            return jsonify(resp)
        else:
            if login_type == 'local':
                failed_attempts = (user['failed_attempts'] or 0) + 1
                import datetime as _dt
                if failed_attempts >= 5:
                    locked_until = (_dt.datetime.utcnow() + _dt.timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M:%S')
                    cursor.execute("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", (failed_attempts, locked_until, user['id']))
                    conn.commit()
                    return jsonify({'message': 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.'}), 429
                else:
                    cursor.execute("UPDATE users SET failed_attempts = ? WHERE id = ?", (failed_attempts, user['id']))
                    conn.commit()
            return jsonify({'message': 'Invalid credentials'}), 401
    finally:
        conn.close()

def admin_or_moderator_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or request.user is None:
            return jsonify({'message': 'Authentication required'}), 401
        if request.user.get('role') not in ['admin', 'moderator']:
            return jsonify({'message': 'Admin or Moderator privileges required'}), 403
        return f(*args, **kwargs)
    return decorated

@app.route('/api/health', methods=['GET'])
def health_check():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        return jsonify({'status': 'ok', 'message': 'API and Database are operational'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()

# ================= USERS (ADMIN ONLY) ================= #

@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    from database import get_user_teams
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, role, auth_type FROM users")
        users = [dict(row) for row in cursor.fetchall()]
        for u in users:
            u['teams'] = get_user_teams(u['id'])
        return jsonify(users)
    finally:
        conn.close()

@app.route('/api/users', methods=['POST'])
@admin_required
def create_user():
    conn = get_db()
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'author')
        auth_type = data.get('auth_type', 'ad')
        team_ids = data.get('team_ids', [])

        if role not in ['admin', 'moderator', 'author']:
            return jsonify({'message': 'Invalid role. Must be admin, moderator, or author'}), 400
        if auth_type not in ['ad', 'local']:
            return jsonify({'message': 'Invalid auth type'}), 400

        if auth_type == 'ad':
            if not username:
                return jsonify({'message': 'Username required'}), 400
            pwd_hash = generate_password_hash(secrets.token_urlsafe(32))
        else:
            if not username or not password:
                return jsonify({'message': 'Username and password required for local users'}), 400
            is_valid, msg = validate_password(password)
            if not is_valid:
                return jsonify({'message': msg}), 400
            pwd_hash = generate_password_hash(password)

        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (username, password_hash, role, auth_type) VALUES (?, ?, ?, ?)",
                           (username, pwd_hash, role, auth_type))
            uid = cursor.lastrowid
            
            # Save team links
            cursor.execute("DELETE FROM user_teams WHERE user_id = ?", (uid,))
            for tid in team_ids:
                cursor.execute("INSERT OR IGNORE INTO user_teams (user_id, team_id) VALUES (?, ?)", (uid, tid))
            
            conn.commit()
            return jsonify({'message': 'User created successfully', 'id': uid}), 201
        except sqlite3.IntegrityError:
            return jsonify({'message': 'Username already exists'}), 400
    finally:
        conn.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    conn = get_db()
    try:
        data = request.json
        role = data.get('role')
        team_ids = data.get('team_ids')

        cursor = conn.cursor()
        cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'User not found'}), 404

        if role:
            if role not in ['admin', 'moderator', 'author']:
                return jsonify({'message': 'Invalid role'}), 400
            if request.user['sub'] == user_id and role != 'admin':
                return jsonify({'message': 'Cannot downgrade your own role'}), 400
            cursor.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))

        if team_ids is not None:
            cursor.execute("DELETE FROM user_teams WHERE user_id = ?", (user_id,))
            for tid in team_ids:
                cursor.execute("INSERT OR IGNORE INTO user_teams (user_id, team_id) VALUES (?, ?)", (user_id, tid))

        conn.commit()
        return jsonify({'message': 'User updated successfully'})
    finally:
        conn.close()

@app.route('/api/users/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(user_id):
    conn = get_db()
    try:
        if request.user['sub'] == user_id:
            return jsonify({'message': 'Cannot change your own role'}), 400

        data = request.json
        new_role = data.get('role')
        if new_role not in ['author', 'moderator', 'admin']:
            return jsonify({'message': 'Can only change role to author, moderator, or admin'}), 400

        cursor = conn.cursor()
        
        # Ensure we don't downgrade other admins
        cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'User not found'}), 404
        if row['role'] == 'admin':
            return jsonify({'message': 'Cannot change role of an admin'}), 400

        cursor.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
        conn.commit()

        return jsonify({'message': 'Role updated successfully'})
    finally:
        conn.close()

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    conn = get_db()
    try:
        if request.user['sub'] == user_id:
            return jsonify({'message': 'Cannot delete your own account'}), 400

        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'User not found'}), 404

        return jsonify({'message': 'User deleted successfully'})
    finally:
        conn.close()

# ================= TEAMS (ADMIN ONLY) ================= #

@app.route('/api/admin/teams', methods=['GET'])
@login_required
def get_teams_list():
    from database import get_all_teams
    try:
        teams = get_all_teams()
        return jsonify(teams)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/teams', methods=['POST'])
@admin_required
def create_new_team():
    import sqlite3
    from database import create_team
    try:
        data = request.json
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        if not name:
            return jsonify({'message': 'Team name is required'}), 400
        tid = create_team(name, description)
        return jsonify({'message': 'Team created successfully', 'id': tid}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Team name already exists'}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/admin/teams/<int:team_id>', methods=['DELETE'])
@admin_required
def remove_team(team_id):
    from database import delete_team
    try:
        delete_team(team_id)
        return jsonify({'message': 'Team deleted successfully'})
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ================= CHANGE PASSWORD ================= #

@app.route('/api/change-password', methods=['POST'])
@login_required
def change_password():
    conn = get_db()
    try:
        data = request.json
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return jsonify({'message': 'Old password and new password required'}), 400

        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'message': msg}), 400

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (request.user['sub'],))
        user = cursor.fetchone()

        if not user or not check_password_hash(user['password_hash'], old_password):
            return jsonify({'message': 'Old password is incorrect'}), 400

        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                       (generate_password_hash(new_password), request.user['sub']))
        conn.commit()
        return jsonify({'message': 'Password changed successfully'})
    finally:
        conn.close()

# ================= SETTINGS ================= #

@app.route('/api/settings', methods=['GET'])
@login_required
def get_settings():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        settings = {row['key']: row['value'] for row in cursor.fetchall()}
        return jsonify(settings)
    finally:
        conn.close()

@app.route('/api/settings', methods=['POST'])
@admin_required
def update_settings():
    conn = get_db()
    try:
        data = request.json
        cursor = conn.cursor()

        for key, value in data.items():
            cursor.execute("UPDATE settings SET value = ? WHERE key = ?", (value, key))

        conn.commit()
        return jsonify({'message': 'Settings updated'})
    finally:
        conn.close()

# ================= CATEGORIES ================= #

@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.id, c.name, c.enabled, COUNT(n.id) as note_count
            FROM categories c
            LEFT JOIN notes n ON n.category_id = c.id
            GROUP BY c.id, c.name, c.enabled
            ORDER BY c.name
        """)
        categories = [dict(row) for row in cursor.fetchall()]
        return jsonify(categories)
    finally:
        conn.close()

@app.route('/api/categories', methods=['POST'])
@login_required
@admin_or_moderator_required
def create_category():
    conn = get_db()
    try:
        data = request.json
        name = data.get('name')

        if not name:
            return jsonify({'message': 'Category name required'}), 400

        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (name,))
            conn.commit()
            return jsonify({'message': 'Category created', 'id': cursor.lastrowid}), 201
        except sqlite3.IntegrityError:
            return jsonify({'message': 'Category already exists'}), 400
    finally:
        conn.close()

@app.route('/api/categories/<int:cat_id>', methods=['DELETE'])
@login_required
@admin_or_moderator_required
def delete_category(cat_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE notes SET category_id = NULL WHERE category_id = ?", (cat_id,))
        cursor.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'Category not found'}), 404

        return jsonify({'message': 'Category deleted successfully'})
    finally:
        conn.close()

@app.route('/api/categories/<int:cat_id>', methods=['PUT'])
@login_required
@admin_or_moderator_required
def update_category(cat_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT enabled FROM categories WHERE id = ?", (cat_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Category not found'}), 404

        new_state = 0 if row['enabled'] else 1
        cursor.execute("UPDATE categories SET enabled = ? WHERE id = ?", (new_state, cat_id))
        conn.commit()
        return jsonify({'message': 'Category toggled', 'enabled': bool(new_state)})
    finally:
        conn.close()

# ================= TAGS ================= #

@app.route('/api/tags', methods=['GET'])
def get_tags():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.id, t.name, COUNT(nt.note_id) as usage_count
            FROM tags t
            LEFT JOIN note_tags nt ON nt.tag_id = t.id
            GROUP BY t.id, t.name
            ORDER BY t.name
        """)
        tags = [dict(row) for row in cursor.fetchall()]
        return jsonify(tags)
    finally:
        conn.close()

# ================= STATS ================= #

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM notes")
        total_notes = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM categories")
        total_categories = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM tags")
        total_tags = cursor.fetchone()['count']
        return jsonify({
            'total_notes': total_notes,
            'total_categories': total_categories,
            'total_tags': total_tags
        })
    finally:
        conn.close()

# ================= NOTES ================= #

def _sanitize_fts_query(query):
    sanitized = re.sub(r'[^\w\s\-._]', ' ', query)
    words = sanitized.split()
    if not words:
        return None
    return ' '.join(f'"{w}"' for w in words)

def _get_tags_for_note(cursor, note_id):
    cursor.execute("""
        SELECT t.name FROM tags t
        JOIN note_tags nt ON nt.tag_id = t.id
        WHERE nt.note_id = ?
    """, (note_id,))
    return [row['name'] for row in cursor.fetchall()]

def _link_tags_to_note(cursor, conn, note_id, tags):
    for tag_name in tags:
        tag_name = tag_name.strip()
        if not tag_name:
            continue
        cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
        cursor.execute("SELECT id FROM tags WHERE name = ?", (tag_name,))
        tag_row = cursor.fetchone()
        if tag_row:
            cursor.execute("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)",
                           (note_id, tag_row['id']))

def _get_steps_for_note(cursor, note_id):
    """Fetch all steps for a note, each with their images."""
    cursor.execute("""
        SELECT id, step_order, title, command, description, blocks
        FROM note_steps WHERE note_id = ?
        ORDER BY step_order
    """, (note_id,))
    steps = [dict(row) for row in cursor.fetchall()]
    import json
    for step in steps:
        if step.get('blocks'):
            try:
                step['blocks'] = json.loads(step['blocks'])
            except:
                step['blocks'] = []
        else:
            step['blocks'] = []
        
        cursor.execute("""
            SELECT id, filename, original_name FROM note_images
            WHERE note_id = ? AND step_id = ?
            ORDER BY id
        """, (note_id, step['id']))
        step['images'] = [
            {'id': r['id'], 'url': f'/uploads/{r["filename"]}', 'name': r['original_name']}
            for r in cursor.fetchall()
        ]
    return steps

def _get_note_images(cursor, note_id):
    """Fetch note-level images (not attached to a step)."""
    cursor.execute("""
        SELECT id, filename, original_name FROM note_images
        WHERE note_id = ? AND step_id IS NULL ORDER BY id
    """, (note_id,))
    return [
        {'id': r['id'], 'url': f'/uploads/{r["filename"]}', 'name': r['original_name']}
        for r in cursor.fetchall()
    ]

def _save_steps(cursor, note_id, steps):
    """Delete existing steps and insert new ones."""
    import json
    cursor.execute("DELETE FROM note_steps WHERE note_id = ?", (note_id,))
    for i, step in enumerate(steps):
        blocks_json = json.dumps(step.get('blocks', []))
        cursor.execute(
            "INSERT INTO note_steps (note_id, step_order, title, command, description, blocks) VALUES (?,?,?,?,?,?)",
            (note_id, i, step.get('title', ''), step.get('command', ''), step.get('description', ''), blocks_json)
        )

@app.route('/api/last_updated', methods=['GET'])
def get_last_updated():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(updated_at) as last_update FROM notes")
        row = cursor.fetchone()
        last_update = row['last_update'] if row and row['last_update'] else ""
        return jsonify({"last_update": last_update})
    finally:
        conn.close()
@app.route('/api/notes', methods=['GET'])
def get_notes():
    conn = get_db()
    try:
        query = request.args.get('q', '').strip()
        category = request.args.get('category', '').strip()
        tag = request.args.get('tag', '').strip()
        team_filter = request.args.get('team', '').strip()
        status = request.args.get('status', '').strip()

        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        offset = (page - 1) * limit

        cursor = conn.cursor()

        base_select = """
            SELECT n.id, n.title, n.command, n.description, n.note_type,
                   n.category_id, c.name as category_name,
                   n.created_at, n.updated_at, n.created_by, n.reference_links,
                   u.username as created_by_username, n.approved, n.status,
                   n.team_id, n.visibility, tm.name as team_name,
                   (SELECT COUNT(*) FROM note_steps WHERE note_id = n.id) as step_count
            FROM notes n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.created_by = u.id
            LEFT JOIN teams tm ON n.team_id = tm.id
        """
        conditions = []
        params = []

        if query:
            import re
            words = [w for w in re.sub(r'[^\w\s]', ' ', query).split() if w]
            if words:
                search_conditions = []
                for word in words:
                    search_pattern = f"%{word}%"
                    search_conditions.append("(n.title LIKE ? OR n.command LIKE ? OR n.description LIKE ?)")
                    params.extend([search_pattern, search_pattern, search_pattern])
                conditions.append("(" + " AND ".join(search_conditions) + ")")

        if category:
            conditions.append("c.id = ?")
            params.append(category)

        if tag:
            base_select += " LEFT JOIN note_tags nt ON nt.note_id = n.id LEFT JOIN tags tg ON tg.id = nt.tag_id"
            conditions.append("tg.name = ?")
            params.append(tag)

        if team_filter:
            if team_filter.isdigit():
                conditions.append("n.team_id = ?")
                params.append(int(team_filter))
            else:
                conditions.append("n.team_id IN (SELECT id FROM teams WHERE LOWER(name) = ?)")
                params.append(team_filter.lower())

        # Determine user auth details
        token = request.headers.get('Authorization')
        user_team_ids = []
        user_role = None
        user_id = None
        if token:
            if token.startswith('Bearer '):
                token = token[7:]
            payload = decode_token(token)
            if not isinstance(payload, str):
                user_id = payload.get('sub')
                user_role = payload.get('role')
                user_team_ids = payload.get('teams', [])

        # Separate approved from pending and draft notes
        if status == 'pending':
            if not user_id:
                return jsonify({'message': 'Authentication required!'}), 401
            if user_role in ['admin', 'moderator']:
                conditions.append("n.approved = 0 AND n.status = 'published'")
            else:
                conditions.append("n.approved = 0 AND n.status = 'published' AND n.created_by = ?")
                params.append(user_id)
        elif status == 'draft':
            if not user_id:
                return jsonify({'message': 'Authentication required!'}), 401
            conditions.append("n.status = 'draft' AND n.created_by = ?")
            params.append(user_id)
        else:
            conditions.append("n.approved = 1 AND n.status = 'published'")

        # Enforce team isolation for non-drafts
        if status != 'draft' and user_role != 'admin':
            if user_team_ids:
                placeholders = ','.join('?' for _ in user_team_ids)
                conditions.append(f"(n.visibility = 'global' OR n.team_id IN ({placeholders}))")
                params.extend(user_team_ids)
            else:
                conditions.append("n.visibility = 'global'")

        sql = base_select
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # Batch fetch tags to avoid N+1
        note_ids = [str(r['id']) for r in rows]
        tags_map = {}
        if note_ids:
            placeholders = ','.join('?' * len(note_ids))
            cursor.execute(f"""
                SELECT nt.note_id, t.name 
                FROM note_tags nt 
                JOIN tags t ON nt.tag_id = t.id 
                WHERE nt.note_id IN ({placeholders})
            """, note_ids)
            for nt in cursor.fetchall():
                nid = nt['note_id']
                if nid not in tags_map:
                    tags_map[nid] = []
                tags_map[nid].append(nt['name'])

        # Build response
        notes = []
        for row in rows:
            note = dict(row)
            note['tags'] = tags_map.get(note['id'], [])
            note['steps'] = []  # Trimmed for performance, load on detail view
            note['images'] = [] # Trimmed for performance, load on detail view
            notes.append(note)

        return jsonify(notes)
    finally:
        conn.close()

@app.route('/api/notes', methods=['POST'])
@login_required
def create_note():
    conn = get_db()
    try:
        data = request.json
        title = data.get('title', '').strip()
        note_type = data.get('note_type', 'command')
        command = data.get('command', '').strip()
        description = data.get('description', '')
        category_id = data.get('category_id')
        tags = data.get('tags', [])
        steps = data.get('steps', [])

        status = data.get('status', 'published').strip()
        if status not in ['published', 'draft']:
            status = 'published'

        if status == 'published':
            if not title:
                return jsonify({'message': 'Title is required'}), 400
            if note_type == 'command' and not command:
                return jsonify({'message': 'Command is required for command notes'}), 400
            if note_type == 'procedure' and not steps:
                return jsonify({'message': 'At least one step is required for procedures'}), 400
            if note_type == 'plain' and not description:
                return jsonify({'message': 'Content is required for plain notes'}), 400
        else:
            if not title:
                title = "Untitled Note"

        reference_links = data.get('reference_links', [])
        import json
        ref_links_json = json.dumps(reference_links)

        team_id = data.get('team_id')
        visibility = data.get('visibility', 'global').strip()
        if visibility not in ['team', 'global']:
            visibility = 'global'

        user_role = request.user.get('role', 'author')

        # Validate team assignment
        if visibility == 'team':
            if not team_id:
                return jsonify({'message': 'Team assignment is required for team-only notes'}), 400
            if user_role != 'admin' and int(team_id) not in request.user.get('teams', []):
                return jsonify({'message': 'Access denied: You are not a member of the selected team'}), 403
        else:
            # If global, team_id is optional (can be null)
            pass

        # Drafts don't need approval, they are invisible anyway
        approved = 1 if user_role in ['admin', 'moderator'] else 0
        if status == 'draft':
            approved = 0

        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO notes (title, command, description, note_type, category_id, created_by, approved, reference_links, status, team_id, visibility) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (title, command, description, note_type, category_id, request.user['sub'], approved, ref_links_json, status, team_id, visibility)
        )
        note_id = cursor.lastrowid

        if steps:
            _save_steps(cursor, note_id, steps)

        if tags:
            _link_tags_to_note(cursor, conn, note_id, tags)

        log_audit(conn, note_id, 'CREATED', request.user['username'], f"Note created (approved={bool(approved)})")
        conn.commit()
        message = 'Note created' if approved == 1 else 'Note created and is pending approval'
        return jsonify({'message': message, 'id': note_id, 'approved': bool(approved)}), 201
    finally:
        conn.close()

def _create_revision(cursor, note_id, note):
    # Fetch steps with blocks
    cursor.execute("SELECT id, step_order, title, command, description, blocks FROM note_steps WHERE note_id = ? ORDER BY step_order", (note_id,))
    steps = []
    import json
    for r in cursor.fetchall():
        step = dict(r)
        if step.get('blocks'):
            try:
                step['blocks'] = json.loads(step['blocks'])
            except:
                step['blocks'] = []
        else:
            step['blocks'] = []
        steps.append(step)
    
    steps_json = json.dumps(steps)
    note_dict = dict(note)
    
    cursor.execute("""
        INSERT INTO note_revisions (note_id, title, command, description, note_type, category_id, reference_links, steps, created_by, team_id, visibility)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        note_id,
        note_dict.get('title', ''),
        note_dict.get('command', ''),
        note_dict.get('description', ''),
        note_dict.get('note_type', 'command'),
        note_dict.get('category_id'),
        note_dict.get('reference_links', '[]'),
        steps_json,
        note_dict.get('created_by'),
        note_dict.get('team_id'),
        note_dict.get('visibility', 'global')
    ))

@app.route('/api/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    conn = get_db()
    try:
        data = request.json
        title = data.get('title', '').strip()
        note_type = data.get('note_type', 'command')
        command = data.get('command', '').strip()
        description = data.get('description', '')
        category_id = data.get('category_id')
        tags = data.get('tags', [])
        steps = data.get('steps', [])
        status = data.get('status', 'published').strip()
        is_autosave = data.get('is_autosave', False)

        if status not in ['published', 'draft']:
            status = 'published'

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        if status == 'published':
            if not title:
                return jsonify({'message': 'Title is required'}), 400
            if note_type == 'command' and not command:
                return jsonify({'message': 'Command is required for command notes'}), 400
            if note_type == 'procedure' and not steps:
                return jsonify({'message': 'At least one step is required for procedures'}), 400
            if note_type == 'plain' and not description:
                return jsonify({'message': 'Content is required for plain notes'}), 400
        else:
            if not title:
                title = "Untitled Note"

        user_role = request.user.get('role', 'author')
        is_creator = (note['created_by'] == request.user['sub'])
        
        if user_role not in ['admin', 'moderator'] and not is_creator:
            return jsonify({'message': 'Access denied'}), 403

        # Verify team edit permission (non-admins must belong to note's team)
        if user_role != 'admin' and note['team_id'] and int(note['team_id']) not in request.user.get('teams', []):
            return jsonify({'message': 'Access denied: Note belongs to another team'}), 403

        # Parse new team and visibility settings
        team_id = data.get('team_id')
        visibility = data.get('visibility', 'global').strip()
        if visibility not in ['team', 'global']:
            visibility = 'global'

        # Validate new team assignment
        if visibility == 'team':
            if not team_id:
                return jsonify({'message': 'Team assignment is required for team-only notes'}), 400
            if user_role != 'admin' and int(team_id) not in request.user.get('teams', []):
                return jsonify({'message': 'Access denied: You are not a member of the selected team'}), 403
        else:
            # If global, team_id is optional
            pass

        # Determine approval status on update
        if status == 'draft':
            approved = 0
        else:  # status == 'published'
            if user_role in ['admin', 'moderator']:
                approved = 1
            else:
                approved = 0

        reference_links = data.get('reference_links', [])
        import json
        ref_links_json = json.dumps(reference_links)

        # Log revision before editing if this is an explicit update (not autosave)
        if not is_autosave:
            _create_revision(cursor, note_id, note)

        cursor.execute("""
            UPDATE notes SET title=?, command=?, description=?, note_type=?,
            category_id=?, approved=?, updated_at=CURRENT_TIMESTAMP, reference_links=?, status=?, team_id=?, visibility=? WHERE id=?
        """, (title, command, description, note_type, category_id, approved, ref_links_json, status, team_id, visibility, note_id))

        if steps is not None:
            _save_steps(cursor, note_id, steps)

        cursor.execute("DELETE FROM note_tags WHERE note_id = ?", (note_id,))
        if tags:
            _link_tags_to_note(cursor, conn, note_id, tags)

        conn.commit()
        return jsonify({'message': 'Note updated successfully'})
    finally:
        conn.close()

@app.route('/api/notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        user_role = request.user.get('role', 'author')
        is_creator = (note['created_by'] == request.user['sub'])
        
        if user_role not in ['admin', 'moderator'] and not is_creator:
            return jsonify({'message': 'Permission denied'}), 403

        # Verify team delete permission (non-admins must belong to note's team)
        if user_role != 'admin' and note['team_id'] and int(note['team_id']) not in request.user.get('teams', []):
            return jsonify({'message': 'Access denied: Note belongs to another team'}), 403

        # Collect image files to delete from disk
        cursor.execute("SELECT filename FROM note_images WHERE note_id = ?", (note_id,))
        image_files = [r['filename'] for r in cursor.fetchall()]

        cursor.execute("DELETE FROM note_tags WHERE note_id = ?", (note_id,))
        cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        log_audit(conn, note_id, 'DELETED', request.user['username'], f"Note deleted: {note['title']}")
        conn.commit()

        # Remove image files from disk
        for fname in image_files:
            fpath = os.path.join(UPLOADS_DIR, fname)
            if os.path.exists(fpath):
                os.remove(fpath)

        return jsonify({'message': 'Note deleted successfully'})
    finally:
        conn.close()

@app.route('/api/notes/<int:note_id>/revisions', methods=['GET'])
@login_required
def get_note_revisions(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Note not found'}), 404
        
        cursor.execute("""
            SELECT r.id, r.note_id, r.title, r.command, r.description, r.note_type, r.category_id, r.reference_links, r.steps, r.created_at, r.created_by, u.username as created_by_username
            FROM note_revisions r
            LEFT JOIN users u ON r.created_by = u.id
            WHERE r.note_id = ?
            ORDER BY r.created_at DESC
        """, (note_id,))
        revisions = [dict(row) for row in cursor.fetchall()]
        import json
        for r in revisions:
            try:
                r['steps'] = json.loads(r['steps'])
            except:
                r['steps'] = []
        return jsonify(revisions)
    finally:
        conn.close()

@app.route('/api/notes/<int:note_id>/revisions/<int:rev_id>/restore', methods=['POST'])
@login_required
def restore_note_revision(note_id, rev_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        # Verify note and revision
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404
        
        cursor.execute("SELECT * FROM note_revisions WHERE id = ? AND note_id = ?", (rev_id, note_id))
        revision = cursor.fetchone()
        if not revision:
            return jsonify({'message': 'Revision not found'}), 404

        user_role = request.user.get('role', 'author')
        is_creator = (note['created_by'] == request.user['sub'])
        if user_role not in ['admin', 'moderator'] and not is_creator:
            return jsonify({'message': 'Permission denied'}), 403

        # Force re-approval if an author restores a note
        approved = note['approved']
        if user_role not in ['admin', 'moderator']:
            approved = 0

        # Before restoring, save the current state as a revision
        _create_revision(cursor, note_id, note)

        # Restore from revision
        import json
        cursor.execute("""
            UPDATE notes SET title=?, command=?, description=?, note_type=?, category_id=?, approved=?, updated_at=CURRENT_TIMESTAMP, reference_links=?
            WHERE id=?
        """, (
            revision['title'],
            revision['command'],
            revision['description'],
            revision['note_type'],
            revision['category_id'],
            approved,
            revision['reference_links'],
            note_id
        ))

        # Restore steps
        cursor.execute("DELETE FROM note_steps WHERE note_id = ?", (note_id,))
        steps = json.loads(revision['steps'])
        for i, step in enumerate(steps):
            blocks_json = json.dumps(step.get('blocks', []))
            cursor.execute("""
                INSERT INTO note_steps (note_id, step_order, title, command, description, blocks)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (note_id, i, step.get('title', ''), step.get('command', ''), step.get('description', ''), blocks_json))

        log_audit(conn, note_id, 'RESTORED', request.user['username'], f"Restored note to revision {rev_id}")
        conn.commit()
        return jsonify({'message': 'Revision restored successfully'})
    finally:
        conn.close()

# ================= IMAGES ================= #

@app.route('/api/notes/<int:note_id>/images', methods=['POST'])
@login_required
def upload_image(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Note not found'}), 404

        if 'file' not in request.files:
            return jsonify({'message': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'message': 'Invalid file format. Allowed: Images, PDF, Word, Excel, CSV, TXT'}), 400

        original_name = secure_filename(file.filename)
        ext = original_name.rsplit('.', 1)[1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"

        file.save(os.path.join(UPLOADS_DIR, unique_name))

        step_id = request.form.get('step_id')
        if step_id:
            try:
                step_id = int(step_id)
            except ValueError:
                step_id = None

        cursor.execute(
            "INSERT INTO note_images (note_id, step_id, filename, original_name) VALUES (?,?,?,?)",
            (note_id, step_id, unique_name, original_name)
        )
        conn.commit()
        image_id = cursor.lastrowid

        return jsonify({
            'id': image_id,
            'url': f'/uploads/{unique_name}',
            'name': original_name
        }), 201
    finally:
        conn.close()

@app.route('/api/images/<int:image_id>', methods=['DELETE'])
@login_required
def delete_image(image_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ni.id, ni.filename, n.created_by
            FROM note_images ni JOIN notes n ON n.id = ni.note_id
            WHERE ni.id = ?
        """, (image_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Image not found'}), 404

        if row['created_by'] != request.user['sub'] and request.user.get('role') != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        fpath = os.path.join(UPLOADS_DIR, row['filename'])
        cursor.execute("DELETE FROM note_images WHERE id = ?", (image_id,))
        conn.commit()

        if os.path.exists(fpath):
            os.remove(fpath)

        return jsonify({'message': 'Image deleted'})
    finally:
        conn.close()

# ================= BACKUP & RESTORE ================= #

@app.route('/api/backup', methods=['GET'])
def backup_db():
    token = request.args.get('token')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 401
    payload = decode_token(token)
    if isinstance(payload, str):
        return jsonify({'message': payload}), 401
    if payload.get('role') != 'admin':
        return jsonify({'message': 'Admin privilege required!'}), 403
    db_dir = os.path.dirname(DATABASE_PATH)
    filename = f"sysadmin_notes_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    return send_from_directory(db_dir, 'sysadmin_notes.db', as_attachment=True, download_name=filename)

@app.route('/api/restore', methods=['POST'])
@admin_required
def restore_db():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file and file.filename.endswith('.db'):
        temp_path = DATABASE_PATH + '.tmp'
        file.save(temp_path)
        try:
            # Verify SQLite integrity and format
            temp_conn = sqlite3.connect(temp_path)
            cursor = temp_conn.cursor()
            cursor.execute("PRAGMA integrity_check")
            check_result = cursor.fetchone()
            temp_conn.close()
            
            if not check_result or check_result[0] != 'ok':
                raise ValueError("Database integrity check failed")
                
            # Safely replace active database
            if os.path.exists(DATABASE_PATH):
                os.remove(DATABASE_PATH)
            os.rename(temp_path, DATABASE_PATH)
            return jsonify({'message': 'Database restored successfully'})
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({'message': f'Invalid database file or integrity check failed: {e}'}), 400
    return jsonify({'message': 'Invalid file type. Must be a .db file'}), 400

@app.route('/api/notes/<int:note_id>/approve', methods=['POST'])
@login_required
def approve_note(note_id):
    user_role = request.user.get('role', 'author')
    if user_role not in ['admin', 'moderator']:
        return jsonify({'message': 'Moderator or Admin privilege required!'}), 403
        
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'Note not found'}), 404
            
        cursor.execute("UPDATE notes SET approved = 1 WHERE id = ?", (note_id,))
        log_audit(conn, note_id, 'APPROVED', request.user['username'], "Note approved")
        conn.commit()
        return jsonify({'message': 'Note approved successfully'})
    finally:
        conn.close()

@app.route('/api/users/<int:user_id>/reset-password', methods=['POST'])
@admin_required
def admin_reset_password(user_id):
    conn = get_db()
    try:
        data = request.json
        new_password = data.get('password')
        if not new_password or not new_password.strip():
            return jsonify({'message': 'Password cannot be empty'}), 400

        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'message': msg}), 400
            
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'User not found'}), 404
            
        cursor.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (generate_password_hash(new_password), user_id)
        )
        conn.commit()
        return jsonify({'message': 'Password reset successfully'})
    finally:
        conn.close()

@app.after_request
def add_security_headers(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "connect-src 'self'"
    )
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    # Disable caching for all responses to prevent stale browser assets during dev/updates
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response


# ================= AUDIT LOGS ================= #

def log_audit(conn, note_id, action, username, details=""):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO audit_logs (note_id, action, username, details) VALUES (?, ?, ?, ?)",
        (note_id, action, username, details)
    )

@app.route('/api/audit', methods=['GET'])
@admin_required
def get_global_audit():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100")
        logs = [dict(row) for row in cursor.fetchall()]
        return jsonify(logs)
    finally:
        conn.close()

@app.route('/api/notes/<int:note_id>/audit', methods=['GET'])
@login_required
def get_note_audit(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs WHERE note_id = ? ORDER BY timestamp DESC", (note_id,))
        logs = [dict(row) for row in cursor.fetchall()]
        return jsonify(logs)
    finally:
        conn.close()

if __name__ == '__main__':
    ssl_context = ('cert.pem', 'key.pem') if os.path.exists('cert.pem') and os.path.exists('key.pem') else None
    app.run(host='0.0.0.0', port=5005, debug=False, ssl_context=ssl_context)
