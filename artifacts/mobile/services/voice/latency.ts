// On-screen timing readout for the CEO's device test: how long from "I stopped talking"
// to "I hear the AI", and how fast the AI goes quiet when interrupted (barge-in).
export interface LatencyStats {
  turns: number;
  lastResponseMs: number | null;
  avgResponseMs: number | null;
  lastBargeInStopMs: number | null;
  bargeIns: number;
}

export class LatencyTracker {
  private speechEndAt: number | null = null;
  private bargeInAt: number | null = null;
  private responses: number[] = [];
  private stats: LatencyStats = { turns: 0, lastResponseMs: null, avgResponseMs: null, lastBargeInStopMs: null, bargeIns: 0 };

  constructor(private now: () => number = () => Date.now()) {}

  /** User finished speaking (server ACTIVITY_END, or local VAD end). */
  markSpeechEnd(at?: number) { this.speechEndAt = at ?? this.now(); }

  /** First AI audio chunk actually scheduled for playback. Only the first one after a speech end counts. */
  markFirstAudio() {
    if (this.speechEndAt == null) return;
    const ms = this.now() - this.speechEndAt;
    this.speechEndAt = null;
    this.responses.push(ms);
    const avg = Math.round(this.responses.reduce((a, b) => a + b, 0) / this.responses.length);
    this.stats = { ...this.stats, turns: this.responses.length, lastResponseMs: ms, avgResponseMs: avg };
  }

  /** User started talking while the AI was speaking. */
  markBargeIn() { if (this.bargeInAt == null) this.bargeInAt = this.now(); }

  /** Playback was cleared after a barge-in. */
  markPlaybackStopped() {
    if (this.bargeInAt == null) return;
    const ms = this.now() - this.bargeInAt;
    this.bargeInAt = null;
    this.stats = { ...this.stats, lastBargeInStopMs: ms, bargeIns: this.stats.bargeIns + 1 };
  }

  get snapshot(): LatencyStats { return this.stats; }
}

export function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
}
