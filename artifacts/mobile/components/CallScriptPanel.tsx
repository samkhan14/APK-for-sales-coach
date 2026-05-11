import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  OPENING_LINES,
  DISCOVERY_QUESTIONS,
  OBJECTION_SCRIPTS,
  CLOSING_LINES,
  CALL_PHASES,
} from "@/constants/callScript";

type Tab = "phases" | "openers" | "questions" | "objections" | "closing";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "phases", label: "Flow", icon: "layers" },
  { id: "openers", label: "Openers", icon: "mic" },
  { id: "questions", label: "Questions", icon: "help-circle" },
  { id: "objections", label: "Objections", icon: "shield" },
  { id: "closing", label: "Closing", icon: "flag" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CallScriptPanel({ visible, onClose }: Props) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<Tab>("phases");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Call Script Helper</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Beginner guide — reference during practice
            </Text>
          </View>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map(t => (
            <Pressable
              key={t.id}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === t.id ? colors.primary : colors.secondary,
                  borderColor: activeTab === t.id ? colors.primary : "transparent",
                },
              ]}
              onPress={() => setActiveTab(t.id)}
            >
              <Feather name={t.icon as any} size={13} color={activeTab === t.id ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: activeTab === t.id ? "#fff" : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* PHASES */}
          {activeTab === "phases" && (
            <View style={styles.section}>
              <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
                Follow this flow on every call. Don't skip discovery.
              </Text>
              {CALL_PHASES.map((phase, i) => (
                <View key={i} style={[styles.phaseCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.phaseHeader}>
                    <View style={[styles.phaseNum, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.phaseNumText, { color: colors.primary }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.phaseTitle, { color: colors.foreground }]}>{phase.phase}</Text>
                  </View>
                  {phase.lines.map((line, j) => (
                    <View key={j} style={styles.tipRow}>
                      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{line}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* OPENERS */}
          {activeTab === "openers" && (
            <View style={styles.section}>
              <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
                Use these word-for-word to start the call. Replace [brackets] with real info.
              </Text>
              {OPENING_LINES.map((line, i) => (
                <View key={i} style={[styles.scriptCard, { backgroundColor: colors.background, borderColor: colors.primary + "30" }]}>
                  <View style={styles.scriptNum}>
                    <Text style={[styles.scriptNumText, { color: colors.primary }]}>#{i + 1}</Text>
                  </View>
                  <Text style={[styles.scriptText, { color: colors.foreground }]}>"{line}"</Text>
                </View>
              ))}
            </View>
          )}

          {/* QUESTIONS */}
          {activeTab === "questions" && (
            <View style={styles.section}>
              <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
                Ask these to understand the customer before pitching. Pick 2–3 that feel natural.
              </Text>
              {DISCOVERY_QUESTIONS.map((q, i) => (
                <View key={i} style={[styles.questionRow, { borderBottomColor: colors.border }]}>
                  <Feather name="help-circle" size={15} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={[styles.questionText, { color: colors.foreground }]}>"{q}"</Text>
                </View>
              ))}
            </View>
          )}

          {/* OBJECTIONS */}
          {activeTab === "objections" && (
            <View style={styles.section}>
              <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
                When a customer pushes back, use these responses. Acknowledge first, redirect second.
              </Text>
              {OBJECTION_SCRIPTS.map((obj, i) => (
                <View key={i} style={[styles.objCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.objTrigger, { backgroundColor: "#f59e0b20" }]}>
                    <Feather name="alert-circle" size={13} color="#f59e0b" />
                    <Text style={[styles.objTriggerText, { color: "#f59e0b" }]}>{obj.trigger}</Text>
                  </View>
                  <Text style={[styles.objResponse, { color: colors.foreground }]}>"{obj.response}"</Text>
                </View>
              ))}
            </View>
          )}

          {/* CLOSING */}
          {activeTab === "closing" && (
            <View style={styles.section}>
              <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
                Always ask for a next step — not the final decision. Book a follow-up call, not a contract.
              </Text>
              <View style={[styles.tipsBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.tipsBoxTitle, { color: colors.primary }]}>Key Rule</Text>
                <Text style={[styles.tipsBoxText, { color: colors.foreground }]}>
                  Never ask "So do you want to move forward?" — it's too high stakes. Instead ask for a small next step: a 15-minute follow-up call.
                </Text>
              </View>
              {CLOSING_LINES.map((line, i) => (
                <View key={i} style={[styles.scriptCard, { backgroundColor: colors.background, borderColor: colors.primary + "30" }]}>
                  <View style={styles.scriptNum}>
                    <Text style={[styles.scriptNumText, { color: colors.primary }]}>#{i + 1}</Text>
                  </View>
                  <Text style={[styles.scriptText, { color: colors.foreground }]}>"{line}"</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "82%",
    paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabScroll: { marginBottom: 12 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabLabel: { fontSize: 13, fontWeight: "600" },
  content: { paddingHorizontal: 16 },
  section: { gap: 12 },
  sectionNote: { fontSize: 13, lineHeight: 18, fontStyle: "italic", marginBottom: 4 },
  phaseCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  phaseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  phaseNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  phaseNumText: { fontSize: 13, fontWeight: "800" },
  phaseTitle: { fontSize: 15, fontWeight: "700" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 8 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },
  scriptCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  scriptNum: {},
  scriptNumText: { fontSize: 11, fontWeight: "700" },
  scriptText: { fontSize: 14, lineHeight: 21, fontStyle: "italic" },
  questionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 12, borderBottomWidth: 0.5 },
  questionText: { flex: 1, fontSize: 14, lineHeight: 21 },
  objCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  objTrigger: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  objTriggerText: { fontSize: 12, fontWeight: "700" },
  objResponse: { fontSize: 14, lineHeight: 21, fontStyle: "italic" },
  tipsBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  tipsBoxTitle: { fontSize: 13, fontWeight: "800" },
  tipsBoxText: { fontSize: 13, lineHeight: 19 },
});
