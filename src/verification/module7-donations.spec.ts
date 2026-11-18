import { test, expect } from "@playwright/test";

// Module 7 step 1 is a database-only change (donation columns + realtime).
// The payment flow itself is wired in later steps; real payments are never sent from tests.
test("discover page still renders after donations realtime migration @affected", async ({ page }) => {
  await page.goto("/discover");
  await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();
});
