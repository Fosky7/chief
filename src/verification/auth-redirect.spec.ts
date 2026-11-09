import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_USER_EMAIL ?? "";
const PASSWORD = process.env.E2E_USER_PASSWORD ?? "";

test.describe("authentication guard", () => {
  test("signed-out visitor is redirected away from protected routes @affected", async ({ page }) => {
    await page.goto("/discover");

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.locator("form")).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole("button", { name: /^approve$/i })).toHaveCount(0);

    await page.goto("/discover");
    await page.goto("/bills/seed-clinic-solar");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-in rejects bad credentials then lands on discover @affected", async ({ page }) => {
    test.skip(
      !EMAIL || !PASSWORD,
      "setup-required: E2E_USER_EMAIL / E2E_USER_PASSWORD were not supplied for this run",
    );

    await page.goto("/sign-in");

    await page.getByLabel("Email").fill(`invalid-${EMAIL}`);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);

    const storedSessions = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((key) => key.includes("auth-token")),
    );
    expect(storedSessions).toHaveLength(0);

    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("heading", { name: /discover bills/i })).toBeVisible();
  });
});
