import { CONFIG } from '../../../lib/config';

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function testnetRpcUrl() {
  const url = new URL(CONFIG.rpc);
  if (url.protocol !== 'https:' || url.hostname !== 'rpc.testnet.near.org') {
    throw new Error('COVAUNT is configured for the NEAR testnet RPC only');
  }
  return url.toString();
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: { message: 'Invalid JSON-RPC request' } }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Response.json({ error: { message: 'JSON-RPC body must be an object' } }, { status: 400 });
  }

  const body = payload as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
  if (body.jsonrpc !== '2.0' || body.method !== 'query' || !body.params || typeof body.params !== 'object' || Array.isArray(body.params)) {
    return Response.json({ error: { message: 'Only read-only NEAR query calls are allowed' } }, { status: 400 });
  }

  let endpoint: string;
  try {
    endpoint = testnetRpcUrl();
  } catch (error) {
    return Response.json({ error: { message: error instanceof Error ? error.message : String(error) } }, { status: 500 });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!RETRYABLE_STATUS.has(upstream.status) || attempt === 2) {
        const responseBody = await upstream.text();
        return new Response(responseBody, {
          status: upstream.ok ? 200 : 502,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        });
      }
    } catch (error) {
      if (attempt === 2) {
        return Response.json({ error: { message: error instanceof Error ? error.message : String(error) } }, { status: 502 });
      }
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  return Response.json({ error: { message: 'NEAR testnet RPC did not respond' } }, { status: 502 });
}
