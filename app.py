from flask import Flask, request, jsonify, send_from_directory
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

# Load environment variables from .env if present
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
# Use environment variable for secret key, with a development fallback
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'sysadmin-super-secret-key-change-this-in-production-2024')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max upload

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}

def allowed_image(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

# Ensure database is always initialized (creates tables if they don't exist)
init_db()

# Start daily backup service (runs in a daemon thread)
if not os.environ.get('TESTING'):
    start_backup_service('sysadmin_notes.db')

# Serve Frontend SPA
@app.route('/')
def serve_index():
    return send_from_directory('templates', 'index.html')

# Serve uploaded images
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOADS_DIR, filename)

# Note detail page
@app.route('/note/<int:note_id>')
def note_detail_page(note_id):
    from flask import render_template
    return render_template('note_detail.html', note_id=note_id)

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
            " u.username as created_by_username"
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

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if user and password and check_password_hash(user['password_hash'], password):
            token = generate_token(user['id'], user['username'], user['role'])
            return jsonify({'token': token, 'role': user['role'], 'username': user['username']})

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
        cursor.execute("SELECT id, username, role FROM users")
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
        role = data.get('role', 'user')

        if not username or not password:
            return jsonify({'message': 'Username and password required'}), 400

        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                           (username, generate_password_hash(password), role))
            conn.commit()
            return jsonify({'message': 'User created successfully'}), 201
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

@app.route('/api/notes', methods=['GET'])
def get_notes():
    conn = get_db()
    try:
        query = request.args.get('q', '').strip()
        category = request.args.get('category', '').strip()
        tag = request.args.get('tag', '').strip()

        cursor = conn.cursor()

        base_select = """
            SELECT n.id, n.title, n.command, n.description, n.note_type,
                   n.category_id, c.name as category_name,
                   n.created_at, n.updated_at, n.created_by,
                   u.username as created_by_username
            FROM notes n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.created_by = u.id
        """

        conditions = []
        params = []

        if query:
            safe_query = _sanitize_fts_query(query)
            if safe_query:
                base_select = """
                    SELECT n.id, n.title, n.command, n.description, n.note_type,
                           n.category_id, c.name as category_name,
                           n.created_at, n.updated_at, n.created_by,
                           u.username as created_by_username
                    FROM notes_fts f
                    JOIN notes n ON f.rowid = n.id
                    LEFT JOIN categories c ON n.category_id = c.id
                    LEFT JOIN users u ON n.created_by = u.id
                """
                conditions.append("notes_fts MATCH ?")
                params.append(safe_query)

        if category:
            conditions.append("c.id = ?")
            params.append(category)

        if tag:
            base_select += " JOIN note_tags nt ON nt.note_id = n.id JOIN tags t ON t.id = nt.tag_id"
            conditions.append("t.name = ?")
            params.append(tag)

        sql = base_select
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " ORDER BY rank" if query else " ORDER BY n.created_at DESC"

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

        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO notes (title, command, description, note_type, category_id, created_by) VALUES (?,?,?,?,?,?)",
            (title, command, description, note_type, category_id, request.user['sub'])
        )
        note_id = cursor.lastrowid

        if steps:
            _save_steps(cursor, note_id, steps)

        if tags:
            _link_tags_to_note(cursor, conn, note_id, tags)

        conn.commit()
        return jsonify({'message': 'Note created', 'id': note_id}), 201
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

        cursor.execute("""
            UPDATE notes SET title=?, command=?, description=?, note_type=?,
            category_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
        """, (title, command, description, note_type, category_id, note_id))

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

        if note['created_by'] != request.user['sub'] and request.user.get('role') != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        # Collect image files to delete from disk
        cursor.execute("SELECT filename FROM note_images WHERE note_id = ?", (note_id,))
        image_files = [r['filename'] for r in cursor.fetchall()]

        cursor.execute("DELETE FROM note_tags WHERE note_id = ?", (note_id,))
        cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
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

        if not allowed_image(file.filename):
            return jsonify({'message': 'Invalid image format. Allowed: PNG, JPG, GIF, WebP, BMP'}), 400

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
        file.save(DATABASE_PATH)
        return jsonify({'message': 'Database restored successfully'})
    return jsonify({'message': 'Invalid file type. Must be a .db file'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, debug=True)
