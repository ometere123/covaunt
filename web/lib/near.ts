import { CONFIG } from './config';
import type { Contribution, DaoPolicy, DaoProposal, Ledger, Quote, Spend, Summary } from './types';

let requestId = 0;

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === 'function') return btoa(binary);
  return Buffer.from(binary, 'binary').toString('base64');
}

export function encodeJsonBase64(value: unknown) {
  return encodeBase64(JSON.stringify(value));
}

function decodeBase64(value: string) {
  if (typeof atob === 'function') return atob(value);
  return Buffer.from(value, 'base64').toString('binary');
}

async function rpc(method: string, params: unknown) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(CONFIG.rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`NEAR RPC returned HTTP ${response.status}`);
    const body = await response.json();
    if (body.error) throw new Error(body.error.message || JSON.stringify(body.error));
    return body.result;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function view<T>(accountId: string, methodName: string, args: Record<string, unknown> = {}) {
  const result = await rpc('query', {
    request_type: 'call_function',
    finality: 'final',
    account_id: accountId,
    method_name: methodName,
    args_base64: encodeBase64(JSON.stringify(args)),
  });
  const bytes = Array.isArray(result.result)
    ? Uint8Array.from(result.result as number[])
    : Uint8Array.from(decodeBase64(result.result as string), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

async function pagedView<T>(methodName: string, total: number) {
  const result: T[] = [];
  for (let from = 0; from < total; from += 40) {
    result.push(...await view<T[]>(CONFIG.contractId, methodName, { from_index: from, limit: 40 }));
  }
  return result;
}

export async function loadLedger(): Promise<Ledger> {
  const summary = await view<Summary>(CONFIG.contractId, 'get_summary');
  if (summary.dao_id !== CONFIG.daoId) {
    throw new Error(`Configured DAO does not match the contract: ${summary.dao_id}`);
  }
  const [contributions, spends] = await Promise.all([
    pagedView<Contribution>('get_contributions', summary.contributions),
    pagedView<Spend>('get_spends', summary.spends),
  ]);
  return { summary, contributions, spends };
}

export async function loadPolicy() {
  return view<DaoPolicy>(CONFIG.daoId, 'get_policy');
}

export async function loadProposals() {
  const last = Number(await view<number | string>(CONFIG.daoId, 'get_last_proposal_id'));
  if (!Number.isSafeInteger(last) || last <= 0) return [];
  const proposals = await view<DaoProposal[]>(CONFIG.daoId, 'get_proposals', {
    from_index: Math.max(0, last - 40),
    limit: Math.min(40, last),
  });
  return proposals.filter((proposal) => {
    const kind = proposal.kind?.FunctionCall;
    return kind?.receiver_id === CONFIG.contractId && kind.actions?.some((action) => action.method_name === 'execute_spend');
  });
}

export async function loadSnapshot() {
  const [ledger, policy, proposals] = await Promise.all([loadLedger(), loadPolicy(), loadProposals()]);
  return { ledger, policy, proposals };
}

export async function contractQuote(recipient: string, purpose: number, amount: string) {
  return view<Quote>(CONFIG.contractId, 'quote', { recipient, purpose, amount });
}

export function decodeFunctionCallArgs(value: string) {
  try {
    const bytes = Uint8Array.from(decodeBase64(value), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, string | number>;
  } catch {
    return null;
  }
}

export function parseProposalDescription(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed.protocol === 'COVAUNT' ? parsed : null;
  } catch {
    return null;
  }
}
