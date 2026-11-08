import { test, expect } from "@playwright/test";

test.describe("Module 4 — Naira formatting & progress @affected", () => {
  test("home stats render ₦ with thousands separators @affected", async ({ page }) => {
    await page.goto("/");
    const stats = page.getByRole("region", { name: "Sample stats" });
    await expect(stats.getByText("₦1,000,000", { exact: true })).toBeVisible();
    await expect(page.getByText("of ₦250,000").first()).toBeVisible();
  });

  test("discover shows ₦ amounts and an accessible progress bar @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByText(/₦\d{1,3}(,\d{3})+/).first()).toBeVisible();
    const bar = page.getByRole("progressbar").first();
    await expect(bar).toBeVisible();
    const now = Number(await bar.getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);
  });
});
