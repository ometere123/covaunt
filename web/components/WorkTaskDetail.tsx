'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { explorerAccount } from '../lib/config';
import { formatNear, humanDateTime, shortAccount, statusLabel } from '../lib/format';
import { describeWalletError } from '../lib/wallet';
import { loadWorkDaoProposals, loadWorkPayouts, loadWorkSubmission, loadWorkTask, submitWorkDaoProposal, voteOnWorkDaoProposal, workCall, type WorkDaoProposal, type WorkPayout, type WorkSubmission, type WorkTask } from '../lib/work';
import { useWallet } from './WalletProvider';

function transactionHash(value: unknown) {
  const result = value as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } } | null;
  return result?.transaction?.hash || result?.transaction_outcome?.id;
}

type ActionState = { message: string; error?: boolean; hash?: string } | null;

export function WorkTaskDetail({ id }: { id: string }) {
  const taskId = Number(id);
  const preview = useSearchParams().get('mode') === 'preview';
  const { accountId, busy: walletBusy } = useWallet();
  const [task, setTask] = useState<WorkTask | null>(null);
  const [submission, setSubmission] = useState<WorkSubmission | null>(null);
  const [payouts, setPayouts] = useState<WorkPayout[]>([]);
  const [daoProposals, setDaoProposals] = useState<WorkDaoProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<ActionState>(null);
  const [evidenceUri, setEvidenceUri] = useState('');
  const [evidenceHash, setEvidenceHash] = useState('');
  const [verifierNote, setVerifierNote] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  const readRecord = useCallback(async () => {
    if (!Number.isSafeInteger(taskId) || taskId < 0) throw new Error('This task identifier is invalid.');
    const nextTask = await loadWorkTask(taskId);
    if (!nextTask) throw new Error('This task is not present in the configured work contract.');
    const nextSubmission = nextTask.submission_id === null ? null : await loadWorkSubmission(nextTask.submission_id);
    const [nextPayouts, nextDaoProposals] = await Promise.all([loadWorkPayouts(taskId), loadWorkDaoProposals(taskId)]);
    return { nextTask, nextSubmission, nextPayouts, nextDaoProposals };
  }, [taskId]);

  useEffect(() => {
    let active = true;
    if (preview) return () => { active = false; };
    void (async () => {
      try {
        const record = await readRecord();
        if (active) {
          setTask(record.nextTask);
          setSubmission(record.nextSubmission);
          setPayouts(record.nextPayouts);
          setDaoProposals(record.nextDaoProposals);
        }
      } catch (reason: unknown) {
        if (active) setError(reason instanceof Error ? reason.message : 'The task could not be read.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [preview, readRecord]);

  const reload = async () => {
    const record = await readRecord();
    setTask(record.nextTask);
    setSubmission(record.nextSubmission);
    setPayouts(record.nextPayouts);
    setDaoProposals(record.nextDaoProposals);
  };

  const execute = async (methodName: string, args: Record<string, unknown>) => {
    if (!accountId) {
      setAction({ message: 'Connect the account authorized for this transition before opening the wallet.', error: true });
      return;
    }
    setBusy(true);
    setAction({ message: 'Awaiting wallet approval. The task remains unchanged until the transaction result is read back.' });
    try {
      const outcome = await workCall(methodName, args);
      const hash = transactionHash(outcome);
      await reload();
      setAction({ message: 'Transaction result received and the work contract was re-read. Confirm the new state below.', hash });
    } catch (reason: unknown) {
      setAction({ message: `${describeWalletError(reason)} Check wallet history before retrying if the outcome was uncertain.`, error: true });
    } finally {
      setBusy(false);
    }
  };

  const submitEvidence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!evidenceUri.trim() || new TextEncoder().encode(evidenceUri.trim()).length > 1024 || new TextEncoder().encode(evidenceHash.trim()).length > 1024) {
      setAction({ message: 'Evidence URI and hash must each be 1,024 UTF-8 bytes or fewer.', error: true });
      return;
    }
    await execute('submit_completion', { task_id: taskId, evidence_uri: evidenceUri.trim(), evidence_hash: evidenceHash.trim() });
  };

  const verify = async (approved: boolean) => {
    await execute('verify_submission', { task_id: taskId, approved, note: verifierNote.trim() });
  };

  const raiseDispute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disputeReason.trim()) {
      setAction({ message: 'Give the dispute a short reason that can be stored on chain.', error: true });
      return;
    }
    await execute('raise_dispute', { task_id: taskId, reason: disputeReason.trim() });
  };

  const openDaoProposal = async (methodName: 'execute_large_reward' | 'resolve_dispute', args: Record<string, unknown>, description: string) => {
    if (!accountId) {
      setAction({ message: 'Connect a testnet wallet to open the Sputnik proposal. Connecting does not grant council rights.', error: true });
      return;
    }
    setBusy(true);
    setAction({ message: 'Reading the live DAO bond, then waiting for the selected wallet to approve the proposal transaction.' });
    try {
      const outcome = await submitWorkDaoProposal(methodName, args, description);
      const hash = transactionHash(outcome);
      await reload();
      setAction({ message: 'Sputnik proposal transaction returned. The DAO proposal, vote and Work callback remain separate states.', hash });
    } catch (reason: unknown) {
      setAction({ message: `${describeWalletError(reason)} Check the wallet history before retrying if the outcome was uncertain.`, error: true });
    } finally {
      setBusy(false);
    }
  };

  const openLargeRewardProposal = () => {
    const mandateId = `cwt-large-${taskId}-${Date.now().toString(36)}`;
    void openDaoProposal(
      'execute_large_reward',
      { task_id: taskId, mandate_id: mandateId },
      JSON.stringify({ protocol: 'COVAUNT-WORK', action: 'execute_large_reward', task_id: taskId, mandate_id: mandateId }),
    );
  };

  const proposeDisputeResolution = (upheld: boolean) => {
    const note = resolutionNote.trim();
    if (!note || new TextEncoder().encode(note).length > 500) {
      setAction({ message: 'Add a resolution note of 500 UTF-8 bytes or fewer before opening the DAO proposal.', error: true });
      return;
    }
    void openDaoProposal(
      'resolve_dispute',
      { task_id: taskId, upheld, note },
      JSON.stringify({ protocol: 'COVAUNT-WORK', action: 'resolve_dispute', task_id: taskId, upheld }),
    );
  };

  const vote = async (proposal: WorkDaoProposal, choice: 'Approve' | 'Reject') => {
    if (!accountId) {
      setAction({ message: 'Connect the council-compatible testnet wallet before voting. A connected account is not automatically a council member.', error: true });
      return;
    }
    setBusy(true);
    setAction({ message: `Waiting for the selected wallet to record a Sputnik ${choice.toLowerCase()} vote. A vote is not the Work payout callback.` });
    try {
      const outcome = await voteOnWorkDaoProposal(proposal, choice);
      const hash = transactionHash(outcome);
      await reload();
      setAction({ message: 'Vote transaction returned. Re-read the DAO status and Work task state before treating the action as settled.', hash });
    } catch (reason: unknown) {
      setAction({ message: `${describeWalletError(reason)} Check the wallet history before retrying if the outcome was uncertain.`, error: true });
    } finally {
      setBusy(false);
    }
  };

  if (preview) return <section className="section-wrap detail-page"><div className="data-state data-state-preview"><span className="state-rule" /><strong>Preview mode · Work & Trust reads disabled</strong><span>Task detail is only rendered from the configured auxiliary contract in live mode.</span><Link href="/work?mode=preview">Back to Work & Trust</Link></div></section>;
  if (loading) return <section className="section-wrap detail-page"><div className="data-state"><span className="state-rule" /><strong>Reading task record</strong><span>Waiting for final testnet data.</span></div></section>;
  if (error || !task) return <section className="section-wrap detail-page"><div className="data-state data-state-error" role="alert"><strong>Task unavailable</strong><span>{error || 'No task record was returned.'}</span><Link href="/work">Back to Work & Trust</Link></div></section>;

  const claimant = accountId && task.claimant === accountId;
  const creator = accountId === task.creator;
  const verifier = accountId === task.verifier;
  const approver = accountId === task.approver;
  const eligible = Boolean(accountId) && (task.eligibility.length === 0 || task.eligibility.includes(accountId as string));
  const canClaim = task.status === 'Open' && eligible;
  const canSubmit = task.status === 'Claimed' && claimant;
  const canVerify = task.status === 'Submitted' && verifier;
  const canApproveMedium = task.status === 'Verified' && task.tier === 'Medium' && approver && !task.dispute;
  const canDispute = Boolean((creator || claimant) && !task.dispute && task.pending_reward === '0' && task.pending_refund === '0');

  return <section className="section-wrap detail-page work-detail-page">
    <div className="back-link"><Link href="/work">← Work & Trust register</Link></div>
    <div className="detail-header"><div><p className="kicker">Task record / WRK-{String(task.id).padStart(3, '0')}</p><h1>{task.title}</h1><p className="page-lede">{task.purpose}</p></div><div className="detail-status-block"><span className={`status status-${task.status.toLowerCase()}`}>{statusLabel(task.status)}</span><small>{task.tier} reward path</small></div></div>
    <div className="work-detail-grid">
      <div>
        <div className="work-money-line"><span>Task budget</span><strong>{formatNear(task.budget)} <small>Ⓝ</small></strong><span>{formatNear(task.available)} available · {formatNear(task.paid)} settled</span></div>
        <div className="detail-facts"><div><span>Creator</span><strong><Link href={explorerAccount(task.creator)} target="_blank" rel="noreferrer">{shortAccount(task.creator)}</Link></strong></div><div><span>Worker</span><strong>{task.claimant ? <Link href={`/contributors/${encodeURIComponent(task.claimant)}`}>{shortAccount(task.claimant)}</Link> : 'Unclaimed'}</strong></div><div><span>Verifier</span><strong>{shortAccount(task.verifier)}</strong></div><div><span>Reward amount</span><strong>{formatNear(task.reward_amount)} Ⓝ</strong></div><div><span>Deadline</span><strong>{humanDateTime(task.deadline_ns)}</strong></div><div><span>Eligibility</span><strong>{task.eligibility.length ? `${task.eligibility.length} named account${task.eligibility.length === 1 ? '' : 's'}` : 'Open to any account'}</strong></div></div>
        <div className="state-rail work-state-rail"><div className={`state-step ${task.status !== 'Open' ? 'is-recorded' : ''}`}><span>01</span><strong>Claim</strong><em>{task.claimant ? 'Named' : 'Open'}</em></div><div className={`state-step ${['Submitted', 'Verified', 'Settled', 'Closed', 'Rejected'].includes(task.status) ? 'is-recorded' : ''}`}><span>02</span><strong>Evidence</strong><em>{submission ? statusLabel(submission.status) : 'Not submitted'}</em></div><div className={`state-step ${['Settled', 'Closed', 'Rejected'].includes(task.status) ? 'is-recorded' : ''}`}><span>03</span><strong>Settlement</strong><em>{task.status === 'Settled' ? 'Callback settled' : 'Not settled'}</em></div></div>
        {submission && <section className="work-evidence"><div className="form-heading"><span>Completion evidence</span><small>{statusLabel(submission.status)}</small></div><p><strong>URI</strong> <a href={submission.evidence_uri} target="_blank" rel="noreferrer">{submission.evidence_uri}</a></p><p><strong>Hash</strong> <code>{submission.evidence_hash || 'Not supplied'}</code></p>{submission.verifier_note && <p><strong>Verifier note</strong> {submission.verifier_note}</p>}{submission.verified_by && <p><strong>Named attestor</strong> <Link href={explorerAccount(submission.verified_by)} target="_blank" rel="noreferrer">{shortAccount(submission.verified_by)}</Link><br /><span className="field-help">{submission.verification_model === 'named_account_attestation' ? 'This is an on-chain named-account attestation, not independent proof of real-world work.' : 'The contract records the verifier identity.'}</span></p>}</section>}
        <section className="work-payouts"><div className="form-heading"><span>Settlement register</span><small>{payouts.length} attempt{payouts.length === 1 ? '' : 's'}</small></div>{payouts.length === 0 ? <p>No payout has been reserved. A verified completion is not the same as a settled transfer.</p> : <div className="work-payout-list">{payouts.map((payout) => <div key={payout.id}><span>Attempt {payout.attempt}</span><strong>{formatNear(payout.amount)} Ⓝ</strong><span className={`status status-${payout.status.toLowerCase()}`}>{statusLabel(payout.status)}</span><small>{payout.completed_at_ns ? humanDateTime(payout.completed_at_ns) : 'Awaiting callback'}</small></div>)}</div>}</section>
      </div>
      <aside className="work-action-rail">
        <div className="form-sheet"><div className="form-heading"><span>Authorized actions</span><small>Contract enforced</small></div>
          {!accountId && <p className="field-help">Connect a testnet wallet to see actions authorized for that account. Visitors can read every public task record without connecting.</p>}
          {accountId && canClaim && <ActionButton label="Claim this task" help="The contract will bind this task to your account." onClick={() => void execute('claim_task', { task_id: taskId })} disabled={busy || walletBusy} />}
          {accountId && task.status === 'Open' && !canClaim && <p className="field-help">This account is not in the task eligibility list. The contract will reject a direct claim.</p>}
          {accountId && canSubmit && <form onSubmit={(event) => void submitEvidence(event)}><label>Evidence URI<input value={evidenceUri} onChange={(event) => setEvidenceUri(event.target.value)} placeholder="https://…" required /></label><label>Evidence hash <span className="field-meta">optional</span><input value={evidenceHash} onChange={(event) => setEvidenceHash(event.target.value)} spellCheck={false} /></label><button className="button button-ink button-wide" type="submit" disabled={busy || walletBusy}>{busy ? 'Waiting for finality' : 'Submit completion evidence'} <span aria-hidden="true">↗</span></button></form>}
          {accountId && canVerify && <div className="action-block"><label>Verifier note <span className="field-meta">optional</span><textarea value={verifierNote} onChange={(event) => setVerifierNote(event.target.value)} rows={3} maxLength={500} /></label><div className="form-actions"><button className="button button-ink" type="button" onClick={() => void verify(true)} disabled={busy || walletBusy}>Approve completion</button><button className="button button-outline" type="button" onClick={() => void verify(false)} disabled={busy || walletBusy}>Reject</button></div></div>}
          {accountId && canApproveMedium && <ActionButton label="Approve medium reward" help="Only the configured approver can open this payout path." onClick={() => void execute('approve_medium_reward', { task_id: taskId })} disabled={busy || walletBusy} />}
          {accountId && task.tier === 'Large' && task.status === 'Verified' && <ActionButton label="Open DAO large-reward proposal" help="This creates a live Sputnik FunctionCall proposal using the current DAO bond. The configured DAO must execute it; connecting a wallet does not grant council rights." onClick={openLargeRewardProposal} disabled={busy || walletBusy} />}
          {accountId && !canClaim && !canSubmit && !canVerify && !canApproveMedium && task.status !== 'Open' && task.status !== 'Submitted' && task.status !== 'Verified' && <p className="field-help">No transition is authorized for this account in the current state.</p>}
        </div>
        {accountId && canDispute && <form className="form-sheet work-dispute-form" onSubmit={(event) => void raiseDispute(event)}><div className="form-heading"><span>Open a dispute</span><small>DAO resolution</small></div><label>Reason<textarea value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} maxLength={500} rows={3} required /></label><button className="button button-outline button-wide" type="submit" disabled={busy || walletBusy}>Record dispute</button></form>}
        {task.dispute?.status === 'Open' && accountId && <div className="form-sheet work-dispute-form"><div className="form-heading"><span>Propose dispute resolution</span><small>Sputnik FunctionCall</small></div><p className="field-help">Resolution is recorded by the configured DAO. It does not transfer task funds, and a DAO vote is not a settled payout.</p><label>Resolution note<textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} maxLength={500} rows={3} required /></label><div className="form-actions"><button className="button button-ink" type="button" onClick={() => proposeDisputeResolution(true)} disabled={busy || walletBusy}>Propose uphold</button><button className="button button-outline" type="button" onClick={() => proposeDisputeResolution(false)} disabled={busy || walletBusy}>Propose dismiss</button></div></div>}
        {daoProposals.length > 0 && <section className="form-sheet work-dao-register"><div className="form-heading"><span>Work governance register</span><small>{daoProposals.length} matching proposal{daoProposals.length === 1 ? '' : 's'}</small></div>{daoProposals.map((proposal) => <div className="governance-note" key={proposal.id}><strong>Sputnik proposal #{proposal.id} · {proposal.work_method === 'execute_large_reward' ? 'large reward' : 'dispute resolution'}</strong><span>Status: {proposal.status}. Approval authorizes a FunctionCall; the Work contract and callback must still report the resulting state.</span><div className="form-actions"><button className="button button-outline" type="button" onClick={() => void vote(proposal, 'Approve')} disabled={busy || walletBusy || proposal.status !== 'InProgress'}>Vote approve</button><button className="button button-outline" type="button" onClick={() => void vote(proposal, 'Reject')} disabled={busy || walletBusy || proposal.status !== 'InProgress'}>Vote reject</button><a className="text-link" href={explorerAccount(proposal.proposer)} target="_blank" rel="noreferrer">Proposer ↗</a></div></div>)}</section>}
        {action && <div className={`form-result ${action.error ? 'result-error' : 'result-neutral'}`} role="status"><span>{action.message}</span>{action.hash && <Link href={`https://explorer.testnet.near.org/transactions/${encodeURIComponent(action.hash)}`} target="_blank" rel="noreferrer">Open transaction ↗</Link>}</div>}
        {task.dispute && <div className="governance-note"><strong>Dispute {statusLabel(task.dispute.status)}</strong><span>{task.dispute.reason}{task.dispute.resolution ? ` · ${task.dispute.resolution}` : ''}</span></div>}
      </aside>
    </div>
  </section>;
}

function ActionButton({ label, help, onClick, disabled }: { label: string; help: string; onClick: () => void; disabled: boolean }) {
  return <div className="action-block"><p className="field-help">{help}</p><button className="button button-ink button-wide" type="button" onClick={onClick} disabled={disabled}>{label} <span aria-hidden="true">↗</span></button></div>;
}
