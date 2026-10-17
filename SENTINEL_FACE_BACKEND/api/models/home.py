from decimal import Decimal
from datetime import datetime, date
from db import get_db


def _clean_val(v):
    if isinstance(v, Decimal):
        return int(v) if v % 1 == 0 else float(v)
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    return v


def _clean_dict(d: dict) -> dict:
    return {k: _clean_val(v) for k, v in d.items()}


def _enrich_home_dict(clean_r: dict) -> dict:
    if not clean_r:
        return clean_r
    clean_r["is_active"] = clean_r.get("service_status") in ("ACTIVE", "TRIAL")
    clean_r["total_residents"] = clean_r.get("total_residents", 0)
    clean_r["active_alerts"] = clean_r.get("active_alerts", 0)
    clean_r["total_accesses"] = clean_r.get("total_accesses", 0)
    return clean_r


def find_all(service_status: str = None):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        where = "WHERE h.service_status = %s" if service_status else ""
        params = (service_status,) if service_status else ()
        cursor.execute(f"""
            SELECT h.home_id, h.home_code, h.owner_name, h.address,
                   h.phone, h.contact_email, h.service_status,
                   h.suspension_reason, h.max_residents, h.max_cameras,
                   h.notes, h.created_at, h.updated_at,
                   COUNT(DISTINCT r.resident_id) AS total_residents,
                   (SELECT COUNT(*) FROM security_alerts sa
                    WHERE sa.home_id = h.home_id AND sa.resolved = 0) AS active_alerts,
                   (SELECT COUNT(*) FROM access_logs al
                    WHERE al.home_id = h.home_id) AS total_accesses
            FROM homes h
            LEFT JOIN residents r ON h.home_id = r.home_id AND r.is_active = 1
            {where}
            GROUP BY h.home_id
            ORDER BY h.home_id DESC
        """, params)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            clean_r = _clean_dict(r)
            result.append(_enrich_home_dict(clean_r))
        return result
    finally:
        cursor.close()
        conn.close()


def find_by_id(home_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT h.home_id, h.home_code, h.owner_name, h.address,
                   h.phone, h.contact_email, h.service_status,
                   h.suspension_reason, h.max_residents, h.max_cameras,
                   h.notes, h.created_at, h.updated_at,
                   COUNT(DISTINCT r.resident_id) AS total_residents
            FROM homes h
            LEFT JOIN residents r ON h.home_id = r.home_id AND r.is_active = 1
            WHERE h.home_id = %s
            GROUP BY h.home_id
        """, (home_id,))
        row = cursor.fetchone()
        if not row:
            return None
        clean_row = _clean_dict(row)
        return _enrich_home_dict(clean_row)
    finally:
        cursor.close()
        conn.close()


def find_by_code(home_code: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM homes WHERE home_code = %s", (home_code,))
        row = cursor.fetchone()
        return _clean_dict(row) if row else None
    finally:
        cursor.close()
        conn.close()


def is_service_active(home_id: int) -> tuple[bool, str]:
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT service_status, suspension_reason FROM homes WHERE home_id = %s",
            (home_id,)
        )
        row = cursor.fetchone()
        if not row:
            return False, "Home not registered in system"

        status = row["service_status"]
        reason = row.get("suspension_reason") or "No suspension reason specified"

        if status == "ACTIVE":
            return True, "Service active"
        elif status == "TRIAL":
            return True, "Service in trial period"
        elif status == "SUSPENDED":
            return False, f"Service suspended by provider: {reason}"
        elif status == "DENIED":
            return False, f"Service denied or cancelled: {reason}"
        return False, f"Invalid service status ({status})"
    finally:
        cursor.close()
        conn.close()


def create(data: dict):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO homes (
                home_code, owner_name, address, phone, contact_email,
                service_status, max_residents, max_cameras, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data["home_code"],
            data["owner_name"],
            data.get("address"),
            data.get("phone"),
            data["contact_email"],
            data.get("service_status", "ACTIVE"),
            data.get("max_residents", 10),
            data.get("max_cameras", 2),
            data.get("notes"),
        ))
        new_id = cursor.lastrowid

        # Record initial status in history
        cursor.execute("""
            INSERT INTO home_status_history (home_id, previous_status, new_status, reason, changed_by)
            VALUES (%s, NULL, %s, %s, %s)
        """, (new_id, data.get("service_status", "ACTIVE"), "Initial home onboarding", data.get("changed_by")))

        conn.commit()
        return new_id
    finally:
        cursor.close()
        conn.close()


def update(home_id: int, data: dict):
    conn = get_db()
    cursor = conn.cursor()
    try:
        fields = []
        params = []
        for col in ("owner_name", "address", "phone", "contact_email",
                    "max_residents", "max_cameras", "notes"):
            if col in data:
                fields.append(f"{col} = %s")
                params.append(data[col])
        if not fields:
            return False
        params.append(home_id)
        cursor.execute(f"UPDATE homes SET {', '.join(fields)} WHERE home_id = %s", params)
        conn.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        conn.close()


def set_status(home_id: int, new_status: str, reason: str = None, changed_by: int = None):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT service_status FROM homes WHERE home_id = %s", (home_id,))
        current = cursor.fetchone()
        if not current:
            return False, "Home not found"

        prev_status = current["service_status"]

        cursor.execute("""
            UPDATE homes
            SET service_status = %s,
                suspension_reason = %s
            WHERE home_id = %s
        """, (new_status, reason if new_status in ("SUSPENDED", "DENIED") else None, home_id))

        cursor.execute("""
            INSERT INTO home_status_history (home_id, previous_status, new_status, reason, changed_by)
            VALUES (%s, %s, %s, %s, %s)
        """, (home_id, prev_status, new_status, reason, changed_by))

        conn.commit()
        return True, None
    finally:
        cursor.close()
        conn.close()


def get_history(home_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT hsh.history_id, hsh.home_id, hsh.previous_status,
                   hsh.new_status, hsh.reason, hsh.created_at,
                   u.full_name AS changed_by_name
            FROM home_status_history hsh
            LEFT JOIN users u ON hsh.changed_by = u.user_id
            WHERE hsh.home_id = %s
            ORDER BY hsh.created_at DESC
        """, (home_id,))
        rows = cursor.fetchall()
        return [_clean_dict(r) for r in rows]
    finally:
        cursor.close()
        conn.close()


