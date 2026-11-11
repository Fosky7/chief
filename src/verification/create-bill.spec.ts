import { test, expect } from "@playwright/test";

test("create-bill alias shows the Proof of bill field @affected", async ({ page }) => {
  await page.goto("/create-bill");
  await expect(page).toHaveURL(/\/bills\/new/);
  await expect(page.getByText("Proof of bill").first()).toBeVisible();
});
