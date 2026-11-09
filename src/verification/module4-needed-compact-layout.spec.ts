import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  test(`Discover keeps compact funding amounts at ${viewport.width}px @affected`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: 'Discover bills' })).toBeVisible();

    const card = page.getByTestId('swipe-card');
    const raised = card.getByTestId('swipe-card-raised');
    const needed = card.getByTestId('swipe-card-goal');
    await expect(card).toBeVisible();
    await expect(raised).toContainText(/Raised\s+₦[\d,.]+/);
    await expect(needed).toContainText(/Needed\s+₦[\d,.]+/);
    await expect(needed).toBeVisible();
    await expect(card.getByRole('progressbar', { name: 'Funding progress' })).toBeVisible();

    const raisedBox = await raised.boundingBox();
    const neededBox = await needed.boundingBox();
    expect(raisedBox).not.toBeNull();
    expect(neededBox).not.toBeNull();
    expect(Math.abs(raisedBox!.y - neededBox!.y)).toBeLessThan(2);
    expect(neededBox!.height).toBeLessThan(32);
    expect(neededBox!.x + neededBox!.width).toBeLessThanOrEqual(viewport.width);

    const title = await page.getByTestId('swipe-card-title').textContent();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
    await expect.poll(async () => {
      if (await page.getByTestId('deck-end').isVisible()) return true;
      return (await page.getByTestId('swipe-card-title').textContent()) !== title;
    }).toBe(true);
  });
}
