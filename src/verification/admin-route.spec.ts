import { test, expect } from "@playwright/test";

test.describe("@affected admin route registration", () => {
  test("direct load of /admin shows the review queue heading", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    if (!email || !password) {
      test.skip(
        true,
        "type: setup-required — E2E_USER_EMAIL / E2E_USER_PASSWORD disposable accounts were not supplied by the runner",
      );
      return;
    }

    // Sign in through the real UI so the admin gate can be evaluated.
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForLoadState("networkidle");

    // Load the address directly (no client-side navigation) to prove the
    // /admin route is registered in the router's route tree.
    const response = await page.goto("/admin");
    expect(response?.status() ?? 200).toBeLessThan(400);

    const gate = page.getByText(/admins only/i);
    if (await gate.isVisible().catch(() => false)) {
      test.skip(
        true,
        "type: setup-required — the supplied disposable account is not an admin in this environment, so the review queue cannot be opened",
      );
      return;
    }

    await expect(
      page.getByRole("heading", { name: /bills awaiting review/i }),
    ).toBeVisible();

    // A pending bill card must be present in the queue.
    await expect(page.getByText(/pending review/i).first()).toBeVisible();
  });
});
