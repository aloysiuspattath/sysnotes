# SysNotes

A comprehensive Flask-based note-taking application designed for system administrators and engineers to store, organize, and manage system administration knowledge, commands, procedures, and documentation.

## 🎯 Overview

SysNotes is a web application that allows teams to collaboratively document system administration tasks, maintain command references, and store procedural knowledge in an organized, searchable manner. Whether it's storing frequently-used commands, documenting complex procedures with step-by-step guides, or maintaining plain text documentation, SysNotes provides a centralized platform.

## ✨ Features

- **Multiple Note Types**
  - **Command Notes**: Store frequently used commands with descriptions
  - **Procedure Notes**: Document step-by-step procedures with titles and commands for each step
  - **Plain Notes**: Store general text-based documentation

- **Organization & Search**
  - Full-text search across all notes
  - Organize notes by categories
  - Tag-based filtering and organization
  - Filter by category or tags

- **Image Support**
  - Upload images to illustrate procedures and commands
  - Attach images to specific procedure steps or to notes directly
  - Support for PNG, JPG, GIF, WebP, and BMP formats (max 10MB per upload)

- **User Management**
  - Role-based access control (Admin, User)
  - User authentication and password management
  - Admin panel for user management
  - Change password functionality

- **Data Management**
  - Automatic daily database backups
  - Manual backup and restore functionality
  - SQLite database with full-text search capability

- **Settings**
  - Admin-configurable application settings
  - Flexible configuration management

## 📋 Requirements

- Python 3.7+
- Flask 3.1.0
- SQLite3
- Modern web browser for frontend

## 📦 Installation

### Option 1: Quick Start (Windows)

Run the included batch scripts in order:

```bash
1_download_requirements.bat  # Download Python dependencies
2_setup_offline.bat          # Set up the database and initial admin user
3_run_app.bat                # Start the application
```

### Option 2: Manual Installation

1. **Clone the repository:**
```bash
git clone https://github.com/aloysiuspattath/sysnotes.git
cd sysnotes
```

2. **Create a virtual environment (recommended):**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Initialize the database:**
```bash
python -c "from database import init_db; init_db()"
```

5. **Create admin user (if needed):**
```bash
python database.py
```

6. **Run the application:**
```bash
python app.py
# Or for production:
python run_prod.py
```

The application will be available at `http://localhost:5005`

## 🚀 Usage

### Creating a Note

1. Navigate to the application home page
2. Click "New Note" and select the note type:
   - **Command**: A single command with description
   - **Procedure**: Multiple steps with optional commands and descriptions
   - **Plain**: Text-based documentation

3. Fill in the required fields:
   - Title (required)
   - Command/Content (required based on note type)
   - Category (optional)
   - Tags (optional)
   - Images (optional)

4. Click "Save Note"

### Searching & Filtering

- Use the search bar to search across note titles, commands, and descriptions
- Filter by category or tags using the sidebar filters
- Click on a category or tag to see all related notes

### Managing Procedures

For procedure notes, you can:
- Add multiple steps in order
- Assign a command and description to each step
- Upload and attach images to specific steps
- Reorder steps as needed

### Backup & Restore

**As Admin:**
- Click "Settings" → "Backup" to download a database backup
- Click "Settings" → "Restore" to upload a previously backed-up database

## 🔐 User Management

### Admin Panel

Admins can:
- Create new user accounts with usernames and passwords
- Assign user roles (Admin or User)
- Delete user accounts
- Configure application settings
- Manage categories and tags

### User Roles

- **Admin**: Full access to all features, user management, settings, and admin panel
- **User**: Can create, edit, and delete their own notes; view all shared notes

## 🏗️ Project Structure

```
sysnotes/
├── app.py                    # Main Flask application
├── database.py              # Database initialization and utilities
├── auth.py                  # Authentication and authorization
├── backup_service.py        # Automated backup service
├── requirements.txt         # Python dependencies
├── templates/               # HTML templates and SPA frontend
├── static/                  # Static assets (CSS, JS, images)
├── uploads/                 # User-uploaded images
├── conftest.py             # pytest configuration
├── test_auth.py            # Authentication tests
├── test_categories.py       # Category tests
├── test_notes.py           # Note functionality tests
└── .gitignore              # Git ignore rules
```

## 🧪 Testing

Run the test suite using pytest:

```bash
pytest
# Run with verbose output:
pytest -v
# Run specific test file:
pytest test_notes.py
```

The test suite covers:
- Authentication and authorization
- Category management
- Note creation, updates, and deletion
- Tag management
- Image upload and handling

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the project root to customize settings:

```env
SECRET_KEY=your-secret-key-here
TESTING=False
```

**Important**: Change the `SECRET_KEY` in production! Default value is only for development.

### Database

The application uses SQLite with the following main tables:
- `users`: User accounts and authentication
- `notes`: Note records
- `note_steps`: Steps for procedure-type notes
- `categories`: Note categories
- `tags`: Note tags
- `note_tags`: Tag-to-note relationships
- `note_images`: Uploaded images
- `settings`: Application configuration

## 📝 API Endpoints

### Authentication
- `POST /api/login` - User login

### Notes
- `GET /api/notes` - List all notes (with search/filter)
- `POST /api/notes` - Create new note (login required)
- `GET /api/notes/<id>` - Get single note details
- `PUT /api/notes/<id>` - Update note (login required)
- `DELETE /api/notes/<id>` - Delete note (login required)

### Images
- `POST /api/notes/<id>/images` - Upload image to note (login required)
- `DELETE /api/images/<id>` - Delete image (login required)

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin required)
- `DELETE /api/categories/<id>` - Delete category (admin required)
- `PUT /api/categories/<id>/toggle` - Enable/disable category (admin required)

### Tags
- `GET /api/tags` - List all tags

### Users (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/<id>` - Delete user

### Admin
- `GET /api/settings` - Get application settings
- `POST /api/settings` - Update settings (admin required)
- `GET /api/backup` - Download database backup (admin required)
- `POST /api/restore` - Restore database from backup (admin required)

### Stats
- `GET /api/stats` - Get statistics (total notes, categories, tags)

## 🔄 Automatic Backups

SysNotes includes an automatic backup service that:
- Runs daily in the background
- Creates timestamped backups
- Stores backups alongside the main database
- Can be disabled by setting the `TESTING` environment variable

## 🐛 Troubleshooting

### Port 5005 already in use
Edit `app.py` or `run_prod.py` and change the port number:
```python
app.run(host='0.0.0.0', port=YOUR_PORT)
```

### Database locked error
This usually means the app is running and accessing the database. Ensure only one instance is running.

### Images not uploading
- Check that the `uploads/` directory exists and is writable
- Verify file size is under 10MB
- Ensure file format is supported (PNG, JPG, GIF, WebP, BMP)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 👤 Author

Created by Aloysius Pattath

## 📞 Support

For issues, questions, or feature requests, please open an issue in the repository.

---

**Happy note-taking! 📝**
