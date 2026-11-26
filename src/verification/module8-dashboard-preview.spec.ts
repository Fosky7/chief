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


test.describe("Module 8 — dashboard preview @affected", () => {
  test("signed-out dashboard shows My bills statuses, My donations and ₦ totals @affected", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    await krossRevealHeaderControls(page);
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId("dashboard-signed-out")).toBeVisible();
    await expect(page.getByRole("heading", { name: "My bills" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My donations" })).toBeVisible();
    await expect(page.getByTestId("bill-status").filter({ hasText: "Pending review" }).first()).toBeVisible();
    await expect(page.getByTestId("bill-status").filter({ hasText: "Approved" }).first()).toBeVisible();
    await expect(page.getByText("Total given")).toBeVisible();
    await expect(page.getByText("Total raised")).toBeVisible();
    await expect(page.getByTestId("total-given")).toContainText("₦");
    await expect(page.getByTestId("total-raised")).toContainText("₦");
    await expect(page.getByTestId("donation-amount").first()).toContainText("₦");

    await page.getByTestId("my-bill-link").first().click();
    await expect(page).toHaveURL(/\/bills\//);
    await expect(page.getByText("Story").first()).toBeVisible();
  });
});
