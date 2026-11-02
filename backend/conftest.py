import os
import sys

import dotenv

# The app imports as `from models.base import ...`, i.e. it assumes the backend
# directory is on the path. Put it there so tests can be run from anywhere.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Tests must never reach the real database or bucket. The app calls load_dotenv()
# on import, so that is switched off and placeholders are set instead.
dotenv.load_dotenv = lambda *args, **kwargs: False
os.environ.update({
    'DATABASE_URL': 'postgresql://test:test@127.0.0.1:1/test',
    'JWT_SECRET': 'test-secret',
    'AWS_ACCESS_KEY_ID': 'test',
    'AWS_SECRET_ACCESS_KEY': 'test',
    'AWS_REGION': 'us-east-1',
    'AWS_BUCKET_NAME': 'test-bucket',
})
