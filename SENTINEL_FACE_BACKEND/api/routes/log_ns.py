from flask_restx import Namespace, Resource, fields
from flask import request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.decorators import admin_required
from api.controllers.log_controller import get_all, get_by_id, recognize, remove, get_image

ns = Namespace("logs", description="Registro de accesos")

log_model = ns.model("AccessLog", {
    "log_id":        fields.Integer,
    "home_id":       fields.Integer,
    "resident_id":   fields.Integer,
    "employee_id":   fields.Integer,
    "access_result": fields.String,
    "confidence":    fields.Float,
    "liveness":      fields.String,
    "event_time":    fields.String,
    "full_name":     fields.String,
    "home_code":     fields.String,
    "owner_name":    fields.String,
})


@ns.route("")
class LogList(Resource):
    @jwt_required()
    @ns.response(200, "Lista de logs paginada")
    def get(self):
        result_filter = request.args.get("result")
        limit         = request.args.get("limit", 20, type=int)
        page          = request.args.get("page",  1,  type=int)

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

        data = get_all(result_filter=result_filter, home_id=home_id, limit=limit, page=page)
        # Add employee_id alias for backward compatibility
        for item in data["items"]:
            item["employee_id"] = item.get("resident_id")

        return {
            "logs":     data["items"],
            "total":    data["total"],
            "page":     data["page"],
            "limit":    data["limit"],
            "has_more": data["has_more"],
        }


@ns.route("/<int:log_id>")
class LogItem(Resource):
    @jwt_required()
    @ns.response(200, "Log encontrado", log_model)
    @ns.response(404, "No encontrado")
    def get(self, log_id):
        log, error = get_by_id(log_id)
        if error:
            ns.abort(404, error)
        log["employee_id"] = log.get("resident_id")
        return log

    @admin_required
    @ns.response(200, "Log eliminado")
    @ns.response(403, "Rol de administrador requerido")
    @ns.response(404, "No encontrado")
    def delete(self, log_id):
        ok, error = remove(log_id)
        if error:
            ns.abort(404, error)
        return {"success": True}


@ns.route("/<int:log_id>/image")
class LogImage(Resource):
    @jwt_required()
    @ns.response(200, "Snapshot del log")
    @ns.response(404, "Imagen no encontrada")
    def get(self, log_id):
        img_bytes = get_image(log_id)
        if not img_bytes:
            ns.abort(404, "Imagen no encontrada")
        return Response(img_bytes, mimetype="image/jpeg")