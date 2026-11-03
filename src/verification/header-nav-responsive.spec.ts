import { test, expect } from "@playwright/test";

/**
 * Real browser verification for the responsive header tabs.
 *
 * These specs drive the actual UI at phone and desktop widths. They never
 * import app modules and never mock the application.
 *
 * What is locked in:
 *  - `< 768px`: the rail row (`[data-header-rail-row]`) is visible, its inner
 *    `[data-scroll-x]` container reports a real `overflow-x: auto|scroll`, and
 *    the document never widens horizontally.
 *  - The tab links expose the exact accessible names `Discover` / `Dashboard`
 *    even when a compact label is painted.
 *  - `>= 768px`: the rail is hidden and the desktop `Primary` nav is visible.
 *  - Tapping `Discover` from the 375px rail navigates and renders the page
 *    with exactly one header and one main landmark.
 *  - The single labelled logo stays visible inside the brand row at every
 *    tested width.
 */

const PHONE_WIDTHS = [320, 360] as const;
const DESKTOP_WIDTHS = [768, 1280] as const;
const ALL_WIDTHS = [320, 360, 768, 1280] as const;

const ACCESSIBLE_NAMES = ["Discover", "Dashboard"] as const;

/** Header-scoped rail row selector. */
const RAIL_ROW = "header[data-site-header] [data-header-rail-row]";

/** Header-scoped desktop nav selector. */
const DESKTOP_NAV =
  'header[data-site-header] nav[aria-label="Primary"][data-header-nav-desktop]';

test.describe("@affected responsive header tabs", () => {
  for (const width of PHONE_WIDTHS) {
    test(`@affected ${width}px: rail scrolls itself and never widens the document`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 740 });
      await page.goto("/");

      // The rail row is mounted and painted.
      const railRow = page.locator(RAIL_ROW).first();
      await expect(railRow).toBeVisible();

      // The inner container is a real horizontal scroll container.
      const scroller = railRow.locator("[data-scroll-x]").first();
      await expect(scroller).toBeVisible();

      const overflowX = await scroller.evaluate(
        (el) => getComputedStyle(el).overflowX,
      );
      expect(["auto", "scroll"]).toContain(overflowX);

      // The rail can genuinely scroll horizontally. When the tabs already fit
      // there is nothing to scroll, which is equally correct.
      const scrolled = await scroller.evaluate((el) => {
        if (el.scrollWidth <= el.clientWidth) return true;
        el.scrollLeft = el.scrollWidth - el.clientWidth;
        return el.scrollLeft > 0;
      });
      expect(scrolled).toBe(true);

      // Tabs are all reachable inside the rail at this width.
      for (const name of ACCESSIBLE_NAMES) {
        await expect(
          page
            .locator(RAIL_ROW)
            .first()
            .getByRole("link", { name, exact: true })
            .first(),
        ).toBeVisible();
      }

      // The document itself never widens.
      const documentOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(documentOverflow).toBeLessThanOrEqual(1);
    });
  }

  for (const width of DESKTOP_WIDTHS) {
    test(`@affected ${width}px: rail is hidden and the desktop nav is visible`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      await expect(page.locator(RAIL_ROW)).toBeHidden();

      const desktopNav = page.locator(DESKTOP_NAV).first();
      await expect(desktopNav).toBeVisible();

      for (const name of ACCESSIBLE_NAMES) {
        await expect(
          desktopNav.getByRole("link", { name, exact: true }).first(),
        ).toBeVisible();
      }

      const documentOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(documentOverflow).toBeLessThanOrEqual(1);
    });
  }

  test("@affected 375px: tapping Discover in the rail navigates to /discover", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const discover = page
      .locator(RAIL_ROW)
      .first()
      .getByRole("link", { name: "Discover", exact: true })
      .first();
    await expect(discover).toBeVisible();
    await discover.click();

    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.locator("header[data-site-header]")).toHaveCount(1);
    await expect(page.locator("main#main-content")).toHaveCount(1);

    // The active pill is still exposed as the current page after navigation.
    await expect(
      page
        .locator(RAIL_ROW)
        .first()
        .getByRole("link", { name: "Discover", exact: true })
        .first(),
    ).toHaveAttribute("aria-current", "page");
  });

  test("@affected logo stays visible inside the brand row at every tested width", async ({
    page,
  }) => {
    for (const width of ALL_WIDTHS) {
      // eslint-disable-next-line no-await-in-loop
      await page.setViewportSize({ width, height: 800 });
      // eslint-disable-next-line no-await-in-loop
      await page.goto("/");

      const logo = page
        .locator(
          "[data-header-brand-row] [data-brand-lockup] [data-header-logo]",
        )
        .first();
      // eslint-disable-next-line no-await-in-loop
      await expect(logo).toBeVisible();
    }
  });
});
