import json

def test_create_note_unauthorized(client):
    response = client.post('/api/notes', json={
        'title': 'Test Note',
        'note_type': 'command',
        'command': 'echo test'
    })
    assert response.status_code == 401

def test_create_note_as_author_pending(client, user_token, moderator_token):
    # 1. Author creates a note
    headers = {'Authorization': f'Bearer {user_token}'}
    response = client.post('/api/notes', json={
        'title': 'Author Pending Note',
        'note_type': 'command',
        'command': 'ls -l',
        'description': 'Lists files'
    }, headers=headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'Note created and is pending approval'
    assert data['approved'] is False
    note_id = data['id']

    # 2. Verify anonymous client cannot see it on dashboard
    response = client.get('/api/notes')
    assert response.status_code == 200
    notes = response.get_json()
    assert not any(n['id'] == note_id for n in notes)

    # 2b. Verify author CAN see their own pending note on pending view
    response = client.get('/api/notes?status=pending', headers=headers)
    assert response.status_code == 200
    notes = response.get_json()
    assert any(n['id'] == note_id for n in notes)

    # 2c. Verify author CANNOT see it on the main dashboard feed
    response = client.get('/api/notes', headers=headers)
    assert response.status_code == 200
    notes = response.get_json()
    assert not any(n['id'] == note_id for n in notes)

    # 3. Verify anonymous client cannot search it
    response = client.get('/api/notes?q=Author')
    assert response.status_code == 200
    notes = response.get_json()
    assert not any(n['id'] == note_id for n in notes)

    # 4. Verify moderator can fetch it from the pending list
    mod_headers = {'Authorization': f'Bearer {moderator_token}'}
    response = client.get('/api/notes?status=pending', headers=mod_headers)
    assert response.status_code == 200
    notes = response.get_json()
    assert any(n['id'] == note_id for n in notes)

    # 5. Moderator approves the note
    response = client.post(f'/api/notes/{note_id}/approve', headers=mod_headers)
    assert response.status_code == 200

    # 6. Verify anonymous client can now see it on dashboard
    response = client.get('/api/notes')
    assert response.status_code == 200
    notes = response.get_json()
    assert any(n['id'] == note_id for n in notes)

    # 7. Author edits the note (which was approved)
    response = client.put(f'/api/notes/{note_id}', json={
        'title': 'Author Pending Note - Edited',
        'note_type': 'command',
        'command': 'ls -la',
        'description': 'Lists all files'
    }, headers=headers)
    assert response.status_code == 200

    # 8. Verify it goes back to pending (anonymous client cannot see it)
    response = client.get('/api/notes')
    assert response.status_code == 200
    notes = response.get_json()
    assert not any(n['id'] == note_id for n in notes)

    # 9. Verify moderator can see it in pending again and approves it
    response = client.get('/api/notes?status=pending', headers=mod_headers)
    assert response.status_code == 200
    notes = response.get_json()
    assert any(n['id'] == note_id for n in notes)

    response = client.post(f'/api/notes/{note_id}/approve', headers=mod_headers)
    assert response.status_code == 200

    # 10. Verify anonymous client can see it again
    response = client.get('/api/notes')
    assert response.status_code == 200
    notes = response.get_json()
    assert any(n['id'] == note_id for n in notes)

def test_create_note_as_moderator_auto_approved(client, moderator_token):
    mod_headers = {'Authorization': f'Bearer {moderator_token}'}
    response = client.post('/api/notes', json={
        'title': 'Moderator Auto Note',
        'note_type': 'command',
        'command': 'echo auto'
    }, headers=mod_headers)
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'Note created'
    assert data['approved'] is True
    note_id = data['id']

    # Verify anonymous client can see it immediately
    response = client.get('/api/notes')
    assert response.status_code == 200
    notes = response.get_json()
    assert any(n['id'] == note_id for n in notes)

def test_admin_reset_user_password(client, admin_token):
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    # First, let's create a user
    response = client.post('/api/users', json={
        'username': 'resetuser',
        'password': 'oldpassword',
        'role': 'author'
    }, headers=admin_headers)
    assert response.status_code == 201
    user_id = response.get_json()['id']

    # Verify old password works (login)
    response = client.post('/api/login', json={
        'username': 'resetuser',
        'password': 'oldpassword'
    })
    assert response.status_code == 200
    
    # Reset password as admin
    response = client.post(f'/api/users/{user_id}/reset-password', json={
        'password': 'newpassword123'
    }, headers=admin_headers)
    assert response.status_code == 200

    # Verify login with old password fails
    response = client.post('/api/login', json={
        'username': 'resetuser',
        'password': 'oldpassword'
    })
    assert response.status_code == 401

    # Verify login with new password succeeds
    response = client.post('/api/login', json={
        'username': 'resetuser',
        'password': 'newpassword123'
    })
    assert response.status_code == 200
