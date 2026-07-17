import sqlite3
import os
from werkzeug.security import generate_password_hash

DATABASE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sysadmin_notes.db')
UPLOADS_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')

def get_db():
    """Return a fresh database connection with Row factory enabled."""
    conn = sqlite3.connect(DATABASE_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
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
            failed_attempts INTEGER DEFAULT 0,
            locked_until DATETIME,
            UNIQUE(username, auth_type)
        )
    ''')

    # Migration: add failed_attempts/locked_until columns if missing (for existing databases)
    cursor.execute("PRAGMA table_info(users)")
    user_cols = [col[1] for col in cursor.fetchall()]
    if 'failed_attempts' not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0")
    if 'locked_until' not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN locked_until DATETIME")

    # Teams table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # User Teams junction table (Many-to-Many)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_teams (
            user_id INTEGER NOT NULL,
            team_id INTEGER NOT NULL,
            PRIMARY KEY (user_id, team_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
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
            reference_links TEXT DEFAULT '[]',
            status TEXT DEFAULT 'published',
            team_id INTEGER,
            visibility TEXT DEFAULT 'global',
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )
    ''')

    # Migration: add note_type/approved/status columns if missing
    cursor.execute("PRAGMA table_info(notes)")
    note_cols = [col[1] for col in cursor.fetchall()]
    if 'note_type' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN note_type TEXT DEFAULT 'command'")
    if 'approved' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN approved INTEGER DEFAULT 1")
    if 'status' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN status TEXT DEFAULT 'published'")
    if 'reference_links' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN reference_links TEXT DEFAULT '[]'")
    if 'team_id' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN team_id INTEGER")
    if 'visibility' not in note_cols:
        cursor.execute("ALTER TABLE notes ADD COLUMN visibility TEXT DEFAULT 'global'")

    # Revisions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS note_revisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            command TEXT DEFAULT '',
            description TEXT DEFAULT '',
            note_type TEXT DEFAULT 'command',
            category_id INTEGER,
            reference_links TEXT DEFAULT '[]',
            steps TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            team_id INTEGER,
            visibility TEXT DEFAULT 'global',
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )
    ''')

    # Migration: add reference_links/steps columns to note_revisions if missing
    cursor.execute("PRAGMA table_info(note_revisions)")
    rev_cols = [col[1] for col in cursor.fetchall()]
    if 'reference_links' not in rev_cols:
        cursor.execute("ALTER TABLE note_revisions ADD COLUMN reference_links TEXT DEFAULT '[]'")
    if 'steps' not in rev_cols:
        cursor.execute("ALTER TABLE note_revisions ADD COLUMN steps TEXT DEFAULT '[]'")
    if 'team_id' not in rev_cols:
        cursor.execute("ALTER TABLE note_revisions ADD COLUMN team_id INTEGER")
    if 'visibility' not in rev_cols:
        cursor.execute("ALTER TABLE note_revisions ADD COLUMN visibility TEXT DEFAULT 'global'")

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
            blocks TEXT,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        )
    ''')

    # Migration: add blocks column to note_steps if missing
    cursor.execute("PRAGMA table_info(note_steps)")
    step_cols = [col[1] for col in cursor.fetchall()]
    if 'blocks' not in step_cols:
        cursor.execute("ALTER TABLE note_steps ADD COLUMN blocks TEXT")

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

    # Performance Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_note_steps_note_id ON note_steps(note_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_note_images_note_id ON note_images(note_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id)")

    # Note Revisions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS note_revisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            command TEXT DEFAULT '',
            description TEXT,
            note_type TEXT DEFAULT 'command',
            category_id INTEGER,
            reference_links TEXT DEFAULT '[]',
            steps TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
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

    # Favorites table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_favorites (
            user_id INTEGER NOT NULL,
            note_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, note_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        )
    ''')

    # Note Access logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_note_access (
            user_id INTEGER NOT NULL,
            note_id INTEGER NOT NULL,
            access_count INTEGER DEFAULT 1,
            last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, note_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
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

    # Performance optimizing indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_approved_created_at ON notes(approved, created_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_note_steps_note_id ON note_steps(note_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_note_images_note_id_step_id ON note_images(note_id, step_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_note_id ON audit_logs(note_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC)")

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
            "INSERT INTO users (username, password_hash, role, auth_type) VALUES (?, ?, ?, ?)",
            ("admin", admin_hash, "admin", "local")
        )

    # Seed default team if no teams exist
    cursor.execute("SELECT COUNT(*) FROM teams")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO teams (name, description) VALUES ('Default Team', 'Default department team for all users')")
        default_team_id = cursor.lastrowid
        # Assign all existing users to the default team
        cursor.execute("SELECT id FROM users")
        user_ids = [row[0] for row in cursor.fetchall()]
        for uid in user_ids:
            cursor.execute("INSERT OR IGNORE INTO user_teams (user_id, team_id) VALUES (?, ?)", (uid, default_team_id))

    conn.commit()
    close_db(conn)

def get_user_teams(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.id, t.name, t.description 
        FROM teams t 
        JOIN user_teams ut ON t.id = ut.team_id 
        WHERE ut.user_id = ?
    ''', (user_id,))
    rows = cursor.fetchall()
    close_db(conn)
    return [{'id': r[0], 'name': r[1], 'description': r[2]} for r in rows]

def set_user_teams(user_id, team_ids):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_teams WHERE user_id = ?", (user_id,))
    for tid in team_ids:
        cursor.execute("INSERT OR IGNORE INTO user_teams (user_id, team_id) VALUES (?, ?)", (user_id, tid))
    conn.commit()
    close_db(conn)

def get_all_teams():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description, created_at FROM teams ORDER BY name ASC")
    rows = cursor.fetchall()
    close_db(conn)
    return [{'id': r[0], 'name': r[1], 'description': r[2], 'created_at': r[3]} for r in rows]

def create_team(name, description):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO teams (name, description) VALUES (?, ?)", (name, description))
        conn.commit()
        tid = cursor.lastrowid
        close_db(conn)
        return tid
    except Exception as e:
        close_db(conn)
        raise e

def delete_team(team_id):
    conn = get_db()
    cursor = conn.cursor()
    # Check if there is only 1 team left (to prevent deletion of the last team)
    cursor.execute("SELECT COUNT(*) FROM teams")
    if cursor.fetchone()[0] <= 1:
        close_db(conn)
        raise ValueError("Cannot delete the only remaining team in the department.")
    
    # Reassign orphaned users to another team
    cursor.execute("DELETE FROM teams WHERE id = ?", (team_id,))
    cursor.execute("SELECT id FROM teams LIMIT 1")
    fallback_team_id = cursor.fetchone()[0]
    
    cursor.execute("SELECT id FROM users")
    uids = [row[0] for row in cursor.fetchall()]
    for uid in uids:
        cursor.execute("SELECT COUNT(*) FROM user_teams WHERE user_id = ?", (uid,))
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT OR IGNORE INTO user_teams (user_id, team_id) VALUES (?, ?)", (uid, fallback_team_id))
            
    # Reassign notes belonging to deleted team to NULL
    cursor.execute("UPDATE notes SET team_id = NULL WHERE team_id = ?", (team_id,))
    cursor.execute("UPDATE note_revisions SET team_id = NULL WHERE team_id = ?", (team_id,))
    conn.commit()
    close_db(conn)

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
