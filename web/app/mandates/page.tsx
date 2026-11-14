import Link from 'next/link';
import { Docket } from '../../components/Docket';
import { MandateWorkbench } from '../../components/MandateWorkbench';

export const metadata = { title: 'Mandates' };

export default function MandatesPage() {
  return <><section className="section-wrap page-intro"><p className="kicker">Mandates / council docket</p><h1>Governance proposes. <em>The vault decides what qualifies.</em></h1><p className="page-lede">Build the exact Sputnik FunctionCall, ask the deployed contract for an allocation quote, then watch the DAO decision and downstream callback as separate states.</p><div className="boundary-note"><strong>Authorization boundary</strong><span>Proposal creation and voting are subject to Sputnik policy. They do not grant anyone custody or automatic council membership.</span><Link href="/governance">Inspect DAO policy ↗</Link></div></section><section className="section-wrap"><MandateWorkbench /></section><section className="section-wrap docket-section"><div className="section-heading"><div><p className="kicker">Live governance read</p><h2>The council docket</h2></div><span className="table-meta">DAO votes are not settlement</span></div><Docket /></section></>;
}