def get_dashboard_stats():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                COUNT(*)                                        AS total_homes,
                SUM(CASE WHEN service_status = 'ACTIVE'    THEN 1 ELSE 0 END) AS active_homes,
                SUM(CASE WHEN service_status = 'SUSPENDED' THEN 1 ELSE 0 END) AS suspended_homes,
                SUM(CASE WHEN service_status = 'DENIED'    THEN 1 ELSE 0 END) AS denied_homes,
                SUM(CASE WHEN service_status = 'TRIAL'     THEN 1 ELSE 0 END) AS trial_homes
            FROM homes
        """)
        homes_stats = _clean_dict(cursor.fetchone() or {})

        cursor.execute("""
            SELECT
                COUNT(*)                                              AS total_residents,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END)       AS active_residents
            FROM residents
        """)
        residents_stats = _clean_dict(cursor.fetchone() or {})

        cursor.execute("""
            SELECT
                COUNT(*)                                                                     AS total_history_accesses,
                SUM(CASE WHEN DATE(event_time) = CURDATE() THEN 1 ELSE 0 END)                AS accesses_today,
                SUM(CASE WHEN DATE(event_time) = CURDATE() AND access_result = 'GRANTED' THEN 1 ELSE 0 END) AS accesses_granted_today,
                SUM(CASE WHEN DATE(event_time) = CURDATE() AND access_result = 'DENIED'  THEN 1 ELSE 0 END) AS accesses_denied_today,
                SUM(CASE WHEN DATE(event_time) = CURDATE() AND liveness = 'SPOOFING'      THEN 1 ELSE 0 END) AS spoofing_attempts_today
            FROM access_logs
        """)
        access_stats = _clean_dict(cursor.fetchone() or {})

        cursor.execute("""
            SELECT
                COUNT(*)                                                                        AS total_alerts,
                SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END)                                   AS pending_alerts,
                SUM(CASE WHEN resolved = 0 AND severity IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END) AS critical_pending_alerts,
                SUM(CASE WHEN alert_type = 'SPOOFING_ATTEMPT' THEN 1 ELSE 0 END)                AS spoofing_alerts,
                SUM(CASE WHEN alert_type = 'UNKNOWN_FACE'     THEN 1 ELSE 0 END)                AS unknown_face_alerts
            FROM security_alerts
        """)
        alerts_stats = _clean_dict(cursor.fetchone() or {})

        cursor.execute("""
            SELECT
                DATE_FORMAT(event_time, '%Y-%m-%d') AS date,
                SUM(CASE WHEN access_result = 'GRANTED' THEN 1 ELSE 0 END) AS granted,
                SUM(CASE WHEN access_result = 'DENIED'  THEN 1 ELSE 0 END) AS denied,
                SUM(CASE WHEN liveness = 'SPOOFING'      THEN 1 ELSE 0 END) AS spoofing
            FROM access_logs
            WHERE event_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(event_time, '%Y-%m-%d')
            ORDER BY date ASC
        """)
        chart_7_days = [_clean_dict(r) for r in cursor.fetchall()]

        cursor.execute("""
            SELECT sa.alert_id, sa.home_id, sa.alert_type, sa.severity,
                   sa.description, sa.resolved, sa.created_at,
                   h.home_code, h.owner_name
            FROM security_alerts sa
            LEFT JOIN homes h ON sa.home_id = h.home_id
            ORDER BY sa.created_at DESC
            LIMIT 5
        """)
        recent_alerts = [_clean_dict(r) for r in cursor.fetchall()]

        return {
            "homes": homes_stats,
            "residents": residents_stats,
            "accesses": access_stats,
            "alerts": alerts_stats,
            "chart_7_days": chart_7_days,
            "recent_alerts": recent_alerts,
        }
    finally:
        cursor.close()
        conn.close()
