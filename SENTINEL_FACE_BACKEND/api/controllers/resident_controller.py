import re
from api.models import resident as ResidentModel
from api.models import home as HomeModel
from api.models import audit as AuditModel
from face_logic import process_registration


def _sanitize(text: str) -> str:
    return re.sub(r"[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-\.]", "", text).strip()


def get_all(home_id: int = None, include_inactive: bool = False):
    return ResidentModel.find_all(home_id=home_id, include_inactive=include_inactive)


def get_by_id(resident_id: int):
    resident = ResidentModel.find_by_id(resident_id)
    if not resident:
        return None, "Residente no encontrado"
    return resident, None


def register(name: str, document_id: str, user_id: int, image_bytes: bytes, home_id: int = None):
    clean_name = _sanitize(name)
    if not clean_name:
        return None, "Nombre con caracteres inválidos"

    if home_id:
        active, msg = HomeModel.is_service_active(home_id)
        if not active:
            return None, f"No es posible registrar residentes: {msg}"

        home = HomeModel.find_by_id(home_id)
        if home and home.get("total_residents", 0) >= home.get("max_residents", 10):
            return None, f"El hogar ha alcanzado su límite de {home.get('max_residents')} residentes autorizados"

    try:
        embedding = process_registration(image_bytes, skip_liveness=True)
    except ValueError as e:
        return None, str(e)

    try:
        new_id = ResidentModel.create(
            clean_name, document_id or None, embedding.tobytes(), user_id, image_bytes, home_id=home_id
        )
    except Exception as e:
        if "Duplicate" in str(e):
            return None, "El documento ya está registrado"
        return None, str(e)

    AuditModel.record(user_id=user_id, home_id=home_id, action="CREATE_RESIDENT", target_table="residents",
                      target_id=new_id, detail={"full_name": clean_name, "document_id": document_id})
    return {"success": True, "resident_id": new_id}, None


def get_image(resident_id: int):
    return ResidentModel.get_image(resident_id)


def remove(resident_id: int, user_id: int):
    full_name = ResidentModel.delete(resident_id)
    if full_name is None:
        return False, "Residente no encontrado"
    AuditModel.record(user_id=user_id, action="DELETE_RESIDENT", target_table="residents",
                      target_id=resident_id, detail={"full_name": full_name})
    return True, None


def deactivate(resident_id: int, user_id: int):
    full_name, err = ResidentModel.deactivate(resident_id)
    if err:
        return False, err
    AuditModel.record(user_id=user_id, action="DEACTIVATE_RESIDENT", target_table="residents",
                      target_id=resident_id, detail={"full_name": full_name})
    return True, None


def activate(resident_id: int, user_id: int):
    full_name, err = ResidentModel.activate(resident_id)
    if err:
        return False, err
    AuditModel.record(user_id=user_id, action="ACTIVATE_RESIDENT", target_table="residents",
                      target_id=resident_id, detail={"full_name": full_name})
    return True, None
