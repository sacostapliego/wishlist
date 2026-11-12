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
from routes import wishlists as wishlist_routes
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
        self.query_chain.count.return_value = 0
        self.committed = False
        self.commit_error = None
        self.deleted = []

    def query(self, *args):
        return self.query_chain

    def add(self, row):
        pass

    def delete(self, row):
        self.deleted.append(row)

    def commit(self):
        if self.commit_error:
            raise self.commit_error
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
    # The image routes import the client by name, so they hold their own reference
    monkeypatch.setattr(item_routes, 's3_client', mock)
    monkeypatch.setattr(wishlist_routes, 's3_client', mock)
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

def test_background_removal_keeps_white_inside_the_product():
    # A white sheet with a dark ring whose middle is also white
    img = Image.new('RGB', (40, 40), (255, 255, 255))
    for x in range(10, 30):
        for y in range(10, 30):
            if x in (10, 29) or y in (10, 29):
                img.putpixel((x, y), (20, 20, 20))
    buffer = io.BytesIO()
    img.save(buffer, 'PNG')

    result = Image.open(io.BytesIO(item_routes._remove_white_background(buffer.getvalue())))
    assert result.getpixel((0, 0))[3] == 0          # background
    assert result.getpixel((39, 20))[3] == 0        # background on another edge
    assert result.getpixel((10, 10))[3] == 255      # the ring
    assert result.getpixel((20, 20)) == (255, 255, 255, 255)  # white inside the ring

def test_background_removal_keeps_existing_transparency():
    img = Image.new('RGBA', (10, 10), (200, 30, 30, 255))
    img.putpixel((5, 5), (200, 30, 30, 0))
    buffer = io.BytesIO()
    img.save(buffer, 'PNG')

    result = Image.open(io.BytesIO(item_routes._remove_white_background(buffer.getvalue())))
    assert result.getpixel((5, 5))[3] == 0
    assert result.getpixel((0, 0))[3] == 255

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

# Passwords ------------------------------------------------------------------

def test_a_password_over_72_bytes_is_a_wrong_password_not_a_crash(client, use_db):
    user = make_user()
    use_db(user)
    response = client.post('/auth/login', json={'email': user.email, 'password': 'x' * 100})
    assert response.status_code == 401

def test_login_for_an_unknown_email_still_checks_a_hash(client, use_db, monkeypatch):
    use_db(None)
    checked = []
    real_verify = auth_routes.verify_password
    monkeypatch.setattr(
        auth_routes, 'verify_password',
        lambda plain, hashed: checked.append(hashed) or real_verify(plain, hashed)
    )
    client.post('/auth/login', json={'email': 'nobody@example.com', 'password': 'guess'})
    assert checked == [auth_routes._DUMMY_HASH]

@pytest.mark.parametrize('password', ['short', 'x' * 73])
def test_sign_up_refuses_a_bad_password(client, use_db, password):
    db = use_db(None)
    response = client.post(
        '/auth/register',
        data={'email': 'new@example.com', 'username': 'new', 'password': password}
    )
    assert response.status_code == 400
    assert not db.committed

def test_a_new_password_must_be_long_enough(client, use_db):
    user = make_user()
    db = use_db(user)
    response = client.put(
        f'/users/{USER_ID}',
        headers=bearer(user),
        data={'password': 'short', 'current_password': PASSWORD}
    )
    assert response.status_code == 400
    assert not db.committed

@pytest.mark.parametrize('form', [
    {'email': 'thief@example.com'},
    {'email': 'thief@example.com', 'current_password': 'wrong'},
])
def test_changing_the_email_needs_the_current_password(client, use_db, form):
    user = make_user()
    db = use_db(user)
    response = client.put(f'/users/{USER_ID}', headers=bearer(user), data=form)
    assert response.status_code == 403
    assert not db.committed

def test_sending_the_same_email_back_needs_no_password(client, use_db):
    user = make_user()
    use_db(user)
    response = client.put(f'/users/{USER_ID}', headers=bearer(user), data={'email': user.email})
    assert response.status_code == 200

