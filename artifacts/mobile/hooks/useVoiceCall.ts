// Voice spike controller (behind Settings > Voice mode, default OFF).
// "live":    Gemini Live native audio over WebSocket (connects with the user's own Gemini key). Primary.
// "chained": local VAD -> Whisper STT -> Gemini text -> Gemini TTS per sentence. Fallback.
// TODO(unverified on device): none of this has been run on a real phone yet.
import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceMode } from "@/services/storage";
import { aiChat, type ChatMessage } from "@/services/directClient";
import { LatencyTracker, type LatencyStats } from "@/services/voice/latency";
import { EnergyVad } from "@/services/voice/vad";
import { encodeWav, floatToPcm16Base64, rms } from "@/services/voice/pcm";
import { GeminiLiveSession, openerInstruction } from "@/services/voice/geminiLive";
import { ChainedTurnRunner } from "@/services/voice/chained";
import { getLiveCreds, synthesize, transcribe } from "@/services/voice/voiceDirect";

export type VoicePhase = "idle" | "connecting" | "listening" | "user_speaking" | "ai_thinking" | "ai_speaking" | "error";

interface Options {
  mode: Exclude<VoiceMode, "off">;
  systemPrompt: string;
  opener: string;
  getHistory: () => ChatMessage[];
  onTurn: (role: "user" | "assistant", text: string) => void;
}

const VOICE_NAME = "Kore"; // TODO: let the CEO pick (Puck, Charon, Kore, Fenrir, Aoede...) after listening.
const VAD_SILENCE_MS = 600;
const MAX_UTTERANCE_SEC = 18; // keeps each Groq STT upload small (16 kHz x 16-bit = 32 KB/s)

