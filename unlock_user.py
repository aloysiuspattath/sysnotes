import sqlite3
import os
import sys

DATABASE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sysadmin_notes.db')

def unlock_user():
    if not os.path.exists(DATABASE_PATH):
        print("Database not found. Exiting.")
        return

    username = input("Enter local username to unlock: ").strip()
    if not username:
        print("Username cannot be empty.")
        return

    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE username = ? AND auth_type = 'local'", (username,))
        conn.commit()
        
        if cursor.rowcount > 0:
            print(f"User '{username}' successfully unlocked.")
        else:
            print(f"User '{username}' not found or is not a local account.")
    except Exception as e:
        print(f"Error unlocking user: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    unlock_user()
