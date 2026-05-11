export interface ScriptTip {
  phase: string;
  lines: string[];
}

export interface ObjectionScript {
  trigger: string;
  response: string;
}

export const OPENING_LINES: string[] = [
  "Hi [Name], this is [Your Name] — sorry to interrupt you for a moment. I work with businesses on [web development / AI automation] and I noticed something about your online presence I thought you'd want to know about. Do you have 60 seconds?",
  "Hey, is this [Name]? Great — I'll be quick. I help [type of business] owners get more customers online. I've seen a few things your competitors are doing that you're not, and I wanted to share it. Is now a bad time?",
  "Hi [Name], I'm [Your Name]. I do web and AI work for small businesses and I'm calling because I had an idea specifically for a business like yours. Can I take 30 seconds to explain?",
];

export const DISCOVERY_QUESTIONS: string[] = [
  "What does your current online presence look like — do you have a website that's bringing in customers?",
  "How are most of your customers finding you right now?",
  "What's the biggest challenge you're dealing with on the business side these days?",
  "Are you happy with the number of leads or customers you're getting every month?",
  "If you could wave a magic wand and fix one thing about how your business runs, what would it be?",
  "Have you tried digital marketing or automation before? What happened?",
  "How much time does your team spend on repetitive tasks every week — things like follow-ups, scheduling, data entry?",
  "What does your sales process look like from first contact to closing a deal?",
  "Who else is usually involved in decisions like this — is it just you?",
  "What would a successful outcome look like for you in the next 6 months?",
];

export const OBJECTION_SCRIPTS: ObjectionScript[] = [
  {
    trigger: "Too expensive / budget",
    response: "I totally understand. Can I ask — what does it currently cost you NOT to have this fixed? Sometimes the math flips when you look at it that way. What budget range were you thinking?",
  },
  {
    trigger: "Already have someone / developer",
    response: "That's great — are you happy with the results you're getting from them? I ask because a lot of business owners tell me the same thing, but their site hasn't been updated in a couple years. Not saying that's you — just curious.",
  },
  {
    trigger: "Not interested / wrong time",
    response: "Totally fair. Can I just ask — is it the timing, or have you not seen something that actually makes sense for your business yet? Those are very different things.",
  },
  {
    trigger: "Send me an email",
    response: "I can do that — emails get lost though. Let me ask one quick question first: what's the biggest tech headache in your business right now? If there's no fit, I won't waste your inbox.",
  },
  {
    trigger: "Need to think about it",
    response: "Of course — big decision. What specifically do you need to think through? Is it the budget, or something about the proposal that wasn't clear? I'd rather answer questions now than have you sit with uncertainty for a week.",
  },
  {
    trigger: "We do it ourselves / in-house",
    response: "Smart — how's that working out? What does the timeline look like, and what happens if it takes longer than expected? I often come in alongside teams to speed things up.",
  },
  {
    trigger: "AI / tech isn't for us",
    response: "That's what most of my clients said before we talked. I don't sell buzzwords — I help businesses remove specific time-wasters. What task in your business do you wish just happened automatically?",
  },
];

export const CLOSING_LINES: string[] = [
  "Here's what I'd suggest: let me put together a quick overview specific to your business — no fluff, just what's relevant. Can we do a 15-minute call this week to walk through it?",
  "Based on what you've told me, I think there's a real fit here. Can I send you two or three specific ideas and then we jump on a quick call to go through them?",
  "I don't want to take any more of your time — can I just get 20 minutes with you next week to show you exactly what I'm talking about? If it doesn't make sense for you, I'll tell you straight.",
  "What's your availability like this week? I can do a quick screen share and show you what I have in mind — 15 minutes, max.",
];

export const CALL_PHASES: ScriptTip[] = [
  {
    phase: "Opening (0–30 sec)",
    lines: [
      "Introduce yourself quickly — name, what you do, one-line hook",
      "Ask permission: 'Do you have 60 seconds?'",
      "Don't pitch yet — just get permission to talk",
    ],
  },
  {
    phase: "Discovery (30 sec – 2 min)",
    lines: [
      "Ask about their current situation first",
      "Find the pain point before offering any solution",
      "Let them talk — listen for specific problems",
    ],
  },
  {
    phase: "Pitch (2–4 min)",
    lines: [
      "Only pitch after you understand their problem",
      "Connect your solution directly to what they said",
      "Keep it short — one or two clear benefits, not a feature list",
    ],
  },
  {
    phase: "Handle Objections (4–6 min)",
    lines: [
      "Never argue — acknowledge first, then redirect",
      "Ask 'What specifically concerns you about that?'",
      "Use their own words to reframe the value",
    ],
  },
  {
    phase: "Close (6–8 min)",
    lines: [
      "Ask for a next step, not a final decision",
      "Suggest a short follow-up call, not a contract",
      "'Can we do 15 minutes this week to go deeper?'",
    ],
  },
];
