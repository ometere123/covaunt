'use client';

import Link from 'next/link';
import { CONFIG, explorerTx } from '../lib/config';
import { formatNear, purposeLabel, statusLabel } from '../lib/format';
import { useData } from './DataProvider';

const evidence = [
  { id: 'valid', label: 'Valid settlement', amount: '9.00', description: 'Healthcare-compatible capital settled to the authorized clinic after both council approvals.', hash: 'Gv7yUyZ24JkPSW4p12pM8cLG48e83ZkMkzagZAENioG1', tone: 'journal-dark' },
  { id: 'forbidden', label: 'Forbidden payment', amount: '2.00', description: 'The DAO approved the attempt, but COVAUNT could not redirect incompatible donor money. Final Sputnik outcome: Failed.', hash: 'BdP4EaxEdfGXda1k1LnCow5JJZBC5Z7k5rdBWGoskArw', tone: 'journal-alert' },
  { id: 'refund', label: 'Successful refund', amount: '0.10', description: 'An expired balance returned to its original donor after the contract and callback checks completed.', hash: 'DKJEShdGxtLai6xPdRC7JzJ8EwAggv4jqHkz2RLRzU7V', tone: 'journal-light' },
];

export function JournalView() {
  const { ledger, mode } = useData();
  return <>
    <section className="section-wrap page-intro"><p className="kicker">Public journal / verified evidence</p><h1>Proof lives in <em>receipts and state</em></h1><p className="page-lede">These case studies are anchored to recorded NEAR testnet transactions. A proposal vote is labeled as governance; a payment is labeled only after the vault’s callback settles.</p><div className="audit-banner"><span className="ledger-mark">✓</span><div><strong>Evidence set verified against the supplied testnet records</strong><p>Vault <code>{CONFIG.contractId}</code> · DAO <code>{CONFIG.daoId}</code> · code hash <code>{CONFIG.codeHash}</code></p></div></div></section>
    <section className="section-wrap journal-section"><div className="journal-timeline">{evidence.map((item, index) => <article className={`journal-entry ${item.tone}`} id={item.id} key={item.id}><div className="journal-marker">0{index + 1}</div><div className="journal-copy"><span className="case-label">{item.label} · {item.amount} NEAR</span><h2>{item.id === 'valid' ? 'Compatible capital found a path' : item.id === 'forbidden' ? 'A majority met the boundary' : 'The donor took back what remained'}</h2><p>{item.description}</p><a href={explorerTx(item.hash)} target="_blank" rel="noreferrer">Open transaction receipt ↗</a></div><div className="journal-hash"><span>NEAR testnet</span><code>{item.hash}</code></div></article>)}</div></section>
    <section className="section-wrap journal-live"><div className="section-heading"><div><p className="kicker">Contract ledger</p><h2>Observed spend records</h2></div><span className="table-meta">{mode === 'live' ? 'Final RPC read' : 'Preview is illustrative'}</span></div>{ledger?.spends.length ? <div className="journal-list">{ledger.spends.slice().reverse().map((spend) => <Link href={`/mandates/${encodeURIComponent(spend.id)}`} className="journal-list-row" key={spend.id}><span>{spend.id}</span><strong>{spend.title}</strong><span>{formatNear(spend.amount)} Ⓝ · {purposeLabel(spend.purpose)}</span><em className={`status status-${spend.status.toLowerCase()}`}>{statusLabel(spend.status)}</em></Link>)}</div> : <div className="empty-journal"><strong>No spend records returned in this read</strong><span>The historic evidence above remains linked to its transaction receipts</span></div>}</section>
  </>;
}
