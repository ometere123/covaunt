'use client';

import Link from 'next/link';
import { CONFIG, explorerAccount } from '../lib/config';
import { formatNear, humanDate, purposeLabel, shortAccount } from '../lib/format';
import { LedgerStats } from './LedgerStats';
import { LiveState } from './LiveState';
import { useData } from './DataProvider';

export function TreasuryView() {
  const { ledger, refresh } = useData();
  return <LiveState>{ledger && <>
    <section className="section-wrap page-intro"><p className="kicker">Capital register / public read</p><h1>The treasury is a ledger, <em>not a promise</em></h1><p className="page-lede">This view separates donor principal from the vault’s storage reserve and shows exactly what is available, pending, paid and returned.</p><div className="page-actions"><button className="button button-outline" type="button" onClick={() => void refresh()}>Refresh final state ↻</button><a className="text-link" href={explorerAccount(CONFIG.contractId)} target="_blank" rel="noreferrer">Open vault account ↗</a></div></section>
    <section className="section-wrap"><LedgerStats summary={ledger.summary} /><div className="reconciliation"><div><span className="kicker">Conservation check</span><strong>{ledger.summary.is_balanced ? 'Balanced' : 'Investigate'}</strong><p>Paid + refunded + available + pending = deposited</p></div><div><span className="kicker">Storage reserve</span><strong>{formatNear(ledger.summary.reserve)} Ⓝ</strong><p>Segregated reserve recorded at initialization</p></div><div><span className="kicker">Pending obligations</span><strong>{formatNear(BigInt(ledger.summary.pending_spend) + BigInt(ledger.summary.pending_refund))} Ⓝ</strong><p>Callbacks still in flight</p></div></div></section>
    <section className="section-wrap table-section"><div className="section-heading"><div><p className="kicker">All live entries</p><h2>Contribution register</h2></div><span className="table-meta">{ledger.contributions.length} of 256 ledger slots visible</span></div><div className="table-scroll"><table className="ledger-table"><thead><tr><th>Entry / donor</th><th>Purpose</th><th>Available</th><th>Paid</th><th>Unlock</th></tr></thead><tbody>{ledger.contributions.map((c) => <tr key={c.id}><td><Link href={`/covenants/${c.id}`}><strong>COV-{String(c.id).padStart(3, '0')}</strong><span>{shortAccount(c.donor)}</span></Link></td><td>{purposeLabel(c.allowed_purposes)}</td><td className="number">{formatNear(c.available)} Ⓝ</td><td className="number">{formatNear(c.paid)} Ⓝ</td><td>{humanDate(c.withdraw_after_ns)}</td></tr>)}</tbody></table></div></section>
    <section className="section-wrap callout-row"><div className="callout"><span className="callout-index">01</span><div><h3>Reserve is not donor capital</h3><p>The contract keeps initialization storage funding separate from contribution accounting. The public audit estimates solvency with this distinction intact.</p></div></div><div className="callout"><span className="callout-index">02</span><div><h3>Read settlement, not approval</h3><p>Each spend remains InFlight until the transfer callback settles or restores the allocation. Sputnik status alone never appears as paid.</p></div></div></section>
  </>}</LiveState>;
}
