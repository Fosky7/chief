import { test, expect } from "@playwright/test";

test.describe("Module 4 — home links to swipe deck @affected", () => {
  test("clicking Start swiping opens /discover with a bill card showing Needed and Raised @affected", async ({ page }) => {
    await page.goto("/");

    const cta = page.getByText("Start swiping", { exact: true }).first();
    await expect(cta).toBeVisible();
    await cta.click();

    await expect(page).toHaveURL(/\/discover(\?|#|$)/);

    await expect(page.getByText("Needed", { exact: false }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Raised", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/₦\s?\d{1,3}(,\d{3})+/).first()).toBeVisible();
  });
});
