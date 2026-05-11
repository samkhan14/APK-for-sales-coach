export interface Objection {
  id: string;
  scenario: string;
  customerMessage: string;
  aiResponse: string;
  followUp: string;
  category: string;
}

export interface SalesScenario {
  id: string;
  title: string;
  description: string;
  industry: string;
  difficulty: "easy" | "medium" | "hard";
  icon: string;
  systemPrompt: string;
}

export interface CustomerPersonality {
  id: string;
  name: string;
  description: string;
  tone: string;
  responseStyle: string;
  traits: string[];
}

export const OBJECTIONS: Objection[] = [
  {
    id: "obj_001",
    scenario: "web_development",
    customerMessage: "We already have a developer.",
    aiResponse: "Oh yeah? How's that working out for you? Because honestly, a lot of businesses say the same thing, but their websites haven't been updated in two years. I'm not saying that's you, but it's worth asking — are you happy with where things are right now?",
    followUp: "If your current developer is great, I'd just love to show you what else is possible with modern web tech.",
    category: "existing_solution"
  },
  {
    id: "obj_002",
    scenario: "general",
    customerMessage: "Not interested right now.",
    aiResponse: "Fair enough. Can I ask — is it the timing, or is it more that you haven't seen something that makes sense for your business yet? Because those are two very different things.",
    followUp: "I totally get it. When would be a better time to reconnect?",
    category: "timing"
  },
  {
    id: "obj_003",
    scenario: "general",
    customerMessage: "Just send me an email.",
    aiResponse: "Sure, I can do that. But honestly, emails get lost all the time, you know? Can I just ask you one quick question before I let you go — what's the biggest challenge you're dealing with on the tech side right now?",
    followUp: "What email should I send it to, and when do you usually check?",
    category: "deflection"
  },
  {
    id: "obj_004",
    scenario: "general",
    customerMessage: "It's too expensive.",
    aiResponse: "I hear that a lot, and I get it — budget is real. But let me ask you this: what does it cost you right now to NOT have this working properly? Because sometimes the price of fixing something is actually way less than the cost of leaving it broken.",
    followUp: "What kind of budget were you thinking? Let's see if we can make something work.",
    category: "price"
  },
  {
    id: "obj_005",
    scenario: "general",
    customerMessage: "We're happy with our current system.",
    aiResponse: "That's good to hear, genuinely. Most of my best clients said the same thing before we talked. What does your current system handle that you're most happy with?",
    followUp: "And what's the one thing it still doesn't do as well as you'd like?",
    category: "existing_solution"
  },
  {
    id: "obj_006",
    scenario: "general",
    customerMessage: "We don't trust freelancers.",
    aiResponse: "Yeah, that's completely understandable. There are a lot of bad experiences out there. What happened — was it a project that didn't get finished, or quality issues, or something else?",
    followUp: "I work differently — everything is documented, milestones-based, and I have references you can actually call.",
    category: "trust"
  },
  {
    id: "obj_007",
    scenario: "general",
    customerMessage: "We're not hiring right now.",
    aiResponse: "I'm not looking to be hired as an employee — I work project-based. So it's more like bringing in a specialist for a specific result, not adding headcount. Does that change things?",
    followUp: "No benefits, no long-term commitment — just results.",
    category: "misunderstanding"
  },
  {
    id: "obj_008",
    scenario: "general",
    customerMessage: "We need to think about it.",
    aiResponse: "Totally, big decisions need thought. What specifically do you need to think through? Is it budget, or is there something about the proposal that wasn't clear?",
    followUp: "I'd rather answer questions now than have you sit with uncertainty for a week.",
    category: "stall"
  },
  {
    id: "obj_009",
    scenario: "general",
    customerMessage: "Who are you exactly?",
    aiResponse: "Great question — I should've led with that. I'm a web developer and AI automation specialist. I work with small to mid-size businesses to either build or upgrade their digital presence — websites, automation tools, that kind of thing. What does your business do?",
    followUp: "I've worked with businesses in [industry] specifically, actually.",
    category: "identity"
  },
  {
    id: "obj_010",
    scenario: "general",
    customerMessage: "I need to talk to my partner first.",
    aiResponse: "Of course, that makes sense. When do you usually connect with them? And is there anything specific you'd want me to clarify that would help that conversation go smoother?",
    followUp: "Would it help if I joined a quick call with both of you?",
    category: "stall"
  },
  {
    id: "obj_011",
    scenario: "web_development",
    customerMessage: "Our website is fine the way it is.",
    aiResponse: "When's the last time you looked at it on mobile? A lot of sites that look fine on desktop are actually losing customers on phone. Do you know what percentage of your visitors are on mobile?",
    followUp: "I'd be happy to run a quick audit — just so you know where things stand.",
    category: "existing_solution"
  },
  {
    id: "obj_012",
    scenario: "saas",
    customerMessage: "We already use [competitor software].",
    aiResponse: "Oh interesting, how's that working for you? What do you like most about it?",
    followUp: "And is there anything it doesn't do that you wish it did?",
    category: "existing_solution"
  },
  {
    id: "obj_013",
    scenario: "ai_automation",
    customerMessage: "AI isn't ready for real business use.",
    aiResponse: "I thought that too, honestly, about two years ago. But I've seen it cut follow-up time by 60% for some clients. It's not replacing people — it's removing the boring repetitive stuff. What part of your workflow eats the most time right now?",
    followUp: "What would you do with 10 extra hours a week?",
    category: "skepticism"
  },
  {
    id: "obj_014",
    scenario: "general",
    customerMessage: "Call me back next quarter.",
    aiResponse: "I can do that. Just so I know — is there a specific reason next quarter makes more sense? Like a budget cycle, or a project wrapping up?",
    followUp: "I'll put it in my calendar. Would [specific date] work?",
    category: "timing"
  },
  {
    id: "obj_015",
    scenario: "general",
    customerMessage: "We tried something like this before and it didn't work.",
    aiResponse: "That's really helpful to know. What happened exactly? Because 'didn't work' can mean a lot of different things — bad implementation, wrong tool, or just bad timing.",
    followUp: "Understanding what went wrong is actually how I make sure it doesn't happen again.",
    category: "past_failure"
  },
  {
    id: "obj_016",
    scenario: "web_development",
    customerMessage: "We can build it ourselves.",
    aiResponse: "Totally possible. How much time does your team have for it? Because building is only about 20% of the work — the setup, security, hosting, ongoing maintenance... that's where it gets expensive in time.",
    followUp: "What's your team's current bandwidth like?",
    category: "diy"
  },
  {
    id: "obj_017",
    scenario: "general",
    customerMessage: "I don't have time to talk right now.",
    aiResponse: "I hear you — I'll be quick. One question: what's the biggest tech headache you're dealing with in your business right now?",
    followUp: "30 seconds, that's all I need.",
    category: "timing"
  },
  {
    id: "obj_018",
    scenario: "saas",
    customerMessage: "We don't have the budget for software subscriptions.",
    aiResponse: "What are you currently spending on the manual process it would replace? Sometimes SaaS actually saves money when you factor in labor hours.",
    followUp: "What if I showed you the math on that?",
    category: "price"
  },
  {
    id: "obj_019",
    scenario: "ai_automation",
    customerMessage: "Our data is sensitive, we can't use AI.",
    aiResponse: "That's a really valid concern and one I take seriously. What kind of data are we talking about? Because there are compliant, on-premise options that don't send anything to third parties.",
    followUp: "Security-first AI implementation is actually my specialty.",
    category: "security"
  },
  {
    id: "obj_020",
    scenario: "general",
    customerMessage: "How do I know you'll deliver?",
    aiResponse: "That's the right question to ask. I work milestone-based — you only pay as you see results, not upfront for everything. And I have clients you can call right now if you want references.",
    followUp: "What would 'delivered' look like to you, specifically?",
    category: "trust"
  },
  {
    id: "obj_021",
    scenario: "general",
    customerMessage: "We've been burned before by agencies.",
    aiResponse: "Agencies are a different animal — lots of handoffs, account managers who don't code, and you pay for overhead. I'm direct. You talk to the person doing the work.",
    followUp: "What specifically went wrong with the agency?",
    category: "trust"
  },
  {
    id: "obj_022",
    scenario: "web_development",
    customerMessage: "We just redesigned our website last year.",
    aiResponse: "How's it performing since the redesign? Have you seen any lift in leads or conversions?",
    followUp: "A lot of redesigns focus on looks but miss the conversion side.",
    category: "existing_solution"
  },
  {
    id: "obj_023",
    scenario: "lead_generation",
    customerMessage: "We get enough leads through referrals.",
    aiResponse: "Referrals are gold. But what happens when that pipeline slows down? Do you have a backup system?",
    followUp: "What does a slow month look like for you?",
    category: "existing_solution"
  },
  {
    id: "obj_024",
    scenario: "saas",
    customerMessage: "I'll look at it when I have time.",
    aiResponse: "When's realistically going to be? Because I know how it goes — this gets pushed back, something else comes up. What if I scheduled 15 minutes with you right now for next week?",
    followUp: "I'll even send a reminder.",
    category: "stall"
  },
  {
    id: "obj_025",
    scenario: "general",
    customerMessage: "Your price is too high compared to others.",
    aiResponse: "Fair point. What were the others offering for that price? Because cheaper isn't always better — it depends what you're comparing.",
    followUp: "I'd rather beat them on value than match them on price.",
    category: "price"
  },
  {
    id: "obj_026",
    scenario: "ai_automation",
    customerMessage: "We're not a tech company, this isn't for us.",
    aiResponse: "Some of my best clients aren't tech companies at all — restaurants, law firms, real estate agents. AI automation works for any business that has repetitive tasks. What do your team members do most of the day?",
    followUp: "You don't need to be a tech company to benefit from tech.",
    category: "fit"
  },
  {
    id: "obj_027",
    scenario: "general",
    customerMessage: "We're going through some changes internally.",
    aiResponse: "That actually might be perfect timing — a lot of companies use transition periods to clean up their systems. What kind of changes?",
    followUp: "Sometimes new processes are easier to implement during change.",
    category: "timing"
  },
  {
    id: "obj_028",
    scenario: "web_development",
    customerMessage: "We use a website builder, it's fine.",
    aiResponse: "Which one? Wix, Squarespace, Shopify? They're fine for basics, but they all hit a ceiling. Are you running into any limitations with it?",
    followUp: "Specifically around custom functionality or speed?",
    category: "existing_solution"
  },
  {
    id: "obj_029",
    scenario: "general",
    customerMessage: "I don't make the technology decisions.",
    aiResponse: "Who does? Can I speak with them, or would it be better if I put together something you could pass along?",
    followUp: "What would make it easiest for you to bring this to the right person?",
    category: "gatekeeper"
  },
  {
    id: "obj_030",
    scenario: "general",
    customerMessage: "We're a small business, this isn't for us.",
    aiResponse: "Actually, small businesses are exactly who I work with most. You don't have the layers of bureaucracy — decisions get made faster and results show up quicker. What size are we talking?",
    followUp: "Some of my best projects have been with teams under 10 people.",
    category: "fit"
  },
  {
    id: "obj_031",
    scenario: "crm",
    customerMessage: "We already have a CRM.",
    aiResponse: "Which one? And is the team actually using it, or is it mostly empty fields and outdated contacts?",
    followUp: "CRM adoption is usually the bigger problem than the tool itself.",
    category: "existing_solution"
  },
  {
    id: "obj_032",
    scenario: "general",
    customerMessage: "Can you do it cheaper?",
    aiResponse: "Depends on what we trim. What's the part of the project that matters most to you? Let's start there and work backwards from a number that makes sense.",
    followUp: "I'd rather scope it right than race to the bottom.",
    category: "price"
  },
  {
    id: "obj_033",
    scenario: "general",
    customerMessage: "We're profitable, we don't need to change anything.",
    aiResponse: "That's great. But profitable now doesn't mean protected tomorrow — what happens when competitors catch up or the market shifts? Are you building systems that scale?",
    followUp: "The best time to upgrade is when things are going well, not when they're not.",
    category: "complacency"
  },
  {
    id: "obj_034",
    scenario: "ai_automation",
    customerMessage: "Our employees are worried about being replaced.",
    aiResponse: "That's a real conversation worth having with them. From what I've seen, automation handles the boring parts — data entry, scheduling, follow-ups — and frees people up for actual thinking. What tasks are they most worried about?",
    followUp: "Most teams end up doing more interesting work after automation.",
    category: "internal_resistance"
  },
  {
    id: "obj_035",
    scenario: "general",
    customerMessage: "I've never heard of you.",
    aiResponse: "Makes sense — I don't run big ad campaigns. I'm usually too busy with client work. Can I show you a few projects similar to what you'd need?",
    followUp: "Results speak louder than name recognition.",
    category: "trust"
  },
  {
    id: "obj_036",
    scenario: "web_development",
    customerMessage: "SEO doesn't work.",
    aiResponse: "It definitely doesn't work the way it did 5 years ago. But done right, organic traffic is still the highest ROI channel most businesses have. What have you tried before?",
    followUp: "What did you expect that didn't happen?",
    category: "skepticism"
  },
  {
    id: "obj_037",
    scenario: "saas",
    customerMessage: "We're still figuring out our processes.",
    aiResponse: "That's actually the best time to implement software — you build the tool around the process, not the other way around. What process are you still working through?",
    followUp: "A lot of clients use tools to help define the process.",
    category: "timing"
  },
  {
    id: "obj_038",
    scenario: "general",
    customerMessage: "We already have someone working on this.",
    aiResponse: "Good — what's their timeline? And what happens if they get stuck or it takes longer than expected?",
    followUp: "I'm often brought in as a second set of eyes or to unstick things.",
    category: "existing_solution"
  },
  {
    id: "obj_039",
    scenario: "lead_generation",
    customerMessage: "Cold outreach doesn't work anymore.",
    aiResponse: "Generic cold outreach doesn't work. Targeted, relevant outreach still absolutely does. What have you tried?",
    followUp: "What was the response rate you were getting?",
    category: "skepticism"
  },
  {
    id: "obj_040",
    scenario: "general",
    customerMessage: "What's your success rate?",
    aiResponse: "Depends how you measure it. Projects delivered on time and on budget — very high. Client retention rate — most clients come back for phase two. What metric matters most to you?",
    followUp: "I'd rather you talk to my clients than take my word for it.",
    category: "credibility"
  },
  {
    id: "obj_041",
    scenario: "ai_automation",
    customerMessage: "We tried chatbots and they were terrible.",
    aiResponse: "Yeah, the first generation of chatbots was awful — decision trees dressed up as AI. Modern conversational AI is a completely different beast. What were you using it for?",
    followUp: "What would have made it actually useful?",
    category: "past_failure"
  },
  {
    id: "obj_042",
    scenario: "general",
    customerMessage: "How long will this take?",
    aiResponse: "Good question. It depends on scope — what's the core thing you need working first? If we prioritize that, I can give you a realistic timeline.",
    followUp: "Is there a specific date you need something by?",
    category: "logistics"
  },
  {
    id: "obj_043",
    scenario: "crm",
    customerMessage: "Our team won't use new software.",
    aiResponse: "That's the most common reason CRM implementations fail, honestly. What's made them resistant before — too complicated, not enough training, or they didn't see the value?",
    followUp: "Adoption is actually part of what I help with.",
    category: "internal_resistance"
  },
  {
    id: "obj_044",
    scenario: "web_development",
    customerMessage: "We get all our business from word of mouth.",
    aiResponse: "That's a great foundation. But word of mouth works even better when people can Google you and find something credible. What does your online presence look like right now?",
    followUp: "Have you Googled your own business lately?",
    category: "existing_solution"
  },
  {
    id: "obj_045",
    scenario: "general",
    customerMessage: "Can you work with our existing team?",
    aiResponse: "Absolutely — I prefer it, actually. Working alongside your team means knowledge transfer, not dependency on me forever. What does your team look like currently?",
    followUp: "I've worked embedded in teams of all sizes.",
    category: "logistics"
  },
  {
    id: "obj_046",
    scenario: "saas",
    customerMessage: "We're worried about vendor lock-in.",
    aiResponse: "Smart concern. How are you thinking about it — data portability, or the ability to switch tools down the road?",
    followUp: "I can build with open standards specifically to avoid that problem.",
    category: "risk"
  },
  {
    id: "obj_047",
    scenario: "general",
    customerMessage: "We've heard bad things about outsourcing.",
    aiResponse: "There's definitely horror stories out there. Most come from offshoring to teams with communication barriers. I'm local, I'm direct, and I communicate in plain English. What concerns do you specifically have?",
    followUp: "What would make you feel safe about working with someone external?",
    category: "trust"
  },
  {
    id: "obj_048",
    scenario: "ai_automation",
    customerMessage: "AI is just a buzzword right now.",
    aiResponse: "Some of it definitely is. But the underlying tech — automating repetitive tasks, analyzing patterns, generating content — that's very real and it's saving businesses real money. Are you curious about a specific use case?",
    followUp: "What's a task in your business you wish happened automatically?",
    category: "skepticism"
  },
  {
    id: "obj_049",
    scenario: "general",
    customerMessage: "We'll revisit this in the new year.",
    aiResponse: "January's always packed though — new budget, new priorities all hitting at once. What would need to happen between now and then for this to actually make the list?",
    followUp: "Can we at least get a call on the calendar now so it doesn't fall through?",
    category: "timing"
  },
  {
    id: "obj_050",
    scenario: "general",
    customerMessage: "I need to see more examples of your work.",
    aiResponse: "Of course. What industry or use case is most relevant to you? I'll pull the most similar examples I have.",
    followUp: "Do you want to jump on a call while I walk you through them?",
    category: "credibility"
  },
  {
    id: "obj_051",
    scenario: "appointment_booking",
    customerMessage: "We handle scheduling manually, it works fine.",
    aiResponse: "How many appointments are you booking a week? Because at some point manual becomes a real time drain. What's your current process — phone, email, text?",
    followUp: "What's the most annoying part of it?",
    category: "existing_solution"
  },
  {
    id: "obj_052",
    scenario: "general",
    customerMessage: "We already have an in-house IT team.",
    aiResponse: "What does your IT team mainly handle — infrastructure and support, or actual product development? Because those are pretty different skill sets.",
    followUp: "I typically work alongside IT, not instead of them.",
    category: "existing_solution"
  },
  {
    id: "obj_053",
    scenario: "general",
    customerMessage: "I'll think about it and get back to you.",
    aiResponse: "I appreciate that. I just want to make sure you have everything you need to make that decision. Is there any part of what we discussed that was unclear or felt uncertain?",
    followUp: "What would make this a clear yes for you?",
    category: "stall"
  },
  {
    id: "obj_054",
    scenario: "web_development",
    customerMessage: "We don't have content ready.",
    aiResponse: "That's one of the most common blockers. But content and development don't have to happen in sequence — we can build the structure first and fill it in. Or I can help with content strategy too.",
    followUp: "What do you currently have — any existing copy, branding, photos?",
    category: "logistics"
  },
  {
    id: "obj_055",
    scenario: "general",
    customerMessage: "We just signed a contract with someone else.",
    aiResponse: "Oh — okay. How long is the contract? And when it's up, would you be open to comparing?",
    followUp: "I'll reach out when the timing's better.",
    category: "timing"
  },
];

