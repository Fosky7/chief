import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
  test(`Discover retains branded funding card at ${viewport.width}px @affected`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: 'Discover bills', exact: true })).toBeVisible();

    const card = page.getByTestId('swipe-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/\bglass\b/);
    await expect(page.getByTestId('swipe-card-title')).toBeVisible();
    await expect(page.getByTestId('swipe-card-raised')).toContainText('Raised');
    const needed = page.getByTestId('swipe-card-goal');
    await expect(needed).toBeVisible();
    await expect(needed).toContainText('Needed');
    await expect(needed).toContainText(/₦[\d,]+/);
    await expect(card.getByRole('progressbar', { name: 'Funding progress' })).toBeVisible();
    await expect(card.getByRole('link', { name: 'View details' })).toBeVisible();
    await expect(page.getByTestId('swipe-skip')).toBeVisible();
    await expect(page.getByTestId('swipe-support')).toBeVisible();

    const bounds = await card.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
  });
}
