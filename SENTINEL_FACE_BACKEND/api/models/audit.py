import json
from flask import request
from db import get_db


def find_all(home_id: int = None, limit=50, page=1):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        limit = min(int(limit), 100)
        page = max(int(page), 1)
        offset = (page - 1) * limit

        where = "WHERE al.home_id = %s" if home_id else ""
        params = [home_id] if home_id else []

        cursor.execute(f"SELECT COUNT(*) AS total FROM audit_log al {where}", params)
        total = cursor.fetchone()["total"]

        cursor.execute(f"""
            SELECT al.audit_id, al.home_id, al.action, al.target_table,
                   al.target_id, al.detail, al.ip_address, al.created_at,
                   u.full_name AS user_name,
                   h.home_code, h.owner_name
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.user_id
            LEFT JOIN homes h ON al.home_id = h.home_id
            {where}
            ORDER BY al.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [limit, offset])
        rows = cursor.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
            if r.get("detail") and isinstance(r["detail"], str):
                try:
                    r["detail"] = json.loads(r["detail"])
                except Exception:
                    pass
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


def find_by_id(audit_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT al.audit_id, al.home_id, al.action, al.target_table,
                   al.target_id, al.detail, al.ip_address, al.created_at,
                   u.full_name AS user_name,
                   h.home_code, h.owner_name
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.user_id
            LEFT JOIN homes h ON al.home_id = h.home_id
            WHERE al.audit_id = %s
        """, (audit_id,))
        row = cursor.fetchone()
        if row and row.get("created_at"):
            row["created_at"] = row["created_at"].isoformat()
        if row and row.get("detail") and isinstance(row["detail"], str):
            try:
                row["detail"] = json.loads(row["detail"])
            except Exception:
                pass
        return row
    finally:
        cursor.close()
        conn.close()


def record(user_id=None, action: str = "", target_table: str = None,
           target_id: int = None, detail: dict = None, ip_address: str = None,
           home_id: int = None, **kwargs):
    actual_user_id = user_id or kwargs.get("usuario_id")
    actual_home_id = home_id or kwargs.get("hogar_id")

    if ip_address is None:
        try:
            ip_address = request.remote_addr
        except RuntimeError:
            ip_address = "127.0.0.1"

    detail_json = json.dumps(detail) if detail else None

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO audit_log
            (user_id, home_id, action, target_table, target_id, detail, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (actual_user_id, actual_home_id, action, target_table, target_id, detail_json, ip_address))
        conn.commit()
    except Exception as e:
        print(f"[AUDIT ERROR]: {e}")
    finally:
        cursor.close()
        conn.close()


create = record
