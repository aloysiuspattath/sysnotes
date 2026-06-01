import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app
from database import get_db

# Timezone-aware UTC helper (avoids deprecation warning)
_UTC = datetime.timezone.utc

def generate_token(user_id, username, role):
    now = datetime.datetime.now(_UTC)
    payload = {
        'exp': now + datetime.timedelta(days=7),
        'iat': now,
        'sub': str(user_id),
        'username': username,
        'role': role
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
        return f(*args, **kwargs)
    return decorated
