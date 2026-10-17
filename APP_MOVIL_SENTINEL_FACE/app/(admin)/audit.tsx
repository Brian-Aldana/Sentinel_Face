import { customAlert } from "../../store/alertStore";
import { useFocusEffect } from "expo-router";
import {
    Activity,
    CheckCircle2,
    Database,
    Info,
    Key,
    MinusCircle,
    PlusCircle,
    Search,
    Shield,
    Terminal,
    User,
} from "lucide-react-native";
import React, { useState, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useThemeColors } from "../../constants/theme";
import { api } from "../../services/api";
import { AuditEntry } from "../../types/domain";

function getActionStyle(action: string, C: any) {
  const upper = action.toUpperCase();
  if (upper.includes("CREATE") || upper.includes("ADD") || upper.includes("REGISTER") || upper.includes("ASSIGN")) {
    return {
      color: C.success,
      bg: "rgba(0, 229, 160, 0.12)",
      icon: PlusCircle,
    };
  }
  if (upper.includes("DEACTIVATE") || upper.includes("REMOVE") || upper.includes("DELETE")) {
    return {
      color: C.error,
      bg: "rgba(255, 61, 113, 0.12)",
      icon: MinusCircle,
    };
  }
  if (upper.includes("ACTIVATE")) {
    return {
      color: C.success,
      bg: "rgba(0, 229, 160, 0.12)",
      icon: CheckCircle2,
    };
  }
  if (upper.includes("LOGIN")) {
    return {
      color: C.blueNeon,
      bg: "rgba(0, 224, 255, 0.12)",
      icon: Key,
    };
  }
  if (upper.includes("ALERT") || upper.includes("RESOLVE")) {
    return {
      color: C.warning,
      bg: "rgba(255, 171, 0, 0.12)",
      icon: Shield,
    };
  }
  return {
    color: C.adminGold,
    bg: `${C.adminGold}15`,
    icon: Activity,
  };
}

function formatActionName(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDetail(detail: any): string {
  if (!detail) return "";
  try {
    const parsed = typeof detail === "string" ? JSON.parse(detail) : detail;
    if (typeof parsed === "object") {
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : val}`)
        .join(" · ");
    }
    return String(parsed);
  } catch {
    return String(detail);
  }
}

export default function AuditScreen() {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const pageRef = useRef(1);
  const PAGE_SIZE = 30;

  const fetchLogs = useCallback(async (page: number, replace: boolean) => {
    if (page === 1) replace ? setLoading(true) : setRefreshing(true);
    else setLoadingMore(true);
    try {
      const res = await api.getAudit(PAGE_SIZE, page);
      const { audit: items = [], has_more = false } = res.data;
      setLogs((prev) => (page === 1 ? items : [...prev, ...items]));
      setHasMore(has_more);
      pageRef.current = page;
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert("Error", "No se pudieron cargar los registros de auditoria.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLogs(1, true);
    }, [fetchLogs])
  );

  const onRefresh = useCallback(() => {
    fetchLogs(1, false);
  }, [fetchLogs]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && !refreshing && hasMore) {
      fetchLogs(pageRef.current + 1, false);
    }
  }, [loadingMore, refreshing, hasMore, fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const term = search.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(term);
    const userMatch = (log.usuario_name ?? "").toLowerCase().includes(term);
    const tableMatch = (log.target_table ?? "").toLowerCase().includes(term);
    return actionMatch || userMatch || tableMatch;
  });

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={C.adminGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Auditoría de Sistema</Text>
        <Text style={styles.subtitle}>Historial de acciones de administración</Text>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por acción, usuario o tabla..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => String(item.audit_id)}
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
        onEndReached={search ? undefined : onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={C.adminGold} />
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>
              {search ? "Sin resultados para tu búsqueda" : "No hay registros de auditoría"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const styleInfo = getActionStyle(item.action, C);
          const IconComponent = styleInfo.icon;
          const formattedDetails = formatDetail(item.detail);

          return (
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={[styles.iconWrap, { backgroundColor: styleInfo.bg }]}>
                  <IconComponent size={16} color={styleInfo.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>
                    {formatActionName(item.action)}
                  </Text>
                  <View style={styles.userRow}>
                    <User size={12} color={C.textMuted} />
                    <Text style={styles.userName}>{item.usuario_name ?? "Sistema"}</Text>
                  </View>
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>

              <View style={styles.logBody}>
                {item.target_table ? (
                  <View style={styles.metaRow}>
                    <Database size={12} color={C.textMuted} />
                    <Text style={styles.metaText}>
                      Tabla: <Text style={styles.metaValue}>{item.target_table}</Text>
                      {item.target_id ? ` (ID: ${item.target_id})` : ""}
                    </Text>
                  </View>
                ) : null}

                {item.ip_address ? (
                  <View style={styles.metaRow}>
                    <Terminal size={12} color={C.textMuted} />
                    <Text style={styles.metaText}>
                      IP: <Text style={styles.metaValue}>{item.ip_address}</Text>
                    </Text>
                  </View>
                ) : null}

                {formattedDetails ? (
                  <View style={styles.detailBox}>
                    <Info size={12} color={C.adminGold} style={{ marginTop: 2 }} />
                    <Text style={styles.detailText} numberOfLines={3}>
                      {formattedDetails}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: C.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 30,
  },
  separator: {
    height: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTxt: {
    color: C.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  logCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: `${C.borderStrong}80`,
    paddingBottom: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  userName: {
    color: C.textMuted,
    fontSize: 12,
  },
  dateText: {
    color: C.textMuted,
    fontSize: 11,
  },
  logBody: {
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: C.textMuted,
    fontSize: 12,
  },
  metaValue: {
    color: C.text,
    fontWeight: "500",
  },
  detailBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(195,160,240,0.06)",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: "rgba(195,160,240,0.15)",
  },
  detailText: {
    flex: 1,
    color: C.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
