import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api, TOKEN_KEY } from "../services/api";
import { isTokenExpired } from "../utils/jwtUtils";

import { Hogar } from "../types/domain";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  hogar_id?: number | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hogar: Hogar | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshHogar: () => Promise<Hogar | null>;
}

import { Platform } from "react-native";

const secureStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") window.localStorage.setItem(key, value);
      } catch {}
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") window.localStorage.removeItem(key);
      } catch {}
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hogar: null,
      isAuthenticated: false,
      isLoading: true,

      hasRole: (role) => get().user?.roles.includes(role) ?? false,

      login: async (email, password) => {
        const { data } = await api.login(email, password);
        if (!data.success) throw new Error("Credenciales inválidas.");

        const user: AuthUser = {
          id: String(data.usuario_id),
          name: data.name,
          email: data.email,
          roles: data.roles ?? [],
          hogar_id: data.hogar_id ?? null,
        };

        set({ token: data.access_token, user, isAuthenticated: true });

        // Cargar datos del hogar asignado
        try {
          const hogarRes = await api.getMiHogar();
          if (hogarRes?.data) {
            set({ hogar: hogarRes.data });
          }
        } catch {
          // No bloquea el login si el hogar aún no tiene respuesta
        }
      },

      refreshHogar: async () => {
        try {
          const res = await api.getMiHogar();
          if (res?.data) {
            set({ hogar: res.data });
            return res.data;
          }
        } catch (e) {
          if (__DEV__) console.warn("[authStore] Error al refrescar hogar", e);
        }
        return null;
      },

      logout: async () => {
        set({ token: null, user: null, hogar: null, isAuthenticated: false });
      },
    }),
    {
      name: "sentinel-auth",
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          if (isTokenExpired(state.token)) {
            // persist limpia el storage al recibir el setState con token: null
            useAuthStore.setState({
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            useAuthStore.setState({
              isAuthenticated: !!state.user,
              isLoading: false,
            });
          }
        } else {
          useAuthStore.setState({ isLoading: false });
        }
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        hogar: state.hogar,
      }),
    },
  ),
);

// Selector externo para verificar roles (F-05)
export const selectHasRole =
  (role: string) =>
  (state: AuthState): boolean =>
    state.user?.roles.includes(role) ?? false;
