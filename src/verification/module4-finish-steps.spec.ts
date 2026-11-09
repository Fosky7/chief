import { test, expect } from "@playwright/test";

test.describe("Module 4 finish steps 2-4 @affected", () => {
  test("signed-out dashboard shows heading and sign-in prompt, nav has no Sign out @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign out/i })).toHaveCount(0);
  });

  test("unknown bill shows not-found message with link back to discover @affected", async ({ page }) => {
    await page.goto("/bills/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/not found/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /discover/i }).first()).toBeVisible();
  });

  test("existing pages still load @affected", async ({ page }) => {
    for (const path of ["/", "/discover", "/sign-in"]) {
      const res = await page.goto(path);
      expect(res?.status() ?? 200).toBeLessThan(400);
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});
