def test_get_categories(client):
    response = client.get('/api/categories')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)

def test_create_category_as_admin(admin_client):
    response = admin_client.post('/api/categories', json={
        'name': 'Test Category'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'Category created'
    assert 'id' in data

def test_create_category_as_user(user_client):
    response = user_client.post('/api/categories', json={
        'name': 'Hacker Category'
    })
    assert response.status_code == 403
    assert 'Admin privilege required' in response.get_json()['message']

def test_delete_category_as_admin(admin_client):
    # First create
    create_response = admin_client.post('/api/categories', json={'name': 'Delete Me'})
    cat_id = create_response.get_json()['id']
    
    # Then delete
    del_response = admin_client.delete(f'/api/categories/{cat_id}')
    assert del_response.status_code == 200
    assert del_response.get_json()['message'] == 'Category deleted successfully'
