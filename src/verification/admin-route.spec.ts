import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("@affected admin review route", () => {
  test("loading /admin directly renders the review queue", async ({ page }) => {
    test.skip(
      !email || !password,
      "setup-required: E2E user credentials (E2E_USER_EMAIL / E2E_USER_PASSWORD) are not available"
    );

    await page.goto("/sign-in");
    await page.locator('input[type="email"]').fill(email as string);
    await page.locator('input[type="password"]').fill(password as string);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Direct address load of the admin review queue.
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: /bills awaiting review/i })
    ).toBeVisible();
  });
});
