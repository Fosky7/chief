import { test, expect } from "@playwright/test";

test.describe("Auth page @affected", () => {
  test("shows Email, Password and Sign in @affected", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
  });

  test("Create an account shows role options @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor" })).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Bill requester" }),
    ).toBeVisible();
  });

  test("sign up as Bill requester shows Account created @affected @database", async ({
    page,
  }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    const email = `e2e.requester.${Date.now()}@example.com`;
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("E2e-test-Passw0rd!");
    await page.getByRole("radio", { name: "Bill requester" }).check();
    await page.getByRole("button", { name: "Create account" }).click();

    const status = page.getByRole("status");
    const alert = page.getByRole("alert");
    await expect(status.or(alert)).toBeVisible({ timeout: 20_000 });

    if (await alert.isVisible()) {
      const text = (await alert.textContent()) ?? "";
      if (/rate limit|too many|not authorized|signups not allowed/i.test(text)) {
        test.info().annotations.push({
          type: "setup-required",
          description: `Backend refused disposable sign up: ${text}`,
        });
        test.skip(true, "Backend sign up throttled or disabled for test emails");
      }
    }

    await expect(status).toContainText("Account created");
  });

  test("invalid password shows Invalid login credentials @affected", async ({
    page,
  }) => {
    await page.goto("/auth");
    const email =
      process.env.E2E_USER_EMAIL ?? `e2e.nobody.${Date.now()}@example.com`;
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("definitely-wrong-password-123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "Invalid login credentials",
      { timeout: 20_000 },
    );
  });

  test("after signing in the nav shows Sign out @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL / E2E_USER_PASSWORD not provided",
      });
      test.skip(true, "Disposable test account credentials not supplied");
      return;
    }
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: "Sign out" }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
