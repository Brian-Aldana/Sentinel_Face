import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertTriangle, CheckCircle, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useThemeColors } from "../../constants/theme";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { AlertRecord } from "../../types/domain";
import { customAlert } from "../../store/alertStore";

function severityColor(s: string, C: any) {
  if (s === "CRITICAL" || s === "HIGH") return C.error;
  if (s === "MEDIUM") return C.warning;
  return C.info;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AlertDetailScreen() {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [alert, setAlert] = useState<AlertRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlert = async () => {
      try {
        const res = await api.getAlert(Number(id));
        setAlert(res.data.alert ?? null);
      } catch (error) {
        if (__DEV__) console.error(error);
        customAlert("Error", "No se pudo cargar el detalle de la alerta.");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadAlert();
  }, [id]);

  const handleResolve = () => {
    if (!alert) return;
    customAlert(
      "Resolver alerta",
      "¿Confirmas que esta alerta ha sido atendida?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resolver",
          style: "default",
          onPress: async () => {
            try {
              await api.resolveAlert(alert.alert_id, user?.id ?? "");
              setAlert((prev) =>
                prev
                  ? {
                      ...prev,
                      resolved: true,
                      resolved_by: user?.name,
                      resolved_at: new Date().toISOString(),
                    }
                  : prev,
              );
              router.back();
            } catch (error) {
              if (__DEV__) console.error(error);
              customAlert("Error", "No se pudo resolver la alerta.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={C.gradients.bg}
        style={styles.center}
      >
        <ActivityIndicator size="large" color={C.adminGold} />
      </LinearGradient>
    );
  }

  if (!alert) {
    return (
      <LinearGradient
        colors={C.gradients.bg}
        style={styles.center}
      >
        <Text style={{ color: C.textMuted }}>Alerta no encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkTxt}>Volver</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const color = severityColor(alert.severity, C);

  return (
    <LinearGradient
      colors={C.gradients.bg}
      style={styles.bg}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Detalle de alerta</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.typeCard, { borderColor: `${color}30` }]}>
          <LinearGradient
            colors={[`${color}20`, `${color}05`]}
            style={styles.typeGradient}
          >
            {alert.resolved ? (
              <CheckCircle size={32} color={C.success} />
            ) : (
              <AlertTriangle size={32} color={color} />
            )}
            <Text style={[styles.typeText, { color }]}>
              {alert.alert_type?.replace(/_/g, " ")}
            </Text>
            <View
              style={[
                styles.severityPill,
                { backgroundColor: `${color}20`, borderColor: `${color}40` },
              ]}
            >
              <Text style={[styles.severityTxt, { color }]}>
                {alert.severity}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: alert.resolved
                    ? C.success
                    : C.warning,
                },
              ]}
            >
              {alert.resolved ? "Resuelta" : "Pendiente"}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.rowDivider]}>
            <Text style={styles.infoLabel}>Creada</Text>
            <Text style={styles.infoValue}>{formatDate(alert.created_at)}</Text>
          </View>
          {alert.resolved_at && (
            <View style={[styles.infoRow, styles.rowDivider]}>
              <Text style={styles.infoLabel}>Resuelta el</Text>
              <Text style={styles.infoValue}>
                {formatDate(alert.resolved_at)}
              </Text>
            </View>
          )}
          {alert.resolved_by && (
            <View style={[styles.infoRow, styles.rowDivider]}>
              <Text style={styles.infoLabel}>Resuelta por</Text>
              <Text style={styles.infoValue}>{alert.resolved_by}</Text>
            </View>
          )}
          <View style={[styles.infoRow, styles.rowDivider]}>
            <Text style={styles.infoLabel}>Log de acceso</Text>
            <Text style={styles.infoValue}>#{alert.log_id}</Text>
          </View>
        </View>

        <View style={styles.descCard}>
          <Text style={styles.descTitle}>DESCRIPCIÓN</Text>
          <Text style={styles.descText}>{alert.description}</Text>
        </View>

        {!alert.resolved ? (
          <TouchableOpacity style={styles.resolveBtn} onPress={handleResolve}>
            <CheckCircle size={20} color="white" />
            <Text style={styles.resolveTxt}>Marcar como resuelta</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.resolvedBanner}>
            <CheckCircle size={18} color={C.success} />
            <Text style={styles.resolvedTxt}>Esta alerta ya fue atendida</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: C.text, fontSize: 17, fontWeight: "600" },
  backLink: { marginTop: 16 },
  backLinkTxt: { color: C.pinkNeon, fontSize: 15 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  typeCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  typeGradient: { padding: 24, alignItems: "center", gap: 10 },
  typeText: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  severityPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  severityTxt: { fontSize: 12, fontWeight: "700" },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.border },
  infoLabel: { color: C.textMuted, fontSize: 13 },
  infoValue: {
    color: C.text,
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 10,
  },
  descCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 24,
  },
  descTitle: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  descText: { color: C.text, fontSize: 14, lineHeight: 22 },
  resolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
  },
  resolveTxt: { color: C.surface, fontSize: 16, fontWeight: "700" },
  resolvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(123,196,168,0.14)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(123,196,168,0.35)",
    paddingVertical: 14,
  },
  resolvedTxt: {
    color: C.success,
    fontSize: 14,
    fontWeight: "600",
  },
});