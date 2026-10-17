import cv2
from datetime import datetime

STATUS_COLORS = {
    "GRANTED":  (40,  200,  80),
    "DENIED":   (50,   50, 220),
    "SPOOFING": (0,    80, 220),
    "ERROR":    (100, 100, 100),
    "WAITING":  (160, 160, 160),
}

FONT       = cv2.FONT_HERSHEY_SIMPLEX
FONT_BOLD  = cv2.FONT_HERSHEY_DUPLEX

# ── Botón de reconocimiento ────────────────────────────────────────────────────
BTN_W = 190
BTN_H = 48
BTN_MARGIN_BOTTOM = 18   # px desde el borde inferior del frame

def get_button_rect(w: int, h: int) -> tuple[int, int, int, int]:
    """Devuelve (x1, y1, x2, y2) del botón de reconocimiento."""
    x1 = (w - BTN_W) // 2
    y1 = h - BTN_H - BTN_MARGIN_BOTTOM
    return x1, y1, x1 + BTN_W, y1 + BTN_H


def _draw_button(frame, w: int, h: int, state: str):
    """
    Dibuja el botón de reconocimiento sobre el frame.

    state:
      'ready'    → verde  — cara detectada, listo para reconocer
      'busy'     → gris   — request en vuelo o capturando frames
      'no_face'  → rojo apagado — no hay cara en el encuadre
    """
    x1, y1, x2, y2 = get_button_rect(w, h)

    if state == "ready":
        bg_color     = (34, 160, 64)
        border_color = (60, 220, 90)
        text_color   = (240, 255, 240)
        label        = "  RECONOCER"
    elif state == "busy":
        bg_color     = (50, 50, 60)
        border_color = (90, 90, 100)
        text_color   = (150, 150, 160)
        label        = "  PROCESANDO..."
    else:  # no_face
        bg_color     = (40, 30, 30)
        border_color = (90, 60, 60)
        text_color   = (140, 100, 100)
        label        = "  SIN CARA"

    # Sombra
    shadow_offset = 3
    cv2.rectangle(
        frame,
        (x1 + shadow_offset, y1 + shadow_offset),
        (x2 + shadow_offset, y2 + shadow_offset),
        (10, 10, 10), -1,
    )

    # Fondo del botón
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), bg_color, -1)
    cv2.addWeighted(overlay, 0.88, frame, 0.12, 0, frame)

    # Borde
    cv2.rectangle(frame, (x1, y1), (x2, y2), border_color, 2)

    # Texto centrado verticalmente
    (tw, th), _ = cv2.getTextSize(label, FONT_BOLD, 0.62, 1)
    tx = x1 + (BTN_W - tw) // 2
    ty = y1 + (BTN_H + th) // 2 - 2
    cv2.putText(frame, label, (tx, ty), FONT_BOLD, 0.62, text_color, 1, cv2.LINE_AA)


# ── Función principal de dibujado ──────────────────────────────────────────────

def draw_frame(
    frame,
    result:           dict,
    faces,
    cam_label:        str,
    collecting:       bool,
    collect_progress: float,
    busy:             bool = False,
    face_found:       bool = False,
):
    """
    Dibuja el overlay completo sobre el frame incluyendo:
    - Barra de estado superior
    - Rectángulos de cara detectada
    - Barra de progreso de captura
    - Botón de reconocimiento clickeable
    """
    h, w = frame.shape[:2]

    access   = result.get("access",   "WAITING")
    liveness = result.get("liveness", "")
    person   = result.get("person",   "")
    conf     = result.get("confidence", 0.0)

    if liveness == "SPOOFING":
        access = "SPOOFING"

    color = STATUS_COLORS.get(access, STATUS_COLORS["WAITING"])

    # ── Barra superior ──────────────────────────────────────────────────────
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 56), (10, 10, 20), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

    status_lbl = access
    cv2.putText(frame, status_lbl, (14, 38), FONT_BOLD, 1.0, color, 2, cv2.LINE_AA)

    if person:
        detail = f"{person}  {conf:.0%}" if conf > 0 else person
        cv2.putText(frame, detail, (180, 38), FONT, 0.7, (230, 230, 230), 1, cv2.LINE_AA)

    ts = datetime.now().strftime("%H:%M:%S")
    cv2.putText(frame, ts, (w - 88, 38), FONT, 0.55, (140, 140, 140), 1, cv2.LINE_AA)

    # ── Etiqueta de cámara ──────────────────────────────────────────────────
    cv2.putText(frame, cam_label, (14, h - BTN_H - BTN_MARGIN_BOTTOM - 10),
                FONT, 0.45, (120, 120, 120), 1, cv2.LINE_AA)

    # ── Caras detectadas ────────────────────────────────────────────────────
    for (x, y, fw, fh) in faces:
        cv2.rectangle(frame, (x, y), (x + fw, y + fh), color, 2)
        cv2.rectangle(frame, (x, y - 22), (x + fw, y), color, -1)
        cv2.putText(frame, "Detectado", (x + 4, y - 6), FONT, 0.45, (15, 15, 15), 1, cv2.LINE_AA)

    # ── Barra de progreso de captura ────────────────────────────────────────
    if collecting:
        bar_w = int(collect_progress * (w - 4))
        cv2.rectangle(frame, (2, h - 6), (2 + bar_w, h - 2), (0, 200, 100), -1)

    # ── Botón ───────────────────────────────────────────────────────────────
    if collecting or busy:
        btn_state = "busy"
    elif face_found:
        btn_state = "ready"
    else:
        btn_state = "no_face"

    _draw_button(frame, w, h, btn_state)

    # ── Borde de frame ──────────────────────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (w - 1, h - 1), color, 2)

    return frame
