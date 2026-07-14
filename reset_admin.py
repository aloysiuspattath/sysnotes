import sqlite3
import os
import sys
import getpass
from werkzeug.security import generate_password_hash

DATABASE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sysadmin_notes.db')

def reset_admin_password():
    if not os.path.exists(DATABASE_PATH):
        print("Database not found. Exiting.")
        return

    username = input("Enter admin username to reset: ").strip()
    if not username:
        print("Username cannot be empty.")
        return

    password = getpass.getpass("Enter new password: ").strip()
    if not password:
        print("Password cannot be empty.")
        return
        
    confirm_password = getpass.getpass("Confirm new password: ").strip()
    if password != confirm_password:
        print("Passwords do not match.")
        return

    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM users WHERE username = ? AND auth_type = 'local'", (username,))
        user = cursor.fetchone()
        
        if not user:
            print("User not found or is not a local account.")
            return
            
        if user['role'] != 'admin':
            print("Warning: This user is not currently an admin.")
            confirm = input("Continue anyway? (y/n): ").strip().lower()
            if confirm != 'y':
                return

        hashed_pw = generate_password_hash(password)
        cursor.execute("UPDATE users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?", 
                       (hashed_pw, user['id']))
        conn.commit()
        print(f"Password successfully reset for user '{username}'. Account unlocked if it was locked.")
    except Exception as e:
        print(f"Error resetting password: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    reset_admin_password()
