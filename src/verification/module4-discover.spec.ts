import { test, expect } from '@playwright/test';

test.describe('Module 4 discover deck @affected', () => {
  test('top card shows photo, title, naira amounts and progress @affected', async ({ page }) => {
    await page.goto('/discover');
    const card = page.getByTestId('swipe-card');
    await expect(card).toBeVisible();
    await expect(card.locator('img')).toBeVisible();
    await expect(page.getByTestId('bill-title')).not.toBeEmpty();
    await expect(card.getByText('Needed')).toBeVisible();
    await expect(card.getByText('Raised')).toBeVisible();
    await expect(card.getByRole('progressbar')).toBeVisible();
    await expect(page.getByTestId('needed-amount')).toHaveText(/^₦\d{1,3}(,\d{3})+$/);
    await expect(page.getByTestId('raised-amount')).toHaveText(/^₦\d{1,3}(,\d{3})+$/);
  });

  test('Skip shows next card @affected', async ({ page }) => {
    await page.goto('/discover');
    const title = page.getByTestId('bill-title');
    const first = (await title.textContent())?.trim();
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(title).not.toHaveText(first ?? '');
  });

  test('Give opens Choose an amount @affected', async ({ page }) => {
    await page.goto('/discover');
    await page.getByRole('button', { name: 'Give' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Choose an amount')).toBeVisible();
  });

  test('home Start swiping reaches the discover deck @affected', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Start swiping', exact: true }).click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByTestId('swipe-card')).toBeVisible();
    await expect(page.getByTestId('swipe-card').getByText('Needed')).toBeVisible();
  });

  test('dragging the card left shows next card @affected', async ({ page }) => {
    await page.goto('/discover');
    const title = page.getByTestId('bill-title');
    const first = (await title.textContent())?.trim();
    const box = await page.getByTestId('swipe-card').boundingBox();
    if (!box) throw new Error('card not rendered');
    const y = box.y + box.height / 2;
    const x = box.x + box.width / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 25, y);
    await page.mouse.up();
    await expect(title).not.toHaveText(first ?? '');
  });
});
