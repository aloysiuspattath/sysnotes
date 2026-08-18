import os
import sys
import time
import shutil
import secrets
import sqlite3
import io
import csv
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory, make_response
from werkzeug.security import generate_password_hash
from db_helper import get_db, allowed_file, DATABASE_PATH
from auth import admin_required, login_required
from routes.auth import validate_password
from database import get_user_teams, get_all_teams, create_team, delete_team
from cache_helper import settings_cache, categories_cache, tags_cache, stats_cache, activity_cache, clear_note_caches

admin_bp = Blueprint('admin', __name__)

server_start_time = time.time()

def get_system_metrics():
    metrics = {
        'uptime_seconds': int(time.time() - server_start_time),
        'cpu_percent': 0.0,
        'memory_total_mb': 0,
        'memory_used_mb': 0,
        'memory_free_mb': 0,
        'memory_percent': 0.0,
        'disk_total_gb': 0.0,
        'disk_used_gb': 0.0,
        'disk_free_gb': 0.0,
        'disk_percent': 0.0,
    }
    
    # Disk space metrics (cross-platform)
    try:
        total, used, free = shutil.disk_usage('.')
        metrics['disk_total_gb'] = round(total / (1024**3), 1)
        metrics['disk_used_gb'] = round(used / (1024**3), 1)
        metrics['disk_free_gb'] = round(free / (1024**3), 1)
        metrics['disk_percent'] = round((used / total) * 100, 1) if total > 0 else 0.0
    except:
        pass

    # Memory and CPU metrics
    if sys.platform == 'win32':
        try:
            import ctypes
            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ('dwLength', ctypes.c_ulong),
                    ('dwMemoryLoad', ctypes.c_ulong),
                    ('ullTotalPhys', ctypes.c_ulonglong),
                    ('ullAvailPhys', ctypes.c_ulonglong),
                    ('ullTotalPageFile', ctypes.c_ulonglong),
                    ('ullAvailPageFile', ctypes.c_ulonglong),
                    ('ullTotalVirtual', ctypes.c_ulonglong),
                    ('ullAvailVirtual', ctypes.c_ulonglong),
                    ('ullAvailExtendedVirtual', ctypes.c_ulonglong),
                ]
            stat = MEMORYSTATUSEX()
            stat.dwLength = ctypes.sizeof(stat)
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
            metrics['memory_total_mb'] = int(stat.ullTotalPhys / (1024**2))
            metrics['memory_free_mb'] = int(stat.ullAvailPhys / (1024**2))
            metrics['memory_used_mb'] = metrics['memory_total_mb'] - metrics['memory_free_mb']
            metrics['memory_percent'] = float(stat.dwMemoryLoad)
            
            # CPU Load query
            class FILETIME(ctypes.Structure):
                _fields_ = [("dwLowDateTime", ctypes.c_uint), ("dwHighDateTime", ctypes.c_uint)]
            idle = FILETIME()
            kernel = FILETIME()
            user = FILETIME()
            if ctypes.windll.kernel32.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user)):
                def to_int(ft): return (ft.dwHighDateTime << 32) + ft.dwLowDateTime
                idle_start, kernel_start, user_start = to_int(idle), to_int(kernel), to_int(user)
                time.sleep(0.05)
                ctypes.windll.kernel32.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel), ctypes.byref(user))
                idle_end, kernel_end, user_end = to_int(idle), to_int(kernel), to_int(user)
                
                idle_delta = idle_end - idle_start
                kernel_delta = kernel_end - kernel_start
                user_delta = user_end - user_start
                system_delta = kernel_delta + user_delta
                
                if system_delta > 0:
                    metrics['cpu_percent'] = round(((system_delta - idle_delta) / system_delta) * 100, 1)
        except:
            pass
    else:
        # Linux load metrics
        try:
            if os.path.exists('/proc/meminfo'):
                mem = {}
                with open('/proc/meminfo', 'r') as f:
                    for line in f:
                        parts = line.split()
                        if len(parts) >= 2:
                            mem[parts[0].rstrip(':')] = int(parts[1])
                total = mem.get('MemTotal', 0) * 1024
                free = mem.get('MemFree', 0) * 1024
                cached = mem.get('Cached', 0) * 1024
                buffers = mem.get('Buffers', 0) * 1024
                available = free + cached + buffers
                used = total - available
                metrics['memory_total_mb'] = int(total / (1024**2))
                metrics['memory_used_mb'] = int(used / (1024**2))
                metrics['memory_free_mb'] = int(available / (1024**2))
                metrics['memory_percent'] = round((used / total) * 100, 1) if total > 0 else 0.0
            
            if hasattr(os, 'getloadavg'):
                metrics['cpu_percent'] = round(os.getloadavg()[0] * 10, 1)
        except:
            pass
            
    return metrics

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
        cursor.execute("""
            SELECT u.id, u.username, u.role, u.auth_type,
                   (SELECT COUNT(*) FROM notes WHERE created_by = u.id) as total_note_count,
                   (SELECT COUNT(*) FROM notes WHERE created_by = u.id AND approved = 1 AND status = 'published') as published_note_count
            FROM users u
            ORDER BY u.id ASC
        """)
        users = [dict(row) for row in cursor.fetchall()]
        cursor.execute("""
            SELECT ut.user_id, t.id, t.name, t.description
            FROM user_teams ut
            JOIN teams t ON ut.team_id = t.id
        """)
        teams_map = {}
        for r in cursor.fetchall():
            teams_map.setdefault(r['user_id'], []).append({
                'id': r['id'], 'name': r['name'], 'description': r['description']
            })
        for u in users:
            u['teams'] = teams_map.get(u['id'], [])
        return jsonify(users)
    finally:
        conn.close()

