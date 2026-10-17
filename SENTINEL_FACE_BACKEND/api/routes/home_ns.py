from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.controllers import home_controller
from api.decorators import admin_required

ns = Namespace("homes", description="Gestión de hogares residenciales")

home_create_model = ns.model("HomeCreate", {
    "home_code":      fields.String(required=True, description="Código único de hogar (ej. HOG-001)"),
    "owner_name":     fields.String(required=True, description="Nombre del titular"),
    "address":        fields.String(description="Dirección de la residencia"),
    "phone":          fields.String(description="Teléfono de contacto"),
    "contact_email":  fields.String(required=True, description="Correo de contacto"),
    "service_status": fields.String(default="ACTIVE", description="ACTIVE, SUSPENDED, DENIED, TRIAL"),
    "max_residents":  fields.Integer(default=10, description="Cupo máximo de personas"),
    "max_cameras":    fields.Integer(default=2, description="Límite de cámaras"),
    "notes":          fields.String(description="Notas técnicas"),
})

home_update_model = ns.model("HomeUpdate", {
    "owner_name":     fields.String,
    "address":        fields.String,
    "phone":          fields.String,
    "contact_email":  fields.String,
    "max_residents":  fields.Integer,
    "max_cameras":    fields.Integer,
    "notes":          fields.String,
})

status_change_model = ns.model("StatusChange", {
    "service_status":    fields.String(required=True, description="Nuevo estado: ACTIVE, SUSPENDED, DENIED, TRIAL"),
    "suspension_reason": fields.String(description="Motivo si se suspende o deniega"),
})


@ns.route("")
class HomeList(Resource):
    @ns.response(200, "Lista de hogares")
    def get(self):
        status = request.args.get("status") or request.args.get("estado")
        return home_controller.get_all(status)

    @admin_required
    @ns.expect(home_create_model)
    @ns.response(201, "Hogar creado exitosamente")
    @ns.response(400, "Datos inválidos")
    @ns.response(409, "Código de hogar ya existente")
    def post(self):
        data = request.get_json() or {}
        # Support aliases
        if "codigo_hogar" in data and "home_code" not in data:
            data["home_code"] = data["codigo_hogar"]
        if "nombre_titular" in data and "owner_name" not in data:
            data["owner_name"] = data["nombre_titular"]
        if "direccion" in data and "address" not in data:
            data["address"] = data["direccion"]
        if "telefono" in data and "phone" not in data:
            data["phone"] = data["telefono"]
        if "email_contacto" in data and "contact_email" not in data:
            data["contact_email"] = data["email_contacto"]
        if "estado_servicio" in data and "service_status" not in data:
            data["service_status"] = data["estado_servicio"]
        if "limite_personas" in data and "max_residents" not in data:
            data["max_residents"] = data["limite_personas"]
        if "limite_camaras" in data and "max_cameras" not in data:
            data["max_cameras"] = data["limite_camaras"]

        identity = get_jwt_identity()
        user_id = identity.get("user_id") or identity.get("usuario_id") if isinstance(identity, dict) else None

        result, error = home_controller.create(data, user_id=user_id)
        if error:
            code = 409 if "ya existe" in error else 400
            ns.abort(code, error)
        return result, 201


@ns.route("/my-home")
class MyHomeDetail(Resource):
    @jwt_required()
    @ns.response(200, "Detalle del hogar del usuario autenticado")
    @ns.response(404, "Hogar no encontrado o sin hogar asignado")
    def get(self):
        identity = get_jwt_identity()
        home_id = identity.get("home_id") if isinstance(identity, dict) else None
        if not home_id:
            ns.abort(404, "El usuario no tiene un hogar asignado")
        home, error = home_controller.get_by_id(home_id)
        if error:
            ns.abort(404, error)
        return home


@ns.route("/<int:home_id>")
class HomeDetail(Resource):
    @ns.response(200, "Detalle del hogar")
    @ns.response(404, "Hogar no encontrado")
    def get(self, home_id):
        home, error = home_controller.get_by_id(home_id)
        if error:
            ns.abort(404, error)
        return home

    @admin_required
    @ns.expect(home_update_model)
    @ns.response(200, "Hogar actualizado")
    @ns.response(404, "Hogar no encontrado")
    def put(self, home_id):
        data = request.get_json() or {}
        if "nombre_titular" in data and "owner_name" not in data:
            data["owner_name"] = data["nombre_titular"]
        if "direccion" in data and "address" not in data:
            data["address"] = data["direccion"]
        if "telefono" in data and "phone" not in data:
            data["phone"] = data["telefono"]
        if "email_contacto" in data and "contact_email" not in data:
            data["contact_email"] = data["email_contacto"]
        if "limite_personas" in data and "max_residents" not in data:
            data["max_residents"] = data["limite_personas"]
        if "limite_camaras" in data and "max_cameras" not in data:
            data["max_cameras"] = data["limite_camaras"]

        identity = get_jwt_identity()
        user_id = identity.get("user_id") or identity.get("usuario_id") if isinstance(identity, dict) else None

        ok, error = home_controller.update(home_id, data, user_id=user_id)
        if not ok:
            ns.abort(400, error or "No se pudo actualizar")
        return {"success": True, "message": "Hogar actualizado exitosamente"}


@ns.route("/<int:home_id>/status")
class HomeStatus(Resource):
    @admin_required
    @ns.expect(status_change_model)
    @ns.response(200, "Estado de servicio actualizado")
    @ns.response(400, "Estado no válido")
    @ns.response(404, "Hogar no encontrado")
    def put(self, home_id):
        data = request.get_json() or {}
        new_status = data.get("service_status") or data.get("estado_servicio")
        reason = data.get("suspension_reason") or data.get("motivo_suspension")

        if not new_status:
            ns.abort(400, "El campo 'service_status' es requerido")

        identity = get_jwt_identity()
        user_id = identity.get("user_id") or identity.get("usuario_id") if isinstance(identity, dict) else None

        ok, error = home_controller.set_status(home_id, new_status, reason, changed_by=user_id)
        if not ok:
            code = 404 if "no encontrado" in (error or "").lower() else 400
            ns.abort(code, error)

        return {
            "success": True,
            "home_id": home_id,
            "hogar_id": home_id,
            "service_status": new_status,
            "estado_servicio": new_status,
            "suspension_reason": reason,
            "motivo_suspension": reason,
            "message": f"Estado del hogar {home_id} actualizado a {new_status}"
        }


@ns.route("/<int:home_id>/history")
@ns.route("/<int:home_id>/historial")
class HomeHistory(Resource):
    @ns.response(200, "Historial de cambios de estado")
    @ns.response(404, "Hogar no encontrado")
    def get(self, home_id):
        history, error = home_controller.get_history(home_id)
        if error:
            ns.abort(404, error)
        return history


@ns.route("/dashboard/stats")
class HomeDashboardStats(Resource):
    @ns.response(200, "Estadísticas del dashboard de hogares")
    def get(self):
        stats = home_controller.get_dashboard_stats()
        # provide aliases so both new and existing frontends work seamlessly
        return {
            **stats,
            "hogares": stats.get("homes"),
            "personas": stats.get("residents"),
            "accesos": stats.get("accesses"),
            "alertas": stats.get("alerts"),
            "grafica_7_dias": stats.get("chart_7_days"),
            "ultimas_alertas": stats.get("recent_alerts"),
        }
