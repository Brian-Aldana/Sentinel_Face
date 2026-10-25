import os
import sys
import pytest

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-sentinel-face-2026")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRES", "3600")
os.environ.setdefault("RATELIMIT_STORAGE_URL", "memory://")
os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_PORT", "3307")
os.environ.setdefault("DB_USER", "root")
os.environ.setdefault("DB_PASSWORD", "sentinel_root_pass")
os.environ.setdefault("DB_NAME", "sentinel_face")

from api import create_app
from flask_jwt_extended import create_access_token
from unittest.mock import patch


@pytest.fixture(scope="session")
def app():
    """Create and configure a Flask application for testing."""
    with patch("api.models.user.ensure_default_user", return_value=None):
        test_app = create_app()
        test_app.config.update({
            "TESTING": True,
            "PROPAGATE_EXCEPTIONS": True,
        })
        return test_app


@pytest.fixture
def client(app):
    """Test client fixture."""
    return app.test_client()


def generate_token(app, user_id=1, email="test@sentinel.com", roles=None, home_id=1):
    """Utility to generate a JWT token for test requests."""
    if roles is None:
        roles = ["admin"]
    with app.app_context():
        token = create_access_token(identity={
            "user_id": user_id,
            "home_id": home_id,
            "email": email,
            "roles": roles,
        })
        return token


@pytest.fixture
def admin_headers(app):
    token = generate_token(app, user_id=1, email="admin@sentinel.com", roles=["admin", "superadmin"], home_id=None)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def home_admin_headers(app):
    token = generate_token(app, user_id=2, email="titular@sentinel.com", roles=["home_admin"], home_id=1)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def regular_user_headers(app):
    token = generate_token(app, user_id=99, email="user@sentinel.com", roles=["home_user"], home_id=1)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
