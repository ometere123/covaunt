import Link from 'next/link';

export const metadata = { title: 'Work' };

export default function WorkPage() {
  return <section className="section-wrap page-intro work-page"><p className="kicker">Work & trust / scope boundary</p><h1>Coordination should earn its <em>own record</em></h1><p className="page-lede">The deployed vault is intentionally limited to consent-bound contributions, DAO mandates, payouts and refunds. It does not invent tasks, completion evidence or reputations.</p><div className="work-scope"><div><span className="scope-state">Not implemented in the vault</span><h2>Community work records</h2><p>A future auxiliary record system could associate a bounded task budget with a named NEAR account, completion evidence and an accountable verifier. It must remain separate from donor custody.</p></div><div><span className="scope-state scope-state-live">Implemented now</span><h2>Traceable money movement</h2><p>Contributions, allocation quotes, Sputnik proposals, callback outcomes and donor refunds are available through the live treasury routes.</p><Link className="text-link" href="/journal">Open the journal ↗</Link></div></div><div className="governance-note"><strong>No automatic task payouts</strong><span>COVAUNT does not claim that receiving a grant proves completed work. No task or reputation data is displayed as fact here.</span></div></section>;
}
