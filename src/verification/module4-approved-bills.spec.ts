import { test, expect } from "@playwright/test";

test.describe("Module 4 — approved bills data @affected", () => {
  test("/discover shows at least one bill containing Needed @affected", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByText(/Needed/).first()).toBeVisible();
    await expect(page.getByText(/₦\d{1,3}(,\d{3})+/).first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
