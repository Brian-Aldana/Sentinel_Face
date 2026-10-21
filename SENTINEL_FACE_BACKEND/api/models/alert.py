from db import get_db


def find_all(resolved=0, home_id: int = None, limit=20, page=1):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        limit = min(int(limit), 100)
        page = max(int(page), 1)
        offset = (page - 1) * limit

        conditions = ["sa.resolved = %s"]
        params = [resolved]
        if home_id:
            conditions.append("sa.home_id = %s")
            params.append(home_id)

        where = "WHERE " + " AND ".join(conditions)

        cursor.execute(f"SELECT COUNT(*) AS total FROM security_alerts sa {where}", params)
        total = cursor.fetchone()["total"]

        cursor.execute(f"""
            SELECT sa.alert_id, sa.home_id, sa.log_id, sa.alert_type, sa.severity,
                   sa.description, sa.resolved, sa.created_at, sa.resolved_at,
                   al.event_time, h.home_code, h.owner_name
            FROM security_alerts sa
            LEFT JOIN access_logs al ON sa.log_id = al.log_id
            LEFT JOIN homes h ON sa.home_id = h.home_id
            {where}
            ORDER BY sa.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [limit, offset])
        rows = cursor.fetchall()
        for r in rows:
            for f in ("created_at", "event_time", "resolved_at"):
                if r.get(f):
                    r[f] = r[f].isoformat()
        return {
            "items": rows,
            "total": total,
            "page": page,
            "limit": limit,
            "has_more": (offset + len(rows)) < total,
        }
    finally:
        cursor.close()
        conn.close()


def find_by_id(alert_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT sa.alert_id, sa.home_id, sa.log_id, sa.alert_type, sa.severity,
                   sa.description, sa.resolved, sa.created_at, sa.resolved_at,
                   al.event_time, h.home_code, h.owner_name,
                   u.full_name AS resolved_by
            FROM security_alerts sa
            LEFT JOIN access_logs al ON sa.log_id = al.log_id
            LEFT JOIN homes h ON sa.home_id = h.home_id
            LEFT JOIN users u ON sa.resolved_by = u.user_id
            WHERE sa.alert_id = %s
        """, (alert_id,))
        row = cursor.fetchone()
        if row:
            for f in ("created_at", "event_time", "resolved_at"):
                if row.get(f):
                    row[f] = row[f].isoformat()
        return row
    finally:
        cursor.close()
        conn.close()


def create(alert_type: str, severity: str, description: str, log_id: int = None, home_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO security_alerts (alert_type, severity, description, log_id, home_id) "
            "VALUES (%s, %s, %s, %s, %s)",
            (alert_type, severity, description, log_id, home_id),
        )
        alert_id = cursor.lastrowid
        conn.commit()
        return alert_id
    finally:
        cursor.close()
        conn.close()


def resolve(alert_id: int, user_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT alert_id, resolved FROM security_alerts WHERE alert_id = %s", (alert_id,))
        row = cursor.fetchone()
        if not row:
            return False, "Alerta no encontrada"
        if row[1]:
            return False, "La alerta ya está resuelta"

        cursor.execute(
            "UPDATE security_alerts SET resolved = 1, resolved_by = %s, resolved_at = NOW() WHERE alert_id = %s",
            (user_id, alert_id),
        )
        conn.commit()
        return True, None
    finally:
        cursor.close()
        conn.close()


def delete(alert_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT alert_id FROM security_alerts WHERE alert_id = %s", (alert_id,))
        if not cursor.fetchone():
            return False
        cursor.execute("DELETE FROM security_alerts WHERE alert_id = %s", (alert_id,))
        conn.commit()
        return True
    finally:
        cursor.close()
        conn.close()
