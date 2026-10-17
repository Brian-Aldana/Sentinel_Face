from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from api.controllers.auth_controller import login, change_user_password
from api import limiter

ns = Namespace("auth", description="Autenticación de usuarios")

login_model = ns.model("Login", {
    "email":    fields.String(required=True),
    "password": fields.String(required=True),
})

change_password_model = ns.model("ChangePassword", {
    "current_password": fields.String(required=True),
    "new_password":     fields.String(required=True),
})

home_summary_model = ns.model("HomeSummary", {
    "home_id":           fields.Integer,
    "home_code":         fields.String,
    "owner_name":        fields.String,
    "service_status":    fields.String,
    "suspension_reason": fields.String,
    "max_residents":     fields.Integer,
    "max_cameras":       fields.Integer,
})

auth_response = ns.model("AuthResponse", {
    "success":      fields.Boolean,
    "access_token": fields.String,
    "user_id":      fields.Integer,
    "name":         fields.String,
    "email":        fields.String,
    "roles":        fields.List(fields.String),
    "home":         fields.Nested(home_summary_model, allow_null=True),
})


@ns.route("/login")
class AuthLogin(Resource):
    @limiter.limit("5 per minute")
    @ns.expect(login_model)
    @ns.response(200, "Login exitoso", auth_response)
    @ns.response(400, "Campos requeridos")
    @ns.response(401, "Credenciales inválidas")
    @ns.response(429, "Demasiados intentos")
    def post(self):
        data = request.get_json() or {}
        email = data.get("email", "").strip()
        password = data.get("password", "")

        if not email or not password:
            ns.abort(400, "Email y contraseña son requeridos")

        result, error = login(email, password)
        if error:
            ns.abort(401, error)

        token = create_access_token(identity={
            "user_id": result["user_id"],
            "home_id": result.get("home", {}).get("home_id") if result.get("home") else None,
            "email": result["email"],
            "roles": result["roles"],
        })

        return {**result, "access_token": token}


@ns.route("/refresh")
class AuthRefresh(Resource):
    @jwt_required(verify_type=False)
    @ns.response(200, "Token renovado")
    @ns.response(401, "Token inválido o expirado")
    def post(self):
        identity = get_jwt_identity()
        if not identity or not isinstance(identity, dict):
            ns.abort(401, "Identidad no válida en token")

        token = create_access_token(identity={
            "user_id": identity.get("user_id"),
            "home_id": identity.get("home_id"),
            "email": identity.get("email"),
            "roles": identity.get("roles", []),
        })
        return {"access_token": token}


@ns.route("/change-password")
class AuthChangePassword(Resource):
    @jwt_required()
    @ns.expect(change_password_model)
    @ns.response(200, "Contraseña actualizada exitosamente")
    @ns.response(400, "Datos inválidos")
    @ns.response(401, "Contraseña actual incorrecta")
    def post(self):
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else identity
        data = request.get_json() or {}
        current_password = data.get("current_password", "")
        new_password = data.get("new_password", "")

        success, error = change_user_password(user_id, current_password, new_password)
        if not success:
            code = 401 if "incorrecta" in error else 400
            ns.abort(code, error)

        return {"success": True, "message": "Contraseña actualizada exitosamente"}
