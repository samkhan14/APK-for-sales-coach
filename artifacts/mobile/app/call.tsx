import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useCall, type Message } from "@/contexts/CallContext";
import { useApp } from "@/contexts/AppContext";
import { WaveformAnimation } from "@/components/WaveformAnimation";
import { OfflineBanner } from "@/components/OfflineBanner";
import { FeedbackCard } from "@/components/FeedbackCard";
import { CallScriptPanel } from "@/components/CallScriptPanel";
import type { CallFeedback } from "@/services/aiRouter";
import { SCORING_FAILED_MESSAGE } from "@/services/scoring";

function useVoiceRecording(onResult: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    if (
      Platform.OS === "web" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    ) {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        if (transcript) onResult(transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } else {
      setIsRecording(true);
    }
  }, [onResult]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording };
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function MessageBubble({ msg }: { msg: Message }) {
  const colors = useColors();
  const isUser = msg.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.aiRow]}>
      {!isUser && (
        <View style={[styles.avatarSmall, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="user" size={12} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary, maxWidth: "75%" }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, maxWidth: "80%" },
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? "#fff" : colors.foreground }]}>
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

// Guided suggestion chip strip shown after AI speaks
function SuggestionStrip({
  suggestions,
  onSelect,
  onDismiss,
}: {
  suggestions: string[];
  onSelect: (text: string) => void;
  onDismiss: () => void;
}) {
  const colors = useColors();
  if (suggestions.length === 0) return null;

  return (
    <View style={[styles.suggestionContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <View style={styles.suggestionHeader}>
        <Feather name="zap" size={12} color={colors.primary} />
        <Text style={[styles.suggestionLabel, { color: colors.primary }]}>Suggested responses</Text>
        <Pressable onPress={onDismiss} hitSlop={10}>
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionScroll}
      >
        {suggestions.map((s, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [
              styles.suggestionChip,
              {
                backgroundColor: pressed ? colors.primary : colors.card,
                borderColor: colors.primary + "50",
              },
            ]}
            onPress={() => onSelect(s)}
          >
            {({ pressed }) => (
              <Text
                style={[styles.suggestionText, { color: pressed ? "#fff" : colors.foreground }]}
                numberOfLines={2}
              >
                {s}
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

type CallPhase = "call" | "feedback";

export default function CallScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    status, messages, currentScenario, currentPersonality,
    duration, currentProvider, feedback, isGeneratingFeedback,
    suggestedResponses,
    sendUserMessage, endCall, retryScoring, scoringFailed, resetCall, setStatus, clearSuggestions,
  } = useCall();
  const { addCallRecord } = useApp();
  const [phase, setPhase] = useState<CallPhase>("call");
  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [showScript, setShowScript] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleVoiceResult = useCallback(
    async (text: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      clearSuggestions();
      setStatus("user_speaking");
      await sendUserMessage(text);
    },
    [sendUserMessage, setStatus, clearSuggestions]
  );

  const { isRecording, startRecording, stopRecording } = useVoiceRecording(handleVoiceResult);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  async function handleEndCall() {
    Alert.alert("End Call", "End this practice call and get feedback?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Call",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const fb = await endCall();
          await handleScored(fb);
        },
      },
    ]);
  }

  // Saves a call record ONLY when real, validated feedback exists. A failed scoring saves nothing.
  async function handleScored(fb: CallFeedback | null) {
    if (fb) {
      setLocalFeedback(fb);
      const record = {
        id: Date.now().toString(),
        scenarioId: currentScenario?.id || "",
        scenarioTitle: currentScenario?.title || "Practice Call",
        personalityName: currentPersonality?.name || "Customer",
        date: new Date().toISOString(),
        duration,
        overallScore: fb.overallScore,
        confidenceScore: fb.confidenceScore,
        fluencyScore: fb.fluencyScore,
        effectivenessScore: fb.effectivenessScore,
        summary: fb.summary,
        transcript: messages.map(m => ({ role: m.role, content: m.content })),
      };
      await addCallRecord(record);
      setPhase("feedback");
    } else if (messages.length < 2 || !currentScenario) {
      // Nothing to score (too short). When scoring failed, the "Scoring failed" screen is shown instead.
      resetCall();
      router.back();
    }
  }

  function handleDone() {
    resetCall();
    router.replace("/(tabs)");
  }

  // — Scoring failed: explicit state, no score shown or saved —
  if (scoringFailed && !isGeneratingFeedback) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingTitle, { color: colors.foreground }]}>{SCORING_FAILED_MESSAGE}</Text>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          The AI coach could not score this call. No score was saved.
        </Text>
        <Pressable
          onPress={async () => handleScored(await retryScoring())}
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Try again</Text>
        </Pressable>
        <Pressable onPress={handleDone} style={{ marginTop: 12, padding: 12 }}>
          <Text style={{ color: colors.mutedForeground }}>Discard call</Text>
        </Pressable>
      </View>
    );
  }

  // — Generating feedback —
  if (isGeneratingFeedback) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Analysing your call...</Text>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Scoring confidence, fluency & effectiveness
        </Text>
      </View>
    );
  }

  // — Feedback screen —
  if (phase === "feedback" && localFeedback) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.feedbackHeader,
            { paddingTop: insets.top + 16, backgroundColor: colors.background, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>Call Review</Text>
          <Pressable style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleDone}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
        <View style={styles.feedbackContent}>
          <FeedbackCard feedback={localFeedback} duration={duration} />
        </View>
      </View>
    );
  }

  const isAIBusy = status === "ai_thinking" || status === "ai_speaking";
  const canInteract = status === "active";
  const showSuggestions = canInteract && suggestedResponses.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.callHeader,
          { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.callInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="user" size={24} color={colors.primary} />
            {isAIBusy && (
              <View style={[styles.speakingDot, { backgroundColor: colors.callGreen }]} />
            )}
          </View>
          <View>
            <Text style={[styles.customerName, { color: colors.foreground }]}>
              {currentPersonality?.name || "Customer"}
            </Text>
            <Text style={[styles.scenarioName, { color: colors.mutedForeground }]}>
              {currentScenario?.title || "Practice Call"}
            </Text>
          </View>
        </View>
        <View style={styles.callMeta}>
          <View style={[styles.timerBadge, { backgroundColor: colors.callGreen + "20" }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.callGreen }]} />
            <Text style={[styles.timerText, { color: colors.callGreen }]}>{formatTime(duration)}</Text>
          </View>
          {currentProvider && currentProvider !== "local" && (
            <Text style={[styles.providerText, { color: colors.mutedForeground }]}>{currentProvider}</Text>
          )}
        </View>
      </View>

      <OfflineBanner />

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: colors.muted }]}>
        <WaveformAnimation isActive={isAIBusy} barCount={5} color={isAIBusy ? colors.primary : colors.mutedForeground} />
        <Text style={[styles.statusText, { color: isAIBusy ? colors.primary : colors.mutedForeground }]}>
          {status === "connecting" && "Connecting..."}
          {status === "ai_thinking" && "Customer is thinking..."}
          {status === "ai_speaking" && "Customer is speaking"}
          {status === "active" && (showSuggestions ? "Tap a suggestion or press mic" : "Your turn — press and hold mic")}
          {status === "user_speaking" && "Processing..."}
          {status === "idle" && "Starting..."}
        </Text>
        <WaveformAnimation isActive={isRecording} barCount={5} color={isRecording ? colors.callGreen : colors.mutedForeground} />
      </View>

      {/* Transcript */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={styles.transcript}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyTranscript}>
            <Text style={[styles.emptyTranscriptText, { color: colors.mutedForeground }]}>
              Waiting for the customer to answer...
            </Text>
          </View>
        }
      />

      {/* Suggested responses strip */}
      {showSuggestions && (
        <SuggestionStrip
          suggestions={suggestedResponses}
          onSelect={async (text) => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            clearSuggestions();
            await sendUserMessage(text);
          }}
          onDismiss={clearSuggestions}
        />
      )}

      {/* Controls */}
      <View
        style={[
          styles.controls,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* End call */}
        <Pressable
          style={({ pressed }) => [styles.controlBtn, { backgroundColor: colors.callRed + "20", opacity: pressed ? 0.8 : 1 }]}
          onPress={handleEndCall}
        >
          <Feather name="phone-off" size={20} color={colors.callRed} />
        </Pressable>

        {/* Mic — hold to speak */}
        <Pressable
          style={({ pressed }) => [
            styles.micBtn,
            {
              backgroundColor: isRecording
                ? colors.callGreen
                : canInteract
                ? colors.primary
                : colors.secondary,
              opacity: pressed ? 0.85 : canInteract || isRecording ? 1 : 0.5,
              transform: [{ scale: isRecording ? 1.08 : 1 }],
            },
          ]}
          onPressIn={() => { if (canInteract) startRecording(); }}
          onPressOut={() => { if (isRecording) stopRecording(); }}
          disabled={!canInteract && !isRecording}
        >
          <Feather name={isRecording ? "mic" : "mic-off"} size={28} color="#fff" />
        </Pressable>

        {/* Script helper */}
        <Pressable
          style={({ pressed }) => [styles.controlBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => setShowScript(true)}
        >
          <Feather name="book-open" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <CallScriptPanel visible={showScript} onClose={() => setShowScript(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 12 },
  callHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  callInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  speakingDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#fff",
  },
  customerName: { fontSize: 16, fontWeight: "700" },
  scenarioName: { fontSize: 12, marginTop: 1 },
  callMeta: { alignItems: "flex-end", gap: 4 },
  timerBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  timerText: { fontSize: 13, fontWeight: "700" },
  providerText: { fontSize: 10 },
  statusBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 10,
  },
  statusText: { fontSize: 13, fontWeight: "500", flex: 1, textAlign: "center" },
  transcript: { padding: 16, gap: 10, flexGrow: 1 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userRow: { justifyContent: "flex-end" },
  aiRow: { justifyContent: "flex-start" },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { padding: 12, borderRadius: 16 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  emptyTranscript: { padding: 40, alignItems: "center" },
  emptyTranscriptText: { fontSize: 14, textAlign: "center" },
  suggestionContainer: {
    borderTopWidth: 0.5, paddingTop: 10, paddingBottom: 8,
  },
  suggestionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, marginBottom: 8,
  },
  suggestionLabel: { fontSize: 12, fontWeight: "700", flex: 1 },
  suggestionScroll: { paddingHorizontal: 12, gap: 8 },
  suggestionChip: {
    maxWidth: 220, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  suggestionText: { fontSize: 13, lineHeight: 18 },
  controls: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 20, padding: 16, borderTopWidth: 0.5,
  },
  controlBtn: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  micBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  loadingTitle: { fontSize: 18, fontWeight: "700" },
  loadingText: { fontSize: 14 },
  feedbackHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  feedbackTitle: { fontSize: 20, fontWeight: "800" },
  doneBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  feedbackContent: { flex: 1, padding: 16 },
});
