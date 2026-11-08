import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("Module 4 discover deck @affected", () => {
  test("signed-out users are redirected from /discover to /auth @affected", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForURL(/\/auth/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test("signed-out users are redirected from /dashboard to /auth @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test("signed-in user sees the discover deck or empty state @affected", async ({ page }) => {
    if (!email || !password) {
      test.info().annotations.push({ type: "setup-required", description: "E2E_USER_EMAIL/E2E_USER_PASSWORD not provided" });
      test.skip(true, "Disposable test account not configured");
    }
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/auth");
    await page.getByLabel(/email/i).first().fill(email!);
    await page.getByLabel(/password/i).first().fill(password!);
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 20_000 });

    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/discover/);
    const text = (await page.locator("body").innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/NaN/);

    for (const path of ["/dashboard", "/"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect((await page.locator("body").innerText()).trim().length).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  });
});
