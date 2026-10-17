import json
from decimal import Decimal
from db import get_db


def _clean_val(v):
    if isinstance(v, Decimal):
        return int(v) if v % 1 == 0 else float(v)
    return v


def _clean_dict(d):
    if not isinstance(d, dict):
        return d
    return {k: _clean_val(v) for k, v in d.items()}


def find_all(estado: str = None):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT h.hogar_id, h.codigo_hogar, h.nombre_titular, h.direccion,
                   h.telefono, h.email_contacto, h.estado_servicio, h.motivo_suspension,
                   h.limite_personas, h.limite_camaras, h.notas, h.created_at, h.updated_at,
                   (SELECT COUNT(*) FROM employees e WHERE e.hogar_id = h.hogar_id AND e.is_active = 1) AS total_personas,
                   (SELECT COUNT(*) FROM access_logs al WHERE al.hogar_id = h.hogar_id) AS total_accesos,
                   (SELECT COUNT(*) FROM security_alerts sa WHERE sa.hogar_id = h.hogar_id AND sa.resolved = 0) AS alertas_activas
            FROM hogares h
        """
        params = []
        if estado:
            query += " WHERE h.estado_servicio = %s"
            params.append(estado)
        query += " ORDER BY h.created_at DESC"

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        for r in rows:
            for f in ("created_at", "updated_at"):
                if r.get(f):
                    r[f] = r[f].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


def find_by_id(hogar_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT h.hogar_id, h.codigo_hogar, h.nombre_titular, h.direccion,
                   h.telefono, h.email_contacto, h.estado_servicio, h.motivo_suspension,
                   h.limite_personas, h.limite_camaras, h.notas, h.created_at, h.updated_at,
                   (SELECT COUNT(*) FROM employees e WHERE e.hogar_id = h.hogar_id AND e.is_active = 1) AS total_personas,
                   (SELECT COUNT(*) FROM access_logs al WHERE al.hogar_id = h.hogar_id) AS total_accesos,
                   (SELECT COUNT(*) FROM security_alerts sa WHERE sa.hogar_id = h.hogar_id AND sa.resolved = 0) AS alertas_activas
            FROM hogares h
            WHERE h.hogar_id = %s
        """, (hogar_id,))
        row = cursor.fetchone()
        if row:
            for f in ("created_at", "updated_at"):
                if row.get(f):
                    row[f] = row[f].isoformat()
        return row
    finally:
        cursor.close()
        conn.close()


def find_by_codigo(codigo_hogar: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM hogares WHERE codigo_hogar = %s", (codigo_hogar,))
        row = cursor.fetchone()
        if row:
            for f in ("created_at", "updated_at"):
                if row.get(f):
                    row[f] = row[f].isoformat()
        return row
    finally:
        cursor.close()
        conn.close()


def is_service_active(hogar_id: int) -> tuple[bool, str]:
    """Retorna (activo: bool, mensaje: str) verificando el estado del servicio del hogar."""
    if not hogar_id:
        return True, "OK"  # Retrocompatibilidad

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT estado_servicio, motivo_suspension FROM hogares WHERE hogar_id = %s",
            (hogar_id,)
        )
        row = cursor.fetchone()
        if not row:
            return False, "Hogar no registrado en el sistema"

        estado = row["estado_servicio"]
        motivo = row.get("motivo_suspension") or "Sin motivo especificado"

        if estado == "ACTIVO":
            return True, "Servicio activo"
        elif estado == "PRUEBA":
            return True, "Servicio en periodo de prueba"
        elif estado == "SUSPENDIDO":
            return False, f"Servicio suspendido por el proveedor: {motivo}"
        elif estado == "DENEGADO":
            return False, f"Servicio denegado o cancelado: {motivo}"
        return False, f"Estado de servicio no válido ({estado})"
    finally:
        cursor.close()
        conn.close()


def create(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO hogares (
                codigo_hogar, nombre_titular, direccion, telefono, email_contacto,
                estado_servicio, limite_personas, limite_camaras, notas
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data["codigo_hogar"],
            data["nombre_titular"],
            data.get("direccion"),
            data.get("telefono"),
            data["email_contacto"],
            data.get("estado_servicio", "ACTIVO"),
            data.get("limite_personas", 10),
            data.get("limite_camaras", 2),
            data.get("notas"),
        ))
        new_id = cursor.lastrowid
        conn.commit()
        return new_id
    finally:
        cursor.close()
        conn.close()


