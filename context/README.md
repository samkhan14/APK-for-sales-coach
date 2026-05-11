# Voice Sales Coach

A production-grade mobile AI voice sales practice application built with React Native (Expo) for Android.

## Purpose

This app simulates realistic cold calling and sales conversations to help users practice pitching web development, AI automation, and SaaS services to real-world customers. It provides a human-like conversation experience to improve sales skills, objection handling, and English fluency.

## Tech Stack

- **Frontend**: React Native (Expo), TypeScript, NativeWind (Tailwind for RN)
- **AI Providers**: Google Gemini API, Groq API, OpenRouter API
- **Voice**: Android Speech-to-Text, Expo Speech/TTS
- **Storage**: AsyncStorage (local SQLite)

## Key Features

- Realistic AI customer simulator with various personalities and scenarios
- Voice-based conversations with speech-to-text and text-to-speech
- API usage dashboard for tracking quota across providers
- Local database with 50+ objections and responses
- Light/Dark mode support

## Project Structure

- `artifacts/mobile/`: The main Expo app
- `lib/api-client-react/`: Shared React API client (currently unused)
- `context/`: Project documentation and requirements

## Development

Run the mobile app:

```bash
cd artifacts/mobile
pnpm install
pnpm run dev
```

## Requirements

See the files in `context/` for detailed feature requirements and API usage specs.