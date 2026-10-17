import { customAlert } from "../../store/alertStore";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
    CheckCircle,
    ImageIcon,
    ShieldAlert,
    XCircle,
} from "lucide-react-native";
import React, { useState, useCallback, useRef } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image } from "expo-image";
import { useThemeColors } from "../../constants/theme";
import { api, BASE_URL } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { AccessLog } from "../../types/domain";

const COL = 3;
const GAP = 8;
const SCREEN = Dimensions.get("window").width;
const TILE = (SCREEN - 32 - GAP * (COL - 1)) / COL;

type FilterKey = "all" | "GRANTED" | "DENIED" | "SPOOFING";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "GRANTED", label: "Accesos" },
  { key: "DENIED", label: "Denegados" },
  { key: "SPOOFING", label: "Spoofing" },
];

function timeStr(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

interface SnapshotTileProps {
  item: AccessLog;
  token: string | null;
  cacheBuster: number;
}

function SnapshotTile({ item, token, cacheBuster }: SnapshotTileProps) {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const ok = item.access_result === "GRANTED";
  const spoof = item.liveness === "SPOOFING";
  const color = ok
    ? C.success
    : spoof
      ? C.warning
      : C.error;
  const tileBackground = ok
    ? "rgba(0, 180, 80, 0.15)"
    : spoof
      ? "rgba(220, 160, 0, 0.15)"
      : "rgba(220, 50, 50, 0.15)";
  const initials = item.full_name
    ? item.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <View style={[styles.tile, { width: TILE }]}>
      <View
        style={[styles.tileInner, { backgroundColor: C.surface, overflow: "hidden", width: "100%" }]}
      >
        <Text style={styles.tileInitials}>{initials}</Text>
        <Image 
          source={{ 
            uri: `${BASE_URL}/logs/${item.log_id}/image?t=${cacheBuster}`,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover"
          onError={(e) => console.log(`Error cargando imagen log ${item.log_id}:`, e.error)}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tileBackground }]} />
        <View
          style={[
            styles.resultBadge,
            { backgroundColor: `${color}30`, borderColor: `${color}60` },
          ]}
        >
          {ok ? (
            <CheckCircle size={10} color={color} />
          ) : spoof ? (
            <ShieldAlert size={10} color={color} />
          ) : (
            <XCircle size={10} color={color} />
          )}
        </View>
      </View>
      <View style={styles.tileMeta}>
        <Text style={styles.tileName} numberOfLines={1}>
          {item.full_name ?? "Desconocido"}
        </Text>
        <Text style={styles.tileTime}>{timeStr(item.event_time)}</Text>
      </View>
    </View>
  );
}

export default function GalleryScreen() {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const token = useAuthStore((s) => s.token);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const cacheBusterRef = useRef<number>(Date.now());
  const pageRef = useRef(1);
  const PAGE_SIZE = 30;

  const fetchLogs = useCallback(async (page: number, replace: boolean) => {
    if (page === 1) replace ? setLoading(true) : setRefreshing(true);
    else setLoadingMore(true);
    if (replace) cacheBusterRef.current = Date.now();
    try {
      const res = await api.getLogs({ limit: PAGE_SIZE, page });
      const { logs: items = [], has_more = false } = res.data;
      setLogs((prev) => (page === 1 ? items : [...prev, ...items]));
      setHasMore(has_more);
      pageRef.current = page;
    } catch (error) {
      if (__DEV__) console.error(error);
      customAlert("Error", "No se pudo cargar la galeria. Intenta de nuevo.");
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

  const displayed = logs.filter((l) => {
    if (filter === "all") return true;
    if (filter === "SPOOFING") return l.liveness === "SPOOFING";
    return l.access_result === filter;
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

  const granted = logs.filter((l) => l.access_result === "GRANTED").length;
  const denied = logs.filter((l) => l.access_result === "DENIED").length;
  const spoofing = logs.filter((l) => l.liveness === "SPOOFING").length;

  return (
    <LinearGradient
      colors={C.gradients.bg}
      style={styles.bg}
    >
      {/* Seccion fija: encabezado + tarjetas + filtros */}
      <View>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Galeria de accesos</Text>
            <Text style={styles.sub}>
              Capturas registradas por las camaras del sistema
            </Text>
          </View>
        </View>

        <View style={styles.summary}>
          {[
            { label: "Accesos", value: granted, color: C.success },
            { label: "Negados", value: denied, color: C.error },
            { label: "Spoofing", value: spoofing, color: C.warning },
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
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersWrap}
          style={styles.filtersScroll}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[
                styles.filterBtn,
                filter === f.key && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterTxt,
                  filter === f.key && styles.filterTxtActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Grid de imagenes — ocupa el espacio restante */}
      <FlatList
        style={styles.gridList}
        data={displayed}
        keyExtractor={(item) => String(item.log_id)}
        numColumns={COL}
        contentContainerStyle={[styles.grid, displayed.length === 0 && { flexGrow: 1, justifyContent: "center" }]}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={displayed.length > 0 ? styles.row : undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ImageIcon size={40} color={C.textSubtle} />
            <Text style={styles.emptyTxt}>Sin capturas en esta categoria</Text>
          </View>
        }
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
              <ActivityIndicator size="small" color={C.adminGold} />
            </View>
          ) : null
        }
        renderItem={({ item }) => <SnapshotTile item={item} token={token} cacheBuster={cacheBusterRef.current} />}
      />
    </LinearGradient>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  bg: { flex: 1 },
  gridList: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "700", color: C.text },
  sub: { fontSize: 12, color: C.textMuted, marginTop: 3 },
  summary: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
  },
  summaryVal: { fontSize: 20, fontWeight: "800", includeFontPadding: false },
  summaryLbl: { color: C.textMuted, fontSize: 10, marginTop: 3, includeFontPadding: false },
  filtersScroll: { flexGrow: 0, marginBottom: 12 },
  filtersWrap: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    backgroundColor: `${C.adminGold}18`,
    borderColor: `${C.adminGold}40`,
  },
  filterTxt: { color: C.textMuted, fontSize: 12 },
  filterTxtActive: { color: C.adminGold, fontWeight: "600" },
  grid: { paddingHorizontal: 16, paddingBottom: 32 },
  row: { gap: GAP, marginBottom: GAP },
  tile: {},
  tileInner: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
    position: "relative",
  },
  tileInitials: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 22,
    fontWeight: "700",
  },
  resultBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileMeta: { paddingTop: 5, paddingHorizontal: 2 },
  tileName: { color: C.text, fontSize: 10, fontWeight: "500" },
  tileTime: { color: C.textSubtle, fontSize: 9, marginTop: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTxt: { color: C.textSubtle, fontSize: 14 },
});
