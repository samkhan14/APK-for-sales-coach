// Bring-your-own-keys: every user enters their OWN provider keys. Keys live only on the device
// (expo-secure-store: Android Keystore / iOS Keychain). Nothing is bundled, logged or sent to our servers.
// Loaded lazily so plain-Node scripts (tests/*.ts via tsx) can import the chat code without React Native.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SS = (): typeof import("expo-secure-store") => require("expo-secure-store");

export type KeyProvider = "gemini" | "groq" | "openrouter";
export const KEY_PROVIDERS: KeyProvider[] = ["gemini", "groq", "openrouter"];

export interface ProviderInfo {
  id: KeyProvider;
  label: string;
  /** Where the user creates the key (checked 2026-10-30: all three return HTTP 200). */
  createUrl: string;
  hint: string;
}

export const PROVIDER_INFO: Record<KeyProvider, ProviderInfo> = {
  gemini: { id: "gemini", label: "Gemini (Google AI Studio)", createUrl: "https://aistudio.google.com/apikey", hint: "Optional. Better chat, Live voice and voice output" },
  groq: { id: "groq", label: "Groq", createUrl: "https://console.groq.com/keys", hint: "Optional. Chat backup and speech-to-text (Fallback voice)" },
  openrouter: { id: "openrouter", label: "OpenRouter", createUrl: "https://openrouter.ai/keys", hint: "Required. Chat and scoring (free model)" },
};

export type Keys = Partial<Record<KeyProvider, string>>;

export interface KeyBackend {
  get(name: string): Promise<string | null>;
  set(name: string, value: string): Promise<void>;
  remove(name: string): Promise<void>;
}

const secureBackend: KeyBackend = {
  get: n => SS().getItemAsync(n),
  set: (n, v) => SS().setItemAsync(n, v),
  remove: n => SS().deleteItemAsync(n),
};

let backend: KeyBackend = secureBackend;
/** Tests only. */
export function setKeyBackend(b: KeyBackend | null) { backend = b ?? secureBackend; cache = null; }

const storeName = (p: KeyProvider) => `byok_${p}_key`;
let cache: Keys | null = null;
const listeners = new Set<(k: Keys) => void>();
export function onKeysChanged(fn: (k: Keys) => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
function emit() { const k = { ...(cache ?? {}) }; listeners.forEach(l => l(k)); }

/** Trims whitespace/newlines a paste can add. Returns "" for empty. */
export function normalizeKey(raw: string): string { return (raw ?? "").replace(/\s+/g, ""); }

/** Cheap local sanity check before any network call. Not a guarantee the key works. */
export function checkKeyFormat(p: KeyProvider, raw: string): string | null {
  const k = normalizeKey(raw);
  if (!k) return "Key is empty.";
  if (k.length < 20) return "Key looks too short.";
  if (!/^[A-Za-z0-9_\-.]+$/.test(k)) return "Key has unexpected characters.";
  // Prefixes documented by the providers; only a warning-level check (we still let the live Test decide).
  return null;
}

export function maskKey(k?: string | null): string {
  if (!k) return "Not set";
  if (k.length <= 8) return "••••";
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

/** Only OpenRouter is required. Gemini and Groq are optional extras (better chat, voice). */
export const REQUIRED_PROVIDERS: KeyProvider[] = ["openrouter"];
export const isRequired = (p: KeyProvider) => REQUIRED_PROVIDERS.includes(p);
/** Required providers that are still missing. */
export function missingProviders(k: Keys): KeyProvider[] { return REQUIRED_PROVIDERS.filter(p => !k[p]); }
export function hasRequiredKeys(k: Keys): boolean { return missingProviders(k).length === 0; }
/** @deprecated name kept for callers; now means "required keys present". */
export const hasAllKeys = hasRequiredKeys;

export type VoiceModeId = "off" | "live" | "chained";
export interface VoiceAvailability { ok: boolean; message: string | null }
/** Live voice needs Gemini; Fallback voice needs Groq (speech-to-text) + Gemini (voice output). */
export function voiceAvailability(k: Keys, mode: VoiceModeId): VoiceAvailability {
  if (mode === "off") return { ok: true, message: null };
  if (mode === "live") return k.gemini ? { ok: true, message: null } : { ok: false, message: "Add a Gemini key to use Live voice." };
  if (k.gemini && k.groq) return { ok: true, message: null };
  if (!k.gemini && !k.groq) return { ok: false, message: "Add Groq and Gemini keys to use Fallback voice." };
  return { ok: false, message: k.groq ? "Add a Gemini key to use Fallback voice." : "Add a Groq key to use Fallback voice." };
}
/** The voice mode actually used: falls back to "off" if the needed keys are missing. */
export function effectiveVoiceMode(k: Keys, mode: VoiceModeId): VoiceModeId { return voiceAvailability(k, mode).ok ? mode : "off"; }

export async function loadKeys(): Promise<Keys> {
  const out: Keys = {};
  for (const p of KEY_PROVIDERS) {
    try { const v = await backend.get(storeName(p)); if (v) out[p] = v; } catch { /* unreadable = missing */ }
  }
  cache = out;
  return { ...out };
}

export async function getKeys(): Promise<Keys> { return cache ? { ...cache } : loadKeys(); }

export async function getKey(p: KeyProvider): Promise<string | null> { return (await getKeys())[p] ?? null; }

export async function saveKey(p: KeyProvider, raw: string): Promise<void> {
  const k = normalizeKey(raw);
  const err = checkKeyFormat(p, k);
  if (err) throw new Error(err);
  await backend.set(storeName(p), k);
  cache = { ...(cache ?? (await loadKeys())), [p]: k };
  emit();
}

export async function clearKey(p: KeyProvider): Promise<void> {
  await backend.remove(storeName(p));
  const next = { ...(cache ?? {}) }; delete next[p]; cache = next;
  emit();
}

export async function clearAllKeys(): Promise<void> { for (const p of KEY_PROVIDERS) await clearKey(p); }

export class MissingKeyError extends Error {
  constructor(public provider: KeyProvider) { super(`${PROVIDER_INFO[provider].label} key is not set. Add it in Settings.`); this.name = "MissingKeyError"; }
}
export async function requireKey(p: KeyProvider): Promise<string> {
  const k = await getKey(p);
  if (!k) throw new MissingKeyError(p);
  return k;
}
