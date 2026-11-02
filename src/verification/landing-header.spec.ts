import { test, expect } from "@playwright/test";

/**
 * Real browser verification for the home page and shared header.
 * These specs exercise the UI; they never import app modules.
 */

test.describe("@affected landing page and header", () => {
  test("@affected home shows the hero, steps and inline logo beside the app name", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Swipe right to pay a bill",
        level: 1,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "How it works" }),
    ).toBeVisible();

    const lockup = page.locator("[data-brand-lockup]").first();
    await expect(lockup).toBeVisible();
    await expect(lockup.locator("[data-header-logo]")).toBeVisible();
    await expect(lockup).toContainText("Chief");

    const logoBox = await lockup.locator("[data-header-logo]").boundingBox();
    const nameBox = await lockup.getByText("Chief", { exact: true }).boundingBox();

    expect(logoBox).not.toBeNull();
    expect(nameBox).not.toBeNull();

    if (logoBox && nameBox) {
      expect(logoBox.x).toBeLessThan(nameBox.x);
    }
  });

  test("@affected start swiping reveals verified requests and open the deck", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Start swiping" }).click();

    await expect(
      page.getByRole("heading", { name: "Verified requests" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open the deck" }),
    ).toBeVisible();
    await expect(page.locator("#verified-requests")).toBeInViewport();
  });

  test("@affected mobile header keeps the brand row and scroll rail in the viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    await expect(page.locator("[data-site-header]")).toBeVisible();
    await expect(
      page.locator("[data-header-brand-row] [data-brand-lockup]"),
    ).toBeVisible();
    await expect(page.locator("[data-header-rail-row]")).toBeVisible();

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );

    expect(horizontalOverflow).toBeLessThanOrEqual(1);
  });
});
