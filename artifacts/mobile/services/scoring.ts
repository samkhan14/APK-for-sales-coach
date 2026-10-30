import { proxyChat, type ChatMessage, type ProxyReply } from "./proxyClient";

export interface CallFeedback {
  confidenceScore: number;
  fluencyScore: number;
  effectivenessScore: number;
  overallScore: number;
  strengths: string[];
  weakPoints: string[];
  suggestedResponses: string[];
  closingStatement: string;
  summary: string;
}

export type ScoringResult =
  | { ok: true; feedback: CallFeedback; provider: string }
  | { ok: false; error: string };

export const SCORING_FAILED_MESSAGE = "Scoring failed, try again";

export function buildScoringPrompt(scenarioTitle: string): string {
  return `You are an expert sales coach scoring a cold-call practice session.
The salesperson was pitching: ${scenarioTitle}.

SCORING RUBRIC (integers 1-10 only):
- confidenceScore: 1-3 hesitant/apologetic, filler-heavy; 4-6 steady but passive; 7-8 assertive, owns the call; 9-10 calm authority under pushback.
- fluencyScore: 1-3 broken/unclear sentences; 4-6 understandable but clunky; 7-8 smooth and concise; 9-10 natural, crisp, no rambling.
- effectivenessScore: 1-3 no value prop, ignores objections; 4-6 generic pitch, weak objection handling; 7-8 asks discovery questions, handles objections with specifics; 9-10 earns a clear next step (meeting/demo/follow-up).
- overallScore: holistic, must be within 2 points of the average of the three scores above.
Base scores ONLY on what the SALESPERSON said. A very short or empty attempt scores low.

Return ONLY one JSON object, no markdown, no extra text, exactly these keys:
{"confidenceScore":int,"fluencyScore":int,"effectivenessScore":int,"overallScore":int,"strengths":[string,...],"weakPoints":[string,...],"suggestedResponses":[string,...],"closingStatement":string,"summary":string}
strengths/weakPoints: 1-4 items each. suggestedResponses: 1-3 items. summary: 2-3 sentences.`;
}

function isScore(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 10;
}
function isStrArr(v: unknown, min: number): v is string[] {
  return Array.isArray(v) && v.length >= min && v.every(s => typeof s === "string" && s.trim().length > 0);
}

/** Strict parse + validation. Returns null on any problem (bad JSON counts as failure). */
export function parseFeedback(raw: string): CallFeedback | null {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) text = fence[1]!.trim();
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const o = obj as Record<string, unknown>;
  if (!isScore(o.confidenceScore) || !isScore(o.fluencyScore) || !isScore(o.effectivenessScore) || !isScore(o.overallScore)) return null;
  if (!isStrArr(o.strengths, 1) || !isStrArr(o.weakPoints, 1) || !isStrArr(o.suggestedResponses, 1)) return null;
  if (typeof o.closingStatement !== "string" || typeof o.summary !== "string" || !o.summary.trim()) return null;
  return {
    confidenceScore: o.confidenceScore,
    fluencyScore: o.fluencyScore,
    effectivenessScore: o.effectivenessScore,
    overallScore: o.overallScore,
    strengths: o.strengths,
    weakPoints: o.weakPoints,
    suggestedResponses: o.suggestedResponses,
    closingStatement: o.closingStatement,
    summary: o.summary,
  };
}

export type ChatFn = (messages: ChatMessage[], opts: { system?: string; json?: boolean }) => Promise<ProxyReply>;

/** Never fabricates a score: any failure returns { ok: false }. */
export async function scoreCall(
  transcript: ChatMessage[],
  scenarioTitle: string,
  chat: ChatFn = (m, o) => proxyChat(m, o)
): Promise<ScoringResult> {
  const transcriptText = transcript
    .map(m => `${m.role === "user" ? "SALESPERSON" : "CUSTOMER"}: ${m.content}`)
    .join("\n");
  try {
    const reply = await chat([{ role: "user", content: `Score this call:\n\n${transcriptText}` }], {
      system: buildScoringPrompt(scenarioTitle),
      json: true,
    });
    const feedback = parseFeedback(reply.text);
    if (!feedback) return { ok: false, error: "Invalid scoring JSON" };
    return { ok: true, feedback, provider: reply.provider };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
