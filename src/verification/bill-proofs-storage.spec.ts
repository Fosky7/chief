import { test, expect } from '@playwright/test';

test('@affected bill proof field accepts a proof file on /bills/new', async ({ page }) => {
  await page.goto('/bills/new');
  await expect(page.getByText('Proof of bill').first()).toBeVisible();
  const fileInput = page.locator('input[type="file"]').first();
  await expect(fileInput).toHaveCount(1);
  await fileInput.setInputFiles({
    name: 'electricity-bill.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  const count = await fileInput.evaluate((el) => (el as HTMLInputElement).files?.length ?? 0);
  expect(count).toBe(1);
});
