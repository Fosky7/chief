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


test.describe("Module 2 — navigation auth state @affected", () => {
  test("signed-out nav Sign in opens the /auth form", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
    await nav.getByRole("link", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/auth(?:[?#].*)?$/);
    await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("failed sign in keeps the visitor signed out", async ({ page }) => {
    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await page.getByLabel("Email", { exact: true }).fill(`nobody-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("WrongPassword!123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
    const nav = page.getByRole("navigation", { name: "Main" });
    await krossRevealInMenu(page, nav.getByRole("link", { name: "Sign in" }));
    await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
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
