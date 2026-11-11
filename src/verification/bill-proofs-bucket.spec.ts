import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

test('@affected @database @persistence proof upload to bill-proofs storage completes and bill is pending review', async ({ page }) => {
  if (!EMAIL || !PASSWORD) {
    test.info().annotations.push({ type: 'setup-required', description: 'Disposable account E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied by the runner.' });
    test.skip(true, 'Disposable test account not supplied');
    return;
  }

  await page.goto('/auth');
  await page.getByLabel(/email/i).first().fill(EMAIL);
  await page.getByLabel(/password/i).first().fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForLoadState('networkidle');

  await page.goto('/bills/new');
  await expect(page.getByText('Proof of bill').first()).toBeVisible();

  const title = `E2E proof bucket ${Date.now()}`;
  await page.getByLabel(/^title/i).fill(title);
  await page.getByLabel(/story/i).fill('Disposable verification bill for proof storage upload.');
  const category = page.getByLabel(/category/i);
  if ((await category.evaluate((el) => el.tagName)) === 'SELECT') {
    await category.selectOption({ index: 1 });
  } else {
    await category.click();
    await page.getByRole('option').first().click();
  }
  await page.getByLabel(/biller name/i).fill('Ikeja Electric');
  await page.getByLabel(/amount/i).fill('250000');
  await expect(page.getByText('₦250,000').first()).toBeVisible();
  const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel(/due date/i).fill(due);

  const storageResponse = page.waitForResponse(
    (r) => r.url().includes('/storage/v1/object/bill-proofs') && r.request().method() === 'POST'
  );
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  await page.getByRole('button', { name: /submit/i }).last().click();

  const res = await storageResponse;
  expect(res.ok()).toBeTruthy();
  await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 15000 });
});
