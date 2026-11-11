import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test('@affected @database @persistence bill with proof upload shows Pending review', async ({ page }) => {
  if (!email || !password) {
    test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD disposable account not supplied' });
    test.skip(true, 'Disposable test account not supplied by the runner');
    return;
  }

  await page.goto('/bills/new');

  // Sign in through the real UI if the form is behind auth.
  const emailField = page.getByLabel(/email/i).first();
  if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailField.fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.goto('/bills/new');
  }

  await expect(page.getByLabel(/Proof of bill/i).first()).toBeAttached();

  const title = `E2E proof bill ${Date.now()}`;
  await page.getByLabel(/^Title/i).first().fill(title);
  await page.getByLabel(/Story/i).first().fill('Disposable verification bill for proof upload storage check.');
  const category = page.getByLabel(/Category/i).first();
  const tag = await category.evaluate((el) => el.tagName.toLowerCase());
  if (tag === 'select') {
    await category.selectOption({ index: 1 });
  } else {
    await category.fill('Utilities');
  }
  await page.getByLabel(/Biller name/i).first().fill('Ikeja Electric');
  const amount = page.getByLabel(/Amount/i).first();
  await amount.fill('250000');
  await expect(page.getByText('₦250,000').first().or(amount)).toBeVisible();
  const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel(/Due date/i).first().fill(due);

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: png });

  await page.getByRole('button', { name: /submit/i }).first().click();
  await expect(page.getByText(/Pending review/i).first()).toBeVisible({ timeout: 20000 });
});
