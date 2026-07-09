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

import requests
import xml.etree.ElementTree as ET
import html
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

def check_ad_login(username, password):
    url = "https://10.250.7.210/sso/adloginwithRoles.asmx"
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

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'}

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

# Serve Frontend SPA
@app.route('/')
def serve_index():
    return render_template('index.html', base_url=get_base_url())

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
            " u.username as created_by_username, n.approved"
            " FROM notes n"
            " LEFT JOIN categories c ON n.category_id = c.id"
            " LEFT JOIN users u ON n.created_by = u.id"
            " WHERE n.id = ?"
        )
        cursor.execute(sql, (note_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Note not found"}), 404
        note = dict(row)

        # Check authorization if note is not approved
        if not note.get('approved'):
            current_user_id = None
            current_role = None
            token = request.headers.get('Authorization')
            if token:
                if token.startswith('Bearer '):
                    token = token[7:]
                payload = decode_token(token)
                if not isinstance(payload, str):
                    current_user_id = payload.get('sub')
                    current_role = payload.get('role')
            
            if current_role not in ['admin', 'moderator'] and current_user_id != note['created_by']:
                return jsonify({"message": "Access denied"}), 403
        cursor.execute(
            "SELECT t.name FROM tags t"
            " JOIN note_tags nt ON nt.tag_id = t.id"
            " WHERE nt.note_id = ?",
            (note_id,)
        )
        note["tags"] = [r["name"] for r in cursor.fetchall()]
        cursor.execute(
            "SELECT id, step_order, title, command, description"
            " FROM note_steps WHERE note_id = ? ORDER BY step_order",
            (note_id,)
        )
        steps = [dict(r) for r in cursor.fetchall()]
        for step in steps:
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
        login_type = data.get('login_type', 'ad') # 'ad' or 'local'

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND auth_type = ?", (username, login_type))
        user = cursor.fetchone()

        if not user or not password:
            return jsonify({'message': 'Invalid credentials'}), 401

        if login_type == 'ad':
            loginFlg, ADName = check_ad_login(username, password)
            if loginFlg == 'SUCCESS':
                token = generate_token(user['id'], user['username'], user['role'])
                return jsonify({'token': token, 'role': user['role'], 'username': user['username'], 'display_name': ADName})
            else:
                return jsonify({'message': 'Active Directory Authentication Failed'}), 401
        else:
            if check_password_hash(user['password_hash'], password):
                token = generate_token(user['id'], user['username'], user['role'])
                return jsonify({'token': token, 'role': user['role'], 'username': user['username']})
            else:
                return jsonify({'message': 'Invalid credentials'}), 401
    finally:
        conn.close()

# ================= USERS (ADMIN ONLY) ================= #

@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, role, auth_type FROM users")
        users = [dict(row) for row in cursor.fetchall()]
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
            pwd_hash = generate_password_hash(password)

        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (username, password_hash, role, auth_type) VALUES (?, ?, ?, ?)",
                           (username, pwd_hash, role, auth_type))
            conn.commit()
            return jsonify({'message': 'User created successfully', 'id': cursor.lastrowid}), 201
        except sqlite3.IntegrityError:
            return jsonify({'message': 'Username already exists'}), 400
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
@admin_required
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
@admin_required
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

@app.route('/api/categories/<int:cat_id>/toggle', methods=['PUT'])
@admin_required
def toggle_category(cat_id):
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
        SELECT id, step_order, title, command, description
        FROM note_steps WHERE note_id = ?
        ORDER BY step_order
    """, (note_id,))
    steps = [dict(row) for row in cursor.fetchall()]
    for step in steps:
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
    cursor.execute("DELETE FROM note_steps WHERE note_id = ?", (note_id,))
    for i, step in enumerate(steps):
        cursor.execute(
            "INSERT INTO note_steps (note_id, step_order, title, command, description) VALUES (?,?,?,?,?)",
            (note_id, i, step.get('title', ''), step.get('command', ''), step.get('description', ''))
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
        status = request.args.get('status', '').strip()

        cursor = conn.cursor()

        base_select = """
            SELECT DISTINCT n.id, n.title, n.command, n.description, n.note_type,
                   n.category_id, c.name as category_name,
                   n.created_at, n.updated_at, n.created_by,
                   u.username as created_by_username, n.approved
            FROM notes n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.created_by = u.id
            LEFT JOIN note_tags nt ON nt.note_id = n.id
            LEFT JOIN tags tg ON tg.id = nt.tag_id
            LEFT JOIN note_steps ns ON ns.note_id = n.id
        """

        conditions = []
        params = []

        if query:
            terms = query.split()
            for term in terms:
                term_pattern = f"%{term.lower()}%"
                conditions.append(
                    """(
                        LOWER(n.title) LIKE ? OR 
                        LOWER(n.description) LIKE ? OR 
                        LOWER(n.command) LIKE ? OR 
                        LOWER(c.name) LIKE ? OR 
                        LOWER(tg.name) LIKE ? OR 
                        LOWER(ns.title) LIKE ? OR 
                        LOWER(ns.command) LIKE ? OR 
                        LOWER(ns.description) LIKE ?
                    )"""
                )
                params.extend([term_pattern] * 8)

        if category:
            conditions.append("c.id = ?")
            params.append(category)

        if tag:
            conditions.append("tg.name = ?")
            params.append(tag)

        # Separate approved from pending notes
        if status == 'pending':
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'message': 'Token is missing!'}), 401
            if token.startswith('Bearer '):
                token = token[7:]
            payload = decode_token(token)
            if isinstance(payload, str):
                return jsonify({'message': 'Invalid token!'}), 401
            
            user_id = payload.get('sub')
            user_role = payload.get('role', 'author')
            
            if user_role in ['admin', 'moderator']:
                conditions.append("n.approved = 0")
            else:
                conditions.append("n.approved = 0 AND n.created_by = ?")
                params.append(user_id)
        else:
            conditions.append("n.approved = 1")

        sql = base_select
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " ORDER BY n.created_at DESC"

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        notes = []
        for row in rows:
            note = dict(row)
            note['tags'] = _get_tags_for_note(cursor, note['id'])
            note_type = note.get('note_type', 'command')
            if note_type == 'procedure':
                note['steps'] = _get_steps_for_note(cursor, note['id'])
                note['images'] = _get_note_images(cursor, note['id'])
            else:
                note['steps'] = []
                note['images'] = _get_note_images(cursor, note['id'])
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

        if not title:
            return jsonify({'message': 'Title is required'}), 400
        if note_type == 'command' and not command:
            return jsonify({'message': 'Command is required for command notes'}), 400
        if note_type == 'procedure' and not steps:
            return jsonify({'message': 'At least one step is required for procedures'}), 400
        if note_type == 'plain' and not description:
            return jsonify({'message': 'Content is required for plain notes'}), 400

        user_role = request.user.get('role', 'author')
        approved = 1 if user_role in ['admin', 'moderator'] else 0

        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO notes (title, command, description, note_type, category_id, created_by, approved) VALUES (?,?,?,?,?,?,?)",
            (title, command, description, note_type, category_id, request.user['sub'], approved)
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

        if not title:
            return jsonify({'message': 'Title is required'}), 400

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        user_role = request.user.get('role', 'author')
        is_creator = (note['created_by'] == request.user['sub'])
        
        if user_role not in ['admin', 'moderator'] and not is_creator:
            return jsonify({'message': 'Access denied'}), 403

        # Force re-approval if an author edits their note
        approved = note['approved']
        if user_role not in ['admin', 'moderator']:
            approved = 0

        cursor.execute("""
            UPDATE notes SET title=?, command=?, description=?, note_type=?,
            category_id=?, approved=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
        """, (title, command, description, note_type, category_id, approved, note_id))

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
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)

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
def get_note_audit(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs WHERE note_id = ? ORDER BY timestamp DESC", (note_id,))
        logs = [dict(row) for row in cursor.fetchall()]
        return jsonify(logs)
    finally:
        conn.close()

