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
  test(`discovery visibly displays the Needed amount on ${viewport.name} @affected`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.getByRole('link', { name: 'Start swiping', exact: true }).click();

    await expect(page).toHaveURL(/\/discover\/?(?:[?#].*)?$/);
    const heading = page.getByRole('heading', { level: 1, name: 'Discover bills', exact: true });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Discover bills');
    await expect(heading.locator('span')).toHaveClass('sr-only');
    await expect(heading.locator('span')).toHaveText(' bills');
    await expect(page.getByText(/\bNeeded\b/i).first()).toBeVisible();
    const goal = page.getByTestId('swipe-card-goal');
    await expect(goal).toBeVisible();
    await expect(goal).toContainText(/Needed\s+₦[\d,]+(?:\.\d+)?/);

    // A visible element can still extend beyond the phone viewport.
    // Check its actual bounds as well as document-wide horizontal overflow.
    await expect(async () => {
      const bounds = await goal.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }).toPass();

    await page.reload();
    await expect(heading).toBeVisible();
    await expect(heading.locator('span')).toHaveClass('sr-only');
    await expect(goal).toBeVisible();
    await expect(goal).toContainText(/Needed\s+₦[\d,]+(?:\.\d+)?/);

    await expect(async () => {
      const bounds = await goal.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }).toPass();
  });
}
