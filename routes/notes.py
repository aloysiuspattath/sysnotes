import os
import json
import re
import uuid
from flask import Blueprint, request, jsonify, make_response
from werkzeug.utils import secure_filename
from db_helper import get_db, allowed_file, log_audit
from auth import login_required, decode_token
from database import UPLOADS_DIR
from cache_helper import clear_note_caches

notes_bp = Blueprint('notes', __name__)

# ================= HELPER FUNCTIONS ================= #

def _sanitize_fts_query(query):
    sanitized = re.sub(r'[^\w\s\-._]', ' ', query)
    words = sanitized.split()
    if not words:
        return None
    return ' '.join(f'"{w}"*' for w in words)

def _can_user_view_note(note, user):
    """Check whether a user payload has permission to view the specified note."""
    if not note:
        return False
    if not user:
        return note.get('status') == 'published' and note.get('approved') == 1 and note.get('visibility') == 'global'
    user_id = user.get('sub')
    role = user.get('role')
    teams = user.get('teams', [])
    if role == 'admin':
        return True
    is_creator = (user_id == note.get('created_by'))
    is_moderator = (role == 'moderator')
    if note.get('status') == 'draft' and not is_creator:
        return False
    if not note.get('approved') and not is_creator and not is_moderator:
        return False
    is_global = (note.get('visibility') == 'global')
    has_team_access = (note.get('team_id') in teams)
    if not is_global and not has_team_access:
        return False
    return True

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
    if not steps:
        return []

    cursor.execute("""
        SELECT id, step_id, filename, original_name FROM note_images
        WHERE note_id = ? AND step_id IS NOT NULL ORDER BY id
    """, (note_id,))
    images_by_step = {}
    for r in cursor.fetchall():
        images_by_step.setdefault(r['step_id'], []).append(
            {'id': r['id'], 'url': f'/uploads/{r["filename"]}', 'name': r['original_name']}
        )

    for step in steps:
        if step.get('blocks'):
            try:
                step['blocks'] = json.loads(step['blocks'])
            except:
                step['blocks'] = []
        else:
            step['blocks'] = []
        step['images'] = images_by_step.get(step['id'], [])
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
        blocks_json = json.dumps(step.get('blocks', []))
        cursor.execute(
            "INSERT INTO note_steps (note_id, step_order, title, command, description, blocks) VALUES (?,?,?,?,?,?)",
            (note_id, i, step.get('title', ''), step.get('command', ''), step.get('description', ''), blocks_json)
        )

def _create_revision(cursor, note_id, note):
    # Fetch steps with blocks
    cursor.execute("SELECT id, step_order, title, command, description, blocks FROM note_steps WHERE note_id = ? ORDER BY step_order", (note_id,))
    steps = []
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


# ================= ROUTES ================= #

