// F4: US local-business scenario packs (6 businesses x the CEO's two offers).
// F6: US objection library with model answers.
import type { Objection, SalesScenario } from "./database";

interface Biz {
  key: string; industry: string; business: string; owner: string; receptionist: string; icon: string;
  pain: string; difficulty: "easy" | "medium" | "hard";
}

const BUSINESSES: Biz[] = [
  { key: "dentist", industry: "Dental Clinic", business: "Bright Smile Dental", owner: "Dr. Karen Miller", receptionist: "Jenny", icon: "smile",
    pain: "Front desk misses calls at lunch, new-patient form is a PDF, and the website is not mobile friendly.", difficulty: "medium" },
  { key: "roofer", industry: "Roofing", business: "Summit Roofing", owner: "Mike Duncan", receptionist: "Tara", icon: "home",
    pain: "Storm season floods the phone; leads from Google go to voicemail while crews are on roofs.", difficulty: "hard" },
  { key: "restaurant", industry: "Restaurant", business: "Rosa's Kitchen", owner: "Rosa Alvarez", receptionist: "Danny", icon: "coffee",
    pain: "Reservations come by phone during rush hour, the menu on the site is outdated, and they pay high third-party fees.", difficulty: "easy" },
  { key: "salon", industry: "Hair Salon", business: "Luxe Hair Studio", owner: "Ashley Brooks", receptionist: "Mia", icon: "scissors",
    pain: "No-shows cost money; booking is by phone or Instagram DMs only.", difficulty: "easy" },
  { key: "hvac", industry: "HVAC", business: "CoolAir Heating & Cooling", owner: "Tom Becker", receptionist: "Linda", icon: "thermometer",
    pain: "After-hours emergency calls go to voicemail and those customers call a competitor.", difficulty: "medium" },
  { key: "law", industry: "Law Firm", business: "Grant & Associates", owner: "David Grant", receptionist: "Rachel", icon: "briefcase",
    pain: "Intake is slow, the site looks dated, and they worry about confidentiality with any new tool.", difficulty: "hard" },
];

const OFFERS = [
  { key: "web", label: "Website", pitch: "a modern, fast, mobile-friendly website that brings in more booked customers" },
  { key: "ai", label: "AI Automation", pitch: "AI automation: a website chatbot, online booking, and missed-call text-back" },
] as const;

export const US_SCENARIOS: SalesScenario[] = BUSINESSES.flatMap(b =>
  OFFERS.map(o => ({
    id: `us_${b.key}_${o.key}`,
    title: `${b.industry}: ${o.label}`,
    description: `Cold call ${b.business} (US) and pitch ${o.label.toLowerCase()}`,
    industry: `US Local - ${b.industry}`,
    difficulty: b.difficulty,
    icon: b.icon,
    customerName: b.owner,
    businessName: b.business,
    receptionistName: b.receptionist,
    systemPrompt: `You are ${b.owner}, owner of ${b.business}, a small ${b.industry.toLowerCase()} business in the United States. A caller from an outside agency is cold-calling to offer ${o.pitch}. Your real situation: ${b.pain} You are busy, a little wary of cold callers, and you speak like a normal American small-business owner (casual, direct). You have heard pitches before. Use realistic US objections when they fit (for example "just send me an email", "my nephew does our website", "we don't have the budget", "how did you get my number"). Warm up only if the caller asks good questions about your business and connects the offer to your actual problems.`,
  }))
);

export const US_OBJECTIONS: Objection[] = [
  { id: "us_obj_01", scenario: "us_local", category: "deflection", customerMessage: "Just send me an email.",
    aiResponse: "Happy to. So I send something useful and not generic: is the bigger headache right now missed calls or getting found on Google?",
    followUp: "What's the best email, and can I call Thursday to see if it made sense?" },
  { id: "us_obj_02", scenario: "us_local", category: "existing_solution", customerMessage: "My nephew does our website.",
    aiResponse: "That's great, family help is hard to beat. I'm not here to replace him. Most owners I talk to just want more booked jobs from the site. Is it bringing you new customers every week?",
    followUp: "Would it help if I sent him a free speed and mobile check he can use?" },
  { id: "us_obj_03", scenario: "us_local", category: "price", customerMessage: "We don't have the budget.",
    aiResponse: "Totally fair. Quick math: if one missed call is a lost job worth a few hundred dollars, how many of those happen a week? Usually this pays for itself with one or two jobs a month.",
    followUp: "If I could show the numbers on a 10-minute call, would that be worth a look?" },
  { id: "us_obj_04", scenario: "us_local", category: "not_interested", customerMessage: "Not interested.",
    aiResponse: "No problem, I appreciate you being straight with me. Before I go, is that because things are running well, or just bad timing?",
    followUp: "Mind if I check back next quarter?" },
  { id: "us_obj_05", scenario: "us_local", category: "trust", customerMessage: "How did you get my number?",
    aiResponse: "Fair question. Your business is listed publicly on Google, and I call local businesses that I think I can help. If you'd rather I not call again, I'll take you off my list right now.",
    followUp: "But if you have thirty seconds, can I tell you why I picked you?" },
  { id: "us_obj_06", scenario: "us_local", category: "stall", customerMessage: "Call me back later, I'm with a customer.",
    aiResponse: "Of course, customers come first. What's a better time, later today or tomorrow morning?",
    followUp: "I'll call at that time and keep it under five minutes." },
  { id: "us_obj_07", scenario: "us_local", category: "skepticism", customerMessage: "AI chatbots are annoying, my customers want a real person.",
    aiResponse: "I agree, nobody likes a bad bot. This one just answers the basic questions and books the appointment when your team can't pick up, then hands off to a real person.",
    followUp: "Would after-hours or lunch time be where that helps most?" },
  { id: "us_obj_08", scenario: "us_local", category: "gatekeeper", customerMessage: "He's busy. What is this regarding?",
    aiResponse: "Thanks for asking. It's about the calls that go to voicemail after hours. I have a quick idea that could help the front desk too. When is he usually free?",
    followUp: "Could you put me through for two minutes, or should I call back at that time?" },
  { id: "us_obj_09", scenario: "us_local", category: "past_failure", customerMessage: "We tried a marketing agency and it was a waste of money.",
    aiResponse: "Sorry to hear that, it happens a lot. What went wrong with them? I'd rather know now so I don't repeat it.",
    followUp: "What if we started with one small thing you can measure, like missed-call text-back?" },
  { id: "us_obj_10", scenario: "us_local", category: "timing", customerMessage: "We're too busy right now to take on a project.",
    aiResponse: "Busy is exactly when missed calls cost the most. Setup takes us about an hour of your time, and we do the rest.",
    followUp: "Would a short call next week be easier?" },
];
