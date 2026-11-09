import { test, expect } from "@playwright/test";

test.describe("admin review route", () => {
  test("direct load of /admin shows the review queue @affected", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    // The route must be registered so a direct visit renders the admin review page
    // instead of a not-found screen.
    await expect(
      page.getByRole("heading", { name: /bills awaiting review/i })
    ).toBeVisible({ timeout: 15000 });

    await expect(page.getByText(/admin review/i).first()).toBeVisible();
  });
});