@notes_bp.route('/api/notes', methods=['GET'])
def get_notes():
    conn = get_db()
    try:
        query = request.args.get('q', '').strip()
        category = request.args.get('category', '').strip()
        tag = request.args.get('tag', '').strip()
        team_filter = request.args.get('team', '').strip()
        status = request.args.get('status', '').strip()
        favorite_only = request.args.get('favorite', '').strip().lower() == 'true'

        page = max(1, request.args.get('page', 1, type=int) or 1)
        limit = max(1, min(100, request.args.get('limit', 15, type=int) or 15))
        offset = (page - 1) * limit

        cursor = conn.cursor()

        base_select = """
            SELECT n.id, n.title, n.command, n.description, n.note_type,
                   n.category_id, c.name as category_name,
                   n.created_at, n.updated_at, n.created_by, n.reference_links,
                   u.username as created_by_username, n.approved, n.status,
                   n.team_id, n.visibility, tm.name as team_name, n.is_pinned,
                   (SELECT COUNT(*) FROM note_steps WHERE note_id = n.id) as step_count
            FROM notes n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.created_by = u.id
            LEFT JOIN teams tm ON n.team_id = tm.id
        """
        conditions = []
        params = []

        if query:
            fts_q = _sanitize_fts_query(query)
            if fts_q:
                conditions.append("n.id IN (SELECT rowid FROM notes_fts WHERE notes_fts MATCH ?)")
                params.append(fts_q)
            else:
                search_pattern = f"%{query}%"
                conditions.append("(n.title LIKE ? OR n.command LIKE ? OR n.description LIKE ?)")
                params.extend([search_pattern, search_pattern, search_pattern])

        if category:
            conditions.append("(c.id = ? OR c.parent_id = ?)")
            params.extend([category, category])

        if tag:
            base_select += " LEFT JOIN note_tags nt ON nt.note_id = n.id LEFT JOIN tags tg ON tg.id = nt.tag_id"
            conditions.append("tg.name = ?")
            params.append(tag)

        if team_filter:
            if team_filter.isdigit():
                conditions.append("(n.team_id = ? OR n.visibility = 'global')")
                params.append(int(team_filter))
            else:
                conditions.append("(n.team_id IN (SELECT id FROM teams WHERE LOWER(name) = ?) OR n.visibility = 'global')")
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
        elif status == 'my_notes':
            if not user_id:
                return jsonify({'message': 'Authentication required!'}), 401
            conditions.append("n.created_by = ? AND n.status = 'published'")
            params.append(user_id)
        elif status == 'rejected':
            if not user_id:
                return jsonify({'message': 'Authentication required!'}), 401
            if user_role in ['admin', 'moderator']:
                conditions.append("n.approved = -1")
            else:
                conditions.append("n.approved = -1 AND n.created_by = ?")
                params.append(user_id)
        else:
            conditions.append("n.approved = 1 AND n.status = 'published'")

        # Enforce team isolation for non-drafts, non-my-notes, non-rejected
        if status not in ['draft', 'my_notes', 'rejected'] and user_role != 'admin':
            if user_team_ids:
                placeholders = ','.join('?' for _ in user_team_ids)
                conditions.append(f"(n.visibility = 'global' OR n.team_id IN ({placeholders}))")
                params.extend(user_team_ids)
            else:
                conditions.append("n.visibility = 'global'")

        if favorite_only:
            if not user_id:
                return jsonify({'message': 'Authentication required!'}), 401
            conditions.append("n.id IN (SELECT note_id FROM user_favorites WHERE user_id = ?)")
            params.append(user_id)

        sql = base_select
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " ORDER BY n.is_pinned DESC, n.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # Fetch user's favorited note IDs
        fav_note_ids = set()
        if user_id:
            cursor.execute("SELECT note_id FROM user_favorites WHERE user_id = ?", (user_id,))
            fav_note_ids = {r['note_id'] for r in cursor.fetchall()}

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
            note['is_favorite'] = note['id'] in fav_note_ids
            notes.append(note)

        return jsonify(notes)
    finally:
        conn.close()

