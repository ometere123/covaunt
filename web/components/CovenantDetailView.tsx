'use client';

import Link from 'next/link';
import { CONFIG, explorerAccount } from '../lib/config';
import { formatNear, humanDate, purposeLabel } from '../lib/format';
import { RefundAction } from './RefundAction';
import { LiveState } from './LiveState';
import { useData } from './DataProvider';

export function CovenantDetailView({ id }: { id: string }) {
  const { ledger } = useData();
  const contribution = ledger?.contributions.find((item) => item.id === Number(id));
  return <LiveState>{contribution ? <section className="section-wrap detail-page"><div className="back-link"><Link href="/covenants">← All covenants</Link></div><div className="detail-header"><div><p className="kicker">Covenant COV-{String(contribution.id).padStart(3, '0')}</p><h1>A donor’s permission is <em>specific</em></h1><p className="page-lede">This record is read directly from {CONFIG.contractId}. It cannot be amended by a council vote or by the COVAUNT interface.</p></div><a className="text-link" href={explorerAccount(contribution.donor)} target="_blank" rel="noreferrer">Open donor account ↗</a></div><div className="detail-grid"><div className="detail-ledger"><div className="detail-balance"><span>Available balance</span><strong>{formatNear(contribution.available)} <small>Ⓝ</small></strong><em>of {formatNear(contribution.principal)} Ⓝ original principal</em></div><div className="detail-facts"><div><span>Donor</span><strong>{contribution.donor}</strong></div><div><span>Permitted purposes</span><strong>{purposeLabel(contribution.allowed_purposes)}</strong></div><div><span>Approved recipients</span><strong>{contribution.recipients.join(', ')}</strong></div><div><span>Paid</span><strong>{formatNear(contribution.paid)} Ⓝ</strong></div><div><span>Pending spend</span><strong>{formatNear(contribution.pending_spend)} Ⓝ</strong></div><div><span>Refunded</span><strong>{formatNear(contribution.refunded)} Ⓝ</strong></div><div><span>Withdrawal eligible after</span><strong>{humanDate(contribution.withdraw_after_ns)}</strong></div><div><span>Contributor note</span><strong>{contribution.note || 'No note recorded'}</strong></div></div></div><aside><RefundAction contribution={contribution} /><div className="restriction-note"><span className="ledger-mark">!</span><div><strong>Direct calls are subject to the same checks</strong><p>Recipient, purpose, donor identity, expiry and callback state are enforced by the deployed contract. UI restrictions are not the security boundary.</p></div></div></aside></div></section> : <div className="data-state data-state-error"><strong>Covenant not found in the verified ledger</strong><span>Only existing on-chain contribution IDs are shown here</span><Link href="/covenants">Return to register ↗</Link></div>}</LiveState>;
}
