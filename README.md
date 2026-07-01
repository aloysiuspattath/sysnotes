# SysNotes

A comprehensive system administration notes application with a Python Flask backend and web-based frontend. SysNotes allows you to organize, search, and manage your system administration commands, procedures, and documentation.

**Author:** [@aloysiuspattath](https://github.com/aloysiuspattath)

## Features

### 📝 Note Management
- **Multiple Note Types:** Support for command notes, procedures (with steps), and plain text notes
- **Rich Organization:** Categorize notes and apply multiple tags for easy discovery
- **Full-Text Search:** Quickly find notes using powerful search functionality
- **Image Support:** Attach images to notes and individual steps within procedures
- **Version Control:** Track creation and modification timestamps with creator attribution

### 👥 User Management
- **Authentication:** Secure login system with JWT token-based authentication
- **Role-Based Access Control:** Admin and user roles with appropriate permissions
- **User Administration:** Admins can create, manage, and delete users
- **Password Management:** Users can change their own passwords securely

### 🛡️ Administration
- **Settings Management:** Configure application behavior and reverse proxy URLs
- **Backup & Restore:** Download full database backups and restore from backups
- **Category Management:** Create, organize, and toggle note categories
- **Tag Management:** Manage and track tag usage across notes

### 🔧 Technical Features
- **Offline Support:** Batch scripts for offline setup and deployment
- **Database:** SQLite with full-text search capabilities
- **Automatic Backups:** Daily backup service running in background
- **Responsive Design:** Web-based UI that works on desktop and mobile
- **Reverse Proxy Ready:** Support for reverse proxy deployments

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Backend** | Python 3 with Flask |
| **Frontend** | HTML, CSS, JavaScript |
| **Database** | SQLite with FTS (Full-Text Search) |
| **Authentication** | JWT (PyJWT) |
| **Server** | Waitress (WSGI) |
| **Security** | Werkzeug password hashing |
| **Configuration** | Python-dotenv |

## Installation

### Windows (Batch Scripts)

The repository includes convenient batch scripts for Windows setup:

1. **Download requirements** (optional, for offline setup):
   ```bash
   1_download_requirements.bat
   ```

2. **Setup for offline environment**:
   ```bash
   2_setup_offline.bat
   ```

3. **Run the application**:
   ```bash
   3_run_app.bat
   ```

Or use the convenience scripts:
- `install.bat` - Install dependencies
- `start_server.bat` - Start the server in the foreground
- `run_background.vbs` - Start the production server silently in the background
- `stop_server.bat` - Safely stop the background server running on port 5005

### Windows Production Hosting (NSSM)

To run SysNotes as a persistent background service on Windows (which survives user sessions logging off and starts automatically on boot):

1. Download **NSSM (Non-Sucking Service Manager)** and copy `nssm.exe` to your offline server.
2. Open a Command Prompt (cmd) as **Administrator** and run:
   ```cmd
   nssm install SysNotes
   ```
3. In the GUI dialog that pops up:
   * **Path:** Select the path to `start_server.bat`
   * **Startup directory:** Select the path to the project root directory
4. Click **Install Service**.
5. Start the service using:
   ```cmd
   net start SysNotes
   ```
   Or manage it directly from Windows Services manager (`services.msc`).

### Linux / macOS (Shell Scripts)

The repository includes convenient shell scripts for Linux/macOS setup:

1. **Download requirements** (optional, for offline setup):
   ```bash
   ./download_requirements.sh
   ```

2. **Setup dependencies** (automatically supports offline/online modes):
   ```bash
   ./install.sh
   ```

3. **Run the production application**:
   ```bash
   ./start_server.sh
   ```

### Linux Production Hosting (systemd)

To host SysNotes as a persistent background service on Linux:

1. Copy the template service file to systemd directory:
   ```bash
   sudo cp sysnotes.service /etc/systemd/system/sysnotes.service
   ```

2. Open `/etc/systemd/system/sysnotes.service` and adjust `User`, `WorkingDirectory`, and `ExecStart` paths if needed.

3. Start and enable the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start sysnotes
   sudo systemctl enable sysnotes
   ```

### Manual Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/aloysiuspattath/sysnotes.git
   cd sysnotes
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   python app.py
   ```

   Or for production:
   ```bash
   python run_prod.py
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:5005`

## Configuration

### Environment Variables

Create a `.env` file in the project root for custom configuration:

```env
SECRET_KEY=your-secret-key-here
TESTING=false
```

### Default Settings

The application uses SQLite database (`sysadmin_notes.db`) stored in the application directory. Default settings are configured in the database initialization.

## Project Structure

```
sysnotes/
├── app.py                      # Main Flask application
├── auth.py                     # Authentication and JWT handling
├── database.py                 # Database initialization and utilities
├── backup_service.py          # Automatic backup service
├── requirements.txt           # Python dependencies
├── templates/                 # HTML templates
│   ├── index.html            # Main SPA
│   └── note_detail.html      # Note detail page
├── static/                   # Frontend assets (CSS, JS, images)
├── tests/                    # Test suite
│   ├── conftest.py          # Pytest configuration
│   ├── test_auth.py         # Authentication tests
│   ├── test_notes.py        # Note CRUD tests
│   └── test_categories.py   # Category management tests
├── Windows batch scripts:
│   ├── 1_download_requirements.bat
│   ├── 2_setup_offline.bat
│   ├── 3_run_app.bat
│   ├── install.bat
│   └── start_server.bat
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/login` - Login with username and password

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/<user_id>` - Delete user

### Account
- `POST /api/change-password` - Change current user's password

### Settings (Admin Only)
- `GET /api/settings` - Get application settings
- `POST /api/settings` - Update settings

### Categories (Admin Only)
- `GET /api/categories` - List categories with note counts
- `POST /api/categories` - Create new category
- `DELETE /api/categories/<cat_id>` - Delete category
- `PUT /api/categories/<cat_id>/toggle` - Toggle category enabled state

### Tags
- `GET /api/tags` - List all tags with usage counts

### Notes
- `GET /api/notes` - List notes (with search, category, and tag filters)
- `GET /api/notes/<note_id>` - Get single note with all details
- `POST /api/notes` - Create new note
- `PUT /api/notes/<note_id>` - Update note
- `DELETE /api/notes/<note_id>` - Delete note

### Images
- `POST /api/notes/<note_id>/images` - Upload image to note
- `DELETE /api/images/<image_id>` - Delete image

### Backup & Restore
- `GET /api/backup` - Download database backup
- `POST /api/restore` - Restore from backup file

### Statistics
- `GET /api/stats` - Get statistics (total notes, categories, tags)

## Usage Examples

### Creating a Command Note

```bash
curl -X POST http://localhost:5005/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "List Docker Containers",
    "note_type": "command",
    "command": "docker ps -a",
    "description": "Show all Docker containers",
    "category_id": 1,
    "tags": ["docker", "containers"]
  }'
