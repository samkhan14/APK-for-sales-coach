// Small energy-based voice activity detector, used by the chained fallback (Gemini Live has its own VAD).
// TODO(unverified): thresholds are guesses; tune on a real phone (speaker echo will raise the floor).
export type VadEvent = "speech_start" | "speech_end" | null;

export interface VadOptions { threshold?: number; silenceMs?: number; minSpeechMs?: number }

export class EnergyVad {
  private speaking = false;
  private speechMs = 0;
  private silenceMs = 0;
  readonly threshold: number;
  readonly silenceLimit: number;
  readonly minSpeech: number;

  constructor(opts: VadOptions = {}) {
    this.threshold = opts.threshold ?? 0.02;
    this.silenceLimit = opts.silenceMs ?? 600;
    this.minSpeech = opts.minSpeechMs ?? 200;
  }

  get isSpeaking() { return this.speaking; }

  /** Feed one chunk's RMS level and its duration. Returns an event when state changes. */
  feed(level: number, chunkMs: number): VadEvent {
    if (level >= this.threshold) {
      this.silenceMs = 0;
      this.speechMs += chunkMs;
      if (!this.speaking && this.speechMs >= this.minSpeech) { this.speaking = true; return "speech_start"; }
      return null;
    }
    if (!this.speaking) { this.speechMs = 0; return null; }
    this.silenceMs += chunkMs;
    if (this.silenceMs >= this.silenceLimit) {
      this.speaking = false; this.speechMs = 0; this.silenceMs = 0;
      return "speech_end";
    }
    return null;
  }

  reset() { this.speaking = false; this.speechMs = 0; this.silenceMs = 0; }
}

/** Split an AI reply into sentences so TTS can start on the first one quickly. */
export function splitSentences(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [];
  const out: string[] = [];
  for (const p of parts.map(s => s.trim()).filter(Boolean)) {
    // Merge very short fragments ("Yeah.", "Hm.") into the next one for more natural prosody.
    if (out.length && out[out.length - 1]!.length < 12) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out;
}
