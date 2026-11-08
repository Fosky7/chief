import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover deck entry point @affected", () => {
  test("clicking Discover on the home page opens the discover deck with a Skip button @affected", async ({ page }) => {
    await page.goto("/");

    const discoverLink = page.getByRole("link", { name: "Discover", exact: true }).first();
    await expect(discoverLink).toBeVisible();
    await discoverLink.click();

    await expect(page).toHaveURL(/\/discover(\?|#|$)/);
    await expect(page.getByRole("button", { name: /skip/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
