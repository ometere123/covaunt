'use client';

import { useState } from 'react';
import { loadNearSocialActivity } from '../lib/social';
import type { NearSocialActivity } from '../lib/social';

type SocialEntry = { key: string; summary: string };

function summarizeValue(value: unknown): string {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed !== value) return summarizeValue(parsed);
    } catch {
      // FastData may return a plain text value; keep it readable below.
    }
    return value.trim().replace(/\s+/g, ' ');
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const field of ['name', 'displayName', 'title', 'text', 'body', 'description', 'content', 'value']) {
      if (field in record) {
        const summary = summarizeValue(record[field]);
        if (summary) return summary;
      }
    }
    return Object.entries(record).slice(0, 3).map(([key, item]) => `${key}: ${summarizeValue(item)}`).join(' · ');
  }
  return '';
}

function readEntries(data: unknown): SocialEntry[] {
  const source = data && typeof data === 'object' && !Array.isArray(data) && 'entries' in data
    ? (data as { entries?: unknown }).entries
    : data;
  if (Array.isArray(source)) {
    return source.flatMap((entry, index) => {
      if (!entry || typeof entry !== 'object') return [];
      const record = entry as Record<string, unknown>;
      const key = typeof record.key === 'string' ? record.key : `entry-${index + 1}`;
      const summary = summarizeValue('value' in record ? record.value : record);
      return summary ? [{ key, summary }] : [];
    }).slice(0, 8);
  }
  if (source && typeof source === 'object') {
    return Object.entries(source as Record<string, unknown>).flatMap(([key, value]) => {
      const summary = summarizeValue(value);
      return summary ? [{ key, summary }] : [];
    }).slice(0, 8);
  }
  return [];
}

export function NearSocialPanel({ accountId }: { accountId: string }) {
  const [activity, setActivity] = useState<NearSocialActivity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const read = async (keyPrefix: NearSocialActivity['keyPrefix']) => {
    setBusy(true);
    setError(null);
    try {
      setActivity(await loadNearSocialActivity(accountId, keyPrefix));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'near.social activity could not be read.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="social-panel">
    <div className="form-heading"><span>near.social activity</span><small>Mainnet · read only</small></div>
    <p>Public activity is an optional social context. It is not task evidence, payment proof or a reputation input, and a mainnet social account is not automatically the same identity as a testnet contributor.</p>
    <div className="social-actions">
      <button className="button button-outline" type="button" onClick={() => void read('post/')} disabled={busy}>{busy && activity?.keyPrefix === 'post/' ? 'Reading recent posts' : 'Read recent posts'}</button>
      <button className="button button-outline" type="button" onClick={() => void read('profile/')} disabled={busy}>{busy && activity?.keyPrefix === 'profile/' ? 'Reading public profile' : 'Read public profile'}</button>
    </div>
    {error && <div className="form-result result-error" role="alert"><span>{error}</span></div>}
    {activity && <div className="social-result"><span className="table-meta">Source: near.social mainnet FastData KV · {activity.keyPrefix === 'post/' ? 'recent public posts' : 'public profile fields'}</span>{readEntries(activity.data).length > 0 ? <ul className="social-entry-list">{readEntries(activity.data).map((entry) => <li className="social-entry" key={entry.key}><span>{entry.key.replace(`${activity.keyPrefix}`, '') || entry.key}</span><strong>{entry.summary}</strong></li>)}</ul> : <p className="social-empty">No public {activity.keyPrefix === 'post/' ? 'posts' : 'profile fields'} were returned for this account. The optional mainnet context remains empty.</p>}</div>}
  </section>;
}
