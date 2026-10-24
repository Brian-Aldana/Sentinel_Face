import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api } from "../services/api";
import { isTokenExpired } from "../utils/jwtUtils";
import { Home } from "../types/domain";

export interface AuthUser {
  id: string;
  user_id: number;
  name: string;
  email: string;
  roles: string[];
  home_id?: number | null;
  home?: Home | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshHome: () => Promise<Home | null>;
  setHome: (home: Home) => void;
}

const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web" || typeof window === "undefined") {
      try {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web" || typeof window === "undefined") {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, value);
        }
      } catch {
        // ignore
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web" || typeof window === "undefined") {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(key);
        }
      } catch {
        // ignore
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: Platform.OS !== "web",

      hasRole: (role) => {
        const roles = get().user?.roles ?? [];
        if (role === "home_admin" || role === "hogar_admin") {
          return roles.includes("home_admin") || roles.includes("hogar_admin") || roles.includes("admin");
        }
        return roles.includes(role);
      },

      login: async (email, password) => {
        const { data } = await api.login(email, password);
        if (!data.success) throw new Error("Credenciales inválidas.");

        const user: AuthUser = {
          id: String(data.user_id || data.usuario_id),
          user_id: Number(data.user_id || data.usuario_id),
          name: data.name,
          email: data.email,
          roles: data.roles ?? [],
          home_id: data.home?.home_id ?? null,
          home: data.home ?? null,
        };

        set({ token: data.access_token, user, isAuthenticated: true });
      },

      logout: async () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      refreshHome: async () => {
        try {
          const res = await api.getMyHome();
          const home: Home = res.data;
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                home_id: home.home_id,
                home,
              },
            });
          }
          return home;
        } catch (error) {
          console.warn("[authStore] Could not refresh home status", error);
          return null;
        }
      },

      setHome: (home: Home) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              home_id: home.home_id,
              home,
            },
          });
        }
      },
    }),
    {
      name: "sentinel-auth",
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useAuthStore.setState({ isLoading: false });
          return;
        }
        if (state?.token) {
          if (isTokenExpired(state.token)) {
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
      }),
    },
  ),
);

export const selectHasRole =
  (role: string) =>
  (state: AuthState): boolean =>
    state.hasRole(role);
