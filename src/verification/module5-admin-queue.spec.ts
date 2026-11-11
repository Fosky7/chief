import { test, expect } from "@playwright/test";

test("@affected admin review queue is reachable and guarded for signed-in users", async ({
  page,
}) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  test.skip(
    !email || !password,
    "setup-required: disposable E2E user credentials are not available in this environment",
  );

  await page.goto("/");

  const signInLink = page
    .getByRole("link", { name: /sign in|log in|login/i })
    .first();

  if (await signInLink.count()) {
    await signInLink.click();
  } else {
    await page.goto("/auth");
  }

  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page
    .getByRole("button", { name: /sign in|log in|login/i })
    .first()
    .click();

  await page
    .waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 15000 })
    .catch(() => undefined);

  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: /admin review queue/i }),
  ).toBeVisible();

  const nonAdminNotice = page.getByTestId("admin-non-admin");
  const adminQueue = page.getByTestId("admin-queue");

  await expect(nonAdminNotice.or(adminQueue)).toBeVisible();
});
