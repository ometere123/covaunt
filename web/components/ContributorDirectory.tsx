'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidAccount } from '../lib/format';

export function ContributorDirectory() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = account.trim();
    if (!isValidAccount(value)) {
      setError('Enter a valid NEAR account ID.');
      return;
    }
    router.push(`/contributors/${encodeURIComponent(value)}`);
  };

  return <section className="section-wrap page-intro contributor-directory"><p className="kicker">Contributors / verifiable history</p><h1>Find a <em>work record</em></h1><p className="page-lede">Enter a NEAR account to read its contract-derived Work & Trust history. A connected wallet is not required for public reads, and no profile is inferred from a donation or a social post.</p><form className="form-sheet contributor-lookup" onSubmit={submit}><div className="form-heading"><span>Contributor lookup</span><small>Public read</small></div><label>NEAR account<input value={account} onChange={(event) => { setAccount(event.target.value); setError(null); }} placeholder="worker.testnet" spellCheck={false} required /></label><button className="button button-ink" type="submit">Open record <span aria-hidden="true">↗</span></button>{error && <div className="form-result result-error" role="alert"><span>{error}</span></div>}</form></section>;
}
