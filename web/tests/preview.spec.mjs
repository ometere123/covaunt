import { test, expect } from '@playwright/test';

test.describe('deterministic preview mode', () => {
  test('labels preview data and preserves the editorial route shell', async ({ page }) => {
    await page.goto('/?mode=preview');
    await expect(page).toHaveTitle(/COVAUNT/);
    await expect(page.getByText('Preview mode · no transactions')).toBeVisible();
    await expect(page.getByRole('heading', { name: /The majority can govern/ })).toBeVisible();
    await expect(page.getByText('18.00', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Illustrative data is labelled')).toBeVisible();
  });

  test('preview writes are disabled and the data is explicitly illustrative', async ({ page }) => {
    await page.goto('/covenants?mode=preview');
    await expect(page.getByRole('note').getByText('Illustrative preview')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview is read-only' })).toBeDisabled();
    await page.goto('/mandates?mode=preview');
    await expect(page.getByRole('button', { name: 'Preview is read-only' })).toBeDisabled();
    await expect(page.getByText('Preview docket is intentionally empty')).toBeVisible();
  });

  test('preview allocation is deterministic and clearly non-authoritative', async ({ page }) => {
    await page.goto('/mandates?mode=preview');
    await expect(page.getByText('Preview mode · no transactions')).toBeVisible();
    await page.getByRole('button', { name: 'Preview allocation' }).click();
    await expect(page.getByText('Eligible capital can cover it')).toBeVisible();
    await expect(page.getByText('6.00 Ⓝ')).toBeVisible();
    await expect(page.getByText('3.00 Ⓝ')).toBeVisible();
    await expect(page.getByText(/Illustrative preview only/)).toBeVisible();
  });

  test('narrow preview layouts do not overflow the viewport', async ({ page }) => {
    await page.goto('/covenants?mode=preview');
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 4);
    const menu = page.locator('.menu-button');
    if (await menu.isVisible()) {
      await menu.click();
      await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    }
  });

  test('work route is honest when no auxiliary contract is configured', async ({ page }) => {
    await page.goto('/work');
    await expect(page.getByRole('heading', { name: /Make the work legible/ })).toBeVisible();
    await expect(page.getByText('Work & Trust is not deployed for this release')).toBeVisible();
    await expect(page.getByText(/No task, work, reward or reputation data is shown as live/)).toBeVisible();
    await expect(page.getByText(/WRK-001/)).toHaveCount(0);
  });

  test('mobile keeps wallet access visible without opening navigation', async ({ page }) => {
    await page.goto('/');
    const wallet = page.getByRole('button', { name: 'Connect wallet' });
    await expect(wallet).toBeVisible();
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    const menu = page.locator('.menu-button');
    if (await menu.isVisible()) {
      await expect(navigation).not.toBeVisible();
      await menu.click();
      await expect(navigation).toBeVisible();
      await expect(wallet).toBeVisible();
    } else {
      await expect(navigation).toBeVisible();
    }
  });

  test('contributor profile keeps near.social context separate from work history', async ({ page }) => {
    await page.route('**/api/near-social', async (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ source: 'near.social-mainnet-fastdata', accountId: 'example.testnet', keyPrefix: 'post/', data: { entries: [{ key: 'post/0', value: 'Fixture social context' }] } }),
    }));
    await page.goto('/contributors/example.testnet');
    await expect(page.getByText('No live work contract configured')).toBeVisible();
    await expect(page.getByText('near.social activity')).toBeVisible();
    await expect(page.getByText('Mainnet · read only')).toBeVisible();
    await page.getByRole('button', { name: 'Read recent posts' }).click();
    await expect(page.getByText(/Fixture social context/)).toBeVisible();
    await expect(page.getByText(/not task evidence, payment proof or a reputation input/)).toBeVisible();
  });

  test('work writes are disabled in preview mode', async ({ page }) => {
    await page.goto('/work/funding?mode=preview');
    await expect(page.getByRole('button', { name: 'Preview is read-only' })).toBeDisabled();
    await page.goto('/work/submit?task=0&mode=preview');
    await expect(page.getByRole('button', { name: 'Preview is read-only' })).toBeDisabled();
    await page.goto('/work/tasks/0?mode=preview');
    await expect(page.getByText('Preview mode · Work & Trust reads disabled')).toBeVisible();
  });
});
