'use client';

import { useState } from 'react';
import { loadNearSocialActivity } from '../lib/social';
import type { NearSocialActivity } from '../lib/social';

export function NearSocialPanel({ accountId }: { accountId: string }) {
  const [activity, setActivity] = useState<NearSocialActivity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const read = async () => {
    setBusy(true);
    setError(null);
    try {
      setActivity(await loadNearSocialActivity(accountId));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'near.social activity could not be read.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="social-panel">
    <div className="form-heading"><span>near.social activity</span><small>Mainnet · read only</small></div>
    <p>Public activity is an optional social context. It is not task evidence, payment proof or a reputation input, and a mainnet social account is not automatically the same identity as a testnet contributor.</p>
    {!activity && <button className="button button-outline" type="button" onClick={() => void read()} disabled={busy}>{busy ? 'Reading public activity' : 'Read public activity'}</button>}
    {error && <div className="form-result result-error" role="alert"><span>{error}</span></div>}
    {activity && <div className="social-result"><span className="table-meta">Source: near.social mainnet FastData KV · prefix: {activity.keyPrefix}</span><pre>{JSON.stringify(activity.data, null, 2)}</pre></div>}
  </section>;
}
