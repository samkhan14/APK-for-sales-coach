import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  appendRecord, corruptBackupKey, createWriteQueue, DEFAULT_SETTINGS, nextStreak, safeParse, validateFavorites, validateHistory,
  validateSettings, validateStreak, type AppSettings, type VoiceMode,
} from "@/services/storage";

export interface CallRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  personalityName: string;
  date: string;
  duration: number;
  overallScore: number;
  confidenceScore: number;
  fluencyScore: number;
  effectivenessScore: number;
  summary: string;
  transcript: Array<{ role: "user" | "assistant"; content: string }>;
}

interface AppState {
  callHistory: CallRecord[];
  streak: number;
  lastPracticeDate: string | null;
  totalCalls: number;
  bestScore: number;
  theme: "light" | "dark" | "system";
  favoritePhraseIds: string[];
  favoriteScriptIds: string[];
  voiceMode: VoiceMode;
  voiceDebug: boolean;
  /** true when some stored data was corrupt at startup and was reset to defaults (I10). */
  storageRecovered: boolean;
  dismissStorageRecovered: () => void;
  setVoiceMode: (m: VoiceMode) => Promise<void>;
  setVoiceDebug: (on: boolean) => Promise<void>;
  addCallRecord: (record: CallRecord) => Promise<void>;
  setTheme: (theme: "light" | "dark" | "system") => Promise<void>;
  toggleFavoritePhrase: (id: string) => Promise<void>;
  toggleFavoriteScript: (id: string) => Promise<void>;
}

export const AppContext = createContext<AppState | null>(null);

const HISTORY_KEY = "call_history";
const SETTINGS_KEY = "app_settings";
const STREAK_KEY = "streak_data";
const FAVORITES_KEY = "favorites_v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastPracticeDate, setLastPracticeDate] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");
  const [favoritePhraseIds, setFavoritePhraseIds] = useState<string[]>([]);
  const [favoriteScriptIds, setFavoriteScriptIds] = useState<string[]>([]);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [storageRecovered, setStorageRecovered] = useState(false);
  // Latest values for async writers, so two quick saves never build from a stale closure (I12).
  const historyRef = useRef<CallRecord[]>([]);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);
  const streakRef = useRef<{ streak: number; lastDate: string | null }>({ streak: 0, lastDate: null });
  // All AsyncStorage writes go through one queue so a slow older write can't land after a newer one.
  const writeQueue = useRef(createWriteQueue()).current;
  const write = (key: string, value: unknown) => writeQueue(() => AsyncStorage.setItem(key, JSON.stringify(value)));

  useEffect(() => {
    loadData().catch(() => setStorageRecovered(true));
  }, []);

  // I10: every key is parsed defensively; corrupt data falls back to defaults and is rewritten.
  async function loadData() {
    let raws: (string | null)[] = [null, null, null, null];
    try {
      raws = await Promise.all([
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(STREAK_KEY),
        AsyncStorage.getItem(FAVORITES_KEY),
      ]);
    } catch {
      setStorageRecovered(true);
      return;
    }
    const [historyRaw, settingsRaw, streakRaw, favRaw] = raws;
    const h = safeParse(historyRaw ?? null, validateHistory, []);
    const st = safeParse(settingsRaw ?? null, validateSettings, DEFAULT_SETTINGS);
    const sk = safeParse(streakRaw ?? null, validateStreak, { streak: 0, lastDate: null });
    const fv = safeParse(favRaw ?? null, validateFavorites, { phrases: [], scripts: [] });

    historyRef.current = h.value;
    setCallHistory(h.value);
    settingsRef.current = st.value;
    setSettings(st.value);
    setThemeState(st.value.theme);
    streakRef.current = sk.value;
    setStreak(sk.value.streak);
    setLastPracticeDate(sk.value.lastDate);
    setFavoritePhraseIds(fv.value.phrases);
    setFavoriteScriptIds(fv.value.scripts);

    // Keep the unreadable blob under "<key>.corrupt" (one per key) before resetting to defaults.
    const resets: Promise<void>[] = [];
    const reset = (key: string, raw: string | null | undefined, value: unknown) =>
      resets.push(writeQueue(async () => {
        if (raw != null) await AsyncStorage.setItem(corruptBackupKey(key), raw);
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }));
    if (h.corrupted) reset(HISTORY_KEY, historyRaw, h.value);
    if (st.corrupted) reset(SETTINGS_KEY, settingsRaw, st.value);
    if (sk.corrupted) reset(STREAK_KEY, streakRaw, sk.value);
    if (fv.corrupted) reset(FAVORITES_KEY, favRaw, fv.value);
    if (resets.length) {
      setStorageRecovered(true);
      await Promise.all(resets).catch(() => {});
    }
  }

  async function saveFavorites(phrases: string[], scripts: string[]) {
    await write(FAVORITES_KEY, { phrases, scripts });
  }

  async function toggleFavoritePhrase(id: string) {
    const updated = favoritePhraseIds.includes(id)
      ? favoritePhraseIds.filter(i => i !== id)
      : [...favoritePhraseIds, id];
    setFavoritePhraseIds(updated);
    await saveFavorites(updated, favoriteScriptIds);
  }

  async function toggleFavoriteScript(id: string) {
    const updated = favoriteScriptIds.includes(id)
      ? favoriteScriptIds.filter(i => i !== id)
      : [...favoriteScriptIds, id];
    setFavoriteScriptIds(updated);
    await saveFavorites(favoritePhraseIds, updated);
  }

  async function addCallRecord(record: CallRecord) {
    const updated = appendRecord(historyRef.current, record);
    historyRef.current = updated;
    setCallHistory(updated);
    await write(HISTORY_KEY, updated);

    const cur = streakRef.current;
    const next = nextStreak(cur.streak, cur.lastDate);
    if (next.lastDate !== cur.lastDate || next.streak !== cur.streak) {
      streakRef.current = next;
      setStreak(next.streak);
      setLastPracticeDate(next.lastDate);
      await write(STREAK_KEY, next);
    }
  }

  async function saveSettings(patch: Partial<AppSettings>) {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    await write(SETTINGS_KEY, next);
  }

  async function setTheme(t: "light" | "dark" | "system") {
    setThemeState(t);
    await saveSettings({ theme: t });
  }
  const setVoiceMode = (m: VoiceMode) => saveSettings({ voiceMode: m });
  const setVoiceDebug = (on: boolean) => saveSettings({ voiceDebug: on });

  const totalCalls = callHistory.length;
  const bestScore = callHistory.length > 0 ? Math.max(...callHistory.map(c => c.overallScore)) : 0;

  return (
    <AppContext.Provider value={{
      callHistory, streak, lastPracticeDate, totalCalls, bestScore, theme,
      favoritePhraseIds, favoriteScriptIds,
      voiceMode: settings.voiceMode, voiceDebug: settings.voiceDebug, storageRecovered,
      dismissStorageRecovered: () => setStorageRecovered(false),
      setVoiceMode, setVoiceDebug,
      addCallRecord, setTheme, toggleFavoritePhrase, toggleFavoriteScript,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
