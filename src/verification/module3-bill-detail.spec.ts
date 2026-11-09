import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

async function signIn(page: Page) {
  await page.goto("/auth");
  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 20000 });
  await emailInput.fill(EMAIL as string);
  await page.locator('input[type="password"]').first().fill(PASSWORD as string);
  await page.getByRole("button", { name: /sign in|log in|login/i }).first().click();
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 20000 })
    .not.toContain("/auth");
}

test(
  "bill detail sends signed-out visitors to sign in and returns them to the bill",
  { tag: "@affected" },
  async ({ page, context }) => {
    test.skip(
      !EMAIL || !PASSWORD,
      "setup-required: E2E_USER_EMAIL/E2E_USER_PASSWORD are not available for a disposable account",
    );

    await context.clearCookies();
    const target = "/bills/00000000-0000-0000-0000-000000000000";

    await page.goto(target);
    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 20000 })
      .toContain("/auth");
    await expect(page.locator('input[type="email"]').first()).toBeVisible();

    await page.locator('input[type="email"]').first().fill(EMAIL as string);
    await page.locator('input[type="password"]').first().fill(PASSWORD as string);
    await page.getByRole("button", { name: /sign in|log in|login/i }).first().click();

    await expect
      .poll(() => new URL(page.url()).pathname, { timeout: 20000 })
      .toContain("/bills/");
  },
);

test(
  "approved bill detail renders stored bill data and donation progress",
  { tag: "@affected" },
  async ({ page }) => {
    test.skip(
      !EMAIL || !PASSWORD,
      "setup-required: E2E_USER_EMAIL/E2E_USER_PASSWORD are not available for a disposable account",
    );

    await signIn(page);
    await page.goto("/discover");

    const firstBill = page.locator('a[href^="/bills/"]').first();
    if ((await firstBill.count()) === 0) {
      test.skip(true, "setup-required: no approved bill is available in the discover feed");
      return;
    }

    const href = await firstBill.getAttribute("href");
    await page.goto(href as string);

    await expect(page.getByTestId("bill-title")).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("bill-chamber")).toBeVisible();
    await expect(page.getByTestId("bill-sponsor")).toBeVisible();
    await expect(page.getByTestId("bill-status")).toBeVisible();
    await expect(page.getByTestId("bill-summary")).toBeVisible();
    await expect(page.getByTestId("bill-progress")).toBeVisible();
    await expect(page.getByTestId("bill-raised")).toContainText(/[0-9]/);
  },
);
