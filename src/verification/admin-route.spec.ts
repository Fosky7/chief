import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test("admin review queue is reachable by direct URL at /admin @affected", async ({ page }) => {
  test.skip(
    !email || !password,
    "setup-required: E2E_USER_EMAIL / E2E_USER_PASSWORD are not available in this run.",
  );

  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  // Sign in through the real UI so the session is established by the app.
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Load /admin by address directly (not via in-app navigation).
  await page.goto("/admin");

  const heading = page.getByRole("heading", { name: /bills awaiting review/i });
  const denied = page.getByText(/admins only/i);

  await expect(heading.or(denied)).toBeVisible({ timeout: 15000 });

  if (await denied.isVisible()) {
    test.info().annotations.push({
      type: "setup-required",
      description:
        "The disposable E2E account does not have the admin role, so the populated queue cannot be asserted in this run.",
    });
    test.skip(true, "Disposable E2E account is not an admin; access-denied state rendered instead.");
  }

  await expect(heading).toBeVisible();

  // Either persisted pending bills are rendered as cards, or the queue is
  // genuinely empty and its empty state is shown.
  const pendingCard = page.getByText(/pending review/i).first();
  const emptyState = page.getByText(/no bills awaiting review|queue is empty/i).first();
  await expect(pendingCard.or(emptyState)).toBeVisible({ timeout: 15000 });

  expect(consoleErrors, `console errors on /admin: ${consoleErrors.join(" | ")}`).toEqual([]);
});
