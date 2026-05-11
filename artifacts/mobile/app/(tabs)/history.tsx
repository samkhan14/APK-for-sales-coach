import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp, type CallRecord } from "@/contexts/AppContext";
import { FeedbackCard } from "@/components/FeedbackCard";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function scoreColor(s: number) {
  return s >= 7 ? "#22c55e" : s >= 5 ? "#f59e0b" : "#ef4444";
}

function HistoryItem({ record, onPress }: { record: CallRecord; onPress: () => void }) {
  const colors = useColors();
  const color = scoreColor(record.overallScore);

  return (
    <Pressable
      style={({ pressed }) => [styles.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.scoreBadge, { backgroundColor: color + "20" }]}>
        <Text style={[styles.scoreNum, { color }]}>{record.overallScore}</Text>
        <Text style={[styles.scoreDen, { color: colors.mutedForeground }]}>/10</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.foreground }]}>{record.scenarioTitle}</Text>
        <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
          {record.personalityName} · {formatDuration(record.duration)}
        </Text>
        <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>
          {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { callHistory } = useApp();
  const [selected, setSelected] = useState<CallRecord | null>(null);

  if (selected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.detailHeader, {
          paddingTop: insets.top + 16,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }]}>
          <Pressable onPress={() => setSelected(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.detailTitle, { color: colors.foreground }]}>Call Review</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, padding: 16 }}>
          <FeedbackCard
            feedback={{
              confidenceScore: selected.confidenceScore,
              fluencyScore: selected.fluencyScore,
              effectivenessScore: selected.effectivenessScore,
              overallScore: selected.overallScore,
              strengths: [],
              weakPoints: [],
              suggestedResponses: [],
              closingStatement: "",
              summary: selected.summary,
            }}
            duration={selected.duration}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.pageHeader, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>History</Text>
      </View>
      <FlatList
        data={callHistory}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <HistoryItem record={item} onPress={() => setSelected(item)} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 16 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="phone-off" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No calls yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete a practice session to see your history here.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingHorizontal: 20, paddingBottom: 12 },
  pageTitle: { fontSize: 26, fontWeight: "800" },
  listContent: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  scoreBadge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 18, fontWeight: "800" },
  scoreDen: { fontSize: 10 },
  itemContent: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 15, fontWeight: "600" },
  itemSub: { fontSize: 12 },
  itemDate: { fontSize: 11 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  detailTitle: { fontSize: 17, fontWeight: "700" },
});
