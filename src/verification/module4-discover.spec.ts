import { expect, test } from "@playwright/test";

test.describe("Module 4 — discover deck amounts @affected", () => {
  test("top card shows Needed and Raised in naira with separators @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover", exact: true })).toBeVisible();

    await expect(page.getByText("Needed", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Raised", { exact: true }).first()).toBeVisible();

    // At least one naira amount on the top card uses a thousands separator.
    const amount = page.getByText(/₦\d{1,3}(,\d{3})+/).first();
    await expect(amount).toBeVisible();
    await expect(amount).toHaveText(/₦\d{1,3}(,\d{3})+/);
  });
});
