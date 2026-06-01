def test_login_success(client):
    response = client.post('/api/login', json={
        'username': 'admin',  # the default admin created in init_db
        'password': 'admin'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert 'token' in data
    assert 'role' in data
    assert data['role'] == 'admin'

def test_login_failure(client):
    response = client.post('/api/login', json={
        'username': 'admin',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    assert 'Invalid credentials' in response.get_json()['message']

def test_login_missing_fields(client):
    response = client.post('/api/login', json={
        'username': 'admin'
    })
    assert response.status_code == 401
