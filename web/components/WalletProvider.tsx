'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { connect as connectWallet, describeWalletError, disconnect as disconnectWallet, getConnected, getConnector, signCall } from '../lib/wallet';

type WalletState = {
  accountId: string | null;
  walletName: string | null;
  busy: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signCall: typeof signCall;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getConnected().then((current) => {
      if (!active) return;
      setAccountId(current?.accountId || null);
      setWalletName(current?.wallet.manifest.name || null);
    });
    const connector = getConnector();
    const onSignIn = (event: { wallet: { manifest: { name: string } }; accounts: { accountId: string }[] }) => {
      setAccountId(event.accounts[0]?.accountId || null);
      setWalletName(event.wallet.manifest.name || null);
      setError(null);
    };
    const onSignOut = () => {
      setAccountId(null);
      setWalletName(null);
    };
    connector.on('wallet:signIn', onSignIn);
    connector.on('wallet:signOut', onSignOut);
    return () => {
      active = false;
      connector.off('wallet:signIn', onSignIn);
      connector.off('wallet:signOut', onSignOut);
    };
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const current = await connectWallet();
      setAccountId(current.accountId);
      setWalletName(current.wallet.manifest.name);
    } catch (error) {
      setError(describeWalletError(error));
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await disconnectWallet();
      setAccountId(null);
      setWalletName(null);
    } catch (error) {
      setError(describeWalletError(error));
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo(() => ({ accountId, walletName, busy, error, connect, disconnect, signCall }), [accountId, walletName, busy, error, connect, disconnect]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useWallet must be used inside WalletProvider');
  return value;
}
