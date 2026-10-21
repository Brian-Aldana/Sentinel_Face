import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Home as HomeIcon,
  Shield,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  LucideIcon,
  XCircle,
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
import { AccessLog, AlertRecord, Resident, Home, ServiceStatus } from "../../types/domain";
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
  const refreshHome = useAuthStore((s) => s.refreshHome);
  const router = useRouter();
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);

  const [home, setHome] = useState<Home | null>(user?.home ?? null);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const prevAlertsCount = useRef<number | null>(null);

  const fetchDashboard = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) {
      setLoading(true);
    }
    try {
      const [logsRes, resRes, alertsRes, homeRes] = await Promise.all([
        api.getLogs({ limit: 10 }),
        api.getResidents(),
        api.getAlerts(0),
        refreshHome(),
      ]);

      setLogs(logsRes.data.logs ?? []);
      setResidents(resRes.data.residents ?? []);
      if (homeRes) setHome(homeRes);

      const newAlerts = alertsRes.data.alerts ?? [];
      setAlerts(newAlerts);

      const notificationsEnabled = useSettingsStore.getState().notifications;
      if (
        notificationsEnabled &&
        prevAlertsCount.current !== null &&
        newAlerts.length > prevAlertsCount.current
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        customAlert(
          "⚠️ Alerta de Seguridad en tu Hogar",
          "Se ha registrado un nuevo evento sospechoso en la entrada de tu residencia."
        );
      }
      prevAlertsCount.current = newAlerts.length;
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert("Error", "No se pudo actualizar el estado del hogar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshHome]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard(logs.length === 0 && residents.length === 0 && alerts.length === 0);
    }, [fetchDashboard, logs.length, residents.length, alerts.length])
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

  const activeResidents = residents.filter((r) => r.is_active).length;
  const granted = logs.filter((l) => l.access_result === "GRANTED").length;
  const pendingAlerts = alerts.filter((a) => !a.resolved).length;
  const serviceStatus: ServiceStatus = home?.service_status ?? "ACTIVE";

  const isSuspended = serviceStatus === "SUSPENDED" || serviceStatus === "DENIED";

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
      {/* Home Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.homeCode}>
            {home?.owner_name || "Mi Hogar"} · {home?.home_code || "HOG-001"}
          </Text>
        </View>
        <View style={styles.shieldWrap}>
          <HomeIcon size={24} color={C.adminGold} />
        </View>
      </View>

      {/* Service Status Banner */}
      <View
        style={[
          styles.statusCard,
          serviceStatus === "ACTIVE"
            ? styles.statusCardActive
            : serviceStatus === "SUSPENDED"
            ? styles.statusCardSuspended
            : serviceStatus === "DENIED"
            ? styles.statusCardDenied
            : styles.statusCardTrial,
        ]}
      >
        <View style={styles.statusRow}>
          {serviceStatus === "ACTIVE" ? (
            <CheckCircle size={20} color="#10B981" />
          ) : serviceStatus === "SUSPENDED" ? (
            <AlertTriangle size={20} color="#F59E0B" />
          ) : (
            <ShieldAlert size={20} color="#EF4444" />
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.statusTitle}>
              {serviceStatus === "ACTIVE"
                ? "SERVICIO ACTIVO"
                : serviceStatus === "SUSPENDED"
                ? "SERVICIO SUSPENDIDO"
                : serviceStatus === "DENIED"
                ? "SERVICIO DENEGADO"
                : "SERVICIO EN PRUEBA"}
            </Text>
            <Text style={styles.statusDesc}>
              {serviceStatus === "ACTIVE"
                ? "El control de acceso facial y la apertura de puerta operan con normalidad."
                : serviceStatus === "SUSPENDED"
                ? `Motivo: ${home?.suspension_reason || "Mantenimiento o cuota pendiente"}. El ingreso facial está temporalmente pausado.`
                : serviceStatus === "DENIED"
                ? `Motivo: ${home?.suspension_reason || "Revocado por administración"}. El servicio ha sido bloqueado.`
                : "Periodo de prueba técnica activo en tu residencia."}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Navigation Buttons */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push("/(admin)/users")}
        >
          <Users size={18} color={C.adminGold} />
          <Text style={styles.quickActionTxt}>Gestionar Residentes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, isSuspended && styles.quickActionBtnDisabled]}
          onPress={() => {
            if (isSuspended) {
              customAlert(
                "Servicio No Disponible",
                "El servicio de tu hogar está suspendido o denegado. No es posible registrar nuevos residentes hasta reactivar el servicio."
              );
            } else {
              router.push("/(admin)/register");
            }
          }}
        >
          <UserPlus size={18} color={isSuspended ? C.textMuted : C.purpleNeon} />
          <Text style={[styles.quickActionTxt, isSuspended && { color: C.textMuted }]}>
            Registrar Residente
          </Text>
        </TouchableOpacity>
      </View>

      {/* KPI Stats Grid */}
      <Text style={styles.sectionTitle}>ESTADO DEL HOGAR</Text>
      <View style={styles.statsGrid}>
        <StatCard
          label="Residentes"
          value={`${activeResidents}/${home?.max_residents ?? 10}`}
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
          value={pendingAlerts}
          color={C.redAlert}
          icon={AlertTriangle}
          styles={styles}
        />
        <StatCard
          label="Cámaras"
          value={`${home?.max_cameras ?? 2}`}
          color={C.adminGold}
          icon={Shield}
          styles={styles}
        />
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>ACTIVIDAD RECIENTE DE ACCESO</Text>
        <TouchableOpacity onPress={() => router.push("/(admin)/history")}>
          <Text style={styles.seeAllText}>Ver todo ›</Text>
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={32} color={C.textMuted} />
          <Text style={styles.emptyText}>No hay registros de acceso recientes en este hogar.</Text>
        </View>
      ) : (
        logs.slice(0, 6).map((item) => {
          const isGranted = item.access_result === "GRANTED";
          const initials = (item.full_name ?? "DS")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const avatarColor = isGranted ? C.greenNeon : C.redAlert;

          return (
            <View key={item.log_id} style={styles.logCard}>
              <View style={[styles.logAvatar, { backgroundColor: `${avatarColor}20`, borderColor: avatarColor }]}>
                <Text style={[styles.logAvatarText, { color: avatarColor }]}>{initials}</Text>
              </View>
              <View style={styles.logInfo}>
                <Text style={styles.logName} numberOfLines={1}>
                  {item.full_name ?? "Persona no identificada"}
                </Text>
                <Text style={styles.logMeta}>
                  {timeAgo(item.event_time)}
                  {item.liveness !== "UNKNOWN" ? ` · Liveness: ${item.liveness}` : ""}
                </Text>
              </View>
              <View style={styles.logBadge}>
                {isGranted ? (
                  <View style={[styles.statusPill, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                    <CheckCircle size={12} color="#10B981" />
                    <Text style={[styles.statusPillText, { color: "#10B981" }]}>ACCESO</Text>
                  </View>
                ) : (
                  <View style={[styles.statusPill, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                    <XCircle size={12} color="#EF4444" />
                    <Text style={[styles.statusPillText, { color: "#EF4444" }]}>DENEGADO</Text>
                  </View>
                )}
                {item.confidence > 0 && (
                  <Text style={styles.confidenceText}>{(item.confidence * 100).toFixed(0)}% coincidencia</Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function getStyles(C: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    content: {
      padding: 20,
      paddingTop: 54,
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    greeting: {
      fontSize: 13,
      color: C.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    name: {
      fontSize: 22,
      fontWeight: "800",
      color: C.text,
      marginTop: 2,
    },
    homeCode: {
      fontSize: 13,
      fontWeight: "600",
      color: C.adminGold,
      marginTop: 3,
    },
    shieldWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: `${C.adminGold}15`,
      borderWidth: 1,
      borderColor: `${C.adminGold}30`,
      alignItems: "center",
      justifyContent: "center",
    },
    statusCard: {
      borderRadius: 16,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
    },
    statusCardActive: {
      backgroundColor: "rgba(16, 185, 129, 0.08)",
      borderColor: "rgba(16, 185, 129, 0.3)",
    },
    statusCardSuspended: {
      backgroundColor: "rgba(245, 158, 11, 0.08)",
      borderColor: "rgba(245, 158, 11, 0.3)",
    },
    statusCardDenied: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderColor: "rgba(239, 68, 68, 0.3)",
    },
    statusCardTrial: {
      backgroundColor: "rgba(6, 182, 212, 0.08)",
      borderColor: "rgba(6, 182, 212, 0.3)",
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    statusTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: C.text,
      letterSpacing: 0.5,
    },
    statusDesc: {
      fontSize: 12,
      color: C.textMuted,
      marginTop: 4,
      lineHeight: 17,
    },
    quickActionsContainer: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 20,
    },
    quickActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
    },
    quickActionBtnDisabled: {
      opacity: 0.5,
    },
    quickActionTxt: {
      fontSize: 12,
      fontWeight: "600",
      color: C.text,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: C.textMuted,
      letterSpacing: 1,
      marginBottom: 12,
      textTransform: "uppercase",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 12,
    },
    seeAllText: {
      fontSize: 12,
      color: C.adminGold,
      fontWeight: "600",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      width: "48%",
      borderRadius: 16,
      borderWidth: 1,
      overflow: "hidden",
    },
    statGradient: {
      padding: 14,
      borderRadius: 15,
      alignItems: "flex-start",
    },
    statValue: {
      fontSize: 22,
      fontWeight: "800",
      marginTop: 8,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: C.textMuted,
      fontWeight: "500",
    },
    emptyContainer: {
      padding: 30,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    emptyText: {
      fontSize: 12,
      color: C.textMuted,
      marginTop: 10,
      textAlign: "center",
    },
    logCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    logAvatar: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    logAvatarText: {
      fontSize: 14,
      fontWeight: "700",
    },
    logInfo: {
      flex: 1,
    },
    logName: {
      fontSize: 13,
      fontWeight: "600",
      color: C.text,
    },
    logMeta: {
      fontSize: 11,
      color: C.textMuted,
      marginTop: 2,
    },
    logBadge: {
      alignItems: "flex-end",
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    confidenceText: {
      fontSize: 10,
      color: C.textMuted,
      marginTop: 3,
    },
  });
}
