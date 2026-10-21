import { Redirect, Tabs } from "expo-router";
import {
    Bell,
    Camera,
    ClipboardList,
    Settings,
    Shield,
    Users,
} from "lucide-react-native";
import React from "react";
import { useThemeColors } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";

export default function AdminLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);
  const C = useThemeColors();

  const isAllowed =
    hasRole("admin") ||
    hasRole("superadmin") ||
    hasRole("hogar_admin") ||
    hasRole("hogar_user");

  if (!isAuthenticated || !isAllowed) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.adminGold,
        tabBarInactiveTintColor: C.textSubtle,
        tabBarStyle: {
          backgroundColor: C.background,
          borderTopColor: C.border,
          height: 65,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Mi Hogar",
          tabBarIcon: ({ color }) => <Shield size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Galería",
          tabBarIcon: ({ color }) => <Camera size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Personas",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: "Auditoría",
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Config",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="alert-detail" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
    </Tabs>
  );
}
