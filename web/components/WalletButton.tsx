'use client';

import { shortAccount } from '../lib/format';
import { useWallet } from './WalletProvider';

export function WalletButton() {
  const { accountId, walletName, busy, error, connect, disconnect } = useWallet();
  if (accountId) {
    return (
      <div className="wallet-cluster">
        <span className="wallet-account" title={accountId}><span className="live-dot" />{shortAccount(accountId)}</span>
        <button className="button button-quiet" type="button" onClick={() => void disconnect()} disabled={busy} aria-label="Disconnect NEAR wallet">
          {busy ? 'Closing' : 'Disconnect'}
        </button>
        <span className="sr-only">Connected with {walletName || 'NEAR wallet'}</span>
      </div>
    );
  }
  return (
    <div className="wallet-cluster">
      <button id="wallet-button" className="button button-dark" type="button" onClick={() => void connect()} disabled={busy}>
        <span className="button-mark" aria-hidden="true">↗</span>
        <span className="wallet-label-full">{busy ? 'Opening wallet chooser' : 'Connect wallet'}</span>
        <span className="wallet-label-short">{busy ? 'Opening' : 'Wallet'}</span>
      </button>
      {error ? <span className="wallet-error" role="status">{error}</span> : <span className="wallet-caption">Select a testnet wallet</span>}
    </div>
  );
}
