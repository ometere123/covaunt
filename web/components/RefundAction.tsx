'use client';

import { useState } from 'react';
import { CONFIG, explorerTx } from '../lib/config';
import { daysUntil, formatNear } from '../lib/format';
import { describeWalletError } from '../lib/wallet';
import type { Contribution } from '../lib/types';
import { useData } from './DataProvider';
import { useWallet } from './WalletProvider';

function transactionHash(value: unknown) {
  const result = value as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } } | null;
  return result?.transaction?.hash || result?.transaction_outcome?.id;
}

export function RefundAction({ contribution }: { contribution: Contribution }) {
  const { accountId, signCall } = useWallet();
  const { refresh, mode } = useData();
  const [state, setState] = useState<{ message: string; hash?: string; error?: boolean } | null>(null);
  const eligible = BigInt(contribution.available) > BigInt(0) && BigInt(contribution.pending_refund) === BigInt(0) && daysUntil(contribution.withdraw_after_ns) <= 0;
  const isDonor = accountId === contribution.donor;

  const refund = async () => {
    if (!isDonor || !eligible || mode === 'preview') return;
    try {
      setState({ message: 'Awaiting wallet approval. The refund remains pending until the callback settles.' });
      const outcome = await signCall(CONFIG.contractId, 'request_refund', { id: contribution.id }, '90000000000000', '0');
      const hash = transactionHash(outcome);
      setState({ message: 'Refund request finalized. The ledger is being refreshed.', hash });
      await refresh();
    } catch (error) {
      setState({ message: describeWalletError(error), error: true });
    }
  };

  return <div className="refund-panel">
    <div><strong>Refund eligibility</strong><span>{formatNear(contribution.available)} NEAR available</span></div>
    {!accountId && <p>Connect the original donor wallet to request an expired balance refund.</p>}
    {accountId && !isDonor && <p>This wallet is not the recorded donor. Refunds are donor-only.</p>}
    {isDonor && !eligible && <p>Still locked or already reserved. The contract, not this interface, determines eligibility.</p>}
    <button className="button button-outline" type="button" disabled={!isDonor || !eligible || mode === 'preview'} onClick={() => void refund()}>{eligible && isDonor ? 'Request eligible refund' : 'Refund not available'}</button>
    {state && <div className={`form-result ${state.error ? 'result-error' : 'result-neutral'}`} role="status"><span>{state.message}</span>{state.hash && <a href={explorerTx(state.hash)} target="_blank" rel="noreferrer">Open transaction ↗</a>}</div>}
  </div>;
}
