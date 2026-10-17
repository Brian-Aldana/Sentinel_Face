from api.models import audit as AuditModel


def get_all(home_id: int = None, limit=20, page=1):
    return AuditModel.find_all(home_id=home_id, limit=limit, page=page)


def get_by_id(audit_id: int):
    entry = AuditModel.find_by_id(audit_id)
    if not entry:
        return None, "Registro no encontrado"
    return entry, None