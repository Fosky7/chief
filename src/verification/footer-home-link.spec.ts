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


test("footer Back to home link opens the welcome page @affected", async ({ page }) => {
  await page.goto("/discover");
  await krossRevealHeaderControls(page);
  await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();
  const footer = page.getByRole("navigation", { name: "Footer" });
  await footer.getByRole("link", { name: "Back to home" }).click();
  await expect(page).toHaveURL(/\/(?:[?#].*)?$/);
  await expect(page.getByRole("heading", { level: 1, name: "Pay a bill with a swipe" })).toBeVisible();
});
