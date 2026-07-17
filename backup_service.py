import os
import shutil
import time
import threading
from datetime import datetime, timedelta

import sqlite3

def run_backup_scheduler(db_path):
    while True:
        enabled = True
        retention_days = 7
        backup_dir = 'backups'
        conn = None
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key='autobackup_enabled'")
            row = cursor.fetchone()
            enabled = (row[0] == '1') if row else True
            
            cursor.execute("SELECT value FROM settings WHERE key='backup_retention_days'")
            row = cursor.fetchone()
            retention_days = int(row[0]) if row else 7

            cursor.execute("SELECT value FROM settings WHERE key='backup_location'")
            row = cursor.fetchone()
            backup_dir = row[0].strip() if row and row[0].strip() else 'backups'
        finally:
            if conn is not None:
                conn.close()

        try:
            if enabled:
                if not os.path.exists(backup_dir):
                    os.makedirs(backup_dir, exist_ok=True)

                # Create backup
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_file = os.path.join(backup_dir, f"sysadmin_notes_{timestamp}.db")
                shutil.copy2(db_path, backup_file)
                print(f"Backup created: {backup_file}")

                # Clean old backups
                cutoff = datetime.now() - timedelta(days=retention_days)
                for f in os.listdir(backup_dir):
                    if f.startswith("sysadmin_notes_") and f.endswith(".db"):
                        filepath = os.path.join(backup_dir, f)
                        file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
                        if file_time < cutoff:
                            os.remove(filepath)
                            print(f"Removed old backup: {filepath}")
        except Exception as e:
            print(f"Backup failed: {e}")

        # Sleep for 24 hours
        time.sleep(24 * 60 * 60)

def start_backup_service(db_path):
    t = threading.Thread(target=run_backup_scheduler, args=(db_path,), daemon=True)
    t.start()
