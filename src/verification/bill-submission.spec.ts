import { test, expect, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function openForm(page: Page) {
  await page.goto('/auth');
  const email = page.getByLabel(/email/i).first();
  await email.waitFor({ timeout: 15000 });
  await email.fill(EMAIL!);
  await page.getByLabel(/password/i).first().fill(PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
  await page.waitForTimeout(2000);
  await page.goto('/bills/new');
  await expect(page.getByLabel(/^Title/).first()).toBeVisible({ timeout: 15000 });
}

test('@affected @database @persistence bill submission with proof upload shows Pending review', async ({ page }) => {
  if (!EMAIL || !PASSWORD) {
    test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD disposable account not supplied' });
    test.skip(true, 'Disposable test account not supplied by runner');
  }
  await openForm(page);

  for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
    await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
  }

  // Invalid input: visible validation and no write to bills.
  let billWrites = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && /\/rest\/v1\/bills/.test(req.url())) billWrites++;
  });
  await page.getByRole('button', { name: /submit bill/i }).first().click();
  await expect(page.getByText('Title is required')).toBeVisible();
  expect(billWrites).toBe(0);

  const stamp = Date.now();
  await page.getByLabel(/^Title/).first().fill(`E2E electricity bill ${stamp}`);
  await page.getByLabel(/^Story/).first().fill('Disposable verification bill: our prepaid meter ran out and we need help covering the balance this month.');
  await page.getByLabel(/^Category/).first().selectOption({ index: 1 });
  await page.getByLabel(/^Biller name/).first().fill('Ikeja Electric');
  const amount = page.getByLabel(/Amount/).first();
  await amount.fill('250000');
  const value = await amount.inputValue();
  if (!value.includes('₦250,000')) {
    await expect(page.getByText('₦250,000').first()).toBeVisible();
  }
  await page.getByLabel(/^Due date/).first().fill('2027-01-31');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });

  const insertResponse = page.waitForResponse(
    (res) => res.request().method() === 'POST' && /\/rest\/v1\/bills/.test(res.url()) && res.ok(),
    { timeout: 30000 },
  );
  await page.getByRole('button', { name: /submit bill/i }).first().click();
  await insertResponse;
  await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 20000 });
});
