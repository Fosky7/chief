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


/**
 * Module 9 regression guard: every page must paint real content in a real
 * browser instead of a blank screen, and the branded 404 must keep its copy.
 */
const pages = [
  "/",
  "/discover",
  "/does-not-exist",
  "/not-found",
  "/home",
  "/auth",
  "/dashboard",
  "/bills/1",
  "/bills/new",
  "/admin",
];

test.describe("Module 9 — pages paint content, not a blank screen @affected", () => {
  for (const path of pages) {
    test(`${path} renders a visible page without runtime errors @affected`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto(path);
      await krossRevealHeaderControls(page);
      await page.waitForLoadState("load").catch(() => {});

      // The shared layout (header + main) must be mounted.
      await expect(page.locator("body")).not.toBeEmpty();
      await krossRevealHeaderControls(page);
      await expect(page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).first()).toBeVisible({ timeout: 20000 });

      // Real page content: the first main heading of the page is on screen.
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20000 });

      // Module 9 deliverable: the 404 pages keep the "Page not found" copy.
      if (path === "/does-not-exist" || path === "/not-found") {
        await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible({
          timeout: 20000,
        });
      }

      // No crash on mount (a thrown render/effect error leaves a blank page).
      expect(errors).toEqual([]);
    });
  }
});
