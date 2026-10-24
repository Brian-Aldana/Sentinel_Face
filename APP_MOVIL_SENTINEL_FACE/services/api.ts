import axios from "axios";
import { Alert, Platform } from "react-native";

export const BASE_URL =
  Platform.OS === "web"
    ? (process.env.EXPO_PUBLIC_WEB_API_URL ?? "http://localhost:5000/api")
    : (process.env.EXPO_PUBLIC_API_URL ?? "http://147.182.134.174:5000/api");

export const TOKEN_KEY = "sentinel_access_token";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Adjunta el token JWT en cada petición automáticamente
client.interceptors.request.use(async (config) => {
  try {
    const { useAuthStore } = await import("../store/authStore");
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn("Error obteniendo token del store", error);
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config as any;

    if (__DEV__) {
      const isExpectedRefreshFailure = status === 401 && config?.url?.includes("/auth/refresh");
      if (!isExpectedRefreshFailure) {
        const fullUrl = config ? `${config.baseURL || ""}${config.url || ""}` : "";
        console.error(
          `[API ERROR] ${config?.method?.toUpperCase()} ${fullUrl} - Status: ${status} - Message: ${error?.message} - Code: ${error?.code}`
        );
        if (error?.response?.data) {
          console.error(`[API ERROR DATA]:`, JSON.stringify(error.response.data));
        }
      }
    }

    if (
      status === 401 &&
      config &&
      !config._retry &&
      !config.url?.includes("/auth/refresh")
    ) {
      config._retry = true;
      try {
        const { data } = await client.post("/auth/refresh");
        try {
          const { useAuthStore } = await import("../store/authStore");
          useAuthStore.setState({
            token: data.access_token,
            isAuthenticated: true,
          });
        } catch (innerError) {
          console.warn(
            "[api] No se pudo actualizar el store después del refresh",
            innerError,
          );
        }
        config.headers.Authorization = `Bearer ${data.access_token}`;
        return client(config);
      } catch {
        try {
          const { useAuthStore } = await import("../store/authStore");
          await useAuthStore.getState().logout();
        } catch (innerError) {
          console.warn(
            "[api] No se pudo cerrar sesión tras refresh fallido",
            innerError,
          );
        }
      }
    }

    if (status === 403) {
      if (__DEV__) {
        console.warn(
          "[api] Acceso prohibido (403):",
          error?.response?.data?.message,
        );
      }
      Alert.alert(
        "Acceso denegado",
        error?.response?.data?.message || "No tienes permiso para realizar esta acción.",
        [{ text: "Aceptar" }]
      );
    }

    return Promise.reject(error);
  },
);

export const api = {
  // Autenticación
  login: (email: string, password: string) =>
    client.post("/auth/login", { email, password }),

  refreshToken: () => client.post("/auth/refresh"),

  changePassword: (currentPassword: string, newPassword: string) =>
    client.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword }),

  // Hogar / Tenant
  getMyHome: () => client.get("/homes/my-home"),
  getHome: (id: number) => client.get(`/homes/${id}`),

  // Compatibility aliases (SaaS / legacy naming)
  getMiHogar: () => client.get("/homes/my-home"),
  getPersonas: (homeId?: number) => client.get("/residents", { params: homeId ? { home_id: homeId } : undefined }),

  // Residentes (Authorized Residents)
  getResidents: () => client.get("/residents"),

  getResident: (id: number) => client.get(`/residents/${id}`),

  createResident: (formData: FormData) =>
    client.post("/residents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deactivateResident: (id: number, userId?: number | string) =>
    client.patch(`/residents/${id}/deactivate`, { user_id: userId }),

  activateResident: (id: number, userId?: number | string) =>
    client.patch(`/residents/${id}/activate`, { user_id: userId }),

  deleteResident: (id: number) =>
    client.delete(`/residents/${id}`),

  // Registros de acceso (Access Logs)
  getLogs: (params?: { result?: string; limit?: number; page?: number }) =>
    client.get("/logs", { params }),

  // Alertas de seguridad
  getAlerts: (resolved?: 0 | 1, page = 1) =>
    client.get("/alerts", {
      params: resolved !== undefined ? { resolved, page } : { page },
    }),

  getAlert: (id: number) => client.get(`/alerts/${id}`),

  resolveAlert: (id: number, userId?: number | string) =>
    client.patch(`/alerts/${id}/resolve`, { user_id: userId }),

  // Auditoría (opcional para admin)
  getAudit: (limit = 20, page = 1) => client.get("/audit", { params: { limit, page } }),

  // Reconocimiento facial test
  recognize: (formData: FormData) =>
    client.post("/recognize", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Gestión de roles (Admin)
  getRoles: (includeInactive = true) =>
    client.get("/roles", { params: { include_inactive: includeInactive } }),

  createRole: (name: string, description: string, requestorId?: number | string) =>
    client.post("/roles", { name, description, requestor_id: requestorId }),

  deactivateRole: (id: number, requestorId?: number | string) =>
    client.patch(`/roles/${id}/deactivate`, { requestor_id: requestorId }),

  activateRole: (id: number, requestorId?: number | string) =>
    client.patch(`/roles/${id}/activate`, { requestor_id: requestorId }),

  // Gestión de usuarios del sistema (Admin)
  getUsers: (includeInactive = true) =>
    client.get("/users", { params: { include_inactive: includeInactive } }),

  createUser: (fullName: string, email: string, password: string, roles: string[], requestorId?: number | string) =>
    client.post("/users", { full_name: fullName, email, password, roles, requestor_id: requestorId ? Number(requestorId) : undefined }),

  deactivateUser: (id: number, requestorId?: number | string) =>
    client.patch(`/users/${id}/deactivate`, { requestor_id: requestorId ? Number(requestorId) : undefined }),

  activateUser: (id: number, requestorId?: number | string) =>
    client.patch(`/users/${id}/activate`, { requestor_id: requestorId ? Number(requestorId) : undefined }),

  assignUserRole: (userId: number, roleId: number, requestorId?: number | string) =>
    client.post(`/users/${userId}/roles`, { role_id: roleId, requestor_id: requestorId ? Number(requestorId) : undefined }),

  removeUserRole: (userId: number, roleId: number, requestorId?: number | string) =>
    client.delete(`/users/${userId}/roles`, { data: { role_id: roleId, requestor_id: requestorId ? Number(requestorId) : undefined } }),
};
