import { test, expect } from "@playwright/test";

test("swipe card shows naira-formatted amounts and funding progress @affected", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByTestId("swipe-card")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("swipe-card-raised")).toHaveText(/^₦[\d,]+ raised$/);
  await expect(page.getByTestId("swipe-card-goal")).toHaveText(/^of ₦[\d,]+$/);
  const bar = page.getByRole("progressbar").first();
  await expect(bar).toBeVisible();
  const v = Number(await bar.getAttribute("aria-valuenow"));
  expect(v).toBeGreaterThanOrEqual(0);
  expect(v).toBeLessThanOrEqual(100);
});
