import React, { useState, useCallback, useRef } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useApp } from "@/contexts/AppContext";
import { speakText, stopSpeaking } from "@/services/speechService";
import {
  MOCK_SCRIPTS,
  SCRIPT_TYPE_LABELS,
  SCRIPT_TYPE_COLORS,
  type MockScript,
  type ScriptLevel,
  type ScriptTurn,
} from "@/constants/mockCallScripts";

const LEVELS: { id: ScriptLevel; label: string; color: string; desc: string }[] = [
  { id: "beginner", label: "Beginner", color: "#22c55e", desc: "Friendly customers, smooth closes. Build confidence here." },
  { id: "intermediate", label: "Intermediate", color: "#f59e0b", desc: "Realistic objections and negotiations. The daily reality." },
  { id: "advanced", label: "Advanced", color: "#ef4444", desc: "Tough clients, multiple objections, enterprise deals." },
];

// ── Script card (list view) ─────────────────────────────────────────────────
function ScriptCard({
  script,
  isFavorite,
  onPress,
  onToggleFavorite,
}: {
  script: MockScript;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const colors = useColors();
  const typeColor = SCRIPT_TYPE_COLORS[script.type];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
            {SCRIPT_TYPE_LABELS[script.type]}
          </Text>
        </View>
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={10}
          style={styles.heartBtn}
        >
          <Feather
            name="heart"
            size={17}
            color={isFavorite ? "#ef4444" : colors.mutedForeground}
            style={isFavorite ? { fill: "#ef4444" } as any : undefined}
          />
        </Pressable>
      </View>

      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{script.title}</Text>
      <Text style={[styles.cardScenario, { color: colors.mutedForeground }]}>{script.scenario}</Text>

      <View style={styles.cardMeta}>
        <View style={[styles.turnsBadge, { backgroundColor: colors.secondary }]}>
          <Feather name="message-circle" size={11} color={colors.mutedForeground} />
          <Text style={[styles.turnsText, { color: colors.mutedForeground }]}>
            {script.turns.length} turns
          </Text>
        </View>
        <Text style={[styles.outcomeText, { color: colors.mutedForeground }]} numberOfLines={1}>
          → {script.outcome}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Script turn row (detail view) ──────────────────────────────────────────
function TurnRow({
  turn,
  isPlayingId,
  onPlay,
  onSpeak,
}: {
  turn: ScriptTurn;
  isPlayingId: string | null;
  onPlay: (turn: ScriptTurn) => void;
  onSpeak: (turn: ScriptTurn) => void;
}) {
  const colors = useColors();
  const isCustomer = turn.role === "customer";
  const isPlaying = isPlayingId === turn.id;

  return (
    <View style={styles.turnContainer}>
      {/* Role label */}
      <View style={[styles.roleRow, isCustomer ? styles.customerSide : styles.agentSide]}>
        <View style={[styles.roleBadge, { backgroundColor: isCustomer ? colors.secondary : colors.primary + "20" }]}>
          <Feather
            name={isCustomer ? "user" : "briefcase"}
            size={11}
            color={isCustomer ? colors.mutedForeground : colors.primary}
          />
          <Text style={[styles.roleLabel, { color: isCustomer ? colors.mutedForeground : colors.primary }]}>
            {isCustomer ? "Customer" : "You (Agent)"}
          </Text>
        </View>

        {/* Play button for customer, Speak button for agent */}
        {isCustomer ? (
          <Pressable
            style={[styles.audioBtn, { backgroundColor: isPlaying ? colors.primary : colors.secondary }]}
            onPress={() => onPlay(turn)}
          >
            <Feather
              name={isPlaying ? "square" : "play"}
              size={13}
              color={isPlaying ? "#fff" : colors.primary}
            />
            <Text style={[styles.audioBtnText, { color: isPlaying ? "#fff" : colors.primary }]}>
              {isPlaying ? "Stop" : "Listen"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.audioBtn, { backgroundColor: isPlaying ? "#22c55e" : "#22c55e20" }]}
            onPress={() => onSpeak(turn)}
          >
            <Feather name="mic" size={13} color={isPlaying ? "#fff" : "#22c55e"} />
            <Text style={[styles.audioBtnText, { color: isPlaying ? "#fff" : "#22c55e" }]}>
              Practice
            </Text>
          </Pressable>
        )}
      </View>

      {/* Bubble */}
      <View
        style={[
          styles.bubble,
          isCustomer
            ? { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, alignSelf: "flex-start" }
            : { backgroundColor: colors.primary + "18", borderColor: colors.primary + "30", borderWidth: 1, alignSelf: "flex-end" },
        ]}
      >
        <Text
          selectable
          style={[styles.bubbleText, { color: colors.foreground }]}
        >
          {turn.text}
        </Text>
      </View>

      {/* Coaching note */}
      {turn.note && !isCustomer && (
        <View style={[styles.noteBox, { backgroundColor: "#f59e0b10", borderColor: "#f59e0b30" }]}>
          <Feather name="zap" size={12} color="#f59e0b" style={{ marginTop: 1 }} />
          <Text style={styles.noteText}>{turn.note}</Text>
        </View>
      )}
    </View>
  );
}

// ── Script detail modal ─────────────────────────────────────────────────────
function ScriptModal({
  script,
  visible,
  onClose,
}: {
  script: MockScript | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [listenTurnId, setListenTurnId] = useState<string | null>(null);
  const [heardText, setHeardText] = useState<Record<string, string>>({});

  const handlePlay = useCallback(async (turn: ScriptTurn) => {
    if (playingId === turn.id) {
      await stopSpeaking();
      setPlayingId(null);
      return;
    }
    setPlayingId(turn.id);
    await speakText(turn.text, {
      voiceType: "customer",
      onDone: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
  }, [playingId]);

  const handleSpeak = useCallback(async (turn: ScriptTurn) => {
    if (listenTurnId === turn.id) {
      if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
      setListenTurnId(null);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Read the agent line aloud first (shadowing technique)
    setPlayingId(turn.id);
    await speakText(turn.text, {
      voiceType: "agent",
      onDone: () => {
        setPlayingId(null);
        // Then activate STT if on web
        if (Platform.OS === "web" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
          const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SR();
          recognition.continuous = false;
          recognition.lang = "en-US";
          recognition.onresult = (event: any) => {
            const transcript = event.results[0]?.[0]?.transcript || "";
            if (transcript) setHeardText(prev => ({ ...prev, [turn.id]: transcript }));
            setListenTurnId(null);
            recognitionRef.current = null;
          };
          recognition.onerror = () => { setListenTurnId(null); recognitionRef.current = null; };
          recognition.onend = () => { setListenTurnId(null); recognitionRef.current = null; };
          recognitionRef.current = recognition;
          recognition.start();
          setListenTurnId(turn.id);
        }
      },
      onError: () => setPlayingId(null),
    });
  }, [listenTurnId]);

  if (!script) return null;
  const typeColor = SCRIPT_TYPE_COLORS[script.type];
  const levelInfo = LEVELS.find(l => l.id === script.level)!;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { paddingTop: insets.top + 12, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={onClose} style={styles.closeIconBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.modalHeaderCenter}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>{script.title}</Text>
            <View style={styles.modalBadges}>
              <View style={[styles.levelBadge, { backgroundColor: levelInfo.color + "20" }]}>
                <Text style={[styles.levelBadgeText, { color: levelInfo.color }]}>{levelInfo.label}</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
                <Text style={[styles.typeBadgeText, { color: typeColor }]}>{SCRIPT_TYPE_LABELS[script.type]}</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Outcome banner */}
        <View style={[styles.outcomeBanner, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
          <Feather name="target" size={13} color={colors.primary} />
          <Text style={[styles.outcomeLabel, { color: colors.primary }]}>Goal: </Text>
          <Text style={[styles.outcomeBannerText, { color: colors.foreground }]} numberOfLines={2}>{script.outcome}</Text>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionBar, { backgroundColor: colors.muted }]}>
          <View style={styles.instructionItem}>
            <Feather name="play" size={11} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.mutedForeground }]}>Listen — hear the customer</Text>
          </View>
          <View style={styles.instructionSep} />
          <View style={styles.instructionItem}>
            <Feather name="mic" size={11} color="#22c55e" />
            <Text style={[styles.instructionText, { color: colors.mutedForeground }]}>Practice — read aloud then speak</Text>
          </View>
        </View>

        {/* Turns */}
        <FlatList
          data={script.turns}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <View>
              <TurnRow
                turn={item}
                isPlayingId={playingId ?? listenTurnId}
                onPlay={handlePlay}
                onSpeak={handleSpeak}
              />
              {heardText[item.id] && (
                <View style={[styles.heardBox, { backgroundColor: "#22c55e10", borderColor: "#22c55e30" }]}>
                  <Feather name="check-circle" size={13} color="#22c55e" />
                  <Text style={[styles.heardText, { color: colors.foreground }]}>
                    You said: "{heardText[item.id]}"
                  </Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={[styles.turnsList, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

// ── Main Scripts Screen ─────────────────────────────────────────────────────
export default function ScriptsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { favoriteScriptIds, toggleFavoriteScript } = useApp();
  const [selectedLevel, setSelectedLevel] = useState<ScriptLevel>("beginner");
  const [selectedScript, setSelectedScript] = useState<MockScript | null>(null);

  const levelScripts = MOCK_SCRIPTS.filter(s => s.level === selectedLevel);
  const activeLevel = LEVELS.find(l => l.id === selectedLevel)!;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Mock Call Scripts</Text>
        <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
          Read, listen, and practice full conversations
        </Text>

        {/* Level tabs */}
        <View style={[styles.levelTabs, { backgroundColor: colors.secondary, borderRadius: 14 }]}>
          {LEVELS.map(level => (
            <Pressable
              key={level.id}
              style={[
                styles.levelTab,
                selectedLevel === level.id && { backgroundColor: level.color, borderRadius: 11 },
              ]}
              onPress={() => setSelectedLevel(level.id)}
            >
              <Text style={[
                styles.levelTabText,
                { color: selectedLevel === level.id ? "#fff" : colors.mutedForeground },
              ]}>
                {level.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Level description */}
      <View style={[styles.levelDesc, { backgroundColor: activeLevel.color + "12", borderBottomColor: activeLevel.color + "25" }]}>
        <Feather name="info" size={13} color={activeLevel.color} />
        <Text style={[styles.levelDescText, { color: activeLevel.color }]}>{activeLevel.desc}</Text>
        <Text style={[styles.levelCount, { color: activeLevel.color }]}>{levelScripts.length} scripts</Text>
      </View>

      {/* Script list */}
      <FlatList
        data={levelScripts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ScriptCard
            script={item}
            isFavorite={favoriteScriptIds.includes(item.id)}
            onPress={() => setSelectedScript(item)}
            onToggleFavorite={() => {
              toggleFavoriteScript(item.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail modal */}
      <ScriptModal
        script={selectedScript}
        visible={!!selectedScript}
        onClose={() => {
          setSelectedScript(null);
          stopSpeaking();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  screenTitle: { fontSize: 26, fontWeight: "800" },
  screenSub: { fontSize: 13, marginTop: 2, marginBottom: 14 },
  levelTabs: { flexDirection: "row", padding: 3, gap: 2 },
  levelTab: { flex: 1, paddingVertical: 9, alignItems: "center" },
  levelTabText: { fontSize: 13, fontWeight: "700" },
  levelDesc: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  levelDescText: { flex: 1, fontSize: 13, fontWeight: "500" },
  levelCount: { fontSize: 12, fontWeight: "700" },
  list: { padding: 16, gap: 12 },
  // Card
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  heartBtn: { padding: 4 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardScenario: { fontSize: 12 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  turnsBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  turnsText: { fontSize: 11 },
  outcomeText: { flex: 1, fontSize: 12, fontStyle: "italic" },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  closeIconBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  modalHeaderCenter: { flex: 1, alignItems: "center", gap: 6 },
  modalTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  modalBadges: { flexDirection: "row", gap: 6 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  levelBadgeText: { fontSize: 10, fontWeight: "700" },
  outcomeBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  outcomeLabel: { fontSize: 12, fontWeight: "700" },
  outcomeBannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  instructionBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 0 },
  instructionItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  instructionSep: { width: 1, height: 12, backgroundColor: "#ccc", marginHorizontal: 8 },
  instructionText: { fontSize: 11 },
  turnsList: { padding: 16, gap: 0 },
  // Turn row
  turnContainer: { marginBottom: 16, gap: 6 },
  roleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customerSide: {},
  agentSide: { flexDirection: "row-reverse" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleLabel: { fontSize: 11, fontWeight: "600" },
  audioBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  audioBtnText: { fontSize: 12, fontWeight: "600" },
  bubble: { maxWidth: "85%", padding: 12, borderRadius: 14 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginLeft: 8, marginRight: 8 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18, color: "#b45309", fontStyle: "italic" },
  heardBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, margin: 4, marginBottom: 8 },
  heardText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
