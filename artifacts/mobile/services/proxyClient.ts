// Single AI client: all model calls go through the Cloudflare proxy.
// Provider keys live only as Worker secrets on the proxy, never in the app.
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProxyReply {
  text: string;
  provider: string;
}

export class ProxyError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ProxyError";
    this.status = status;
  }
}

export interface ProxyConfig {
  url: string;
  token: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function getProxyConfig(): ProxyConfig {
  return {
    url: (process.env.EXPO_PUBLIC_PROXY_URL || "").replace(/\/+$/, ""),
    token: process.env.EXPO_PUBLIC_APP_TOKEN || "",
  };
}

export function isProxyConfigured(cfg: ProxyConfig = getProxyConfig()): boolean {
  return !!cfg.url && !!cfg.token;
}

export async function proxyChat(
  messages: ChatMessage[],
  opts: { system?: string; json?: boolean } = {},
  cfg: ProxyConfig = getProxyConfig()
): Promise<ProxyReply> {
  if (!isProxyConfigured(cfg)) {
    throw new ProxyError("AI proxy not configured (EXPO_PUBLIC_PROXY_URL / EXPO_PUBLIC_APP_TOKEN missing)");
  }
  const doFetch = cfg.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 30000);
  let resp: Response;
  try {
    resp = await doFetch(`${cfg.url}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify({ messages, system: opts.system, json: opts.json }),
      signal: controller.signal,
    });
  } catch (e) {
    throw new ProxyError(`Network error: ${(e as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) throw new ProxyError(`Proxy error ${resp.status}`, resp.status);
  const data = (await resp.json().catch(() => null)) as { text?: unknown; provider?: unknown } | null;
  const text = typeof data?.text === "string" ? data.text.trim() : "";
  if (!text) throw new ProxyError("Empty proxy response");
  return { text, provider: typeof data?.provider === "string" ? data.provider : "unknown" };
}
