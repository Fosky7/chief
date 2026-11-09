import { test, expect } from "@playwright/test";

test.describe("Module 4 bill detail states @affected", () => {
  test("unknown bill shows not found with a link back @affected", async ({ page }) => {
    await page.goto("/bills/zz-unknown-bill-state-check");
    await expect(page.getByRole("heading", { name: "Bill not found" })).toBeVisible();
    const back = page.getByRole("link", { name: /back to discover/i }).first();
    await back.click();
    await expect(page).toHaveURL(/\/discover/);
  });

  test("failed bill load shows a readable error state @affected", async ({ page }) => {
    await page.route("**/rest/v1/bills**", (route) => route.abort());
    await page.goto("/bills/zz-unknown-bill-error-check");
    await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to discover/i }).first()).toBeVisible();
  });

  test("existing pages still load @affected", async ({ page }) => {
    for (const path of ["/", "/discover", "/auth", "/sign-in"]) {
      const res = await page.goto(path);
      expect(res?.status() ?? 200).toBeLessThan(400);
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});
