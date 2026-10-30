// Mocked end-to-end: US scenario -> persona prompt/opener -> (voice) transcript -> scoring -> history record.
import { SCENARIOS, PERSONALITIES } from "@/constants/database";
import { buildOpening, buildPrompt } from "@/services/callSetup";
import { scoreCall, type ChatFn } from "@/services/scoring";

const goodFeedback = {
  confidenceScore: 7, fluencyScore: 8, effectivenessScore: 6, overallScore: 7,
  strengths: ["Clear opener"], weakPoints: ["No next step"], suggestedResponses: ["Can I send a 2-minute demo?"],
  closingStatement: "Thanks Mike, talk Tuesday.", summary: "Solid opener. Missed the close.",
};

test("gatekeeper call on a US pack: context reaches the model and scoring", async () => {
  const scenario = SCENARIOS.find(s => s.id === "us_dentist_ai")!;
  expect(scenario).toBeDefined();
  const persona = PERSONALITIES[0]!;
  const system = buildPrompt(scenario, persona, "hard", "gatekeeper");
  expect(system).toContain(scenario.receptionistName!);
  expect(system).toContain(scenario.businessName!);
  const opener = buildOpening(scenario, "gatekeeper", "hard", () => 0);
  expect(opener).toContain(scenario.businessName!);

  // transcript as built by appendVoiceTurn during a voice call
  const transcript = [
    { role: "assistant" as const, content: opener },
    { role: "user" as const, content: "Hi, could I speak with the owner about missed after-hours calls?" },
    { role: "assistant" as const, content: "What's this regarding?" },
  ];
  const seen: any[] = [];
  const chat: ChatFn = async (msgs, opts) => { seen.push({ msgs, opts }); return { text: JSON.stringify(goodFeedback), provider: "mock" }; };
  const res = await scoreCall(transcript, scenario.title, chat);
  expect(res).toEqual({ ok: true, feedback: goodFeedback, provider: "mock" });
  expect(seen[0].opts.json).toBe(true);
  expect(seen[0].opts.system).toContain(scenario.title);
  expect(seen[0].msgs[0].content).toContain("SALESPERSON: Hi, could I speak with the owner");
  expect(seen[0].msgs[0].content).toContain(`CUSTOMER: ${opener}`);
});

test("bad model JSON never yields a fake score", async () => {
  const res = await scoreCall([{ role: "user", content: "hi" }], "x", async () => ({ text: "```json{}```", provider: "m" }));
  expect(res.ok).toBe(false);
});
