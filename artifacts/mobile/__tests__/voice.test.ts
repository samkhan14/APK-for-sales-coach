import { base64ToBytes, bytesToBase64, downsample, encodeWav, floatToPcm16Base64, pcm16Base64ToFloat } from "@/services/voice/pcm";
import { LatencyTracker } from "@/services/voice/latency";
import { EnergyVad, splitSentences } from "@/services/voice/vad";
import { buildSetupMessage, GeminiLiveSession, LIVE_WS_URL, type WsLike } from "@/services/voice/geminiLive";
import { ChainedTurnRunner } from "@/services/voice/chained";
import { fetchLiveToken } from "@/services/voice/voiceProxy";

describe("pcm", () => {
  test("base64 round-trip matches Node Buffer for all padding cases", () => {
    for (const n of [0, 1, 2, 3, 10, 257]) {
      const b = new Uint8Array(n).map((_, i) => (i * 37) & 255);
      expect(bytesToBase64(b)).toBe(Buffer.from(b).toString("base64"));
      expect(Array.from(base64ToBytes(bytesToBase64(b)))).toEqual(Array.from(b));
    }
  });
  test("float -> pcm16 -> float is lossless within 1 LSB", () => {
    const f = new Float32Array([0, 0.5, -0.5, 1, -1, 0.123]);
    const back = pcm16Base64ToFloat(floatToPcm16Base64(f));
    f.forEach((v, i) => expect(Math.abs(back[i]! - v)).toBeLessThan(1 / 30000));
  });
  test("downsample 48k->16k length and WAV header", () => {
    expect(downsample(new Float32Array(4800), 48000, 16000)).toHaveLength(1600);
    const wav = encodeWav(new Float32Array(16000), 16000);
    expect(wav.length).toBe(44 + 32000);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe("RIFF");
  });
});

describe("latency + VAD", () => {
  test("tracker measures speech-end -> first audio and barge-in stop", () => {
    let t = 1000;
    const tr = new LatencyTracker(() => t);
    tr.markSpeechEnd(); t = 1700; tr.markFirstAudio(); t = 1800; tr.markFirstAudio(); // second chunk ignored
    tr.markBargeIn(); t = 1950; tr.markPlaybackStopped();
    expect(tr.snapshot).toMatchObject({ turns: 1, lastResponseMs: 700, avgResponseMs: 700, lastBargeInStopMs: 150, bargeIns: 1 });
  });
  test("VAD fires start after min speech and end after silence", () => {
    const v = new EnergyVad({ threshold: 0.02, silenceMs: 600, minSpeechMs: 200 });
    expect(v.feed(0.1, 100)).toBeNull();
    expect(v.feed(0.1, 100)).toBe("speech_start");
    for (let i = 0; i < 5; i++) expect(v.feed(0.001, 100)).toBeNull();
    expect(v.feed(0.001, 100)).toBe("speech_end");
  });
  test("sentence split merges tiny fragments", () => {
    expect(splitSentences("Yeah. I'm busy right now. What is this about?")).toEqual(["Yeah. I'm busy right now.", "What is this about?"]);
  });
});

class FakeWs implements WsLike {
  sent: any[] = [];
  onopen: WsLike["onopen"] = null; onmessage: WsLike["onmessage"] = null; onerror: WsLike["onerror"] = null; onclose: WsLike["onclose"] = null;
  constructor(public url: string) {}
  send(d: string) { this.sent.push(JSON.parse(d)); }
  close() { this.onclose?.({ code: 1000 }); }
  server(m: object) { this.onmessage?.({ data: JSON.stringify(m) }); }
}

