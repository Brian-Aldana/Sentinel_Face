import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  setDarkMode: (value: boolean) => void;
  setNotifications: (value: boolean) => void;
}

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
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
