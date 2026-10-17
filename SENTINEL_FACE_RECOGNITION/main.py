import sys
import time
import queue
import threading
import cv2

import config
from core.camera  import list_cameras, open_camera, encode_frame, detect_faces
from core.client  import recognize
from core.display import draw_frame, get_button_rect
from utils.logger import log


# ── Worker de reconocimiento (hilo separado por cámara) ───────────────────────

def recognize_worker(
    cam_id:     int,
    task_queue: queue.Queue,
    result_ref: dict,
    busy_flag:  threading.Event,
    stop_event: threading.Event,
):
    """
    Hilo dedicado al envío HTTP para una cámara.
    Toma lotes de frames crudos de la cola, los codifica y llama a la API.
    Corre de forma independiente para no bloquear el hilo de captura/display.
    """
    while not stop_event.is_set():
        try:
            raw_frames = task_queue.get(timeout=0.5)
        except queue.Empty:
            continue

        try:
            busy_flag.set()
            # Encoding en este hilo, no en el principal
            encoded = [encode_frame(f, config.JPEG_QUALITY) for f in raw_frames]
            result  = recognize(encoded, cam_id)

            # Actualizar resultado compartido de forma segura
            result_ref.update(result)

            access   = result.get("access",   "?")
            liveness = result.get("liveness", "?")
            person   = result.get("person",   "?")
            conf     = result.get("confidence", 0.0)

            if liveness == "SPOOFING":
                tag = "SPOOF"
            elif access == "GRANTED":
                tag = "OK"
            else:
                tag = "WARN"

            log(tag, f"{access} | {liveness} | {person} ({conf:.0%})", cam_id)
        finally:
            busy_flag.clear()
            task_queue.task_done()


# ── Worker de cámara (hilo principal por cámara) ───────────────────────────────

