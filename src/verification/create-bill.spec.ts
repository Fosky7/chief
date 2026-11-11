import { test, expect } from "@playwright/test";

test("/create-bill opens the bill submission form @affected", async ({ page }) => {
  await page.goto("/create-bill");
  await expect(page).toHaveURL(/\/bills\/new$/);
  await expect(page.getByRole("heading", { name: "Submit a bill" })).toBeVisible();
  await page.getByLabel(/Amount/).first().fill("250000");
  await expect(page.getByText("₦250,000").first()).toBeVisible();
});
