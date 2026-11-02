import { test, expect } from "@playwright/test";

/**
 * Real browser verification for the shared shell wiring and the hardenend
 * header geometry (steps 4 + 5).
 *
 * These specs drive the actual UI: they navigate real routes, exercise the
 * skip link, and measure real layout at a 320px viewport. They never import
 * application modules and never mock the app.
 */

const routes = ["/", "/discover", "/dashboard"] as const;

test.describe("@affected shared shell + header geometry", () => {
  test("@affected header mounts exactly once on every route and main is the skip target", async ({
    page,
  }) => {
    for (const path of routes) {
      await page.goto(path);

      // The header is rendered by AppShell, so exactly one instance exists.
      await expect(page.locator("header[data-site-header]")).toHaveCount(1);

      // The skip target exists once and is programmatically focusable.
      const main = page.locator("main#main-content");
      await expect(main).toHaveCount(1);
      await expect(main).toHaveAttribute("tabindex", "-1");

      // Brand lockup renders the inline cap mark beside the app name.
      const logo = page
        .locator(
          "[data-site-header] [data-header-brand-row] [data-brand-lockup] [data-header-logo]",
        )
        .first();
      await expect(logo).toBeVisible();

      const logoBox = await logo.boundingBox();
      expect(logoBox).not.toBeNull();
      if (logoBox) {
        // Token-banded mark: never zero-sized and never larger than 48px.
        expect(logoBox.width).toBeGreaterThan(0);
        expect(logoBox.height).toBeGreaterThan(0);
        expect(logoBox.width).toBeLessThanOrEqual(48);
        expect(logoBox.height).toBeLessThanOrEqual(48);
      }
    }
  });

  test("@affected skip link moves the browser to the main landmark", async ({
    page,
  }) => {
    await page.goto("/");

    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toHaveAttribute("href", "#main-content");

    await skip.focus();
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");

    // The fragment lands on the real landmark, not a missing anchor.
    await expect(page.locator("#main-content")).toBeVisible();
    expect(new URL(page.url()).hash).toBe("#main-content");
  });

  test("@affected 320px viewport: no horizontal overflow and the rail scrolls itself", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");

    await expect(page.locator("header[data-site-header]")).toBeVisible();
    await expect(
      page.locator("[data-header-brand-row] [data-brand-lockup]"),
    ).toBeVisible();

    // The compact tab rail is a real horizontal scroll container.
    const rail = page.locator("[data-site-header] [data-scroll-x]").first();
    await expect(rail).toBeVisible();
    const railOverflowX = await rail.evaluate(
      (el) => getComputedStyle(el).overflowX,
    );
    expect(["auto", "scroll"]).toContain(railOverflowX);

    // The document itself never widens, even with the rail present.
    const documentOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(documentOverflow).toBeLessThanOrEqual(1);
  });

  test("@affected mobile rail leads to Discover and the destination renders", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page
      .locator("[data-site-header]")
      .getByRole("link", { name: "Discover", exact: true })
      .first()
      .click();

    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.locator("header[data-site-header]")).toHaveCount(1);
    await expect(page.locator("main#main-content")).toHaveCount(1);
  });
});
