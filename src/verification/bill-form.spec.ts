import { test, expect } from '@playwright/test';

test('@affected bill form shows fields, formats naira and validates title', async ({ page }) => {
  await page.goto('/bills/new');
  for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }
  await page.getByLabel('Amount (₦)').fill('250000');
  await expect(page.getByText('₦250,000')).toBeVisible();
  await page.getByRole('button', { name: /submit bill/i }).click();
  await expect(page.getByText('Title is required')).toBeVisible();
});

test('@affected create-bill page shows the Proof of bill field', async ({ page }) => {
  await page.goto('/create-bill');
  await expect(page.getByLabel('Proof of bill', { exact: true })).toBeVisible();
});
