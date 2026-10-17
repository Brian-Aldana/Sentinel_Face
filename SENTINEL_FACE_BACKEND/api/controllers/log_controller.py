from api.models import log as LogModel
from api.models import alert as AlertModel
from api.models import employee as EmployeeModel
from face_logic import process_recognition


def get_all(result_filter=None, limit=20, page=1):
    return LogModel.find_all(result_filter, limit, page)


def get_by_id(log_id: int):
    log = LogModel.find_by_id(log_id)
    if not log:
        return None, "Log no encontrado"
    return log, None


from api.models import hogar as HogarModel

def recognize(frame_bytes_list: list, hogar_id: int = 1):
    # Verificación de estado de servicio del hogar (SaaS Provider Check)
    activo, motivo = HogarModel.is_service_active(hogar_id)
    if not activo:
        return {
            "status": "DENIED",
            "access": "DENIED",
            "person": "SERVICIO DENEGADO",
            "user_id": None,
            "confidence": 0.0,
            "liveness": "REAL",
            "message": f"Servicio no disponible: {motivo}",
        }

    employees = EmployeeModel.find_active_with_embeddings()
    result    = process_recognition(frame_bytes_list, employees)

    snapshot   = frame_bytes_list[len(frame_bytes_list) // 2]
    emp_id     = result.get("user_id")
    access     = result.get("access")
    confidence = result.get("confidence", 0.0)
    liveness   = result.get("liveness", "UNKNOWN")

    log_id = LogModel.create(emp_id, access, confidence, liveness, snapshot)

    if liveness == "SPOOFING":
        AlertModel.create(log_id, "SPOOFING_ATTEMPT", "HIGH", result.get("message"))
    elif access == "DENIED" and liveness == "REAL":
        AlertModel.create(log_id, "UNKNOWN_FACE", "LOW")

    return result


def remove(log_id: int):
    if not LogModel.delete(log_id):
        return False, "Log no encontrado"
    return True, None


def get_image(log_id: int):
    return LogModel.get_image(log_id)