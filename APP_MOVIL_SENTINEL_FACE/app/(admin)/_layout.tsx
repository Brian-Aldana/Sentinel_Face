import { Redirect, Tabs } from "expo-router";
import {
  Bell,
  Clock,
  Home as HomeIcon,
  Settings,
  Users,
} from "lucide-react-native";
import React from "react";
import { useThemeColors } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";

export default function AdminLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);
  const C = useThemeColors();

  const isAuthorized =
    hasRole("home_admin") || hasRole("admin");

  if (!isAuthenticated || !isAuthorized) return <Redirect href="/" />;

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
          title: "Inicio",
          tabBarIcon: ({ color }) => <HomeIcon size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Residentes",
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ color }) => <Clock size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />

      {/* Hidden Screens accessible via navigation */}
      <Tabs.Screen name="alert-detail" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="audit" options={{ href: null }} />
      <Tabs.Screen name="gallery" options={{ href: null }} />
    </Tabs>
  );
}
