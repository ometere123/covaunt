'use client';

import { useState } from 'react';
import { CONFIG } from '../lib/config';
import { formatNear, shortAccount, statusLabel } from '../lib/format';
import { parseProposalDescription } from '../lib/near';
import { describeWalletError } from '../lib/wallet';
import type { DaoProposal } from '../lib/types';
import { useData } from './DataProvider';
import { useWallet } from './WalletProvider';

function transactionHash(value: unknown) {
  const result = value as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } } | null;
  return result?.transaction?.hash || result?.transaction_outcome?.id;
}

export function Docket() {
  const { proposals, refresh, mode } = useData();
  const { accountId, signCall } = useWallet();
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const vote = async (proposal: DaoProposal, choice: 'Approve' | 'Reject') => {
    if (!accountId || mode === 'preview' || proposal.status !== 'InProgress' || !proposal.kind) return;
    try {
      setBusy(proposal.id);
      setMessage('Awaiting a council signature. This vote is not a beneficiary payment.');
      const outcome = await signCall(CONFIG.daoId, 'act_proposal', { id: proposal.id, action: `Vote${choice}`, proposal: proposal.kind, memo: `COVAUNT council ${choice.toLowerCase()}` }, '300000000000000', '0');
      const hash = transactionHash(outcome);
      setMessage(`Vote finalized${hash ? ` · ${hash}` : ''}. Refresh the docket to inspect the DAO and vault outcomes separately.`);
      await refresh();
    } catch (error) {
      setMessage(describeWalletError(error));
    } finally {
      setBusy(null);
    }
  };

  if (mode === 'preview') return <div className="data-state data-state-preview"><strong>Preview docket is intentionally empty</strong><span>DAO votes are never simulated in this interface</span></div>;
  if (!proposals.length) return <div className="empty-journal"><strong>No COVAUNT mandates in the recent Sputnik docket</strong><span>Proposal history is read from the configured DAO, not from a local cache</span></div>;
  return <div className="docket-list">{message && <div className="form-result result-neutral" role="status">{message}</div>}{[...proposals].reverse().map((proposal) => {
    const details = parseProposalDescription(proposal.description) || {};
    const actions = proposal.kind?.FunctionCall?.actions || [];
    const encoded = actions.find((action) => action.method_name === 'execute_spend')?.args;
    return <article className="docket-entry" key={proposal.id}>
      <div className="docket-index">#{proposal.id}</div>
      <div className="docket-main"><div className="docket-title"><h3>{String(details.title || 'COVAUNT spending mandate')}</h3><span className={`status status-${proposal.status.toLowerCase()}`}>{statusLabel(proposal.status)}</span></div><p>{details.recipient ? shortAccount(String(details.recipient)) : shortAccount(proposal.proposer)} · {details.amount_yocto ? `${formatNear(String(details.amount_yocto))} NEAR` : 'amount not decoded'}</p><small>Proposed by {proposal.proposer}</small></div>
      <div className="docket-outcome"><span>DAO outcome</span><strong>{statusLabel(proposal.status)}</strong><span className="field-help">A DAO approval still needs a successful vault callback</span></div>
      {proposal.status === 'InProgress' && accountId && encoded && <div className="docket-actions"><button className="button button-outline" type="button" disabled={busy === proposal.id} onClick={() => void vote(proposal, 'Approve')}>{busy === proposal.id ? 'Waiting' : 'Vote approve'}</button><button className="button button-quiet" type="button" disabled={busy === proposal.id} onClick={() => void vote(proposal, 'Reject')}>Reject</button></div>}
    </article>;
  })}</div>;
}
