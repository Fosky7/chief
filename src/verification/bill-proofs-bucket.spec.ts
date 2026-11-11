import { test, expect } from '@playwright/test';

// Tiny 1x1 PNG used as disposable proof attachment (never submitted here).
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('@affected proof of bill field accepts a file on /bills/new', async ({ page }) => {
  await page.goto('/bills/new');
  await expect(page.getByText('Proof of bill').first()).toBeVisible();

  const fileInput = page.locator('input[type="file"]').first();
  await expect(fileInput).toHaveCount(1);
  await fileInput.setInputFiles({
    name: 'electricity-bill.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  });

  const chosen = await fileInput.evaluate((el) => {
    const input = el as HTMLInputElement;
    return input.files && input.files.length > 0 ? input.files[0].name : '';
  });
  expect(chosen).toBe('electricity-bill.png');
});
