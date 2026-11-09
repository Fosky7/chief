import { test, expect } from "@playwright/test";

test.describe("Module 4 steps 2-4 repair @affected", () => {
  test("unknown bill shows not found with link back to discover @affected", async ({ page }) => {
    await page.goto("/bills/definitely-not-a-real-bill-id");
    await expect(page.getByRole("heading", { name: "Bill not found" })).toBeVisible();
    const back = page.getByRole("link", { name: /back to discover/i }).first();
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/\/discover/);
  });

  test("signed-out dashboard shows heading and sign in link @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Sign in" })).toBeVisible();
  });
});
