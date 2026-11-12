import {test,expect} from '@playwright/test';

test('editorial product preview renders distinct brand and explicit preview label',async({page})=>{
 await page.goto('/');
 await expect(page).toHaveTitle(/COVAUNT/);
 await expect(page.locator('#hero-title')).toContainText('rewrite consent');
 await expect(page.locator('#mode-ribbon')).toContainText('DESIGN PREVIEW');
 await expect(page.locator('#ledger-count')).toContainText('03');
 await expect(page.locator('.ledger-table tbody tr')).toHaveCount(3);
 await expect(page.locator('#stat-total')).toContainText('18.00');
});

test('the preview remains safe: wallets and transaction buttons never claim success',async({page})=>{
 await page.goto('/');
 await page.locator('#wallet-button').click();
 await expect(page.locator('#toast')).toContainText('DESIGN PREVIEW');
 await expect(page.locator('#contribution-form .submit-button')).toBeDisabled();
 await expect(page.locator('#deposit-feedback')).toContainText('Design preview');
 await expect(page.locator('#mandate-form .submit-button')).toBeDisabled();
 await expect(page.locator('#mandate-feedback')).toContainText('Design preview');
});

test('deterministic medical mandate preview allocates only donor-permitted funds',async({page})=>{
 await page.goto('/');
 await page.locator('#quote-button').click();
 await expect(page.locator('#allocation-content')).toContainText('Capital is compatible');
 await expect(page.locator('#allocation-content')).toContainText('6.00');
 await expect(page.locator('#allocation-content')).toContainText('3.00');
 await expect(page.locator('#allocation-content')).toContainText('ILLUSTRATIVE ONLY');
});

test('education contribution remains inspectable and refunds are not offered prematurely',async({page})=>{
 await page.goto('/');
 await page.locator('[data-view="0"]').click();
 await expect(page.locator('#info-dialog')).toBeVisible();
 await expect(page.locator('#dialog-content')).toContainText('Education');
 await expect(page.locator('#dialog-content')).toContainText('school.testnet');
 await expect(page.locator('#refund-now')).toHaveCount(0);
 await page.locator('#close-dialog').click();
 await expect(page.locator('#info-dialog')).not.toBeVisible();
});

test('narrow viewport retains readable document and navigation',async({page,isMobile})=>{
 await page.goto('/');
 await expect(page.locator('#hero-title')).toBeVisible();
 await expect(page.locator('#contribution-form')).toBeAttached();
 await expect(page.locator('#mandate-form')).toBeAttached();
 // Cross-axis overflow should never cause invisible clipped form submission controls.
 const dimensions=await page.evaluate(()=>({viewport:window.innerWidth,document:document.documentElement.scrollWidth}));
 expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport+4);
});