@admin_bp.route('/api/users', methods=['POST'])
@admin_required
def create_user():
    conn = get_db()
    try:
        data = request.get_json(silent=True) or {}
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
        data = request.get_json(silent=True) or {}
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

        data = request.get_json(silent=True) or {}
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

        return jsonify({'message': 'User role updated successfully'})
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
@admin_required
def list_teams():
    try:
        teams = get_all_teams()
        return jsonify(teams)
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@admin_bp.route('/api/admin/teams', methods=['POST'])
@admin_required
def create_new_team():
    try:
        data = request.get_json(silent=True) or {}
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
    cached_val = settings_cache.get('settings')
    if cached_val:
        return jsonify(cached_val)
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        settings = {row['key']: row['value'] for row in cursor.fetchall()}
        settings_cache.set('settings', settings)
        return jsonify(settings)
    finally:
        conn.close()

@admin_bp.route('/api/settings', methods=['POST'])
@admin_required
def update_settings():
    conn = get_db()
    try:
        data = request.get_json(silent=True) or {}
        cursor = conn.cursor()

        for key, value in data.items():
            cursor.execute("UPDATE settings SET value = ? WHERE key = ?", (value, key))

        conn.commit()
        settings_cache.clear()
        from db_helper import invalidate_base_url_cache
        invalidate_base_url_cache()
        return jsonify({'message': 'Settings updated'})
    finally:
        conn.close()

# ================= CATEGORIES ================= #

