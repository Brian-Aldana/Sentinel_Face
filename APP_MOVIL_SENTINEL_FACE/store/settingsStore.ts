import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  setDarkMode: (value: boolean) => void;
  setNotifications: (value: boolean) => void;
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: true,
      notifications: true,
      setDarkMode: (value) => set({ darkMode: value }),
      setNotifications: (value) => set({ notifications: value }),
    }),
    {
      name: "sentinel-settings",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
