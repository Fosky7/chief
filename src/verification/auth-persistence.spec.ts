import { test, expect } from "@playwright/test";

// Auth/session layer repaired this turn: signing in through the real UI must
// persist the session (Supabase auth + profiles readback) across a reload.
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("auth session persistence", () => {
  test("signing in through the UI keeps the session after a full reload @affected @database @persistence", async ({
    page,
  }) => {
    test.skip(
      !email || !password,
      "setup-required: E2E_USER_EMAIL/E2E_USER_PASSWORD were not supplied by the runner",
    );

    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page.getByText(new RegExp(`signed in as ${email}`, "i"))).toBeVisible();

    await page.reload();

    await expect(page.getByText(new RegExp(`signed in as ${email}`, "i"))).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign out$/i })).toBeVisible();
  });
});
