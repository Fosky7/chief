import { test, expect } from "@playwright/test";

test.describe("Module 4 step 4 — home links to discover deck @affected", () => {
  test("clicking Start giving opens /discover with a Needed card @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Start giving", { exact: true }).first().click();
    await expect(page).toHaveURL(/\/discover(\?|#|$)/, { timeout: 15_000 });
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText("Needed", { exact: true })).toBeVisible();
  });

  test("clicking Discover in the navigation opens /discover showing Skip @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Discover", exact: true }).first().click();
    await expect(page).toHaveURL(/\/discover(\?|#|$)/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Skip/ }).first()).toBeVisible({ timeout: 15_000 });
  });
});
