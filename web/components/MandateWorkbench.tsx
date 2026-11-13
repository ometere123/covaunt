'use client';

import { FormEvent, useState } from 'react';
import { CONFIG, explorerTx } from '../lib/config';
import { contractQuote, encodeJsonBase64 } from '../lib/near';
import { formatNear, isValidAccount, parseNear, PURPOSES, shortAccount } from '../lib/format';
import type { Quote } from '../lib/types';
import { describeWalletError } from '../lib/wallet';
import { useData } from './DataProvider';
import { useWallet } from './WalletProvider';

function transactionHash(value: unknown) {
  const result = value as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } } | null;
  return result?.transaction?.hash || result?.transaction_outcome?.id;
}

function mandateId() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `cvt-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function MandateWorkbench() {
  const { ledger, policy, mode, previewQuote, refresh } = useData();
  const { accountId, walletName, signCall } = useWallet();
  const [title, setTitle] = useState('Community medical supply');
  const [purpose, setPurpose] = useState('2');
  const [recipient, setRecipient] = useState('clinic-covaunt26.testnet');
  const [amount, setAmount] = useState('2.00');
  const [reference, setReference] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ message: string; error?: boolean; hash?: string } | null>(null);

  const formValues = () => {
    const cleanTitle = title.trim();
    const cleanRecipient = recipient.trim();
    const cleanReference = reference.trim();
    const purposeNumber = Number(purpose);
    const yocto = parseNear(amount);
    if (!cleanTitle || new TextEncoder().encode(cleanTitle).length > 120) throw new Error('Enter a mandate title under 120 bytes');
    if (!isValidAccount(cleanRecipient)) throw new Error('Enter a valid beneficiary NEAR account');
    if (cleanRecipient === CONFIG.contractId || cleanRecipient === CONFIG.daoId) throw new Error('The vault and DAO cannot receive a mandate');
    if (!Number.isInteger(purposeNumber) || !PURPOSES.some((item) => item.bit === purposeNumber)) throw new Error('Choose one spending purpose');
    if (yocto <= BigInt(0)) throw new Error('Amount must be greater than zero');
    if (new TextEncoder().encode(cleanReference).length > 200) throw new Error('Reference must be 200 UTF-8 bytes or fewer');
    return { title: cleanTitle, recipient: cleanRecipient, purpose: purposeNumber, amount: yocto, reference: cleanReference };
  };

  const preview = async () => {
    try {
      const values = formValues();
      const nextQuote = mode === 'preview' ? previewQuote : await contractQuote(values.recipient, values.purpose, values.amount.toString());
      setQuote(nextQuote);
      setResult({ message: nextQuote.permitted ? 'Eligible capital found. This is a quote, not a payment authorization.' : nextQuote.reason });
    } catch (error) {
      setQuote(null);
      setResult({ message: describeWalletError(error), error: true });
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'preview') {
      setResult({ message: 'Preview mode is read-only. No DAO proposal was requested.', error: true });
      return;
    }
    if (!accountId) {
      setResult({ message: 'Connect a testnet wallet. DAO policy decides whether that account may add a proposal.', error: true });
      return;
    }
    if (!policy || !ledger?.summary.is_balanced) {
      setResult({ message: 'The live ledger or DAO policy is unavailable. Proposal creation is blocked.', error: true });
      return;
    }
    try {
      const values = formValues();
      setBusy(true);
      setResult({ message: 'Re-reading the live contract quote before opening the wallet.' });
      const liveQuote = await contractQuote(values.recipient, values.purpose, values.amount.toString());
      setQuote(liveQuote);
      if (!liveQuote.permitted) throw new Error(`The contract rejects this mandate: ${liveQuote.reason}`);
      const id = mandateId();
      const args = { id, recipient: values.recipient, purpose: values.purpose, amount: values.amount.toString(), title: values.title, reference: values.reference };
      const proposal = {
        description: JSON.stringify({ protocol: 'COVAUNT', mandate_id: id, title: values.title, purpose: values.purpose, recipient: values.recipient, amount_yocto: values.amount.toString(), reference: values.reference, contract: CONFIG.contractId }),
        kind: { FunctionCall: { receiver_id: CONFIG.contractId, actions: [{ method_name: 'execute_spend', args: encodeJsonBase64(args), deposit: '0', gas: '150000000000000' }] } },
      };
      setResult({ message: `Opening ${walletName || 'the selected wallet'} for the ${formatNear(policy.proposal_bond)} NEAR Sputnik proposal bond. Approval does not settle the beneficiary payment.` });
      const outcome = await signCall(CONFIG.daoId, 'add_proposal', { proposal }, '160000000000000', policy.proposal_bond);
      const hash = transactionHash(outcome);
      setResult({ message: `Sputnik proposal ${id} finalized. Council voting and downstream execution remain separate states.`, hash });
      await refresh();
    } catch (error) {
      setResult({ message: describeWalletError(error), error: true });
    } finally {
      setBusy(false);
    }
  };

  return <div className="workbench-grid">
    <form className="form-sheet" onSubmit={(event) => void submit(event)}>
      <div className="form-heading"><span>Mandate chamber</span><small>Sputnik FunctionCall proposal</small></div>
      <label>Mandate title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
      <label>Single spending purpose<select value={purpose} onChange={(event) => setPurpose(event.target.value)}>{PURPOSES.map((item) => <option value={item.bit} key={item.bit}>{item.label}</option>)}</select></label>
      <label>Beneficiary account<input value={recipient} onChange={(event) => setRecipient(event.target.value)} spellCheck={false} required /></label>
      <label>Amount <span className="field-meta">NEAR</span><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" required /></label>
      <label>Evidence or resolution reference<input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={200} placeholder="Optional URL or document reference" /></label>
      <div className="form-actions"><button className="button button-outline" type="button" onClick={() => void preview()} disabled={busy}>Preview allocation</button><button className="button button-ink" type="submit" disabled={busy || mode === 'preview'}>{mode === 'preview' ? 'Preview is read-only' : busy ? 'Waiting for finality' : 'Submit to Sputnik DAO'} <span aria-hidden="true">↗</span></button></div>
      {result && <div className={`form-result ${result.error ? 'result-error' : 'result-neutral'}`} role="status"><span>{result.message}</span>{result.hash && <a href={explorerTx(result.hash)} target="_blank" rel="noreferrer">Open transaction ↗</a>}</div>}
    </form>
    <section className="quote-sheet" aria-live="polite">
      <div className="quote-heading"><span>Allocation proof</span><small>{mode === 'preview' ? 'Preview fixture' : 'Contract quote'}</small></div>
      {!quote ? <div className="quote-empty"><span className="ledger-mark">C</span><p>Ask the deployed vault which restricted balances can fund this exact recipient, purpose and amount.</p></div> : <>
        <div className={`quote-verdict ${quote.permitted ? 'is-permitted' : 'is-denied'}`}><strong>{quote.permitted ? 'Eligible capital can cover it' : 'The restrictions prevent it'}</strong><span>{quote.reason}</span></div>
        <div className="quote-lines">{quote.allocations.map((allocation) => { const c = ledger?.contributions.find((item) => item.id === allocation.contribution_id); return <div className="quote-line" key={allocation.contribution_id}><span>COV-{String(allocation.contribution_id).padStart(3, '0')}<small>{shortAccount(c?.donor || 'Unknown donor')}</small></span><strong>{formatNear(allocation.amount)} Ⓝ</strong></div>; })}</div>
        <div className="quote-total"><span>Requested / shortfall</span><strong>{formatNear(quote.requested)} / {formatNear(quote.shortfall)} Ⓝ</strong></div>
        <p className="field-help">A quote can age as other mandates settle. The submit action reads the contract again and Sputnik remains the authorizer.</p>
      </>}
      <div className="quote-footer">Purpose · recipient · time · callback finality</div>
    </section>
  </div>;
}
