# SysNotes

A comprehensive, secure system administration notes and procedures repository with a Python Flask backend and a premium, responsive single-page application (SPA) frontend. SysNotes allows IT departments to organize, search, and manage system administration commands, procedures, and documentation securely across multiple teams.

**Author:** [@aloysiuspattath](https://github.com/aloysiuspattath)

---

## Key Features

### 👥 Department-Level Multi-Team Support
- **Multi-Team Allocations:** Admins can define any number of teams (e.g., `SysAdmin`, `DBA`, `DevOps`) and allocate users to **multiple teams** simultaneously.
- **Granular Scoped Visibility:** Notes feature scoped visibility:
  - **Global:** Accessible by all authenticated users across all teams.
  - **Team Only:** Restricted entirely to members of the assigned team.
- **Dynamic Team Homepages:** Clean sub-path routing supports team homepages directly (e.g., `sysnotes:5005/sysadmin` or `/t/sysadmin`).
  - *Anonymous/Public users* visiting a team page see only the **Global** notes belonging to that team.
  - *Logged-in members* see both **Global** and **Team-Private** notes.
  - *Non-members* are securely restricted to **Global** notes only.

### 🔐 Two-Step AD & Local Authentication
- **Dual Auth Engine:** Support for both local database credentials and Active Directory (AD) configurations using a dropdown choice in the login popup.
- **Active Session Team Selection:** If a user belongs to multiple teams, after entering credentials, they are smoothly guided to select their **Active Team** session (or select *All My Teams*) to filter their dashboard view immediately.

### 📝 Note Management
- **Multiple Note Types:** Command notes, Procedure notes (with step-by-step guides), Document/SOP files, and Plain/Rich Text notes.
- **Rich Editor:** Markdown support and WYSIWYG editing.
- **Image Support:** Attach images to notes and individual steps within procedures.
- **Version Control & Revisions:** Automatically tracks changes and creates snapshots on manual updates, with creator attribution and single-click revision restoration.

### 🛡️ Administration & Security
- **Auditing Logs:** Track core operations (`CREATED`, `UPDATED`, `DELETED`, `APPROVED`, `RESTORED`) with detailed logs.
- **Backup & Restore:** Download database backups and restore from backup files directly.
- **Automatic Backups:** Daily backup service running in the background.
- **Automatic Migrations:** Dynamically detects outdated database layouts on boot and updates schemas without data loss.

---

## Technology Stack

| Category | Technology | Description |
|----------|-----------|-------------|
| **Backend** | Python 3 with Flask | REST API service |
| **Frontend** | HTML, CSS, Vanilla JS | Premium, responsive SPA UI |
| **Database** | SQLite | Serverless, with FTS (Full-Text Search) |
| **Authentication** | JWT (PyJWT) | Secure token-based session management |
| **Server** | Waitress (WSGI) | Production-ready Windows/Linux WSGI server |
| **Security** | Werkzeug | Secure password hashing |

---

## Project Structure

```
sysnotes/
├── app.py                      # Main Flask application & routes
├── auth.py                     # JWT token handling & auth decorators
├── database.py                 # SQLite schema, queries, and migrations
├── backup_service.py          # Daily automatic database backup service
├── static/                     # Frontend assets (CSS, app.js, vendor libraries)
├── templates/                 # HTML SPA views (index.html, note_detail.html)
├── tests/                    # Backend test suite (test_backend.py)
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

---

## Installation & Deployment

### Windows Setup

1. **Install dependencies**:
   ```bash
   install.bat
   ```
2. **Start the server in the foreground**:
   ```bash
   start_server.bat
   ```
3. **Run silently in the background** (survives logging off):
   - Use `run_background.vbs` to start, and `stop_server.bat` to stop the Waitress process running on port 5005.

### Windows Service hosting (NSSM)

To run SysNotes as a persistent system service:
1. Download **NSSM (Non-Sucking Service Manager)**.
2. Open Command Prompt as **Administrator** and run:
   ```cmd
   nssm install SysNotes
   ```
3. In the GUI dialog:
   * **Path:** Select `start_server.bat`
   * **Startup directory:** Select the project root folder
4. Start the service:
   ```cmd
   net start SysNotes
   ```

### Linux / macOS Setup

1. **Setup dependencies**:
   ```bash
   ./install.sh
   ```
2. **Run the waiting server**:
   ```bash
   ./start_server.sh
   ```

---

## Verification & Testing

Verify backend logic and security constraints using the test suite:
```bash
python -m unittest tests/test_backend.py
```
This suite covers:
- Token authentication and lockouts.
- Note CRUD, draft vs published, and permissions.
- Team isolation and global visibility checks.
- Revisions and audit trail logging.

---

## Contributing & Support

Created by [@aloysiuspattath](https://github.com/aloysiuspattath). For issues or suggestions, please open an issue on the GitHub repository.

**Last Updated:** July 2026
