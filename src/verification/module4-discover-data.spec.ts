import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover deck data @affected", () => {
  test("top card shows a title and naira amounts with thousands separators @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByText("No bills to show right now. Check back soon.")).toHaveCount(0);

    await expect(page.getByText("Needed", { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/₦\d{1,3}(,\d{3})+/).first()).toBeVisible();

    // The top card must carry a bill title as a heading other than the page heading.
    const headings = page.getByRole("heading");
    await expect(headings.nth(1)).toBeVisible();
    await expect(headings.nth(1)).not.toHaveText("");
  });
});
