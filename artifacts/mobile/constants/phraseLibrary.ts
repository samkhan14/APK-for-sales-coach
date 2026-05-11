export interface Phrase {
  id: string;
  text: string;
  whenToUse: string;
  tip: string;
  tags: string[];
}

export interface PhraseCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  phrases: Phrase[];
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    id: "openers",
    label: "Openers",
    icon: "phone-call",
    color: "#3b82f6",
    description: "First 15–30 seconds. Your only job here is to earn 60 more seconds.",
    phrases: [
      {
        id: "op1",
        text: "Hi [Name], this is [Your Name] — sorry to catch you off guard. I'll be really quick. I work with businesses on web development and I noticed something about your online presence I thought was worth a call. Do you have 60 seconds?",
        whenToUse: "Cold call to any business. Works best when you have actually looked at their website.",
        tip: "Say 'I'll be really quick' and mean it. Pause after '60 seconds?' and wait for them to respond.",
        tags: ["cold-call", "web-dev", "opener"],
      },
      {
        id: "op2",
        text: "Hey [Name], quick question — is your website currently bringing you new leads, or is it more of a digital brochure at this point?",
        whenToUse: "Use when you want to immediately open a discovery conversation without a formal intro.",
        tip: "The phrase 'digital brochure' often gets a laugh and breaks the ice. It also makes them think.",
        tags: ["cold-call", "opener", "discovery-opener"],
      },
      {
        id: "op3",
        text: "Hi [Name], I'm a web and AI developer. I've been working with businesses in [their industry] and I had one specific idea I thought could work for you. Can I take 30 seconds to explain it?",
        whenToUse: "When you've done research on their industry and have a specific insight to offer.",
        tip: "Saying '30 seconds' shows extreme respect for their time. Always honour it — pitch in 30 seconds, then pause.",
        tags: ["opener", "targeted", "research-based"],
      },
      {
        id: "op4",
        text: "Hello, am I speaking with [Name]? Great. I help businesses in [US/UK/Australia] get more clients through better websites and automation. I noticed [specific thing about their business] — are you open to a quick idea?",
        whenToUse: "International cold call where you've done specific research on their website or business.",
        tip: "The '[specific thing]' is the key — the more specific you are, the more credible you sound immediately.",
        tags: ["opener", "international", "cold-call"],
      },
      {
        id: "op5",
        text: "Hi [Name], I know this is out of the blue. I'm [Your Name] — I run a small web agency and I'm reaching out to [their industry] businesses because I've been getting really good results for similar companies. Is now a terrible time?",
        whenToUse: "When you want to be disarmingly honest about the cold call nature.",
        tip: "'Is now a terrible time?' is better than 'is now a good time?' — it's easier to say no to a terrible time than a good time.",
        tags: ["opener", "honest", "disarming"],
      },
    ],
  },
  {
    id: "discovery",
    label: "Discovery",
    icon: "search",
    color: "#8b5cf6",
    description: "Ask before you pitch. Find the pain. Understand before you propose.",
    phrases: [
      {
        id: "disc1",
        text: "How are most of your new clients finding you right now — is it mostly referrals, or are you getting people from Google or social media?",
        whenToUse: "Early in the call to understand their current marketing situation.",
        tip: "Give them options to react to. It's easier than asking open-ended. Listen for frustration — that's your opening.",
        tags: ["discovery", "leads", "marketing"],
      },
      {
        id: "disc2",
        text: "When someone searches for [their service] in [their city or country], does your business show up? Have you checked recently?",
        whenToUse: "When talking to a local business or service provider.",
        tip: "Most business owners haven't checked. The pause after this question is powerful — let them feel the gap.",
        tags: ["discovery", "seo", "local"],
      },
      {
        id: "disc3",
        text: "What's the one thing your current website doesn't do that you wish it did?",
        whenToUse: "After they confirm they have a website. Opens up specific pain points.",
        tip: "One thing, not everything. This forces them to prioritise and gives you their #1 problem to solve.",
        tags: ["discovery", "website", "pain-point"],
      },
      {
        id: "disc4",
        text: "If you could get 5 extra qualified leads every month, what would that mean for your business?",
        whenToUse: "When they seem interested but haven't articulated the value. Makes the value concrete.",
        tip: "Let them do the maths in their head. The more specific their answer, the more invested they become.",
        tags: ["discovery", "value", "leads"],
      },
      {
        id: "disc5",
        text: "How long has your current website been live — and when was the last time anything was updated?",
        whenToUse: "When they say their website is fine or they already have a developer.",
        tip: "Most sites are 3–5 years old and look it. This question usually reveals an embarrassing gap they hadn't thought about.",
        tags: ["discovery", "website", "existing-site"],
      },
      {
        id: "disc6",
        text: "What does your sales process look like from when someone first finds you to when they actually pay you?",
        whenToUse: "When selling automation, CRM, or full-funnel web solutions.",
        tip: "This reveals bottlenecks. Long processes with manual steps are your opportunity.",
        tags: ["discovery", "sales-process", "automation"],
      },
      {
        id: "disc7",
        text: "Are you the main person making decisions on this kind of thing, or is there someone else I should include in the conversation?",
        whenToUse: "Before you invest too much time — make sure you're talking to the decision maker.",
        tip: "Ask this naturally, not like a qualification test. If they're not the decision maker, ask to include the right person.",
        tags: ["discovery", "decision-maker", "qualification"],
      },
      {
        id: "disc8",
        text: "How much time per week does your team spend on repetitive tasks — things like sending follow-up emails, updating spreadsheets, or manually booking appointments?",
        whenToUse: "When pitching automation or AI solutions to a business owner.",
        tip: "They'll often say 'tons of time' and then you can make that time = money they're wasting.",
        tags: ["discovery", "automation", "time-waste"],
      },
    ],
  },
  {
    id: "value",
    label: "Value Pitch",
    icon: "trending-up",
    color: "#22c55e",
    description: "Only pitch AFTER you understand their problem. Connect your solution to their pain.",
    phrases: [
      {
        id: "val1",
        text: "What we do is build websites that actually convert visitors into paying clients — not just look nice. Most websites look fine but do nothing for the business. Ours are built to sell.",
        whenToUse: "After they've expressed frustration that their current site doesn't generate business.",
        tip: "Pause after 'do nothing for the business.' Let that land before continuing.",
        tags: ["pitch", "website", "conversion"],
      },
      {
        id: "val2",
        text: "We specialise in [their industry] specifically — so we already know what works and what doesn't. You're not paying for our learning curve.",
        whenToUse: "When you've worked with businesses in their specific niche before.",
        tip: "Only say this if it's true. If you don't have direct experience, say 'similar industries' instead.",
        tags: ["pitch", "niche", "expertise"],
      },
      {
        id: "val3",
        text: "Everything we build is on Laravel or Node.js — rock-solid, fast, and easy to maintain long-term. You won't be locked into WordPress plugins that break every six months.",
        whenToUse: "When talking to a more technical buyer or someone who's had problems with WordPress.",
        tip: "For non-technical clients, skip the tech names and say 'built properly from the ground up — no cheap shortcuts.'",
        tags: ["pitch", "technical", "tech-stack"],
      },
      {
        id: "val4",
        text: "We work in milestones — you see work and approve it before we move forward. You only pay when you're happy. There's no risk of handing over money and getting nothing back.",
        whenToUse: "When they raise concerns about trust, reliability, or past bad experiences with developers.",
        tip: "This removes the biggest fear international clients have with remote developers. Say it confidently.",
        tags: ["pitch", "trust", "milestones", "risk-reversal"],
      },
      {
        id: "val5",
        text: "Most of our international clients in the US and UK see a noticeable difference in lead quality within the first 60 days. That's not a promise — it's just what we've seen consistently.",
        whenToUse: "When you want to give a concrete timeframe for results without over-promising.",
        tip: "Adding 'that's not a promise' actually makes you more credible, not less. It sounds honest.",
        tags: ["pitch", "results", "international", "credibility"],
      },
      {
        id: "val6",
        text: "I'll tell you upfront — if I look at your situation and I don't think we can genuinely help, I'll tell you straight and we'll part as friends. I'm not here to sell something that doesn't make sense.",
        whenToUse: "When a client is sceptical or when you want to build instant trust.",
        tip: "This is disarming and builds massive trust. Only say it if you actually mean it.",
        tags: ["pitch", "trust", "honesty", "positioning"],
      },
    ],
  },
  {
    id: "price",
    label: "Price Objections",
    icon: "dollar-sign",
    color: "#f59e0b",
    description: "They say it's too expensive. Reframe value, don't drop your price.",
    phrases: [
      {
        id: "price1",
        text: "I totally understand — budget is real. Can I ask you something though? What does it currently cost you not to have this problem fixed? Because sometimes the math flips completely when you look at it that way.",
        whenToUse: "When they say it's too expensive or over their budget.",
        tip: "Wait after 'flips completely' and let them think. Don't rush to fill the silence.",
        tags: ["price", "reframe", "cost-of-inaction"],
      },
      {
        id: "price2",
        text: "What budget range were you thinking? Let me see if I can put something together that actually works for where you are right now.",
        whenToUse: "After acknowledging the price concern — gets them to name a number.",
        tip: "Never name your price before they name theirs. Let them anchor first.",
        tags: ["price", "budget", "negotiation"],
      },
      {
        id: "price3",
        text: "Think about it this way — if the new website brings you just one extra client per month, does it pay for itself? What's your average client worth to you?",
        whenToUse: "When they're resisting on price but haven't thought about ROI.",
        tip: "Make them do the maths. If their average client is $2,000 and your site costs $3,000 — it pays off in 2 clients.",
        tags: ["price", "roi", "value"],
      },
      {
        id: "price4",
        text: "We do have a smaller starter package for businesses that aren't ready for the full build yet. What's the most important piece to fix first?",
        whenToUse: "When their budget is genuinely small but they're interested — offer a smaller entry point.",
        tip: "This keeps the door open without discounting. You're offering a smaller scope, not a cheaper price.",
        tags: ["price", "starter", "phased-approach"],
      },
      {
        id: "price5",
        text: "Fair point — and I'd rather you say that now than halfway through. Can we look at what a Phase 1 would look like that fits your budget, and we build from there?",
        whenToUse: "When the full project is too expensive but they're genuinely interested.",
        tip: "Phased projects are a great way to start a relationship. Get the foot in the door.",
        tags: ["price", "phased", "relationship"],
      },
    ],
  },
  {
    id: "competitor",
    label: "Competitor",
    icon: "users",
    color: "#ef4444",
    description: "They already have a developer or agency. Don't fight — ask questions.",
    phrases: [
      {
        id: "comp1",
        text: "That's great to hear. How long have they been working with you — and are you genuinely happy with the results you're getting?",
        whenToUse: "When they say they already have a developer or agency.",
        tip: "Ask this warmly, not like an interrogation. Most people will either say 'yes, great' or pause — the pause is your opening.",
        tags: ["competitor", "existing-developer", "discovery"],
      },
      {
        id: "comp2",
        text: "No problem at all. Can I ask — is there anything they haven't been able to solve for you yet? Even small things?",
        whenToUse: "After they confirm they're happy with their current developer.",
        tip: "There's almost always something. Even satisfied clients have gaps. Find the gap.",
        tags: ["competitor", "gap", "discovery"],
      },
      {
        id: "comp3",
        text: "Understood. We actually work alongside existing teams quite often — not to replace anyone, just for specific projects they don't cover. Is that something that might make sense?",
        whenToUse: "When they're loyal to their current developer but you still want a way in.",
        tip: "Positioning yourself as complementary, not competitive, removes the threat. You become an addition, not a replacement.",
        tags: ["competitor", "complementary", "positioning"],
      },
      {
        id: "comp4",
        text: "Completely fair. And if something ever comes up that your current person can't handle — a specific technology, a tight deadline, anything like that — would it be okay if I reached back out?",
        whenToUse: "When they're committed to their current developer and you're not going to break that today.",
        tip: "Getting a 'yes' to future contact is a win. Follow up in 3 months.",
        tags: ["competitor", "future-contact", "relationship"],
      },
      {
        id: "comp5",
        text: "That's honestly good to hear — a lot of people I talk to don't have anyone. Just out of curiosity, are they local to you or is it a remote arrangement?",
        whenToUse: "When they have an existing developer and you want to understand the relationship better.",
        tip: "Remote developers are easier to replace. Local ones have stronger loyalty. Knowing this shapes your strategy.",
        tags: ["competitor", "remote", "local", "intelligence"],
      },
    ],
  },
  {
    id: "deflection",
    label: "Deflection",
    icon: "mail",
    color: "#06b6d4",
    description: "They say 'send me an email' or 'call back later.' Keep the conversation alive.",
    phrases: [
      {
        id: "defl1",
        text: "Sure, happy to. Before I do — just one quick question so the email is actually useful to you: what's the biggest challenge you're dealing with on the tech or website side right now?",
        whenToUse: "When they ask you to send an email as a way to end the call.",
        tip: "The pivot is asking one question before complying. If they answer, you're back in a real conversation.",
        tags: ["deflection", "email", "pivot"],
      },
      {
        id: "defl2",
        text: "Absolutely. When's a better time to chat properly — are you usually better in the morning or afternoon?",
        whenToUse: "When they say to call back but don't give a specific time.",
        tip: "Give them two options, not an open-ended 'whenever works.' Options make it easier to commit.",
        tags: ["deflection", "callback", "scheduling"],
      },
      {
        id: "defl3",
        text: "I will — I just want to make sure the email is actually relevant to you, not just a generic brochure. What would be most useful to include?",
        whenToUse: "After agreeing to send an email — getting them to tell you what matters to them.",
        tip: "This also keeps them talking. What they tell you is gold for your follow-up.",
        tags: ["deflection", "email", "personalization"],
      },
      {
        id: "defl4",
        text: "No problem — I know you're busy. If I had to give you just one thing to look at in the next 24 hours, what format would actually get your attention — a short video, a PDF, or a quick bullet list?",
        whenToUse: "When they're clearly busy but not uninterested.",
        tip: "Giving them format options shows you respect their attention. It also tells you how they like to receive information.",
        tags: ["deflection", "format", "follow-up"],
      },
    ],
  },
  {
    id: "closing",
    label: "Closing",
    icon: "flag",
    color: "#10b981",
    description: "Ask for a next step — never the final decision. A 15-min call, not a contract.",
    phrases: [
      {
        id: "close1",
        text: "Based on what you've told me, I think there's a real fit here. Would you be open to a 15-minute call this week — I'll put together a couple of specific ideas for your business beforehand so it's not a waste of your time.",
        whenToUse: "When the conversation has gone well and they seem interested.",
        tip: "Saying 'I'll prepare beforehand' shows professionalism and gives them a reason to say yes.",
        tags: ["closing", "next-step", "follow-up"],
      },
      {
        id: "close2",
        text: "I don't want to waste any more of your time on a call — can we do a quick 15-minute screen share this week so I can show you exactly what I'm thinking? If it doesn't make sense, I'll tell you straight.",
        whenToUse: "When they're interested but not fully committed — a screen share feels lower stakes.",
        tip: "'I'll tell you straight' is powerful — it removes the sales pressure and makes you trustworthy.",
        tags: ["closing", "screen-share", "low-pressure"],
      },
      {
        id: "close3",
        text: "What does your week look like? I can do Tuesday or Wednesday — whichever works better for you. It'll be 15 minutes max.",
        whenToUse: "When they've agreed to a next call — offer two specific days, not 'whenever you're free.'",
        tip: "Two specific days forces a real decision. 'Whenever works' gets pushed off forever.",
        tags: ["closing", "scheduling", "commitment"],
      },
      {
        id: "close4",
        text: "Here's what I'll do — I'll put together a quick overview specific to your situation, not a generic proposal. If you like it, great. If not, no hard feelings at all. Does that sound fair?",
        whenToUse: "When they need to 'think about it' — give them something concrete to review instead.",
        tip: "Asking 'does that sound fair?' at the end almost always gets a yes. It's a soft close.",
        tags: ["closing", "proposal", "fair-close"],
      },
      {
        id: "close5",
        text: "I appreciate you taking the time. I know you hear from a lot of people — I'd just love 15 minutes to show you what I've been doing for businesses like yours. If there's no fit, I'll be the first one to say so.",
        whenToUse: "As a closing when they're on the fence — acknowledges their time is valuable.",
        tip: "For international clients especially, showing humility and honesty goes a long way. Don't be pushy.",
        tags: ["closing", "humble", "international"],
      },
    ],
  },
];

