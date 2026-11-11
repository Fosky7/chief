import { test, expect } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test('bill form shows all fields @affected', async ({ page }) => {
  await page.goto('/bills/new');
  for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }
});

test('amount shows naira preview @affected', async ({ page }) => {
  await page.goto('/bills/new');
  await page.getByLabel('Amount (₦)').fill('250000');
  await expect(page.getByText('₦250,000')).toBeVisible();
});

test('missing title shows error @affected', async ({ page }) => {
  await page.goto('/bills/new');
  await page.getByRole('button', { name: /submit bill/i }).click();
  await expect(page.getByText('Title is required')).toBeVisible();
});

test('complete form shows pending review @affected @database @persistence', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied' });
    test.skip(true, 'Disposable account credentials not supplied');
    return;
  }
  await page.goto('/');
  await page.getByRole('link', { name: /sign in/i }).first().click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(1500);

  await page.goto('/bills/new');
  await page.getByLabel('Title', { exact: true }).fill(`E2E electricity bill ${Date.now()}`);
  await page.getByLabel('Story', { exact: true }).fill('Disposable test bill for verification.');
  await page.getByLabel('Biller name', { exact: true }).fill('Ikeja Electric');
  await page.getByLabel('Amount (₦)').fill('250000');
  await page.getByLabel('Due date', { exact: true }).fill('2030-01-15');
  await page.getByLabel('Proof of bill', { exact: true }).setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  await page.getByRole('button', { name: /submit bill/i }).click();
  await expect(page.getByText('Pending review')).toBeVisible({ timeout: 20000 });
});
