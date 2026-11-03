import { expect, test } from "@playwright/test";

test("unresolved recipient routes render the not-found experience @affected", async ({ page }) => {
  await page.goto("/recipients/unknown-id");

  await expect(page.locator("body")).toContainText(/not found|missing|couldn['’]t find|queue|discover|home/i);
});
