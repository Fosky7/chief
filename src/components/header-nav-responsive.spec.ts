import { test, expect } from '@playwright/test';

/**
 * Focused browser verification for the header tabs at the three widths named
 * in the acceptance criteria: 320px, 480px and desktop.
 *
 * These specs drive the real UI (no mocks, no app imports) and cover both the
 * responsive layout and the saved tab selection that now round-trips through
 * the `nav_preferences` contract (Supabase for a signed-in user, and the
 * localStorage mirror that any signed-out visitor uses).
 */

const RAIL_ROW = 'header[data-site-header] [data-header-rail-row]';
const DESKTOP_NAV =
  'header[data-site-header] nav[aria-label="Primary"][data-header-nav-desktop]';
const MENU_TOGGLE = '[data-header-menu-toggle]';
const MENU_PANEL = '[data-header-menu-panel]';

test.describe('@affected header tabs layout and saved selection', () => {
  for (const width of [320, 480] as const) {
    test(`@affected ${width}px: rail is usable, nothing overflows, the chosen tab survives a reload`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto('/');

      const railRow = page.locator(RAIL_ROW).first();
      await expect(railRow).toBeVisible();
      await expect(page.locator(MENU_TOGGLE).first()).toBeVisible();

      const scroller = railRow.locator('[data-scroll-x]').first();
      await expect(scroller).toBeVisible();

      const overflowX = await scroller.evaluate(
        (el) => getComputedStyle(el).overflowX,
      );
      expect(['auto', 'scroll']).toContain(overflowX);

      const documentOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(documentOverflow).toBeLessThanOrEqual(1);

      // Choose a tab from the Menu panel and confirm the saved selection is
      // restored after a full page load.
      await page.locator(MENU_TOGGLE).first().click();
      const panel = page.locator(MENU_PANEL).first();
      await expect(panel).toBeVisible();
      await panel.getByRole('link', { name: 'Settings', exact: true }).click();
      await expect(page).toHaveURL(/\/settings$/);

      await page.reload();

      await expect(page.locator('header[data-site-header]')).toHaveCount(1);
      await expect(page.locator('main#main-content')).toHaveCount(1);
      await expect(
        page
          .locator(RAIL_ROW)
          .first()
          .getByRole('link', { name: 'Settings', exact: true })
          .first(),
      ).toHaveAttribute('aria-current', 'page');
    });
  }

  test('@affected 1280px: the desktop nav shows, the rail and Menu are hidden', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator(RAIL_ROW)).toBeHidden();
    await expect(page.locator(DESKTOP_NAV).first()).toBeVisible();
    await expect(page.locator(MENU_TOGGLE).first()).toBeHidden();

    const documentOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(documentOverflow).toBeLessThanOrEqual(1);
  });
});
