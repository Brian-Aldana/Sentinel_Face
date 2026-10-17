from flask_restx import Namespace, Resource, fields
from flask import request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.controllers import resident_controller
from api.decorators import home_admin_required, admin_required

ns = Namespace("residents", description="Gestión de residentes autorizados del hogar")

resident_model = ns.model("Resident", {
    "resident_id":   fields.Integer,
    "home_id":       fields.Integer,
    "full_name":     fields.String,
    "document_id":   fields.String,
    "is_active":     fields.Boolean,
    "registered_by": fields.String,
    "created_at":    fields.String,
    "updated_at":    fields.String,
})

deactivate_model = ns.model("DeactivateResident", {
    "user_id": fields.Integer(required=False),
})


@ns.route("")
class ResidentList(Resource):
    @jwt_required()
    @ns.response(200, "Lista de residentes autorizados")
    def get(self):
        identity = get_jwt_identity()
        roles = identity.get("roles", []) if isinstance(identity, dict) else []
        home_id = None

        if "home_admin" in roles:
            home_id = identity.get("home_id")
        else:
            home_param = request.args.get("home_id")
            if home_param:
                try:
                    home_id = int(home_param)
                except ValueError:
                    pass

        include_inactive = request.args.get("include_inactive", "false").lower() == "true"
        residents = resident_controller.get_all(home_id=home_id, include_inactive=include_inactive)
        return {"residents": residents}

    @home_admin_required
    @ns.response(201, "Residente registrado exitosamente")
    @ns.response(400, "Datos inválidos")
    @ns.response(409, "Documento duplicado")
    def post(self):
        name = request.form.get("full_name", "").strip()
        document = request.form.get("document_id", "").strip()
        image_file = request.files.get("photo")

        if not name or not image_file:
            ns.abort(400, "Nombre y fotografía son requeridos")

        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else None
        roles = identity.get("roles", []) if isinstance(identity, dict) else []

        home_id = None
        if "home_admin" in roles:
            home_id = identity.get("home_id")
        else:
            home_param = request.form.get("home_id")
            if home_param:
                try:
                    home_id = int(home_param)
                except ValueError:
                    pass
            if not home_id:
                home_id = identity.get("home_id") or 1

        result, error = resident_controller.register(
            name=name,
            document_id=document,
            user_id=user_id,
            image_bytes=image_file.read(),
            home_id=home_id
        )
        if error:
            code = 409 if "duplicado" in error.lower() else 400
            ns.abort(code, error)
        return result, 201


@ns.route("/<int:resident_id>")
class ResidentItem(Resource):
    @jwt_required()
    @ns.response(200, "Residente encontrado", resident_model)
    @ns.response(404, "No encontrado")
    def get(self, resident_id):
        resident, error = resident_controller.get_by_id(resident_id)
        if error:
            ns.abort(404, error)
        return resident

    @home_admin_required
    @ns.response(200, "Residente eliminado")
    @ns.response(404, "No encontrado")
    def delete(self, resident_id):
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else None
        ok, error = resident_controller.remove(resident_id, user_id)
        if error:
            ns.abort(404, error)
        return {"success": True}


@ns.route("/<int:resident_id>/photo")
class ResidentPhoto(Resource):
    @jwt_required()
    @ns.response(200, "Foto del residente")
    @ns.response(404, "Foto no disponible")
    def get(self, resident_id):
        photo_bytes = resident_controller.get_image(resident_id)
        if not photo_bytes:
            ns.abort(404, "Foto no disponible")
        return Response(photo_bytes, mimetype="image/jpeg")


@ns.route("/<int:resident_id>/deactivate")
class ResidentDeactivate(Resource):
    @home_admin_required
    @ns.response(200, "Residente desactivado")
    @ns.response(404, "No encontrado")
    def patch(self, resident_id):
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else None
        ok, error = resident_controller.deactivate(resident_id, user_id)
        if error:
            ns.abort(400, error)
        return {"success": True}


@ns.route("/<int:resident_id>/activate")
class ResidentActivate(Resource):
    @home_admin_required
    @ns.response(200, "Residente activado")
    @ns.response(404, "No encontrado")
    def patch(self, resident_id):
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else None
        ok, error = resident_controller.activate(resident_id, user_id)
        if error:
            ns.abort(400, error)
        return {"success": True}
