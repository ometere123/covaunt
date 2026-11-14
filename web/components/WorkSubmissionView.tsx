'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { describeWalletError } from '../lib/wallet';
import { workCall } from '../lib/work';
import { useWallet } from './WalletProvider';

export function WorkSubmissionView({ initialTaskId }: { initialTaskId: string }) {
  const router = useRouter();
  const preview = useSearchParams().get('mode') === 'preview';
  const { accountId, busy: walletBusy } = useWallet();
  const [taskId, setTaskId] = useState(initialTaskId);
  const [evidenceUri, setEvidenceUri] = useState('');
  const [evidenceHash, setEvidenceHash] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ message: string; error?: boolean } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) { setResult({ message: 'Preview mode is read-only. No completion evidence transaction was requested.', error: true }); return; }
    if (!accountId) { setResult({ message: 'Connect the claimant wallet before submitting evidence.', error: true }); return; }
    const numericTaskId = Number(taskId);
    if (!Number.isSafeInteger(numericTaskId) || numericTaskId < 0) { setResult({ message: 'Enter a valid task number.', error: true }); return; }
    if (!evidenceUri.trim()) { setResult({ message: 'An evidence URI is required.', error: true }); return; }
    setBusy(true);
    setResult({ message: 'Awaiting wallet approval. Evidence is not recorded until the contract confirms the call.' });
    try {
      await workCall('submit_completion', { task_id: numericTaskId, evidence_uri: evidenceUri.trim(), evidence_hash: evidenceHash.trim() });
      setResult({ message: 'Transaction returned. The task detail route is re-reading the authoritative submission state.' });
      router.push(`/work/tasks/${numericTaskId}`);
    } catch (reason: unknown) {
      setResult({ message: `${describeWalletError(reason)} Check wallet history before retrying if the outcome was uncertain.`, error: true });
    } finally {
      setBusy(false);
    }
  };

  return <section className="section-wrap page-intro work-submit-page"><div className="back-link"><Link href="/work">← Work & Trust register</Link></div><p className="kicker">Work & trust / completion evidence</p><h1>Submit the <em>record</em></h1><p className="page-lede">Evidence is a bounded reference stored against a single claimed task. It is not accepted as complete until the task’s configured verifier authorizes it.</p><form className="form-sheet work-submit-form" onSubmit={(event) => void submit(event)}><div className="form-heading"><span>Completion desk</span><small>Claimant only</small></div><label>Task number<input value={taskId} onChange={(event) => setTaskId(event.target.value)} inputMode="numeric" required /></label><label>Evidence URI<input value={evidenceUri} onChange={(event) => setEvidenceUri(event.target.value)} placeholder="https://evidence.example/work-item" required /></label><label>Evidence hash <span className="field-meta">optional</span><input value={evidenceHash} onChange={(event) => setEvidenceHash(event.target.value)} spellCheck={false} placeholder="sha256:…" /></label><p className="form-pledge"><span className="ledger-mark">W</span> The contract checks the named claimant, task state, deadline and duplicate-submission guard. A URI alone never grants payment.</p><button className="button button-ink" type="submit" disabled={busy || walletBusy || preview}>{preview ? 'Preview is read-only' : busy ? 'Waiting for finality' : accountId ? 'Submit evidence' : 'Connect claimant wallet'} <span aria-hidden="true">↗</span></button>{result && <div className={`form-result ${result.error ? 'result-error' : 'result-neutral'}`} role="status"><span>{result.message}</span></div>}</form></section>;
}
