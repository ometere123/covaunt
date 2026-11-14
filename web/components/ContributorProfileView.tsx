'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CONFIG, explorerAccount } from '../lib/config';
import { formatNear, humanDateTime, isValidAccount } from '../lib/format';
import { loadContributorStats } from '../lib/work';
import type { ContributorStats } from '../lib/work';
import { NearSocialPanel } from './NearSocialPanel';

export function ContributorProfileView({ account }: { account: string }) {
  const preview = useSearchParams().get('mode') === 'preview';
  const configured = Boolean(CONFIG.workContractId) && !preview;
  const [stats, setStats] = useState<ContributorStats | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !isValidAccount(account)) return;
    let active = true;
    void loadContributorStats(account).then((value) => {
      if (active) setStats(value);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Contributor record unavailable.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account, configured]);

  if (!isValidAccount(account)) return <section className="section-wrap detail-page"><div className="data-state data-state-error"><strong>Invalid account ID</strong><span>This route only accepts a canonical NEAR account identifier.</span><Link href="/work">Back to Work & Trust</Link></div></section>;

  return <section className="section-wrap detail-page contributor-page">
    <div className="back-link"><Link href="/work">← Work & Trust</Link></div>
    <div className="detail-header"><div><p className="kicker">Contributor record / independently verifiable work</p><h1>{account}</h1><p className="page-lede">This profile separates settled work outcomes from social activity and from donor contributions. It is only populated from the optional work contract.</p></div><Link className="text-link" href={explorerAccount(account)} target="_blank" rel="noreferrer">Open account on explorer ↗</Link></div>
    {!configured && <div className="data-state data-state-preview"><span className="state-rule" /><strong>{preview ? 'Preview mode · contributor reads disabled' : 'No live work contract configured'}</strong><span>There is no contributor history to show as fact in this release. The profile route remains available so a future verified contract can populate it.</span></div>}
    {configured && loading && <div className="data-state"><span className="state-rule" /><strong>Reading contributor record</strong><span>Checking the work contract.</span></div>}
    {configured && error && <div className="data-state data-state-error"><strong>Contributor record unavailable</strong><span>{error}</span></div>}
    {configured && !loading && !error && <div className="contributor-facts">{stats ? <><div><span>Named attestations</span><strong>{stats.verified_tasks}</strong><small>Not reputation; an account attestation only</small></div><div><span>Settled tasks</span><strong>{stats.settled_tasks}</strong></div><div><span>Rewards settled</span><strong>{formatNear(stats.rewards_paid)} Ⓝ</strong></div><div><span>Callback-settled reputation</span><strong>{stats.reputation_points}</strong><small>{stats.reputation_basis.replaceAll('_', ' ')}</small></div><div><span>Last settlement</span><strong>{humanDateTime(stats.last_settled_at_ns)}</strong></div></> : <div className="data-state"><strong>No work record</strong><span>This account has no settled or verified task record in the configured contract.</span></div>}</div>}
    {!preview && <NearSocialPanel accountId={account} />}
  </section>;
}
