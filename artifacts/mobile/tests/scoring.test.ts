// Run: npx tsx tests/scoring.test.ts  (no network; proxy failure is mocked)
import { strict as assert } from "node:assert";
import { proxyChat, ProxyError } from "../services/proxyClient";
import { scoreCall, parseFeedback, SCORING_FAILED_MESSAGE } from "../services/scoring";

const transcript = [
  { role: "assistant" as const, content: "Hello?" },
  { role: "user" as const, content: "Hi, this is Sam from Acme." },
];
const saved: unknown[] = [];
async function endCallFlow(chat: Parameters<typeof scoreCall>[2]) {
  const r = await scoreCall(transcript, "Test", chat);
  if (r.ok) saved.push(r.feedback); // mirrors app/call.tsx: save only on real feedback
  return r.ok ? "scored" : SCORING_FAILED_MESSAGE;
}

(async () => {
  // 1) proxy 502 via mocked fetch
  const fetch502 = (async () => new Response(JSON.stringify({ error: "upstream_failed" }), { status: 502 })) as typeof fetch;
  await assert.rejects(proxyChat(transcript, {}, { url: "https://x", token: "t", fetchImpl: fetch502 }), ProxyError);
  const ui1 = await endCallFlow((m, o) => proxyChat(m, o, { url: "https://x", token: "t", fetchImpl: fetch502 }));
  assert.equal(ui1, "Scoring failed, try again"); assert.equal(saved.length, 0);
  console.log("PASS proxy 502 -> '" + ui1 + "', saved scores:", saved.length);
  // 2) network error
  const ui2 = await endCallFlow(async () => { throw new ProxyError("Network error"); });
  assert.equal(ui2, SCORING_FAILED_MESSAGE); assert.equal(saved.length, 0);
  console.log("PASS network error -> '" + ui2 + "', saved scores:", saved.length);
  // 3) bad JSON counts as failure
  const ui3 = await endCallFlow(async () => ({ text: "Great call! 8/10", provider: "gemini" }));
  assert.equal(ui3, SCORING_FAILED_MESSAGE); assert.equal(saved.length, 0);
  console.log("PASS non-JSON reply -> '" + ui3 + "', saved scores:", saved.length);
  // 4) out-of-range score rejected
  assert.equal(parseFeedback('{"confidenceScore":11,"fluencyScore":5,"effectivenessScore":5,"overallScore":5,"strengths":["a"],"weakPoints":["b"],"suggestedResponses":["c"],"closingStatement":"d","summary":"e"}'), null);
  console.log("PASS out-of-range score rejected");
  // 5) no proxy config -> failure, not fake score
  const r5 = await scoreCall(transcript, "Test", (m, o) => proxyChat(m, o, { url: "", token: "" }));
  assert.equal(r5.ok, false);
  console.log("PASS unconfigured proxy -> ok=false");
  // 6) valid JSON accepted
  const ui6 = await endCallFlow(async () => ({ text: '{"confidenceScore":7,"fluencyScore":6,"effectivenessScore":5,"overallScore":6,"strengths":["a"],"weakPoints":["b"],"suggestedResponses":["c"],"closingStatement":"d","summary":"e"}', provider: "groq" }));
  assert.equal(ui6, "scored"); assert.equal(saved.length, 1);
  console.log("PASS valid JSON -> scored, saved scores:", saved.length);
  // 7) strict body: fenced / prose-wrapped / extra keys rejected, nothing saved
  const V = '{"confidenceScore":7,"fluencyScore":6,"effectivenessScore":5,"overallScore":6,"strengths":["a"],"weakPoints":["b"],"suggestedResponses":["c"],"closingStatement":"d","summary":"e"}';
  const bad: [string, string][] = [
    ["```json fence", "```json\n" + V + "\n```"],
    ["```JSON fence", "```JSON\n" + V + "\n```"],
    ["bare ``` fence", "```\n" + V + "\n```"],
    ["prose-wrapped", "Here is the score: " + V + " Thanks!"],
    ["extra key", V.slice(0, -1) + ',"extra":1}'],
  ];
  for (const [name, body] of bad) {
    assert.equal(parseFeedback(body), null);
    const ui = await endCallFlow(async () => ({ text: body, provider: "gemini" }));
    assert.equal(ui, SCORING_FAILED_MESSAGE); assert.equal(saved.length, 1);
    console.log("PASS " + name + " -> '" + ui + "', saved scores:", saved.length);
  }
  console.log("ALL SCORING TESTS PASSED");
})().catch(e => { console.error("FAIL", e); process.exit(1); });
