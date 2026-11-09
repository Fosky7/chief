import { test, expect } from "@playwright/test";

/**
 * Module 5 — the home page entry point into the moderation workspace.
 *
 * Acceptance: on /, clicking "Admin review" opens the "Bills awaiting review"
 * heading on /admin. The link is the only element with that accessible name on
 * the home page, so a single click asserts the whole navigation flow.
 */
test.describe("Module 5 — home page admin review link @affected", () => {
  test("clicking Admin review on / opens the review heading on /admin @affected", async ({
    page,
  }) => {
    await page.goto("/");

    const adminLink = page.getByRole("link", { name: "Admin review", exact: true });
    await expect(adminLink).toBeVisible();
    await adminLink.click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();
  });
});
