import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://sentinelfacebackend-production.up.railway.app/api";

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
        "No tienes permiso para realizar esta acción.",
        [{ text: "Aceptar" }]
      );
    }

    return Promise.reject(error);
  },
);

export const api = {
  login: (email: string, password: string) =>
    client.post("/auth/login", { email, password }),

  refreshToken: () => client.post("/auth/refresh"),

  changePassword: (currentPassword: string, newPassword: string) =>
    client.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword }),

  getEmployees: () => client.get("/employees"),

  getEmployee: (id: number) => client.get(`/employees/${id}`),

  createEmployee: (formData: FormData) =>
    client.post("/employees", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deactivateEmployee: (id: number, usuarioId: number | string) =>
    client.patch(`/employees/${id}/deactivate`, { usuario_id: usuarioId }),

  activateEmployee: (id: number, usuarioId: number | string) =>
    client.patch(`/employees/${id}/activate`, { usuario_id: usuarioId }),


  getLogs: (params?: { result?: string; limit?: number; page?: number }) =>
    client.get("/logs", { params }),

  getAlerts: (resolved?: 0 | 1, page = 1) =>
    client.get("/alerts", {
      params: resolved !== undefined ? { resolved, page } : { page },
    }),

  getAlert: (id: number) => client.get(`/alerts/${id}`),

  resolveAlert: (id: number, usuarioId: number | string) =>
    client.patch(`/alerts/${id}/resolve`, { usuario_id: usuarioId }),

  getAudit: (limit = 20, page = 1) => client.get("/audit", { params: { limit, page } }),

  recognize: (formData: FormData) =>
    client.post("/recognize", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getRoles: (includeInactive = true) =>
    client.get("/roles", { params: { include_inactive: includeInactive } }),

  createRole: (name: string, description: string, usuarioId: number | string) =>
    client.post("/roles", { name, description, requestor_id: usuarioId }),

  deactivateRole: (id: number, usuarioId: number | string) =>
    client.patch(`/roles/${id}/deactivate`, { requestor_id: usuarioId }),

  activateRole: (id: number, usuarioId: number | string) =>
    client.patch(`/roles/${id}/activate`, { requestor_id: usuarioId }),

  getUsuarios: (includeInactive = true) =>
    client.get("/usuarios", { params: { include_inactive: includeInactive } }),

  createUsuario: (fullName: string, email: string, password: string, roles: string[], requestorId: number | string) =>
    client.post("/usuarios", { full_name: fullName, email, password, roles, requestor_id: Number(requestorId) }),

  deactivateUsuario: (id: number, requestorId: number | string) =>
    client.patch(`/usuarios/${id}/deactivate`, { requestor_id: Number(requestorId) }),

  activateUsuario: (id: number, requestorId: number | string) =>
    client.patch(`/usuarios/${id}/activate`, { requestor_id: Number(requestorId) }),

  assignUsuarioRole: (usuarioId: number, roleId: number, requestorId: number | string) =>
    client.post(`/usuarios/${usuarioId}/roles`, { role_id: roleId, requestor_id: Number(requestorId) }),

  removeUsuarioRole: (usuarioId: number, roleId: number, requestorId: number | string) =>
    client.delete(`/usuarios/${usuarioId}/roles`, { data: { role_id: roleId, requestor_id: Number(requestorId) } }),
};
