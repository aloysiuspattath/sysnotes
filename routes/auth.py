import os
import xml.etree.ElementTree as ET
import html
import requests
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from db_helper import get_db
from auth import generate_token, decode_token, login_required, admin_required

# Disable insecure request warning for self-signed certificates
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

auth_bp = Blueprint('auth', __name__)

def check_ad_login(username, password):
    url = os.environ.get('AD_SERVER_URL', 'https://10.250.7.210/sso/adloginwithRoles.asmx')
    username = html.escape(username)
    password = html.escape(password)

    payload = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <userAttributes xmlns="http://tempuri.org/">
      <username>{username}</username>
      <password>{password}</password>
    </userAttributes>
  </soap12:Body>
</soap12:Envelope>"""

    headers = {'Content-Type': 'application/soap+xml'}

    try:
        response = requests.post(url, headers=headers, data=payload, verify=False, timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"AD server connection failed: {e}")
        return ("ERROR", None)

    root = ET.fromstring(response.text)
    result_element = root.find('.//{*}Result')
    name_element = root.find('.//{*}Name')
    if result_element is not None:
        return (result_element.text, name_element.text if name_element is not None else username)
    else:
        return ("FAILED", None)

def validate_password(password):
    """Enforce minimum password complexity requirements."""
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    if not any(c.isdigit() for c in password):
        return False, 'Password must contain at least one number'
    if not any(c.isupper() for c in password):
        return False, 'Password must contain at least one uppercase letter'
    return True, ''

@auth_bp.route('/api/login', methods=['POST'])
def login():
    conn = get_db()
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        requested_login_type = data.get('login_type')

        if not username or not password:
            return jsonify({'message': 'Invalid credentials'}), 401

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401

        login_type = user['auth_type']
        
        # Enforce that the user selected the correct authentication type
        if requested_login_type and requested_login_type != login_type:
            return jsonify({'message': 'Invalid credentials'}), 401

        if login_type == 'local':
            import datetime as _dt
            if user['locked_until']:
                locked_until = _dt.datetime.strptime(user['locked_until'], '%Y-%m-%d %H:%M:%S')
                now = _dt.datetime.utcnow()
                if now < locked_until:
                    remaining = int((locked_until - now).total_seconds() // 60) + 1
                    return jsonify({'message': f'Account temporarily locked. Try again in {remaining} minute(s)'}), 429
                else:
                    # Lock expired, reset failed attempts
                    cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", (user['id'],))
                    conn.commit()

        auth_success = False
        display_name = None

        if login_type == 'ad':
            loginFlg, ADName = check_ad_login(username, password)
            if loginFlg == 'SUCCESS':
                auth_success = True
                display_name = ADName
        else:
            if check_password_hash(user['password_hash'], password):
                auth_success = True

        if auth_success:
            if login_type == 'local':
                cursor.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?", (user['id'],))
                conn.commit()
            
            token = generate_token(user['id'], user['username'], user['role'])
            from database import get_user_teams
            teams = get_user_teams(user['id'])
            resp = {
                'token': token, 
                'role': user['role'], 
                'username': user['username'], 
                'teams': [{'id': t['id'], 'name': t['name']} for t in teams]
            }
            if display_name:
                resp['display_name'] = display_name
            return jsonify(resp)
        else:
            if login_type == 'local':
                failed_attempts = (user['failed_attempts'] or 0) + 1
                import datetime as _dt
                if failed_attempts >= 5:
                    locked_until = (_dt.datetime.utcnow() + _dt.timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M:%S')
                    cursor.execute("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", (failed_attempts, locked_until, user['id']))
                    conn.commit()
                    return jsonify({'message': 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.'}), 429
                else:
                    cursor.execute("UPDATE users SET failed_attempts = ? WHERE id = ?", (failed_attempts, user['id']))
                    conn.commit()
            return jsonify({'message': 'Invalid credentials'}), 401
    finally:
        conn.close()

@auth_bp.route('/api/change-password', methods=['POST'])
@login_required
def change_password():
    conn = get_db()
    try:
        data = request.json
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not old_password or not new_password:
            return jsonify({'message': 'Old password and new password required'}), 400

        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'message': msg}), 400

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (request.user['sub'],))
        user = cursor.fetchone()

        if not user or not check_password_hash(user['password_hash'], old_password):
            return jsonify({'message': 'Old password is incorrect'}), 400

        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                       (generate_password_hash(new_password), request.user['sub']))
        conn.commit()
        return jsonify({'message': 'Password changed successfully'})
    finally:
        conn.close()

@auth_bp.route('/api/users/<int:user_id>/reset-password', methods=['POST'])
@admin_required
def admin_reset_password(user_id):
    conn = get_db()
    try:
        data = request.json
        new_password = data.get('password')
        if not new_password or not new_password.strip():
            return jsonify({'message': 'Password cannot be empty'}), 400

        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'message': msg}), 400
            
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            return jsonify({'message': 'User not found'}), 404
            
        cursor.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (generate_password_hash(new_password), user_id)
        )
        conn.commit()
        return jsonify({'message': 'Password reset successfully'})
    finally:
        conn.close()
