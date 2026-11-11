import { test, expect, type Page } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

async function signIn(page: Page) {
  await page.goto('/auth');
  await page.getByLabel(/email/i).first().fill(email!);
  await page.getByLabel(/password/i).first().fill(password!);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForLoadState('networkidle');
}

test.describe('bill submission on /bills/new @affected', () => {
  test('form shows all bill fields @affected', async ({ page }) => {
    if (email && password) await signIn(page);
    await page.goto('/bills/new');
    for (const label of ['Title', 'Story', 'Category', 'Biller name', 'Amount (₦)', 'Due date', 'Proof of bill']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test('amount shows naira formatting @affected', async ({ page }) => {
    if (email && password) await signIn(page);
    await page.goto('/bills/new');
    const amount = page.getByLabel(/Amount/i).first();
    await amount.fill('250000');
    await expect(page.getByText('₦250,000').first().or(amount)).toBeVisible();
    const value = await amount.inputValue();
    const pageText = await page.locator('body').innerText();
    expect(value.includes('250,000') || pageText.includes('₦250,000')).toBeTruthy();
  });

  test('missing title shows validation error @affected', async ({ page }) => {
    if (email && password) await signIn(page);
    await page.goto('/bills/new');
    await page.getByRole('button', { name: /submit/i }).last().click();
    await expect(page.getByText('Title is required')).toBeVisible();
  });

  test('complete form shows Pending review @affected @database @persistence', async ({ page }) => {
    if (!email || !password) {
      test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD disposable account not supplied' });
      test.skip(true, 'Disposable test account not supplied by runner');
    }
    await signIn(page);
    await page.goto('/bills/new');
    await page.getByLabel(/Title/i).first().fill(`E2E electricity bill ${Date.now()}`);
    await page.getByLabel(/Story/i).first().fill('Our family needs help clearing this month\'s electricity bill before disconnection.');
    const category = page.getByLabel(/Category/i).first();
    const tag = await category.evaluate((el) => el.tagName.toLowerCase());
    if (tag === 'select') await category.selectOption({ index: 1 });
    else await category.fill('Utilities');
    await page.getByLabel(/Biller name/i).first().fill('Ikeja Electric');
    await page.getByLabel(/Amount/i).first().fill('250000');
    await page.getByLabel(/Due date/i).first().fill('2030-01-15');
    await page.locator('input[type="file"]').first().setInputFiles({
      name: 'proof.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByRole('button', { name: /submit/i }).last().click();
    await expect(page.getByText('Pending review').first()).toBeVisible({ timeout: 20000 });
  });
});
