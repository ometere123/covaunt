'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatNear, humanDate, purposeLabel, shortAccount } from '../lib/format';
import { ContributionForm } from './ContributionForm';
import { LiveState } from './LiveState';
import { useData } from './DataProvider';

export function CovenantRegister() {
  const { ledger } = useData();
  const [filter, setFilter] = useState('all');
  return <LiveState>{ledger && <>
    <section className="section-wrap page-intro"><p className="kicker">Covenants / donor permissions</p><h1>Capital with a <em>personal boundary</em></h1><p className="page-lede">A covenant records purpose, beneficiary and time conditions on-chain. Browse the public register, then open the deposit desk when you are ready to sign one.</p><div className="filter-row" role="group" aria-label="Filter covenants by purpose"><button className={filter === 'all' ? 'filter-active' : ''} type="button" onClick={() => setFilter('all')}>All entries</button><button className={filter === '1' ? 'filter-active' : ''} type="button" onClick={() => setFilter('1')}>Education</button><button className={filter === '2' ? 'filter-active' : ''} type="button" onClick={() => setFilter('2')}>Healthcare</button></div></section>
    <section className="section-wrap table-section"><div className="section-heading"><div><p className="kicker">Verified public ledger</p><h2>Restrictions do not blend</h2></div><span className="table-meta">Read-only register</span></div><div className="table-scroll"><table className="ledger-table"><thead><tr><th>Covenant</th><th>Permitted purposes</th><th>Recipients</th><th>Available</th><th>Unlock</th></tr></thead><tbody>{ledger.contributions.filter((c) => filter === 'all' || (c.allowed_purposes & Number(filter)) !== 0).map((c) => <tr key={c.id}><td><Link href={`/covenants/${c.id}`}><strong>COV-{String(c.id).padStart(3, '0')}</strong><span>{shortAccount(c.donor)}</span></Link></td><td>{purposeLabel(c.allowed_purposes)}</td><td><span className="recipient-list">{c.recipients.map((recipient) => shortAccount(recipient)).join(', ')}</span></td><td className="number">{formatNear(c.available)} Ⓝ</td><td>{humanDate(c.withdraw_after_ns)}</td></tr>)}</tbody></table></div></section>
    <section className="section-wrap form-section" id="deposit"><div className="form-section-copy"><p className="kicker">Deposit desk</p><h2>Choose what your money may mean</h2><p>The restrictions below are passed to the deployed contract in the same transaction as the attached NEAR. The interface does not hold or rewrite them.</p><ol className="numbered-list"><li><strong>Purpose</strong><span>What kind of community need can be supported</span></li><li><strong>Recipient</strong><span>Which account can receive a compatible payment</span></li><li><strong>Unlock</strong><span>When unused capital becomes refundable to you</span></li></ol></div><ContributionForm /></section>
  </>}</LiveState>;
}
