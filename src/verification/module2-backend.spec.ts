import { expect, test } from "@playwright/test";
async function krossRevealHeaderControls(page: any) { // kross-reveal-v3
  const toggle = page.getByRole('button', { name: /open menu|toggle menu|navigation menu|main menu|account menu|user menu|menu/i }).filter({ visible: true }).first();
  // The control may render after navigation; wait for it instead of skipping the menu.
  await toggle.waitFor({ state: 'visible', timeout: 8000 }).catch(() => undefined);
  if (!(await toggle.isVisible().catch(() => false))) return;
  await page.waitForLoadState('networkidle').catch(() => undefined);
  for (let i = 0; i < 4; i++) {
    const state = await toggle.getAttribute('aria-expanded').catch(() => null);
    if (state === 'true' || state === null && i > 0) return;
    await toggle.click().catch(() => undefined);
    await page.waitForTimeout(300 * (i + 1));
  }
}


test.describe("@affected Module 2 — backend wiring", () => {
  test("auth page renders without configuration crash and keeps role choice", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await expect(page.getByRole("radio", { name: "Bill requester", exact: true })).toBeChecked();

    expect(errors.filter((m) => m.includes("not configured"))).toEqual([]);
  });

  test("invalid sign in shows Invalid login credentials", async ({ page }) => {
    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await page.getByLabel("Email", { exact: true }).fill(`nobody-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("not-the-right-password-1");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
  });

  test("@database @persistence bill requester sign up shows Account created", async ({ page }) => {
    const base = process.env.E2E_USER_EMAIL;
    if (!base || !base.includes("@")) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL is needed to derive a disposable plus-addressed sign-up email.",
      });
      test.skip(true, "Disposable sign-up email base not configured");
      return;
    }
    const [local, domain] = base.split("@");
    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(`${local}+m2${Date.now()}@${domain}`);
    await page.getByLabel("Password", { exact: true }).fill("Chief-M2-pass-2048!");
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({ timeout: 15_000 });
  });

  test("signed in user sees Sign out in the nav", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account required.",
      });
      test.skip(true, "Disposable test account not configured");
      return;
    }
    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/(?:[?#].*)?$/, { timeout: 15_000 });
    const nav = page.getByRole("navigation", { name: "Main" });
    await krossRevealInMenu(page, nav.getByRole("button", { name: "Sign out", exact: true }));
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toBeVisible({ timeout: 15_000 });
  });
});

// Added by KrossBuild: the app keeps its top-bar links inside a menu, so open it
// when a link is not already visible.
async function krossRevealInMenu(page: any, target: any) {
  if (await target.isVisible().catch(() => false)) return;
  const toggle = page.locator('header button[aria-expanded="false"], [role="banner"] button[aria-expanded="false"]').first();
  if (await toggle.count().catch(() => 0)) {
    await toggle.click().catch(() => {});
    await target.waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  }
}
