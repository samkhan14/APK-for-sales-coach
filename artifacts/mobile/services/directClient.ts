// Direct AI client (bring-your-own-keys). The app talks straight to Google, Groq and OpenRouter with the
// user's own keys from secure storage. The old Cloudflare Worker proxy (services/proxyClient.ts) is kept in
// the repo but is no longer used by the app.
// Error messages never include keys or request URLs that carry keys.
import type { ChatMessage, ProxyReply } from "./proxyClient";
import { getKeys, type KeyProvider, type Keys } from "./keys/keyStore";
import {
  GEMINI_BASE, GEMINI_CHAT_MODELS, GROQ_BASE, GROQ_CHAT_MODEL, OPENROUTER_BASE, OPENROUTER_CHAT_MODEL,
} from "./models";

export type { ChatMessage };
export type AIReply = ProxyReply;

export class AIError extends Error {
  status?: number;
  constructor(message: string, status?: number) { super(message); this.name = "AIError"; this.status = status; }
}

export interface DirectConfig {
  keys?: Keys;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface ChatOpts { system?: string; json?: boolean }

async function timedFetch(cfg: DirectConfig, url: string, init: RequestInit, ms = 25000): Promise<Response> {
  const doFetch = cfg.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? ms);
  try {
    return await doFetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    throw new AIError((e as Error)?.name === "AbortError" ? "Request timed out" : "Network error");
  } finally {
    clearTimeout(timer);
  }
}

export async function geminiChat(key: string, messages: ChatMessage[], opts: ChatOpts, cfg: DirectConfig = {}): Promise<string> {
  const body: Record<string, unknown> = {
    contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content ?? "") }] })),
  };
  if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
  if (opts.json) body.generationConfig = { responseMimeType: "application/json" };
  let last: AIError = new AIError("Gemini failed");
  for (const model of GEMINI_CHAT_MODELS) {
    const r = await timedFetch(cfg, `${GEMINI_BASE}/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body),
    });
    if (!r.ok) { last = new AIError(`Gemini error ${r.status}`, r.status); continue; }
    const d = (await r.json().catch(() => null)) as any;
    const text = (d?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p?.text ?? "").join("").trim();
    if (text) return text;
    last = new AIError("Gemini returned an empty reply");
  }
  throw last;
}

async function openAiStyleChat(base: string, name: string, model: string, key: string, messages: ChatMessage[], opts: ChatOpts, cfg: DirectConfig): Promise<string> {
  const msgs: { role: string; content: string }[] = [];
  if (opts.system) msgs.push({ role: "system", content: opts.system });
  for (const m of messages) msgs.push({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content ?? "") });
  const body: Record<string, unknown> = { model, messages: msgs };
  if (opts.json) body.response_format = { type: "json_object" };
  const r = await timedFetch(cfg, `${base}/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body),
  });
  if (!r.ok) throw new AIError(`${name} error ${r.status}`, r.status);
  const d = (await r.json().catch(() => null)) as any;
  const msg = d?.choices?.[0]?.message ?? {};
  const text = String(msg.content || msg.reasoning || "").trim();
  if (!text) throw new AIError(`${name} returned an empty reply`);
  return text;
}

export const groqChat = (key: string, m: ChatMessage[], o: ChatOpts, cfg: DirectConfig = {}) =>
  openAiStyleChat(GROQ_BASE, "Groq", GROQ_CHAT_MODEL, key, m, o, cfg);
export const openRouterChat = (key: string, m: ChatMessage[], o: ChatOpts, cfg: DirectConfig = {}) =>
  openAiStyleChat(OPENROUTER_BASE, "OpenRouter", OPENROUTER_CHAT_MODEL, key, m, o, cfg);

const CHAIN: { id: KeyProvider; run: typeof geminiChat }[] = [
  { id: "gemini", run: geminiChat },
  { id: "groq", run: groqChat },
  { id: "openrouter", run: openRouterChat },
];

/** Uses whichever keys exist, in order Gemini, Groq, OpenRouter (free model). Only OpenRouter is required,
 *  so with just that key the chat runs on OpenRouter alone. Same contract as the old proxyChat. */
export async function aiChat(messages: ChatMessage[], opts: ChatOpts = {}, cfg: DirectConfig = {}): Promise<AIReply> {
  const keys = cfg.keys ?? (await getKeys());
  const errors: string[] = [];
  for (const step of CHAIN) {
    const key = keys[step.id];
    if (!key) { errors.push(`${step.id}: no key`); continue; }
    try {
      return { text: await step.run(key, messages, opts, cfg), provider: step.id };
    } catch (e) {
      errors.push(`${step.id}: ${(e as Error).message}`);
    }
  }
  throw new AIError(`All AI providers failed (${errors.join("; ")})`);
}

export interface KeyTestResult { ok: boolean; message: string }

function describeStatus(status: number): string {
  if (status === 400 || status === 401 || status === 403) return "Key was rejected. Check you copied the whole key.";
  if (status === 429) return "Key works but is rate-limited right now. Try again in a minute.";
  if (status >= 500) return `Provider is having problems (HTTP ${status}). Try again later.`;
  return `Unexpected response (HTTP ${status}).`;
}

/** Minimal real, read-only API call to check a key. Costs no tokens. */
export async function testKey(p: KeyProvider, rawKey: string, cfg: DirectConfig = {}): Promise<KeyTestResult> {
  const key = (rawKey ?? "").replace(/\s+/g, "");
  if (!key) return { ok: false, message: "Enter a key first." };
  const req: { url: string; headers: Record<string, string> } =
    p === "gemini" ? { url: `${GEMINI_BASE}/models?pageSize=1`, headers: { "x-goog-api-key": key } }
    : p === "groq" ? { url: `${GROQ_BASE}/models`, headers: { Authorization: `Bearer ${key}` } }
    : { url: `${OPENROUTER_BASE}/key`, headers: { Authorization: `Bearer ${key}` } };
  let r: Response;
  try {
    r = await timedFetch(cfg, req.url, { method: "GET", headers: req.headers }, 15000);
  } catch (e) {
    return { ok: false, message: `Could not reach the provider: ${(e as Error).message}. Check your internet.` };
  }
  if (r.ok) return { ok: true, message: "Key works." };
  return { ok: false, message: describeStatus(r.status) };
}
