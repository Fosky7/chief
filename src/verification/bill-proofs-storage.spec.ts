import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test('bill proof file can be attached on /bills/new @affected', async ({ page }) => {
  if (!email || !password) {
    test.info().annotations.push({
      type: 'setup-required',
      description: 'Disposable account E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied by the runner.',
    });
    test.skip(true, 'Disposable test account not supplied');
    return;
  }

  await page.goto('/auth');
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  await page.waitForLoadState('networkidle');

  await page.goto('/bills/new');
  await expect(page.getByText('Proof of bill').first()).toBeVisible();

  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: 'electricity-bill.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64',
    ),
  });
  const fileCount = await fileInput.evaluate((el) => (el as HTMLInputElement).files?.length ?? 0);
  expect(fileCount).toBe(1);
});
