// Model ids, checked against official docs on 2026-10-30:
//  - ai.google.dev/gemini-api/docs/models, /speech-generation, /live-api (WebSocket with ?key=)
//  - console.groq.com/docs/models and /docs/speech-to-text
//  - openrouter.ai/api/v1/models (public list; "openrouter/free" routes to a currently free model)
export const GEMINI_CHAT_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
export const GEMINI_TTS_MODEL = "gemini-3.8-flash-tts"; // TODO(verify): TTS response shape not tested with a real key.
export const GEMINI_LIVE_MODEL = "gemini-3.8-live"; // TODO(verify): not tested with a real key / on a phone.
export const GROQ_CHAT_MODEL = "openai/gpt-oss-20b";
export const GROQ_STT_MODEL = "whisper-large-v3-turbo";
// Free-model router: avoids hard-coding a ":free" model that OpenRouter may retire.
// TODO(verify): reply quality/latency of whatever free model it routes to.
export const OPENROUTER_CHAT_MODEL = "openrouter/free";

export const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
export const GROQ_BASE = "https://api.groq.com/openai/v1";
export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
