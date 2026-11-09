import { test, expect } from "@playwright/test";

/**
 * Module 4 — the "Choose an amount" sheet opened from the deck's Give button.
 * Verifies preset selection drives the continue label and that the documented
 * ₦100 minimum is enforced for custom amounts.
 */
test.describe("Module 4 — amount sheet @affected", () => {
  test("preset selection updates the continue label @affected", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("button", { name: "Give", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "₦5,000", exact: true }).click();
    await expect(dialog.getByRole("button", { name: /Continue with ₦5,000/ })).toBeEnabled();
  });

  test("custom amount below the minimum cannot continue @affected", async ({ page }) => {
    await page.goto("/discover");
    await page.getByRole("button", { name: "Give", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();

    await dialog.getByTestId("custom-amount-input").fill("50");
    await expect(dialog.getByTestId("amount-error")).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Continue with/ })).toBeDisabled();

    await dialog.getByTestId("custom-amount-input").fill("5000");
    await expect(dialog.getByRole("button", { name: /Continue with ₦5,000/ })).toBeEnabled();
  });
});
