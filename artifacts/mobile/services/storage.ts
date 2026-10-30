// Pure helpers for AsyncStorage data (I10 safe parse, I11 history cap, I12 race-free append).
// Kept free of React/AsyncStorage so they can be unit-tested with Jest.
import type { CallRecord } from "@/contexts/AppContext";

/** Max calls kept on the phone. The old silent 50-call cap is gone (I11).
 *  1000 is a storage-safety ceiling (Android AsyncStorage defaults to ~6 MB total). */
export const MAX_HISTORY = 1000;

export type VoiceMode = "off" | "live" | "chained";

export interface AppSettings {
  theme: "light" | "dark" | "system";
  /** Feature flag for the human-voice spike. Default "off" until the CEO's device test passes. */
  voiceMode: VoiceMode;
  /** Show the on-screen latency readout (speech end -> first AI audio, barge-in stop time). */
  voiceDebug: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = { theme: "system", voiceMode: "off", voiceDebug: true };

export interface ParseResult<T> {
  value: T;
  /** true when stored data existed but was corrupt/invalid and the default was used. */
  corrupted: boolean;
}

/** JSON.parse that never throws. Returns the fallback and corrupted=true for bad data. */
export function safeParse<T>(raw: string | null, validate: (v: unknown) => T | null, fallback: T): ParseResult<T> {
  if (raw == null) return { value: fallback, corrupted: false };
  try {
    const v = validate(JSON.parse(raw));
    return v === null ? { value: fallback, corrupted: true } : { value: v, corrupted: false };
  } catch {
    return { value: fallback, corrupted: true };
  }
}

const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function isCallRecord(v: unknown): v is CallRecord {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return isStr(r.id) && isStr(r.scenarioTitle) && isStr(r.date) && isNum(r.overallScore) &&
    isNum(r.confidenceScore) && isNum(r.fluencyScore) && isNum(r.effectivenessScore) && Array.isArray(r.transcript);
}

/** Keeps valid records, drops malformed ones. Whole value must be an array. */
export function validateHistory(v: unknown): CallRecord[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter(isCallRecord);
}

export function validateSettings(v: unknown): AppSettings | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  return {
    theme: s.theme === "light" || s.theme === "dark" || s.theme === "system" ? s.theme : DEFAULT_SETTINGS.theme,
    voiceMode: s.voiceMode === "live" || s.voiceMode === "chained" || s.voiceMode === "off" ? s.voiceMode : DEFAULT_SETTINGS.voiceMode,
    voiceDebug: typeof s.voiceDebug === "boolean" ? s.voiceDebug : DEFAULT_SETTINGS.voiceDebug,
  };
}

export function validateStreak(v: unknown): { streak: number; lastDate: string | null } | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  return { streak: isNum(s.streak) && s.streak >= 0 ? Math.floor(s.streak) : 0, lastDate: isStr(s.lastDate) ? s.lastDate : null };
}

export function validateFavorites(v: unknown): { phrases: string[]; scripts: string[] } | null {
  if (!v || typeof v !== "object") return null;
  const f = v as Record<string, unknown>;
  const arr = (x: unknown) => (Array.isArray(x) ? x.filter(isStr) : []);
  return { phrases: arr(f.phrases), scripts: arr(f.scripts) };
}

/** Newest first; never drops a record unless the safety ceiling is exceeded; ignores duplicate ids. */
export function appendRecord(prev: CallRecord[], record: CallRecord, max = MAX_HISTORY): CallRecord[] {
  return [record, ...prev.filter(r => r.id !== record.id)].slice(0, max);
}

export function nextStreak(streak: number, lastDate: string | null, now = new Date()): { streak: number; lastDate: string } {
  const today = now.toISOString().split("T")[0]!;
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0]!;
  if (lastDate === today) return { streak, lastDate: today };
  return { streak: lastDate === yesterday ? streak + 1 : 1, lastDate: today };
}

/** Backup key for a corrupt blob. One per key (overwritten), so old backups never pile up. */
export function corruptBackupKey(key: string): string {
  return `${key}.corrupt`;
}

/** Serializes async writes: each task starts only after the previous one settled,
 *  so out-of-order completion can never let an older snapshot overwrite a newer one. */
export function createWriteQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task);
    tail = run.catch(() => {});
    return run;
  };
}
