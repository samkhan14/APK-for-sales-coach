import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { buildSystemPrompt, getAIResponse, generateCallFeedback, type AIProvider, type CallFeedback } from "@/services/aiRouter";
import { speakText, stopSpeaking } from "@/services/speechService";
import { SCENARIOS, PERSONALITIES, type SalesScenario, type CustomerPersonality } from "@/constants/database";
import { getSuggestionsForMessage } from "@/constants/phraseLibrary";

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
  startCall: (scenarioId: string, difficulty: "easy" | "medium" | "hard") => Promise<void>;
  sendUserMessage: (text: string) => Promise<void>;
  endCall: () => Promise<CallFeedback | null>;
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

  const systemPromptRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const messageCountRef = useRef<number>(0);

  const clearSuggestions = useCallback(() => setSuggestedResponses([]), []);

  const startCall = useCallback(async (scenarioId: string, diff: "easy" | "medium" | "hard") => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0]!;
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]!;

    setCurrentScenario(scenario);
    setCurrentPersonality(personality);
    setDifficulty(diff);
    setMessages([]);
    setFeedback(null);
    setSuggestedResponses([]);
    setStatus("connecting");
    messageCountRef.current = 0;

    systemPromptRef.current = await buildSystemPrompt(scenario, personality, diff);

    setTimeout(() => {
      setStatus("ai_thinking");
    }, 1500);

    setTimeout(async () => {
      const openingMessages = [
        "Hello?",
        "Yeah?",
        "This is [Customer]. Who's this?",
        "Hello, who am I speaking with?",
        "Yeah, hello?",
      ];
      const opening = openingMessages[Math.floor(Math.random() * openingMessages.length)]!;

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
          startTimeRef.current = Date.now();
          timerRef.current = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }, 1000);
        },
      });
    }, 2500);
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
      setStatus("active");
    }
  }, [status, messages]);

  const endCall = useCallback(async (): Promise<CallFeedback | null> => {
    if (timerRef.current) clearInterval(timerRef.current);
    await stopSpeaking();
    setSuggestedResponses([]);
    setStatus("ended");

    if (messages.length < 2 || !currentScenario) return null;

    setIsGeneratingFeedback(true);
    try {
      const fb = await generateCallFeedback(
        messages.map(m => ({ role: m.role, content: m.content })),
        currentScenario
      );
      setFeedback(fb);
      return fb;
    } finally {
      setIsGeneratingFeedback(false);
    }
  }, [messages, currentScenario]);

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
    messageCountRef.current = 0;
  }, []);

  return (
    <CallContext.Provider value={{
      status, messages, currentScenario, currentPersonality, difficulty,
      duration, currentProvider, feedback, isGeneratingFeedback,
      suggestedResponses,
      startCall, sendUserMessage, endCall, resetCall, setStatus, clearSuggestions,
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
