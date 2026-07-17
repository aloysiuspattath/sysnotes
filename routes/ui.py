import os
from flask import Blueprint, render_template, send_from_directory, current_app, abort, redirect
from db_helper import get_db, get_base_url
from database import UPLOADS_DIR

ui_bp = Blueprint('ui', __name__)

@ui_bp.route('/')
def serve_index():
    return render_template('index.html', base_url=get_base_url())

@ui_bp.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(current_app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@ui_bp.route('/t/<team_name>')
@ui_bp.route('/<team_name>')
def serve_team_index(team_name):
    # Exclude system folders, favicon and static assets
    if team_name in ['static', 'uploads', 'api', 'note', 'favicon.ico', 'robots.txt'] or '.' in team_name:
        abort(404)
        
    conn = get_db()
    try:
        cursor = conn.cursor()
        # Find if the team name exists in the database
        cursor.execute("SELECT name FROM teams WHERE LOWER(name) = ?", (team_name.lower(),))
        row = cursor.fetchone()
        if row:
            # Render index.html with the selected team
            return render_template('index.html', base_url=get_base_url(), default_team=row['name'])
    finally:
        conn.close()
        
    return redirect('/')

@ui_bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    mimetype = None
    if ext == 'pdf':
        mimetype = 'application/pdf'
    elif ext == 'txt':
        mimetype = 'text/plain'
    elif ext == 'csv':
        mimetype = 'text/csv'
    
    if mimetype:
        resp = send_from_directory(UPLOADS_DIR, filename, mimetype=mimetype)
        if ext == 'pdf':
            resp.headers['Content-Disposition'] = f'inline; filename="{filename}"'
        return resp
    return send_from_directory(UPLOADS_DIR, filename)

@ui_bp.route('/note/<int:note_id>')
def note_detail_page(note_id):
    return render_template('note_detail.html', note_id=note_id, base_url=get_base_url())
