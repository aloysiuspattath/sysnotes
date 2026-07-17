from flask import has_app_context, g
from database import get_db as _orig_get_db, DATABASE_PATH

# Fail-safe database connection registry for request context teardown
def get_db():
    conn = _orig_get_db()
    if has_app_context():
        if 'db_connections' not in g:
            g.db_connections = []
        g.db_connections.append(conn)
    return conn

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

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def log_audit(conn, note_id, action, username, details=""):
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO audit_logs (note_id, action, username, details) VALUES (?, ?, ?, ?)",
        (note_id, action, username, details)
    )
