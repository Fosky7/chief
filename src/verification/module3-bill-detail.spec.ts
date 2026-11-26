import { test, expect } from "@playwright/test";

test.describe("Module 3 — bill detail page @affected", () => {


  test("Donate opens Choose an amount @affected", async ({ page }) => {
    await page.goto("/bills/single-mum-rent");
    await page.getByRole("button", { name: "Donate", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "₦10,000" }).click();
    await expect(dialog.getByRole("button", { name: /Continue to Paystack · ₦10,000/ })).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
  });


  test("unknown bill shows Bill not found @affected", async ({ page }) => {
    await page.goto("/bills/does-not-exist");
    await expect(page.getByRole("heading", { name: "Bill not found" })).toBeVisible();
  });
});