def camera_worker(cam_info: dict, stop_event: threading.Event):
    """
    Hilo independiente para una sola cámara.
    Detecta caras localmente y despacha reconocimientos al recognize_worker
    a través de una cola — el display nunca se bloquea esperando HTTP.
    """
    idx       = cam_info["index"]
    label     = cam_info["label"]
    win_title = f"Sentinel Face - {label}"

    log("CAM", f"Abriendo {label}...", idx)

    try:
        cap = open_camera(idx, config.CAP_WIDTH, config.CAP_HEIGHT)
    except RuntimeError as e:
        log("ERR", str(e), idx)
        return

    log("OK", f"{label} activa ({config.CAP_WIDTH}x{config.CAP_HEIGHT})", idx)

    # Estado compartido entre este hilo y el recognize_worker
    last_result = {"access": "WAITING", "liveness": "", "person": "Acércate a la cámara", "confidence": 0.0}
    busy_flag   = threading.Event()          # True mientras hay request en vuelo
    task_queue  = queue.Queue(maxsize=1)     # máximo 1 lote pendiente por cámara

    # Lanzar el hilo de reconocimiento para esta cámara
    rw_thread = threading.Thread(
        target=recognize_worker,
        args=(idx, task_queue, last_result, busy_flag, stop_event),
        daemon=True,
    )
    rw_thread.start()

    last_faces         = []
    last_time          = 0.0
    face_stable        = 0
    collecting         = False
    raw_frames         = []
    collect_frame_count = 0   # contador de frames leídos durante la colección

    cv2.namedWindow(win_title, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(win_title, config.CAP_WIDTH, config.CAP_HEIGHT)

    # ── Mouse callback para el botón ─────────────────────────────────────────
    mouse_state = {"clicked": False}

    def on_mouse(event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN:
            bx1, by1, bx2, by2 = get_button_rect(config.CAP_WIDTH, config.CAP_HEIGHT)
            if bx1 <= x <= bx2 and by1 <= y <= by2:
                param["clicked"] = True

    cv2.setMouseCallback(win_title, on_mouse, mouse_state)

    while not stop_event.is_set():
        ok, frame = cap.read()
        if not ok:
            log("WARN", "Frame vacío, reintentando...", idx)
            time.sleep(0.05)
            continue

        frame = cv2.flip(frame, 1)
        now   = time.time()

        face_found, faces = detect_faces(frame)

        if face_found:
            face_stable += 1
            last_faces   = faces
        else:
            face_stable = max(0, face_stable - 1)
            if face_stable == 0 and not collecting:
                last_faces = []

        key           = cv2.waitKey(1) & 0xFF

        # Trigger: ESPACIO o click en el botón — requiere cara y cooldown cumplido
        btn_clicked   = mouse_state["clicked"]
        mouse_state["clicked"] = False   # consumir el click

        triggered = (
            (key == 32 or btn_clicked)
            and face_found
            and not busy_flag.is_set()
            and task_queue.empty()
            and (now - last_time) > config.COOLDOWN
        )

        if triggered and not collecting:
            collecting          = True
            raw_frames          = []
            collect_frame_count = 0
            face_stable         = 0
            total_time          = config.N_FRAMES * config.FRAME_INTERVAL / 30.0
            log("INFO", f"Capturando {config.N_FRAMES} frames (1 de cada {config.FRAME_INTERVAL}) ~{total_time:.1f}s...", idx)

        if collecting:
            collect_frame_count += 1
            # Solo guardar 1 de cada FRAME_INTERVAL frames para distribuirlos en el tiempo
            if collect_frame_count % config.FRAME_INTERVAL == 0:
                raw_frames.append(frame.copy())
            progress = len(raw_frames) / config.N_FRAMES

            if len(raw_frames) >= config.N_FRAMES:
                collecting = False
                last_time  = now

                # Encolar para el hilo de reconocimiento (no bloquea si ya hay uno)
                if task_queue.empty():
                    task_queue.put_nowait(raw_frames.copy())
                else:
                    log("WARN", "Cola ocupada, descartando lote", idx)
        else:
            progress = 0.0


        display = draw_frame(
            frame.copy(),
            last_result,
            last_faces if face_found else [],
            label,
            collecting,
            progress,
            busy      = busy_flag.is_set(),
            face_found= face_found,
        )

        cv2.imshow(win_title, display)

        if key == ord("q"):
            stop_event.set()
            break

    cap.release()
    cv2.destroyWindow(win_title)
    log("INFO", f"{label} cerrada.", idx)


# ── Selección de cámaras ───────────────────────────────────────────────────────

def select_cameras(cameras: list[dict]) -> list[dict]:
    print("\n  Cámaras disponibles:\n")
    for cam in cameras:
        print(f"    [{cam['index']}] {cam['label']}")

    print(f"\n    [a] Usar todas ({len(cameras)} cámaras simultáneas)")
    print( "    [q] Salir\n")

    while True:
        choice = input("  Selección: ").strip().lower()

        if choice == "q":
            sys.exit(0)

        if choice == "a":
            return cameras

        try:
            idx = int(choice)
            match = [c for c in cameras if c["index"] == idx]
            if match:
                return match
            print("  Índice no válido. Intenta de nuevo.")
        except ValueError:
            print("  Entrada no reconocida. Escribe un número, 'a' o 'q'.")


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 56)
    print("  Sentinel Face - Cliente de reconocimiento facial")
    print("=" * 56)
    print(f"  Backend  : {config.API_URL}")
    print(f"  Frames   : {config.N_FRAMES} por reconocimiento")
    print(f"  Cooldown : {config.COOLDOWN}s  |  Estabilidad: {config.FACE_STABLE_THRESHOLD} frames")
    print(f"  Calidad  : JPEG {config.JPEG_QUALITY}%  |  Timeout: {config.REQUEST_TIMEOUT}s")
    print( "  Click en el botón RECONOCER o ESPACIO para iniciar  |  Q = salir")
    print("=" * 56 + "\n")

    log("INFO", "Detectando cámaras disponibles...")
    cameras = list_cameras(max_index=10)

    if not cameras:
        log("ERR", "No se encontró ninguna cámara. Conecta una y vuelve a intentarlo.")
        sys.exit(1)

    log("OK", f"{len(cameras)} cámara(s) encontrada(s).")

    selected = select_cameras(cameras)

    stop_event = threading.Event()
    threads    = []

    for cam in selected:
        t = threading.Thread(target=camera_worker, args=(cam, stop_event), daemon=True)
        t.start()
        threads.append(t)
        time.sleep(0.3)

    log("INFO", "Presiona Q en cualquier ventana para salir.\n")

    try:
        while not stop_event.is_set():
            time.sleep(0.25)
    except KeyboardInterrupt:
        log("INFO", "Interrupción recibida. Cerrando...")
        stop_event.set()

    for t in threads:
        t.join(timeout=5)

    cv2.destroyAllWindows()
    log("OK", "Sesión terminada.")


if __name__ == "__main__":
    main()
