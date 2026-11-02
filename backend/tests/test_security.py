"""
The access rules, tested through the real routes.

No database and no S3: `get_db` is replaced by a stub and `s3_client` by a mock,
so these run anywhere. What they pin down is who gets refused and why, which is
exactly what a stub can show. They cannot show that a real query returns the right
rows, so the one query rule that matters here is asserted on the SQL itself.
"""

import base64
import io
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import bcrypt
import jwt
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app
from middleware.auth import JWT_SECRET, session_stamp
from models.base import get_db
from routes import auth as auth_routes
from routes import items as item_routes
from services import s3_service
from services.rate_limit import limiter
from services.s3_service import MAX_UPLOAD_BYTES, image_response

USER_ID = uuid.uuid4()
OTHER_WISHLIST_ID = uuid.uuid4()
PASSWORD = 'correct horse battery staple'
PASSWORD_HASH = bcrypt.hashpw(PASSWORD.encode('utf-8'), bcrypt.gensalt(4)).decode('utf-8')

def png_bytes(size=(4, 4)) -> bytes:
    buffer = io.BytesIO()
    Image.new('RGB', size, (200, 30, 30)).save(buffer, 'PNG')
    return buffer.getvalue()

def make_user(**overrides) -> SimpleNamespace:
    fields = dict(
        id=USER_ID, email='a@example.com', username='a', name='A', pfp=None,
        password=PASSWORD_HASH, is_active=True, created_at=datetime.now(timezone.utc),
        hat_size=None, shirt_size=None, pants_size=None, shoe_size=None,
        ring_size=None, dress_size=None, jacket_size=None,
    )
    fields.update(overrides)
    return SimpleNamespace(**fields)

def token_for(user, **claims) -> str:
    payload = {
        'sub': str(user.id),
        'sid': session_stamp(user),
        'exp': datetime.now(timezone.utc) + timedelta(days=1),
    }
    payload.update(claims)
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def bearer(user=None, **claims) -> dict:
    return {'Authorization': f'Bearer {token_for(user or make_user(), **claims)}'}

class StubDb:
    """Every query answers with `first_result`, whatever it asked for."""

    def __init__(self, first_result):
        self.query_chain = MagicMock()
        self.query_chain.filter.return_value = self.query_chain
        self.query_chain.options.return_value = self.query_chain
        self.query_chain.offset.return_value = self.query_chain
        self.query_chain.limit.return_value = self.query_chain
        self.query_chain.first.return_value = first_result
        self.query_chain.all.return_value = []
        self.committed = False

    def query(self, *args):
        return self.query_chain

    def add(self, row):
        pass

    def commit(self):
        self.committed = True

    def refresh(self, row):
        pass

@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)

@pytest.fixture
def use_db():
    def install(first_result):
        stub = StubDb(first_result)
        app.dependency_overrides[get_db] = lambda: stub
        return stub
    yield install
    app.dependency_overrides.clear()

