'use client';

import Link from 'next/link';
import { CONFIG } from '../lib/config';
import { decodeFunctionCallArgs, parseProposalDescription } from '../lib/near';
import { formatNear, humanDateTime, purposeLabel, statusLabel } from '../lib/format';
import { LiveState } from './LiveState';
import { useData } from './DataProvider';

export function MandateDetailView({ id }: { id: string }) {
  const { proposals, ledger } = useData();
  const proposal = proposals.find((item) => String(item.id) === id);
  const description = proposal ? parseProposalDescription(proposal.description) : null;
  const action = proposal?.kind?.FunctionCall?.actions?.find((item) => item.method_name === 'execute_spend');
  const args = action ? decodeFunctionCallArgs(action.args) : null;
  const mandateId = String(description?.mandate_id || args?.id || '');
  const spend = ledger?.spends.find((item) => item.id === mandateId);
  return <LiveState>{proposal ? <section className="section-wrap detail-page"><div className="back-link"><Link href="/mandates">← Mandate chamber</Link></div><div className="detail-header"><div><p className="kicker">Mandate #{proposal.id}</p><h1>{String(description?.title || 'COVAUNT spending mandate')}</h1><p className="page-lede">A governance record and a vault settlement are two separate proofs. This page keeps them next to each other without collapsing one into the other.</p></div><span className={`status status-${proposal.status.toLowerCase()}`}>{statusLabel(proposal.status)}</span></div><div className="state-rail"><div className="state-step is-recorded"><span>01</span><strong>Sputnik proposal</strong><em>{statusLabel(proposal.status)}</em></div><div className={`state-step ${spend ? 'is-recorded' : ''}`}><span>02</span><strong>Vault execution</strong><em>{spend ? statusLabel(spend.status) : 'Not observed'}</em></div><div className={`state-step ${spend?.status === 'Settled' ? 'is-recorded' : ''}`}><span>03</span><strong>Beneficiary settlement</strong><em>{spend?.status === 'Settled' ? 'Settled callback' : 'Not claimed'}</em></div></div><div className="detail-grid mandate-detail-grid"><div className="detail-ledger"><div className="detail-facts"><div><span>Beneficiary</span><strong>{String(description?.recipient || args?.recipient || 'Not decoded')}</strong></div><div><span>Purpose</span><strong>{purposeLabel(Number(description?.purpose || args?.purpose || 0))}</strong></div><div><span>Requested amount</span><strong>{description?.amount_yocto || args?.amount ? `${formatNear(String(description?.amount_yocto || args?.amount))} Ⓝ` : 'Not decoded'}</strong></div><div><span>DAO proposer</span><strong>{proposal.proposer}</strong></div><div><span>Submitted</span><strong>{humanDateTime(proposal.submission_time)}</strong></div><div><span>Vault spend record</span><strong>{spend ? spend.id : 'No matching record'}</strong></div></div></div><aside><div className="restriction-note"><span className="ledger-mark">C</span><div><strong>Enforcement remains in the vault</strong><p>Even unanimous DAO approval cannot allocate a covenant whose purpose and recipient do not match. A failed downstream call is not a lost donor balance.</p></div></div>{spend?.reference && <a className="text-link" href={spend.reference} target="_blank" rel="noreferrer">Open mandate reference ↗</a>}</aside></div><p className="detail-disclosure">Configured contract: <code>{CONFIG.contractId}</code>. The proposal’s DAO transaction is not embedded here unless a verified transaction reference is available.</p></section> : <div className="data-state data-state-error"><strong>Mandate not found in the verified recent docket</strong><span>Proposal history is read directly from the configured Sputnik DAO</span><Link href="/mandates">Return to mandates ↗</Link></div>}</LiveState>;
}