# Errors ---------------------------------------------------------------------

def test_a_database_error_is_not_sent_to_the_client(client, use_db):
    user = make_user()
    db = use_db(user)
    db.commit_error = RuntimeError('INSERT INTO wishlist_items secret_column')
    response = client.post('/wishlist/', headers=bearer(user), data={'name': 'Item'})
    assert response.status_code == 500
    assert 'secret_column' not in response.text

# Blind lists ----------------------------------------------------------------

def test_an_owner_claiming_their_own_item_is_not_told_it_is_claimed(client, use_db):
    user = make_user()
    item = SimpleNamespace(
        id=uuid.uuid4(), user_id=USER_ID, wishlist_id=uuid.uuid4(), is_contribution=False,
        claimed_by_user_id=uuid.uuid4(), claimed_by_guest_session_id=None, claimed_by_name=None,
    )
    wishlist = SimpleNamespace(id=item.wishlist_id, is_public=True, visibility_mode='blind')
    db = use_db(user)
    db.query_chain.first.side_effect = [user, item, wishlist]
    response = client.post(f'/wishlist/{item.id}/claim', headers=bearer(user))
    assert response.status_code == 400
    assert response.json()['detail'] == 'You cannot claim an item on your own list'
    assert not db.committed

# Images ---------------------------------------------------------------------

IMAGE_URL = 'https://test-bucket.s3.amazonaws.com/wishlist_images/a.png'

def image_item(is_public):
    return SimpleNamespace(
        id=uuid.uuid4(), image=IMAGE_URL,
        wishlist=SimpleNamespace(is_public=is_public)
    )

def test_a_private_item_image_needs_its_token(client, use_db, s3):
    item = image_item(is_public=False)
    use_db(item)
    s3.get_object.return_value = {'ContentType': 'image/png', 'Body': io.BytesIO(png_bytes())}

    assert client.get(f'/wishlist/{item.id}/image').status_code == 404
    assert client.get(f'/wishlist/{item.id}/image?t=guess').status_code == 404
    token = s3_service.image_token(IMAGE_URL)
    assert client.get(f'/wishlist/{item.id}/image?t={token}').status_code == 200

def test_a_shared_item_image_loads_for_anyone(client, use_db, s3):
    item = image_item(is_public=True)
    use_db(item)
    s3.get_object.return_value = {'ContentType': 'image/png', 'Body': io.BytesIO(png_bytes())}
    assert client.get(f'/wishlist/{item.id}/image').status_code == 200

def test_a_private_list_thumbnail_needs_its_token(client, use_db, s3):
    wishlist = SimpleNamespace(id=uuid.uuid4(), thumbnail_image=IMAGE_URL, is_public=False)
    use_db(wishlist)
    s3.get_object.return_value = {'ContentType': 'image/png', 'Body': io.BytesIO(png_bytes())}

    assert client.get(f'/wishlists/{wishlist.id}/thumbnail').status_code == 404
    token = s3_service.image_token(IMAGE_URL)
    assert client.get(f'/wishlists/{wishlist.id}/thumbnail?t={token}').status_code == 200

def test_replacing_an_image_changes_its_token():
    other = IMAGE_URL.replace('a.png', 'b.png')
    assert s3_service.image_token(IMAGE_URL) != s3_service.image_token(other)

def test_a_failed_list_delete_keeps_its_images(client, use_db, s3):
    user = make_user()
    wishlist = SimpleNamespace(
        id=uuid.uuid4(), thumbnail_image=IMAGE_URL,
        items=[SimpleNamespace(image=IMAGE_URL)]
    )
    db = use_db(user)
    db.query_chain.first.side_effect = [user, wishlist]
    db.commit_error = RuntimeError('foreign key')
    response = client.delete(f'/wishlists/{wishlist.id}', headers=bearer(user))
    assert response.status_code == 500
    s3.delete_object.assert_not_called()

