// Key storage, validation, chat fallback chain and the setup gate. No real keys, no network:
// fetch is mocked, so these tests prove the app logic only, not that real keys work.
jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
import {
  checkKeyFormat, clearAllKeys, clearKey, getKeys, hasAllKeys, hasRequiredKeys, isRequired, loadKeys, maskKey, missingProviders, normalizeKey,
  onKeysChanged, PROVIDER_INFO, voiceAvailability, effectiveVoiceMode, requireKey, saveKey, setKeyBackend, MissingKeyError,
} from "@/services/keys/keyStore";
import { gateState } from "@/services/keys/gate";
import { aiChat, testKey } from "@/services/directClient";

const G = "placeholder-gemini-key-000001";
const Q = "placeholder-groq-key-00000002";
const R = "placeholder-openrouter-key-03";

function memBackend() {
  const m = new Map<string, string>();
  return { m, b: { get: async (n: string) => m.get(n) ?? null, set: async (n: string, v: string) => { m.set(n, v); }, remove: async (n: string) => { m.delete(n); } } };
}

describe("key store", () => {
  let mem: ReturnType<typeof memBackend>;
  beforeEach(() => { mem = memBackend(); setKeyBackend(mem.b); });

  test("save, load, clear round-trip; paste whitespace is stripped", async () => {
    await saveKey("gemini", `  ${G}\n`);
    expect(mem.m.get("byok_gemini_key")).toBe(G);
    setKeyBackend(mem.b); // drop cache, read from backend
    expect((await loadKeys()).gemini).toBe(G);
    await clearKey("gemini");
    expect((await getKeys()).gemini).toBeUndefined();
    expect(mem.m.size).toBe(0);
  });
  test("rejects empty / short / bad characters and does not store them", async () => {
    await expect(saveKey("groq", "")).rejects.toThrow("empty");
    await expect(saveKey("groq", "abc")).rejects.toThrow("too short");
    await expect(saveKey("groq", "abc def ghi jkl mno pqr stu!!")).rejects.toThrow("unexpected");
    expect(mem.m.size).toBe(0);
  });
  test("format helpers", () => {
    expect(normalizeKey(" a b\n")).toBe("ab");
    expect(checkKeyFormat("openrouter", R)).toBeNull();
    expect(maskKey(G)).toBe("plac••••0001");
    expect(maskKey(undefined)).toBe("Not set");
    expect(maskKey(G)).not.toContain("gemini-key");
  });
  test("change listener fires and requireKey throws when missing", async () => {
    const seen: any[] = [];
    const off = onKeysChanged(k => seen.push(k));
    await saveKey("groq", Q);
    off();
    expect(seen.at(-1).groq).toBe(Q);
    await expect(requireKey("gemini")).rejects.toBeInstanceOf(MissingKeyError);
    await clearAllKeys();
    expect(await getKeys()).toEqual({});
  });
  test("only OpenRouter is required; all providers have https create links", () => {
    expect(isRequired("openrouter")).toBe(true);
    expect(isRequired("gemini")).toBe(false);
    expect(isRequired("groq")).toBe(false);
    expect(missingProviders({ gemini: G })).toEqual(["openrouter"]);
    expect(missingProviders({ openrouter: R })).toEqual([]);
    expect(hasRequiredKeys({ gemini: G, groq: Q })).toBe(false);
    expect(hasRequiredKeys({ openrouter: R })).toBe(true);
    expect(hasAllKeys({ gemini: G, groq: Q, openrouter: R })).toBe(true);
    expect(PROVIDER_INFO.gemini.createUrl).toBe("https://aistudio.google.com/apikey");
    expect(PROVIDER_INFO.groq.createUrl).toBe("https://console.groq.com/keys");
    expect(PROVIDER_INFO.openrouter.createUrl).toBe("https://openrouter.ai/keys");
  });
});

