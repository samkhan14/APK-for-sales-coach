import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/contexts/AppContext";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { streak, totalCalls, bestScore, callHistory } = useApp();

  const recentCall = callHistory[0];
  const avgScore = callHistory.length > 0
    ? Math.round(callHistory.reduce((a, c) => a + c.overallScore, 0) / callHistory.length * 10) / 10
    : 0;

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
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Sales Practice</Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: streak > 0 ? "#f59e0b20" : colors.secondary }]}>
          <Feather name="zap" size={16} color={streak > 0 ? "#f59e0b" : colors.mutedForeground} />
          <Text style={[styles.streakText, { color: streak > 0 ? "#f59e0b" : colors.mutedForeground }]}>
            {streak} day{streak !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [styles.ctaButton, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        onPress={() => router.push("/scenario-select")}
      >
        <View style={styles.ctaInner}>
          <View style={styles.ctaTextGroup}>
            <Text style={styles.ctaTitle}>Start Practice Call</Text>
            <Text style={styles.ctaSub}>Pick a scenario and begin</Text>
          </View>
          <View style={styles.ctaIcon}>
            <Feather name="phone-call" size={28} color="#fff" />
          </View>
        </View>
      </Pressable>

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Stats</Text>
      <View style={styles.statsRow}>
        <StatCard label="Total Calls" value={totalCalls} icon="phone" color={colors.primary} />
        <StatCard label="Best Score" value={bestScore > 0 ? `${bestScore}/10` : "—"} icon="award" color="#22c55e" />
        <StatCard label="Avg Score" value={avgScore > 0 ? `${avgScore}/10` : "—"} icon="trending-up" color="#f59e0b" />
      </View>

      {/* Recent call */}
      {recentCall && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Last Session</Text>
          <Pressable
            style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/history")}
          >
            <View style={styles.recentLeft}>
              <Text style={[styles.recentScenario, { color: colors.foreground }]}>{recentCall.scenarioTitle}</Text>
              <Text style={[styles.recentPersonality, { color: colors.mutedForeground }]}>
                {recentCall.personalityName} · {new Date(recentCall.date).toLocaleDateString()}
              </Text>
              <Text style={[styles.recentSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                {recentCall.summary}
              </Text>
            </View>
            <View style={[styles.recentScore, { backgroundColor: recentCall.overallScore >= 7 ? "#22c55e20" : recentCall.overallScore >= 5 ? "#f59e0b20" : "#ef444420" }]}>
              <Text style={[styles.recentScoreNum, { color: recentCall.overallScore >= 7 ? "#22c55e" : recentCall.overallScore >= 5 ? "#f59e0b" : "#ef4444" }]}>
                {recentCall.overallScore}
              </Text>
              <Text style={[styles.recentScoreDen, { color: colors.mutedForeground }]}>/10</Text>
            </View>
          </Pressable>
        </>
      )}

      {/* Tips */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Tips</Text>
      {[
        { icon: "mic", tip: "Ask discovery questions before pitching — understand their pain first." },
        { icon: "shield", tip: "Acknowledge objections, don't fight them. Then redirect." },
        { icon: "clock", tip: "Keep your opening under 15 seconds. Hook them fast." },
      ].map((t, i) => (
        <View key={i} style={[styles.tipRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tipIcon, { backgroundColor: colors.accent }]}>
            <Feather name={t.icon as any} size={14} color={colors.primary} />
          </View>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{t.tip}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 13, fontWeight: "500" },
  title: { fontSize: 26, fontWeight: "800", marginTop: 2 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakText: { fontSize: 13, fontWeight: "600" },
  ctaButton: { borderRadius: 16, padding: 20, marginBottom: 24 },
  ctaInner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ctaTextGroup: { gap: 4 },
  ctaTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  ctaSub: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  ctaIcon: { width: 56, height: 56, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 28, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 8, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  recentCard: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 24 },
  recentLeft: { flex: 1, gap: 4 },
  recentScenario: { fontSize: 15, fontWeight: "600" },
  recentPersonality: { fontSize: 12 },
  recentSummary: { fontSize: 13, lineHeight: 18 },
  recentScore: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  recentScoreNum: { fontSize: 20, fontWeight: "800" },
  recentScoreDen: { fontSize: 10 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  tipIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
