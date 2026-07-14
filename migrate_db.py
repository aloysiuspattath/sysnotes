import sqlite3
import os

DATABASE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sysadmin_notes.db')

def migrate():
    print(f"Connecting to database: {DATABASE_PATH}")
    if not os.path.exists(DATABASE_PATH):
        print("Database not found. Exiting.")
        return

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    try:
        # Check users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'failed_attempts' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0")
            print("Added 'failed_attempts' column to 'users' table.")
        
        if 'locked_until' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN locked_until DATETIME")
            print("Added 'locked_until' column to 'users' table.")
            
        # Check notes table
        cursor.execute("PRAGMA table_info(notes)")
        note_columns = [col[1] for col in cursor.fetchall()]
        
        if 'reference_links' not in note_columns:
            cursor.execute("ALTER TABLE notes ADD COLUMN reference_links TEXT DEFAULT '[]'")
            print("Added 'reference_links' column to 'notes' table.")
            
        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