export const ALL_PHRASES: Phrase[] = PHRASE_CATEGORIES.flatMap(cat =>
  cat.phrases.map(p => ({ ...p, categoryId: cat.id }))
) as (Phrase & { categoryId: string })[];

export function getSuggestionsForMessage(aiMessage: string, isFirstMessage: boolean): string[] {
  const lower = aiMessage.toLowerCase();

  if (isFirstMessage) {
    return [
      "Hi, this is [Your Name] — I'll be really quick. I work with businesses on web development and I had one specific idea for your business. Do you have 60 seconds?",
      "Hey, thanks for answering. I'm a web developer and I noticed something about your online presence I thought was worth a quick call. Is now a bad time?",
      "Hi! I'll keep this short. I help businesses get more clients through better websites. Can I ask you one quick question?",
    ];
  }

  if (
    lower.includes("expensive") || lower.includes("price") ||
    lower.includes("cost") || lower.includes("budget") ||
    lower.includes("afford") || lower.includes("cheap") ||
    lower.includes("charge") || lower.includes("quote")
  ) {
    return [
      "I totally understand. Can I ask — what does it cost you right now to NOT have this fixed? Sometimes the maths flips when you look at it that way.",
      "What budget range were you thinking? Let me see if I can put something together that works for where you are now.",
      "Think of it this way — if this brings you just one extra client per month, does it pay for itself?",
    ];
  }

  if (
    lower.includes("already have") || lower.includes("developer") ||
    lower.includes("agency") || lower.includes("team") ||
    lower.includes("person") || lower.includes("someone who") ||
    lower.includes("we use") || lower.includes("working with")
  ) {
    return [
      "That's great to hear. How long have they been working with you — and are you happy with the results you're getting?",
      "No problem. Is there anything they haven't been able to solve for you yet, even small things?",
      "We actually work alongside existing teams quite often — not to replace anyone, just for specific projects. Could that work?",
    ];
  }

  if (
    lower.includes("email") || lower.includes("send") ||
    lower.includes("later") || lower.includes("call back") ||
    lower.includes("busy") || lower.includes("not now") ||
    lower.includes("bad time") || lower.includes("in a meeting")
  ) {
    return [
      "Of course! Just one quick question before I go — what's the biggest challenge you have on the web or tech side right now? I'll make sure the email is actually useful.",
      "Absolutely — when's a better time? Are you usually better in the morning or afternoon?",
      "Happy to send one. What would be most useful to include so it's actually relevant to you?",
    ];
  }

  if (
    lower.includes("not interested") || lower.includes("no thanks") ||
    lower.includes("don't need") || lower.includes("not looking") ||
    lower.includes("don't think") || lower.includes("no need")
  ) {
    return [
      "Totally fair. Can I just ask — is it the timing, or is it that you haven't seen something that makes sense for your business yet? Those are two very different things.",
      "I hear you. Is it that your website is already working really well for you, or more that it's just not a priority right now?",
      "No problem at all. Just out of curiosity — what would have to be true for this to be worth 15 minutes of your time?",
    ];
  }

  if (
    lower.includes("think about") || lower.includes("consider") ||
    lower.includes("let me") || lower.includes("check with") ||
    lower.includes("get back") || lower.includes("discuss") ||
    lower.includes("partner") || lower.includes("talk to")
  ) {
    return [
      "Of course — totally makes sense. What specifically do you need to think through? Is it the budget, or something about the approach that wasn't clear?",
      "Makes sense. Can we book a 15-minute call so I can answer those questions directly? That's usually faster than email.",
      "Absolutely. What would help you feel confident about moving forward?",
    ];
  }

  if (
    lower.includes("trust") || lower.includes("guarantee") ||
    lower.includes("prove") || lower.includes("how do i know") ||
    lower.includes("freelancer") || lower.includes("experience") ||
    lower.includes("before") || lower.includes("references")
  ) {
    return [
      "That's completely fair — there are a lot of bad experiences out there. We work in milestones, so you only pay when you approve each stage. No risk.",
      "Happy to share references from clients in similar industries. Would that help?",
      "I get that. Everything is documented and transparent — you can see exactly what's happening at every step.",
    ];
  }

  // Default — discovery questions
  return [
    "How are most of your new clients finding you right now — referrals, or online?",
    "What's the one thing your website doesn't do that you wish it did?",
    "If you could fix one thing about how your business gets new clients, what would it be?",
  ];
}