describe("setup gate", () => {
  test("loading until keys are read", () => expect(gateState(false, {}).status).toBe("loading"));
  test("first launch (no keys) shows setup needing only OpenRouter", () => expect(gateState(true, {})).toEqual({ status: "setup", missing: ["openrouter"] }));
  test("Gemini + Groq without OpenRouter still blocks the app", () => {
    expect(gateState(true, { gemini: G, groq: Q })).toEqual({ status: "setup", missing: ["openrouter"] });
  });
  test("OpenRouter alone lets the app proceed; clearing optional keys keeps it ready", () => {
    expect(gateState(true, { openrouter: R })).toEqual({ status: "ready" });
    expect(gateState(true, { groq: Q, openrouter: R })).toEqual({ status: "ready" });
    expect(gateState(true, { gemini: G, openrouter: R })).toEqual({ status: "ready" });
  });
  test("all keys present lets the app proceed", () => expect(gateState(true, { gemini: G, groq: Q, openrouter: R })).toEqual({ status: "ready" }));
});

type Call = { url: string; init: any };
function fakeFetch(handler: (url: string) => { status: number; body?: unknown }) {
  const calls: Call[] = [];
  const f = (async (url: string, init: any) => {
    calls.push({ url, init });
    const r = handler(url);
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body };
  }) as unknown as typeof fetch;
  return { f, calls };
}

describe("key Test button (mocked HTTP)", () => {
  test("Gemini: 200 -> OK, uses x-goog-api-key header not the URL", async () => {
    const { f, calls } = fakeFetch(() => ({ status: 200, body: {} }));
    expect(await testKey("gemini", G, { fetchImpl: f })).toEqual({ ok: true, message: "Key works." });
    expect(calls[0].url).not.toContain(G);
    expect(calls[0].init.headers["x-goog-api-key"]).toBe(G);
  });
  test("Groq 401 -> rejected message; OpenRouter 429 -> rate-limited; 500 -> provider problem", async () => {
    expect((await testKey("groq", Q, { fetchImpl: fakeFetch(() => ({ status: 401 })).f })).message).toMatch(/rejected/);
    expect((await testKey("openrouter", R, { fetchImpl: fakeFetch(() => ({ status: 429 })).f })).message).toMatch(/rate-limited/);
    expect((await testKey("openrouter", R, { fetchImpl: fakeFetch(() => ({ status: 503 })).f })).ok).toBe(false);
  });
  test("network failure gives a clear message and never echoes the key", async () => {
    const f = (async () => { throw new Error("boom"); }) as unknown as typeof fetch;
    const r = await testKey("groq", Q, { fetchImpl: f });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/internet/);
    expect(r.message).not.toContain(Q);
  });
  test("each provider is checked at its own endpoint", async () => {
    const { f, calls } = fakeFetch(() => ({ status: 200 }));
    await testKey("gemini", G, { fetchImpl: f }); await testKey("groq", Q, { fetchImpl: f }); await testKey("openrouter", R, { fetchImpl: f });
    expect(calls.map(c => new URL(c.url).host)).toEqual(["generativelanguage.googleapis.com", "api.groq.com", "openrouter.ai"]);
  });
});

