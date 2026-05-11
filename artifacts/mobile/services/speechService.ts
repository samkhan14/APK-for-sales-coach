import { Platform } from "react-native";
import * as Speech from "expo-speech";

export interface SpeechOptions {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  voiceType?: "customer" | "agent" | "neutral";
  language?: string;
}

let isSpeaking = false;
let cachedVoices: Speech.Voice[] = [];

async function getVoices(): Promise<Speech.Voice[]> {
  if (cachedVoices.length > 0) return cachedVoices;
  try {
    cachedVoices = await Speech.getAvailableVoicesAsync();
  } catch {
    cachedVoices = [];
  }
  return cachedVoices;
}

function pickBestEnglishVoice(voices: Speech.Voice[], preferFemale = false): string | undefined {
  if (Platform.OS === "web") {
    // On web, use speechSynthesis API to pick a natural-sounding voice
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const webVoices = window.speechSynthesis.getVoices();
      // Prefer Google or Microsoft natural voices
      const preferred = [
        "Google US English",
        "Microsoft Aria Online (Natural)",
        "Microsoft Guy Online (Natural)",
        "Google UK English Female",
        "Google UK English Male",
        "Microsoft Zira - English (United States)",
        "Microsoft David - English (United States)",
      ];
      for (const name of (preferFemale
        ? ["Google UK English Female", "Microsoft Aria Online (Natural)", ...preferred]
        : preferred)) {
        const found = webVoices.find(v => v.name === name);
        if (found) return found.voiceURI;
      }
    }
    return undefined;
  }

  if (Platform.OS === "ios") {
    // iOS: Prefer enhanced (neural) voices
    const enhanced = voices.filter(
      v => v.language?.startsWith("en") && v.quality === Speech.VoiceQuality.Enhanced
    );
    if (preferFemale) {
      const female = enhanced.find(v =>
        v.identifier?.toLowerCase().includes("female") ||
        v.name?.toLowerCase().includes("samantha") ||
        v.name?.toLowerCase().includes("karen") ||
        v.name?.toLowerCase().includes("victoria")
      );
      if (female) return female.identifier;
    } else {
      const male = enhanced.find(v =>
        v.identifier?.toLowerCase().includes("male") ||
        v.name?.toLowerCase().includes("daniel") ||
        v.name?.toLowerCase().includes("alex") ||
        v.name?.toLowerCase().includes("fred")
      );
      if (male) return male.identifier;
    }
    return enhanced[0]?.identifier;
  }

  // Android: pick first en-US voice
  const enUS = voices.filter(v => v.language?.startsWith("en-US") || v.language?.startsWith("en_US"));
  return enUS[0]?.identifier;
}

export async function speakText(text: string, options?: SpeechOptions): Promise<void> {
  if (isSpeaking) await stopSpeaking();
  isSpeaking = true;
  options?.onStart?.();

  const voices = await getVoices();
  const voiceType = options?.voiceType ?? "neutral";
  const preferFemale = voiceType === "customer";
  const voiceId = pickBestEnglishVoice(voices, preferFemale);

  // Customer: slightly higher pitch, faster rate → sounds energetic/real
  // Agent: slightly lower pitch, measured rate → sounds confident
  // Neutral: balanced
  const pitchMap = { customer: 1.05, agent: 0.92, neutral: 0.97 };
  const rateMap  = { customer: 0.95, agent: 0.88, neutral: 0.90 };

  const basePitch = pitchMap[voiceType];
  const baseRate  = rateMap[voiceType];

  Speech.speak(text, {
    language: options?.language ?? "en-US",
    pitch: basePitch + (Math.random() * 0.06 - 0.03),
    rate:  baseRate  + (Math.random() * 0.06 - 0.03),
    voice: voiceId,
    onDone: () => { isSpeaking = false; options?.onDone?.(); },
    onError: (err) => { isSpeaking = false; options?.onError?.(err); },
    onStopped: () => { isSpeaking = false; },
  });
}

export async function stopSpeaking(): Promise<void> {
  isSpeaking = false;
  try { await Speech.stop(); } catch { /* ignore */ }
}

export function isSpeakingNow(): boolean {
  return isSpeaking;
}
