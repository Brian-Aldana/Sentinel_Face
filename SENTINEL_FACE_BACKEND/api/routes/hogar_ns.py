from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import hogar as HogarModel
from api.models import audit as AuditModel

ns = Namespace("hogares", description="Gestión de Hogares y Proveedor de Servicio (SaaS)")

hogar_model = ns.model("HogarInput", {
    "codigo_hogar":    fields.String(required=True, description="Código único del hogar, ej. HOG-002"),
    "nombre_titular":  fields.String(required=True, description="Nombre de la familia o titular"),
    "direccion":       fields.String(description="Dirección física del inmueble"),
    "telefono":        fields.String(description="Teléfono de contacto"),
    "email_contacto":  fields.String(required=True, description="Correo electrónico del titular"),
    "estado_servicio": fields.String(description="ACTIVO, SUSPENDIDO, DENEGADO o PRUEBA", default="ACTIVO"),
    "limite_personas": fields.Integer(description="Límite máximo de personas registrables", default=10),
    "limite_camaras":  fields.Integer(description="Límite máximo de cámaras IP asociadas", default=2),
    "notas":           fields.String(description="Notas administrativas"),
})

status_model = ns.model("HogarStatusInput", {
    "estado_servicio":   fields.String(required=True, description="ACTIVO, SUSPENDIDO, DENEGADO o PRUEBA"),
    "motivo_suspension": fields.String(description="Razón por la cual se suspende o deniega el servicio"),
})


@ns.route("")
class HogarList(Resource):
    @jwt_required(optional=True)
    @ns.doc(params={"estado": "Filtrar por estado: ACTIVO, SUSPENDIDO, DENEGADO, PRUEBA"})
    def get(self):
        """Lista todos los hogares registrados con métricas agregadas."""
        estado = request.args.get("estado")
        return HogarModel.find_all(estado)

    @jwt_required()
    @ns.expect(hogar_model)
    def post(self):
        """Registra un nuevo hogar en la plataforma."""
        data = request.get_json() or {}
        if not data.get("codigo_hogar") or not data.get("nombre_titular") or not data.get("email_contacto"):
            ns.abort(400, "codigo_hogar, nombre_titular y email_contacto son obligatorios")

        # Verificar unicidad de código
        existing = HogarModel.find_by_codigo(data["codigo_hogar"])
        if existing:
            ns.abort(409, f"El código de hogar '{data['codigo_hogar']}' ya existe")

        try:
            new_id = HogarModel.create(data)
            identity = get_jwt_identity() or {}
            AuditModel.create(
                identity.get("usuario_id"),
                "CREATE_HOGAR",
                "hogares",
                new_id,
                {"codigo": data["codigo_hogar"], "titular": data["nombre_titular"]},
                request.remote_addr,
            )
            return {"success": True, "hogar_id": new_id, "message": "Hogar registrado exitosamente"}, 201
        except Exception as e:
            ns.abort(500, str(e))


@ns.route("/<int:hogar_id>")
class HogarDetail(Resource):
    @jwt_required(optional=True)
    def get(self, hogar_id: int):
        """Obtiene la información y estadísticas de un hogar por ID."""
        hogar = HogarModel.find_by_id(hogar_id)
        if not hogar:
            ns.abort(404, "Hogar no encontrado")
        return hogar

    @jwt_required()
    def put(self, hogar_id: int):
        """Actualiza los datos de un hogar."""
        data = request.get_json() or {}
        if not HogarModel.update(hogar_id, data):
            ns.abort(404, "Hogar no encontrado o sin cambios")

        identity = get_jwt_identity() or {}
        AuditModel.create(
            identity.get("usuario_id"),
            "UPDATE_HOGAR",
            "hogares",
            hogar_id,
            data,
            request.remote_addr,
        )
        return {"success": True, "message": "Hogar actualizado exitosamente"}


@ns.route("/<int:hogar_id>/status")
class HogarStatus(Resource):
    @jwt_required()
    @ns.expect(status_model)
    def put(self, hogar_id: int):
        """Permite al administrador activar, suspender o denegar el servicio a un hogar."""
        data = request.get_json() or {}
        nuevo_estado = data.get("estado_servicio")
        motivo = data.get("motivo_suspension")

        estados_validos = ["ACTIVO", "SUSPENDIDO", "DENEGADO", "PRUEBA"]
        if nuevo_estado not in estados_validos:
            ns.abort(400, f"Estado no válido. Opciones: {', '.join(estados_validos)}")

        if not HogarModel.set_status(hogar_id, nuevo_estado, motivo):
            ns.abort(404, "Hogar no encontrado")

        identity = get_jwt_identity() or {}
        AuditModel.create(
            identity.get("usuario_id"),
            f"SET_HOGAR_STATUS_{nuevo_estado}",
            "hogares",
            hogar_id,
            {"nuevo_estado": nuevo_estado, "motivo": motivo},
            request.remote_addr,
        )
        return {
            "success": True,
            "hogar_id": hogar_id,
            "estado_servicio": nuevo_estado,
            "motivo_suspension": motivo,
            "message": f"Estado del servicio actualizado a '{nuevo_estado}'"
        }


@ns.route("/dashboard/stats")
class DashboardStats(Resource):
    @jwt_required(optional=True)
    def get(self):
        """Retorna estadísticas globales consolidadas para el Dashboard de Administración."""
        try:
            return HogarModel.get_dashboard_stats()
        except Exception as e:
            ns.abort(500, f"Error obteniendo estadísticas: {e}")
