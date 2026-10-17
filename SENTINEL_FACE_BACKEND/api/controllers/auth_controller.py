from werkzeug.security import check_password_hash
from api.models import user as UserModel
from api.models import audit as AuditModel


def login(email: str, password: str):
    user = UserModel.find_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return None, "Credenciales inválidas"

    user_id = user["user_id"]
    UserModel.update_last_login(user_id)

    home_data = None
    if user.get("home_id"):
        home_data = {
            "home_id": user["home_id"],
            "home_code": user.get("home_code"),
            "owner_name": user.get("owner_name"),
            "service_status": user.get("service_status"),
            "suspension_reason": user.get("suspension_reason"),
            "max_residents": user.get("max_residents"),
            "max_cameras": user.get("max_cameras"),
        }

    return {
        "success": True,
        "user_id": user_id,
        "usuario_id": user_id,  # backward compatibility alias
        "name": user["full_name"],
        "email": user["email"],
        "roles": user.get("roles", []),
        "home": home_data,
        "hogar": home_data,  # backward compatibility alias
    }, None


def change_user_password(user_id: int, current_password: str, new_password: str):
    if not current_password or not new_password:
        return False, "La contraseña actual y la nueva son requeridas"
    if len(new_password) < 6:
        return False, "La nueva contraseña debe tener al menos 6 caracteres"

    success, result = UserModel.change_password(user_id, current_password, new_password)
    if not success:
        return False, result

    AuditModel.record(user_id, "CHANGE_PASSWORD", "users", user_id,
                      {"full_name": result})
    return True, None
