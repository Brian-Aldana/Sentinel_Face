import { customAlert } from "../../store/alertStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronRight, Clock, LogOut, Shield } from "lucide-react-native";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useThemeColors } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";

export default function ProfileScreen() {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  const handleLogout = () => {
    customAlert("Cerrar sesión", "¿Estás seguro de que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={C.gradients.bg}
      style={styles.bg}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Mi perfil</Text>

        <View style={styles.avatarSection}>
          <LinearGradient
            colors={C.gradients.admin as any}
            style={styles.avatar}
          >
            <Text style={styles.avatarTxt}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.rolesRow}>
            {user?.roles.map((role) => (
              <View key={role} style={styles.badge}>
                <Shield size={11} color={C.adminGold} />
                <Text style={styles.badgeTxt}>{role}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          {[
            { label: "ID de usuario", value: user?.id ?? "—" },
            { label: "Roles", value: user?.roles.join(", ") ?? "—" },
            { label: "Estado", value: "Activo" },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i > 0 && styles.rowDivider]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/(admin)/history")}
          >
            <View style={styles.menuIcon}>
              <Clock size={18} color={C.adminGold} />
            </View>
            <Text style={styles.menuLabel}>Historial de accesos</Text>
            <ChevronRight size={15} color={C.textSubtle} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color={C.error} />
          <Text style={styles.logoutTxt}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: C.text,
    marginBottom: 28,
  },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarTxt: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: C.text },
  email: { fontSize: 13, color: C.textMuted, marginTop: 4, marginBottom: 10 },
  rolesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: `${C.adminGold}15`,
    borderWidth: 1,
    borderColor: `${C.adminGold}30`,
  },
  badgeTxt: {
    color: C.adminGold,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
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
    padding: 14,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: C.border },
  infoLabel: { color: C.textMuted, fontSize: 13 },
  infoValue: { color: C.text, fontSize: 13, fontWeight: "500" },
  menuCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${C.adminGold}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, color: C.text, fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,61,113,0.25)",
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(255,61,113,0.06)",
  },
  logoutTxt: { color: C.error, fontSize: 15, fontWeight: "600" },
});
