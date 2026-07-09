import sqlite3
import os
from werkzeug.security import generate_password_hash

DATABASE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sysadmin_notes.db')
UPLOADS_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')

def get_db():
    """Return a fresh database connection with Row factory enabled."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def close_db(conn):
    """Close the given database connection."""
    conn.close()

def init_db():
    """Initialize the database schema, default data, and FTS triggers."""
    # Ensure uploads directory exists
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'author',
            auth_type TEXT DEFAULT 'ad',
            UNIQUE(username, auth_type)
        )
    ''')

    # Settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')

    # Categories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            enabled INTEGER DEFAULT 1
        )
    ''')

    # Migration: add 'enabled' column if it doesn't exist (for existing databases)
    cursor.execute("PRAGMA table_info(categories)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'enabled' not in columns:
        cursor.execute("ALTER TABLE categories ADD COLUMN enabled INTEGER DEFAULT 1")

    # Notes table (Main storage)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            command TEXT DEFAULT '',
            description TEXT,
            note_type TEXT DEFAULT 'command',
            category_id INTEGER,
            approved INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ''')

    # Migration: add note_type/approved columns if missing
    cursor.execute("PRAGMA table_info(notes)")
    note_cols = [col[1] for col in cursor.fetchall()]
    if 'note_type' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN note_type TEXT DEFAULT 'command'")
    if 'approved' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN approved INTEGER DEFAULT 1")

    # Migration: update existing 'user' roles to 'author'
    cursor.execute("UPDATE users SET role = 'author' WHERE role = 'user'")

    # Note Steps table (for procedural notes)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS note_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            step_order INTEGER NOT NULL DEFAULT 0,
            title TEXT,
            command TEXT,
            description TEXT,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        )
    ''')

    # Note Images table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS note_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            step_id INTEGER,
            filename TEXT NOT NULL,
            original_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (step_id) REFERENCES note_steps(id) ON DELETE SET NULL
        )
    ''')

    # Tags table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    ''')

    # Note-Tags association table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS note_tags (
            note_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (note_id, tag_id),
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
    ''')

    # Audit Logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER,
            action TEXT NOT NULL,
            username TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            details TEXT
        )
    ''')

    # FTS5 Virtual Table for blazing fast search on notes
    cursor.execute('''
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            title, command, description, content='notes', content_rowid='id'
        )
    ''')

    # Triggers to keep FTS index updated automatically
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
            INSERT INTO notes_fts(rowid, title, command, description) 
            VALUES (new.id, new.title, new.command, new.description);
        END;
    ''')
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, title, command, description) 
            VALUES('delete', old.id, old.title, old.command, old.description);
        END;
    ''')
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, title, command, description) 
            VALUES('delete', old.id, old.title, old.command, old.description);
            INSERT INTO notes_fts(rowid, title, command, description) 
            VALUES (new.id, new.title, new.command, new.description);
        END;
    ''')

    # Ensure default settings exist
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('reverse_proxy_url', '')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('autobackup_enabled', '1')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_retention_days', '7')")
    cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_location', 'backups')")

    # Insert default categories
    default_categories = [
        'Database', 'Linux', 'Windows', 'Network', 'Docker',
        'Kubernetes', 'Cloud', 'Security', 'Scripting', 'Other'
    ]
    for cat in default_categories:
        cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (cat,))

    # Create default admin user if none exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
    if cursor.fetchone()[0] == 0:
        admin_hash = generate_password_hash("admin")
        cursor.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            ("admin", admin_hash, "admin")
        )

    conn.commit()
    close_db(conn)

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
