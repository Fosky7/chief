import { test, expect } from "@playwright/test";

test("@affected amount field formats naira on /bills/new", async ({ page }) => {
  await page.goto("/bills/new");

  const amount = page.getByLabel("Amount (₦)");
  // If the page asks for sign-in first, sign in through the real UI.
  if (!(await amount.isVisible({ timeout: 5000 }).catch(() => false))) {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "Disposable test account (E2E_USER_EMAIL/E2E_USER_PASSWORD) not supplied",
      });
      test.skip(true, "Sign-in required but no disposable account supplied");
      return;
    }
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    await page.goto("/bills/new");
  }

  await expect(amount).toBeVisible();
  await amount.fill("250000");

  await expect
    .poll(async () => {
      const value = await amount.inputValue().catch(() => "");
      const body = (await page.locator("body").innerText()) ?? "";
      return value.includes("₦250,000") || body.includes("₦250,000");
    })
    .toBe(true);
});
