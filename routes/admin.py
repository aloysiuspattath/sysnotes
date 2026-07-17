import os
import sys
import time
import shutil
import secrets
import sqlite3
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash
from db_helper import get_db, allowed_file, DATABASE_PATH
from auth import admin_required, login_required
from routes.auth import validate_password
from database import get_user_teams, get_all_teams, create_team, delete_team
from cache_helper import settings_cache, categories_cache, tags_cache, stats_cache, activity_cache

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
        data = request.json
        cursor = conn.cursor()

        for key, value in data.items():
            cursor.execute("UPDATE settings SET value = ? WHERE key = ?", (value, key))

        conn.commit()
        settings_cache.clear()
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
            SELECT c.id, c.name, c.enabled, COUNT(n.id) as note_count
            FROM categories c
            LEFT JOIN notes n ON n.category_id = c.id
            GROUP BY c.id, c.name, c.enabled
            ORDER BY c.name
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
        data = request.json
        name = data.get('name')

        if not name:
            return jsonify({'message': 'Category name required'}), 400

        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (name,))
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
        categories_cache.clear()
        return jsonify({'message': 'Category toggled', 'enabled': bool(new_state)})
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
        
        cursor.execute("PRAGMA integrity_check")
        integrity_row = cursor.fetchone()
        db_integrity = integrity_row[0] if integrity_row else "unknown"
        
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

