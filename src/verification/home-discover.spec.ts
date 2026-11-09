import { test, expect } from "@playwright/test";

// Module 4 — doorway from the welcome page into the swipe deck.
test.describe("home page doorway to the swipe deck", () => {
  test("clicking Discover bills on / opens the swipe deck with a Skip button @affected", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const doorway = page.getByRole("link", { name: /discover bills/i }).first();
    await expect(doorway).toBeVisible();

    await doorway.click();

    await expect(page).toHaveURL(/\/discover\b/);

    const skip = page.getByRole("button", { name: /skip/i }).first();
    await expect(skip).toBeVisible({ timeout: 30_000 });
  });
});
