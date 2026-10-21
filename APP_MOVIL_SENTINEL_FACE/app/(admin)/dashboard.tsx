import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
    AlertTriangle,
    AlertOctagon,
    CheckCircle,
    Clock,
    Home,
    MapPin,
    Shield,
    UserCheck,
    Users,
    Video,
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
import { AccessLog, AlertRecord, Employee, Hogar } from "../../types/domain";
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
  const authHogar = useAuthStore((s) => s.hogar);
  const router = useRouter();
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);

  const [hogar, setHogar] = useState<Hogar | null>(authHogar);
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
      const [logsRes, empRes, alertsRes, hogarRes] = await Promise.allSettled([
        api.getLogs({ limit: 10 }),
        api.getEmployees(),
        api.getAlerts(0),
        api.getMiHogar(),
      ]);

      if (logsRes.status === "fulfilled") setLogs(logsRes.value.data.logs ?? []);
      if (empRes.status === "fulfilled") setEmployees(empRes.value.data.employees ?? []);
      
      if (alertsRes.status === "fulfilled") {
        const newAlerts = alertsRes.value.data.alerts ?? [];
        setAlerts(newAlerts);

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
      }

      if (hogarRes.status === "fulfilled" && hogarRes.value.data) {
        setHogar(hogarRes.value.data);
        useAuthStore.setState({ hogar: hogarRes.value.data });
      }
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

  const isSuspended = hogar?.estado_servicio === "SUSPENDIDO";
  const isDenied = hogar?.estado_servicio === "DENEGADO";
  const isTrial = hogar?.estado_servicio === "PRUEBA";

  const statusColor = isSuspended || isDenied
    ? C.redAlert
    : isTrial
    ? C.blueNeon
    : C.greenNeon;

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

      {/* Card Principal del Hogar SaaS */}
      <View style={styles.hogarCard}>
        <LinearGradient
          colors={["rgba(195,160,240,0.18)", "rgba(20,20,35,0.85)"]}
          style={styles.hogarGradient}
        >
          <View style={styles.hogarHeaderRow}>
            <View style={styles.hogarIconWrap}>
              <Home size={22} color={C.adminGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hogarTitle}>
                {hogar?.nombre_titular ?? "Hogar Residencial"}
              </Text>
              <Text style={styles.hogarCodigo}>
                {hogar?.codigo_hogar ?? "HOG-001"} · SaaS Residencial
              </Text>
            </View>
            <View
              style={[
                styles.serviceBadge,
                {
                  borderColor: `${statusColor}50`,
                  backgroundColor: `${statusColor}18`,
                },
              ]}
            >
              <Text style={[styles.serviceBadgeText, { color: statusColor }]}>
                {hogar?.estado_servicio ?? "ACTIVO"}
              </Text>
            </View>
          </View>

          {hogar?.direccion ? (
            <View style={styles.addressRow}>
              <MapPin size={13} color={C.textMuted} />
              <Text style={styles.addressText} numberOfLines={1}>
                {hogar.direccion}
              </Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      {/* Banner de Suspensión / Denegación de Servicio */}
      {(isSuspended || isDenied) && (
        <View style={styles.suspensionBanner}>
          <AlertOctagon size={24} color={C.redAlert} />
          <View style={{ flex: 1 }}>
            <Text style={styles.suspensionTitle}>
              {isSuspended ? "Servicio Suspendido" : "Servicio Denegado"}
            </Text>
            <Text style={styles.suspensionMotivo}>
              {hogar?.motivo_suspension || "El acceso biométrico en tu hogar ha sido suspendido temporalmente por el proveedor."}
            </Text>
            <Text style={styles.suspensionSubtext}>
              Los accesos en la puerta de entrada serán denegados hasta regularizar el estado.
            </Text>
          </View>
        </View>
      )}

      {/* Acceso Rápido a Gestión de Personas del Hogar */}
      <TouchableOpacity
        style={styles.quickBtn}
        onPress={() => router.push("/(admin)/users")}
      >
        <Users size={18} color={C.purpleNeon} />
        <Text style={styles.quickTxt}>Gestionar Personas y Familiares del Hogar</Text>
        <Text style={styles.quickArrow}>›</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>MÉTRICAS DEL HOGAR</Text>
      <View style={styles.statsGrid}>
        <StatCard
          label="Personas registradas"
          value={`${activeEmployees} / ${hogar?.limite_personas ?? 10}`}
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
          label="Alertas pendientes"
          value={pending}
          color={C.redAlert}
          icon={AlertTriangle}
          styles={styles}
        />
        <StatCard
          label="Límite cámaras"
          value={`${hogar?.limite_camaras ?? 2} activas`}
          color={C.adminGold}
          icon={Video}
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

  hogarCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(195,160,240,0.3)",
    marginBottom: 16,
  },
  hogarGradient: {
    padding: 16,
    gap: 12,
  },
  hogarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hogarIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(195,160,240,0.15)",
    borderWidth: 1,
    borderColor: "rgba(195,160,240,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  hogarTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  hogarCodigo: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 8,
  },
  addressText: {
    color: C.textMuted,
    fontSize: 12,
    flex: 1,
  },

  suspensionBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255, 77, 77, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.4)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    alignItems: "flex-start",
  },
  suspensionTitle: {
    color: C.redAlert,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  suspensionMotivo: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    lineHeight: 16,
  },
  suspensionSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    lineHeight: 14,
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
