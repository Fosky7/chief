import { test, expect } from "@playwright/test";

test.describe("Module 4 discover layout at phone width @affected", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("discover renders heading, card and controls without overflow @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("swipe-card")).toBeVisible();
    await expect(page.getByRole("button", { name: "Skip", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Give", exact: true })).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
