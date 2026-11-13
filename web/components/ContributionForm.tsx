'use client';

import { FormEvent, useState } from 'react';
import { CONFIG, explorerTx } from '../lib/config';
import { isValidAccount, parseNear, PURPOSES } from '../lib/format';
import { describeWalletError } from '../lib/wallet';
import { useData } from './DataProvider';
import { useWallet } from './WalletProvider';

type ResultState = { tone: 'neutral' | 'success' | 'error'; message: string; hash?: string };

function transactionHash(value: unknown) {
  const result = value as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } } | null;
  return result?.transaction?.hash || result?.transaction_outcome?.id;
}

export function ContributionForm() {
  const { ledger, mode, refresh } = useData();
  const { accountId, busy: walletBusy, signCall } = useWallet();
  const [amount, setAmount] = useState('0.10');
  const [purposeMask, setPurposeMask] = useState(2);
  const [recipients, setRecipients] = useState('clinic-covaunt26.testnet');
  const [days, setDays] = useState('30');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'preview') {
      setResult({ tone: 'error', message: 'Preview mode is read-only. No wallet transaction was requested.' });
      return;
    }
    if (!ledger?.summary.is_balanced) {
      setResult({ tone: 'error', message: 'The live ledger is not balanced. Contribution is blocked until it is reconciled.' });
      return;
    }
    if (!accountId) {
      setResult({ tone: 'error', message: 'Connect a testnet wallet before recording a covenant.' });
      return;
    }
    try {
      const yocto = parseNear(amount);
      if (yocto < parseNear('0.01')) throw new Error('Minimum contribution is 0.01 NEAR');
      const list = recipients.split(',').map((item) => item.trim()).filter(Boolean);
      if (list.length < 1 || list.length > 8 || list.some((item) => !isValidAccount(item))) throw new Error('Enter one to eight valid recipient account IDs');
      if (new Set(list).size !== list.length) throw new Error('Recipient account IDs must be unique');
      if (list.includes(CONFIG.contractId) || list.includes(CONFIG.daoId)) throw new Error('The DAO and vault cannot be approved recipients');
      const lockDays = Number(days);
      if (!Number.isSafeInteger(lockDays) || lockDays < 1 || lockDays > 3650) throw new Error('Choose a withdrawal window from 1 to 3,650 days');
      if (!purposeMask) throw new Error('Choose at least one permitted purpose');
      if (new TextEncoder().encode(note).length > 180) throw new Error('The note must be 180 UTF-8 bytes or fewer');
      setBusy(true);
      setResult({ tone: 'neutral', message: 'Awaiting wallet approval. The covenant is not recorded yet.' });
      const unlock = (BigInt(Date.now()) * BigInt(1_000_000) + BigInt(lockDays) * BigInt(86_400_000_000_000)).toString();
      const outcome = await signCall(CONFIG.contractId, 'contribute', { allowed_purposes: purposeMask, recipients: list, withdraw_after_ns: unlock, note }, '90000000000000', yocto.toString());
      const hash = transactionHash(outcome);
      setResult({ tone: 'success', message: 'Wallet transaction finalized. Refreshing the public ledger.', hash });
      await refresh();
    } catch (error) {
      setResult({ tone: 'error', message: describeWalletError(error) });
    } finally {
      setBusy(false);
    }
  };

  return <form className="form-sheet" onSubmit={(event) => void submit(event)}>
    <div className="form-heading"><span>Deposit desk</span><small>Writes require a testnet wallet</small></div>
    <label>Amount <span className="field-meta">NEAR</span><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" required aria-describedby="amount-help" /></label>
    <p id="amount-help" className="field-help">Native NEAR. Minimum 0.01. The amount becomes the covenant’s original principal.</p>
    <fieldset><legend>Permitted purposes</legend><div className="check-grid">{PURPOSES.map((purpose) => <label className="check-choice" key={purpose.bit}><input type="checkbox" checked={(purposeMask & purpose.bit) !== 0} onChange={() => setPurposeMask((value) => value ^ purpose.bit)} /><span>{purpose.label}</span></label>)}</div></fieldset>
    <label>Approved recipient accounts <textarea value={recipients} onChange={(event) => setRecipients(event.target.value)} rows={2} required placeholder="one.testnet, two.testnet" /><span className="field-help">Comma-separated account IDs. A payout must match both a purpose and a recipient.</span></label>
    <div className="field-pair"><label>Refund unlock window <input type="number" min="1" max="3650" value={days} onChange={(event) => setDays(event.target.value)} required /><span className="field-meta">days</span></label><label>Note <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={180} placeholder="Optional context" /><span className="field-help">180 bytes max</span></label></div>
    <p className="form-pledge"><span className="ledger-mark">C</span> These conditions are immutable after deposit. An expired, unspent balance may only be reclaimed by its original donor.</p>
    <button className="button button-ink button-wide" type="submit" disabled={busy || walletBusy || mode === 'preview'}>{mode === 'preview' ? 'Preview is read-only' : busy ? 'Waiting for finality' : accountId ? 'Record this covenant' : 'Connect wallet to contribute'} <span aria-hidden="true">↗</span></button>
    {result && <div className={`form-result result-${result.tone}`} role="status"><span>{result.message}</span>{result.hash && <a href={explorerTx(result.hash)} target="_blank" rel="noreferrer">Open transaction ↗</a>}</div>}
  </form>;
}
