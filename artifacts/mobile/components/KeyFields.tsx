// One row per provider: masked current key, input, "Get a key" link, Test, Save, Clear.
// A key is only saved when the user taps Save after a successful Test.
import React, { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useKeys } from "@/contexts/KeysContext";
import { KEY_PROVIDERS, PROVIDER_INFO, checkKeyFormat, clearKey, maskKey, normalizeKey, saveKey, type KeyProvider } from "@/services/keys/keyStore";
import { testKey } from "@/services/directClient";

function KeyRow({ p, allowClear }: { p: KeyProvider; allowClear: boolean }) {
  const colors = useColors();
  const { keys } = useKeys();
  const info = PROVIDER_INFO[p];
  const saved = keys[p];
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; testedKey: string } | null>(null);
  const [editing, setEditing] = useState(!saved);

  const k = normalizeKey(draft);
  const testedOk = !!result?.ok && result.testedKey === k;

  const onTest = async () => {
    const fmt = checkKeyFormat(p, k);
    if (fmt) { setResult({ ok: false, message: fmt, testedKey: k }); return; }
    setBusy(true);
    const r = await testKey(p, k);
    setBusy(false);
    setResult({ ...r, testedKey: k });
  };
  const onSave = async () => {
    try { await saveKey(p, k); setDraft(""); setResult(null); setEditing(false); }
    catch (e) { setResult({ ok: false, message: (e as Error).message, testedKey: k }); }
  };

  const btn = (label: string, onPress: () => void, enabled = true, primary = false) => (
    <Pressable
      onPress={enabled ? onPress : undefined}
      style={[styles.btn, { backgroundColor: primary && enabled ? colors.primary : colors.background, borderColor: colors.border, opacity: enabled ? 1 : 0.5 }]}
    >
      <Text style={{ color: primary && enabled ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.head}>
        <Text style={[styles.label, { color: colors.foreground }]}>{info.label} <Text style={{ color: "#ef4444" }}>*</Text></Text>
        <Pressable onPress={() => Linking.openURL(info.createUrl)} accessibilityRole="link">
          <Text style={[styles.link, { color: colors.primary }]}>Get a key ↗</Text>
        </Pressable>
      </View>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>{info.hint}</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>Saved: {maskKey(saved)}</Text>
      {editing ? (
        <>
          <TextInput
            value={draft}
            onChangeText={t => { setDraft(t); setResult(null); }}
            placeholder={`Paste your ${info.label} key`}
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
          />
          <View style={styles.btns}>
            {busy ? <ActivityIndicator color={colors.primary} /> : btn("Test", onTest, !!k)}
            {btn("Save", onSave, testedOk, true)}
            {saved ? btn("Cancel", () => { setEditing(false); setDraft(""); setResult(null); }) : null}
          </View>
          {result && (
            <Text style={[styles.sub, { color: result.ok ? "#22c55e" : "#ef4444" }]}>
              {result.ok ? "OK: " : "Failed: "}{result.message}{result.ok ? " Tap Save to keep it." : ""}
            </Text>
          )}
        </>
      ) : (
        <View style={styles.btns}>
          {btn("Replace", () => setEditing(true))}
          {allowClear && saved ? btn("Clear", () => { void clearKey(p); setEditing(true); }) : null}
        </View>
      )}
    </View>
  );
}

export function KeyFields({ allowClear = true }: { allowClear?: boolean }) {
  return <>{KEY_PROVIDERS.map(p => <KeyRow key={p} p={p} allowClear={allowClear} />)}</>;
}

const styles = StyleSheet.create({
  row: { padding: 14, borderBottomWidth: 0.5, gap: 4 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 15, fontWeight: "600" },
  link: { fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  sub: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6, fontSize: 14 },
  btns: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  btn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
});
