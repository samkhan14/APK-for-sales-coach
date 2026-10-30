// Gemini Live (native audio) session over WebSocket using an ephemeral token.
// Message shapes follow the official Live API docs (checked 2026-10-30):
//   setup -> setupComplete; realtimeInput.audio (PCM16 16 kHz); serverContent.modelTurn audio (PCM16 24 kHz);
//   serverContent.interrupted = barge-in; input/outputTranscription; voiceActivity; goAway; sessionResumptionUpdate.
// TODO(unverified on device): end-to-end behaviour, latency and echo handling have NOT been tested on a phone.
export const LIVE_WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

export interface WsLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: ((ev?: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onerror: ((ev?: unknown) => void) | null;
  onclose: ((ev?: { code?: number; reason?: string }) => void) | null;
}

export interface LiveCallbacks {
  onAudio?: (pcm16Base64: string) => void;
  /** Server detected the user talking over the AI: stop playback immediately. */
  onInterrupted?: () => void;
  onVoiceActivity?: (kind: "start" | "end") => void;
  /** A finished turn for the transcript (used for scoring). */
  onTurn?: (role: "user" | "assistant", text: string) => void;
  onPartial?: (role: "user" | "assistant", text: string) => void;
  onTurnComplete?: () => void;
  onGoAway?: (timeLeft?: string) => void;
  onError?: (message: string) => void;
  onClose?: (reason: string) => void;
}

export interface LiveOptions {
  token: string;
  model: string;
  systemInstruction: string;
  voiceName?: string;
  /** Silence before the server decides the user stopped talking. Lower = snappier, higher = fewer cut-offs. */
  silenceDurationMs?: number;
  wsFactory?: (url: string) => WsLike;
  callbacks?: LiveCallbacks;
}

export function buildSetupMessage(o: Pick<LiveOptions, "model" | "systemInstruction" | "voiceName" | "silenceDurationMs">) {
  return {
    setup: {
      model: o.model.startsWith("models/") ? o.model : `models/${o.model}`,
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: o.voiceName ?? "Kore" } } },
      },
      systemInstruction: { parts: [{ text: o.systemInstruction }] },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          endOfSpeechSensitivity: "END_SENSITIVITY_HIGH",
          prefixPaddingMs: 20,
          silenceDurationMs: o.silenceDurationMs ?? 500,
        },
        activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      sessionResumption: {},
    },
  };
}

function decodeFrame(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array((data as ArrayBufferView).buffer);
    if (typeof TextDecoder !== "undefined") return new TextDecoder().decode(bytes);
    // TODO(unverified): fallback for runtimes without TextDecoder (ASCII-safe only).
    let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!); return s;
  }
  return null;
}

export class GeminiLiveSession {
  private ws: WsLike | null = null;
  private ready = false;
  private userBuf = "";
  private aiBuf = "";
  resumeHandle: string | null = null;
  private cb: LiveCallbacks;

  constructor(private opts: LiveOptions) { this.cb = opts.callbacks ?? {}; }

  get isReady() { return this.ready; }

  connect(timeoutMs = 10000): Promise<void> {
    const url = `${LIVE_WS_URL}?access_token=${encodeURIComponent(this.opts.token)}`;
    const factory = this.opts.wsFactory ?? ((u: string) => {
      const ws = new WebSocket(u) as unknown as WsLike & { binaryType?: string };
      ws.binaryType = "arraybuffer";
      return ws;
    });
    return new Promise((resolve, reject) => {
      const ws = factory(url);
      this.ws = ws;
      const timer = setTimeout(() => reject(new Error("Live connect timed out")), timeoutMs);
      ws.onopen = () => ws.send(JSON.stringify(buildSetupMessage(this.opts)));
      ws.onerror = () => { this.cb.onError?.("WebSocket error"); };
      ws.onclose = ev => {
        clearTimeout(timer);
        const wasReady = this.ready;
        this.ready = false;
        const reason = `${ev?.code ?? ""} ${ev?.reason ?? ""}`.trim() || "closed";
        if (!wasReady) reject(new Error(`Live socket closed before setup: ${reason}`));
        this.cb.onClose?.(reason);
      };
      ws.onmessage = ev => {
        const msg = this.handleMessage(ev.data);
        if (msg === "setupComplete") { clearTimeout(timer); resolve(); }
      };
    });
  }

  /** Parses one server frame. Exposed for unit tests. Returns "setupComplete" on the setup ack. */
  handleMessage(data: unknown): "setupComplete" | null {
    const raw = decodeFrame(data);
    if (!raw) return null;
    let m: any;
    try { m = JSON.parse(raw); } catch { return null; }

    if (m.setupComplete) { this.ready = true; return "setupComplete"; }
    if (m.voiceActivity?.type === "ACTIVITY_START") this.cb.onVoiceActivity?.("start");
    if (m.voiceActivity?.type === "ACTIVITY_END") this.cb.onVoiceActivity?.("end");
    if (m.goAway) this.cb.onGoAway?.(m.goAway.timeLeft);
    if (m.sessionResumptionUpdate?.resumable && m.sessionResumptionUpdate.newHandle) this.resumeHandle = m.sessionResumptionUpdate.newHandle;
    if (m.error) this.cb.onError?.(String(m.error.message ?? "Live API error"));

    const sc = m.serverContent;
    if (sc) {
      if (sc.inputTranscription?.text) { this.userBuf += sc.inputTranscription.text; this.cb.onPartial?.("user", this.userBuf); }
      if (sc.outputTranscription?.text) {
        // First AI words mean the user's turn is over: commit it before the AI turn.
        this.flushUser();
        this.aiBuf += sc.outputTranscription.text;
        this.cb.onPartial?.("assistant", this.aiBuf);
      }
      for (const part of sc.modelTurn?.parts ?? []) {
        const d = part?.inlineData?.data;
        if (typeof d === "string" && d) this.cb.onAudio?.(d);
      }
      if (sc.interrupted) { this.cb.onInterrupted?.(); this.flushAi(); }
      if (sc.turnComplete) { this.flushUser(); this.flushAi(); this.cb.onTurnComplete?.(); }
    }
    return null;
  }

  private flushUser() { const t = this.userBuf.trim(); this.userBuf = ""; if (t) this.cb.onTurn?.("user", t); }
  private flushAi() { const t = this.aiBuf.trim(); this.aiBuf = ""; if (t) this.cb.onTurn?.("assistant", t); }

  sendAudio(pcm16Base64At16k: string) {
    if (!this.ready || !this.ws) return;
    this.ws.send(JSON.stringify({ realtimeInput: { audio: { data: pcm16Base64At16k, mimeType: "audio/pcm;rate=16000" } } }));
  }

  /** Text into the conversation (used to make the AI say its opening line). */
  sendText(text: string) {
    if (!this.ready || !this.ws) return;
    this.ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true } }));
  }

  /** Tell the server the mic paused (e.g. mute) so it flushes buffered audio. */
  endAudioStream() {
    if (!this.ready || !this.ws) return;
    this.ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
  }

  close() {
    this.flushUser(); this.flushAi();
    this.ready = false;
    try { this.ws?.close(1000, "call ended"); } catch { /* ignore */ }
    this.ws = null;
  }
}

/** Prompt that makes the model greet with the exact opener the transcript already shows. */
export function openerInstruction(opener: string): string {
  return `[The phone call just connected. You answer the phone. Say exactly this, naturally, then stop and wait for the caller: "${opener}"]`;
}
