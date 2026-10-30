import { OBJECTIONS, PERSONALITIES, SCENARIOS } from "@/constants/database";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { KeyFields } from "@/components/KeyFields";
import { useApp } from "@/contexts/AppContext";

function SettingRow({
  icon, label, subtitle, right,
}: {
  icon: string; label: string; subtitle?: string; right: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.accent }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { theme, setTheme, voiceMode, setVoiceMode, voiceDebug, setVoiceDebug } = useApp();

  const isDark = colors.isDark;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: tabBarHeight + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Settings</Text>

      {/* Appearance */}
      <Text style={[styles.section, { color: colors.mutedForeground }]}>APPEARANCE</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon="moon"
          label="Dark Mode"
          subtitle={theme === "system" ? "Following system setting" : isDark ? "On" : "Off"}
          right={
            <Switch
              value={isDark}
              onValueChange={v => setTheme(v ? "dark" : "light")}
              trackColor={{ false: colors.border, true: colors.primary + "99" }}
              thumbColor={isDark ? colors.primary : "#fff"}
              ios_backgroundColor={colors.border}
            />
          }
        />
      </View>

      {/* Voice (beta feature flag, default OFF) */}
      <Text style={[styles.section, { color: colors.mutedForeground }]}>VOICE (BETA)</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon="mic"
          label="Human voice calls"
          subtitle={
            voiceMode === "off" ? "Off — normal hold-to-talk calls"
            : voiceMode === "live" ? "Gemini Live: talk freely, interrupt anytime"
            : "Fallback: Whisper + Gemini voice"
          }
          right={null}
        />
        <View style={styles.segment}>
          {(["off", "live", "chained"] as const).map(m => (
            <Pressable
              key={m}
              onPress={() => setVoiceMode(m)}
              style={[styles.segBtn, {
                backgroundColor: voiceMode === m ? colors.primary : colors.background,
                borderColor: voiceMode === m ? colors.primary : colors.border,
              }]}
            >
              <Text style={{ color: voiceMode === m ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 13 }}>
                {m === "off" ? "Off" : m === "live" ? "Live" : "Fallback"}
              </Text>
            </Pressable>
          ))}
        </View>
        <SettingRow
          icon="activity"
          label="Show timing readout"
          subtitle="Reply delay and interrupt speed on the call screen"
          right={
            <Switch
              value={voiceDebug}
              onValueChange={setVoiceDebug}
              trackColor={{ false: colors.border, true: colors.primary + "99" }}
              thumbColor={voiceDebug ? colors.primary : "#fff"}
              ios_backgroundColor={colors.border}
            />
          }
        />
      </View>

      {/* Your API keys (stored on this device only). Clearing one returns to the setup screen. */}
      <Text style={[styles.section, { color: colors.mutedForeground }]}>YOUR API KEYS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <KeyFields />
      </View>

      {/* About */}
      <Text style={[styles.section, { color: colors.mutedForeground }]}>ABOUT</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon="info"
          label="AI Sales Practice"
          subtitle="Version 1.0.0"
          right={<Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
        />
        <SettingRow
          icon="database"
          label={`${OBJECTIONS.length} Objections`}
          subtitle="Local knowledge base"
          right={<Text style={[styles.badge, { backgroundColor: colors.accent, color: colors.primary }]}>Built-in</Text>}
        />
        <SettingRow
          icon="layers"
          label={`${SCENARIOS.length} Scenarios`}
          subtitle="Web dev, AI, CRM + US local business packs"
          right={<Text style={[styles.badge, { backgroundColor: colors.accent, color: colors.primary }]}>Built-in</Text>}
        />
        <SettingRow
          icon="users"
          label={`${PERSONALITIES.length} Personalities`}
          subtitle="Diverse customer types"
          right={<Text style={[styles.badge, { backgroundColor: colors.accent, color: colors.primary }]}>Built-in</Text>}
        />
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        Practice makes perfect. Every call makes you better.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  segBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 4 },
  screenTitle: { fontSize: 26, fontWeight: "800", marginBottom: 20 },
  section: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: 16, marginBottom: 8, paddingLeft: 4 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 0.5 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowSub: { fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 12, fontWeight: "600", overflow: "hidden" },
  footer: { textAlign: "center", fontSize: 13, marginTop: 24, marginBottom: 8, fontStyle: "italic" },
});
