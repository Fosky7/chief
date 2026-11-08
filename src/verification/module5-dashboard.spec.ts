import { test, expect } from "@playwright/test";

test("@affected signed-out visitor is redirected from /dashboard to sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/(auth|sign-?in)/);
});

test("@affected signed-in user sees dashboard list or empty state", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    test.info().annotations.push({ type: "setup-required", description: "E2E_USER_EMAIL/E2E_USER_PASSWORD not provided" });
    test.skip(true, "Disposable test account credentials not provided");
    return;
  }
  await page.goto("/auth");
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/password/i).first().fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).first().click();
  await page.waitForURL((u) => !/\/auth/.test(u.pathname), { timeout: 15000 });

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /your dashboard/i })).toBeVisible();
  const empty = page.getByTestId("dashboard-empty");
  const items = page.getByTestId("dashboard-bill");
  await expect(empty.or(items.first())).toBeVisible({ timeout: 15000 });

  if (await empty.isVisible()) {
    await empty.getByRole("link", { name: /discover/i }).click();
    await expect(page).toHaveURL(/\/discover/);
  } else {
    await expect(items.first().getByRole("progressbar")).toBeVisible();
    await expect(items.first()).toContainText(/₦|NGN/);
    await items.first().getByRole("link").click();
    await expect(page).toHaveURL(/\/bills\/[^/]+/);
  }
});
