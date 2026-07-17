import os
import secrets
import sqlite3
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash
from db_helper import get_db, allowed_file, DATABASE_PATH
from auth import admin_required, login_required
from routes.auth import validate_password
from database import get_user_teams, get_all_teams, create_team, delete_team

admin_bp = Blueprint('admin', __name__)

def admin_or_moderator_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or request.user is None:
            return jsonify({'message': 'Authentication required'}), 401
        if request.user.get('role') not in ['admin', 'moderator']:
            return jsonify({'message': 'Admin or Moderator privileges required'}), 403
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/api/health', methods=['GET'])
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

@admin_bp.route('/api/users', methods=['GET'])
@admin_required
def get_users():
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

@admin_bp.route('/api/users', methods=['POST'])
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

@admin_bp.route('/api/users/<int:user_id>', methods=['PUT'])
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

@admin_bp.route('/api/users/<int:user_id>/role', methods=['PUT'])
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

@admin_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
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

# ================= TEAMS ================= #

@admin_bp.route('/api/admin/teams', methods=['GET'])
@login_required
def get_teams_list():
    try:
        teams = get_all_teams()
        return jsonify(teams)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api/admin/teams', methods=['POST'])
@admin_required
def create_new_team():
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

@admin_bp.route('/api/admin/teams/<int:team_id>', methods=['DELETE'])
@admin_required
def remove_team(team_id):
    try:
        delete_team(team_id)
        return jsonify({'message': 'Team deleted successfully'})
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# ================= SETTINGS ================= #

@admin_bp.route('/api/settings', methods=['GET'])
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

@admin_bp.route('/api/settings', methods=['POST'])
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

@admin_bp.route('/api/categories', methods=['GET'])
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

@admin_bp.route('/api/categories', methods=['POST'])
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

@admin_bp.route('/api/categories/<int:cat_id>', methods=['DELETE'])
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

@admin_bp.route('/api/categories/<int:cat_id>', methods=['PUT'])
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

@admin_bp.route('/api/tags', methods=['GET'])
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

@admin_bp.route('/api/stats', methods=['GET'])
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

@admin_bp.route('/api/last_updated', methods=['GET'])
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

# ================= BACKUP & RESTORE ================= #

@admin_bp.route('/api/backup', methods=['GET'])
def backup_db():
    from auth import decode_token
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

@admin_bp.route('/api/restore', methods=['POST'])
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

# ================= AUDIT LOGS ================= #

@admin_bp.route('/api/audit', methods=['GET'])
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

@admin_bp.route('/api/notes/<int:note_id>/audit', methods=['GET'])
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
