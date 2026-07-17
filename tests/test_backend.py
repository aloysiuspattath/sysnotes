import unittest
import os
import json
import tempfile
import sqlite3
from werkzeug.security import generate_password_hash

# Ensure we are in testing mode and use a temp database
os.environ['TESTING'] = '1'

import app as flask_app
import database

class BackendTestCase(unittest.TestCase):
    db_fd = None
    db_path = None

    @classmethod
    def setUpClass(cls):
        # Create a temporary file for the database
        cls.db_fd, cls.db_path = tempfile.mkstemp()
        database.DATABASE_PATH = cls.db_path
        
        # Configure app
        flask_app.app.config['TESTING'] = True
        flask_app.app.config['SECRET_KEY'] = 'test-secret-key-12345'
        
        # Initialize test DB schema
        with flask_app.app.app_context():
            database.init_db()

    @classmethod
    def tearDownClass(cls):
        # Close and remove the temporary database file
        if cls.db_fd:
            os.close(cls.db_fd)
        if cls.db_path and os.path.exists(cls.db_path):
            os.unlink(cls.db_path)

    def setUp(self):
        self.client = flask_app.app.test_client()
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        
        # Clean existing notes/users to have a fresh state
        self.cursor.execute("DELETE FROM notes")
        self.cursor.execute("DELETE FROM note_revisions")
        self.cursor.execute("DELETE FROM users WHERE username != 'admin'")
        self.cursor.execute("DELETE FROM audit_logs")
        self.conn.commit()
        
        # Setup default test users
        # Admin is already created in init_db but let's make sure auth_type = 'local'
        self.cursor.execute("UPDATE users SET password_hash = ?, auth_type = 'local' WHERE role = 'admin'",
                            (generate_password_hash("Admin123"),))
        
        # Create an author
        self.cursor.execute(
            "INSERT INTO users (username, password_hash, role, auth_type) VALUES (?, ?, ?, ?)",
            ("author1", generate_password_hash("Author123"), "author", "local")
        )
        self.author1_id = self.cursor.lastrowid
        
        # Create another author
        self.cursor.execute(
            "INSERT INTO users (username, password_hash, role, auth_type) VALUES (?, ?, ?, ?)",
            ("author2", generate_password_hash("Author123"), "author", "local")
        )
        self.author2_id = self.cursor.lastrowid

        # Create a moderator
        self.cursor.execute(
            "INSERT INTO users (username, password_hash, role, auth_type) VALUES (?, ?, ?, ?)",
            ("moderator1", generate_password_hash("Mod123"), "moderator", "local")
        )
        self.moderator1_id = self.cursor.lastrowid
        
        # Fetch admin ID
        self.cursor.execute("SELECT id FROM users WHERE role = 'admin'")
        self.admin_id = self.cursor.fetchone()['id']
        
        self.conn.commit()

        # Generate standard tokens
        self.admin_token = self._login_and_get_token("admin", "Admin123")
        self.author1_token = self._login_and_get_token("author1", "Author123")
        self.author2_token = self._login_and_get_token("author2", "Author123")
        self.moderator1_token = self._login_and_get_token("moderator1", "Mod123")

    def tearDown(self):
        self.conn.close()

    def _login_and_get_token(self, username, password):
        response = self.client.post('/api/login', json={
            'username': username,
            'password': password,
            'login_type': 'local'
        })
        self.assertEqual(response.status_code, 200, f"Login failed for {username}")
        return response.get_json()['token']

    # 1. Authentication (JWT token login, mock/test user signup & login)
    def test_authentication(self):
        # Attempt login with correct local credentials
        response = self.client.post('/api/login', json={
            'username': 'author1',
            'password': 'Author123',
            'login_type': 'local'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('token', data)
        self.assertEqual(data['role'], 'author')

        # Attempt login with incorrect credentials
        response = self.client.post('/api/login', json={
            'username': 'author1',
            'password': 'WrongPassword123',
            'login_type': 'local'
        })
        self.assertEqual(response.status_code, 401)

        # Admin user creation signup test
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.post('/api/users', json={
            'username': 'newuser',
            'password': 'Newuserpassword1',
            'role': 'author',
            'auth_type': 'local'
        }, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        # Verify the newly signed-up user can log in
        token = self._login_and_get_token('newuser', 'Newuserpassword1')
        self.assertIsNotNone(token)

    # 2. Note CRUD operations (create, read, update, delete)
    def test_note_crud_operations(self):
        headers = {'Authorization': f'Bearer {self.author1_token}'}
        
        # CREATE
        response = self.client.post('/api/notes', json={
            'title': 'CRUD Note Title',
            'note_type': 'command',
            'command': 'cat /etc/hosts',
            'description': 'View host entries'
        }, headers=headers)
        self.assertEqual(response.status_code, 201)
        note_id = response.get_json()['id']
        self.assertIsNotNone(note_id)

        # READ (via direct endpoint as creator)
        response = self.client.get(f'/api/notes/{note_id}', headers=headers)
        self.assertEqual(response.status_code, 200)
        note_data = response.get_json()
        self.assertEqual(note_data['title'], 'CRUD Note Title')
        self.assertEqual(note_data['command'], 'cat /etc/hosts')

        # UPDATE
        response = self.client.put(f'/api/notes/{note_id}', json={
            'title': 'CRUD Note Title - Updated',
            'note_type': 'command',
            'command': 'cat /etc/resolv.conf',
            'description': 'Updated description',
            'is_autosave': False
        }, headers=headers)
        self.assertEqual(response.status_code, 200)
        
        # Verify update
        response = self.client.get(f'/api/notes/{note_id}', headers=headers)
        self.assertEqual(response.status_code, 200)
        note_data = response.get_json()
        self.assertEqual(note_data['title'], 'CRUD Note Title - Updated')
        self.assertEqual(note_data['command'], 'cat /etc/resolv.conf')

        # DELETE
        response = self.client.delete(f'/api/notes/{note_id}', headers=headers)
        self.assertEqual(response.status_code, 200)

        # Verify read fails after deletion
        response = self.client.get(f'/api/notes/{note_id}', headers=headers)
        self.assertEqual(response.status_code, 404)

    # 3. Draft vs Published notes visibility
    # Verify draft notes (approved=0) are excluded from general feed, but visible to creator
    def test_draft_visibility(self):
        headers1 = {'Authorization': f'Bearer {self.author1_token}'}
        headers2 = {'Authorization': f'Bearer {self.author2_token}'}
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}

        # Create draft note as author1 (approved will be 0)
        response = self.client.post('/api/notes', json={
            'title': 'Author1 Draft Note',
            'note_type': 'command',
            'command': 'ls -la',
            'description': 'Author1 secret commands'
        }, headers=headers1)
        self.assertEqual(response.status_code, 201)
        note_id = response.get_json()['id']
        
        # 1. Verify anonymous/public dashboard feed (approved=1 only) excludes it
        response = self.client.get('/api/notes')
        self.assertEqual(response.status_code, 200)
        notes = response.get_json()
        self.assertFalse(any(n['id'] == note_id for n in notes))

        # 2. Verify author1 CAN see their own draft note in the pending list
        response = self.client.get('/api/notes?status=pending', headers=headers1)
        self.assertEqual(response.status_code, 200)
        notes = response.get_json()
        self.assertTrue(any(n['id'] == note_id for n in notes))

        # 3. Verify author2 CANNOT see author1's draft note in the pending list
        response = self.client.get('/api/notes?status=pending', headers=headers2)
        self.assertEqual(response.status_code, 200)
        notes = response.get_json()
        self.assertFalse(any(n['id'] == note_id for n in notes))

        # 4. Verify admin CAN see the pending draft note
        response = self.client.get('/api/notes?status=pending', headers=admin_headers)
        self.assertEqual(response.status_code, 200)
        notes = response.get_json()
        self.assertTrue(any(n['id'] == note_id for n in notes))

        # 5. Verify direct GET access is allowed for creator (author1)
        response = self.client.get(f'/api/notes/{note_id}', headers=headers1)
        self.assertEqual(response.status_code, 200)

        # 6. Verify direct GET access is denied for other author (author2)
        response = self.client.get(f'/api/notes/{note_id}', headers=headers2)
        self.assertEqual(response.status_code, 403)

    # 4. Role-based permissions
    # admin/moderator get immediate approval on publish; authors trigger 'approved = 0' pending status
    def test_role_based_permissions(self):
        # Create as Admin
        admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.post('/api/notes', json={
            'title': 'Admin Note',
            'note_type': 'command',
            'command': 'echo admin'
        }, headers=admin_headers)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.get_json()['approved'])

        # Create as Moderator
        mod_headers = {'Authorization': f'Bearer {self.moderator1_token}'}
        response = self.client.post('/api/notes', json={
            'title': 'Mod Note',
            'note_type': 'command',
            'command': 'echo mod'
        }, headers=mod_headers)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.get_json()['approved'])

        # Create as Author
        author_headers = {'Authorization': f'Bearer {self.author1_token}'}
        response = self.client.post('/api/notes', json={
            'title': 'Author Note',
            'note_type': 'command',
            'command': 'echo author'
        }, headers=author_headers)
        self.assertEqual(response.status_code, 201)
        self.assertFalse(response.get_json()['approved'])

    # 5. Note revisions
    # verify _create_revision inserts a revision on manual updates, but bypasses on autosaves
    def test_note_revisions(self):
        headers = {'Authorization': f'Bearer {self.author1_token}'}
        
        # Create note
        response = self.client.post('/api/notes', json={
            'title': 'Version 1',
            'note_type': 'command',
            'command': 'echo v1'
        }, headers=headers)
        note_id = response.get_json()['id']

        # Manual update (is_autosave = False)
        response = self.client.put(f'/api/notes/{note_id}', json={
            'title': 'Version 2',
            'note_type': 'command',
            'command': 'echo v2',
            'is_autosave': False
        }, headers=headers)
        self.assertEqual(response.status_code, 200)

        # Check that 1 revision was created with the previous state (Version 1)
        self.cursor.execute("SELECT * FROM note_revisions WHERE note_id = ?", (note_id,))
        revisions = self.cursor.fetchall()
        self.assertEqual(len(revisions), 1)
        self.assertEqual(revisions[0]['title'], 'Version 1')
        self.assertEqual(revisions[0]['command'], 'echo v1')

        # Autosave update (is_autosave = True)
        response = self.client.put(f'/api/notes/{note_id}', json={
            'title': 'Version 3 (Autosaved)',
            'note_type': 'command',
            'command': 'echo v3',
            'is_autosave': True
        }, headers=headers)
        self.assertEqual(response.status_code, 200)

        # Verify no new revision was added (revisions count remains 1)
        self.cursor.execute("SELECT * FROM note_revisions WHERE note_id = ?", (note_id,))
        revisions = self.cursor.fetchall()
        self.assertEqual(len(revisions), 1)

    # 6. Revision restoration
    # verify restoring note state works and logs current state before restore
    def test_revision_restoration(self):
        headers = {'Authorization': f'Bearer {self.author1_token}'}
        
        # Create note
        response = self.client.post('/api/notes', json={
            'title': 'First Title',
            'note_type': 'command',
            'command': 'echo first'
        }, headers=headers)
        note_id = response.get_json()['id']

        # Manual Update -> title becomes "Second Title", creates revision 1 ("First Title")
        self.client.put(f'/api/notes/{note_id}', json={
            'title': 'Second Title',
            'note_type': 'command',
            'command': 'echo second',
            'is_autosave': False
        }, headers=headers)

        # Manual Update -> title becomes "Third Title", creates revision 2 ("Second Title")
        self.client.put(f'/api/notes/{note_id}', json={
            'title': 'Third Title',
            'note_type': 'command',
            'command': 'echo third',
            'is_autosave': False
        }, headers=headers)

        # Fetch revisions list
        response = self.client.get(f'/api/notes/{note_id}/revisions', headers=headers)
        self.assertEqual(response.status_code, 200)
        revisions = response.get_json()
        self.assertEqual(len(revisions), 2)
        
        # Let's restore the first revision (should be the oldest one, which corresponds to index 1 or timestamp order)
        # Sort them by id ascending so first created is index 0
        revisions_sorted = sorted(revisions, key=lambda x: x['id'])
        first_revision = revisions_sorted[0]
        self.assertEqual(first_revision['title'], 'First Title')

        # Restore to first revision
        restore_response = self.client.post(f'/api/notes/{note_id}/revisions/{first_revision["id"]}/restore', headers=headers)
        self.assertEqual(restore_response.status_code, 200)

        # 1. Verify note state is restored
        response = self.client.get(f'/api/notes/{note_id}', headers=headers)
        note_data = response.get_json()
        self.assertEqual(note_data['title'], 'First Title')
        self.assertEqual(note_data['command'], 'echo first')

        # 2. Verify the pre-restore state ("Third Title") was saved as a revision
        self.cursor.execute("SELECT * FROM note_revisions WHERE note_id = ? ORDER BY id DESC LIMIT 1", (note_id,))
        latest_rev = self.cursor.fetchone()
        self.assertEqual(latest_rev['title'], 'Third Title')

        # 3. Verify audit log logs the restoration
        self.cursor.execute("SELECT * FROM audit_logs WHERE note_id = ? AND action = 'RESTORED' ORDER BY timestamp DESC", (note_id,))
        log = self.cursor.fetchone()
        self.assertIsNotNone(log)
        self.assertIn("Restored note to revision", log['details'])

    # 7. Team isolation and segregation tests
    def test_team_isolation_and_segregation(self):
        # Create two teams
        self.cursor.execute("INSERT INTO teams (name, description) VALUES ('Team A', 'Description A')")
        team_a_id = self.cursor.lastrowid
        self.cursor.execute("INSERT INTO teams (name, description) VALUES ('Team B', 'Description B')")
        team_b_id = self.cursor.lastrowid
        self.conn.commit()

        # Allocate user 'author1' to Team A
        headers_admin = {'Authorization': f'Bearer {self.admin_token}'}
        response = self.client.put(f'/api/users/{self.author1_id}', json={
            'team_ids': [team_a_id]
        }, headers=headers_admin)
        self.assertEqual(response.status_code, 200)

        # Allocate user 'author2' to Team B
        response = self.client.put(f'/api/users/{self.author2_id}', json={
            'team_ids': [team_b_id]
        }, headers=headers_admin)
        self.assertEqual(response.status_code, 200)

        # Re-login users to refresh their JWT tokens with team claims
        self.author1_token = self._login_and_get_token("author1", "Author123")
        self.author2_token = self._login_and_get_token("author2", "Author123")

        headers_author1 = {'Authorization': f'Bearer {self.author1_token}'}
        headers_author2 = {'Authorization': f'Bearer {self.author2_token}'}

        # 1. Create a Global Note (approved)
        response = self.client.post('/api/notes', json={
            'title': 'Global Note',
            'note_type': 'command',
            'command': 'echo global',
            'visibility': 'global'
        }, headers=headers_author1)
        global_note_id = response.get_json()['id']
        self.client.post(f'/api/notes/{global_note_id}/approve', headers=headers_admin)

        # 2. Create a Team A Note (approved)
        response = self.client.post('/api/notes', json={
            'title': 'Team A Note',
            'note_type': 'command',
            'command': 'echo teamA',
            'visibility': 'team',
            'team_id': team_a_id
        }, headers=headers_author1)
        team_a_note_id = response.get_json()['id']
        self.client.post(f'/api/notes/{team_a_note_id}/approve', headers=headers_admin)

        # 3. Create a Team B Note (approved)
        response = self.client.post('/api/notes', json={
            'title': 'Team B Note',
            'note_type': 'command',
            'command': 'echo teamB',
            'visibility': 'team',
            'team_id': team_b_id
        }, headers=headers_author2)
        team_b_note_id = response.get_json()['id']
        self.client.post(f'/api/notes/{team_b_note_id}/approve', headers=headers_admin)

        # Verify Author 1 (Team A) list notes:
        # Should see Global Note and Team A Note, but NOT Team B Note.
        response = self.client.get('/api/notes', headers=headers_author1)
        notes_author1 = response.get_json()
        note_ids_author1 = [n['id'] for n in notes_author1]
        self.assertIn(global_note_id, note_ids_author1)
        self.assertIn(team_a_note_id, note_ids_author1)
        self.assertNotIn(team_b_note_id, note_ids_author1)

        # Verify Author 2 (Team B) list notes:
        # Should see Global Note and Team B Note, but NOT Team A Note.
        response = self.client.get('/api/notes', headers=headers_author2)
        notes_author2 = response.get_json()
        note_ids_author2 = [n['id'] for n in notes_author2]
        self.assertIn(global_note_id, note_ids_author2)
        self.assertIn(team_b_note_id, note_ids_author2)
        self.assertNotIn(team_a_note_id, note_ids_author2)

        # Verify direct endpoint access controls:
        # Author 1 can view Team A note, but access denied for Team B note.
        response = self.client.get(f'/api/notes/{team_a_note_id}', headers=headers_author1)
        self.assertEqual(response.status_code, 200)
        
        response = self.client.get(f'/api/notes/{team_b_note_id}', headers=headers_author1)
        self.assertEqual(response.status_code, 403)

    def test_note_favorites(self):
        headers_author1 = {'Authorization': 'Bearer ' + self.author1_token}
        
        # Create a note
        note_data = {
            'title': 'Fav Test Note',
            'command': 'echo 1',
            'description': 'fav desc',
            'note_type': 'command',
            'status': 'published'
        }
        res = self.client.post('/api/notes', json=note_data, headers=headers_author1)
        note_id = res.get_json()['id']
        
        # Approve the note via admin
        self.client.post(f'/api/notes/{note_id}/approve', headers={'Authorization': 'Bearer ' + self.admin_token})

        # Fetch notes: is_favorite should be False initially
        res = self.client.get('/api/notes', headers=headers_author1)
        self.assertFalse(res.get_json()[0]['is_favorite'])

        # Toggle favorite: should return is_favorite=True
        res = self.client.post(f'/api/notes/{note_id}/favorite', headers=headers_author1)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['is_favorite'])

        # Fetch notes: is_favorite should now be True
        res = self.client.get('/api/notes', headers=headers_author1)
        self.assertTrue(res.get_json()[0]['is_favorite'])

        # Filter by favorite=true
        res = self.client.get('/api/notes?favorite=true', headers=headers_author1)
        self.assertEqual(len(res.get_json()), 1)
        self.assertEqual(res.get_json()[0]['id'], note_id)

        # Toggle favorite again: should return is_favorite=False
        res = self.client.post(f'/api/notes/{note_id}/favorite', headers=headers_author1)
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.get_json()['is_favorite'])

        # Filter by favorite=true: should be empty
        res = self.client.get('/api/notes?favorite=true', headers=headers_author1)
        self.assertEqual(len(res.get_json()), 0)

    def test_note_quick_access(self):
        headers_author1 = {'Authorization': 'Bearer ' + self.author1_token}
        
        # Create two notes
        note1_res = self.client.post('/api/notes', json={
            'title': 'QA Note 1',
            'command': 'echo 1',
            'description': 'desc 1',
            'note_type': 'command',
            'status': 'published'
        }, headers=headers_author1)
        note1_id = note1_res.get_json()['id']

        note2_res = self.client.post('/api/notes', json={
            'title': 'QA Note 2',
            'command': 'echo 2',
            'description': 'desc 2',
            'note_type': 'command',
            'status': 'published'
        }, headers=headers_author1)
        note2_id = note2_res.get_json()['id']

        # Approve both
        headers_admin = {'Authorization': 'Bearer ' + self.admin_token}
        self.client.post(f'/api/notes/{note1_id}/approve', headers=headers_admin)
        self.client.post(f'/api/notes/{note2_id}/approve', headers=headers_admin)

        # Trigger access increments by calling get_note_by_id
        # Access note 2 twice, note 1 once
        self.client.get(f'/api/notes/{note2_id}', headers=headers_author1)
        self.client.get(f'/api/notes/{note2_id}', headers=headers_author1)
        self.client.get(f'/api/notes/{note1_id}', headers=headers_author1)

        # Fetch frequent notes
        res = self.client.get('/api/notes/frequent', headers=headers_author1)
        self.assertEqual(res.status_code, 200)
        frequent = res.get_json()
        self.assertEqual(len(frequent), 2)
        
        # Note 2 must be first since it has 2 accesses, and Note 1 second with 1 access
        self.assertEqual(frequent[0]['id'], note2_id)
        self.assertEqual(frequent[1]['id'], note1_id)

if __name__ == '__main__':
    unittest.main()
