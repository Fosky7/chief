import { test, expect } from "@playwright/test";

test("home 'Submit a bill' link opens the bill submission page @affected", async ({ page }) => {
  await page.goto("/");
  const link = page.getByTestId("home-submit-bill-link");
  await expect(link).toBeVisible();
  await expect(link).toHaveText("Submit a bill");
  await link.click();
  await expect(page).toHaveURL(/\/bills\/new/);
  await expect(page.getByText("Proof of bill").first()).toBeVisible();
});