@notes_bp.route('/api/notes', methods=['POST'])
@login_required
def create_note():
    conn = get_db()
    try:
        data = request.get_json(silent=True) or {}
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

        log_detail = "Note created (Draft)" if status == 'draft' else f"Note created (approved={bool(approved)})"
        log_audit(conn, note_id, 'CREATED', request.user['username'], log_detail)
        conn.commit()
        clear_note_caches()
        message = 'Note created' if approved == 1 else 'Note created and is pending approval'
        return jsonify({'message': message, 'id': note_id, 'approved': bool(approved)}), 201
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>', methods=['GET'])
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

        note["tags"] = _get_tags_for_note(cursor, note_id)
        note["steps"] = _get_steps_for_note(cursor, note_id)
        note["images"] = _get_note_images(cursor, note_id)

        # Log access and fetch favorite status for logged-in users
        if current_user_id:
            cursor.execute("SELECT 1 FROM user_note_access WHERE user_id = ? AND note_id = ?", (current_user_id, note_id))
            if cursor.fetchone():
                cursor.execute(
                    "UPDATE user_note_access SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP "
                    "WHERE user_id = ? AND note_id = ?",
                    (current_user_id, note_id)
                )
            else:
                cursor.execute(
                    "INSERT INTO user_note_access (user_id, note_id, access_count) VALUES (?, ?, 1)",
                    (current_user_id, note_id)
                )
            conn.commit()

            cursor.execute("SELECT 1 FROM user_favorites WHERE user_id = ? AND note_id = ?", (current_user_id, note_id))
            note["is_favorite"] = bool(cursor.fetchone())
        else:
            note["is_favorite"] = False

        return jsonify(note)
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    conn = get_db()
    try:
        data = request.get_json(silent=True) or {}
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

        # Determine approval status on update
        if status == 'draft':
            approved = 0
        else:  # status == 'published'
            if user_role in ['admin', 'moderator']:
                approved = 1
            else:
                approved = 0

        reference_links = data.get('reference_links', [])
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

        if not is_autosave:
            log_detail = f"Note updated (approved={bool(approved)})" if status != 'draft' else "Note updated (Draft)"
            log_audit(conn, note_id, 'UPDATED', request.user['username'], log_detail)

        conn.commit()
        clear_note_caches()
        return jsonify({'message': 'Note updated successfully'})
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>', methods=['DELETE'])
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
        clear_note_caches()

        # Remove image files from disk
        for fname in image_files:
            fpath = os.path.join(UPLOADS_DIR, fname)
            if os.path.exists(fpath):
                os.remove(fpath)

        return jsonify({'message': 'Note deleted successfully'})
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>/revisions', methods=['GET'])
@login_required
def get_note_revisions(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404
        
        if not _can_user_view_note(dict(note), request.user):
            return jsonify({'message': 'Access denied'}), 403
        
        cursor.execute("""
            SELECT r.id, r.note_id, r.title, r.command, r.description, r.note_type, r.category_id, r.reference_links, r.steps, r.created_at, r.created_by, u.username as created_by_username
            FROM note_revisions r
            LEFT JOIN users u ON r.created_by = u.id
            WHERE r.note_id = ?
            ORDER BY r.created_at DESC
        """, (note_id,))
        revisions = [dict(row) for row in cursor.fetchall()]
        for r in revisions:
            try:
                r['steps'] = json.loads(r['steps'])
            except:
                r['steps'] = []
        return jsonify(revisions)
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>/revisions/<int:rev_id>/restore', methods=['POST'])
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
        clear_note_caches()
        return jsonify({'message': 'Revision restored successfully'})
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>/images', methods=['POST'])
@login_required
def upload_image(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, created_by, team_id, visibility FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        user_role = request.user.get('role')
        user_id = request.user.get('sub')
        if user_role not in ['admin', 'moderator'] and user_id != note['created_by']:
            return jsonify({'message': 'Permission denied: Cannot add attachments to this note'}), 403

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

@notes_bp.route('/api/images/<int:image_id>', methods=['DELETE'])
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

@notes_bp.route('/api/notes/<int:note_id>/approve', methods=['POST'])
@login_required
def approve_note(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT approved, visibility, team_id FROM notes WHERE id = ?", (note_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Note not found'}), 404

        user_role = request.user.get('role')
        if user_role not in ['admin', 'moderator']:
            return jsonify({'message': 'Permission denied'}), 403
            
        cursor.execute("UPDATE notes SET approved = 1 WHERE id = ?", (note_id,))
        log_audit(conn, note_id, 'APPROVED', request.user['username'], "Note approved")
        conn.commit()
        clear_note_caches()
        return jsonify({'message': 'Note approved successfully'})
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>/reject', methods=['POST'])
@login_required
def reject_note(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT approved, title FROM notes WHERE id = ?", (note_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Note not found'}), 404

        user_role = request.user.get('role')
        if user_role not in ['admin', 'moderator']:
            return jsonify({'message': 'Permission denied'}), 403

        data = request.json or {}
        reason = data.get('reason', '').strip() or 'Note does not meet guidelines'
            
        cursor.execute("UPDATE notes SET approved = -1 WHERE id = ?", (note_id,))
        log_audit(conn, note_id, 'REJECTED', request.user['username'], f"Note rejected: {reason}")
        conn.commit()
        clear_note_caches()
        return jsonify({'message': 'Note rejected successfully'})
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>/favorite', methods=['POST'])
@login_required
def toggle_favorite(note_id):
    conn = get_db()
    try:
        user_id = request.user['sub']
        cursor = conn.cursor()
        
        # Check if note exists
        cursor.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
        if not cursor.fetchone():
            return jsonify({"message": "Note not found"}), 404

        cursor.execute("SELECT 1 FROM user_favorites WHERE user_id = ? AND note_id = ?", (user_id, note_id))
        row = cursor.fetchone()
        if row:
            cursor.execute("DELETE FROM user_favorites WHERE user_id = ? AND note_id = ?", (user_id, note_id))
            is_favorite = False
        else:
            cursor.execute("INSERT INTO user_favorites (user_id, note_id) VALUES (?, ?)", (user_id, note_id))
            is_favorite = True
        
        conn.commit()
        return jsonify({"is_favorite": is_favorite})
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>/pin', methods=['POST'])
@login_required
def toggle_pin_note(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, created_by, is_pinned FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        user_role = request.user.get('role')
        user_id = request.user['sub']
        if user_role not in ['admin', 'moderator'] and note['created_by'] != user_id:
            return jsonify({'message': 'Permission denied'}), 403

        new_pinned = 0 if note['is_pinned'] else 1
        cursor.execute("UPDATE notes SET is_pinned = ? WHERE id = ?", (new_pinned, note_id))
        conn.commit()
        clear_note_caches()
        return jsonify({'is_pinned': bool(new_pinned)})
    finally:
        conn.close()

@notes_bp.route('/api/notes/frequent', methods=['GET'])
@login_required
def get_frequent_notes():
    conn = get_db()
    try:
        user_id = request.user['sub']
        cursor = conn.cursor()
        
        sql = (
            "SELECT n.id, n.title, n.note_type, a.access_count "
            "FROM user_note_access a "
            "JOIN notes n ON a.note_id = n.id "
            "WHERE a.user_id = ? AND n.status = 'published' AND n.approved = 1 "
            "ORDER BY a.access_count DESC, a.last_accessed DESC LIMIT 5"
        )
        cursor.execute(sql, (user_id,))
        rows = cursor.fetchall()
        return jsonify([dict(r) for r in rows])
    finally:
        conn.close()

@notes_bp.route('/api/notes/<int:note_id>/export', methods=['GET'])
@login_required
def export_note_markdown(note_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT n.*, c.name as category_name, u.username as author_name, tm.name as team_name
            FROM notes n
            LEFT JOIN categories c ON n.category_id = c.id
            LEFT JOIN users u ON n.created_by = u.id
            LEFT JOIN teams tm ON n.team_id = tm.id
            WHERE n.id = ?
        """, (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404

        if not _can_user_view_note(dict(note), request.user):
            return jsonify({'message': 'Access denied'}), 403

        tags = _get_tags_for_note(cursor, note_id)
        
        cursor.execute("SELECT * FROM note_steps WHERE note_id = ? ORDER BY step_order ASC", (note_id,))
        steps = [dict(r) for r in cursor.fetchall()]

        # Format Markdown content
        md = f"# {note['title']}\n\n"
        md += f"- **Category**: {note['category_name'] or 'Uncategorized'}\n"
        md += f"- **Author**: {note['author_name'] or 'Unknown'}\n"
        md += f"- **Type**: {note['note_type'].capitalize()}\n"
        if tags:
            md += f"- **Tags**: {', '.join(tags)}\n"
        if note['team_name']:
            md += f"- **Team**: {note['team_name']}\n"
        md += f"- **Date**: {note['created_at']}\n\n"

        if note['command']:
            md += f"## Command / Code\n```\n{note['command']}\n```\n\n"

        if note['description']:
            md += f"## Description\n{note['description']}\n\n"

        if steps:
            md += "## Procedure Steps\n\n"
            for i, s in enumerate(steps, 1):
                md += f"### Step {i}: {s.get('title') or 'Step'}\n"
                if s.get('command'):
                    md += f"```\n{s.get('command')}\n```\n"
                if s.get('description'):
                    md += f"{s.get('description')}\n"
                md += "\n"

        clean_title = re.sub(r'[^a-zA-Z0-9_-]', '_', note['title']).lower()
        response = make_response(md)
        response.headers["Content-Disposition"] = f"attachment; filename={clean_title}.md"
        response.headers["Content-Type"] = "text/markdown; charset=utf-8"
        return response
    finally:
        conn.close()

