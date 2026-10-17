from db import get_db


def find_all(home_id: int = None, include_inactive: bool = False):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        conditions = []
        params = []
        if not include_inactive:
            conditions.append("r.is_active = 1")
        if home_id:
            conditions.append("r.home_id = %s")
            params.append(home_id)

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        cursor.execute(f"""
            SELECT r.resident_id, r.home_id, r.full_name, r.document_id,
                   r.is_active, r.created_at, r.updated_at,
                   h.home_code, h.owner_name,
                   u.full_name AS registered_by
            FROM residents r
            LEFT JOIN homes h ON r.home_id = h.home_id
            LEFT JOIN users u ON r.registered_by = u.user_id
            {where}
            ORDER BY r.created_at DESC
        """, params)
        rows = cursor.fetchall()
        for r in rows:
            for f in ("created_at", "updated_at"):
                if r.get(f):
                    r[f] = r[f].isoformat()
        return rows
    finally:
        cursor.close()
        conn.close()


def find_by_id(resident_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT r.resident_id, r.home_id, r.full_name, r.document_id,
                   r.is_active, r.created_at, r.updated_at,
                   h.home_code, h.owner_name,
                   u.full_name AS registered_by
            FROM residents r
            LEFT JOIN homes h ON r.home_id = h.home_id
            LEFT JOIN users u ON r.registered_by = u.user_id
            WHERE r.resident_id = %s
        """, (resident_id,))
        row = cursor.fetchone()
        if row:
            for f in ("created_at", "updated_at"):
                if row.get(f):
                    row[f] = row[f].isoformat()
        return row
    finally:
        cursor.close()
        conn.close()


def create(full_name: str, document_id: str, embedding: bytes, registered_by: int = None, photo_img: bytes = None, home_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO residents (full_name, document_id, embedding, registered_by, photo_img, home_id) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (full_name, document_id, embedding, registered_by, photo_img, home_id),
        )
        new_id = cursor.lastrowid
        conn.commit()
        return new_id
    finally:
        cursor.close()
        conn.close()


def get_image(resident_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT photo_img FROM residents WHERE resident_id = %s",
            (resident_id,)
        )
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        cursor.close()
        conn.close()


def delete(resident_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT full_name FROM residents WHERE resident_id = %s", (resident_id,))
        row = cursor.fetchone()
        if not row:
            return None
        full_name = row[0]
        cursor.execute("DELETE FROM residents WHERE resident_id = %s", (resident_id,))
        conn.commit()
        return full_name
    finally:
        cursor.close()
        conn.close()


def deactivate(resident_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT full_name, is_active FROM residents WHERE resident_id = %s", (resident_id,))
        row = cursor.fetchone()
        if not row:
            return None, "Residente no encontrado"
        if not row[1]:
            return None, "El residente ya está inactivo"
        cursor.execute("UPDATE residents SET is_active = 0 WHERE resident_id = %s", (resident_id,))
        conn.commit()
        return row[0], None
    finally:
        cursor.close()
        conn.close()


def activate(resident_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT full_name, is_active FROM residents WHERE resident_id = %s", (resident_id,))
        row = cursor.fetchone()
        if not row:
            return None, "Residente no encontrado"
        if row[1]:
            return None, "El residente ya está activo"
        cursor.execute("UPDATE residents SET is_active = 1 WHERE resident_id = %s", (resident_id,))
        conn.commit()
        return row[0], None
    finally:
        cursor.close()
        conn.close()


def get_all_active_embeddings(home_id: int = None):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT resident_id, full_name, embedding FROM residents WHERE is_active = 1 AND embedding IS NOT NULL"
        params = []
        if home_id:
            query += " AND home_id = %s"
            params.append(home_id)
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
