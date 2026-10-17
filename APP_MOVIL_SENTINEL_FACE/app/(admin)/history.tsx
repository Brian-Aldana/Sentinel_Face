import { customAlert } from "../../store/alertStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react-native";
import React, { useState, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors, useThemeColors } from "../../constants/theme";
import { api } from "../../services/api";
import { AccessLog } from "../../types/domain";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function HistoryScreen() {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const router = useRouter();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const PAGE_SIZE = 30;

  const fetchLogs = useCallback(async (page: number, replace: boolean) => {
    if (page === 1) replace ? setLoading(true) : setRefreshing(true);
    else setLoadingMore(true);
    try {
      const res = await api.getLogs({ limit: PAGE_SIZE, page });
      const { logs: items = [], has_more = false } = res.data;
      setLogs((prev) => (page === 1 ? items : [...prev, ...items]));
      setHasMore(has_more);
      pageRef.current = page;
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert("Error", "No se pudo cargar el historial de accesos.");
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
        <ActivityIndicator size="large" color={Colors.dark.adminGold} />
      </View>
    );
  }

  const granted = logs.filter((l) => l.access_result === "GRANTED").length;
  const denied = logs.filter((l) => l.access_result === "DENIED").length;

  return (
    <LinearGradient
      colors={C.gradients.bg}
      style={styles.bg}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Historial de accesos</Text>
          <Text style={styles.sub}>{logs.length} registros totales</Text>
        </View>
      </View>

      <View style={styles.summary}>
        {[
          { label: "Accesos", value: granted, color: C.success },
          { label: "Denegados", value: denied, color: C.error },
          { label: "Total", value: logs.length, color: C.blueNeon },
        ].map((s, i) => (
          <View
            key={i}
            style={[styles.summaryCard, { borderColor: `${s.color}30` }]}
          >
            <Text style={[styles.summaryVal, { color: s.color }]}>
              {s.value}
            </Text>
            <Text style={styles.summaryLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.log_id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.adminGold}
            colors={[C.adminGold]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={Colors.dark.adminGold} />
            </View>
          ) : null
        }
        renderItem={({ item, index }: { item: AccessLog; index: number }) => {
          const ok = item.access_result === "GRANTED";
          const color = ok ? C.success : C.error;
          return (
            <View style={[styles.row, index > 0 && styles.divider]}>
              <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                {ok ? (
                  <CheckCircle size={18} color={color} />
                ) : (
                  <XCircle size={18} color={color} />
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>
                  {item.full_name ?? "Desconocido"}
                </Text>
                <Text style={styles.meta}>
                  {formatDate(item.event_time)}
                  {item.liveness !== "UNKNOWN" && ` · ${item.liveness}`}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={[styles.result, { color }]}>
                  {ok ? "ACCESO" : "DENEGADO"}
                </Text>
                {item.confidence > 0 && (
                  <Text style={styles.confidence}>
                    {(item.confidence * 100).toFixed(0)}%
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </LinearGradient>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: C.text },
  sub: { fontSize: 11, color: C.textSubtle, marginTop: 2 },
  summary: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  summaryVal: { fontSize: 22, fontWeight: "800" },
  summaryLbl: { color: C.textMuted, fontSize: 11, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  divider: { borderTopWidth: 1, borderTopColor: C.border },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  name: { color: C.text, fontSize: 14, fontWeight: "500" },
  meta: { color: C.textMuted, fontSize: 11, marginTop: 3 },
  right: { alignItems: "flex-end" },
  result: { fontSize: 11, fontWeight: "700" },
  confidence: { color: C.textSubtle, fontSize: 11, marginTop: 3 },
});
