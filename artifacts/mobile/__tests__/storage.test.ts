import { appendRecord, DEFAULT_SETTINGS, MAX_HISTORY, nextStreak, safeParse, validateHistory, validateSettings, validateStreak } from "@/services/storage";
import type { CallRecord } from "@/contexts/AppContext";

const rec = (id: string): CallRecord => ({
  id, scenarioId: "s", scenarioTitle: "T", personalityName: "P", date: "2026-10-30T00:00:00Z", duration: 60,
  overallScore: 7, confidenceScore: 6, fluencyScore: 7, effectivenessScore: 8, summary: "ok", transcript: [],
});

describe("I10 safe storage parse", () => {
  test("corrupt JSON returns fallback and flags corrupted (no throw)", () => {
    const r = safeParse("{not json", validateHistory, []);
    expect(r).toEqual({ value: [], corrupted: true });
  });
  test("wrong shape (object instead of array) is treated as corrupt", () => {
    expect(safeParse('{"a":1}', validateHistory, []).corrupted).toBe(true);
  });
  test("missing key is not corrupt", () => {
    expect(safeParse(null, validateHistory, [])).toEqual({ value: [], corrupted: false });
  });
  test("malformed records are dropped, valid ones kept", () => {
    const raw = JSON.stringify([rec("1"), { id: 2 }, "x", rec("3")]);
    expect(safeParse(raw, validateHistory, []).value.map(r => r.id)).toEqual(["1", "3"]);
  });
  test("settings: unknown values fall back, voice flag defaults off", () => {
    expect(validateSettings({ theme: "neon", voiceMode: "rocket" })).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.voiceMode).toBe("off");
    expect(validateSettings({ theme: "dark", voiceMode: "live", voiceDebug: false })).toEqual({ theme: "dark", voiceMode: "live", voiceDebug: false });
  });
  test("streak: negative/NaN becomes 0", () => {
    expect(validateStreak({ streak: -3, lastDate: 5 })).toEqual({ streak: 0, lastDate: null });
  });
});

describe("I11/I12 history append", () => {
  test("no 50-call cap: 120 records are all kept", () => {
    let h: CallRecord[] = [];
    for (let i = 0; i < 120; i++) h = appendRecord(h, rec(String(i)));
    expect(h).toHaveLength(120);
    expect(h[0]!.id).toBe("119");
  });
  test("safety ceiling only applies above MAX_HISTORY", () => {
    expect(MAX_HISTORY).toBeGreaterThanOrEqual(1000);
    expect(appendRecord([rec("a"), rec("b")], rec("c"), 2).map(r => r.id)).toEqual(["c", "a"]);
  });
  test("two quick saves from the same base both survive when chained from latest value", () => {
    const base: CallRecord[] = [];
    const afterFirst = appendRecord(base, rec("x"));
    const afterSecond = appendRecord(afterFirst, rec("y"));
    expect(afterSecond.map(r => r.id)).toEqual(["y", "x"]);
  });
  test("duplicate id is not stored twice", () => {
    expect(appendRecord([rec("x")], rec("x"))).toHaveLength(1);
  });
  test("streak increments on consecutive days, resets after a gap, unchanged same day", () => {
    const now = new Date("2026-10-30T10:00:00Z");
    expect(nextStreak(3, "2026-10-29", now)).toEqual({ streak: 4, lastDate: "2026-10-30" });
    expect(nextStreak(3, "2026-10-20", now)).toEqual({ streak: 1, lastDate: "2026-10-30" });
    expect(nextStreak(3, "2026-10-30", now)).toEqual({ streak: 3, lastDate: "2026-10-30" });
  });
});

import { corruptBackupKey, createWriteQueue } from "@/services/storage";

describe("QA fixes: write queue + corrupt backup key", () => {
  test("20 parallel saves with out-of-order completion keep all 20 records", async () => {
    let stored = "[]";
    // Mock setItem whose completion order is reversed (later calls finish first) when unqueued.
    let n = 0;
    const setItem = (v: string) => new Promise<void>(res => { const d = 50 - (n++ % 20) * 2; setTimeout(() => { stored = v; res(); }, d); });
    const enqueue = createWriteQueue();
    let mem: { id: string }[] = [];
    await Promise.all(Array.from({ length: 20 }, (_, i) => {
      mem = [{ id: `r${i}` }, ...mem];
      const snap = JSON.stringify(mem);
      return enqueue(() => setItem(snap));
    }));
    expect(JSON.parse(stored)).toHaveLength(20);
  });
  test("unqueued baseline would lose records (proves the mock is out-of-order)", async () => {
    let stored = "[]"; let n = 0;
    const setItem = (v: string) => new Promise<void>(res => { const d = 50 - (n++ % 20) * 2; setTimeout(() => { stored = v; res(); }, d); });
    let mem: { id: string }[] = [];
    await Promise.all(Array.from({ length: 20 }, (_, i) => { mem = [{ id: `r${i}` }, ...mem]; return setItem(JSON.stringify(mem)); }));
    expect(JSON.parse(stored).length).toBeLessThan(20);
  });
  test("queue continues after a failed write", async () => {
    const enqueue = createWriteQueue();
    const a = enqueue(async () => { throw new Error("x"); });
    const b = enqueue(async () => 42);
    await expect(a).rejects.toThrow("x");
    await expect(b).resolves.toBe(42);
  });
  test("backup key is one per key", () => {
    expect(corruptBackupKey("call_history")).toBe("call_history.corrupt");
  });
});
