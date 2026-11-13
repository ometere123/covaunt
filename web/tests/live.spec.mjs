import { test, expect } from '@playwright/test';

const summary = {
  name: 'COVAUNT', dao_id: 'covaunt26.sputnikv2.testnet', reserve: '5000000000000000000000000',
  total_deposited: '18100000000000000000000000', total_paid: '9000000000000000000000000', total_refunded: '100000000000000000000000',
  available: '9000000000000000000000000', pending_spend: '0', pending_refund: '0', contributions: 1, spends: 0, is_balanced: true,
};
const contribution = {
  id: 0, donor: 'donor.covaunt.testnet', principal: '9000000000000000000000000', available: '9000000000000000000000000', pending_spend: '0', pending_refund: '0', paid: '0', refunded: '0', allowed_purposes: 2, recipients: ['clinic-covaunt26.testnet'], created_at_ns: '1760000000000000000', withdraw_after_ns: '4760000000000000000', note: 'Fixture ledger row',
};
const policy = { roles: [{ name: 'council', kind: { Group: ['covauntops26.testnet', 'council2-covaunt26.testnet'] }, permissions: ['*:Finalize'] }], default_vote_policy: { weight_kind: 'RoleWeight', quorum: '0', threshold: [1, 2] }, proposal_bond: '1000000000000000000000000', proposal_period: '604800000000000000000000', bounty_bond: '0', bounty_forgiveness_period: '0' };

function bytes(value) {
  return Array.from(new TextEncoder().encode(JSON.stringify(value)));
}

async function installLiveFixture(page) {
  await page.route('**/rpc.testnet.near.org/**', async (route) => {
    const request = route.request().postDataJSON();
    const query = request.params || {};
    let value = null;
    if (query.account_id === 'vault.covauntops26.testnet' && query.method_name === 'get_summary') value = summary;
    if (query.account_id === 'vault.covauntops26.testnet' && query.method_name === 'get_contributions') value = [contribution];
    if (query.account_id === 'vault.covauntops26.testnet' && query.method_name === 'get_spends') value = [];
    if (query.account_id === 'covaunt26.sputnikv2.testnet' && query.method_name === 'get_policy') value = policy;
    if (query.account_id === 'covaunt26.sputnikv2.testnet' && query.method_name === 'get_last_proposal_id') value = 0;
    if (value === null) return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: `Fixture has no response for ${query.method_name}` } }) });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { result: bytes(value) } }) });
  });
}

test.describe('live-mode presentation with labelled RPC fixtures', () => {
  test.beforeEach(async ({ page }) => installLiveFixture(page));

  test('renders final fixture data as live testnet state, not preview data', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('NEAR testnet · live reads')).toBeVisible();
    await expect(page.getByText('Preview mode · no transactions')).toHaveCount(0);
    await expect(page.getByText('9.00', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Every recorded yocto reconciles')).toBeVisible();
  });

  test('navigation reaches separate treasury, covenant and governance routes', async ({ page }) => {
    await page.goto('/treasury');
    await expect(page.getByRole('heading', { name: /The treasury is a ledger/ })).toBeVisible();
    const menu = page.locator('.menu-button');
    if (await menu.isVisible()) await menu.click();
    await page.getByRole('link', { name: 'Covenants' }).click();
    await expect(page).toHaveURL(/\/covenants$/);
    await expect(page.getByRole('heading', { name: /Capital with a personal boundary/ })).toBeVisible();
    if (await menu.isVisible()) await menu.click();
    await page.getByRole('link', { name: 'Governance' }).click();
    await expect(page).toHaveURL(/\/governance$/);
    await expect(page.getByRole('heading', { name: /Collective authority/ })).toBeVisible();
  });

  test('wallet-gated contribution explains the missing signature without pretending success', async ({ page }) => {
    await page.goto('/covenants');
    await page.getByRole('button', { name: 'Connect wallet to contribute' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Connect a testnet wallet' })).toBeVisible();
    await expect(page.getByText(/finalized|settled/i)).toHaveCount(0);
  });
});