@admin_bp.route('/api/categories', methods=['GET'])
def get_categories():
    cached_val = categories_cache.get('categories')
    if cached_val:
        return jsonify(cached_val)
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.id, c.name, c.enabled, c.parent_id, c.team_id, t.name as team_name, COALESCE(c.sort_order, 0) as sort_order, COUNT(n.id) as note_count
            FROM categories c
            LEFT JOIN teams t ON c.team_id = t.id
            LEFT JOIN notes n ON n.category_id = c.id
            GROUP BY c.id, c.name, c.enabled, c.parent_id, c.team_id, t.name, c.sort_order
            ORDER BY COALESCE(c.sort_order, 0) ASC, c.name ASC
        """)
        categories = [dict(row) for row in cursor.fetchall()]
        categories_cache.set('categories', categories)
        return jsonify(categories)
    finally:
        conn.close()

@admin_bp.route('/api/categories', methods=['POST'])
@login_required
@admin_or_moderator_required
def create_category():
    conn = get_db()
    try:
        data = request.json or {}
        name = data.get('name')
        parent_id = data.get('parent_id') or None
        team_id = data.get('team_id') or None
        if team_id is not None:
            try:
                team_id = int(team_id)
            except (ValueError, TypeError):
                team_id = None

        if not name:
            return jsonify({'message': 'Category name required'}), 400

        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO categories (name, parent_id, team_id) VALUES (?, ?, ?)", (name, parent_id, team_id))
            conn.commit()
            categories_cache.clear()
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

        categories_cache.clear()
        return jsonify({'message': 'Category deleted successfully'})
    finally:
        conn.close()

@admin_bp.route('/api/categories/<int:cat_id>', methods=['PUT'])
@admin_bp.route('/api/categories/<int:cat_id>/toggle', methods=['PUT'])
@login_required
@admin_or_moderator_required
def update_category(cat_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, enabled, parent_id, team_id FROM categories WHERE id = ?", (cat_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Category not found'}), 404

        data = request.get_json(silent=True) or {}
        
        # If toggling enabled
        if request.path.endswith('/toggle') or 'toggle' in data:
            new_state = 0 if row['enabled'] else 1
            cursor.execute("UPDATE categories SET enabled = ? WHERE id = ?", (new_state, cat_id))
        else:
            new_name = data.get('name', row['name'])
            new_parent_id = data.get('parent_id', row['parent_id'])
            new_enabled = data.get('enabled', row['enabled'])
            new_team_id = data.get('team_id', row['team_id'])
            if new_team_id == '' or new_team_id == 'null':
                new_team_id = None
            elif new_team_id is not None:
                try:
                    new_team_id = int(new_team_id)
                except (ValueError, TypeError):
                    new_team_id = None

            cursor.execute("UPDATE categories SET name = ?, parent_id = ?, enabled = ?, team_id = ? WHERE id = ?", 
                           (new_name, new_parent_id, new_enabled, new_team_id, cat_id))

        conn.commit()
        categories_cache.clear()
        return jsonify({'message': 'Category updated successfully'})
    finally:
        conn.close()

@admin_bp.route('/api/categories/reorder', methods=['POST'])
@login_required
@admin_or_moderator_required
def reorder_categories():
    conn = get_db()
    try:
        items = request.json or []
        if not isinstance(items, list):
            return jsonify({'message': 'Invalid data format'}), 400
        cursor = conn.cursor()
        for idx, item in enumerate(items):
            cat_id = item.get('id')
            parent_id = item.get('parent_id')
            sort_order = item.get('sort_order', idx)
            if cat_id is not None:
                cursor.execute(
                    "UPDATE categories SET sort_order = ?, parent_id = ? WHERE id = ?",
                    (sort_order, parent_id, cat_id)
                )
        conn.commit()
        categories_cache.clear()
        return jsonify({'message': 'Categories reordered successfully'})
    finally:
        conn.close()

# ================= TAGS ================= #

@admin_bp.route('/api/tags', methods=['GET'])
def get_tags():
    cached_val = tags_cache.get('tags')
    if cached_val:
        return jsonify(cached_val)
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
        tags_cache.set('tags', tags)
        return jsonify(tags)
    finally:
        conn.close()

# ================= STATS ================= #

@admin_bp.route('/api/stats', methods=['GET'])
def get_stats():
    cached_val = stats_cache.get('stats')
    if cached_val:
        return jsonify(cached_val)
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM notes")
        total_notes = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM categories")
        total_categories = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM tags")
        total_tags = cursor.fetchone()['count']
        data = {
            'total_notes': total_notes,
            'total_categories': total_categories,
            'total_tags': total_tags
        }
        stats_cache.set('stats', data)
        return jsonify(data)
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
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:]
    if not token:
        token = request.args.get('token')
    if not token:
        return jsonify({'message': 'Token is missing!'}), 401
    payload = decode_token(token)
    if isinstance(payload, str):
        return jsonify({'message': payload}), 401
    if payload.get('role') != 'admin':
        return jsonify({'message': 'Admin privilege required!'}), 403

    import database
    db_path = database.DATABASE_PATH
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"sysadmin_notes_backup_{timestamp}.db"
    temp_backup = os.path.join(os.path.dirname(db_path) or '.', f"temp_backup_{timestamp}.db")
    
    src_conn = sqlite3.connect(db_path, timeout=30.0)
    dest_conn = sqlite3.connect(temp_backup)
    try:
        with dest_conn:
            src_conn.backup(dest_conn, pages=100, sleep=0.01)
    finally:
        dest_conn.close()
        src_conn.close()
    
    try:
        with open(temp_backup, 'rb') as f:
            data = f.read()
        response = make_response(data)
        response.headers['Content-Disposition'] = f'attachment; filename={filename}'
        response.headers['Content-Type'] = 'application/x-sqlite3'
        return response
    finally:
        if os.path.exists(temp_backup):
            try:
                os.remove(temp_backup)
            except Exception:
                pass

@admin_bp.route('/api/restore', methods=['POST'])
@admin_required
def restore_db():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file and file.filename.endswith('.db'):
        import database
        db_path = database.DATABASE_PATH
        temp_path = db_path + '.restore_tmp'
        file.save(temp_path)
        try:
            # Verify SQLite integrity and format
            temp_conn = sqlite3.connect(temp_path)
            cursor = temp_conn.cursor()
            cursor.execute("PRAGMA integrity_check")
            check_result = cursor.fetchone()
            
            if not check_result or check_result[0] != 'ok':
                temp_conn.close()
                raise ValueError("Database integrity check failed")
                
            # Perform safe online backup from uploaded DB into active DB
            target_conn = sqlite3.connect(db_path, timeout=30.0)
            try:
                with target_conn:
                    temp_conn.backup(target_conn, pages=100)
            finally:
                target_conn.close()
                temp_conn.close()
                
            # Clear all in-memory caches
            clear_note_caches()
            settings_cache.clear()
            categories_cache.clear()
            tags_cache.clear()
            stats_cache.clear()
            activity_cache.clear()
            
            return jsonify({'message': 'Database restored successfully'})
        except Exception as e:
            return jsonify({'message': f'Invalid database file or restore failed: {e}'}), 400
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
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
        cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        note = cursor.fetchone()
        if not note:
            return jsonify({'message': 'Note not found'}), 404
        from routes.notes import _can_user_view_note
        if not _can_user_view_note(dict(note), request.user):
            return jsonify({'message': 'Access denied'}), 403
            
        cursor.execute("SELECT * FROM audit_logs WHERE note_id = ? ORDER BY timestamp DESC", (note_id,))
        logs = [dict(row) for row in cursor.fetchall()]
        return jsonify(logs)
    finally:
        conn.close()

# ================= SYSTEM HEALTH & CACHE METRICS ================= #

@admin_bp.route('/api/admin/system-status', methods=['GET'])
@admin_required
def get_system_status():
    conn = get_db()
    try:
        # Server metrics
        sys_metrics = get_system_metrics()
        
        # Database size & specs
        db_size_bytes = os.path.getsize(DATABASE_PATH) if os.path.exists(DATABASE_PATH) else 0
        cursor = conn.cursor()
        
        # Cache integrity check for 5 minutes (300 seconds) unless force=true is requested
        force_check = request.args.get('force') == 'true' or request.args.get('refresh') == '1'
        db_integrity = None if force_check else stats_cache.get('db_integrity')
        if not db_integrity:
            cursor.execute("PRAGMA quick_check(1)")
            integrity_row = cursor.fetchone()
            db_integrity = integrity_row[0] if integrity_row else "unknown"
            stats_cache.set('db_integrity', db_integrity, ttl=300)
            
        cursor.execute("PRAGMA journal_mode")
        journal_row = cursor.fetchone()
        db_journal = journal_row[0] if journal_row else "unknown"
        
        cursor.execute("SELECT sqlite_version()")
        sqlite_version_str = cursor.fetchone()[0]
        
        # Cache metrics
        total_cache_keys = (
            settings_cache.size() + 
            categories_cache.size() + 
            tags_cache.size() + 
            stats_cache.size() + 
            activity_cache.size()
        )
        total_cache_hits = (
            settings_cache.hits + 
            categories_cache.hits + 
            tags_cache.hits + 
            stats_cache.hits + 
            activity_cache.hits
        )
        total_cache_misses = (
            settings_cache.misses + 
            categories_cache.misses + 
            tags_cache.misses + 
            stats_cache.misses + 
            activity_cache.misses
        )
        
        # Active sessions in last 5 minutes (UTC)
        cursor.execute("""
            SELECT username, role, last_active 
            FROM users 
            WHERE last_active >= datetime('now', '-5 minutes') 
            ORDER BY last_active DESC
        """)
        active_sessions = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'server': sys_metrics,
            'database': {
                'size_bytes': db_size_bytes,
                'integrity': db_integrity,
                'journal_mode': db_journal,
                'sqlite_version': sqlite_version_str
            },
            'cache': {
                'size': total_cache_keys,
                'hits': total_cache_hits,
                'misses': total_cache_misses
            },
            'active_sessions': active_sessions
        })
    finally:
        conn.close()

@admin_bp.route('/api/admin/flush-cache', methods=['POST'])
@admin_required
def flush_cache():
    settings_cache.clear()
    categories_cache.clear()
    tags_cache.clear()
    stats_cache.clear()
    activity_cache.clear()
    return jsonify({'message': 'System cache cleared successfully'})

@admin_bp.route('/api/admin/analytics', methods=['GET'])
@admin_required
def get_analytics():
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # 1. Total users
        cursor.execute("SELECT COUNT(*) as count FROM users")
        total_users = cursor.fetchone()['count']
        
        # 2. Total note views
        cursor.execute("SELECT SUM(access_count) as views FROM user_note_access")
        total_views = cursor.fetchone()['views'] or 0
        
        # 3. Active users in last 24 hours (UTC)
        cursor.execute("""
            SELECT COUNT(DISTINCT id) as active_count 
            FROM users 
            WHERE last_active >= datetime('now', '-24 hours')
        """)
        active_users_24h = cursor.fetchone()['active_count']
        
        # 4. Most visited notes
        cursor.execute("""
            SELECT n.id, n.title, SUM(a.access_count) as views
            FROM user_note_access a
            JOIN notes n ON a.note_id = n.id
            GROUP BY n.id
            ORDER BY views DESC
            LIMIT 5
        """)
        most_visited = [dict(row) for row in cursor.fetchall()]
        
        # 5. Recent views
        cursor.execute("""
            SELECT u.username, n.id as note_id, n.title, a.last_accessed
            FROM user_note_access a
            JOIN users u ON a.user_id = u.id
            JOIN notes n ON a.note_id = n.id
            ORDER BY a.last_accessed DESC
            LIMIT 5
        """)
        recent_views = [dict(row) for row in cursor.fetchall()]

        # 6. User contributions
        cursor.execute("""
            SELECT u.username, u.role,
                   COUNT(CASE WHEN n.approved = 1 AND n.status = 'published' THEN 1 END) as published_notes,
                   COUNT(n.id) as total_notes
            FROM users u
            LEFT JOIN notes n ON n.created_by = u.id
            GROUP BY u.id, u.username, u.role
            ORDER BY published_notes DESC, total_notes DESC
        """)
        user_contributions = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'total_users': total_users,
            'total_views': total_views,
            'active_users_24h': active_users_24h,
            'most_visited': most_visited,
            'recent_views': recent_views,
            'user_contributions': user_contributions
        })
    finally:
        conn.close()

@admin_bp.route('/api/admin/analytics/export', methods=['GET'])
@admin_required
def export_analytics_csv():
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.username, u.role, u.auth_type,
                   (SELECT COUNT(*) FROM notes WHERE created_by = u.id AND approved = 1 AND status = 'published') as published_notes,
                   (SELECT COUNT(*) FROM notes WHERE created_by = u.id) as total_notes,
                   u.last_active
            FROM users u
            ORDER BY published_notes DESC, total_notes DESC
        """)
        rows = cursor.fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['User ID', 'Username', 'Role', 'Auth Type', 'Published Notes', 'Total Notes Created', 'Last Active'])
        for r in rows:
            writer.writerow([r['id'], r['username'], r['role'], r['auth_type'], r['published_notes'], r['total_notes'], r['last_active'] or 'Never'])

        response = make_response(output.getvalue())
        filename = f"sysnotes_analytics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        response.headers["Content-Type"] = "text/csv; charset=utf-8"
        return response
    finally:
        conn.close()



