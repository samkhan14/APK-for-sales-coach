import AsyncStorage from "@react-native-async-storage/async-storage";
import { OBJECTIONS, type CustomerPersonality, type SalesScenario } from "@/constants/database";

export type AIProvider = "gemini" | "groq" | "openrouter" | "local";

interface UsageStats {
  gemini: { requests: number; lastReset: string };
  groq: { requests: number; tokens: number; lastReset: string };
  openrouter: { requests: number; lastReset: string };
  currentProvider: AIProvider;
  lastUpdated: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const USAGE_KEY = "ai_usage_stats";
const GEMINI_DAILY_LIMIT = 1500;
const GROQ_DAILY_LIMIT = 14400;
const OPENROUTER_DAILY_LIMIT = 200;

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || "";
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || "";

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

export async function getUsageStats(): Promise<UsageStats> {
  const today = getTodayString();
  const raw = await AsyncStorage.getItem(USAGE_KEY);
  if (!raw) {
    return {
      gemini: { requests: 0, lastReset: today },
      groq: { requests: 0, tokens: 0, lastReset: today },
      openrouter: { requests: 0, lastReset: today },
      currentProvider: "gemini",
      lastUpdated: new Date().toISOString(),
    };
  }
  const stats: UsageStats = JSON.parse(raw);
  // Reset daily counters
  if (stats.gemini.lastReset !== today) stats.gemini = { requests: 0, lastReset: today };
  if (stats.groq.lastReset !== today) stats.groq = { requests: 0, tokens: 0, lastReset: today };
  if (stats.openrouter.lastReset !== today) stats.openrouter = { requests: 0, lastReset: today };
  return stats;
}

async function saveUsageStats(stats: UsageStats): Promise<void> {
  stats.lastUpdated = new Date().toISOString();
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(stats));
}

async function incrementUsage(provider: AIProvider, tokens?: number): Promise<void> {
  const stats = await getUsageStats();
  if (provider === "gemini") stats.gemini.requests++;
  else if (provider === "groq") { stats.groq.requests++; stats.groq.tokens += tokens || 0; }
  else if (provider === "openrouter") stats.openrouter.requests++;
  stats.currentProvider = provider;
  await saveUsageStats(stats);
}

async function callGemini(messages: ConversationMessage[], systemPrompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.9, maxOutputTokens: 200 }
    })
  });
  if (!resp.ok) throw new Error(`Gemini error: ${resp.status}`);
  const data = await resp.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

async function callGroq(messages: ConversationMessage[], systemPrompt: string): Promise<string> {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 200,
      temperature: 0.9
    })
  });
  if (!resp.ok) throw new Error(`Groq error: ${resp.status}`);
  const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number } };
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Empty Groq response");
  await incrementUsage("groq", data.usage?.total_tokens || 0);
  return text;
}

async function callOpenRouter(messages: ConversationMessage[], systemPrompt: string): Promise<string> {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://replit.com",
      "X-Title": "AI Sales Practice"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 200,
      temperature: 0.9
    })
  });
  if (!resp.ok) throw new Error(`OpenRouter error: ${resp.status}`);
  const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Empty OpenRouter response");
  return text;
}

function getLocalResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const matching = OBJECTIONS.find(obj =>
    lower.includes("expensive") && obj.category === "price" ||
    lower.includes("developer") && obj.category === "existing_solution" ||
    lower.includes("interested") && obj.category === "timing" ||
    lower.includes("email") && obj.category === "deflection" ||
    lower.includes("think") && obj.category === "stall"
  );
  if (matching) return matching.aiResponse;
  return "Look, I appreciate you calling, but I'm really tied up right now. Can you make it quick?";
}

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

export async function getAIResponse(
  messages: ConversationMessage[],
  systemPrompt: string
): Promise<{ text: string; provider: AIProvider }> {
  const stats = await getUsageStats();

  // Try Gemini first
  if (GEMINI_API_KEY && stats.gemini.requests < GEMINI_DAILY_LIMIT) {
    try {
      const text = await callGemini(messages, systemPrompt);
      await incrementUsage("gemini");
      return { text, provider: "gemini" };
    } catch {
      // Fall through
    }
  }

  // Try Groq
  if (GROQ_API_KEY && stats.groq.requests < GROQ_DAILY_LIMIT) {
    try {
      const text = await callGroq(messages, systemPrompt);
      return { text, provider: "groq" };
    } catch {
      // Fall through
    }
  }

  // Try OpenRouter
  if (OPENROUTER_API_KEY && stats.openrouter.requests < OPENROUTER_DAILY_LIMIT) {
    try {
      const text = await callOpenRouter(messages, systemPrompt);
      await incrementUsage("openrouter");
      return { text, provider: "openrouter" };
    } catch {
      // Fall through
    }
  }

  // Local fallback
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  return { text: getLocalResponse(lastUserMessage), provider: "local" };
}

export async function generateCallFeedback(
  transcript: ConversationMessage[],
  scenario: SalesScenario
): Promise<CallFeedback> {
  const systemPrompt = `You are an expert sales coach analyzing a cold call practice session. 
The user was pitching: ${scenario.title}.
Analyze the conversation and return ONLY valid JSON in exactly this format, no other text:
{
  "confidenceScore": <1-10>,
  "fluencyScore": <1-10>,
  "effectivenessScore": <1-10>,
  "overallScore": <1-10>,
  "strengths": ["strength1", "strength2"],
  "weakPoints": ["weakness1", "weakness2"],
  "suggestedResponses": ["better response to use next time"],
  "closingStatement": "A better closing line they could have used",
  "summary": "2-3 sentence overall assessment"
}`;

  const transcriptText = transcript.map(m => `${m.role === "user" ? "SALESPERSON" : "CUSTOMER"}: ${m.content}`).join("\n");
  const messages: ConversationMessage[] = [{ role: "user", content: `Analyze this call:\n\n${transcriptText}` }];

  try {
    const { text } = await getAIResponse(messages, systemPrompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CallFeedback;
    }
  } catch {
    // Fall through to default
  }

  return {
    confidenceScore: 6,
    fluencyScore: 6,
    effectivenessScore: 5,
    overallScore: 6,
    strengths: ["Initiated the conversation", "Stayed engaged throughout"],
    weakPoints: ["Could sharpen the opening pitch", "More specific value propositions needed"],
    suggestedResponses: ["Try asking a discovery question earlier in the call"],
    closingStatement: "I'd love 15 minutes to show you exactly how this applies to your business — when works for you this week?",
    summary: "Good effort on this practice session. Focus on asking better discovery questions to understand the customer's specific pain points before pitching solutions."
  };
}

export interface CallFeedback {
  confidenceScore: number;
  fluencyScore: number;
  effectivenessScore: number;
  overallScore: number;
  strengths: string[];
  weakPoints: string[];
  suggestedResponses: string[];
  closingStatement: string;
  summary: string;
}

export { GEMINI_DAILY_LIMIT, GROQ_DAILY_LIMIT, OPENROUTER_DAILY_LIMIT };
