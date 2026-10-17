from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restx import abort


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        roles = identity.get("roles", []) if isinstance(identity, dict) else []
        allowed = {"admin", "superadmin"}
        if not allowed.intersection(roles):
            abort(403, "Se requiere el rol de administrador para esta operación")
        return fn(*args, **kwargs)

    return wrapper


def home_admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        roles = identity.get("roles", []) if isinstance(identity, dict) else []
        allowed = {"home_admin", "admin", "superadmin"}
        if not allowed.intersection(roles):
            abort(403, "Se requiere el rol de titular de hogar o administrador para esta operación")
        return fn(*args, **kwargs)

    return wrapper