def test_a_list_delete_removes_its_images_after_the_commit(client, use_db, s3):
    user = make_user()
    wishlist = SimpleNamespace(
        id=uuid.uuid4(), thumbnail_image=IMAGE_URL,
        items=[SimpleNamespace(image=IMAGE_URL.replace('a.png', 'b.png'))]
    )
    db = use_db(user)
    db.query_chain.first.side_effect = [user, wishlist]
    response = client.delete(f'/wishlists/{wishlist.id}', headers=bearer(user))
    assert response.status_code == 200
    assert db.committed
    assert s3.delete_object.call_count == 2

def test_deleting_an_account_removes_its_item_images(client, use_db, s3):
    user = make_user(
        pfp=IMAGE_URL,
        wishlist_items=[SimpleNamespace(image=IMAGE_URL.replace('a.png', 'b.png'))],
        wishlists=[SimpleNamespace(thumbnail_image=None)],
    )
    use_db(user)
    response = client.delete(f'/users/{USER_ID}', headers=bearer(user))
    assert response.status_code == 200
    assert s3.delete_object.call_count == 2

# Guest sessions -------------------------------------------------------------

def test_a_full_list_makes_room_for_a_new_guest(use_db):
    from services.guest_session import MAX_SESSIONS_PER_WISHLIST, create_guest_session

    idle = SimpleNamespace(id=uuid.uuid4())
    db = use_db(idle)
    db.query_chain.count.return_value = MAX_SESSIONS_PER_WISHLIST
    db.query_chain.order_by.return_value = db.query_chain

    _, token = create_guest_session(db, uuid.uuid4(), 'Aunt May')
    assert db.deleted == [idle]
    assert token

def test_a_full_list_of_active_guests_still_refuses(use_db):
    from fastapi import HTTPException
    from services.guest_session import MAX_SESSIONS_PER_WISHLIST, create_guest_session

    db = use_db(None)
    db.query_chain.count.return_value = MAX_SESSIONS_PER_WISHLIST
    db.query_chain.order_by.return_value = db.query_chain

    with pytest.raises(HTTPException) as refused:
        create_guest_session(db, uuid.uuid4(), 'Aunt May')
    assert refused.value.status_code == 429

# Scraper --------------------------------------------------------------------

def test_only_amazon_links_are_rewritten():
    from services import scraper
    assert scraper.is_amazon_host('www.amazon.co.uk')
    assert scraper.is_amazon_host('a.co')
    assert not scraper.is_amazon_host('www.target.com')
    assert not scraper.is_amazon_host('notamazon.com')

@pytest.mark.parametrize('address', ['127.0.0.1', '10.0.0.5', '169.254.169.254', '::1'])
def test_the_scraper_will_not_fetch_a_private_address(monkeypatch, address):
    from services import scraper
    monkeypatch.setattr(
        scraper.socket, 'getaddrinfo',
        lambda *args, **kwargs: [(None, None, None, None, (address, 0))]
    )
    assert scraper.scrape_url('http://internal.example/') == {'error': 'That link cannot be fetched'}

def test_the_scraper_reads_open_graph_and_schema_tags():
    from bs4 import BeautifulSoup
    from services import scraper
    soup = BeautifulSoup(
        '<html><head>'
        '<meta property="og:title" content="Blue Mug">'
        '<meta property="og:image" content="/mug.jpg">'
        '<script type="application/ld+json">{"@type": "Product", "offers": {"price": "12.50"}}</script>'
        '</head></html>',
        'html.parser'
    )
    details = scraper.scrape_generic(soup)
    assert details['name'] == 'Blue Mug'
    assert details['price'] == 12.5
    assert details['image_url'] == '/mug.jpg'
    assert 'description' not in details

