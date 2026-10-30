import { Alert } from "react-native";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { buildSystemPrompt, getAIResponse, generateCallFeedback, type AIProvider, type CallFeedback } from "@/services/aiRouter";
import { speakText, stopSpeaking } from "@/services/speechService";
import { SCENARIOS, PERSONALITIES, type SalesScenario, type CustomerPersonality } from "@/constants/database";
import { getSuggestionsForMessage } from "@/constants/phraseLibrary";
import { buildOpening, type CallerMode } from "@/services/callSetup";

export type CallStatus = "idle" | "connecting" | "active" | "ai_thinking" | "ai_speaking" | "user_speaking" | "ended";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface CallState {
  status: CallStatus;
  messages: Message[];
  currentScenario: SalesScenario | null;
  currentPersonality: CustomerPersonality | null;
  difficulty: "easy" | "medium" | "hard";
  duration: number;
  currentProvider: AIProvider | null;
  feedback: CallFeedback | null;
  isGeneratingFeedback: boolean;
  suggestedResponses: string[];
  callerMode: CallerMode;
  /** true when the call runs through the voice spike (Gemini Live / chained) instead of expo-speech. */
  voiceCall: boolean;
  systemPrompt: string;
  startCall: (scenarioId: string, difficulty: "easy" | "medium" | "hard", opts?: { callerMode?: CallerMode; voice?: boolean }) => Promise<void>;
  /** Voice mode: add a finished turn (from live transcription) to the transcript used for scoring. */
  appendVoiceTurn: (role: "user" | "assistant", text: string) => void;
  sendUserMessage: (text: string) => Promise<void>;
  scoringFailed: boolean;
  endCall: () => Promise<CallFeedback | null>;
  retryScoring: () => Promise<CallFeedback | null>;
  resetCall: () => void;
  setStatus: (s: CallStatus) => void;
  clearSuggestions: () => void;
}

const CallContext = createContext<CallState | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentScenario, setCurrentScenario] = useState<SalesScenario | null>(null);
  const [currentPersonality, setCurrentPersonality] = useState<CustomerPersonality | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [duration, setDuration] = useState(0);
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(null);
  const [feedback, setFeedback] = useState<CallFeedback | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [scoringFailed, setScoringFailed] = useState(false);

  const [callerMode, setCallerMode] = useState<CallerMode>("decision_maker");
  const [voiceCall, setVoiceCall] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const systemPromptRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const messageCountRef = useRef<number>(0);

  const clearSuggestions = useCallback(() => setSuggestedResponses([]), []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const startCall = useCallback(async (
    scenarioId: string,
    diff: "easy" | "medium" | "hard",
    opts: { callerMode?: CallerMode; voice?: boolean } = {},
  ) => {
    const mode = opts.callerMode ?? "decision_maker";
    const voice = !!opts.voice;
    const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0]!;
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]!;

    setCurrentScenario(scenario);
    setCurrentPersonality(personality);
    setDifficulty(diff);
    setCallerMode(mode);
    setVoiceCall(voice);
    setDuration(0);
    setMessages([]);
    setFeedback(null);
    setSuggestedResponses([]);
    setStatus("connecting");
    messageCountRef.current = 0;

    systemPromptRef.current = await buildSystemPrompt(scenario, personality, diff, mode);
    setSystemPrompt(systemPromptRef.current);

    // I18: opener comes from the scenario persona (never a "[Customer]" placeholder).
    const opening = buildOpening(scenario, mode, diff);

    if (voice) {
      // Voice spike: the voice session speaks the opener itself; no expo-speech robot voice.
      setMessages([{ id: Date.now().toString(), role: "assistant", content: opening, timestamp: Date.now() }]);
      messageCountRef.current = 1;
      setStatus("active");
      startTimer();
      return;
    }

    setTimeout(() => {
      setStatus("ai_thinking");
    }, 1500);

    setTimeout(async () => {

      const firstMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: opening,
        timestamp: Date.now(),
      };
      setMessages([firstMsg]);
      setStatus("ai_speaking");
      messageCountRef.current = 1;

      await speakText(opening, {
        onDone: () => {
          // Show opener suggestions for the first message
          setSuggestedResponses(getSuggestionsForMessage(opening, true));
          setStatus("active");
          startTimer();
        },
        onError: () => {
          setStatus("active");
          startTimer();
        },
      });
    }, 2500);
  }, [startTimer]);

  const appendVoiceTurn = useCallback((role: "user" | "assistant", text: string) => {
    const t = text.trim();
    if (!t) return;
    messageCountRef.current += 1;
    setMessages(prev => [...prev, { id: `${Date.now()}_${prev.length}`, role, content: t, timestamp: Date.now() }]);
  }, []);

  const sendUserMessage = useCallback(async (text: string) => {
    if (status !== "active" && status !== "user_speaking") return;

    setSuggestedResponses([]);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setStatus("ai_thinking");

    const conversationMessages = [...messages, userMsg].map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    try {
      const { text: aiText, provider } = await getAIResponse(conversationMessages, systemPromptRef.current);
      setCurrentProvider(provider);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiText,
        timestamp: Date.now(),
      };

      messageCountRef.current += 2;
      setMessages(prev => [...prev, aiMsg]);
      setStatus("ai_speaking");

      await speakText(aiText, {
        onDone: () => {
          setSuggestedResponses(getSuggestionsForMessage(aiText, false));
          setStatus("active");
        },
        onError: () => {
          setSuggestedResponses(getSuggestionsForMessage(aiText, false));
          setStatus("active");
        },
      });
    } catch {
      // No canned fallback: tell the user the AI did not answer instead of faking a reply.
      Alert.alert("AI unavailable", "The customer AI did not respond. Check your connection and try again.");
      setStatus("active");
    }
  }, [status, messages]);

  // Returns feedback on success, null when scoring failed (scoringFailed=true) or there was nothing to score.
  const runScoring = useCallback(async (): Promise<CallFeedback | null> => {
    if (messages.length < 2 || !currentScenario) return null;
    setIsGeneratingFeedback(true);
    setScoringFailed(false);
    try {
      const result = await generateCallFeedback(
        messages.map(m => ({ role: m.role, content: m.content })),
        currentScenario
      );
      if (!result.ok) {
        setFeedback(null);
        setScoringFailed(true);
        return null;
      }
      setFeedback(result.feedback);
      return result.feedback;
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, [messages, currentScenario]);

  const endCall = useCallback(async (): Promise<CallFeedback | null> => {
    if (timerRef.current) clearInterval(timerRef.current);
    await stopSpeaking();
    setSuggestedResponses([]);
    setStatus("ended");
    return runScoring();
  }, [runScoring]);

  const resetCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    setStatus("idle");
    setMessages([]);
    setCurrentScenario(null);
    setCurrentPersonality(null);
    setDuration(0);
    setFeedback(null);
    setCurrentProvider(null);
    setSuggestedResponses([]);
    setScoringFailed(false);
    setVoiceCall(false);
    setSystemPrompt("");
    messageCountRef.current = 0;
  }, []);

  return (
    <CallContext.Provider value={{
      status, messages, currentScenario, currentPersonality, difficulty,
      duration, currentProvider, feedback, isGeneratingFeedback,
      suggestedResponses, scoringFailed, callerMode, voiceCall, systemPrompt, appendVoiceTurn,
      startCall, sendUserMessage, endCall, retryScoring: runScoring, resetCall, setStatus, clearSuggestions,
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be inside CallProvider");
  return ctx;
}