```

### Creating a Procedure Note

```bash
curl -X POST http://localhost:5005/api/notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploy Application",
    "note_type": "procedure",
    "steps": [
      {
        "title": "Build Docker Image",
        "command": "docker build -t myapp .",
        "description": "Build the application image"
      },
      {
        "title": "Push to Registry",
        "command": "docker push myapp:latest",
        "description": "Push to container registry"
      }
    ],
    "tags": ["deployment", "docker"]
  }'
```

## Testing

Run the test suite using pytest:

```bash
pytest
```

Run specific test file:
```bash
pytest test_notes.py -v
```

Test coverage includes:
- Authentication and authorization
- Note CRUD operations
- Category management
- Tag management

## Development

### Running in Debug Mode

```bash
python app.py
```

The application runs with debug mode enabled by default in development.

### Database Schema

The application automatically initializes the database with the following tables:
- `users` - User accounts with password hashes
- `notes` - Main notes table
- `categories` - Note categories
- `tags` - Tags for note organization
- `note_tags` - Many-to-many relationship between notes and tags
- `note_steps` - Procedure steps for procedure-type notes
- `note_images` - Images attached to notes
- `note_images_fts` - Full-text search index
- `settings` - Application configuration

## Security

- **Password Security:** Uses Werkzeug's secure password hashing
- **JWT Authentication:** Token-based authentication for API endpoints
- **File Upload Validation:** Only allows specific image formats (PNG, JPG, JPEG, GIF, WebP, BMP)
- **SQL Injection Protection:** Parameterized queries throughout the codebase
- **Role-Based Access Control:** Admin-only endpoints protected with decorators
- **File Size Limits:** 10MB maximum upload size

## Backup & Restore

### Automatic Backups
The application runs a daily backup service that automatically backs up the database.

### Manual Backup
Download a database backup through the admin interface or API:

```bash
curl -X GET "http://localhost:5005/api/backup?token=YOUR_TOKEN" \
  --output backup.db
```

### Restore from Backup
Upload a backup file through the admin interface or use the API:

```bash
curl -X POST http://localhost:5005/api/restore \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@backup.db"
```

## Reverse Proxy Configuration

To use SysNotes behind a reverse proxy, configure the `reverse_proxy_url` setting:

```bash
curl -X POST http://localhost:5005/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reverse_proxy_url": "/notes"
  }'
```

The application will then serve all routes under `/notes/`.

## Troubleshooting

### Port Already in Use
If port 5005 is already in use, modify the port in `app.py`:

```python
app.run(host='0.0.0.0', port=8080, debug=True)
```

### Database Issues
Delete the `sysadmin_notes.db` file to reset the database (all data will be lost):

```bash
rm sysadmin_notes.db
python app.py  # Will reinitialize the database
```

### Import Errors
Ensure all dependencies are installed:

```bash
pip install -r requirements.txt
```

## Contributing

Contributions are welcome! Feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is created by [@aloysiuspattath](https://github.com/aloysiuspattath). Check the repository for any license information.

## Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/aloysiuspattath/sysnotes).

---

**Last Updated:** June 2026