export const SCENARIOS: SalesScenario[] = [
  {
    id: "scenario_001",
    title: "Cold Call: Web Dev",
    description: "Pitch web development services to a local business owner",
    industry: "Web Development",
    difficulty: "easy",
    icon: "globe",
    systemPrompt: `You are a skeptical local business owner being cold-called by a web developer. You own a mid-size restaurant with 3 locations. Your current website was built 4 years ago and you haven't thought much about it. You're busy and slightly annoyed at being interrupted, but you'll engage if the caller seems knowledgeable. Start mildly resistant but open up if they ask good questions. Mention your website is slow sometimes and you've noticed competitors getting more Google reviews.`
  },
  {
    id: "scenario_002",
    title: "SaaS Automation Pitch",
    description: "Sell an automation SaaS tool to a startup founder",
    industry: "SaaS",
    difficulty: "medium",
    icon: "zap",
    systemPrompt: `You are a startup founder who has heard every sales pitch. You're technically savvy — you ask hard questions about integrations, uptime, and pricing. You're currently using 4-5 different tools that don't talk to each other well. You're interested in automation but skeptical of overpromising salespeople. Push back on ROI claims and ask for specifics. You'll convert if they speak your language.`
  },
  {
    id: "scenario_003",
    title: "AI Automation for Business",
    description: "Convince a traditional business owner to adopt AI tools",
    industry: "AI Automation",
    difficulty: "hard",
    icon: "cpu",
    systemPrompt: `You are a 55-year-old manufacturing business owner. You're profitable, traditional, and very skeptical of AI. You've heard "AI" a hundred times and think most of it is hype. You're worried about data security and your employees' jobs. You have real problems though: your quote generation process takes 3 days manually and your follow-up system is nonexistent. You'll only engage deeply if they acknowledge your skepticism and don't oversell.`
  },
  {
    id: "scenario_004",
    title: "Lead Generation Services",
    description: "Pitch lead gen services to an agency owner",
    industry: "Lead Generation",
    difficulty: "medium",
    icon: "target",
    systemPrompt: `You are the owner of a 10-person digital marketing agency. You've tried outsourced lead gen twice and been burned. You're open to trying again if the pitch is differentiated. You care deeply about lead quality over quantity. Ask pointed questions about their targeting methodology and how they qualify leads. You convert if they can show they understand your niche.`
  },
  {
    id: "scenario_005",
    title: "Appointment Booking System",
    description: "Sell an automated booking system to a service business",
    industry: "Appointment Booking",
    difficulty: "easy",
    icon: "calendar",
    systemPrompt: `You run a busy hair salon with 8 stylists. You currently handle all bookings via phone and Instagram DMs, which is chaotic. You're curious about automation but worried your older clients won't adapt. You manage a team and don't have much time. You'll engage if they understand your specific situation and keep it simple.`
  },
  {
    id: "scenario_006",
    title: "Website Redesign Pitch",
    description: "Convince a business to invest in a complete website overhaul",
    industry: "Web Development",
    difficulty: "medium",
    icon: "layout",
    systemPrompt: `You are the marketing manager at a mid-size law firm. You know the website is outdated but getting budget approved is political. Your boss (the senior partner) is old-school and thinks the current site is fine. You personally want the upgrade but need strong ROI justification to bring to leadership. Be engaged but pragmatic — you need ammunition to make the internal case.`
  },
  {
    id: "scenario_007",
    title: "CRM Implementation",
    description: "Sell CRM automation to a sales team leader",
    industry: "CRM",
    difficulty: "hard",
    icon: "users",
    systemPrompt: `You're the VP of Sales at a B2B company with a 15-person sales team. You've tried 3 different CRMs. They all get abandoned after 3 months because the team doesn't use them. You're extremely skeptical of CRM pitches. You'll only be convinced by someone who has a real strategy for adoption, not just features. You'll aggressively challenge any feature-only pitch.`
  },
  {
    id: "scenario_008",
    title: "Cold Call: AI Chatbot",
    description: "Pitch an AI customer service chatbot to an e-commerce brand",
    industry: "AI Automation",
    difficulty: "medium",
    icon: "message-circle",
    systemPrompt: `You run an e-commerce brand doing about $2M/year. Your customer service team is overwhelmed with repetitive questions — shipping status, returns, sizing. You've looked at chatbots but your last attempt (a rule-based one) was terrible and customers hated it. You're open to a better solution but need to understand exactly how modern AI chatbots are different from what you tried before.`
  },
];

