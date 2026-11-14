'use client';

import { NearConnector } from '@hot-labs/near-connect';
import { CONFIG } from './config';

let connector: NearConnector | null = null;

export function getConnector() {
  if (typeof window === 'undefined') throw new Error('Wallet access is browser-only');
  if (!connector) {
    connector = new NearConnector({ network: CONFIG.network, autoConnect: true });
  }
  return connector;
}

export async function getConnected() {
  try {
    const current = await getConnector().getConnectedWallet();
    const account = current.accounts[0]?.accountId;
    return account ? { ...current, accountId: account } : null;
  } catch {
    return null;
  }
}

export async function connect() {
  const wallet = await getConnector().connect();
  const accounts = await wallet.getAccounts({ network: CONFIG.network });
  const accountId = accounts[0]?.accountId;
  if (!accountId) throw new Error('The wallet did not return a testnet account');
  return { wallet, accountId };
}

export async function disconnect() {
  await getConnector().disconnect();
}

export async function signCall(receiverId: string, methodName: string, args: Record<string, unknown>, gas: string, deposit: string) {
  const current = await getConnected();
  if (!current) throw new Error('Connect a NEAR testnet wallet first');
  return current.wallet.signAndSendTransaction({
    network: CONFIG.network,
    signerId: current.accountId,
    receiverId,
    actions: [{ type: 'FunctionCall', params: { methodName, args, gas, deposit } }],
  });
}

export function describeWalletError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/reject|declin|cancel|denied/i.test(message)) return 'The wallet signature was rejected. No COVAUNT state was changed.';
  return message.replace(/\s+/g, ' ').trim();
}
