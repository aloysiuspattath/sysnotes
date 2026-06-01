import json

def test_create_note_unauthorized(client):
    response = client.post('/api/notes', json={
        'title': 'Test Note',
        'note_type': 'command',
        'command': 'echo test'
    })
    assert response.status_code == 401

def test_create_command_note(user_client):
    response = user_client.post('/api/notes', json={
        'title': 'My Command Note',
        'note_type': 'command',
        'command': 'ls -l',
        'description': 'Lists files'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'Note created'
    assert 'id' in data

def test_create_procedure_note(user_client):
    response = user_client.post('/api/notes', json={
        'title': 'My Procedure Note',
        'note_type': 'procedure',
        'steps': [
            {'title': 'Step 1', 'command': 'echo 1', 'description': 'desc 1'},
            {'title': 'Step 2', 'command': 'echo 2', 'description': 'desc 2'}
        ]
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data

def test_create_plain_note(user_client):
    response = user_client.post('/api/notes', json={
        'title': 'My Plain Note',
        'note_type': 'plain',
        'description': 'This is just some text.'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert 'id' in data

def test_get_notes(client, user_client):
    # First create a note
    user_client.post('/api/notes', json={
        'title': 'Searchable Note',
        'note_type': 'plain',
        'description': 'Content'
    })
    
    # Fetch notes
    response = client.get('/api/notes')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    
    # We expect at least the note we just created
    assert any(note['title'] == 'Searchable Note' for note in data)

def test_search_notes(client, user_client):
    # Fetch notes with query
    response = client.get('/api/notes?q=Searchable')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 1
    assert data[0]['title'] == 'Searchable Note'
