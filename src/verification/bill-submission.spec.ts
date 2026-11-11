import { test, expect } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

test('@affected bill form shows all fields', async ({ page }) => {
  await page.goto('/bills/new');
  for (const l of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
    await expect(page.getByLabel(l, { exact: true })).toBeVisible();
  }
});

test('@affected amount formats as naira', async ({ page }) => {
  await page.goto('/bills/new');
  const amount = page.getByLabel('Amount (₦)', { exact: true });
  await amount.pressSequentially('250000');
  await expect(amount).toHaveValue('₦250,000');
});

test('@affected missing title shows error', async ({ page }) => {
  await page.goto('/bills/new');
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page.getByText('Title is required')).toBeVisible();
});

test('@affected @database @persistence complete bill submits as pending review', async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied' });
    test.skip(true, 'Disposable account credentials not supplied');
    return;
  }
  await page.goto('/auth');
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForTimeout(1500);

  await page.goto('/bills/new');
  await page.getByLabel('Title', { exact: true }).fill(`E2E disposable bill ${Date.now()}`);
  await page.getByLabel('Story', { exact: true }).fill('Disposable verification bill created by automated test.');
  await page.getByLabel('Category', { exact: true }).selectOption('Medical');
  await page.getByLabel('Biller name', { exact: true }).fill('Test Clinic');
  await page.getByLabel('Amount (₦)', { exact: true }).pressSequentially('250000');
  await page.getByLabel('Due date', { exact: true }).fill('2030-01-15');
  await page.getByLabel('Proof of bill', { exact: true }).setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page.getByText('Pending review')).toBeVisible({ timeout: 20000 });
});
