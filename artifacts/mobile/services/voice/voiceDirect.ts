// Voice calls made directly with the user's own keys (replaces the Worker's /live-token, /stt, /tts).
import { requireKey } from "@/services/keys/keyStore";
import { AIError, type DirectConfig } from "@/services/directClient";
import { GEMINI_BASE, GEMINI_LIVE_MODEL, GEMINI_TTS_MODEL, GROQ_BASE, GROQ_STT_MODEL } from "@/services/models";
import { bytesToBase64 } from "@/services/voice/pcm";

async function call(cfg: DirectConfig, url: string, init: RequestInit, ms: number, label: string): Promise<any> {
  const doFetch = cfg.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? ms);
  let r: Response;
  try { r = await doFetch(url, { ...init, signal: controller.signal }); }
  catch { throw new AIError(`${label}: network error or timeout`); }
  finally { clearTimeout(timer); }
  if (!r.ok) throw new AIError(`${label} error ${r.status}`, r.status);
  return r.json().catch(() => null);
}

export interface LiveCreds { apiKey: string; model: string }

/** Gemini Live connects with the user's own key; no ephemeral token server needed. */
export async function getLiveCreds(cfg: DirectConfig = {}): Promise<LiveCreds> {
  const apiKey = cfg.keys?.gemini ?? (await requireKey("gemini"));
  return { apiKey, model: GEMINI_LIVE_MODEL };
}

/** WAV bytes -> text (Groq Whisper). */
export async function transcribe(wav: Uint8Array, cfg: DirectConfig = {}): Promise<string> {
  const key = cfg.keys?.groq ?? (await requireKey("groq"));
  const fd = new FormData();
  // React Native FormData accepts { uri, type, name }; a data: URI avoids writing a temp file.
  // TODO(verify on device): RN multipart upload of a data: URI to Groq.
  fd.append("file", { uri: `data:audio/wav;base64,${bytesToBase64(wav)}`, type: "audio/wav", name: "speech.wav" } as any);
  fd.append("model", GROQ_STT_MODEL);
  fd.append("language", "en");
  fd.append("response_format", "json");
  const d = await call(cfg, `${GROQ_BASE}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd }, 20000, "Speech-to-text");
  return typeof d?.text === "string" ? d.text.trim() : "";
}

export interface TtsAudio { audio: string; sampleRate: number }

/** One sentence -> base64 PCM16 mono (Gemini TTS). */
export async function synthesize(text: string, voice: string, cfg: DirectConfig = {}): Promise<TtsAudio> {
  const key = cfg.keys?.gemini ?? (await requireKey("gemini"));
  const d = await call(cfg, `${GEMINI_BASE}/models/${GEMINI_TTS_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: text.slice(0, 600) }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    }),
  }, 20000, "Voice output");
  const part = (d?.candidates?.[0]?.content?.parts ?? []).find((p: any) => p?.inlineData?.data);
  if (!part) throw new AIError("Voice output was empty");
  const m = /rate=(\d+)/.exec(part.inlineData.mimeType || "");
  return { audio: part.inlineData.data, sampleRate: m ? Number(m[1]) : 24000 };
}
