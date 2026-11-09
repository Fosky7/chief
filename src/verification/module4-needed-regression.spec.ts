import { test, expect } from '@playwright/test';

/* krossbuild-write-set:
 * src/verification/module4-needed-visible.spec.ts
 * src/verification/module4-needed-regression.spec.ts
 * src/verification/module4-needed-live.spec.ts
 * src/routes/__root.tsx
 * src/routeTree.gen.ts
 * src/components/Layout.tsx
 * src/routes/discover.tsx
 * src/routes/index.tsx
 */

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`discovery preserves navigation and Needed after skipping on ${viewport.name} @affected`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.getByRole('link', { name: 'Start swiping', exact: true }).click();
    await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Discover bills', exact: true })).toBeVisible();

    const card = page.getByTestId('swipe-card');
    const title = page.getByTestId('swipe-card-title');
    const needed = page.getByTestId('swipe-card-goal');
    await expect(card).toBeVisible();
    await expect(title).toBeVisible();
    await expect(needed).toBeVisible();
    await expect(needed).toContainText(/Needed\s+₦[\d,]+(?:\.\d+)?/);

    const previousTitle = await title.innerText();
    await page.getByTestId('swipe-skip').click();
    await expect(title).not.toHaveText(previousTitle);
    await expect(needed).toBeVisible();
    await expect(needed).toContainText(/Needed\s+₦[\d,]+(?:\.\d+)?/);

    const details = card.getByRole('link', { name: 'View details' });
    await expect(details).toBeVisible();
    const detailsPath = await details.getAttribute('href');
    expect(detailsPath).toMatch(/^\/bills\/.+/);
    await details.click();
    await expect(page).toHaveURL(new RegExp(`/bills/${detailsPath!.split('/').pop()!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[?#].*)?$`));

    await page.goBack();
    await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Discover bills', exact: true })).toBeVisible();
    await expect(needed).toBeVisible();
    await expect(needed).toContainText(/Needed\s+₦[\d,]+(?:\.\d+)?/);
  });
}
