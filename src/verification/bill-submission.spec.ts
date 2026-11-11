import { test, expect, type Page } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function signInIfAsked(page: Page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  const passwordField = page.getByLabel(/password/i).first();
  if (await passwordField.isVisible().catch(() => false)) {
    if (!email || !password) return false;
    await page.getByLabel(/email/i).first().fill(email);
    await passwordField.fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.goto('/bills/new');
  }
  return true;
}

async function chooseCategory(page: Page) {
  const field = page.getByLabel('Category', { exact: false }).first();
  const tag = await field.evaluate((el) => el.tagName.toLowerCase());
  if (tag === 'select') {
    const values = await field.locator('option').evaluateAll((opts) =>
      (opts as HTMLOptionElement[]).map((o) => o.value).filter((v) => v),
    );
    await field.selectOption(values[0]);
  } else {
    await field.click();
    await page.getByRole('option').first().click();
  }
}

test.describe('Bill submission @affected', () => {
  test('form shows all bill fields @affected', async ({ page }) => {
    await page.goto('/bills/new');
    await signInIfAsked(page);
    for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date']) {
      await expect(page.getByLabel(label, { exact: false }).first()).toBeVisible();
    }
    await expect(page.getByText('Proof of bill').first()).toBeVisible();
  });

  test('amount field formats naira @affected', async ({ page }) => {
    await page.goto('/bills/new');
    await signInIfAsked(page);
    const amount = page.getByLabel('Amount (₦)', { exact: false }).first();
    await amount.fill('250000');
    await expect(page.getByText('₦250,000').first().or(amount)).toBeVisible();
    const value = await amount.inputValue();
    const textVisible = await page.getByText('₦250,000').first().isVisible().catch(() => false);
    expect(value.includes('250,000') || textVisible).toBeTruthy();
  });

  test('missing title shows validation error @affected', async ({ page }) => {
    await page.goto('/bills/new');
    await signInIfAsked(page);
    await page.getByLabel('Amount (₦)', { exact: false }).first().fill('250000');
    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page.getByText('Title is required').first()).toBeVisible();
  });

  test('complete form shows pending review @affected @database @persistence', async ({ page }) => {
    if (!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD) {
      test.info().annotations.push({ type: 'setup-required', description: 'Disposable E2E user account not supplied' });
      test.skip(true, 'Disposable E2E user account not supplied');
    }
    await page.goto('/bills/new');
    await signInIfAsked(page);
    const stamp = Date.now();
    await page.getByLabel('Title', { exact: false }).first().fill(`E2E test bill ${stamp}`);
    await page.getByLabel('Story', { exact: false }).first().fill('Disposable verification bill created by an automated check. Please reject.');
    await chooseCategory(page);
    await page.getByLabel('Biller name', { exact: false }).first().fill('Ikeja Electric');
    await page.getByLabel('Amount (₦)', { exact: false }).first().fill('250000');
    await page.getByLabel('Due date', { exact: false }).first().fill('2027-12-31');
    await page.locator('input[type="file"]').first().setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: PNG });
    await page.getByRole('button', { name: /submit/i }).first().click();
    await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 20000 });
  });
});
