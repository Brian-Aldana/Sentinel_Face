from api.models import log as LogModel
from api.models import alert as AlertModel
from api.models import resident as ResidentModel
from api.models import home as HomeModel
from face_logic import process_recognition


def get_all(result_filter=None, home_id: int = None, limit=20, page=1):
    return LogModel.find_all(result_filter, home_id, limit, page)


def get_by_id(log_id: int):
    log = LogModel.find_by_id(log_id)
    if not log:
        return None, "Log no encontrado"
    return log, None


def recognize(frame_bytes_list: list, home_id: int = 1):
    active, reason = HomeModel.is_service_active(home_id)
    if not active:
        return {
            "status": "DENIED",
            "access": "DENIED",
            "person": "SERVICIO DENEGADO",
            "user_id": None,
            "confidence": 0.0,
            "liveness": "REAL",
            "message": f"Servicio no disponible: {reason}",
        }

    residents = ResidentModel.get_all_active_embeddings(home_id=home_id)
    # Format embeddings list expected by face_logic
    # face_logic expects items with {"user_id", "embedding", "full_name"}
    formatted_candidates = []
    for r in residents:
        formatted_candidates.append({
            "user_id": r["resident_id"],
            "resident_id": r["resident_id"],
            "full_name": r["full_name"],
            "embedding": r["embedding"],
        })

    result = process_recognition(frame_bytes_list, formatted_candidates)

    snapshot = frame_bytes_list[len(frame_bytes_list) // 2]
    resident_id = result.get("user_id")
    access = result.get("access")
    confidence = result.get("confidence", 0.0)
    liveness = result.get("liveness", "UNKNOWN")

    log_id = LogModel.create(
        resident_id=resident_id,
        access_result=access,
        confidence=confidence,
        liveness=liveness,
        snapshot_img=snapshot,
        home_id=home_id
    )

    if liveness == "SPOOFING":
        AlertModel.create(
            alert_type="SPOOFING_ATTEMPT",
            severity="HIGH",
            description=result.get("message") or "Intento de suplantación detectado",
            log_id=log_id,
            home_id=home_id
        )
    elif access == "DENIED" and liveness == "REAL":
        AlertModel.create(
            alert_type="UNKNOWN_FACE",
            severity="LOW",
            description="Rostro desconocido detectado en acceso",
            log_id=log_id,
            home_id=home_id
        )

    return result


def remove(log_id: int):
    if not LogModel.delete(log_id):
        return False, "Log no encontrado"
    return True, None


def get_image(log_id: int):
    return LogModel.get_image(log_id)