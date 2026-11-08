import { test, expect } from "@playwright/test";

test.describe("Module 4 approved bills deck @affected", () => {
  test("discover deck shows a bill card with Needed amount @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByText("Needed").first()).toBeVisible({ timeout: 15000 });
  });

  test("top card Raised amount shows the Naira symbol @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByText("Raised").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/₦\s?[\d,]+/).first()).toBeVisible();
  });
});
