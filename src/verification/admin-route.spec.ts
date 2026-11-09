import { test, expect, type Page } from "@playwright/test";

/**
 * Module 5 — Admin review & approval queue.
 *
 * Flow under test: loading `/admin` directly must either show the review queue
 * ("Bills awaiting review" + pending bill card) for an admin, or gate the
 * visitor away from the queue entirely.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? process.env.E2E_USER_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? process.env.E2E_USER_PASSWORD;

async function signIn(page: Page, email: string, password: string): Promise<boolean> {
  for (const path of ["/signin", "/sign-in", "/auth", "/login"]) {
    await page.goto(path);
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if ((await emailInput.count()) === 0) continue;

    await emailInput.fill(email);
    const passwordInput = page.locator('input[type="password"]').first();
    if ((await passwordInput.count()) === 0) continue;
    await passwordInput.fill(password);

    await page
      .getByRole("button", { name: /sign in|log in|login|continue/i })
      .first()
      .click();
    await page.waitForLoadState("networkidle");
    return true;
  }
  return false;
}

test("signed-out visitor cannot see the admin review queue @affected", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("button", { name: /^approve$/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^reject$/i })).toHaveCount(0);

  const gate = page
    .getByText(/admins only|sign in|log in|unauthori[sz]ed|access denied/i)
    .first();
  await expect(gate).toBeVisible();
});

test("admin sees the pending review queue on direct /admin load @affected", async ({ page }) => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "setup-required: no admin credentials supplied (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD) for the admin review queue flow",
  );

  const signedIn = await signIn(page, ADMIN_EMAIL as string, ADMIN_PASSWORD as string);
  test.skip(
    !signedIn,
    "setup-required: the app's sign-in form could not be located to establish an admin session",
  );

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: /bills awaiting review/i }),
  ).toBeVisible();

  const firstCard = page
    .getByText(/pending review/i)
    .first()
    .locator("xpath=ancestor::*[self::li or self::article or self::div][1]");

  await expect(page.getByText(/pending review/i).first()).toBeVisible();
  await expect(firstCard.getByRole("button", { name: /^approve$/i }).first()).toBeVisible();
  await expect(firstCard.getByRole("button", { name: /^reject$/i }).first()).toBeVisible();
});
