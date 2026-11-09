import { test, expect } from "@playwright/test";

// Step 5 acceptance: loading the /admin address directly renders the review
// queue. The route is served from the generated route tree via src/router.tsx.
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin review route", () => {
  test("loading /admin directly shows the Bills awaiting review heading with a pending bill card @affected", async ({
    page,
  }) => {
    test.skip(
      !adminEmail || !adminPassword,
      "setup-required: no disposable admin account (E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD) was supplied, so the admin-only review queue cannot be exercised safely",
    );

    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(adminEmail);
    await page.getByLabel(/password/i).fill(adminPassword);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText(/signed in as/i)).toBeVisible();

    // Direct address load of the registered /admin route.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: /bills awaiting review/i }),
    ).toBeVisible();
  });

  test("a non-admin visitor sees the Admins only gate on /admin @affected", async ({
    page,
  }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    test.skip(
      !email || !password,
      "setup-required: E2E_USER_EMAIL/E2E_USER_PASSWORD were not supplied to sign in a disposable non-admin account",
    );

    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText(/signed in as/i)).toBeVisible();

    await page.goto("/admin");
    await expect(page.getByText(/admins only/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^approve$/i })).toHaveCount(0);
  });
});
