// Voice spike UI: one big button, live status, captions, and the timing debug readout.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useVoiceCall, type VoicePhase } from "@/hooks/useVoiceCall";
import { formatMs } from "@/services/voice/latency";
import type { VoiceMode } from "@/services/storage";
import type { ChatMessage } from "@/services/proxyClient";

const PHASE_LABEL: Record<VoicePhase, string> = {
  idle: "Tap to start talking",
  connecting: "Connecting voice...",
  listening: "Listening — just talk",
  user_speaking: "You're speaking...",
  ai_thinking: "Customer is thinking...",
  ai_speaking: "Customer is speaking (talk to interrupt)",
  error: "Voice error",
};

interface Props {
  mode: Exclude<VoiceMode, "off">;
  systemPrompt: string;
  opener: string;
  getHistory: () => ChatMessage[];
  onTurn: (role: "user" | "assistant", text: string) => void;
  debug: boolean;
  /** Parent calls this before ending the call so the mic and socket are released. */
  registerStop?: (stop: () => Promise<void>) => void;
}

export function VoiceCallPanel(props: Props) {
  const colors = useColors();
  const v = useVoiceCall(props);
  const { registerStop } = props;
  React.useEffect(() => { registerStop?.(v.stop); }, [registerStop, v.stop]);

  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.badge, { color: colors.mutedForeground }]}>
        VOICE BETA · {props.mode === "live" ? "Gemini Live" : "Whisper + Gemini TTS"}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => (v.active ? v.stop() : v.start())}
        style={[styles.mic, { backgroundColor: v.active ? colors.destructive : colors.primary }]}
      >
        <Feather name={v.active ? "mic-off" : "mic"} size={28} color="#fff" />
      </Pressable>
      <Text style={[styles.phase, { color: colors.foreground }]}>{PHASE_LABEL[v.phase]}</Text>
      {v.partial ? (
        <Text style={[styles.partial, { color: colors.mutedForeground }]} numberOfLines={2}>
          {v.partial.role === "user" ? "You: " : "Customer: "}{v.partial.text}
        </Text>
      ) : null}
      {v.error ? <Text style={[styles.err, { color: colors.destructive }]}>{v.error}</Text> : null}
      {props.debug ? (
        <View style={[styles.debug, { borderColor: colors.border }]}>
          <Text style={[styles.debugText, { color: colors.mutedForeground }]}>
            Reply delay (you stop → AI voice): last {formatMs(v.stats.lastResponseMs)} · avg {formatMs(v.stats.avgResponseMs)} · turns {v.stats.turns}
          </Text>
          <Text style={[styles.debugText, { color: colors.mutedForeground }]}>
            Barge-in stop time: last {formatMs(v.stats.lastBargeInStopMs)} · count {v.stats.bargeIns}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { margin: 12, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 10 },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  mic: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  phase: { fontSize: 15, fontWeight: "600" },
  partial: { fontSize: 13, fontStyle: "italic", textAlign: "center" },
  err: { fontSize: 12, textAlign: "center" },
  debug: { alignSelf: "stretch", borderTopWidth: 1, paddingTop: 8, gap: 2 },
  debugText: { fontSize: 11, fontFamily: undefined },
});
