import { test, expect } from "@playwright/test";

/**
 * Module 5 — /admin route registration.
 *
 * The moderation workspace lives at a real URL. Loading /admin directly (a
 * deep link / full page load, not a client-side navigation) must mount the
 * review page and show its "Bills awaiting review" heading instead of the
 * app's 404 page. The body then resolves to the signed-out "Admins only" gate
 * or to the loaded queue sections.
 */
test.describe("Module 5 — /admin route registration @affected", () => {
  test("loading /admin directly mounts the review page @affected", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status() ?? 200).toBeLessThan(400);

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();

    // A missing route would render the root not-found component instead.
    await expect(page.getByRole("heading", { name: "Page not found" })).toHaveCount(0);
    await expect(page.getByText("404", { exact: true })).toHaveCount(0);

    // The queue body must resolve: the gate panel for a signed-out visitor, or
    // the real "Awaiting review" section once an admin is signed in.
    const gate = page.getByTestId("admin-gate");
    const pendingSection = page.getByRole("heading", { name: "Awaiting review" });
    await expect(gate.or(pendingSection).first()).toBeVisible({ timeout: 25_000 });
  });
});
