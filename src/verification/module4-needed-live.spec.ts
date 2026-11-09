import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`Discover retains Needed and deck actions at ${viewport.width}px @affected`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: 'Discover bills', exact: true })).toBeVisible();
    await expect(page.getByTestId('swipe-card')).toBeVisible({ timeout: 30000 });
    const goal = page.getByTestId('swipe-card-goal');
    await expect(goal.getByText('Needed', { exact: true })).toBeVisible();
    await expect(goal).toContainText(/₦[\d,]+/);
    const card = page.getByTestId('swipe-card');
    const bounds = await card.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    await expect(card).toHaveClass(/bg-card/);
    const title = await page.getByTestId('swipe-card-title').innerText();
    const counter = await page.getByTestId('deck-counter').innerText();
    await page.getByRole('button', { name: 'Give', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Choose an amount' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('spinbutton', { name: 'Amount (₦)' }).fill('1000');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByTestId('swipe-card-title')).toHaveText(title);
    await expect(page.getByTestId('deck-counter')).toHaveText(counter);
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
    const total = Number(counter.split('/')[1].trim());
    if (total > 1) {
      await expect(page.getByTestId('deck-counter')).toHaveText(`2 / ${total}`);
      await expect(page.getByTestId('swipe-card-goal').getByText('Needed', { exact: true })).toBeVisible();
    } else {
      await expect(page.getByTestId('deck-end')).toBeVisible();
      await page.getByRole('button', { name: 'Start over', exact: true }).click();
      await expect(page.getByTestId('swipe-card-title')).toHaveText(title);
    }
    await page.reload();
    await expect(page.getByTestId('swipe-card-goal').getByText('Needed', { exact: true })).toBeVisible({ timeout: 30000 });
  });
}
