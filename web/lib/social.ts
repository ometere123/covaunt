export type NearSocialActivity = {
  source: 'near.social-mainnet-fastdata';
  accountId: string;
  keyPrefix: 'profile/' | 'post/';
  data: unknown;
};

export async function loadNearSocialActivity(accountId: string, keyPrefix: NearSocialActivity['keyPrefix'] = 'post/') {
  const response = await fetch('/api/near-social', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accountId, keyPrefix }),
    cache: 'no-store',
  });
  const body = await response.json() as { error?: string } & Partial<NearSocialActivity>;
  if (!response.ok) throw new Error(body.error || `near.social returned HTTP ${response.status}`);
  return body as NearSocialActivity;
}
