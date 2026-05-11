import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { getUsageStats, GEMINI_DAILY_LIMIT, GROQ_DAILY_LIMIT, OPENROUTER_DAILY_LIMIT, type AIProvider } from "@/services/aiRouter";
import { UsageCard } from "@/components/UsageCard";

function getResetIn(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffM = Math.floor((diffMs % 3600000) / 60000);
  return diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`;
}

function getStatus(used: number, limit: number): "active" | "warning" | "exhausted" | "standby" {
  const pct = used / limit;
  if (pct >= 1) return "exhausted";
  if (pct >= 0.8) return "warning";
  if (used === 0) return "standby";
  return "active";
}

function getRecommendation(
  geminiUsed: number, groqUsed: number, openrouterUsed: number,
  current: AIProvider
): string {
  if (current === "local") return "All APIs exhausted — using offline scripted responses.";
  const geminiPct = geminiUsed / GEMINI_DAILY_LIMIT;
  const groqPct = groqUsed / GROQ_DAILY_LIMIT;
  const openrouterPct = openrouterUsed / OPENROUTER_DAILY_LIMIT;
  const best = [
    { name: "Gemini", pct: geminiPct },
    { name: "Groq", pct: groqPct },
    { name: "OpenRouter", pct: openrouterPct },
  ].sort((a, b) => a.pct - b.pct)[0]!;
  if (best.pct < 0.2) return `${best.name} is currently least loaded — optimal for speed.`;
  if (best.pct < 0.5) return `${best.name} has the most capacity remaining.`;
  return "All providers are moderately loaded. Responses may be slower.";
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
            Currently using:{" "}
            <Text style={{ fontWeight: "800" }}>
              {stats.currentProvider === "local"
                ? "Offline (Local DB)"
                : stats.currentProvider.charAt(0).toUpperCase() + stats.currentProvider.slice(1)}
            </Text>
          </Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Provider Status</Text>

      {loading && !stats ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : stats ? (
        <>
          <UsageCard
            provider="Google Gemini"
            used={stats.gemini.requests}
            limit={GEMINI_DAILY_LIMIT}
            status={getStatus(stats.gemini.requests, GEMINI_DAILY_LIMIT)}
            isCurrent={stats.currentProvider === "gemini"}
            resetIn={getResetIn()}
            subtitle="gemini-1.5-flash · Primary AI"
          />
          <UsageCard
            provider="Groq"
            used={stats.groq.requests}
            limit={GROQ_DAILY_LIMIT}
            status={getStatus(stats.groq.requests, GROQ_DAILY_LIMIT)}
            isCurrent={stats.currentProvider === "groq"}
            resetIn={getResetIn()}
            subtitle={`llama-3.1-8b-instant · ${stats.groq.tokens.toLocaleString()} tokens used`}
          />
          <UsageCard
            provider="OpenRouter"
            used={stats.openrouter.requests}
            limit={OPENROUTER_DAILY_LIMIT}
            status={getStatus(stats.openrouter.requests, OPENROUTER_DAILY_LIMIT)}
            isCurrent={stats.currentProvider === "openrouter"}
            resetIn={getResetIn()}
            subtitle="llama-3.1-8b-instruct:free · Backup"
          />

          <View style={[styles.recommendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.recommendHeader}>
              <Feather name="cpu" size={16} color={colors.primary} />
              <Text style={[styles.recommendTitle, { color: colors.foreground }]}>Smart Recommendation</Text>
            </View>
            <Text style={[styles.recommendText, { color: colors.mutedForeground }]}>
              {getRecommendation(stats.gemini.requests, stats.groq.requests, stats.openrouter.requests, stats.currentProvider)}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fallback Chain</Text>
          <View style={[styles.chainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { name: "Gemini API", sub: "Primary — fastest, best quality", icon: "star" },
              { name: "Groq API", sub: "Fallback — ultra-fast inference", icon: "zap" },
              { name: "OpenRouter", sub: "Backup — multiple model access", icon: "shield" },
              { name: "Local DB", sub: "Offline — scripted responses", icon: "database" },
            ].map((item, i, arr) => (
              <View key={i}>
                <View style={styles.chainItem}>
                  <View style={[styles.chainNum, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.chainNumText, { color: colors.primary }]}>{i + 1}</Text>
                  </View>
                  <Feather name={item.icon as any} size={16} color={colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chainName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.chainSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && (
                  <View style={styles.chainArrow}>
                    <Feather name="arrow-down" size={12} color={colors.mutedForeground} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </>
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