export function useVoiceCall(opts: Options) {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LatencyStats>(new LatencyTracker().snapshot);
  const [notice, setNotice] = useState<string | null>(null);
  const [partial, setPartial] = useState<{ role: "user" | "assistant"; text: string } | null>(null);

  const optsRef = useRef(opts);
  optsRef.current = opts;
  const tracker = useRef(new LatencyTracker());
  const cleanup = useRef<(() => Promise<void>) | null>(null);

  const refreshStats = () => setStats(tracker.current.snapshot);

  const stop = useCallback(async () => {
    const c = cleanup.current;
    cleanup.current = null;
    if (c) await c();
    setPhase("idle");
    setPartial(null);
  }, []);

  useEffect(() => () => { void cleanup.current?.(); }, []);

  const start = useCallback(async () => {
    if (cleanup.current) return;
    setError(null);
    setNotice(null);
    setPhase("connecting");
    tracker.current = new LatencyTracker();
    refreshStats();
    let playerForCleanup: { close: () => Promise<void> } | null = null;
    try {
      // Lazy import so the native module is only touched when the flag is on.
      let io: typeof import("@/services/voice/audioIO");
      try {
        io = await import("@/services/voice/audioIO");
      } catch {
        throw new Error("Voice needs the installed app build, not Expo Go.");
      }
      if (!(await io.ensureMicPermission())) throw new Error("Microphone permission denied");
      // Live mode: get the token BEFORE creating any audio objects. On failure fall back to
      // chained mode once (no retry loop).
      let mode = optsRef.current.mode;
      let tok: Awaited<ReturnType<typeof getLiveCreds>> | null = null;
      if (mode === "live") {
        try {
          tok = await getLiveCreds();
        } catch {
          mode = "chained";
          setNotice("Live voice unavailable, switched to Fallback voice for this call.");
        }
      }
      const player = new io.PcmPlayer();
      playerForCleanup = player;
      const mic = new io.MicStream();
      const vad = new EnergyVad({ silenceMs: VAD_SILENCE_MS });
      const echoVad = new EnergyVad({ threshold: 0.06, silenceMs: VAD_SILENCE_MS }); // TODO tune: barge-in while AI talks

      if (mode === "live" && tok) {
        let awaitingFirstAudio = true;
        const session = new GeminiLiveSession({
          apiKey: tok.apiKey,
          model: tok.model,
          systemInstruction: optsRef.current.systemPrompt,
          voiceName: VOICE_NAME,
          silenceDurationMs: 500,
          callbacks: {
            onAudio: b64 => {
              if (awaitingFirstAudio) { tracker.current.markFirstAudio(); refreshStats(); awaitingFirstAudio = false; }
              player.enqueue(b64, 24000);
              setPhase("ai_speaking");
            },
            onInterrupted: () => {
              player.stopAll();
              tracker.current.markPlaybackStopped();
              refreshStats();
              setPhase("user_speaking");
            },
            onTurnComplete: () => { awaitingFirstAudio = true; void player.drain().then(() => setPhase(p => (p === "ai_speaking" ? "listening" : p))); },
            onPartial: (role, text) => setPartial({ role, text }),
            onTurn: (role, text) => { optsRef.current.onTurn(role, text); setPartial(null); },
            onGoAway: () => setError("Voice session is about to time out (Live sessions are limited to ~10 min). TODO: auto-resume."),
            onError: m => setError(m),
            onClose: reason => { if (cleanup.current) { setError(`Voice connection closed (${reason})`); void stop(); } },
          },
        });
        await session.connect();
        mic.start((chunk, ms) => {
          const level = rms(chunk);
          if (player.isPlaying) {
            if (echoVad.feed(level, ms) === "speech_start") tracker.current.markBargeIn();
          } else {
            const ev = vad.feed(level, ms);
            if (ev === "speech_start") setPhase("user_speaking");
            // Speech really ended ~VAD_SILENCE_MS before the VAD fires.
            if (ev === "speech_end") { tracker.current.markSpeechEnd(Date.now() - VAD_SILENCE_MS); awaitingFirstAudio = true; setPhase("ai_thinking"); }
          }
          session.sendAudio(floatToPcm16Base64(chunk));
        });
        session.sendText(openerInstruction(optsRef.current.opener));
        cleanup.current = async () => { mic.stop(); session.close(); await player.close(); };
      } else {
        const runner = new ChainedTurnRunner({
          transcribe: wav => transcribe(wav),
          chat: async (messages, system) => (await aiChat(messages, { system })).text,
          synthesize: s => synthesize(s, VOICE_NAME),
          play: async (audio, rate) => { setPhase("ai_speaking"); player.enqueue(audio, rate); await player.drain(); },
        });
        let chunks: Float32Array[] = [];
        let preRoll: Float32Array[] = [];
        let busy = false;
        const finishUtterance = async () => {
          const total = chunks.reduce((n, c) => n + c.length, 0);
          const all = new Float32Array(total);
          let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
          chunks = [];
          if (total < 16000 * 0.3) { setPhase("listening"); return; }
          busy = true;
          setPhase("ai_thinking");
          try {
            const r = await runner.run(encodeWav(all, 16000), optsRef.current.getHistory(), optsRef.current.systemPrompt, () => {
              tracker.current.markFirstAudio(); refreshStats();
            });
            if (r.userText) optsRef.current.onTurn("user", r.userText);
            if (r.aiText) optsRef.current.onTurn("assistant", r.aiText);
          } catch (e) {
            setError(`Voice turn failed: ${(e as Error).message}`);
          } finally {
            busy = false;
            setPhase("listening");
          }
        };
        mic.start((chunk, ms) => {
          const level = rms(chunk);
          if (player.isPlaying) {
            if (echoVad.feed(level, ms) === "speech_start") {
              tracker.current.markBargeIn();
              runner.abort();
              player.stopAll();
              tracker.current.markPlaybackStopped();
              refreshStats();
              setPhase("user_speaking");
            }
            return;
          }
          const ev = vad.feed(level, ms);
          if (vad.isSpeaking || ev === "speech_end") chunks.push(chunk);
          else { preRoll.push(chunk); if (preRoll.length > 3) preRoll.shift(); }
          if (ev === "speech_start") { chunks = [...preRoll, ...chunks]; preRoll = []; setPhase("user_speaking"); }
          const seconds = chunks.reduce((n, c) => n + c.length, 0) / 16000;
          if ((ev === "speech_end" || seconds > MAX_UTTERANCE_SEC) && !busy) {
            if (ev !== "speech_end") vad.reset();
            tracker.current.markSpeechEnd(Date.now() - (ev === "speech_end" ? VAD_SILENCE_MS : 0));
            void finishUtterance();
          }
        });
        // Opener in the human voice (the transcript already shows it).
        try { const a = await synthesize(optsRef.current.opener, VOICE_NAME); player.enqueue(a.audio, a.sampleRate); setPhase("ai_speaking"); } catch { /* text opener still visible */ }
        void player.drain().then(() => setPhase("listening"));
        cleanup.current = async () => { runner.abort(); mic.stop(); await player.close(); };
      }
      setPhase(p => (p === "connecting" ? "listening" : p));
    } catch (e) {
      // Release audio resources if setup failed after the player was created.
      if (!cleanup.current && playerForCleanup) await playerForCleanup.close().catch(() => {});
      setError((e as Error).message);
      setPhase("error");
      cleanup.current = null;
    }
  }, [stop]);

  return { phase, error, notice, stats, partial, start, stop, active: phase !== "idle" && phase !== "error" };
}
