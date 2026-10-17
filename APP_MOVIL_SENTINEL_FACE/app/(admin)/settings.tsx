import { useRouter } from "expo-router";
import {
    Bell,
    ChevronRight,
    LogOut,
    Moon,
    Key,
    X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useThemeColors } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { LinearGradient } from "expo-linear-gradient";
import { useSettingsStore } from "../../store/settingsStore";
import { customAlert } from "../../store/alertStore";

const SettingRow = ({
  icon: Icon,
  color,
  label,
  value,
  onPress,
  isSwitch,
  switchValue,
  onToggle,
}: any) => {
  const C = useThemeColors();
  const styles = getStyles(C);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={isSwitch && !onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          thumbColor="white"
          trackColor={{ true: C.adminGold, false: C.border }}
        />
      ) : (
        <View style={styles.rowRight}>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          <ChevronRight size={16} color={C.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const { darkMode, notifications, setDarkMode, setNotifications } = useSettingsStore();
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);

  const handleChangePasswordSubmit = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      customAlert("Campos requeridos", "Por favor completa todos los campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      customAlert("Error de validación", "La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      customAlert("Error de validación", "La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setChangeLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      customAlert("Éxito", "Tu contraseña ha sido cambiada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordModalVisible(false);
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert(
        "Error",
        (error as any)?.response?.data?.message ?? "No se pudo cambiar la contraseña. Verifica los datos."
      );
    } finally {
      setChangeLoading(false);
    }
  };

  const handleLogout = () => {
    customAlert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión del panel de administración?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() ?? "A"}
          </Text>
        </View>
        <View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      <Text style={styles.section}>SISTEMA</Text>
      <View style={styles.group}>
        <SettingRow
          icon={Bell}
          color={C.blueNeon}
          label="Notificaciones de alerta"
          isSwitch
          switchValue={notifications}
          onToggle={setNotifications}
        />
        <SettingRow
          icon={Moon}
          color={C.purpleNeon}
          label="Modo oscuro"
          isSwitch
          switchValue={darkMode}
          onToggle={setDarkMode}
        />
      </View>

      <Text style={styles.section}>SEGURIDAD</Text>
      <View style={styles.group}>
        <SettingRow
          icon={Key}
          color={C.greenNeon}
          label="Cambiar contraseña"
          onPress={() => setPasswordModalVisible(true)}
        />
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut size={18} color={C.redAlert} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* MODAL: CAMBIAR CONTRASEÑA */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setPasswordModalVisible(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <X size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>CONTRASEÑA ACTUAL *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ingresa tu contraseña actual..."
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>NUEVA CONTRASEÑA *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Mínimo 6 caracteres..."
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>CONFIRMAR NUEVA CONTRASEÑA *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Repite la nueva contraseña..."
              placeholderTextColor={C.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={changeLoading}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={styles.cancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.createBtn, changeLoading && { opacity: 0.6 }]}
                disabled={changeLoading}
                onPress={handleChangePasswordSubmit}
              >
                <LinearGradient
                  colors={C.gradients.admin as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createGrad}
                >
                  {changeLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.createTxt}>Confirmar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { color: C.text, fontSize: 22, fontWeight: "700", marginBottom: 20 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 28,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${C.adminGold}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: C.adminGold, fontSize: 20, fontWeight: "700" },
  profileName: { color: C.text, fontSize: 16, fontWeight: "600" },
  profileEmail: { color: C.textMuted, fontSize: 13, marginTop: 2 },
  section: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 4,
  },
  group: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 22,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: { flex: 1, color: C.text, fontSize: 15 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { color: C.textMuted, fontSize: 13 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: `${C.redAlert}40`,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: { color: C.redAlert, fontSize: 15, fontWeight: "600" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
  },
  modalLabel: {
    color: C.purpleNeon,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.text,
    fontSize: 14,
    marginBottom: 12,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelTxt: { color: C.textMuted, fontSize: 15, fontWeight: "600" },
  createBtn: { flex: 1, height: 48 },
  createGrad: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createTxt: { color: "white", fontSize: 15, fontWeight: "700" },
});