describe("chat chain: Gemini -> Groq -> OpenRouter (whichever keys exist)", () => {
  const keys = { gemini: G, groq: Q, openrouter: R };
  const ok = (text: string) => ({ status: 200, body: { candidates: [{ content: { parts: [{ text }] } }], choices: [{ message: { content: text } }] } });
  test("Gemini answers first", async () => {
    const { f, calls } = fakeFetch(() => ok("hi"));
    expect(await aiChat([{ role: "user", content: "x" }], {}, { keys, fetchImpl: f })).toEqual({ text: "hi", provider: "gemini" });
    expect(calls).toHaveLength(1);
  });
  test("Gemini down -> Groq", async () => {
    const { f } = fakeFetch(u => (u.includes("googleapis") ? { status: 503 } : ok("groq says")));
    expect(await aiChat([{ role: "user", content: "x" }], {}, { keys, fetchImpl: f })).toEqual({ text: "groq says", provider: "groq" });
  });
  test("Gemini + Groq down -> OpenRouter with a free model", async () => {
    const { f, calls } = fakeFetch(u => (u.includes("openrouter") ? ok("or says") : { status: 500 }));
    const r = await aiChat([{ role: "user", content: "x" }], { system: "s" }, { keys, fetchImpl: f });
    expect(r.provider).toBe("openrouter");
    const orCall = calls.find(c => c.url.includes("openrouter"))!;
    expect(JSON.parse(orCall.init.body).model).toMatch(/free/);
    expect(orCall.init.headers.Authorization).toBe(`Bearer ${R}`);
  });
  test("all down -> throws, error text has no keys", async () => {
    const { f } = fakeFetch(() => ({ status: 500 }));
    const err = await aiChat([{ role: "user", content: "x" }], {}, { keys, fetchImpl: f }).then(() => new Error("unexpected success"), (e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    for (const k of [G, Q, R]) expect(err.message).not.toContain(k);
  });
  test("only OpenRouter set -> uses it alone, never calls Gemini or Groq", async () => {
    const { f, calls } = fakeFetch(() => ok("or only"));
    expect(await aiChat([{ role: "user", content: "x" }], {}, { keys: { openrouter: R }, fetchImpl: f })).toEqual({ text: "or only", provider: "openrouter" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("openrouter");
  });
  test("Groq + OpenRouter (no Gemini) -> Groq first, skips Gemini", async () => {
    const { f, calls } = fakeFetch(() => ok("groq"));
    expect((await aiChat([{ role: "user", content: "x" }], {}, { keys: { groq: Q, openrouter: R }, fetchImpl: f })).provider).toBe("groq");
    expect(calls.some(c => c.url.includes("googleapis"))).toBe(false);
  });
  test("Gemini + OpenRouter (no Groq), Gemini down -> OpenRouter", async () => {
    const { f, calls } = fakeFetch(u => (u.includes("googleapis") ? { status: 503 } : ok("or")));
    expect((await aiChat([{ role: "user", content: "x" }], {}, { keys: { gemini: G, openrouter: R }, fetchImpl: f })).provider).toBe("openrouter");
    expect(calls.some(c => c.url.includes("groq"))).toBe(false);
  });
});

describe("voice availability by keys", () => {
  test("Off always available", () => expect(voiceAvailability({}, "off")).toEqual({ ok: true, message: null }));
  test("Live needs Gemini", () => {
    expect(voiceAvailability({ openrouter: R }, "live")).toEqual({ ok: false, message: "Add a Gemini key to use Live voice." });
    expect(voiceAvailability({ gemini: G, openrouter: R }, "live").ok).toBe(true);
  });
  test("Fallback needs Groq + Gemini, with a clear message for what is missing", () => {
    expect(voiceAvailability({ openrouter: R }, "chained").message).toBe("Add Groq and Gemini keys to use Fallback voice.");
    expect(voiceAvailability({ groq: Q, openrouter: R }, "chained").message).toBe("Add a Gemini key to use Fallback voice.");
    expect(voiceAvailability({ gemini: G, openrouter: R }, "chained").message).toBe("Add a Groq key to use Fallback voice.");
    expect(voiceAvailability({ gemini: G, groq: Q, openrouter: R }, "chained").ok).toBe(true);
  });
  test("a saved voice mode whose keys were cleared falls back to Off", () => {
    expect(effectiveVoiceMode({ openrouter: R }, "live")).toBe("off");
    expect(effectiveVoiceMode({ gemini: G, openrouter: R }, "chained")).toBe("off");
    expect(effectiveVoiceMode({ gemini: G, groq: Q, openrouter: R }, "chained")).toBe("chained");
  });
});
