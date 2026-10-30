import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { getUsageStats, isProxyConfigured } from "@/services/aiRouter";

function getResetIn(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  return diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getUsageStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function refresh() {
    setLoading(true);
    const s = await getUsageStats();
    setStats(s);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: tabBarHeight + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>API Dashboard</Text>
          {lastUpdated ? (
            <Text style={[styles.updated, { color: colors.mutedForeground }]}>Updated {lastUpdated}</Text>
          ) : null}
        </View>
        <Pressable onPress={refresh} style={[styles.refreshBtn, { backgroundColor: colors.secondary }]}>
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name="refresh-cw" size={18} color={colors.primary} />
          }
        </Pressable>
      </View>

      {/* Current provider banner */}
      {stats && (
        <View style={[styles.currentBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <Feather name="zap" size={16} color={colors.primary} />
          <Text style={[styles.currentText, { color: colors.primary }]}>
            Last answered by:{" "}
            <Text style={{ fontWeight: "800" }}>{stats.currentProvider ? cap(stats.currentProvider) : "—"}</Text>
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today (resets in {getResetIn()})</Text>

      {loading && !stats ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : stats ? (
        <View style={[styles.chainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.chainName, { color: colors.foreground }]}>
            Proxy: {isProxyConfigured() ? "configured" : "NOT configured (set EXPO_PUBLIC_PROXY_URL / EXPO_PUBLIC_APP_TOKEN)"}
          </Text>
          <Text style={[styles.chainSub, { color: colors.mutedForeground, marginTop: 6 }]}>
            Successful AI requests: {stats.requests} · Failed: {stats.failures}
          </Text>
          {Object.entries(stats.byProvider).map(([name, n]) => (
            <Text key={name} style={[styles.chainSub, { color: colors.mutedForeground, marginTop: 4 }]}>
              {cap(name)}: {n}
            </Text>
          ))}
          <Text style={[styles.chainSub, { color: colors.mutedForeground, marginTop: 10 }]}>
            Provider keys and fallback order are managed on the AI proxy, not in the app.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  screenTitle: { fontSize: 26, fontWeight: "800" },
  updated: { fontSize: 12, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  currentBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  currentText: { fontSize: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 8, marginBottom: 12 },
  recommendCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, marginBottom: 24 },
  recommendHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  recommendTitle: { fontSize: 15, fontWeight: "600" },
  recommendText: { fontSize: 14, lineHeight: 20 },
  chainCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24 },
  chainItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  chainNum: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chainNumText: { fontSize: 12, fontWeight: "700" },
  chainName: { fontSize: 14, fontWeight: "600" },
  chainSub: { fontSize: 12 },
  chainArrow: { paddingLeft: 12, paddingVertical: 2 },
});
