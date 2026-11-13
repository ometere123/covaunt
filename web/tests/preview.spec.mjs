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
});
