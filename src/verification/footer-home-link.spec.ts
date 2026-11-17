import { test, expect } from "@playwright/test";

test("footer Back to home link opens the welcome page @affected", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();
  const footer = page.getByRole("navigation", { name: "Footer" });
  await footer.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();
});
