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


test.describe("Module 1 — welcome page & navigation", () => {
  test("hero heading shows the tagline @affected", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();
  });

  test("Start swiping opens Discover bills @affected", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    await page.getByRole("link", { name: "Start swiping" }).click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.locator("main").getByText("Discover bills").first()).toBeVisible();
  });

  test("Post a bill opens Sign in @affected", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    await page.getByRole("link", { name: "Post a bill" }).click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator("main").getByText(/sign in/i).first()).toBeVisible();
  });

  test("navigation bar shows Discover, Dashboard and Sign in @affected", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    await krossRevealInMenu(page, nav.getByRole("link", { name: "Discover" }).first());
    await expect(nav.getByRole("link", { name: "Discover" }).first()).toBeVisible();
    await krossRevealInMenu(page, nav.getByRole("link", { name: "Dashboard" }).first());
    await expect(nav.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
    await krossRevealInMenu(page, nav.getByRole("link", { name: "Sign in" }).first());
    await expect(nav.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });

  test("sample stats show a naira amount @affected", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    const stats = page.getByRole("region").first();
    await expect(stats.getByText("₦1,000,000")).toBeVisible();
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
