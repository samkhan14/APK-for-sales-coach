// Live test against the real proxy. Needs EXPO_PUBLIC_PROXY_URL and EXPO_PUBLIC_APP_TOKEN in env. Prints no secrets.
import { proxyChat, type ChatMessage } from "../services/proxyClient";
import { scoreCall } from "../services/scoring";

const CANNED = [
  "Look, I appreciate you calling, but I'm really tied up right now. Can you make it quick?",
];
const system = "You are a busy small-business owner receiving a cold call. Stay in character. Reply in 1-3 short sentences.";
const userTurns = [
  "Hi, this is Sam from BrightDesk, do you have a minute?",
  "We help small teams cut support response time in half with an AI inbox.",
  "I hear you on price. Most clients recover the cost in the first month.",
  "Could I ask how many support emails your team handles per day?",
  "Would a 15 minute demo on Thursday work for you?",
];
(async () => {
  const msgs: ChatMessage[] = [{ role: "assistant", content: "Hello?" }];
  for (let i = 0; i < userTurns.length; i++) {
    msgs.push({ role: "user", content: userTurns[i]! });
    const r = await proxyChat(msgs, { system });
    const canned = CANNED.includes(r.text);
    console.log(`turn ${i + 1}: provider=${r.provider} replyLength=${r.text.length} canned=${canned}`);
    if (canned || !r.text) throw new Error("canned/empty reply");
    msgs.push({ role: "assistant", content: r.text });
  }
  const s = await scoreCall(msgs, "BrightDesk AI inbox");
  if (!s.ok) throw new Error("scoring failed: " + s.error);
  const f = s.feedback;
  console.log(`scoring: ok=true provider=${s.provider} validJSON=true scores=${f.confidenceScore}/${f.fluencyScore}/${f.effectivenessScore}/${f.overallScore} strengths=${f.strengths.length} weakPoints=${f.weakPoints.length}`);
  console.log("LIVE TEST PASSED");
})().catch(e => { console.error("FAIL", (e as Error).message); process.exit(1); });
