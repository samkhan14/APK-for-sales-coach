import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [historyRaw, settingsRaw, streakRaw, favRaw] = await Promise.all([
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
      AsyncStorage.getItem(STREAK_KEY),
      AsyncStorage.getItem(FAVORITES_KEY),
    ]);
    if (historyRaw) setCallHistory(JSON.parse(historyRaw));
    if (settingsRaw) {
      const s = JSON.parse(settingsRaw);
      if (s.theme) setThemeState(s.theme);
    }
    if (streakRaw) {
      const s = JSON.parse(streakRaw);
      setStreak(s.streak || 0);
      setLastPracticeDate(s.lastDate || null);
    }
    if (favRaw) {
      const f = JSON.parse(favRaw);
      setFavoritePhraseIds(f.phrases || []);
      setFavoriteScriptIds(f.scripts || []);
    }
  }

  async function saveFavorites(phrases: string[], scripts: string[]) {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify({ phrases, scripts }));
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
    const updated = [record, ...callHistory].slice(0, 50);
    setCallHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    const today = new Date().toISOString().split("T")[0]!;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;
    let newStreak = streak;
    if (lastPracticeDate !== today) {
      newStreak = lastPracticeDate === yesterday ? streak + 1 : 1;
      setStreak(newStreak);
      setLastPracticeDate(today);
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ streak: newStreak, lastDate: today }));
    }
  }

  async function setTheme(t: "light" | "dark" | "system") {
    setThemeState(t);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: t }));
  }

  const totalCalls = callHistory.length;
  const bestScore = callHistory.length > 0 ? Math.max(...callHistory.map(c => c.overallScore)) : 0;

  return (
    <AppContext.Provider value={{
      callHistory, streak, lastPracticeDate, totalCalls, bestScore, theme,
      favoritePhraseIds, favoriteScriptIds,
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
