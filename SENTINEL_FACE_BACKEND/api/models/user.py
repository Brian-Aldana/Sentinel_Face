import os
from db import get_db
from werkzeug.security import generate_password_hash, check_password_hash


def find_all(include_inactive: bool = False, home_id: int = None):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        conditions = []
        params = []
        if not include_inactive:
            conditions.append("u.is_active = 1")
        if home_id:
            conditions.append("u.home_id = %s")
            params.append(home_id)

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
        cursor.execute(f"""
            SELECT u.user_id, u.home_id, u.full_name, u.email,
                   u.is_active, u.created_at, u.last_login,
                   h.home_code, h.owner_name,
                   GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ',') AS roles
            FROM users u
            LEFT JOIN homes h ON u.home_id = h.home_id
            LEFT JOIN user_roles ur ON u.user_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.role_id
            {where}
            GROUP BY u.user_id
            ORDER BY u.created_at DESC
        """, params)
        rows = cursor.fetchall()
        for r in rows:
            for f in ("created_at", "last_login"):
                if r.get(f):
                    r[f] = r[f].isoformat()
            r["roles"] = r["roles"].split(",") if r.get("roles") else []
        return rows
    finally:
        cursor.close()
        conn.close()


def find_by_id(user_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.user_id, u.home_id, u.full_name, u.email,
                   u.is_active, u.created_at, u.last_login,
                   h.home_code, h.owner_name, h.service_status,
                   GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ',') AS roles
            FROM users u
            LEFT JOIN homes h ON u.home_id = h.home_id
            LEFT JOIN user_roles ur ON u.user_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.role_id
            WHERE u.user_id = %s
            GROUP BY u.user_id
        """, (user_id,))
        row = cursor.fetchone()
        if row:
            for f in ("created_at", "last_login"):
                if row.get(f):
                    row[f] = row[f].isoformat()
            row["roles"] = row["roles"].split(",") if row.get("roles") else []
        return row
    finally:
        cursor.close()
        conn.close()


def find_by_email(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.user_id, u.home_id, u.full_name, u.email, u.password_hash,
                   u.is_active, u.created_at, u.last_login,
                   h.home_code, h.owner_name, h.service_status, h.suspension_reason,
                   h.max_residents, h.max_cameras,
                   GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ',') AS roles
            FROM users u
            LEFT JOIN homes h ON u.home_id = h.home_id
            LEFT JOIN user_roles ur ON u.user_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.role_id
            WHERE u.email = %s AND u.is_active = 1
            GROUP BY u.user_id
        """, (email,))
        row = cursor.fetchone()
        if row:
            row["roles"] = row["roles"].split(",") if row.get("roles") else []
        return row
    finally:
        cursor.close()
        conn.close()


def create(full_name: str, email: str, password: str, role_names: list = None, home_id: int = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash, home_id) VALUES (%s, %s, %s, %s)",
            (full_name, email, generate_password_hash(password), home_id),
        )
        new_id = cursor.lastrowid
        if role_names:
            for role_name in role_names:
                cursor.execute(
                    "SELECT role_id FROM roles WHERE name = %s AND is_active = 1",
                    (role_name,)
                )
                role = cursor.fetchone()
                if role:
                    cursor.execute(
                        "INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                        (new_id, role[0])
                    )
        conn.commit()
        return new_id
    finally:
        cursor.close()
        conn.close()


def update_last_login(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET last_login = NOW() WHERE user_id = %s",
            (user_id,)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()


def change_password(user_id: int, current_password: str, new_password: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT password_hash, full_name FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return False, "Usuario no encontrado"

        if not check_password_hash(user["password_hash"], current_password):
            return False, "La contraseña actual es incorrecta"

        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            (generate_password_hash(new_password), user_id)
        )
        conn.commit()
        return True, user["full_name"]
    finally:
        cursor.close()
        conn.close()


def deactivate(user_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT full_name FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return None, "Usuario no encontrado"
        cursor.execute("UPDATE users SET is_active = 0 WHERE user_id = %s", (user_id,))
        conn.commit()
        return user["full_name"], None
    finally:
        cursor.close()
        conn.close()


def activate(user_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT full_name FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return None, "Usuario no encontrado"
        cursor.execute("UPDATE users SET is_active = 1 WHERE user_id = %s", (user_id,))
        conn.commit()
        return user["full_name"], None
    finally:
        cursor.close()
        conn.close()


def assign_role(user_id: int, role_id: int, assigned_by: int = None):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (%s, %s, %s)",
            (user_id, role_id, assigned_by)
        )
        conn.commit()
        return True
    finally:
        cursor.close()
        conn.close()


def ensure_default_user():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT user_id FROM users WHERE email = %s", ("admin@admin.com",))
        if not cursor.fetchone():
            default_pass = os.getenv("ADMIN_DEFAULT_PASSWORD", "AdminSentinel2026!")
            create(
                full_name="Super Administrador Sentinel",
                email="admin@admin.com",
                password=default_pass,
                role_names=["superadmin", "admin"],
                home_id=1
            )
    finally:
        cursor.close()
        conn.close()


ensure_default_usuario = ensure_default_user
