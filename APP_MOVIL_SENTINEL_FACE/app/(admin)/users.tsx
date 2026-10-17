import { useRouter, useFocusEffect } from "expo-router";
import { Search, UserMinus, UserPlus, Shield, UserCheck, X, Check, Plus, ShieldCheck, ShieldOff } from "lucide-react-native";
import React, { useState, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Switch,
} from "react-native";
import { Image } from "expo-image";
import { useThemeColors } from "../../constants/theme";
import { api, BASE_URL } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Employee, Usuario, Role } from "../../types/domain";
import { LinearGradient } from "expo-linear-gradient";
import { customAlert } from "../../store/alertStore";

export default function UsersScreen() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);

  // Tab: 'employees' (Personal biométrico), 'system_users' (Usuarios del sistema) o 'roles' (Roles del sistema)
  const [activeTab, setActiveTab] = useState<"employees" | "system_users" | "roles">("employees");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [systemUsers, setSystemUsers] = useState<Usuario[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  // Modal Crear Usuario Sistema
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRoles, setCreateRoles] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  // Modal Crear Nuevo Rol
  const [createRoleModalVisible, setCreateRoleModalVisible] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [createRoleLoading, setCreateRoleLoading] = useState(false);

  // Modal Gestionar Roles
  const [rolesModalVisible, setRolesModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

  const fetchData = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) {
      setLoading(true);
    }
    try {
      if (activeTab === "employees") {
        const res = await api.getEmployees();
        setEmployees(res.data.employees ?? []);
      } else if (activeTab === "system_users") {
        const [resUsers, resRoles] = await Promise.all([
          api.getUsuarios(true), // include_inactive = true
          api.getRoles(false)     // Solo roles activos
        ]);
        setSystemUsers(resUsers.data.usuarios ?? []);
        setAvailableRoles(resRoles.data.roles ?? []);
      } else if (activeTab === "roles") {
        const res = await api.getRoles(true); // Todos los roles (activos e inactivos)
        setRoles(res.data.roles ?? []);
      }
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert("Error", "No se pudo cargar la información. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  // Recarga automática de datos al enfocar la pantalla o cambiar de pestaña
  useFocusEffect(
    useCallback(() => {
      const isEmpty =
        activeTab === "employees"
          ? employees.length === 0
          : activeTab === "system_users"
          ? systemUsers.length === 0
          : roles.length === 0;
      fetchData(isEmpty);
    }, [fetchData, activeTab, employees.length, systemUsers.length, roles.length])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  // Filtrado de listas locales
  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.document_id && e.document_id.includes(search));
    const matchStatus = showInactive ? true : e.is_active;
    return matchSearch && matchStatus;
  });

  const filteredSystemUsers = systemUsers.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = showInactive ? true : u.is_active;
    return matchSearch && matchStatus;
  });

  const filteredRoles = roles.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = showInactive ? true : r.is_active;
    return matchSearch && matchStatus;
  });

  const handleDeactivateRole = (id: number, name: string) => {
    customAlert(
      "Desactivar rol",
      `¿Desactivar el rol "${name}"? Los usuarios que lo tengan asignado no lo perderán pero no se podrá asignar a nuevos usuarios.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deactivateRole(id, user?.id ?? "");
              setRoles((prev) =>
                prev.map((r) =>
                  r.role_id === id ? { ...r, is_active: false } : r,
                ),
              );
            } catch (error) {
              if (__DEV__) console.error(error);
              customAlert(
                "Error",
                (error as any)?.response?.data?.message ?? "No se pudo desactivar el rol."
              );
            }
          },
        },
      ],
    );
  };

  const handleActivateRole = (id: number, name: string) => {
    customAlert("Activar rol", `¿Reactivar el rol "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Activar",
        onPress: async () => {
          try {
            await api.activateRole(id, user?.id ?? "");
            setRoles((prev) =>
              prev.map((r) =>
                r.role_id === id ? { ...r, is_active: true } : r,
              ),
            );
          } catch (error) {
            if (__DEV__) console.error(error);
            customAlert(
              "Error",
              (error as any)?.response?.data?.message ?? "No se pudo activar el rol."
            );
          }
        },
      },
    ]);
  };

  const handleCreateRoleSubmit = async () => {
    if (!roleName.trim()) {
      customAlert("Campo requerido", "El nombre del rol es obligatorio.");
      return;
    }
    setCreateRoleLoading(true);
    try {
      const res = await api.createRole(roleName.trim(), roleDesc.trim(), user?.id ?? "");
      setRoles((prev) => [...prev, res.data]);
      setRoleName("");
      setRoleDesc("");
      setCreateRoleModalVisible(false);
      fetchData(false);
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert(
        "Error",
        (error as any)?.response?.data?.message ?? "No se pudo crear el rol."
      );
    } finally {
      setCreateRoleLoading(false);
    }
  };

  // Acciones: Desactivar Empleado (Biométrico)
  const handleDeactivateEmployee = (id: number, name: string) => {
    customAlert(
      "Desactivar empleado",
      `¿Desactivar a ${name}? El registro se conserva por auditoría pero el empleado perderá acceso al sistema.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deactivateEmployee(id, user?.id ?? "");
              setEmployees((prev) =>
                prev.map((e) =>
                  e.employee_id === id ? { ...e, is_active: false } : e,
                ),
              );
            } catch (error) {
              if (__DEV__) console.error(error);
              customAlert(
                "Error",
                (error as any)?.response?.data?.message ?? "No se pudo desactivar el empleado."
              );
            }
          },
        },
      ],
    );
  };

  // Acciones: Activar Empleado (Biométrico)
  const handleActivateEmployee = (id: number, name: string) => {
    customAlert(
      "Activar empleado",
      `¿Reactivar a ${name}? Volverá a estar habilitado para registrar accesos biométricos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Activar",
          onPress: async () => {
            try {
              await api.activateEmployee(id, user?.id ?? "");
              setEmployees((prev) =>
                prev.map((e) =>
                  e.employee_id === id ? { ...e, is_active: true } : e,
                ),
              );
            } catch (error) {
              if (__DEV__) console.error(error);
              customAlert(
                "Error",
                (error as any)?.response?.data?.message ?? "No se pudo activar el empleado."
              );
            }
          },
        },
      ],
    );
  };


  // Acciones: Desactivar Usuario del Sistema
  const handleDeactivateUser = (id: number, name: string) => {
    customAlert(
      "Desactivar usuario",
      `¿Desactivar al usuario ${name}? Perderá inmediatamente el acceso de inicio de sesión.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deactivateUsuario(id, user?.id ?? "");
              setSystemUsers((prev) =>
                prev.map((u) =>
                  u.usuario_id === id ? { ...u, is_active: false } : u,
                ),
              );
            } catch (error) {
              if (__DEV__) console.error(error);
              customAlert(
                "Error",
                (error as any)?.response?.data?.message ?? "No se pudo desactivar el usuario."
              );
            }
          },
        },
      ],
    );
  };

  // Acciones: Activar Usuario del Sistema
  const handleActivateUser = (id: number, name: string) => {
    customAlert(
      "Activar usuario",
      `¿Reactivar al usuario ${name}? Podrá iniciar sesión en la aplicación nuevamente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Activar",
          onPress: async () => {
            try {
              await api.activateUsuario(id, user?.id ?? "");
              setSystemUsers((prev) =>
                prev.map((u) =>
                  u.usuario_id === id ? { ...u, is_active: true } : u,
                ),
              );
            } catch (error) {
              if (__DEV__) console.error(error);
              customAlert(
                "Error",
                (error as any)?.response?.data?.message ?? "No se pudo activar el usuario."
              );
            }
          },
        },
      ],
    );
  };

  // Crear Usuario del Sistema
  const handleCreateUserSubmit = async () => {
    if (!createName.trim()) {
      customAlert("Campo requerido", "Por favor ingresa el nombre completo.");
      return;
    }
    if (!createEmail.trim()) {
      customAlert("Campo requerido", "Por favor ingresa el correo electrónico.");
      return;
    }
    if (!createPassword.trim()) {
      customAlert("Campo requerido", "Por favor ingresa la contraseña.");
      return;
    }
    setCreateLoading(true);
    try {
      await api.createUsuario(
        createName.trim(),
        createEmail.trim(),
        createPassword,
        createRoles,
        user?.id ?? "1"
      );
      customAlert("Éxito", "Usuario del sistema registrado correctamente.");
      setCreateModalVisible(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRoles([]);
      fetchData(false);
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert(
        "Error",
        (error as any)?.response?.data?.message ?? "No se pudo crear el usuario del sistema."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Roles checkbox helper para creación
  const toggleInitialRole = (roleName: string) => {
    setCreateRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  // Abrir Modal de Roles para un usuario existente
  const openRolesModal = (u: Usuario) => {
    setSelectedUser(u);
    setRolesModalVisible(true);
  };

  // Asignar / Remover Rol de un usuario existente
  const toggleUserRole = async (role: Role) => {
    if (!selectedUser) return;
    const hasRole = selectedUser.roles.includes(role.name);
    
    // Evitar que el administrador se quite su propio rol admin
    if (hasRole && role.name === "admin" && String(selectedUser.usuario_id) === String(user?.id)) {
      customAlert("Acción inválida", "No puedes remover tu propio rol de administrador.");
      return;
    }

    setUpdatingRoleId(role.role_id);
    try {
      if (hasRole) {
        // Remover rol
        await api.removeUsuarioRole(selectedUser.usuario_id, role.role_id, user?.id ?? "");
        const updated = selectedUser.roles.filter((r) => r !== role.name);
        setSelectedUser({ ...selectedUser, roles: updated });
        setSystemUsers((prev) =>
          prev.map((u) =>
            u.usuario_id === selectedUser.usuario_id ? { ...u, roles: updated } : u
          )
        );
      } else {
        // Asignar rol
        await api.assignUsuarioRole(selectedUser.usuario_id, role.role_id, user?.id ?? "");
        const updated = [...selectedUser.roles, role.name];
        setSelectedUser({ ...selectedUser, roles: updated });
        setSystemUsers((prev) =>
          prev.map((u) =>
            u.usuario_id === selectedUser.usuario_id ? { ...u, roles: updated } : u
          )
        );
      }
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert(
        "Error",
        (error as any)?.response?.data?.message ?? "No se pudo actualizar el rol del usuario."
      );
    } finally {
      setUpdatingRoleId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={C.adminGold} />
      </View>
    );
  }

  const activeCount =
    activeTab === "employees"
      ? employees.filter((e) => e.is_active).length
      : activeTab === "system_users"
      ? systemUsers.filter((u) => u.is_active).length
      : roles.filter((r) => r.is_active).length;

  const titleText =
    activeTab === "employees"
      ? "Personal"
      : activeTab === "system_users"
      ? "Usuarios"
      : "Roles";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {titleText} ({activeCount} activos)
        </Text>
      </View>

      {/* Selector de Pestañas */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "employees" && styles.tabButtonActive]}
          onPress={() => {
            setSearch("");
            setActiveTab("employees");
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === "employees" && styles.tabButtonTextActive]}>
            Personal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "system_users" && styles.tabButtonActive]}
          onPress={() => {
            setSearch("");
            setActiveTab("system_users");
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === "system_users" && styles.tabButtonTextActive]}>
            Usuarios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "roles" && styles.tabButtonActive]}
          onPress={() => {
            setSearch("");
            setActiveTab("roles");
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === "roles" && styles.tabButtonTextActive]}>
            Roles
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === "employees"
              ? "Buscar por nombre o documento..."
              : activeTab === "system_users"
              ? "Buscar por nombre o correo..."
              : "Buscar rol por nombre o descripción..."
          }
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {activeTab === "employees" && (
        <>
          <View style={styles.submenuActions}>
            <TouchableOpacity
              style={[styles.filterBtn, !showInactive && styles.filterBtnActive]}
              onPress={() => setShowInactive((p) => !p)}
            >
              <Text style={[styles.filterTxt, !showInactive && styles.filterTxtActive]}>
                {showInactive ? "Ver activos" : "Ver todos"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addBtnInline}
              onPress={() => router.push("/(admin)/register")}
            >
              <UserPlus size={16} color={C.adminGold} />
              <Text style={styles.addBtnInlineText}>Registrar Personal</Text>
            </TouchableOpacity>
          </View>

          {/* LISTADO DE EMPLEADOS (CON FOTO) */}
          <FlatList
            data={filteredEmployees}
            keyExtractor={(item) => String(item.employee_id)}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.adminGold}
                colors={[C.adminGold]}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTxt}>
                  {search ? "Sin resultados para tu búsqueda" : "No hay empleados registrados"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.userRow, !item.is_active && styles.userRowInactive]}>
                <View style={[styles.avatar, !item.is_active && styles.avatarInactive, { overflow: "hidden" }]}>
                  <Text style={[styles.avatarText, !item.is_active && styles.avatarTextInactive]}>
                    {item.full_name[0].toUpperCase()}
                  </Text>
                  <Image
                    source={{
                      uri: `${BASE_URL}/employees/${item.employee_id}/image`,
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    onError={() => {
                      // No hacer nada si falla, queda la inicial como fallback
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, !item.is_active && styles.textInactive]}>
                    {item.full_name}
                  </Text>
                  <Text style={styles.userDoc}>Doc: {item.document_id}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: item.is_active
                        ? "rgba(0,229,160,0.15)"
                        : "rgba(255,61,113,0.12)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: item.is_active ? C.success : C.error,
                      },
                    ]}
                  >
                    {item.is_active ? "Activo" : "Inactivo"}
                  </Text>
                </View>
                {item.is_active ? (
                  <TouchableOpacity
                    onPress={() => handleDeactivateEmployee(item.employee_id, item.full_name)}
                    style={styles.actionBtn}
                  >
                    <UserMinus size={16} color={C.redAlert} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleActivateEmployee(item.employee_id, item.full_name)}
                    style={styles.actionBtn}
                  >
                    <UserCheck size={16} color={C.success} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </>
      )}

      {activeTab === "system_users" && (
        <>
          <View style={styles.submenuActions}>
            <TouchableOpacity
              style={[styles.filterBtn, !showInactive && styles.filterBtnActive]}
              onPress={() => setShowInactive((p) => !p)}
            >
              <Text style={[styles.filterTxt, !showInactive && styles.filterTxtActive]}>
                {showInactive ? "Ver activos" : "Ver todos"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addBtnInline}
              onPress={() => setCreateModalVisible(true)}
            >
              <UserPlus size={16} color={C.adminGold} />
              <Text style={styles.addBtnInlineText}>Adicionar Usuario</Text>
            </TouchableOpacity>
          </View>

          {/* LISTADO DE USUARIOS DEL SISTEMA */}
          <FlatList
            data={filteredSystemUsers}
            keyExtractor={(item) => String(item.usuario_id)}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.adminGold}
                colors={[C.adminGold]}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTxt}>
                  {search ? "Sin resultados para tu búsqueda" : "No hay usuarios de sistema registrados"}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = String(item.usuario_id) === String(user?.id);
              return (
                <View style={[styles.userRow, !item.is_active && styles.userRowInactive]}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
                    onPress={() => openRolesModal(item)}
                  >
                    <View style={[styles.avatar, !item.is_active && styles.avatarInactive]}>
                      <Text style={[styles.avatarText, !item.is_active && styles.avatarTextInactive]}>
                        {item.full_name[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, !item.is_active && styles.textInactive]}>
                        {item.full_name} {isMe && <Text style={styles.myUserTag}>(Tú)</Text>}
                      </Text>
                      <Text style={styles.userDoc}>{item.email}</Text>
                      
                      {/* Tags de roles */}
                      <View style={styles.rolesContainer}>
                        {item.roles && item.roles.length > 0 ? (
                          item.roles.map((r, idx) => (
                            <View key={idx} style={styles.roleBadge}>
                              <Text style={styles.roleBadgeTxt}>{r}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noRolesTxt}>Sin roles</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      onPress={() => openRolesModal(item)}
                      style={styles.actionBtn}
                    >
                      <Shield size={16} color={C.adminGold} />
                    </TouchableOpacity>

                    {item.is_active ? (
                      <TouchableOpacity
                        onPress={() => handleDeactivateUser(item.usuario_id, item.full_name)}
                        disabled={isMe}
                        style={[styles.actionBtn, isMe && { opacity: 0.25 }]}
                      >
                        <UserMinus size={16} color={C.redAlert} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleActivateUser(item.usuario_id, item.full_name)}
                        style={styles.actionBtn}
                      >
                        <UserCheck size={16} color={C.success} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      {activeTab === "roles" && (
        <>
          <View style={styles.submenuActions}>
            <TouchableOpacity
              style={[styles.filterBtn, !showInactive && styles.filterBtnActive]}
              onPress={() => setShowInactive((p) => !p)}
            >
              <Text style={[styles.filterTxt, !showInactive && styles.filterTxtActive]}>
                {showInactive ? "Ver activos" : "Ver todos"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addBtnInline}
              onPress={() => setCreateRoleModalVisible(true)}
            >
              <Plus size={16} color={C.adminGold} />
              <Text style={styles.addBtnInlineText}>Nuevo Rol</Text>
            </TouchableOpacity>
          </View>

          {/* LISTADO DE ROLES DEL SISTEMA */}
          <FlatList
            data={filteredRoles}
            keyExtractor={(item) => String(item.role_id)}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.adminGold}
                colors={[C.adminGold]}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTxt}>
                  {search ? "Sin resultados para tu búsqueda" : "No hay roles registrados"}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.roleRow, !item.is_active && styles.roleRowInactive]}>
                <View
                  style={[
                    styles.roleIcon,
                    {
                      backgroundColor: item.is_active
                        ? `${C.adminGold}15`
                        : `${C.textMuted}15`,
                    },
                  ]}
                >
                  {item.is_active ? (
                    <ShieldCheck size={20} color={C.adminGold} />
                  ) : (
                    <ShieldOff size={20} color={C.textMuted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleName, !item.is_active && styles.textInactive]}>
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text style={styles.roleDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: item.is_active
                        ? "rgba(0,229,160,0.15)"
                        : "rgba(255,61,113,0.12)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: item.is_active ? C.success : C.error,
                      },
                    ]}
                  >
                    {item.is_active ? "Activo" : "Inactivo"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    item.is_active
                      ? handleDeactivateRole(item.role_id, item.name)
                      : handleActivateRole(item.role_id, item.name)
                  }
                >
                  <Text
                    style={[
                      styles.roleActionTxt,
                      {
                        color: item.is_active ? C.redAlert : C.success,
                      },
                    ]}
                  >
                    {item.is_active ? "Desactivar" : "Activar"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      {/* MODAL: NUEVO USUARIO DE SISTEMA */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Usuario de Sistema</Text>
              <TouchableOpacity
                onPress={() => {
                  setCreateModalVisible(false);
                  setCreateName("");
                  setCreateEmail("");
                  setCreatePassword("");
                  setCreateRoles([]);
                }}
              >
                <X size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>NOMBRE COMPLETO *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ej: Andrés Felipe Pérez"
              placeholderTextColor={C.textMuted}
              value={createName}
              onChangeText={setCreateName}
            />

            <Text style={styles.modalLabel}>CORREO ELECTRÓNICO *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ej: andres@sentinel.com"
              placeholderTextColor={C.textMuted}
              value={createEmail}
              onChangeText={setCreateEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.modalLabel}>CONTRASEÑA *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Escribe la clave de acceso..."
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={createPassword}
              onChangeText={setCreatePassword}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>SELECCIONAR ROLES INICIALES</Text>
            <View style={styles.rolesChecklist}>
              {availableRoles.map((role) => {
                const isSelected = createRoles.includes(role.name);
                return (
                  <TouchableOpacity
                    key={role.role_id}
                    style={[styles.roleCheckRow, isSelected && styles.roleCheckRowSelected]}
                    onPress={() => toggleInitialRole(role.name)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check size={12} color="#050514" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleCheckName}>{role.name}</Text>
                      {role.description ? (
                        <Text style={styles.roleCheckDesc}>{role.description}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
              {availableRoles.length === 0 && (
                <Text style={styles.noRolesTxt}>No hay roles activos disponibles en el sistema.</Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={createLoading}
                onPress={() => {
                  setCreateModalVisible(false);
                  setCreateName("");
                  setCreateEmail("");
                  setCreatePassword("");
                  setCreateRoles([]);
                }}
              >
                <Text style={styles.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.createBtn, createLoading && { opacity: 0.6 }]}
                disabled={createLoading}
                onPress={handleCreateUserSubmit}
              >
                <LinearGradient
                  colors={C.gradients.admin as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createGrad}
                >
                  {createLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.createTxt}>Registrar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: ASIGNACIÓN DE ROLES */}
      <Modal
        visible={rolesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRolesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Asignación de Roles</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Usuario: {selectedUser?.full_name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRolesModalVisible(false)}>
                <X size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>ROLES DEL SISTEMA</Text>
            <View style={{ gap: 12, marginVertical: 10 }}>
              {availableRoles.map((role) => {
                const hasRole = selectedUser?.roles.includes(role.name) ?? false;
                const isUpdating = updatingRoleId === role.role_id;
                
                return (
                  <View key={role.role_id} style={styles.roleToggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.roleCheckName}>{role.name}</Text>
                      {role.description ? (
                        <Text style={styles.roleCheckDesc}>{role.description}</Text>
                      ) : null}
                    </View>
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={C.adminGold} style={{ marginHorizontal: 10 }} />
                    ) : (
                      <Switch
                        value={hasRole}
                        onValueChange={() => toggleUserRole(role)}
                        trackColor={{ false: C.borderStrong, true: `${C.adminGold}50` }}
                        thumbColor={hasRole ? C.adminGold : C.textMuted}
                      />
                    )}
                  </View>
                );
              })}
              {availableRoles.length === 0 && (
                <Text style={styles.noRolesTxt}>No hay roles activos disponibles.</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 20 }]}
              onPress={() => setRolesModalVisible(false)}
            >
              <Text style={[styles.cancelTxt, { color: C.adminGold }]}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: NUEVO ROL */}
      <Modal
        visible={createRoleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Rol</Text>
              <TouchableOpacity
                onPress={() => {
                  setCreateRoleModalVisible(false);
                  setRoleName("");
                  setRoleDesc("");
                }}
              >
                <X size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>NOMBRE *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ej: supervisor"
              placeholderTextColor={C.textMuted}
              value={roleName}
              onChangeText={setRoleName}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>DESCRIPCIÓN</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe las responsabilidades..."
              placeholderTextColor={C.textMuted}
              value={roleDesc}
              onChangeText={setRoleDesc}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={createRoleLoading}
                onPress={() => {
                  setCreateRoleModalVisible(false);
                  setRoleName("");
                  setRoleDesc("");
                }}
              >
                <Text style={styles.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.createBtn, createRoleLoading && { opacity: 0.6 }]}
                disabled={createRoleLoading}
                onPress={handleCreateRoleSubmit}
              >
                <LinearGradient
                  colors={C.gradients.admin as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createGrad}
                >
                  {createRoleLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.createTxt}>Crear rol</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { color: C.text, fontSize: 20, fontWeight: "700", flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterBtnActive: {
    backgroundColor: `${C.adminGold}18`,
    borderColor: `${C.adminGold}40`,
  },
  filterTxt: { color: C.textMuted, fontSize: 12, fontWeight: "600" },
  filterTxtActive: { color: C.adminGold, fontWeight: "600" },
  addBtn: { padding: 8, backgroundColor: `${C.adminGold}15`, borderRadius: 10 },
  submenuActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  addBtnInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${C.adminGold}15`,
    borderColor: `${C.adminGold}30`,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnInlineText: {
    color: C.adminGold,
    fontSize: 12,
    fontWeight: "600",
  },
  
  // Tabs styling
  tabContainer: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: `${C.adminGold}15`,
  },
  tabButtonText: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: C.adminGold,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 20,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 14 },
  
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  userRowInactive: { opacity: 0.55 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${C.adminGold}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInactive: { backgroundColor: `${C.textMuted}20` },
  avatarText: { color: C.adminGold, fontWeight: "700", fontSize: 16 },
  avatarTextInactive: { color: C.textMuted },
  
  userName: { color: C.text, fontSize: 15, fontWeight: "500" },
  myUserTag: { color: C.adminGold, fontSize: 13, fontWeight: "400" },
  textInactive: { color: C.textMuted },
  userDoc: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
  separator: { height: 1, backgroundColor: C.border },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyTxt: { color: C.textSubtle, fontSize: 14 },

  // System user roles badges
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeTxt: {
    color: C.adminGold,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  noRolesTxt: {
    color: C.textSubtle,
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 4,
  },

  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: { padding: 8 },

  // Role styles
  roleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  roleRowInactive: { opacity: 0.55 },
  roleIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  roleName: { color: C.text, fontSize: 15, fontWeight: "600", textTransform: "capitalize" },
  roleDesc: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  roleActionTxt: { fontSize: 12, fontWeight: "600" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: C.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  modalLabel: {
    color: "rgba(195,160,240,0.9)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.text,
    fontSize: 14,
    marginBottom: 12,
  },
  rolesChecklist: {
    maxHeight: 180,
    backgroundColor: C.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderStrong,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  roleCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  roleCheckRowSelected: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: C.borderStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: C.adminGold,
    borderColor: C.adminGold,
  },
  roleCheckName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  roleCheckDesc: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  roleToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.background,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelTxt: { color: C.textMuted, fontSize: 15, fontWeight: "600" },
  createBtn: { flex: 1, height: 48 },
  createGrad: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createTxt: { color: "white", fontSize: 15, fontWeight: "700" },
});
