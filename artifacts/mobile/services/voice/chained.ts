// Fallback voice pipeline (if Gemini Live is unavailable/too limited on the free tier):
//   mic -> local VAD -> WAV -> /stt (Groq Whisper) -> /chat (Gemini text) -> sentence split -> /tts per sentence.
// TTS for sentence 2+ is requested while sentence 1 is playing, so the first words come out fast.
// All I/O is injected so the pipeline can be unit-tested with mocks.
import type { ChatMessage } from "@/services/proxyClient";
import { splitSentences } from "./vad";

export interface ChainedDeps {
  transcribe: (wav: Uint8Array) => Promise<string>;
  chat: (messages: ChatMessage[], system: string) => Promise<string>;
  synthesize: (sentence: string) => Promise<{ audio: string; sampleRate: number }>;
  /** Plays one sentence; resolves when it has been queued/played. */
  play: (audio: string, sampleRate: number) => Promise<void>;
}

export interface TurnResult { userText: string; aiText: string; aborted: boolean }

export class ChainedTurnRunner {
  private abortId = 0;
  constructor(private deps: ChainedDeps) {}

  /** Barge-in: stop the current turn (caller also clears the audio player). */
  abort() { this.abortId++; }

  async run(wav: Uint8Array, history: ChatMessage[], system: string, onFirstAudio?: () => void): Promise<TurnResult> {
    const id = ++this.abortId;
    const live = () => id === this.abortId;
    const userText = await this.deps.transcribe(wav);
    if (!userText || !live()) return { userText, aiText: "", aborted: !live() };
    const aiText = await this.deps.chat([...history, { role: "user", content: userText }], system);
    if (!live()) return { userText, aiText: "", aborted: true };

    const sentences = splitSentences(aiText);
    // Start all TTS requests now (prefetch); play strictly in order.
    const pending = sentences.map(s => this.deps.synthesize(s));
    pending.forEach(p => p.catch(() => {}));
    let first = true;
    for (const p of pending) {
      let a: { audio: string; sampleRate: number };
      try { a = await p; } catch { continue; } // TODO: a failed sentence is skipped silently; consider expo-speech fallback.
      if (!live()) return { userText, aiText, aborted: true };
      if (first) { onFirstAudio?.(); first = false; }
      await this.deps.play(a.audio, a.sampleRate);
    }
    return { userText, aiText, aborted: false };
  }
}
