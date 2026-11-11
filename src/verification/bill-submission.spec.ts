import { test, expect, type Page } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function openForm(page: Page) {
  await page.goto('/bills/new');
  const title = page.getByLabel('Title', { exact: false }).first();
  if (await title.isVisible().catch(() => false)) return true;
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) return false;
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForTimeout(1500);
  await page.goto('/bills/new');
  await expect(page.getByLabel('Title', { exact: false }).first()).toBeVisible();
  return true;
}

test('@affected bill submission form: fields, naira formatting, validation, pending review', async ({ page }) => {
  const ready = await openForm(page);
  if (!ready) {
    test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied for sign-in' });
    test.skip(true, 'Disposable test account not supplied');
  }

  for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date']) {
    await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
  }
  await expect(page.getByText('Proof of bill').first()).toBeVisible();

  const amount = page.getByLabel('Amount (₦)', { exact: false }).first();
  await amount.fill('250000');
  await expect(page.getByText('₦250,000').first().or(amount)).toBeVisible();
  const amountValue = await amount.inputValue();
  const bodyText = await page.locator('body').innerText();
  expect(amountValue.includes('250,000') || bodyText.includes('₦250,000')).toBeTruthy();

  await page.getByRole('button', { name: /submit/i }).first().click();
  await expect(page.getByText('Title is required').first()).toBeVisible();

  await page.getByLabel('Title', { exact: false }).first().fill(`E2E disposable bill ${Date.now()}`);
  await page.getByLabel('Story', { exact: false }).first().fill('Disposable verification bill created by an automated test for the electricity payment.');
  const category = page.getByLabel('Category', { exact: false }).first();
  const tag = await category.evaluate((el) => el.tagName.toLowerCase());
  if (tag === 'select') {
    const values = await category.locator('option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
    await category.selectOption(values[0]);
  } else {
    await category.fill('Utilities');
  }
  await page.getByLabel('Biller name', { exact: false }).first().fill('Ikeja Electric');
  await page.getByLabel('Due date', { exact: false }).first().fill('2030-12-31');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
  await page.getByRole('button', { name: /submit/i }).first().click();
  await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 20000 });
});
