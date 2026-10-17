from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.controllers.alert_controller import get_all, get_by_id, resolve, remove
from api.decorators import admin_required, home_admin_required

ns = Namespace("alerts", description="Alertas de seguridad")

alert_model = ns.model("Alert", {
    "alert_id":    fields.Integer,
    "home_id":     fields.Integer,
    "log_id":      fields.Integer,
    "alert_type":  fields.String,
    "severity":    fields.String,
    "description": fields.String,
    "resolved":    fields.Boolean,
    "created_at":  fields.String,
    "event_time":  fields.String,
    "home_code":   fields.String,
    "owner_name":  fields.String,
})

resolve_model = ns.model("Resolve", {
    "user_id":    fields.Integer(required=False),
    "usuario_id": fields.Integer(required=False),
})


@ns.route("")
class AlertList(Resource):
    @jwt_required()
    @ns.response(200, "Lista de alertas paginada")
    def get(self):
        resolved = request.args.get("resolved", 0, type=int)
        limit    = request.args.get("limit", 20, type=int)
        page     = request.args.get("page",  1,  type=int)

        identity = get_jwt_identity()
        roles = identity.get("roles", []) if isinstance(identity, dict) else []
        home_id = None
        if "home_admin" in roles or "hogar_admin" in roles:
            home_id = identity.get("home_id")
        else:
            param = request.args.get("home_id") or request.args.get("hogar_id")
            if param:
                try:
                    home_id = int(param)
                except ValueError:
                    pass

        data = get_all(resolved=resolved, home_id=home_id, limit=limit, page=page)
        return {
            "alerts":   data["items"],
            "total":    data["total"],
            "page":     data["page"],
            "limit":    data["limit"],
            "has_more": data["has_more"],
        }


@ns.route("/<int:alert_id>")
class AlertItem(Resource):
    @jwt_required()
    @ns.response(200, "Alerta encontrada", alert_model)
    @ns.response(404, "No encontrada")
    def get(self, alert_id):
        alert, error = get_by_id(alert_id)
        if error:
            ns.abort(404, error)
        return alert

    @admin_required
    @ns.response(200, "Alerta eliminada")
    @ns.response(404, "No encontrada")
    def delete(self, alert_id):
        ok, error = remove(alert_id)
        if error:
            ns.abort(404, error)
        return {"success": True}


@ns.route("/<int:alert_id>/resolve")
class AlertResolve(Resource):
    @home_admin_required
    @ns.expect(resolve_model)
    @ns.response(200, "Alerta resuelta")
    @ns.response(404, "No encontrada")
    def patch(self, alert_id):
        data = request.get_json(silent=True) or {}
        identity = get_jwt_identity()
        user_id = data.get("user_id") or data.get("usuario_id")
        if not user_id and isinstance(identity, dict):
            user_id = identity.get("user_id") or identity.get("usuario_id")

        ok, error = resolve(alert_id, user_id)
        if error:
            ns.abort(404, error)
        return {"success": True}