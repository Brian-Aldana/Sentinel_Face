import json
from flask import request
from db import get_db


def find_all(limit=50, page=1):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        limit = min(int(limit), 100)
        page = max(int(page), 1)
        offset = (page - 1) * limit

        cursor.execute("SELECT COUNT(*) AS total FROM audit_log")
        total = cursor.fetchone()["total"]

        cursor.execute("""
            SELECT al.audit_id, al.hogar_id, al.action, al.target_table,
                   al.target_id, al.detail, al.ip_address, al.created_at,
                   u.full_name AS usuario_name,
                   h.codigo_hogar, h.nombre_titular
            FROM audit_log al
            LEFT JOIN usuarios u ON al.usuario_id = u.usuario_id
            LEFT JOIN hogares h ON al.hogar_id = h.hogar_id
            ORDER BY al.created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
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
            SELECT al.audit_id, al.hogar_id, al.action, al.target_table,
                   al.target_id, al.detail, al.ip_address, al.created_at,
                   u.full_name AS usuario_name
            FROM audit_log al
            LEFT JOIN usuarios u ON al.usuario_id = u.usuario_id
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


def create(usuario_id=None, action: str = "", table: str = None,
           target_id: int = None, detail: dict = None, ip_address: str = None, hogar_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        ip = ip_address
        if not ip:
            try:
                ip = request.remote_addr
            except Exception:
                ip = "127.0.0.1"

        detail_json = None
        if detail:
            if isinstance(detail, str):
                detail_json = detail
            else:
                detail_json = json.dumps(detail)

        cursor.execute(
            "INSERT INTO audit_log "
            "(hogar_id, usuario_id, action, target_table, target_id, detail, ip_address) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (hogar_id, usuario_id, action, table, target_id, detail_json, ip),
        )
        conn.commit()
    except Exception as e:
        print(f"[AUDIT ERROR] {e}")
    finally:
        cursor.close()
        conn.close()


# Alias para retrocompatibilidad
record = create
