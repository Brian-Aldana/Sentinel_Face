import pytest
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
from werkzeug.exceptions import HTTPException

from api.decorators import admin_required, home_admin_required
from tests.conftest import generate_token


def test_password_hashing_and_verification():
    """Valida que el hash scrypt/werkzeug no almacene contraseñas en texto plano y verifique correctamente."""
    plain = "SuperSegura*2026"
    hashed = generate_password_hash(plain)

    assert hashed != plain
    assert check_password_hash(hashed, plain) is True
    assert check_password_hash(hashed, "PasswordErroneo") is False


def test_jwt_claims_structure(app):
    """Verifica que el token JWT contenga todos los claims SaaS (user_id, home_id, email, roles)."""
    with app.app_context():
        token = generate_token(app, user_id=42, email="audit@sentinel.com", roles=["admin"], home_id=5)
        assert token is not None
        assert isinstance(token, str)
        assert len(token.split(".")) == 3  # Header.Payload.Signature


def test_admin_required_decorator_allows_admin(app):
    """Verifica que un usuario con rol 'admin' pueda acceder a funciones protegidas por @admin_required."""
    @admin_required
    def protected_endpoint():
        return {"status": "ok"}

    with app.test_request_context(
        headers={"Authorization": f"Bearer {generate_token(app, roles=['admin'])}"}
    ):
        result = protected_endpoint()
        assert result == {"status": "ok"}


def test_admin_required_decorator_blocks_non_admin(app):
    """Verifica que un usuario sin rol administrativo sea rechazado con HTTP 403."""
    @admin_required
    def protected_endpoint():
        return {"status": "ok"}

    with app.test_request_context(
        headers={"Authorization": f"Bearer {generate_token(app, roles=['home_user'])}"}
    ):
        with pytest.raises(HTTPException) as exc_info:
            protected_endpoint()
        assert exc_info.value.code == 403


def test_home_admin_required_decorator_allows_home_admin(app):
    """Verifica que un titular de hogar ('home_admin') pueda ejecutar endpoints bajo @home_admin_required."""
    @home_admin_required
    def household_endpoint():
        return {"household": "authorized"}

    with app.test_request_context(
        headers={"Authorization": f"Bearer {generate_token(app, roles=['home_admin'])}"}
    ):
        res = household_endpoint()
        assert res == {"household": "authorized"}


def test_home_admin_required_decorator_blocks_regular_resident(app):
    """Verifica que un residente regular sin privilegios de gestión sea rechazado con HTTP 403."""
    @home_admin_required
    def household_endpoint():
        return {"household": "authorized"}

    with app.test_request_context(
        headers={"Authorization": f"Bearer {generate_token(app, roles=['home_user'])}"}
    ):
        with pytest.raises(HTTPException) as exc_info:
            household_endpoint()
        assert exc_info.value.code == 403


def test_login_missing_fields_returns_400(client):
    """Verifica que enviar un cuerpo sin email o contraseña genere un HTTP 400 Bad Request."""
    res = client.post("/api/auth/login", json={})
    assert res.status_code == 400
    assert "email" in res.get_json().get("message", "").lower()


from unittest.mock import patch

def test_login_invalid_credentials_returns_401(client):
    """Verifica que un usuario inexistente o contraseña inválida genere HTTP 401 Unauthorized."""
    with patch("api.controllers.auth_controller.UserModel.find_by_email", return_value=None):
        res = client.post("/api/auth/login", json={
            "email": "usuario_ficticio_no_existe@sentinel.com",
            "password": "password_incorrecto_123"
        })
        assert res.status_code == 401