export const PERSONALITIES: CustomerPersonality[] = [
  {
    id: "personality_001",
    name: "The Rude Boss",
    description: "Impatient, dismissive, uses short sentences",
    tone: "aggressive",
    responseStyle: "very short, cutting, impatient",
    traits: ["interrupts often", "uses dismissive language", "occasionally softens if impressed", "hates wasted time"]
  },
  {
    id: "personality_002",
    name: "The Busy Entrepreneur",
    description: "Always distracted, can be pulled in",
    tone: "distracted",
    responseStyle: "short bursts, sometimes trails off, mentions being busy",
    traits: ["multitasking during call", "asks for quick summary", "moves fast if interested", "respects brevity"]
  },
  {
    id: "personality_003",
    name: "The Friendly Founder",
    description: "Open, curious, asks lots of questions",
    tone: "warm",
    responseStyle: "conversational, medium length, curious follow-ups",
    traits: ["genuinely interested", "asks about process", "easy to talk to", "but still needs to justify ROI"]
  },
  {
    id: "personality_004",
    name: "The Skeptical Manager",
    description: "Doubts everything, needs proof",
    tone: "skeptical",
    responseStyle: "probing questions, demands specifics, medium length",
    traits: ["challenges claims", "asks for case studies", "respects data", "slow to trust"]
  },
  {
    id: "personality_005",
    name: "The Price-Sensitive Client",
    description: "Everything comes back to cost",
    tone: "cautious",
    responseStyle: "medium length, always pivots to price",
    traits: ["compares to competitors", "asks about ROI constantly", "willing to buy if value is clear", "budget-conscious"]
  },
  {
    id: "personality_006",
    name: "The Tech-Savvy CTO",
    description: "Knows the tech, asks hard questions",
    tone: "analytical",
    responseStyle: "technical, medium-long, precise",
    traits: ["asks about architecture", "calls out buzzwords", "respects technical honesty", "impatient with fluff"]
  },
  {
    id: "personality_007",
    name: "The Non-Tech Owner",
    description: "Doesn't understand tech, but needs results",
    tone: "confused but open",
    responseStyle: "medium length, asks for plain language explanations",
    traits: ["gets lost in jargon", "responds to analogies", "trusts gut feeling", "just wants it to work"]
  },
];
