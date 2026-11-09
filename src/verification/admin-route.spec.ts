import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_USER_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_USER_PASSWORD;

async function signInWithDisposableAccount(page: Page): Promise<boolean> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return false;

  await page.goto("/sign-in");

  const emailInput = page.locator('input[type="email"]').first();
  if ((await emailInput.count()) === 0) return false;

  await emailInput.fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
  await page
    .getByRole("button", { name: /sign in|log in|login/i })
    .first()
    .click();

  await page.waitForLoadState("networkidle").catch(() => undefined);
  return true;
}

 test("admin review queue loads from a direct /admin address @affected", async ({
  page,
}) => {
  const signedIn = await signInWithDisposableAccount(page);
  test.skip(
    !signedIn,
    "setup-required: E2E_USER_EMAIL / E2E_USER_PASSWORD are not available for the admin review flow",
  );

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/);

  const heading = page.getByRole("heading", { name: /bills awaiting review/i });
  const adminsOnly = page.getByText(/admins only/i).first();

  await expect(heading.or(adminsOnly).first()).toBeVisible();

  const isBlocked = await adminsOnly.isVisible().catch(() => false);
  test.skip(
    isBlocked,
    "setup-required: the disposable signed-in account does not hold the admin role",
  );

  await expect(heading).toBeVisible();

  const pendingCard = page
    .getByTestId("admin-queue-bill")
    .filter({ has: page.getByRole("button", { name: /^approve$/i }) })
    .first();

  const approveButton = page
    .getByRole("button", { name: /^approve$/i })
    .first();

  const hasPendingBill = await approveButton.isVisible().catch(() => false);
  test.skip(
    !hasPendingBill,
    "setup-required: no pending bill fixture exists for the admin queue",
  );

  await expect(approveButton).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^reject$/i }).first(),
  ).toBeVisible();

  if ((await pendingCard.count()) > 0) {
    await expect(pendingCard).toBeVisible();
  }
});
