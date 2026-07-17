import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from database import get_db

# Timezone-aware UTC helper (avoids deprecation warning)
_UTC = datetime.timezone.utc

def generate_token(user_id, username, role):
    from database import get_user_teams
    now = datetime.datetime.now(_UTC)
    teams = get_user_teams(user_id)
    team_ids = [t['id'] for t in teams]
    payload = {
        'exp': now + datetime.timedelta(days=7),
        'iat': now,
        'sub': str(user_id),
        'username': username,
        'role': role,
        'teams': team_ids
    }
    return jwt.encode(payload, current_app.config.get('SECRET_KEY'), algorithm='HS256')

def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config.get('SECRET_KEY'), algorithms=['HS256'])
        # Convert 'sub' back to int for database lookups
        payload['sub'] = int(payload['sub'])
        return payload
    except jwt.ExpiredSignatureError:
        return 'Signature expired. Please log in again.'
    except jwt.InvalidTokenError:
        return 'Invalid token. Please log in again.'

def update_user_activity(payload):
    user_id = payload.get('sub') if isinstance(payload, dict) else None
    if not user_id:
        return
    from cache_helper import activity_cache
    if activity_cache.get(user_id) is not None:
        return
    activity_cache.set(user_id, True)
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error updating user activity: {e}")

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
            
        payload = decode_token(token)
        if isinstance(payload, str):
            return jsonify({'message': payload}), 401
            
        request.user = payload
        update_user_activity(payload)
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
            
        payload = decode_token(token)
        if isinstance(payload, str):
            return jsonify({'message': payload}), 401
            
        if payload.get('role') != 'admin':
            return jsonify({'message': 'Admin privilege required!'}), 403
            
        request.user = payload
        update_user_activity(payload)
        return f(*args, **kwargs)
    return decorated
