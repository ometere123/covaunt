import Link from 'next/link';
import { useData } from './DataProvider';

export function LiveState({ children }: { children: React.ReactNode }) {
  const { loading, ledger, error, mode } = useData();
  if (loading) return <div className="data-state" role="status"><span className="state-rule" />Retrieving final state from NEAR testnet</div>;
  if (error || !ledger) {
    return <div className="data-state data-state-error" role="alert"><strong>Verified chain data is unavailable</strong><span>{error || 'The contract did not return a ledger'}</span><Link href="/about#limitations">Review the limitation</Link></div>;
  }
  if (mode === 'preview') return <><div className="data-state data-state-preview" role="note"><strong>Illustrative preview</strong><span>Values below are deterministic examples, not account balances or transactions</span></div>{children}</>;
  return <>{children}</>;
}
