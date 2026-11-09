import { test, expect } from "@playwright/test";

const nairaPattern = /₦\d{1,3}(,\d{3})+/;

test.describe("Module 4 — discover deck data & naira formatting @affected", () => {
  test("top card shows Needed amount as ₦ with thousands separators @affected", async ({ page }) => {
    await page.goto("/discover");
    const needed = page.getByText("Needed", { exact: false }).first();
    await expect(needed).toBeVisible({ timeout: 15_000 });
    const card = page.locator("article, [data-testid='swipe-card']").first();
    await expect(card).toContainText(nairaPattern);
  });

  test("top card shows Raised amount as ₦ with thousands separators @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByText("Raised", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(nairaPattern).first()).toBeVisible();
  });
});
