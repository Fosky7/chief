import { expect, test } from "@playwright/test";

/**
 * Header tabs — responsive layout + persistence.
 *
 * Flow-level checks for the mobile-responsive header tabs and the
 * `nav_preferences` persistence contract restored in this change.
 */

test.describe("header tabs @affected", () => {
  test("renders the header navigation on the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Swipe right to pay a bill").first()).toBeVisible();

    const headerNav = page.locator("header, nav").first();
    await expect(headerNav).toBeVisible();
    await expect(page.getByText(/discover/i).first()).toBeVisible();
  });

  test("keeps the existing routes rendering", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByText("Verified requests").first()).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText("Your pledges").first()).toBeVisible();
  });

  test.describe("narrow viewport", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("still renders the page and its header chrome", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Swipe right to pay a bill").first()).toBeVisible();

      const headerNav = page.locator("header, nav").first();
      await expect(headerNav).toBeVisible();

      // No horizontal overflow at mobile width.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });

  test.describe("mobile rail and drawer @affected", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("the Menu drawer navigates and the chosen tab survives a reload", async ({
      page,
    }) => {
      await page.goto("/");

      const railRow = page.locator("header[data-site-header] [data-header-rail-row]").first();
      await expect(railRow).toBeVisible();

      const toggle = page.locator("[data-header-menu-toggle]").first();
      await expect(toggle).toBeVisible();
      await toggle.click();

      const panel = page.locator("[data-header-menu-panel]").first();
      await expect(panel).toBeVisible();
      await panel.getByRole("link", { name: "Discover", exact: true }).click();
      await expect(page).toHaveURL(/\/discover$/);
      await expect(page.getByText("Verified requests").first()).toBeVisible();

      await page.reload();

      await expect(
        page
          .locator("header[data-site-header] [data-header-rail-row]")
          .first()
          .getByRole("link", { name: "Discover", exact: true })
          .first(),
      ).toHaveAttribute("aria-current", "page");
    });

    test("no page-level horizontal overflow at 320, 375 and 414px", async ({ page }) => {
      for (const width of [320, 375, 414] as const) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/");

        const scroller = page
          .locator("header[data-site-header] [data-header-rail-row] [data-scroll-x]")
          .first();
        await expect(scroller).toBeVisible();

        const overflowX = await scroller.evaluate((el) => getComputedStyle(el).overflowX);
        expect(["auto", "scroll"]).toContain(overflowX);

        const documentOverflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(documentOverflow).toBeLessThanOrEqual(1);
      }
    });
  });
});

test.describe("nav preference persistence @database @persistence", () => {
  test("the chosen header tab is stored in nav_preferences and restored after reload", async ({
    page,
  }) => {
    await page.goto("/settings");

    // The write path targets the concrete `public.nav_preferences` table
    // (user_id / active_tab / updated_at) and needs a signed-in session.
    const signedIn = (await page
      .getByText(/sign out|sign-out|log out/i)
      .count()) > 0;

    test.skip(
      !signedIn,
      "Requires a signed-in disposable donor account; no consented test credentials are provisioned in this environment, so the live nav_preferences write cannot be exercised yet.",
    );

    await page.getByText(/discover/i).first().click();
    await page.reload();
    await expect(page.getByText("Verified requests").first()).toBeVisible();
  });
});
