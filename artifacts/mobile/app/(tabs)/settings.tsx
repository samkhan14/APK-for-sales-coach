import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { isProxyConfigured } from "@/services/aiRouter";
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
  const { theme, setTheme } = useApp();

  const isDark = colors.isDark;

  // Provider keys live on the proxy only; the app just needs the proxy URL + app token.
  const providerStatus = [
    { name: "AI Proxy", configured: isProxyConfigured() },
  ];

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

      {/* AI Providers */}
      <Text style={[styles.section, { color: colors.mutedForeground }]}>AI PROVIDERS</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {providerStatus.map((p, i) => (
          <SettingRow
            key={i}
            icon={p.configured ? "check-circle" : "x-circle"}
            label={p.name}
            subtitle={p.configured ? "Proxy configured" : "Proxy not configured"}
            right={
              <View style={[styles.statusDot, { backgroundColor: p.configured ? "#22c55e" : "#ef4444" }]} />
            }
          />
        ))}
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
          label="55+ Objections"
          subtitle="Local knowledge base"
          right={<Text style={[styles.badge, { backgroundColor: colors.accent, color: colors.primary }]}>Built-in</Text>}
        />
        <SettingRow
          icon="layers"
          label="8 Scenarios"
          subtitle="Web dev, SaaS, AI, CRM..."
          right={<Text style={[styles.badge, { backgroundColor: colors.accent, color: colors.primary }]}>Built-in</Text>}
        />
        <SettingRow
          icon="users"
          label="7 Personalities"
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
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 12, fontWeight: "600", overflow: "hidden" },
  footer: { textAlign: "center", fontSize: 13, marginTop: 24, marginBottom: 8, fontStyle: "italic" },
});
