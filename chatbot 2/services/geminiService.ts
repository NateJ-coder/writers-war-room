
import { SYSTEM_INSTRUCTION } from '../constants';

// This client-side service now forwards requests to a server-side proxy
// instead of instantiating the Google GenAI client in the browser.
// Configure the proxy URL at build time using Vite env var `VITE_PROXY_URL`
// (e.g. VITE_PROXY_URL="https://.../api-proxy") or rely on the default
// relative path `/api/chat` for same-origin deployments.

const DEFAULT_PROXY = '/api/chat';

function getProxyUrl() {
  // import.meta.env is Vite's env object; VITE_ vars are exposed to the client
  // when building. If not set, fallback to DEFAULT_PROXY.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - import.meta is available in Vite-built code
  return (import.meta.env && import.meta.env.VITE_PROXY_URL) || DEFAULT_PROXY;
}

export async function runChat(message: string): Promise<string> {
  const proxy = getProxyUrl();

  try {
    const payload = {
      message,
      system: SYSTEM_INSTRUCTION
    };

    const res = await fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errBody = null;
      try { errBody = await res.json(); } catch (_) { errBody = await res.text(); }
      throw new Error(`Proxy error ${res.status}: ${JSON.stringify(errBody)}`);
    }

    const data = await res.json();
    // Proxy returns JSON shaped like { response: <text> } (backend standard)
    return data.response || data.output || JSON.stringify(data);
  } catch (err) {
    console.error('runChat proxy error:', err);
    throw err;
  }
}
