// Shown on first launch and whenever any key is missing. The app cannot be used until all 3 keys are saved.
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useKeys } from "@/contexts/KeysContext";
import { KeyFields } from "@/components/KeyFields";
import { PROVIDER_INFO } from "@/services/keys/keyStore";

export function KeySetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gate } = useKeys();
  const missing = gate.status === "setup" ? gate.missing : [];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.foreground }]}>Add your API keys</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>
        This app uses your own free keys. All 3 are required. Tap "Get a key", create it, paste it here, tap Test, then Save.
        Keys stay on this phone only (secure storage) and go straight to Google, Groq and OpenRouter.
      </Text>
      {missing.length > 0 && (
        <Text style={[styles.body, { color: "#ef4444" }]}>Still needed: {missing.map(p => PROVIDER_INFO[p].label).join(", ")}</Text>
      )}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <KeyFields allowClear={false} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  body: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
});
