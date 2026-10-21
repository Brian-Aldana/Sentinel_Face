from api.models import alert as AlertModel
from api.models import audit as AuditModel


def get_all(resolved=0, home_id: int = None, limit=20, page=1):
    return AlertModel.find_all(resolved=resolved, home_id=home_id, limit=limit, page=page)


def get_by_id(alert_id: int):
    alert = AlertModel.find_by_id(alert_id)
    if not alert:
        return None, "Alerta no encontrada"
    return alert, None


def resolve(alert_id: int, user_id: int = None):
    ok, err = AlertModel.resolve(alert_id, user_id)
    if not ok:
        return False, err or "Alerta no encontrada"
    AuditModel.record(user_id=user_id, action="RESOLVE_ALERT", target_table="security_alerts", target_id=alert_id)
    return True, None


def remove(alert_id: int):
    if not AlertModel.delete(alert_id):
        return False, "Alerta no encontrada"
    return True, None
