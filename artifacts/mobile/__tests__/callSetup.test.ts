import { SCENARIOS, PERSONALITIES, OBJECTIONS } from "@/constants/database";
import { US_SCENARIOS, US_OBJECTIONS } from "@/constants/usPacks";
import { buildOpening, buildPrompt, personaFor } from "@/services/callSetup";

const dentist = SCENARIOS.find(s => s.id === "us_dentist_web")!;

describe("I18 opener from persona", () => {
  test("no scenario/mode/difficulty ever produces a [placeholder]", () => {
    for (const s of SCENARIOS) for (const m of ["decision_maker", "gatekeeper"] as const)
      for (const d of ["easy", "medium", "hard"] as const) for (const r of [0, 0.5, 0.99]) {
        const line = buildOpening(s, m, d, () => r);
        expect(line).not.toMatch(/\[|\]/);
        expect(line.length).toBeGreaterThan(2);
      }
  });
  test("opener uses the scenario persona name", () => {
    expect(buildOpening(dentist, "decision_maker", "medium", () => 0)).toContain("Dr. Miller");
    expect(buildOpening(dentist, "gatekeeper", "medium", () => 0)).toContain("Jenny");
    expect(buildOpening(dentist, "gatekeeper", "medium", () => 0)).toContain("Bright Smile Dental");
  });
  test("legacy scenarios get a stable generated name", () => {
    const s = SCENARIOS[0]!;
    expect(personaFor(s)).toEqual(personaFor(s));
  });
});

describe("F4/F6/F7 content", () => {
  test("12 US scenario packs: 6 businesses x 2 offers, all registered", () => {
    expect(US_SCENARIOS).toHaveLength(12);
    for (const k of ["dentist", "roofer", "restaurant", "salon", "hvac", "law"])
      for (const o of ["web", "ai"]) expect(SCENARIOS.some(s => s.id === `us_${k}_${o}`)).toBe(true);
    expect(new Set(SCENARIOS.map(s => s.id)).size).toBe(SCENARIOS.length);
  });
  test("US objection library covers the required objections with model answers", () => {
    const msgs = US_OBJECTIONS.map(o => o.customerMessage.toLowerCase()).join("|");
    for (const k of ["send me an email", "nephew", "budget", "not interested", "get my number"]) expect(msgs).toContain(k);
    for (const o of US_OBJECTIONS) expect(o.aiResponse.length).toBeGreaterThan(30);
    expect(OBJECTIONS.filter(o => o.id.startsWith("us_obj_"))).toHaveLength(US_OBJECTIONS.length);
  });
  test("gatekeeper prompt adds receptionist role; difficulty text differs", () => {
    const p = PERSONALITIES[0]!;
    const gk = buildPrompt(dentist, p, "hard", "gatekeeper");
    expect(gk).toContain("GATEKEEPER MODE");
    expect(gk).toContain("Jenny");
    expect(buildPrompt(dentist, p, "easy")).not.toContain("GATEKEEPER");
    expect(buildPrompt(dentist, p, "easy")).not.toEqual(buildPrompt(dentist, p, "hard"));
  });
});
