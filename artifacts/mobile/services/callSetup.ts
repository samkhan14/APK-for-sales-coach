// I18 opener from persona name + F7 difficulty / gatekeeper mode. Pure and unit-tested.
import type { CustomerPersonality, SalesScenario } from "@/constants/database";

export type Difficulty = "easy" | "medium" | "hard";
export type CallerMode = "decision_maker" | "gatekeeper";

const OWNER_NAMES = ["Mike", "Sarah", "John", "Lisa", "David", "Karen", "Chris", "Amanda"];
const COMPANY_NAMES = ["Northside Services", "Peak Solutions", "Riverside Group", "Metro Partners"];
const RECEPTIONISTS = ["Jenny", "Tara", "Linda", "Rachel"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const pick = <T,>(list: T[], key: string): T => list[hash(key) % list.length]!;

export interface CallPersona { customerName: string; firstName: string; businessName: string; receptionistName: string }

/** Stable names per scenario so the opener never shows a placeholder like "[Customer]". */
export function personaFor(scenario: SalesScenario): CallPersona {
  const customerName = scenario.customerName ?? pick(OWNER_NAMES, scenario.id);
  const parts = customerName.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/, "").split(" ");
  const firstName = customerName.startsWith("Dr.") ? customerName.split(" ").slice(0, 1).concat(parts.slice(-1)).join(" ") : parts[0]!;
  return {
    customerName,
    firstName,
    businessName: scenario.businessName ?? pick(COMPANY_NAMES, scenario.id + "biz"),
    receptionistName: scenario.receptionistName ?? pick(RECEPTIONISTS, scenario.id + "rec"),
  };
}

/** Opening line spoken by the AI when the call connects. `rand` is injectable for tests. */
export function buildOpening(scenario: SalesScenario, mode: CallerMode, difficulty: Difficulty, rand: () => number = Math.random): string {
  const p = personaFor(scenario);
  if (mode === "gatekeeper") {
    const lines = [
      `Good morning, ${p.businessName}, this is ${p.receptionistName}. How can I help you?`,
      `${p.businessName}, ${p.receptionistName} speaking.`,
      `Thank you for calling ${p.businessName}, this is ${p.receptionistName}.`,
    ];
    return lines[Math.floor(rand() * lines.length)]!;
  }
  const lines = difficulty === "hard"
    ? [`${p.firstName}.`, `Yeah, this is ${p.firstName}. Who's this?`, `${p.firstName} speaking. Make it quick.`]
    : difficulty === "easy"
    ? [`Hi, this is ${p.firstName} at ${p.businessName}. How can I help you?`, `Hello, ${p.businessName}, ${p.firstName} speaking.`]
    : [`Hello, this is ${p.firstName}. Who's calling?`, `${p.businessName}, this is ${p.firstName}.`, `Yeah, hi, ${p.firstName} here.`];
  return lines[Math.floor(rand() * lines.length)]!;
}

export const DIFFICULTY_INSTRUCTIONS: Record<Difficulty, string> = {
  easy: "Be moderately open. Give the caller reasonable chances to recover from mistakes. Raise at most one or two mild objections.",
  medium: "Be realistically skeptical. Push back on weak claims with common objections. Only engage deeply if they show genuine understanding of your business.",
  hard: "Be very tough and short on time. Challenge everything, stack objections, try to end the call early. Only agree to a next step if the caller is genuinely impressive.",
};

export function gatekeeperInstructions(scenario: SalesScenario): string {
  const p = personaFor(scenario);
  return `GATEKEEPER MODE: For the first part of this call you are ${p.receptionistName}, the receptionist at ${p.businessName}, NOT the owner. Your job is to protect ${p.customerName}'s time. Ask who is calling and what it's regarding, and screen out sales calls ("Is this a sales call?", "Can you just send an email to info@?", "He's with a client right now"). Only if the caller is polite, specific, and gives a good reason, say something like "Hold on, let me see if ${p.firstName} is free" and then continue the call AS ${p.customerName} (the owner, described below). If the caller is pushy or vague, politely end the call.`;
}

export function buildPrompt(scenario: SalesScenario, personality: CustomerPersonality, difficulty: Difficulty, mode: CallerMode = "decision_maker"): string {
  const p = personaFor(scenario);
  return `${mode === "gatekeeper" ? gatekeeperInstructions(scenario) + "\n\nOWNER ROLE:\n" : ""}${scenario.systemPrompt}
Your name is ${p.customerName} and your business is ${p.businessName}.

PERSONALITY OVERLAY: ${personality.name} — ${personality.description}
Tone: ${personality.tone}
Response style: ${personality.responseStyle}
Key traits: ${personality.traits.join(", ")}

DIFFICULTY: ${difficulty} — ${DIFFICULTY_INSTRUCTIONS[difficulty]}

CRITICAL RULES:
- You are a CUSTOMER being called, not an AI assistant. Never break character.
- Keep responses SHORT — 1-3 sentences max, like a real phone call.
- Sound human: use natural speech patterns, pauses, contractions.
- React emotionally when appropriate: frustration, curiosity, skepticism, mild interest.
- Do NOT use bullet points, lists, or formal language.
- Do NOT offer solutions or be helpful — you are a potential buyer being pitched to.
- React to what the caller actually says. If they make a good point, acknowledge it briefly.
- Occasionally mention real business context (your team, your budget, your current tools).
- If they're impressive, you can show mild interest — "That's... actually interesting. Tell me more."
- If they're weak, shut down quickly: "Look, I'm really busy, is there a point here?"`;
}
