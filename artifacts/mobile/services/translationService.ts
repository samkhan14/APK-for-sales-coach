const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

export interface TranslationResult {
  original: string;
  translated: string;
  language: "ur";
}

const cache = new Map<string, string>();

export async function translateToUrdu(text: string): Promise<string> {
  const key = text.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=en|ur`;
  const resp = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!resp.ok) throw new Error("Translation request failed");

  const data = await resp.json();
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    const result = data.responseData.translatedText as string;
    cache.set(key, result);
    return result;
  }
  throw new Error("Translation unavailable");
}

export async function translateWordToUrdu(word: string): Promise<string> {
  return translateToUrdu(word.trim());
}
