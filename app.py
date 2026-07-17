"""
SysNotes - Backend Runner
Author: aloysiuspattath
GitHub: https://github.com/aloysiuspattath
"""
import os
import secrets
from flask import Flask, request, g, has_app_context
from dotenv import load_dotenv

from database import init_db
from backup_service import start_backup_service
from db_helper import get_db, get_base_url

# Load environment variables
load_dotenv()

# Initialize app
app = Flask(__name__, static_folder='static', template_folder='templates')

@app.teardown_appcontext
def teardown_db_connections(exception):
    if 'db_connections' in g:
        for conn in g.db_connections:
            try:
                conn.close()
            except:
                pass

def get_secret_key():
    secret_file = os.path.join(os.path.dirname(__file__), '.secret_key')
    if os.environ.get('SECRET_KEY'):
        return os.environ.get('SECRET_KEY')
    if os.path.exists(secret_file):
        with open(secret_file, 'r') as f:
            return f.read().strip()
    new_key = secrets.token_hex(32)
    with open(secret_file, 'w') as f:
        f.write(new_key)
    return new_key

app.config['SECRET_KEY'] = get_secret_key()
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max upload

# Ensure database is always initialized
init_db()

# Start daily backup service (runs in a daemon thread)
if not os.environ.get('TESTING'):
    start_backup_service('sysadmin_notes.db')

class ProxyDispatcherMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        prefix = get_base_url().rstrip('/')
        if prefix and environ.get('PATH_INFO', '').startswith(prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(prefix):]
            if not environ['PATH_INFO']:
                environ['PATH_INFO'] = '/'
            environ['SCRIPT_NAME'] = prefix
        return self.app(environ, start_response)

app.wsgi_app = ProxyDispatcherMiddleware(app.wsgi_app)

@app.before_request
def force_https():
    request.environ['wsgi.url_scheme'] = 'https'

@app.errorhandler(Exception)
def handle_exception(e):
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return e
    import traceback
    with open('error_log.txt', 'a') as f:
        f.write(traceback.format_exc() + '\n')
    return "Internal Server Error", 500

@app.after_request
def add_security_headers(response):
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: blob:; "
        "connect-src 'self';"
    )
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    # Enable caching for static assets for high performance in production
    if request.path.startswith('/static/') or request.path.startswith('/uploads/'):
        response.headers['Cache-Control'] = 'public, max-age=31536000'
    else:
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response

# Register Blueprints
from routes.ui import ui_bp
from routes.auth import auth_bp
from routes.notes import notes_bp
from routes.admin import admin_bp

app.register_blueprint(ui_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(notes_bp)
app.register_blueprint(admin_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005, ssl_context=('cert.pem', 'key.pem'))