describe("Gemini Live session (mock socket)", () => {
  test("setup, audio, transcripts, barge-in and turns", async () => {
    let ws!: FakeWs;
    const ev: string[] = [];
    const turns: [string, string][] = [];
    const s = new GeminiLiveSession({
      token: "auth_tokens/abc", model: "gemini-3.8-live", systemInstruction: "You are Mike",
      wsFactory: u => (ws = new FakeWs(u)),
      callbacks: { onAudio: () => ev.push("audio"), onInterrupted: () => ev.push("interrupted"), onTurn: (r, t) => turns.push([r, t]) },
    });
    const p = s.connect();
    expect(ws.url).toBe(`${LIVE_WS_URL}?access_token=auth_tokens%2Fabc`);
    ws.onopen?.();
    expect(ws.sent[0].setup.model).toBe("models/gemini-3.8-live");
    expect(ws.sent[0].setup.generationConfig.responseModalities).toEqual(["AUDIO"]);
    ws.server({ setupComplete: {} });
    await p;
    s.sendAudio("AAAA");
    expect(ws.sent[1]).toEqual({ realtimeInput: { audio: { data: "AAAA", mimeType: "audio/pcm;rate=16000" } } });
    ws.server({ serverContent: { inputTranscription: { text: "Hi, is this " } } });
    ws.server({ serverContent: { inputTranscription: { text: "Mike?" } } });
    ws.server({ serverContent: { outputTranscription: { text: "Yeah, who's" }, modelTurn: { parts: [{ inlineData: { data: "AAA=" } }] } } });
    ws.server({ serverContent: { interrupted: true } });
    ws.server({ serverContent: { turnComplete: true } });
    expect(ev).toEqual(["audio", "interrupted"]);
    expect(turns).toEqual([["user", "Hi, is this Mike?"], ["assistant", "Yeah, who's"]]);
  });
  test("setup message keeps the API key out (uses token only) and enables barge-in", () => {
    const m = buildSetupMessage({ model: "x", systemInstruction: "s" });
    expect(JSON.stringify(m)).not.toMatch(/key/i);
    expect(m.setup.realtimeInputConfig.activityHandling).toBe("START_OF_ACTIVITY_INTERRUPTS");
  });
});

describe("chained fallback (mocked STT/LLM/TTS)", () => {
  test("plays sentences in order and reports first audio", async () => {
    const played: string[] = [];
    let first = 0;
    const r = new ChainedTurnRunner({
      transcribe: async () => "Hi, this is Ali from Syncognify",
      chat: async () => "Okay. I've got two minutes. What do you want?",
      synthesize: async s => ({ audio: s, sampleRate: 24000 }),
      play: async a => { played.push(a); },
    });
    const res = await r.run(new Uint8Array(10), [], "sys", () => first++);
    expect(res).toEqual({ userText: "Hi, this is Ali from Syncognify", aiText: "Okay. I've got two minutes. What do you want?", aborted: false });
    expect(played).toEqual(["Okay. I've got two minutes.", "What do you want?"]);
    expect(first).toBe(1);
  });
  test("barge-in abort stops remaining sentences", async () => {
    const played: string[] = [];
    const r: ChainedTurnRunner = new ChainedTurnRunner({
      transcribe: async () => "hello",
      chat: async () => "First sentence here. Second sentence here.",
      synthesize: async s => ({ audio: s, sampleRate: 24000 }),
      play: async a => { played.push(a); r.abort(); },
    });
    expect((await r.run(new Uint8Array(1), [], "s")).aborted).toBe(true);
    expect(played).toHaveLength(1);
  });
});

test("live token comes from our proxy with the app token, never a Google key", async () => {
  const calls: any[] = [];
  const fetchImpl = (async (url: string, init: any) => { calls.push({ url, init }); return { ok: true, json: async () => ({ token: "auth_tokens/x", model: "gemini-3.8-live", expiresAt: "z" }) }; }) as unknown as typeof fetch;
  const t = await fetchLiveToken({ url: "https://proxy.example", token: "apptok", fetchImpl });
  expect(t.token).toBe("auth_tokens/x");
  expect(calls[0].url).toBe("https://proxy.example/live-token");
  expect(calls[0].init.headers.Authorization).toBe("Bearer apptok");
});
