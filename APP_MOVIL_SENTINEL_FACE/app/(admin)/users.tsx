import { useRouter, useFocusEffect } from "expo-router";
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  XCircle,
} from "lucide-react-native";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeColors } from "../../constants/theme";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Resident, Home } from "../../types/domain";
import { customAlert } from "../../store/alertStore";

export default function UsersScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);

  const [residents, setResidents] = useState<Resident[]>([]);
  const [home, setHome] = useState<Home | null>(user?.home ?? null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Modal para confirmar toggle de estado
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchResidents = useCallback(async (showFullLoading = false) => {
    if (showFullLoading) setLoading(true);
    try {
      const [resRes, homeRes] = await Promise.all([
        api.getResidents(),
        api.getMyHome().catch(() => null),
      ]);
      setResidents(resRes.data.residents ?? []);
      if (homeRes?.data) setHome(homeRes.data);
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert("Error", "No se pudo cargar la lista de residentes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchResidents(residents.length === 0);
    }, [fetchResidents, residents.length])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchResidents(false);
  }, [fetchResidents]);

  const handleToggleStatus = async () => {
    if (!selectedResident) return;
    setStatusLoading(true);
    try {
      if (selectedResident.is_active) {
        await api.deactivateResident(selectedResident.resident_id, user?.id);
      } else {
        await api.activateResident(selectedResident.resident_id, user?.id);
      }
      setStatusModalVisible(false);
      await fetchResidents(false);
      customAlert(
        "Estado Actualizado",
        `El residente ${selectedResident.full_name} ha sido ${selectedResident.is_active ? "desactivado" : "activado"} exitosamente.`
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || "No se pudo actualizar el estado del residente.";
      customAlert("Error", msg);
    } finally {
      setStatusLoading(false);
    }
  };

  const isSuspended = home?.service_status === "SUSPENDED" || home?.service_status === "DENIED";
  const activeResidentsCount = residents.filter((r) => r.is_active).length;
  const maxResidents = home?.max_residents ?? 10;
  const isLimitReached = activeResidentsCount >= maxResidents;

  const filteredResidents = residents.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      (r.document_id && r.document_id.toLowerCase().includes(q));
    const matchesActive = !showOnlyActive || r.is_active;
    return matchesSearch && matchesActive;
  });

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Residentes Autorizados</Text>
          <Text style={styles.screenSubtitle}>
            {home?.owner_name || "Mi Hogar"} · {activeResidentsCount}/{maxResidents} cupos utilizados
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, (isSuspended || isLimitReached) && styles.addBtnDisabled]}
          onPress={() => {
            if (isSuspended) {
              customAlert(
                "Servicio No Disponible",
                "El servicio del hogar está suspendido. No se pueden registrar residentes."
              );
              return;
            }
            if (isLimitReached) {
              customAlert(
                "Cupo Máximo Alcanzado",
                `Tu hogar ha alcanzado el límite de ${maxResidents} residentes autorizados. Para aumentar el cupo, contacta al proveedor.`
              );
              return;
            }
            router.push("/(admin)/register");
          }}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Warning banner if suspended */}
      {isSuspended && (
        <View style={styles.suspendedBanner}>
          <AlertTriangle size={18} color="#F59E0B" />
          <Text style={styles.suspendedBannerText}>
            Servicio {home?.service_status}: Las modificaciones biométricas y el acceso facial están deshabilitados.
          </Text>
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o documento..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, showOnlyActive && styles.filterToggleActive]}
          onPress={() => setShowOnlyActive(!showOnlyActive)}
        >
          <Text style={[styles.filterToggleText, showOnlyActive && styles.filterToggleTextActive]}>
            {showOnlyActive ? "Activos" : "Todos"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Residents List */}
      <FlatList
        data={filteredResidents}
        keyExtractor={(item) => String(item.resident_id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.adminGold}
            colors={[C.adminGold]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={40} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No hay residentes registrados</Text>
            <Text style={styles.emptySub}>
              {search
                ? "Ningún residente coincide con la búsqueda."
                : "Agrega a los miembros de tu familia para habilitar su acceso facial."}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Resident }) => {
          const initials = item.full_name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const active = item.is_active;

          return (
            <View style={[styles.residentCard, !active && styles.residentCardInactive]}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: active ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)",
                    borderColor: active ? "#10B981" : C.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: active ? "#10B981" : C.textMuted },
                  ]}
                >
                  {initials}
                </Text>
              </View>

              <View style={styles.residentInfo}>
                <Text style={styles.residentName}>{item.full_name}</Text>
                <Text style={styles.residentDoc}>
                  Doc: {item.document_id || "No registrado"}
                </Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: active ? "#10B981" : "#EF4444" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: active ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {active ? "Acceso Facial Habilitado" : "Acceso Desactivado"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleActionBtn,
                  active ? styles.toggleActionBtnDeactivate : styles.toggleActionBtnActivate,
                ]}
                onPress={() => {
                  setSelectedResident(item);
                  setStatusModalVisible(true);
                }}
              >
                {active ? (
                  <UserMinus size={16} color="#EF4444" />
                ) : (
                  <UserCheck size={16} color="#10B981" />
                )}
                <Text
                  style={[
                    styles.toggleActionText,
                    { color: active ? "#EF4444" : "#10B981" },
                  ]}
                >
                  {active ? "Desactivar" : "Activar"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AlertTriangle
                size={24}
                color={selectedResident?.is_active ? "#EF4444" : "#10B981"}
              />
              <Text style={styles.modalTitle}>
                {selectedResident?.is_active
                  ? "¿Desactivar Residente?"
                  : "¿Reactivar Residente?"}
              </Text>
            </View>

            <Text style={styles.modalBody}>
              {selectedResident?.is_active
                ? `Al desactivar a ${selectedResident?.full_name}, el sistema biométrico en la puerta denegará automáticamente su acceso.`
                : `Al activar a ${selectedResident?.full_name}, podrá ingresar inmediatamente mediante reconocimiento facial.`}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor: selectedResident?.is_active
                      ? "#EF4444"
                      : "#10B981",
                  },
                ]}
                disabled={statusLoading}
                onPress={handleToggleStatus}
              >
                {statusLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {selectedResident?.is_active ? "Confirmar Desactivación" : "Confirmar Activación"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(C: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
      paddingTop: 54,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: C.text,
    },
    screenSubtitle: {
      fontSize: 12,
      color: C.adminGold,
      fontWeight: "600",
      marginTop: 2,
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: C.adminGold,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    addBtnDisabled: {
      opacity: 0.4,
    },
    addBtnText: {
      color: "#0F172A",
      fontSize: 12,
      fontWeight: "700",
    },
    suspendedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "rgba(245, 158, 11, 0.12)",
      borderColor: "rgba(245, 158, 11, 0.3)",
      borderWidth: 1,
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 10,
      borderRadius: 12,
    },
    suspendedBannerText: {
      flex: 1,
      fontSize: 11,
      color: "#F59E0B",
      fontWeight: "600",
    },
    searchRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 42,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: C.text,
    },
    filterToggle: {
      paddingHorizontal: 14,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.card,
    },
    filterToggleActive: {
      borderColor: C.adminGold,
      backgroundColor: `${C.adminGold}15`,
    },
    filterToggleText: {
      fontSize: 12,
      fontWeight: "600",
      color: C.textMuted,
    },
    filterToggleTextActive: {
      color: C.adminGold,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    residentCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
    },
    residentCardInactive: {
      opacity: 0.65,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    avatarText: {
      fontSize: 15,
      fontWeight: "800",
    },
    residentInfo: {
      flex: 1,
    },
    residentName: {
      fontSize: 14,
      fontWeight: "700",
      color: C.text,
    },
    residentDoc: {
      fontSize: 11,
      color: C.textMuted,
      marginTop: 2,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "600",
    },
    toggleActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    toggleActionBtnDeactivate: {
      backgroundColor: "rgba(239, 68, 68, 0.08)",
      borderColor: "rgba(239, 68, 68, 0.25)",
    },
    toggleActionBtnActivate: {
      backgroundColor: "rgba(16, 185, 129, 0.08)",
      borderColor: "rgba(16, 185, 129, 0.25)",
    },
    toggleActionText: {
      fontSize: 11,
      fontWeight: "700",
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: C.text,
      marginTop: 12,
    },
    emptySub: {
      fontSize: 12,
      color: C.textMuted,
      textAlign: "center",
      marginTop: 6,
      lineHeight: 18,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalContent: {
      width: "100%",
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: C.text,
    },
    modalBody: {
      fontSize: 13,
      color: C.textMuted,
      lineHeight: 19,
      marginBottom: 20,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
    },
    modalCancelBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: "rgba(148, 163, 184, 0.15)",
    },
    modalCancelText: {
      fontSize: 12,
      fontWeight: "600",
      color: C.text,
    },
    modalConfirmBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    modalConfirmText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
}
