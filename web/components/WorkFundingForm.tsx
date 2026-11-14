'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatNear, isValidAccount, parseNear } from '../lib/format';
import { describeWalletError } from '../lib/wallet';
import { WORK_GAS, workCall } from '../lib/work';
import { useWallet } from './WalletProvider';

function transactionHash(value: unknown) {
  const result = value as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } } | null;
  return result?.transaction?.hash || result?.transaction_outcome?.id;
}

export function WorkFundingForm() {
  const router = useRouter();
  const preview = useSearchParams().get('mode') === 'preview';
  const { accountId, busy: walletBusy } = useWallet();
  const [title, setTitle] = useState('Community translation desk');
  const [purpose, setPurpose] = useState('Translate a public health guide into the community language.');
  const [budget, setBudget] = useState('1.00');
  const [reward, setReward] = useState('0.10');
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10));
  const [eligibility, setEligibility] = useState('');
  const [verifier, setVerifier] = useState('');
  const [approver, setApprover] = useState('');
  const [tier, setTier] = useState<'Small' | 'Medium' | 'Large'>('Small');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ message: string; error?: boolean; hash?: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) {
      setResult({ message: 'Preview mode is read-only. No task funding transaction was requested.', error: true });
      return;
    }
    if (!accountId) {
      setResult({ message: 'Connect the task creator wallet before funding a record.', error: true });
      return;
    }
    try {
      const cleanTitle = title.trim();
      const cleanPurpose = purpose.trim();
      const cleanVerifier = verifier.trim();
      const cleanApprover = approver.trim();
      const budgetYocto = parseNear(budget);
      const rewardYocto = parseNear(reward);
      if (!cleanTitle || new TextEncoder().encode(cleanTitle).length > 120) throw new Error('Task title must be between 1 and 120 UTF-8 bytes.');
      if (!cleanPurpose || new TextEncoder().encode(cleanPurpose).length > 240) throw new Error('Task purpose must be between 1 and 240 UTF-8 bytes.');
      if (!isValidAccount(cleanVerifier)) throw new Error('Enter a valid verifier NEAR account.');
      if (cleanVerifier === accountId) throw new Error('The task creator cannot also be the verifier. Use a distinct named account.');
      if (tier === 'Medium' && !isValidAccount(cleanApprover)) throw new Error('Medium rewards require an explicit approver account.');
      if (tier === 'Medium' && cleanApprover === accountId) throw new Error('The task creator cannot also be the medium approver. Use a distinct named account.');
      if (tier === 'Medium' && cleanApprover === cleanVerifier) throw new Error('The medium approver and verifier must be distinct named accounts.');
      if (tier !== 'Medium' && cleanApprover) throw new Error('Only medium rewards use a separate approver.');
      const allowed = eligibility.split(',').map((item) => item.trim()).filter(Boolean);
      if (allowed.length > 32 || new Set(allowed).size !== allowed.length || allowed.some((item) => !isValidAccount(item))) throw new Error('Eligibility must contain zero to 32 unique valid account IDs.');
      if (budgetYocto < parseNear('0.01') || rewardYocto <= BigInt(0) || rewardYocto > budgetYocto) throw new Error('Budget must be at least 0.01 NEAR and must cover the reward.');
      const deadlineMs = new Date(`${deadline}T23:59:59Z`).getTime();
      if (!Number.isFinite(deadlineMs) || deadlineMs <= Date.now() + 60_000) throw new Error('Choose a deadline at least one minute in the future.');
      setBusy(true);
      setResult({ message: 'Awaiting wallet approval. The task budget is not recorded until the transaction finalizes.' });
      const outcome = await workCall('create_task', {
        title: cleanTitle,
        purpose: cleanPurpose,
        deadline_ns: Math.trunc(deadlineMs * 1_000_000).toString(),
        eligibility: allowed,
        verifier: cleanVerifier,
        approver: tier === 'Medium' ? cleanApprover : null,
        tier,
        reward_amount: rewardYocto.toString(),
      }, WORK_GAS, budgetYocto.toString());
      const hash = transactionHash(outcome);
      setResult({ message: 'Wallet returned a task-creation result. Re-read the contract before treating the task as live.', hash });
      router.push('/work');
    } catch (reason: unknown) {
      setResult({ message: `${describeWalletError(reason)} Check the wallet history before trying again if a network result was uncertain.`, error: true });
    } finally {
      setBusy(false);
    }
  };

  return <section className="form-section work-funding-section">
    <div className="form-section-copy"><p className="kicker">Separate reward capital</p><h2>Fund a task with <em>clear terms</em></h2><p>Every task receives its own attached NEAR budget. The work contract never reads or calls the deployed donor vault. A reward is paid only after the recorded verification path for its tier.</p><ol className="numbered-list"><li><strong>Creator funds</strong><span>Attached deposit becomes the task budget.</span></li><li><strong>Worker claims</strong><span>One named account can claim an open task.</span></li><li><strong>Verifier decides</strong><span>Evidence is accepted or rejected on chain.</span></li></ol><p><Link className="text-link" href="/about#work-trust">Review the security boundary ↗</Link></p></div>
    <form className="form-sheet" onSubmit={(event) => void submit(event)}>
      <div className="form-heading"><span>Task funding desk</span><small>Writes require a testnet wallet</small></div>
      <label>Task title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
      <label>Funding purpose<textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} maxLength={240} rows={3} required /><span className="field-help">This is a task purpose, not a donor-vault purpose.</span></label>
      <div className="field-pair"><label>Budget <span className="field-meta">NEAR</span><input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" required /><span className="field-help">Attached to this task only</span></label><label>Reward <span className="field-meta">NEAR</span><input value={reward} onChange={(event) => setReward(event.target.value)} inputMode="decimal" required /><span className="field-help">One bounded settlement</span></label></div>
      <div className="field-pair"><label>Deadline<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required /></label><label>Reward tier<select value={tier} onChange={(event) => setTier(event.target.value as 'Small' | 'Medium' | 'Large')}><option value="Small">Small · verifier settles</option><option value="Medium">Medium · approver settles</option><option value="Large">Large · DAO settles</option></select><span className="field-help">Tier is an explicit authorization policy; caps are separate. A small amount may intentionally choose the DAO-gated Large tier.</span></label></div>
      <label>Eligibility accounts<textarea value={eligibility} onChange={(event) => setEligibility(event.target.value)} rows={2} placeholder="Optional: worker.testnet, another.testnet" /><span className="field-help">Leave blank for an open task. Use comma-separated accounts.</span></label>
      <label>Authorized verifier<input value={verifier} onChange={(event) => setVerifier(event.target.value)} placeholder="verifier.testnet" spellCheck={false} required /></label>
      {tier === 'Medium' && <label>Authorized medium approver<input value={approver} onChange={(event) => setApprover(event.target.value)} placeholder="approver.testnet" spellCheck={false} required /><span className="field-help">This account is enforced by the auxiliary contract.</span></label>}
      <p className="form-pledge"><span className="ledger-mark">W</span> Task funding is opt-in and isolated. It cannot withdraw, redirect or create permissions over COVAUNT donor principal.</p>
      <button className="button button-ink button-wide" type="submit" disabled={busy || walletBusy || preview}>{preview ? 'Preview is read-only' : busy ? 'Waiting for finality' : accountId ? `Fund task with ${formatNearSafe(budget)} NEAR` : 'Connect wallet to fund task'} <span aria-hidden="true">↗</span></button>
      {result && <div className={`form-result ${result.error ? 'result-error' : 'result-neutral'}`} role="status"><span>{result.message}</span>{result.hash && <Link href={`https://explorer.testnet.near.org/transactions/${encodeURIComponent(result.hash)}`} target="_blank" rel="noreferrer">Open transaction ↗</Link>}</div>}
    </form>
  </section>;
}

function formatNearSafe(value: string) {
  try { return formatNear(parseNear(value)); } catch { return value || '0'; }
}
