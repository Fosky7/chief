import { expect, test } from "@playwright/test";

/**
 * Module 5 — admin review queue authorization gate.
 *
 * Flow under test: a visitor who is NOT an administrator opens /admin and must
 * see the "Admins only" gate with no moderation controls. The review page is
 * loaded directly (not through the home-page link) so this covers the route
 * registration as well.
 */
test.describe("Module 5 — admin queue gate @affected", () => {
  test("non-admin visitor sees Admins only and no Approve button on /admin", async ({ page }) => {
    await page.goto("/admin");

    // The page renders its heading for every visitor, admin or not.
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();

    // Signed-out visitor: gate message only, never the moderation controls.
    await expect(page.getByText("Admins only", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reject", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mark paid to biller", exact: true })).toHaveCount(
      0,
    );
    await expect(page.getByTestId("admin-queue-card")).toHaveCount(0);
  });
});
