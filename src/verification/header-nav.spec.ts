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


test.describe("Redesigned header @affected", () => {
  test("header stays visible after scrolling on /discover and Discover is current", async ({ page }) => {
    await page.goto("/discover");
    await krossRevealHeaderControls(page);
    await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main" });
    const discover = nav.getByRole("link", { name: "Discover" });
    await expect(discover).toHaveAttribute("aria-current", "page");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(discover).toBeInViewport();
  });

  test("New bill button opens /bills/new and signed-out header shows Sign in", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    await krossRevealInMenu(page, nav.getByRole("link", { name: "Sign in" }));
    await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
    await nav.getByRole("link", { name: "New bill" }).click();
    await expect(page).toHaveURL(/\/bills\/new(?:[?#].*)?$/);
  });

  test("signed-in user menu shows Dashboard and Sign out; non-admin has no Admin link", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({ type: "setup-required", description: "E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied" });
      test.skip(true, "Disposable test account not supplied");
      return;
    }
    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/(?:[?#].*)?$/);

    await page.goto("/dashboard");
    await krossRevealHeaderControls(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    const menuButton = nav.getByRole("button", { name: "Account menu" });
    await expect(menuButton).toBeVisible();
    await expect(nav.getByRole("link", { name: "Admin" })).toHaveCount(0);

    await menuButton.click();
    const menu = page.getByTestId("user-menu");
    await expect(menu.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await menu.getByRole("button", { name: "Sign out" }).click();
    await krossRevealInMenu(page, nav.getByRole("link", { name: "Sign in" }));
    await expect(nav.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  });

  test("admin account sees Admin link in header", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({ type: "setup-required", description: "E2E_USER_EMAIL/E2E_USER_PASSWORD not supplied" });
      test.skip(true, "Disposable test account not supplied");
      return;
    }

    // UI-level role check: the header decides whether to render the Admin link
    // from the signed-in user's profile role. We sign in for real, then answer
    // the read-only profile lookup with role "admin" so the header's admin
    // rendering is exercised. No writes happen and server-side access rules are
    // untouched (this does not grant any real privileges).
    let userId: string | null = null;
    await page.route("**/rest/v1/profiles*", async (route) => {
      const req = route.request();
      if (req.method() !== "GET") return route.continue();
      const m = /id=eq\.([0-9a-f-]+)/i.exec(req.url());
      const id = m?.[1] ?? userId ?? "unknown";
      const row = { id, role: "admin", email };
      const accept = (req.headers()["accept"] ?? "").toLowerCase();
      const body = accept.includes("vnd.pgrst.object") ? row : [row];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });

    await page.goto("/auth");
    await krossRevealHeaderControls(page);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/(?:[?#].*)?$/);

    await page.goto("/dashboard");
    await krossRevealHeaderControls(page);
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Account menu" })).toBeVisible();
    const adminLink = nav.getByRole("link", { name: "Admin" });
    await krossRevealInMenu(page, adminLink);
    await expect(adminLink).toBeVisible({ timeout: 15000 });
    await adminLink.click();
    await expect(page).toHaveURL(/\/admin(?:[?#].*)?$/);
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
