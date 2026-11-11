import { test, expect } from '@playwright/test';

test.describe('Swipe deck discovery @affected', () => {
  test('pass and back bills in the swipe deck @affected', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: 'Discover bills' })).toBeVisible();

    const card = page.getByTestId('swipe-card');
    await expect(card.getByText('Needed', { exact: true })).toBeVisible();
    await expect(card.getByText('Raised', { exact: true })).toBeVisible();
    await expect(page.getByTestId('card-needed')).toHaveText(/^₦\d{1,3}(,\d{3})+$/);

    const counter = page.getByTestId('deck-counter');
    await expect(counter).toContainText('1 of');
    const firstTitle = (await page.getByTestId('swipe-card-title').innerText()).trim();

    await page.getByRole('button', { name: 'Pass' }).click();
    await expect(counter).toContainText('2 of');

    const total = Number(((await counter.innerText()).split('of')[1] || '0').trim());
    if (total >= 2) {
      await expect(page.getByTestId('swipe-card-title')).not.toHaveText(firstTitle);
      const secondTitle = (await page.getByTestId('swipe-card-title').innerText()).trim();
      await page.getByRole('button', { name: 'Back this bill' }).click();
      await expect(page.getByTestId('backed-heading')).toHaveText('Backed (1)');
      await expect(page.getByTestId('backed-item').first()).toHaveText(secondTitle);
    }
  });
});
