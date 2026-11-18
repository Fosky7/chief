import { test, expect } from "@playwright/test";

test.describe("Module 7 — Choose an amount sheet @affected", () => {
  test("donate sheet shows presets, pay remaining and custom amount preview @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    await page.getByRole("button", { name: "Donate", exact: true }).first().click();
    const sheet = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(sheet).toBeVisible();

    await expect(sheet.getByRole("button", { name: "₦1,000", exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "₦5,000", exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "₦10,000", exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Pay remaining", exact: true })).toBeVisible();

    await sheet.getByLabel("Custom amount").fill("2500");
    await expect(sheet.getByTestId("donate-chosen-amount")).toHaveText("₦2,500");
  });
});
