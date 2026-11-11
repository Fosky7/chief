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

  // The home page keeps its branded hero and its primary calls to action.
  await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start swiping", exact: true })).toBeVisible();
  await expect(page.getByTestId("brand-link")).toBeVisible();

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

  await expect(page.getByTestId("admin-page")).toBeVisible();
  await expect(nonAdminNotice.or(adminQueue).first()).toBeVisible();
});
