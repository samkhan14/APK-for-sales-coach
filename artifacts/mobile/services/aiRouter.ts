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
  difficulty: "easy" | "medium" | "hard"
): Promise<string> {
  const difficultyInstructions = {
    easy: "Be moderately open to the conversation. Give the caller reasonable chances to recover from mistakes.",
    medium: "Be realistically skeptical. Push back on weak claims. Only engage deeply if they demonstrate genuine understanding.",
    hard: "Be very tough. Challenge everything. Short, dismissive responses unless they say something genuinely impressive. High bar to convert."
  };

  return `${scenario.systemPrompt}

PERSONALITY OVERLAY: ${personality.name} — ${personality.description}
Tone: ${personality.tone}
Response style: ${personality.responseStyle}
Key traits: ${personality.traits.join(", ")}

DIFFICULTY: ${difficulty} — ${difficultyInstructions[difficulty]}

CRITICAL RULES:
- You are a CUSTOMER being called, not an AI assistant. Never break character.
- Keep responses SHORT — 1-3 sentences max, like a real phone call.
- Sound human: use natural speech patterns, pauses, contractions.
- React emotionally when appropriate: frustration, curiosity, skepticism, mild interest.
- Do NOT use bullet points, lists, or formal language.
- Do NOT offer solutions or be helpful — you are a potential buyer being pitched to.
- React to what the caller actually says. If they make a good point, acknowledge it briefly.
- Occasionally mention real business context (your team, your budget cycles, your current tools).
- If they're impressive, you can show mild interest — "That's... actually interesting. Tell me more."
- If they're weak, shut down quickly: "Look, I'm really busy, is there a point here?"`;
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
