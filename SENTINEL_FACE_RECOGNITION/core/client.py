import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import API_URL, REQUEST_TIMEOUT
from utils.logger import log


# ── Sesión HTTP compartida con keep-alive y retry automático ──────────────────
def _build_session() -> requests.Session:
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,          # espera 1s, 2s, 4s entre reintentos
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["POST"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://",  adapter)
    return session


_session = _build_session()


def recognize(frame_bytes: list[bytes], cam_id: int) -> dict:
    """
    Envía N frames al endpoint POST /api/recognize usando una sesión
    HTTP persistente con keep-alive y retry automático.

    Formato multipart: frame_000, frame_001, ..., frame_00N
    Retorna el JSON de respuesta o un dict de error estandarizado.
    """
    files = {
        f"frame_{i:03d}": (f"frame_{i:03d}.jpg", b, "image/jpeg")
        for i, b in enumerate(frame_bytes)
    }

    log("SEND", f"Enviando {len(frame_bytes)} frame(s) a la API...", cam_id)
    t0 = time.perf_counter()

    try:
        r = _session.post(
            f"{API_URL}/recognize",
            files=files,
            timeout=(6, REQUEST_TIMEOUT),   # (connect_timeout, read_timeout)
        )
        elapsed = time.perf_counter() - t0
        r.raise_for_status()
        data = r.json()
        log("INFO", f"Respuesta recibida en {elapsed:.1f}s", cam_id)
        return data

    except requests.exceptions.Timeout:
        elapsed = time.perf_counter() - t0
        log("ERR", f"Timeout después de {elapsed:.1f}s — el backend tardó demasiado", cam_id)
        return {"access": "ERROR", "liveness": "UNKNOWN", "person": "Timeout", "confidence": 0.0}

    except requests.exceptions.ConnectionError as e:
        log("ERR", f"Sin conexión al backend: {str(e)[:60]}", cam_id)
        return {"access": "ERROR", "liveness": "UNKNOWN", "person": "Sin conexión", "confidence": 0.0}

    except requests.exceptions.HTTPError as e:
        body = ""
        try:
            body = e.response.text[:120]
        except Exception:
            pass
        log("ERR", f"HTTP {e.response.status_code}: {body}", cam_id)
        return {"access": "ERROR", "liveness": "UNKNOWN", "person": f"HTTP {e.response.status_code}", "confidence": 0.0}

    except Exception as e:
        log("ERR", f"Error inesperado: {str(e)[:80]}", cam_id)
        return {"access": "ERROR", "liveness": "UNKNOWN", "person": "Error", "confidence": 0.0}
