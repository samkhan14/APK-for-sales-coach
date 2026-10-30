import { buildPrompt, type CallerMode } from "./callSetup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomerPersonality, SalesScenario } from "@/constants/database";
import { proxyChat, isProxyConfigured, type ChatMessage } from "./proxyClient";
import { scoreCall, type CallFeedback, type ScoringResult } from "./scoring";

// The provider name reported by the proxy ("gemini", "groq", ...). No keys or model names live in the app.
export type AIProvider = string;

interface UsageStats {
  requests: number;
  failures: number;
  byProvider: Record<string, number>;
  lastReset: string;
  currentProvider: AIProvider | null;
  lastUpdated: string;
}

type ConversationMessage = ChatMessage;

const USAGE_KEY = "ai_usage_stats_v2";

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

function emptyStats(today: string): UsageStats {
  return { requests: 0, failures: 0, byProvider: {}, lastReset: today, currentProvider: null, lastUpdated: new Date().toISOString() };
}

export async function getUsageStats(): Promise<UsageStats> {
  const today = getTodayString();
  const raw = await AsyncStorage.getItem(USAGE_KEY);
  if (!raw) return emptyStats(today);
  try {
    const stats = JSON.parse(raw) as UsageStats;
    if (stats.lastReset !== today) return { ...emptyStats(today), currentProvider: stats.currentProvider };
    return stats;
  } catch {
    return emptyStats(today);
  }
}

async function recordUsage(provider: AIProvider | null): Promise<void> {
  const stats = await getUsageStats();
  if (provider) {
    stats.requests++;
    stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
    stats.currentProvider = provider;
  } else {
    stats.failures++;
  }
  stats.lastUpdated = new Date().toISOString();
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(stats));
}

export { isProxyConfigured };

export async function buildSystemPrompt(
  scenario: SalesScenario,
  personality: CustomerPersonality,
  difficulty: "easy" | "medium" | "hard",
  callerMode: CallerMode = "decision_maker"
): Promise<string> {
  return buildPrompt(scenario, personality, difficulty, callerMode);
}

/** Throws on failure. There is no canned fallback: a failed call is never shown as an AI answer. */
export async function getAIResponse(
  messages: ConversationMessage[],
  systemPrompt: string
): Promise<{ text: string; provider: AIProvider }> {
  try {
    const reply = await proxyChat(messages, { system: systemPrompt });
    await recordUsage(reply.provider);
    return reply;
  } catch (e) {
    await recordUsage(null);
    throw e;
  }
}

/** Returns { ok: false } on any failure; never returns a fabricated score. */
export async function generateCallFeedback(
  transcript: ConversationMessage[],
  scenario: SalesScenario
): Promise<ScoringResult> {
  const result = await scoreCall(transcript, scenario.title);
  await recordUsage(result.ok ? result.provider : null);
  return result;
}

export type { CallFeedback, ScoringResult };
