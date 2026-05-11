# AI Voice Sales Practice

A mobile app that simulates realistic cold calling and sales conversations, helping users practice pitching web development, AI automation, and SaaS services to AI-powered customers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` — AI provider keys

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native), expo-router, expo-speech
- State: React Context + AsyncStorage (no backend DB for first build)
- API: Express 5 (api-server artifact, minimal usage)
- AI: Gemini 1.5 Flash → Groq llama-3.1-8b → OpenRouter llama-3.1-8b → Local DB fallback
- Voice: expo-speech (TTS output), Web Speech API (STT on web)

## Where things live

- `artifacts/mobile/` — Expo app (main product)
- `artifacts/mobile/constants/database.ts` — 55+ objections, 8 scenarios, 7 personalities
- `artifacts/mobile/services/aiRouter.ts` — AI routing + fallback logic + feedback generation
- `artifacts/mobile/services/speechService.ts` — TTS via expo-speech
- `artifacts/mobile/contexts/AppContext.tsx` — call history, streaks, settings
- `artifacts/mobile/contexts/CallContext.tsx` — active call state machine
- `artifacts/mobile/app/(tabs)/` — Home, History, API Dashboard, Settings tabs
- `artifacts/mobile/app/call.tsx` — live voice call screen (full-screen modal)
- `artifacts/mobile/app/scenario-select.tsx` — scenario + difficulty picker (modal)

## Architecture decisions

- **Frontend-only first build**: All persistence via AsyncStorage — no database provisioned. Call history, usage stats, and streaks stored locally on device.
- **AI Router cascade**: Tries Gemini first (1500 req/day limit), falls back to Groq (14400/day), then OpenRouter (200/day), finally local scripted responses from the 55+ objections database.
- **EXPO_PUBLIC_ env vars**: API keys are passed through the dev script as `EXPO_PUBLIC_GEMINI_API_KEY` etc. so Metro bundler can include them in the client bundle.
- **Call state machine**: `idle → connecting → active ↔ ai_thinking ↔ ai_speaking → ended` managed in CallContext.
- **No native STT module**: STT uses Web Speech API on web preview. On native (Expo Go), the text input button provides a fallback. Full native STT would require a custom dev build.

## Product

- **Home**: Dashboard with stats (total calls, best/avg score), daily streak badge, recent session summary, quick tips
- **Practice**: Scenario + difficulty picker → full-screen call UI with waveform animation, live transcript, mic button, end call
- **History**: Scrollable call log with per-call score, date, and full feedback review
- **API Dashboard**: Real-time usage cards for Gemini/Groq/OpenRouter with progress bars, status indicators, reset timers, smart recommendation panel
- **Settings**: Dark mode toggle, API key status, app info

## User preferences

- Production-grade mobile app, not a demo
- Realistic AI customer behavior with 55+ objections database
- AI routing: Gemini → Groq → OpenRouter → local fallback

## Gotchas

- Always update the `dev` script in `artifacts/mobile/package.json` if new EXPO_PUBLIC_ env vars are needed — they must be passed explicitly through the script
- Native STT requires a custom dev build (not Expo Go compatible). Web Speech API is used on web preview. Users on physical devices should use the text-input button as fallback until a custom build is set up.
- `expo-speech` must be in package.json for TTS to work — it's not pre-installed in the scaffold

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile development guidelines
