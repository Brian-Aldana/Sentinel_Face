from api.models import user as UserModel
from api.models import audit as AuditModel


def get_all(include_inactive: bool = False, home_id: int = None):
    return UserModel.find_all(include_inactive, home_id)


def get_by_id(user_id: int):
    u = UserModel.find_by_id(user_id)
    if not u:
        return None, "Usuario no encontrado"
    return u, None


def create(full_name: str, email: str, password: str, roles: list, requestor_id: int = None, home_id: int = None):
    if not full_name or not email or not password:
        return None, "Nombre, email y contraseña son requeridos"
    try:
        new_id = UserModel.create(full_name, email, password, roles, home_id=home_id)
    except Exception as e:
        if "Duplicate" in str(e):
            return None, "El email ya está registrado"
        return None, str(e)

    AuditModel.record(user_id=requestor_id, home_id=home_id, action="CREATE_USER", target_table="users",
                      target_id=new_id, detail={"full_name": full_name, "email": email, "roles": roles})
    return {"success": True, "user_id": new_id, "usuario_id": new_id}, None


def deactivate(user_id: int, requestor_id: int = None):
    full_name, err = UserModel.deactivate(user_id)
    if err:
        return False, err
    AuditModel.record(user_id=requestor_id, action="DEACTIVATE_USER", target_table="users",
                      target_id=user_id, detail={"full_name": full_name})
    return True, None


def activate(user_id: int, requestor_id: int = None):
    full_name, err = UserModel.activate(user_id)
    if err:
        return False, err
    AuditModel.record(user_id=requestor_id, action="ACTIVATE_USER", target_table="users",
                      target_id=user_id, detail={"full_name": full_name})
    return True, None


def assign_role(user_id: int, role_id: int, requestor_id: int = None):
    ok = UserModel.assign_role(user_id, role_id, requestor_id)
    if not ok:
        return False, "El rol ya está asignado a este usuario"
    AuditModel.record(user_id=requestor_id, action="ASSIGN_ROLE", target_table="user_roles",
                      target_id=user_id, detail={"role_id": role_id})
    return True, None


def remove_role(user_id: int, role_id: int, requestor_id: int = None):
    ok = UserModel.remove_role(user_id, role_id)
    if not ok:
        return False, "El usuario no tiene ese rol"
    AuditModel.record(user_id=requestor_id, action="REMOVE_ROLE", target_table="user_roles",
                      target_id=user_id, detail={"role_id": role_id})
    return True, None
