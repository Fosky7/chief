import { test, expect, type Page } from '@playwright/test';

async function openDeck(page: Page) {
  await page.goto('/discover');
  await expect(page.getByTestId('swipe-card')).toBeVisible({ timeout: 30000 });
}

test.describe('Module 4 discovery @affected', () => {
  test('home entry opens discovery with complete funding information', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Discover', exact: true }).last().click();
    await expect(page).toHaveURL(/\/discover\/?$/);
    const card = page.getByTestId('swipe-card');
    await expect(card).toBeVisible({ timeout: 30000 });
    await expect(card.getByRole('button', { name: 'Skip', exact: true })).toBeVisible();
    await expect(card.getByRole('heading', { level: 2 })).not.toHaveText('');
    await expect(card.locator('dt').filter({ hasText: /^Needed$/ })).toBeVisible();
    await expect(card.locator('dt').filter({ hasText: /^Raised$/ })).toBeVisible();
    for (const amount of await card.locator('dd').all()) {
      await expect(amount).toHaveText(/^₦\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$/);
    }
    const image = card.getByRole('img');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    const amounts = await card.locator('dd').allTextContents();
    const parse = (value: string) => Number(value.replace(/[^\d.]/g, ''));
    const expected = Math.round(Math.min(100, Math.max(0, parse(amounts[1]) / parse(amounts[0]) * 100)));
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(expected));
  });

  test('skip advances to a different bill', async ({ page }) => {
    await openDeck(page);
    const card = page.getByTestId('swipe-card');
    const title = await card.getByRole('heading', { level: 2 }).innerText();
    await card.getByRole('button', { name: 'Skip', exact: true }).click();
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading', { level: 2 })).not.toHaveText(title);
    await expect(card.getByText('Needed', { exact: true })).toBeVisible();
  });

  test('give opens an amount chooser without advancing the bill or taking payment', async ({ page }) => {
    await openDeck(page);
    const card = page.getByTestId('swipe-card');
    const title = await card.getByRole('heading', { level: 2 }).innerText();
    await card.getByRole('button', { name: 'Give', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Choose an amount' })).toBeVisible();
    await expect(dialog.getByText(title, { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: '₦10,000', exact: true }).click();
    await expect(dialog.getByLabel('Custom amount (₦)')).toHaveValue('10000');
    await dialog.getByRole('button', { name: 'Back to discovery' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card.getByRole('heading', { level: 2 })).toHaveText(title);
  });

  test('dragging left beyond the threshold advances the deck', async ({ page }) => {
    await openDeck(page);
    const card = page.getByTestId('swipe-card');
    const title = await card.getByRole('heading', { level: 2 }).innerText();
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    if (!box) throw new Error('Swipe card has no bounding box');
    const x = box.x + box.width * 0.7;
    const y = box.y + 100;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - Math.min(180, box.width * 0.5), y, { steps: 15 });
    await page.mouse.up();
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading', { level: 2 })).not.toHaveText(title);
    await expect(card.getByText('Needed', { exact: true })).toBeVisible();
  });
});
