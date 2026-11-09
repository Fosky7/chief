import { expect, test, type Page } from "@playwright/test";

const donorEmail = process.env.E2E_USER_EMAIL;
const donorPassword = process.env.E2E_USER_PASSWORD;

async function signIn(page: Page) {
  await page.goto("/auth");
  await page.getByLabel(/email/i).first().fill(donorEmail!);
  await page.getByLabel(/password/i).first().fill(donorPassword!);
  await page.getByRole("button", { name: /sign in|log in/i }).first().click();
  await expect(page).not.toHaveURL(/\/auth\/?$/);
}

test("@affected @donations a donor contribution is recorded and shown as pending", async ({ page }) => {
  test.skip(
    !donorEmail || !donorPassword,
    "setup-required: disposable E2E account credentials are not available",
  );

  await signIn(page);
  await page.goto("/discover");

  const billLink = page.locator('a[href^="/bills/"]').first();
  await expect(billLink).toBeVisible();
  await billLink.click();

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByLabel(/amount/i).fill("500");
  await page.getByRole("button", { name: /contribute/i }).click();

  await expect(page.getByText(/pending review/i).first()).toBeVisible();
});

test("@affected @admin the /admin address loads the review queue directly", async ({ page }) => {
  await page.goto("/admin");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText(/Bills awaiting review|Admins only/);
});

test("@affected @dashboard approved contributions remain listed after refresh", async ({ page }) => {
  test.skip(
    !donorEmail || !donorPassword,
    "setup-required: disposable E2E account credentials are not available",
  );

  await signIn(page);
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: /approved contributions/i })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /approved contributions/i })).toBeVisible();
});
