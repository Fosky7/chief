import { test, expect } from '@playwright/test';

test('@affected bill proof field is available for upload on /bills/new', async ({ page }) => {
  await page.goto('/bills/new');
  await expect(page.getByText('Proof of bill').first()).toBeVisible();
  const fileInput = page.locator('input[type="file"]').first();
  await expect(fileInput).toHaveCount(1);
  await fileInput.setInputFiles({
    name: 'proof.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    ),
  });
  await expect(fileInput).toHaveJSProperty('files.length', 1);
});
