// Voice endpoints on our own Cloudflare Worker proxy. The app never holds a Gemini/Groq key:
// - /live-token returns a short-lived, single-use Gemini Live ephemeral token.
// - /stt and /tts are only used by the chained fallback.
// NOTE: these endpoints exist only in the LOCAL worker source until the CEO approves a deploy.
import { getProxyConfig, isProxyConfigured, ProxyError, type ProxyConfig } from "@/services/proxyClient";

async function post(path: string, init: { body: BodyInit; contentType: string }, cfg: ProxyConfig, timeoutMs = 20000): Promise<unknown> {
  if (!isProxyConfigured(cfg)) throw new ProxyError("AI proxy not configured (EXPO_PUBLIC_PROXY_URL / EXPO_PUBLIC_APP_TOKEN missing)");
  const doFetch = cfg.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? timeoutMs);
  let resp: Response;
  try {
    resp = await doFetch(`${cfg.url}${path}`, {
      method: "POST",
      headers: { "Content-Type": init.contentType, Authorization: `Bearer ${cfg.token}` },
      body: init.body,
      signal: controller.signal,
    });
  } catch (e) {
    throw new ProxyError(`Network error: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) throw new ProxyError(`Proxy error ${resp.status} on ${path}`, resp.status);
  return resp.json().catch(() => null);
}

export interface LiveToken { token: string; model: string; expiresAt: string }

export async function fetchLiveToken(cfg: ProxyConfig = getProxyConfig()): Promise<LiveToken> {
  const d = (await post("/live-token", { body: "{}", contentType: "application/json" }, cfg)) as Partial<LiveToken> | null;
  if (!d || typeof d.token !== "string" || !d.token || typeof d.model !== "string") throw new ProxyError("Bad /live-token response");
  return { token: d.token, model: d.model, expiresAt: String(d.expiresAt ?? "") };
}

/** WAV bytes -> text (Groq Whisper via the Worker). */
export async function transcribe(wav: Uint8Array, cfg: ProxyConfig = getProxyConfig()): Promise<string> {
  const d = (await post("/stt", { body: wav as unknown as BodyInit, contentType: "audio/wav" }, cfg)) as { text?: unknown } | null;
  return typeof d?.text === "string" ? d.text.trim() : "";
}

export interface TtsAudio { audio: string; sampleRate: number }

/** One sentence -> base64 PCM16 mono (Gemini TTS via the Worker). */
export async function synthesize(text: string, voice: string, cfg: ProxyConfig = getProxyConfig()): Promise<TtsAudio> {
  const d = (await post("/tts", { body: JSON.stringify({ text, voice }), contentType: "application/json" }, cfg)) as Partial<TtsAudio> | null;
  if (!d || typeof d.audio !== "string" || !d.audio) throw new ProxyError("Bad /tts response");
  return { audio: d.audio, sampleRate: typeof d.sampleRate === "number" ? d.sampleRate : 24000 };
}
