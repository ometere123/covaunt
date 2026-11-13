import { NextResponse } from 'next/server';
import { CONFIG } from '../../../lib/config';

const ACCOUNT_PATTERN = /^(?:[a-z\d]+(?:[-_.][a-z\d]+)*)$/;
const ALLOWED_PREFIXES = new Set(['profile/', 'post/']);

function validAccountId(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 2 && value.length <= 64 && !value.includes('..') && ACCOUNT_PATTERN.test(value);
}

export async function POST(request: Request) {
  let body: { accountId?: unknown; keyPrefix?: unknown };
  try {
    body = await request.json() as { accountId?: unknown; keyPrefix?: unknown };
  } catch {
    return NextResponse.json({ error: 'Send a JSON body with a NEAR account ID.' }, { status: 400 });
  }

  if (!validAccountId(body.accountId)) {
    return NextResponse.json({ error: 'Enter a valid NEAR account ID.' }, { status: 400 });
  }
  const keyPrefix = typeof body.keyPrefix === 'string' && ALLOWED_PREFIXES.has(body.keyPrefix) ? body.keyPrefix : 'post/';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const upstream = await fetch(`${CONFIG.nearSocialApi}/v0/latest/social/${encodeURIComponent(body.accountId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ key_prefix: keyPrefix }),
      cache: 'no-store',
      signal: controller.signal,
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json({ error: `near.social read returned HTTP ${upstream.status}.`, source: 'near.social-mainnet-fastdata' }, { status: 502 });
    }
    return NextResponse.json({ source: 'near.social-mainnet-fastdata', accountId: body.accountId, keyPrefix, data }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError' ? 'near.social read timed out.' : 'near.social read is unavailable.';
    return NextResponse.json({ error: message, source: 'near.social-mainnet-fastdata' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
