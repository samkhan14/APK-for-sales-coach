const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const TIMEOUT_MS = 8000;

export interface TranslationResult {
  original: string;
  translated: string;
  language: "ur";
}

/** I13: typed failure so the UI can say *why* translation failed instead of crashing or hanging. */
export class TranslationError extends Error {
  constructor(public kind: "offline" | "timeout" | "service", message: string) {
    super(message);
    this.name = "TranslationError";
  }
}

export function translationErrorMessage(e: unknown): string {
  if (e instanceof TranslationError) {
    if (e.kind === "offline") return "You're offline. Translation needs internet.";
    if (e.kind === "timeout") return "Translation took too long. Try again.";
    return "Translation service is busy right now. Try again later.";
  }
  return "Translation failed. Try again.";
}

const cache = new Map<string, string>();

export async function translateToUrdu(text: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const key = text.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=en|ur`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetchImpl(url, { headers: { Accept: "application/json" }, signal: controller.signal });
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") throw new TranslationError("timeout", "Translation timed out");
    throw new TranslationError("offline", "Network request failed");
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) throw new TranslationError("service", `Translation request failed (${resp.status})`);

  let data: { responseStatus?: number; responseData?: { translatedText?: string } };
  try {
    data = await resp.json();
  } catch {
    throw new TranslationError("service", "Bad translation response");
  }
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    const result = data.responseData.translatedText;
    cache.set(key, result);
    return result;
  }
  throw new TranslationError("service", "Translation unavailable");
}

export async function translateWordToUrdu(word: string): Promise<string> {
  return translateToUrdu(word.trim());
}