@pytest.fixture
def s3(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr(s3_service, 's3_client', mock)
    return mock

@pytest.fixture(autouse=True)
def fresh_rate_limits():
    limiter.reset()
    yield
    limiter.reset()

# Removed routes -------------------------------------------------------------

@pytest.mark.parametrize('method, path', [
    ('get', '/users/'),
    ('post', '/users/'),
    ('get', f'/users/{USER_ID}'),
])
def test_anonymous_user_routes_are_gone(client, method, path):
    assert getattr(client, method)(path).status_code in (404, 405)

def test_the_public_user_route_does_not_expose_email(client, use_db):
    use_db(make_user())
    response = client.get(f'/users/public/{USER_ID}')
    assert response.status_code == 200
    assert 'email' not in response.json()

# Private lists --------------------------------------------------------------

def test_user_items_are_limited_to_public_lists(client, use_db):
    db = use_db(None)
    assert client.get(f'/wishlist/user/{USER_ID}').status_code == 200

    conditions = [str(arg) for call in db.query_chain.filter.call_args_list for arg in call.args]
    assert any('is_public' in condition for condition in conditions)

# Tokens ---------------------------------------------------------------------

def test_new_tokens_last_ninety_days():
    token = auth_routes.create_access_token({'sub': 'x'})
    payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    lifetime = datetime.fromtimestamp(payload['exp'], timezone.utc) - datetime.now(timezone.utc)
    assert timedelta(days=89, hours=23) < lifetime <= timedelta(days=90)

def test_a_current_token_is_accepted(client, use_db):
    user = make_user()
    use_db(user)
    assert client.get('/users/me', headers=bearer(user)).status_code == 200

def test_a_token_from_before_the_stamp_is_rejected(client, use_db):
    use_db(make_user())
    old_token = jwt.encode(
        {'sub': str(USER_ID), 'exp': datetime.now(timezone.utc) + timedelta(days=9000)},
        JWT_SECRET,
        algorithm='HS256'
    )
    response = client.get('/users/me', headers={'Authorization': f'Bearer {old_token}'})
    assert response.status_code == 401

def test_changing_the_password_signs_out_old_tokens(client, use_db):
    headers = bearer(make_user())
    use_db(make_user(password='a-different-hash'))
    assert client.get('/users/me', headers=headers).status_code == 401

def test_an_inactive_account_is_rejected(client, use_db):
    user = make_user(is_active=False)
    use_db(user)
    assert client.get('/users/me', headers=bearer(user)).status_code == 401

def test_a_deleted_account_is_rejected(client, use_db):
    headers = bearer(make_user())
    use_db(None)
    assert client.get('/users/me', headers=headers).status_code == 401

def test_a_bad_token_falls_back_to_anonymous_on_optional_routes(client, use_db):
    use_db(None)
    response = client.get(
        f'/wishlist/user/{USER_ID}',
        headers={'Authorization': 'Bearer not-a-token'}
    )
    assert response.status_code == 200

@pytest.mark.parametrize('form', [
    {'password': 'new-password'},
    {'password': 'new-password', 'current_password': 'wrong'},
])
def test_changing_the_password_needs_the_current_one(client, use_db, form):
    user = make_user()
    db = use_db(user)
    response = client.put(f'/users/{USER_ID}', headers=bearer(user), data=form)
    assert response.status_code == 403
    assert not db.committed

# Uploads --------------------------------------------------------------------

def test_html_is_refused_whatever_it_claims_to_be(client, use_db, s3):
    user = make_user()
    use_db(user)
    response = client.put(
        f'/users/{USER_ID}',
        headers=bearer(user),
        files={'profile_picture': ('photo.png', b'<script>alert(1)</script>', 'image/png')}
    )
    assert response.status_code == 400
    s3.put_object.assert_not_called()

def test_a_refused_upload_keeps_the_existing_image(client, use_db, s3):
    existing = 'https://test-bucket.s3.amazonaws.com/profile_pictures/old.png'
    user = make_user(pfp=existing)
    use_db(user)
    client.put(
        f'/users/{USER_ID}',
        headers=bearer(user),
        files={'profile_picture': ('photo.png', b'not an image', 'image/png')}
    )
    assert user.pfp == existing
    s3.delete_object.assert_not_called()

def test_extension_and_type_come_from_the_file_itself(client, use_db, s3):
    user = make_user()
    use_db(user)
    response = client.put(
        f'/users/{USER_ID}',
        headers=bearer(user),
        files={'profile_picture': ('evil.html', png_bytes(), 'text/html')}
    )
    assert response.status_code == 200
    stored = s3.put_object.call_args.kwargs
    assert stored['Key'].endswith('.png')
    assert stored['ContentType'] == 'image/png'

def test_a_huge_canvas_in_a_small_file_is_refused(client, use_db, s3):
    user = make_user()
    use_db(user)
    response = client.put(
        f'/users/{USER_ID}',
        headers=bearer(user),
        files={'profile_picture': ('big.png', png_bytes((6000, 6000)), 'image/png')}
    )
    assert response.status_code == 413
    s3.put_object.assert_not_called()

def test_an_oversized_request_is_stopped(client):
    # Sent as a stream, so there is no Content-Length for the limit to rely on.
    def body():
        for _ in range(12):
            yield b'x' * (1024 * 1024)

    response = client.post(
        '/auth/login',
        content=body(),
        headers={'Content-Type': 'application/json'}
    )
    assert response.status_code == 413

def test_stored_html_is_never_served_as_html():
    response = image_response({'ContentType': 'text/html', 'Body': io.BytesIO(b'<script>')})
    assert response.media_type == 'application/octet-stream'
    assert response.headers['X-Content-Type-Options'] == 'nosniff'

def test_stored_images_keep_their_type():
    response = image_response({'ContentType': 'image/png', 'Body': io.BytesIO(png_bytes())})
    assert response.media_type == 'image/png'

# Background removal ---------------------------------------------------------

def test_background_removal_needs_a_login(client, use_db):
    use_db(None)
    response = client.post(
        '/wishlist/process-image/remove-background',
        files={'image': ('a.png', png_bytes(), 'image/png')}
    )
    assert response.status_code == 401

def test_background_removal_is_size_bounded(client, use_db):
    user = make_user()
    use_db(user)
    response = client.post(
        '/wishlist/process-image/remove-background',
        headers=bearer(user),
        files={'image': ('a.png', png_bytes((3000, 1500)), 'image/png')}
    )
    assert response.status_code == 200

    encoded = response.json()['image_data_url'].split(',', 1)[1]
    assert Image.open(io.BytesIO(base64.b64decode(encoded))).size == (1200, 600)

# Item rules -----------------------------------------------------------------

def test_an_item_cannot_be_put_on_someone_elses_list(client, use_db):
    # The stub answers None to the ownership lookup, but auth needs the user.
    user = make_user()
    db = use_db(user)
    db.query_chain.first.side_effect = [user, None]
    response = client.post(
        '/wishlist/',
        headers=bearer(user),
        data={'name': 'Planted', 'wishlist_id': str(OTHER_WISHLIST_ID)}
    )
    assert response.status_code == 404
    assert not db.committed

def test_an_item_cannot_be_moved_onto_someone_elses_list(client, use_db):
    user = make_user()
    item = SimpleNamespace(id=uuid.uuid4(), image=None)
    db = use_db(user)
    db.query_chain.first.side_effect = [user, item, None]
    response = client.put(
        f'/wishlist/{item.id}',
        headers=bearer(user),
        data={'wishlist_id': str(OTHER_WISHLIST_ID)}
    )
    assert response.status_code == 404
    assert not db.committed

@pytest.mark.parametrize('url', ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,x'])
def test_item_links_must_be_web_addresses(client, use_db, url):
    user = make_user()
    use_db(user)
    response = client.post(
        '/wishlist/',
        headers=bearer(user),
        data={'name': 'Item', 'url': url}
    )
    assert response.status_code == 400

@pytest.mark.parametrize('url', ['https://example.com/a', 'http://example.com', 'amazon.com/thing', ''])
def test_ordinary_links_are_allowed(url):
    item_routes._validate_item_url(url)

# Rate limits ----------------------------------------------------------------

def test_login_is_limited_per_address(client, use_db):
    use_db(None)
    body = {'email': 'a@example.com', 'password': 'wrong'}
    headers = {'True-Client-IP': '203.0.113.1'}

    statuses = [
        client.post('/auth/login', json={**body, 'email': f'{i}@example.com'}, headers=headers).status_code
        for i in range(11)
    ]

    assert statuses == [401] * 10 + [429]

def test_one_visitor_does_not_use_up_anothers_limit(client, use_db):
    use_db(None)
    for i in range(11):
        client.post(
            '/auth/login',
            json={'email': f'{i}@example.com', 'password': 'wrong'},
            headers={'True-Client-IP': '203.0.113.1'}
        )

    response = client.post(
        '/auth/login',
        json={'email': 'x@example.com', 'password': 'wrong'},
        headers={'True-Client-IP': '203.0.113.2'}
    )
    assert response.status_code == 401

def test_rotating_addresses_does_not_get_more_guesses_at_one_account(client, use_db):
    use_db(None)
    statuses = [
        client.post(
            '/auth/login',
            json={'email': 'victim@example.com', 'password': 'guess'},
            headers={'True-Client-IP': f'203.0.113.{i}'}
        ).status_code
        for i in range(11)
    ]

    assert statuses == [401] * 10 + [429]

def test_a_right_password_still_works_and_carries_a_stamp(client, use_db):
    user = make_user()
    use_db(user)
    response = client.post('/auth/login', json={'email': user.email, 'password': PASSWORD})
    assert response.status_code == 200

    payload = jwt.decode(response.json()['access_token'], JWT_SECRET, algorithms=['HS256'])
    assert payload['sid'] == session_stamp(user)