def update(hogar_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE hogares
            SET nombre_titular = COALESCE(%s, nombre_titular),
                direccion      = COALESCE(%s, direccion),
                telefono       = COALESCE(%s, telefono),
                email_contacto = COALESCE(%s, email_contacto),
                limite_personas= COALESCE(%s, limite_personas),
                limite_camaras = COALESCE(%s, limite_camaras),
                notas          = COALESCE(%s, notas)
            WHERE hogar_id = %s
        """, (
            data.get("nombre_titular"),
            data.get("direccion"),
            data.get("telefono"),
            data.get("email_contacto"),
            data.get("limite_personas"),
            data.get("limite_camaras"),
            data.get("notas"),
            hogar_id,
        ))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()


def set_status(hogar_id: int, nuevo_estado: str, motivo: str = None, cambiado_por: int = None):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Obtener estado anterior
        cursor.execute("SELECT estado_servicio FROM hogares WHERE hogar_id = %s", (hogar_id,))
        row = cursor.fetchone()
        estado_anterior = row["estado_servicio"] if row else None

        # 2. Actualizar estado en hogares
        cursor.execute("""
            UPDATE hogares
            SET estado_servicio = %s,
                motivo_suspension = %s
            WHERE hogar_id = %s
        """, (nuevo_estado, motivo, hogar_id))
        updated = cursor.rowcount > 0

        # 3. Registrar en historial de transiciones
        if updated:
            cursor.execute("""
                INSERT INTO hogar_estado_historial (hogar_id, estado_anterior, estado_nuevo, motivo, cambiado_por)
                VALUES (%s, %s, %s, %s, %s)
            """, (hogar_id, estado_anterior, nuevo_estado, motivo, cambiado_por))

        conn.commit()
        return updated
    finally:
        cursor.close()
        conn.close()


def get_historial(hogar_id: int):
    """Retorna la cronología de cambios de estado para un hogar."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT heh.historial_id, heh.hogar_id, heh.estado_anterior,
                   heh.estado_nuevo, heh.motivo, heh.created_at,
                   u.full_name AS cambiado_por_nombre
            FROM hogar_estado_historial heh
            LEFT JOIN usuarios u ON heh.cambiado_por = u.usuario_id
            WHERE heh.hogar_id = %s
            ORDER BY heh.created_at DESC
        """, (hogar_id,))
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


def get_dashboard_stats():
    """Retorna estadísticas globales para el Dashboard de Administración."""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Resumen de Hogares
        cursor.execute("""
            SELECT
                COUNT(*) AS total_hogares,
                SUM(CASE WHEN estado_servicio = 'ACTIVO' THEN 1 ELSE 0 END) AS hogares_activos,
                SUM(CASE WHEN estado_servicio = 'SUSPENDIDO' THEN 1 ELSE 0 END) AS hogares_suspendidos,
                SUM(CASE WHEN estado_servicio = 'DENEGADO' THEN 1 ELSE 0 END) AS hogares_denegados,
                SUM(CASE WHEN estado_servicio = 'PRUEBA' THEN 1 ELSE 0 END) AS hogares_prueba
            FROM hogares
        """)
        hogares_stats = cursor.fetchone() or {}

        # 2. Resumen de Personas y Biometría
        cursor.execute("""
            SELECT
                COUNT(*) AS total_personas_registradas,
                SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) AS personas_con_biometria
            FROM employees WHERE is_active = 1
        """)
        personas_stats = cursor.fetchone() or {}

        # 3. Resumen de Accesos (Histórico y de Hoy)
        cursor.execute("""
            SELECT
                COUNT(*) AS total_accesos_historico,
                SUM(CASE WHEN DATE(event_time) = CURDATE() THEN 1 ELSE 0 END) AS accesos_hoy,
                SUM(CASE WHEN DATE(event_time) = CURDATE() AND access_result = 'GRANTED' THEN 1 ELSE 0 END) AS accesos_concedidos_hoy,
                SUM(CASE WHEN DATE(event_time) = CURDATE() AND access_result = 'DENIED' THEN 1 ELSE 0 END) AS accesos_denegados_hoy,
                SUM(CASE WHEN DATE(event_time) = CURDATE() AND liveness = 'SPOOFING' THEN 1 ELSE 0 END) AS intentos_spoofing_hoy
            FROM access_logs
        """)
        accesos_stats = cursor.fetchone() or {}

        # 4. Resumen de Alertas de Seguridad
        cursor.execute("""
            SELECT
                COUNT(*) AS total_alertas,
                SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END) AS alertas_pendientes,
                SUM(CASE WHEN resolved = 0 AND severity = 'HIGH' THEN 1 ELSE 0 END) AS alertas_criticas_pendientes,
                SUM(CASE WHEN alert_type = 'SPOOFING_ATTEMPT' THEN 1 ELSE 0 END) AS alertas_spoofing,
                SUM(CASE WHEN alert_type = 'UNKNOWN_FACE' THEN 1 ELSE 0 END) AS alertas_rostro_desconocido
            FROM security_alerts
        """)
        alertas_stats = cursor.fetchone() or {}

        # 5. Accesos de los últimos 7 días para gráficas
        cursor.execute("""
            SELECT
                DATE(event_time) AS fecha,
                SUM(CASE WHEN access_result = 'GRANTED' THEN 1 ELSE 0 END) AS concedidos,
                SUM(CASE WHEN access_result = 'DENIED' THEN 1 ELSE 0 END) AS denegados,
                SUM(CASE WHEN liveness = 'SPOOFING' THEN 1 ELSE 0 END) AS spoofing
            FROM access_logs
            WHERE event_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(event_time)
            ORDER BY DATE(event_time) ASC
        """)
        grafica_dias = cursor.fetchall()
        for g in grafica_dias:
            if g.get("fecha"):
                g["fecha"] = g["fecha"].isoformat()

        # 6. Últimas alertas críticas en tiempo real
        cursor.execute("""
            SELECT sa.alert_id, sa.hogar_id, h.codigo_hogar, h.nombre_titular,
                   sa.alert_type, sa.severity, sa.description, sa.resolved, sa.created_at
            FROM security_alerts sa
            LEFT JOIN hogares h ON sa.hogar_id = h.hogar_id
            ORDER BY sa.created_at DESC
            LIMIT 6
        """)
        ultimas_alertas = cursor.fetchall()
        for a in ultimas_alertas:
            if a.get("created_at"):
                a["created_at"] = a["created_at"].isoformat()

        return {
            "hogares": _clean_dict(hogares_stats),
            "personas": _clean_dict(personas_stats),
            "accesos": _clean_dict(accesos_stats),
            "alertas": _clean_dict(alertas_stats),
            "grafica_7_dias": [_clean_dict(g) for g in grafica_dias],
            "ultimas_alertas": ultimas_alertas,
        }
    finally:
        cursor.close()
        conn.close()
