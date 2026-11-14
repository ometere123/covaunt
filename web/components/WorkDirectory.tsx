'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CONFIG } from '../lib/config';
import { formatWorkNear, humanDate, shortAccount, statusLabel } from '../lib/format';
import { loadWorkSnapshot } from '../lib/work';
import type { WorkSnapshot } from '../lib/work';

export function WorkDirectory() {
  const preview = useSearchParams().get('mode') === 'preview';
  const [snapshot, setSnapshot] = useState<WorkSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadWorkSnapshot({ allowLive: !preview }).then((value) => {
      if (active) setSnapshot(value);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'The work contract could not be read.');
    });
    return () => { active = false; };
  }, [preview]);

  return <section className="section-wrap page-intro work-directory">
    <div className="page-heading-row">
      <div><p className="kicker">Work & trust / verifiable coordination</p><h1>Make the work <em>legible</em></h1><p className="page-lede">Tasks, evidence, verification and reward callbacks belong to a separate, opt-in record system. The donor vault remains untouched.</p></div>
      <div className="page-heading-mark" aria-hidden="true"><span className="icon-stamp">W</span><small>SEPARATE TRUST DOMAIN</small></div>
    </div>
    {!snapshot && !error && <div className="data-state"><span className="state-rule" /><strong>Reading work records</strong><span>Checking whether an auxiliary Work & Trust contract is configured.</span></div>}
    {error && <div className="data-state data-state-error" role="alert"><strong>Work records unavailable</strong><span>{error}</span><Link href="/about#limitations">Review limitations</Link></div>}
    {snapshot && !snapshot.configured && <UnconfiguredWork preview={preview} />}
    {snapshot?.configured && snapshot.summary && <>
      <div className="work-actions"><Link className="button button-ink" href="/work/funding">Fund a task <span aria-hidden="true">↗</span></Link><Link className="button button-outline" href="/contributors">Contributor records</Link></div>
      <div className="work-stats" aria-label="Work contract accounting">
        <div><span>Task budgets</span><strong>{formatWorkNear(snapshot.summary.total_budget)} <small>Ⓝ</small></strong></div>
        <div><span>Settled rewards</span><strong>{formatWorkNear(snapshot.summary.total_paid)} <small>Ⓝ</small></strong></div>
        <div><span>Available</span><strong>{formatWorkNear(snapshot.summary.available_budget)} <small>Ⓝ</small></strong></div>
        <div><span>State</span><strong className={snapshot.summary.is_balanced ? 'work-good' : 'work-bad'}>{snapshot.summary.is_balanced ? 'Balanced' : 'Review'}</strong></div>
      </div>
      <div className="section-heading work-list-heading"><div><p className="kicker">On-chain task register</p><h2>Open work and <em>accountable outcomes</em></h2></div><span className="table-meta">{snapshot.summary.tasks} task record{snapshot.summary.tasks === 1 ? '' : 's'} · {CONFIG.workContractId}</span></div>
      {snapshot.tasks.length === 0 ? <div className="empty-journal"><strong>No task records yet</strong><span>Fund the first task through the graphical flow. This register does not invent tasks while the contract is empty.</span></div> : <div className="work-task-list">{snapshot.tasks.map((task) => <Link className="work-task-row" key={task.id} href={`/work/tasks/${task.id}`}><span className="work-task-id">WRK-{String(task.id).padStart(3, '0')}</span><span className="work-task-main"><strong>{task.title}</strong><small>{task.purpose}</small></span><span className="work-task-meta"><small>{task.tier} reward</small><strong>{formatWorkNear(task.reward_amount)} Ⓝ</strong></span><span className={`status status-${task.status.toLowerCase()}`}>{statusLabel(task.status)}</span><span className="work-task-deadline">Due {humanDate(task.deadline_ns)}<small>{task.claimant ? shortAccount(task.claimant) : 'Unclaimed'}</small></span></Link>)}</div>}
    </>}
  </section>;
}

function UnconfiguredWork({ preview }: { preview: boolean }) {
  return <div className="work-unconfigured">
    <div className="data-state data-state-preview"><span className="state-rule" /><strong>{preview ? 'Preview mode · Work & Trust reads disabled' : 'Work & Trust is not configured in this release'}</strong><span>No task, work, reward or reputation data is shown as live. The verified COVAUNT vault and Sputnik DAO remain fully independent.</span></div>
    <div className="work-scope work-scope-expanded">
      <div><span className="scope-state">Contract ready locally</span><h2>Bounded task records</h2><p>The auxiliary Rust contract records funded tasks, a single claimant, evidence, an authorized verifier and a settlement callback. Its budget is isolated from vault capital.</p><Link className="text-link" href="/about#work-trust">Read the trust boundary ↗</Link></div>
      <div><span className="scope-state scope-state-live">Live now</span><h2>Consent-bound treasury</h2><p>The deployed release already shows the valid 9 NEAR settlement, the blocked 2 NEAR diversion and the 0.1 NEAR refund from real testnet receipts.</p><Link className="text-link" href="/journal">Open the verified journal ↗</Link></div>
    </div>
    <div className="governance-note"><strong>Deployment gate</strong><span>Connecting this interface to a public Work & Trust contract requires a separately funded account, an independent release review and explicit testnet verification. No existing donor capital is used.</span></div>
    <div className="work-next-links"><Link href="/work/funding">Prepare a task budget <span aria-hidden="true">↗</span></Link><Link href="/contributors/example.testnet">Inspect a contributor record <span aria-hidden="true">↗</span></Link></div>
  </div>;
}
