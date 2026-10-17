from api.models import home as HomeModel
from api.models import audit as AuditModel


def get_all(service_status: str = None):
    return HomeModel.find_all(service_status)


def get_by_id(home_id: int):
    home = HomeModel.find_by_id(home_id)
    if not home:
        return None, "Hogar no encontrado"
    return home, None


def create(data: dict, user_id: int = None):
    required = ("home_code", "owner_name", "contact_email")
    for field in required:
        if not data.get(field):
            return None, f"El campo '{field}' es requerido"

    existing = HomeModel.find_by_code(data["home_code"])
    if existing:
        return None, f"El código de hogar '{data['home_code']}' ya existe"

    data["changed_by"] = user_id
    new_id = HomeModel.create(data)

    AuditModel.record(
        user_id=user_id,
        home_id=new_id,
        action="CREATE_HOME",
        target_table="homes",
        target_id=new_id,
        detail={"home_code": data["home_code"], "owner_name": data["owner_name"]}
    )

    return {"success": True, "home_id": new_id, "message": "Home registered successfully"}, None


def update(home_id: int, data: dict, user_id: int = None):
    home = HomeModel.find_by_id(home_id)
    if not home:
        return False, "Hogar no encontrado"

    ok = HomeModel.update(home_id, data)
    if ok:
        AuditModel.record(
            user_id=user_id,
            home_id=home_id,
            action="UPDATE_HOME",
            target_table="homes",
            target_id=home_id,
            detail=data
        )
        return True, None
    return False, "No se realizaron cambios"


def set_status(home_id: int, new_status: str, reason: str = None, changed_by: int = None):
    valid_statuses = ("ACTIVE", "SUSPENDED", "DENIED", "TRIAL", "ACTIVO", "PRUEBA")
    # Normalize Spanish aliases to English
    status_map = {
        "ACTIVO": "ACTIVE",
        "PRUEBA": "TRIAL",
        "SUSPENDIDO": "SUSPENDED",
        "DENEGADO": "DENIED",
        "ACTIVE": "ACTIVE",
        "TRIAL": "TRIAL",
        "SUSPENDED": "SUSPENDED",
        "DENIED": "DENIED"
    }
    normalized = status_map.get(new_status.upper())
    if not normalized:
        return False, f"Estado '{new_status}' no válido. Opciones: ACTIVE, SUSPENDED, DENIED, TRIAL"

    ok, error = HomeModel.set_status(home_id, normalized, reason, changed_by)
    if not ok:
        return False, error

    AuditModel.record(
        user_id=changed_by,
        home_id=home_id,
        action=f"SET_HOME_STATUS_{normalized}",
        target_table="homes",
        target_id=home_id,
        detail={"new_status": normalized, "reason": reason}
    )

    return True, None


def get_history(home_id: int):
    home = HomeModel.find_by_id(home_id)
    if not home:
        return None, "Hogar no encontrado"
    return HomeModel.get_history(home_id), None


def get_dashboard_stats():
    return HomeModel.get_dashboard_stats()
