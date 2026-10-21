from db import get_db


def find_all(result_filter=None, home_id: int = None, limit=20, page=1):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        limit = min(int(limit), 100)
        page = max(int(page), 1)
        offset = (page - 1) * limit

        conditions = []
        params = []
        if result_filter:
            conditions.append("l.access_result = %s")
            params.append(result_filter)
        if home_id:
            conditions.append("l.home_id = %s")
            params.append(home_id)

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        cursor.execute(f"SELECT COUNT(*) AS total FROM access_logs l {where}", params)
        total = cursor.fetchone()["total"]

        cursor.execute(f"""
            SELECT l.log_id, l.home_id, l.resident_id, l.access_result,
                   l.confidence, l.liveness, l.event_time,
                   r.full_name AS full_name,
                   h.home_code, h.owner_name
            FROM access_logs l
            LEFT JOIN residents r ON l.resident_id = r.resident_id
            LEFT JOIN homes h ON l.home_id = h.home_id
            {where}
            ORDER BY l.event_time DESC
            LIMIT %s OFFSET %s
        """, params + [limit, offset])
        rows = cursor.fetchall()
        for r in rows:
            if r.get("event_time"):
                r["event_time"] = r["event_time"].isoformat()
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


def find_by_id(log_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT l.log_id, l.home_id, l.resident_id, l.access_result,
                   l.confidence, l.liveness, l.event_time,
                   r.full_name AS full_name,
                   h.home_code, h.owner_name
            FROM access_logs l
            LEFT JOIN residents r ON l.resident_id = r.resident_id
            LEFT JOIN homes h ON l.home_id = h.home_id
            WHERE l.log_id = %s
        """, (log_id,))
        row = cursor.fetchone()
        if row and row.get("event_time"):
            row["event_time"] = row["event_time"].isoformat()
        return row
    finally:
        cursor.close()
        conn.close()


def create(resident_id: int, access_result: str, confidence: float,
           liveness: str, snapshot_img: bytes, home_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO access_logs "
            "(resident_id, access_result, confidence, liveness, snapshot_img, home_id) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (resident_id, access_result, confidence, liveness, snapshot_img, home_id),
        )
        log_id = cursor.lastrowid
        conn.commit()
        return log_id
    finally:
        cursor.close()
        conn.close()


def delete(log_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT log_id FROM access_logs WHERE log_id = %s", (log_id,))
        if not cursor.fetchone():
            return False
        cursor.execute("DELETE FROM access_logs WHERE log_id = %s", (log_id,))
        conn.commit()
        return True
    finally:
        cursor.close()
        conn.close()


def get_image(log_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT snapshot_img FROM access_logs WHERE log_id = %s", (log_id,))
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        cursor.close()
        conn.close()