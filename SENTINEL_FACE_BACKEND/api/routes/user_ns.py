from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.controllers.user_controller import (
    get_all, get_by_id, create, deactivate, activate, assign_role, remove_role
)
from api.decorators import admin_required

ns = Namespace("users", description="Gestión de usuarios del sistema")

user_model = ns.model("User", {
    "user_id":    fields.Integer,
    "home_id":    fields.Integer,
    "full_name":  fields.String,
    "email":      fields.String,
    "is_active":  fields.Boolean,
    "roles":      fields.List(fields.String),
    "created_at": fields.String,
    "last_login": fields.String,
})

create_user_model = ns.model("CreateUser", {
    "full_name":    fields.String(required=True),
    "email":        fields.String(required=True),
    "password":     fields.String(required=True),
    "roles":        fields.List(fields.String),
    "home_id":      fields.Integer(required=False),
})

role_action_model = ns.model("RoleAction", {
    "role_id": fields.Integer(required=True),
})


@ns.route("")
class UserList(Resource):
    @jwt_required()
    @ns.response(200, "Lista de usuarios")
    def get(self):
        include_inactive = request.args.get("include_inactive", "false").lower() == "true"
        home_id = request.args.get("home_id")
        users = get_all(include_inactive, int(home_id) if home_id else None)
        return {"users": users}

    @admin_required
    @ns.expect(create_user_model)
    @ns.response(201, "Usuario creado")
    @ns.response(400, "Datos inválidos")
    @ns.response(409, "Email duplicado")
    def post(self):
        data = request.get_json() or {}
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else 1

        result, err = create(
            data.get("full_name", ""),
            data.get("email", ""),
            data.get("password", ""),
            data.get("roles", []),
            requestor_id=user_id,
            home_id=data.get("home_id")
        )
        if err:
            code = 409 if "duplicado" in err.lower() or "ya está" in err.lower() else 400
            ns.abort(code, err)
        return result, 201


@ns.route("/<int:user_id>")
class UserItem(Resource):
    @jwt_required()
    @ns.response(200, "Usuario encontrado", user_model)
    @ns.response(404, "No encontrado")
    def get(self, user_id):
        u, err = get_by_id(user_id)
        if err:
            ns.abort(404, err)
        return u


@ns.route("/<int:user_id>/deactivate")
class UserDeactivate(Resource):
    @admin_required
    @ns.response(200, "Usuario desactivado")
    @ns.response(404, "No encontrado")
    def patch(self, user_id):
        identity = get_jwt_identity()
        req_id = identity.get("user_id") if isinstance(identity, dict) else 1
        ok, err = deactivate(user_id, req_id)
        if err:
            ns.abort(400, err)
        return {"success": True}


@ns.route("/<int:user_id>/activate")
class UserActivate(Resource):
    @admin_required
    @ns.response(200, "Usuario activado")
    @ns.response(404, "No encontrado")
    def patch(self, user_id):
        identity = get_jwt_identity()
        req_id = identity.get("user_id") if isinstance(identity, dict) else 1
        ok, err = activate(user_id, req_id)
        if err:
            ns.abort(400, err)
        return {"success": True}


@ns.route("/<int:user_id>/roles")
class UserRoles(Resource):
    @admin_required
    @ns.expect(role_action_model)
    @ns.response(200, "Rol asignado")
    @ns.response(400, "Error")
    def post(self, user_id):
        data = request.get_json() or {}
        role_id = data.get("role_id")
        identity = get_jwt_identity()
        req_id = identity.get("user_id") if isinstance(identity, dict) else 1
        ok, err = assign_role(user_id, role_id, req_id)
        if err:
            ns.abort(400, err)
        return {"success": True}

    @admin_required
    @ns.expect(role_action_model)
    @ns.response(200, "Rol revocado")
    @ns.response(400, "Error")
    def delete(self, user_id):
        data = request.get_json() or {}
        role_id = data.get("role_id")
        identity = get_jwt_identity()
        req_id = identity.get("user_id") if isinstance(identity, dict) else 1
        ok, err = remove_role(user_id, role_id, req_id)
        if err:
            ns.abort(400, err)
        return {"success": True}
