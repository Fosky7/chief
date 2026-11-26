import { test, expect } from "@playwright/test";

test("/bills/new has its own sharing details @affected", async ({ page }) => {
  await page.goto("/bills/new");
  await expect(page.getByRole("heading", { level: 1, name: "Submit a bill" })).toBeVisible();
  await expect(page).toHaveTitle("Post a new bill for review — Chief");
  await expect(page.locator('meta[name="description"]').first()).toHaveAttribute("content", /proof so Chief's team can verify/);
  await expect(page.locator('meta[property="og:title"]').first()).toHaveAttribute("content", "Post a new bill for review — Chief");
  await expect(page.locator('meta[property="og:type"]').first()).toHaveAttribute("content", "website");
  await expect(page.locator('meta[name="twitter:card"]').first()).toHaveAttribute("content", "summary_large_image");
});
