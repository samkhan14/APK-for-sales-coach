import { translateToUrdu, translationErrorMessage, TranslationError } from "@/services/translationService";

jest.mock("expo-network", () => ({ useNetworkState: () => ({}) }));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isOffline } = require("@/components/OfflineBanner");

describe("I13 offline + translation failure", () => {
  test("offline fetch error becomes a friendly offline message (no throw of raw TypeError)", async () => {
    const failing = (() => Promise.reject(new TypeError("Network request failed"))) as unknown as typeof fetch;
    const err = await translateToUrdu("hello offline", failing).catch(e => e);
    expect(err).toBeInstanceOf(TranslationError);
    expect(translationErrorMessage(err)).toMatch(/offline/i);
  });
  test("HTTP 429 from service is a 'busy' message", async () => {
    const busy = (() => Promise.resolve({ ok: false, status: 429 })) as unknown as typeof fetch;
    const err = await translateToUrdu("hello busy", busy).catch(e => e);
    expect(translationErrorMessage(err)).toMatch(/busy/i);
  });
  test("success is returned and cached", async () => {
    const ok = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => ({ responseStatus: 200, responseData: { translatedText: "سلام" } }) })) as unknown as typeof fetch;
    expect(await translateToUrdu("hi cache", ok)).toBe("سلام");
    expect(await translateToUrdu("hi cache", ok)).toBe("سلام");
    expect(ok).toHaveBeenCalledTimes(1);
  });
  test("isOffline only true when network says so", () => {
    expect(isOffline({ isConnected: false })).toBe(true);
    expect(isOffline({ isConnected: true, isInternetReachable: false })).toBe(true);
    expect(isOffline({ isConnected: true, isInternetReachable: true })).toBe(false);
    expect(isOffline({})).toBe(false);
  });
});
