import { test, expect } from '@playwright/test';

test('@affected bill form shows the Proof of bill upload field', async ({ page }) => {
  await page.goto('/bills/new');
  await expect(page.getByText('Proof of bill', { exact: false }).first()).toBeVisible();
  const input = page.locator('input[type="file"]').first();
  await expect(input).toBeAttached();
  await input.setInputFiles({
    name: 'bill.png',
    mimeType: 'image/png',
    buffer: Buffer.from('89504e470d0a1a0a', 'hex'),
  });
  await expect(page.getByText('Selected: bill.png')).toBeVisible();
});
