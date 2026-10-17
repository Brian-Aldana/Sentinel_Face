import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Shield,
    UserCheck,
    Users,
    LucideIcon,
} from "lucide-react-native";
import React, { useState, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useThemeColors } from "../../constants/theme";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import * as Haptics from "expo-haptics";
import { useSettingsStore } from "../../store/settingsStore";
import { AccessLog, AlertRecord, Employee } from "../../types/domain";
import { customAlert } from "../../store/alertStore";

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `Hace ${diff}s`;
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  return `Hace ${Math.floor(diff / 3600)}h`;
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  icon: LucideIcon;
  styles: any;
}

const StatCard = ({ label, value, color, icon: Icon, styles }: StatCardProps) => (
  <View
    style={[
      styles.statCard,
      { borderColor: color, backgroundColor: `${color}12` },
    ]}
  >
    <LinearGradient
      colors={[`${color}30`, `${color}08`]}
      style={styles.statGradient}
    >
      <Icon size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);

  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const prevAlertsCount = useRef<number | null>(null);

  const fetchDashboard = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) {
      setLoading(true);
    }
    try {
      const [logsRes, empRes, alertsRes] = await Promise.all([
        api.getLogs({ limit: 10 }),
        api.getEmployees(),
        api.getAlerts(0),
      ]);
      setLogs(logsRes.data.logs ?? []);
      setEmployees(empRes.data.employees ?? []);
      
      const newAlerts = alertsRes.data.alerts ?? [];
      setAlerts(newAlerts);

      // Si las notificaciones están activadas, dispara haptic y alerta nativa al recibir nuevas alertas no resueltas
      const notificationsEnabled = useSettingsStore.getState().notifications;
      if (
        notificationsEnabled &&
        prevAlertsCount.current !== null &&
        newAlerts.length > prevAlertsCount.current
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        customAlert(
          "⚠️ Nueva Alerta de Seguridad",
          "Se ha detectado un nuevo evento sospechoso no resuelto en el sistema."
        );
      }
      prevAlertsCount.current = newAlerts.length;
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert("Error", "No se pudo cargar la información. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard(logs.length === 0 && employees.length === 0 && alerts.length === 0);
    }, [fetchDashboard, logs.length, employees.length, alerts.length])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard(false);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={C.adminGold} />
      </View>
    );
  }

  const granted = logs.filter((l) => l.access_result === "GRANTED").length;
  const pending = alerts.filter((a) => !a.resolved).length;
  const activeEmployees = employees.filter((e) => e.is_active).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={C.adminGold}
          colors={[C.adminGold]}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <View style={styles.shieldWrap}>
          <Shield size={22} color={C.adminGold} />
        </View>
      </View>

      <LinearGradient
        colors={["#C3A0F0", "#A080D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.adminBadge}
      >
        <Shield size={16} color="#FFFFFF" />
        <Text style={styles.adminBadgeText}>PANEL DE ADMINISTRACIÓN</Text>
      </LinearGradient>

      <TouchableOpacity
        style={styles.quickBtn}
        onPress={() => router.push("/(admin)/history")}
      >
        <Clock size={18} color={C.purpleNeon} />
        <Text style={styles.quickTxt}>Ver historial completo de accesos</Text>
        <Text style={styles.quickArrow}>›</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>RESUMEN DEL SISTEMA</Text>
      <View style={styles.statsGrid}>
        <StatCard
          label="Activos"
          value={activeEmployees}
          color={C.blueNeon}
          icon={UserCheck}
          styles={styles}
        />
        <StatCard
          label="Accesos hoy"
          value={granted}
          color={C.greenNeon}
          icon={CheckCircle}
          styles={styles}
        />
        <StatCard
          label="Alertas"
          value={pending}
          color={C.redAlert}
          icon={AlertTriangle}
          styles={styles}
        />
        <StatCard
          label="Total usuarios"
          value={employees.length}
          color={C.adminGold}
          icon={Users}
          styles={styles}
        />
      </View>

      <Text style={styles.sectionTitle}>ACTIVIDAD RECIENTE</Text>
      {logs.slice(0, 8).map((item) => {
        const isGranted = item.access_result === "GRANTED";
        const initials = (item.full_name ?? "DS")
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const avatarColor = isGranted
          ? C.success
          : C.error;
        return (
          <View key={item.log_id} style={styles.activityRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: `${avatarColor}20`,
                  borderColor: `${avatarColor}40`,
                },
              ]}
            >
              <Text style={[styles.avatarTxt, { color: avatarColor }]}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityName}>
                {item.full_name ?? "Desconocido"}
              </Text>
              <Text style={styles.activityTime}>
                {timeAgo(item.event_time)}
              </Text>
            </View>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: `${avatarColor}18`,
                  borderColor: `${avatarColor}35`,
                },
              ]}
            >
              <Text style={[styles.activityStatus, { color: avatarColor }]}>
                {isGranted ? "Acceso" : "Denegado"}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 30 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { color: C.textMuted, fontSize: 13 },
  name: { color: C.text, fontSize: 22, fontWeight: "700" },
  shieldWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(195,160,240,0.15)",
    borderWidth: 1,
    borderColor: "rgba(195,160,240,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 2,
  },

  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(195,160,240,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 28,
  },
  quickTxt: { flex: 1, color: C.textMuted, fontSize: 13 },
  quickArrow: { color: C.purpleNeon, fontSize: 20 },

  sectionTitle: {
    color: C.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 14,
    fontWeight: "600",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  statGradient: { padding: 16, gap: 6 },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { color: C.textMuted, fontSize: 12 },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarTxt: { fontSize: 13, fontWeight: "700" },
  activityName: { color: C.text, fontSize: 14, fontWeight: "500" },
  activityTime: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activityStatus: { fontSize: 12, fontWeight: "600" },
});
