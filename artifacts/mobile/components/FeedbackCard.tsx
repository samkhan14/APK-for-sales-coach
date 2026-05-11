import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { CallFeedback } from "@/services/aiRouter";

interface Props {
  feedback: CallFeedback;
  duration: number;
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.scoreItem}>
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={[styles.scoreDenom, { color: colors.mutedForeground }]}>/10</Text>
      </View>
      <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const SCORE_COLORS = (s: number) => s >= 8 ? "#22c55e" : s >= 6 ? "#f59e0b" : "#ef4444";

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function FeedbackCard({ feedback, duration }: Props) {
  const colors = useColors();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Overall score */}
      <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.overallBadge, { backgroundColor: SCORE_COLORS(feedback.overallScore) + "20" }]}>
          <Text style={[styles.overallScore, { color: SCORE_COLORS(feedback.overallScore) }]}>
            {feedback.overallScore}/10
          </Text>
        </View>
        <Text style={[styles.overallLabel, { color: colors.foreground }]}>Overall Performance</Text>
        <Text style={[styles.duration, { color: colors.mutedForeground }]}>
          Call duration: {formatDuration(duration)}
        </Text>
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>{feedback.summary}</Text>
      </View>

      {/* Score breakdown */}
      <View style={[styles.scoresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Score Breakdown</Text>
        <View style={styles.scoresRow}>
          <ScoreRing score={feedback.confidenceScore} label="Confidence" color={SCORE_COLORS(feedback.confidenceScore)} />
          <ScoreRing score={feedback.fluencyScore} label="Fluency" color={SCORE_COLORS(feedback.fluencyScore)} />
          <ScoreRing score={feedback.effectivenessScore} label="Effectiveness" color={SCORE_COLORS(feedback.effectivenessScore)} />
        </View>
      </View>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="thumbs-up" size={16} color="#22c55e" />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What You Did Well</Text>
          </View>
          {feedback.strengths.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: "#22c55e" }]} />
              <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weak points */}
      {feedback.weakPoints.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-circle" size={16} color="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Areas to Improve</Text>
          </View>
          {feedback.weakPoints.map((w, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: "#f59e0b" }]} />
              <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{w}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Better responses */}
      {feedback.suggestedResponses.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="message-square" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Try These Instead</Text>
          </View>
          {feedback.suggestedResponses.map((r, i) => (
            <View key={i} style={[styles.suggestionBubble, { backgroundColor: colors.accent }]}>
              <Text style={[styles.suggestionText, { color: colors.accentForeground }]}>"{r}"</Text>
            </View>
          ))}
        </View>
      )}

      {/* Better closing */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="flag" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stronger Closing Line</Text>
        </View>
        <View style={[styles.suggestionBubble, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.suggestionText, { color: colors.primary }]}>"{feedback.closingStatement}"</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overallCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 12, gap: 8 },
  overallBadge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 50 },
  overallScore: { fontSize: 32, fontWeight: "800" },
  overallLabel: { fontSize: 16, fontWeight: "600" },
  duration: { fontSize: 13 },
  summary: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  scoresCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  scoresRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  scoreItem: { alignItems: "center", gap: 6 },
  scoreCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  scoreNumber: { fontSize: 20, fontWeight: "700" },
  scoreDenom: { fontSize: 11, marginTop: 4 },
  scoreLabel: { fontSize: 12, fontWeight: "500" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  suggestionBubble: { borderRadius: 10, padding: 12 },
  suggestionText: { fontSize: 14, lineHeight: 20, fontStyle: "italic" },
});
