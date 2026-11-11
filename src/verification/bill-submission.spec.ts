import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test('@affected @database @persistence submitting a complete bill shows Pending review', async ({ page }) => {
  if (!email || !password) {
    test.info().annotations.push({ type: 'setup-required', description: 'E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied' });
    test.skip(true, 'Disposable test account not supplied');
  }

  await page.goto('/bills/new');
  const emailField = page.getByLabel(/email/i).first();
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(email!);
    await page.getByLabel(/password/i).first().fill(password!);
    await page.getByRole('button', { name: /sign in|log in/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.goto('/bills/new');
  }

  const title = `E2E bill ${Date.now()}`;
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Story').fill('Disposable verification bill, please ignore.');
  const category = page.getByLabel('Category');
  if ((await category.evaluate((el) => el.tagName)) === 'SELECT') {
    await category.selectOption({ index: 1 });
  } else {
    await category.fill('Utilities');
  }
  await page.getByLabel('Biller name').fill('Test Biller');
  await page.getByLabel('Amount (₦)').fill('250000');
  await expect(page.getByText('₦250,000')).toBeVisible();
  await page.getByLabel('Due date').fill('2030-01-15');
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'proof.png',
    mimeType: 'image/png',
    buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4a90000000049454e44ae426082', 'hex'),
  });
  await page.getByRole('button', { name: /submit/i }).first().click();
  await expect(page.getByText('Pending review')).toBeVisible({ timeout: 20000 });
});
