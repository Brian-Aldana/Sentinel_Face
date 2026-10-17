from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.controllers import home_controller
from api.decorators import admin_required

ns = Namespace("homes", description="Residential homes management")

home_create_model = ns.model("HomeCreate", {
    "home_code":      fields.String(required=True, description="Unique home code (e.g. HOG-001)"),
    "owner_name":     fields.String(required=True, description="Owner full name"),
    "address":        fields.String(description="Residential physical address"),
    "phone":          fields.String(description="Contact phone number"),
    "contact_email":  fields.String(required=True, description="Contact email address"),
    "service_status": fields.String(default="ACTIVE", description="ACTIVE, SUSPENDED, DENIED, TRIAL"),
    "max_residents":  fields.Integer(default=10, description="Maximum resident capacity"),
    "max_cameras":    fields.Integer(default=2, description="Maximum camera limit"),
    "notes":          fields.String(description="Administrative notes"),
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
    "service_status":    fields.String(required=True, description="New status: ACTIVE, SUSPENDED, DENIED, TRIAL"),
    "suspension_reason": fields.String(description="Reason when suspending or denying service"),
})


@ns.route("")
class HomeList(Resource):
    @ns.response(200, "List of residential homes")
    def get(self):
        status = request.args.get("status")
        return home_controller.get_all(status)

    @admin_required
    @ns.expect(home_create_model)
    @ns.response(201, "Home created successfully")
    @ns.response(400, "Invalid data")
    @ns.response(409, "Home code already exists")
    def post(self):
        data = request.get_json() or {}
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else None

        result, error = home_controller.create(data, user_id=user_id)
        if error:
            code = 409 if "ya existe" in error.lower() or "exists" in error.lower() else 400
            ns.abort(code, error)
        return result, 201


@ns.route("/my-home")
class MyHomeDetail(Resource):
    @jwt_required()
    @ns.response(200, "Home details for authenticated user")
    @ns.response(404, "Home not found or no home assigned")
    def get(self):
        identity = get_jwt_identity()
        home_id = identity.get("home_id") if isinstance(identity, dict) else None
        if not home_id:
            ns.abort(404, "No home assigned to this user")
        home, error = home_controller.get_by_id(home_id)
        if error:
            ns.abort(404, error)
        return home


@ns.route("/<int:home_id>")
class HomeDetail(Resource):
    @ns.response(200, "Home detail")
    @ns.response(404, "Home not found")
    def get(self, home_id):
        home, error = home_controller.get_by_id(home_id)
        if error:
            ns.abort(404, error)
        return home

    @admin_required
    @ns.expect(home_update_model)
    @ns.response(200, "Home updated")
    @ns.response(404, "Home not found")
    def put(self, home_id):
        data = request.get_json() or {}
        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else None

        ok, error = home_controller.update(home_id, data, user_id=user_id)
        if not ok:
            ns.abort(400, error or "Could not update home")
        return {"success": True, "message": "Home updated successfully"}


@ns.route("/<int:home_id>/status")
class HomeStatus(Resource):
    @admin_required
    @ns.expect(status_change_model)
    @ns.response(200, "Service status updated")
    @ns.response(400, "Invalid status")
    @ns.response(404, "Home not found")
    def put(self, home_id):
        data = request.get_json() or {}
        new_status = data.get("service_status")
        reason = data.get("suspension_reason")

        if not new_status:
            ns.abort(400, "Field 'service_status' is required")

        identity = get_jwt_identity()
        user_id = identity.get("user_id") if isinstance(identity, dict) else None

        ok, error = home_controller.set_status(home_id, new_status, reason, changed_by=user_id)
        if not ok:
            code = 404 if "not found" in (error or "").lower() or "no encontrado" in (error or "").lower() else 400
            ns.abort(code, error)

        return {
            "success": True,
            "home_id": home_id,
            "service_status": new_status,
            "suspension_reason": reason,
            "message": f"Home {home_id} status updated to {new_status}"
        }


@ns.route("/<int:home_id>/history")
class HomeHistory(Resource):
    @ns.response(200, "Status transition history")
    @ns.response(404, "Home not found")
    def get(self, home_id):
        history, error = home_controller.get_history(home_id)
        if error:
            ns.abort(404, error)
        return history


@ns.route("/dashboard/stats")
class HomeDashboardStats(Resource):
    @ns.response(200, "Home dashboard statistics")
    def get(self):
        return home_controller.get_dashboard_stats()
