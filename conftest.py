import pytest
import tempfile
import os
os.environ['TESTING'] = '1'

import sqlite3
import app as my_app
import database
from auth import generate_token

@pytest.fixture(scope="session", autouse=True)
def mock_db_path():
    """Create a temporary database file for all tests."""
    db_fd, db_path = tempfile.mkstemp()
    
    # Patch the DATABASE_PATH in database module BEFORE init_db is called
    database.DATABASE_PATH = db_path
    
    # Initialize the test database with the schema
    with my_app.app.app_context():
        database.init_db()
        
    yield db_path
    
    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client():
    """A test client for the app."""
    my_app.app.config['TESTING'] = True
    # We should also ensure the background backup thread doesn't interfere, but it uses the original path
    with my_app.app.test_client() as client:
        yield client

@pytest.fixture
def admin_token():
    """Generates an admin JWT token for tests."""
    # Ensure there's an admin user in the test DB
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE role = 'admin'")
    admin = cursor.fetchone()
    if not admin:
        from werkzeug.security import generate_password_hash
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ('testadmin', generate_password_hash('testpass'), 'admin'))
        conn.commit()
        admin_id = cursor.lastrowid
    else:
        admin_id = admin['id']
    conn.close()
    
    with my_app.app.app_context():
        return generate_token(admin_id, 'testadmin', 'admin')

@pytest.fixture
def user_token():
    """Generates a regular author JWT token for tests."""
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE role = 'author' AND username = 'testuser'")
    user = cursor.fetchone()
    if not user:
        from werkzeug.security import generate_password_hash
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ('testuser', generate_password_hash('testpass'), 'author'))
        conn.commit()
        user_id = cursor.lastrowid
    else:
        user_id = user['id']
    conn.close()
    
    with my_app.app.app_context():
        return generate_token(user_id, 'testuser', 'author')

@pytest.fixture
def moderator_token():
    """Generates a moderator JWT token for tests."""
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE role = 'moderator' AND username = 'testmod'")
    user = cursor.fetchone()
    if not user:
        from werkzeug.security import generate_password_hash
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ('testmod', generate_password_hash('testpass'), 'moderator'))
        conn.commit()
        user_id = cursor.lastrowid
    else:
        user_id = user['id']
    conn.close()
    
    with my_app.app.app_context():
        return generate_token(user_id, 'testmod', 'moderator')

@pytest.fixture
def admin_client(client, admin_token):
    """Test client authenticated as admin."""
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {admin_token}'
    return client

@pytest.fixture
def user_client(client, user_token):
    """Test client authenticated as regular author."""
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {user_token}'
    return client

@pytest.fixture
def moderator_client(client, moderator_token):
    """Test client authenticated as moderator."""
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {moderator_token}'
    return client
