import { test, expect } from "@playwright/test";
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


test.describe("Module 2 — session in navigation @affected", () => {
  test("signing in shows Sign out in the nav, signing out restores Sign in @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "Disposable account credentials (E2E_USER_EMAIL / E2E_USER_PASSWORD) are not configured.",
      });
    }
    test.skip(!email || !password, "Disposable test account credentials are not configured.");

    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await page.getByLabel("Email", { exact: true }).fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/(?:[?#].*)?$/);
    const nav = page.getByRole("navigation", { name: "Main" });
    const signOut = nav.getByRole("button", { name: "Sign out", exact: true });
    await krossRevealInMenu(page, signOut);
    await expect(signOut).toBeVisible({ timeout: 15_000 });

    // Session persists across reload.
    await page.reload();
    await krossRevealHeaderControls(page);
    await krossRevealInMenu(page, nav.getByRole("button", { name: "Sign out", exact: true }));
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toBeVisible({ timeout: 15_000 });

    await nav.getByRole("button", { name: "Sign out", exact: true }).click();
    await krossRevealInMenu(page, nav.getByRole("link", { name: "Sign in" }));
    await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible({ timeout: 15_000 });
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
