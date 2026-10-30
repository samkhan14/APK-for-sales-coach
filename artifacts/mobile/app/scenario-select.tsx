import React, { useState } from "react";
import { useKeys } from "@/contexts/KeysContext";
import { effectiveVoiceMode } from "@/services/keys/keyStore";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { SCENARIOS } from "@/constants/database";
import { ScenarioCard } from "@/components/ScenarioCard";
import { useCall } from "@/contexts/CallContext";
import { CallScriptPanel } from "@/components/CallScriptPanel";
import { useApp } from "@/contexts/AppContext";
import type { CallerMode } from "@/services/callSetup";

const CALLER_MODES = [
  { value: "decision_maker" as const, label: "Owner answers", desc: "You reach the decision maker directly" },
  { value: "gatekeeper" as const, label: "Receptionist first", desc: "Get past the front desk, then pitch the owner" },
];

const DIFFICULTIES = [
  { value: "easy" as const, label: "Easy", desc: "Forgiving client, more chances to recover", color: "#22c55e" },
  { value: "medium" as const, label: "Medium", desc: "Realistic skepticism, need solid pitch", color: "#f59e0b" },
  { value: "hard" as const, label: "Hard", desc: "Very tough client, high bar to convert", color: "#ef4444" },
];

export default function ScenarioSelectScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startCall } = useCall();
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]!.id);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [callerMode, setCallerMode] = useState<CallerMode>("decision_maker");
  const { voiceMode: chosenVoiceMode } = useApp();
  const { keys } = useKeys();
  const voiceMode = effectiveVoiceMode(keys, chosenVoiceMode);
  const [starting, setStarting] = useState(false);
  const [showScript, setShowScript] = useState(false);

  async function handleStart() {
    if (starting) return;
    setStarting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startCall(selectedScenario, selectedDifficulty, { callerMode, voice: voiceMode !== "off" });
    router.push("/call");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Setup Call</Text>
        {/* Script helper button */}
        <Pressable
          style={[styles.scriptBtn, { backgroundColor: colors.accent }]}
          onPress={() => setShowScript(true)}
        >
          <Feather name="book-open" size={17} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Beginner tip banner */}
        <Pressable
          style={[styles.tipBanner, { backgroundColor: colors.accent, borderColor: colors.primary + "30" }]}
          onPress={() => setShowScript(true)}
        >
          <View style={[styles.tipIcon, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="book-open" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: colors.primary }]}>New to cold calling?</Text>
            <Text style={[styles.tipText, { color: colors.accentForeground }]}>
              Tap to open the Script Helper — openers, questions, objection handles & closing lines.
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.primary} />
        </Pressable>

        {/* Difficulty */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Difficulty</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map(d => (
            <Pressable
              key={d.value}
              style={({ pressed }) => [
                styles.diffBtn,
                {
                  backgroundColor: selectedDifficulty === d.value ? d.color + "20" : colors.card,
                  borderColor: selectedDifficulty === d.value ? d.color : colors.border,
                  opacity: pressed ? 0.85 : 1,
                  flex: 1,
                },
              ]}
              onPress={() => setSelectedDifficulty(d.value)}
            >
              <Text style={[styles.diffLabel, { color: selectedDifficulty === d.value ? d.color : colors.foreground }]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.diffDesc, { color: colors.mutedForeground }]}>
          {DIFFICULTIES.find(d => d.value === selectedDifficulty)?.desc}
        </Text>

        {/* F7: who picks up */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Who answers</Text>
        <View style={styles.difficultyRow}>
          {CALLER_MODES.map(m => (
            <Pressable
              key={m.value}
              style={[
                styles.diffBtn,
                {
                  backgroundColor: callerMode === m.value ? colors.primary + "20" : colors.card,
                  borderColor: callerMode === m.value ? colors.primary : colors.border,
                  flex: 1,
                },
              ]}
              onPress={() => setCallerMode(m.value)}
            >
              <Text style={[styles.diffLabel, { color: callerMode === m.value ? colors.primary : colors.foreground }]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.diffDesc, { color: colors.mutedForeground }]}>
          {CALLER_MODES.find(m => m.value === callerMode)?.desc}
        </Text>

        {/* Scenarios */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scenario</Text>
        {SCENARIOS.map(s => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            selected={selectedScenario === s.id}
            onPress={() => setSelectedScenario(s.id)}
          />
        ))}
      </ScrollView>

      {/* Start button */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.startBtn,
            { backgroundColor: colors.primary, opacity: pressed || starting ? 0.85 : 1 },
          ]}
          onPress={handleStart}
          disabled={starting}
        >
          <Feather name="phone-call" size={20} color="#fff" />
          <Text style={styles.startBtnText}>{starting ? "Connecting..." : "Start Call"}</Text>
        </Pressable>
      </View>

      {/* Script panel */}
      <CallScriptPanel visible={showScript} onClose={() => setShowScript(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scriptBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 4 },
  tipBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  tipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  tipText: { fontSize: 12, lineHeight: 17 },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12, marginTop: 12 },
  difficultyRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  diffBtn: { borderRadius: 10, borderWidth: 1.5, paddingVertical: 12, alignItems: "center" },
  diffLabel: { fontSize: 14, fontWeight: "700" },
  diffDesc: { fontSize: 13, marginBottom: 8 },
  footer: { padding: 16, borderTopWidth: 0.5 },
  startBtn: {
    borderRadius: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  startBtnText: { fontSize: 17, fontWeight: "700", color: "#fff" },
});
