import sqlite3
import os
import urllib.request
import urllib.error
import json

DATABASE_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sysadmin_notes.db')

ssl_active = os.path.exists('cert.pem') and os.path.exists('key.pem')
protocol = 'https' if ssl_active else 'http'
HEALTH_URL = f"{protocol}://127.0.0.1:5005/api/health"

import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def check_database():
    print("\n--- Database Status ---")
    if not os.path.exists(DATABASE_PATH):
        print(f"ERROR: Database file not found at {DATABASE_PATH}")
        return False
        
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Check basic stats
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role='admin'")
        admin_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM notes")
        notes_count = cursor.fetchone()[0]
        
        print(f"Status: OK")
        print(f"Users: {user_count} ({admin_count} admins)")
        print(f"Notes: {notes_count}")
        return True
    except Exception as e:
        print(f"ERROR connecting to database: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def check_server():
    print("\n--- Server API Status ---")
    try:
        req = urllib.request.Request(HEALTH_URL)
        with urllib.request.urlopen(req, timeout=5, context=ctx) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"Status: OK ({data.get('status', 'Unknown')})")
                print(f"Message: {data.get('message', '')}")
                return True
            else:
                print(f"WARNING: Server returned status {response.status}")
                return False
    except urllib.error.URLError as e:
        print(f"ERROR: Could not connect to server at {HEALTH_URL}")
        print(f"Reason: {e.reason}")
        print("Is the server running?")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error checking server: {e}")
        return False

if __name__ == "__main__":
    print("===================================")
    print(" SysNotes Server Status Diagnostic ")
    print("===================================")
    
    db_ok = check_database()
    api_ok = check_server()
    
    print("\n===================================")
    if db_ok and api_ok:
        print(" OVERALL STATUS: HEALTHY")
    else:
        print(" OVERALL STATUS: ISSUES DETECTED")
    print("===================================\n")