def test_the_scraper_finds_a_product_nested_in_a_graph_with_variants():
    from bs4 import BeautifulSoup
    from services import scraper
    soup = BeautifulSoup(
        '<html><head><title>Ignored</title>'
        '<script type="application/ld+json">{"@context": "https://schema.org", "@graph": ['
        '{"@type": "WebPage", "mainEntity": {"@type": ["ProductGroup"], "name": "Rain Jacket &amp; Hood",'
        ' "hasVariant": [{"@type": "Product", "image": [{"@type": "ImageObject", "url": "https://cdn.shop/j.jpg"}],'
        ' "offers": {"@type": "AggregateOffer", "lowPrice": "89,00", "priceCurrency": "EUR"}}]}}'
        ']}</script>'
        '</head></html>',
        'html.parser'
    )
    details = scraper.scrape_generic(soup)
    assert details == {'name': 'Rain Jacket & Hood', 'price': 89.0, 'image_url': 'https://cdn.shop/j.jpg'}

def test_the_scraper_falls_back_to_microdata_and_page_title():
    from bs4 import BeautifulSoup
    from services import scraper
    soup = BeautifulSoup(
        '<html><head><title>Desk Lamp | Lamp Co</title>'
        '<meta property="og:site_name" content="Lamp Co">'
        '<link rel="image_src" href="//cdn.lamp.co/lamp.png">'
        '</head><body><div itemscope itemtype="https://schema.org/Product">'
        '<span itemprop="price" content="1299.00">$1,299</span>'
        '</div></body></html>',
        'html.parser'
    )
    details = scraper.scrape_generic(soup)
    assert details == {'name': 'Desk Lamp', 'price': 1299.0, 'image_url': '//cdn.lamp.co/lamp.png'}

@pytest.mark.parametrize('title, hostname, expected', [
    ('Unisex Crew Neck T-Shirt | UNIQLO US', 'www.uniqlo.com', 'Unisex Crew Neck T-Shirt'),
    ('Paper Towels - 6 Rolls : Target', 'www.target.com', 'Paper Towels - 6 Rolls'),
    ('Shirt | Blue', 'www.uniqlo.com', 'Shirt | Blue'),
])
def test_the_scraper_drops_the_store_name_from_titles(title, hostname, expected):
    from services import scraper
    assert scraper.clean_name(title, None, hostname) == expected

@pytest.mark.parametrize('title, blocked', [
    ('Client Challenge', True), ('Just a moment...', True), ('Access Denied', True),
    ('Essential Popover Hoodie | Abercrombie', False),
])
def test_the_scraper_recognises_bot_check_pages(title, blocked):
    from bs4 import BeautifulSoup
    from services import scraper
    soup = BeautifulSoup(f'<html><head><title>{title}</title></head></html>', 'html.parser')
    assert scraper.is_block_page(soup) is blocked

@pytest.mark.parametrize('text, expected', [
    ('$1,299.00', 1299.0), ('19,99 €', 19.99), ('EUR 1.299,00', 1299.0), ('£1,299', 1299.0),
    ('From $25 - $40', 25.0), (49, 49.0), ('Free', None), ('0.00', None), (None, None),
])
def test_the_scraper_reads_prices_in_any_format(text, expected):
    from services import scraper
    assert scraper.parse_price(text) == expected

# Contribution mode ----------------------------------------------------------

@pytest.mark.parametrize('was_contribution, claimed_by', [
    (False, None), (False, uuid.uuid4()), (True, None),
])
def test_contribution_mode_cannot_be_switched_whatever_the_item_state(
    client, use_db, was_contribution, claimed_by
):
    user = make_user()
    item = SimpleNamespace(
        id=uuid.uuid4(), image=None, is_contribution=was_contribution,
        claimed_by_user_id=claimed_by, claimed_by_guest_session_id=None, claimed_by_name=None,
    )
    db = use_db(user)
    db.query_chain.first.side_effect = [user, item]
    response = client.put(
        f'/wishlist/{item.id}',
        headers=bearer(user),
        data={'is_contribution': str(not was_contribution).lower()}
    )
    assert response.status_code == 400
    assert response.json()['detail'].startswith('Contributions are chosen when an item is added')
    assert not db.committed
