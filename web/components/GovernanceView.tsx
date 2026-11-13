'use client';

import { CONFIG, explorerAccount } from '../lib/config';
import { formatNear, humanDuration } from '../lib/format';
import { LiveState } from './LiveState';
import { useData } from './DataProvider';

function councilMembers(policy: NonNullable<ReturnType<typeof useData>['policy']>) {
  const group = policy.roles.find((role) => role.name === 'council')?.kind;
  if (group && typeof group === 'object' && 'Group' in group && Array.isArray(group.Group)) return group.Group;
  return [];
}

export function GovernanceView() {
  const { policy } = useData();
  return <LiveState>{policy && <section className="section-wrap governance-page"><div className="page-intro"><p className="kicker">Governance / Sputnik DAO</p><h1>Collective authority, <em>bounded by consent</em></h1><p className="page-lede">COVAUNT does not replace Sputnik’s policy. It gives that policy a treasury target whose donor restrictions remain independent of the council’s vote.</p></div><div className="governance-grid"><div className="policy-sheet"><div className="policy-heading"><span>Configured DAO</span><a href={explorerAccount(CONFIG.daoId)} target="_blank" rel="noreferrer">Open account ↗</a></div><code className="large-code">{CONFIG.daoId}</code><div className="policy-facts"><div><span>Proposal bond</span><strong>{formatNear(policy.proposal_bond)} Ⓝ</strong></div><div><span>Proposal period</span><strong>{humanDuration(policy.proposal_period)}</strong></div><div><span>Default weight</span><strong>{policy.default_vote_policy?.weight_kind || 'Policy-defined'}</strong></div><div><span>Threshold</span><strong>Policy-defined</strong></div></div></div><div className="council-sheet"><span className="kicker">Council role</span><h2>Who may finalize?</h2><p>The on-chain policy lists the accounts below. Connecting a wallet never grants council rights automatically.</p><ol>{councilMembers(policy).map((member) => <li key={member}><span>{member}</span><a href={explorerAccount(member)} target="_blank" rel="noreferrer">account ↗</a></li>)}</ol></div></div><div className="governance-note"><strong>Two contracts, two questions</strong><span>Sputnik asks whether the DAO authorizes the proposed FunctionCall. COVAUNT asks whether the exact call matches immutable donor purpose, recipient and time conditions. Both must succeed before a beneficiary is paid.</span></div></section>}</LiveState>;
}
