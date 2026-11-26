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


test.describe("Module 7 — Choose an amount donation sheet @affected", () => {
  test("Donate on a discover card opens the sheet with presets, Pay remaining and custom amount @affected", async ({ page }) => {
    await page.goto("/discover");
    await krossRevealHeaderControls(page);
    await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();
    const card = page.getByTestId("swipe-card").first();
    await expect(card).toBeVisible();
    await expect(card.getByTestId("raised-amount")).toContainText("₦");
    await card.getByRole("button", { name: "Donate", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Choose an amount" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦1,000", exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦5,000", exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "₦10,000", exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Pay remaining", exact: true })).toBeVisible();

    const pay = dialog.getByRole("button", { name: "Donate with Paystack" });
    await expect(pay).toBeDisabled();

    await dialog.getByRole("button", { name: "₦5,000", exact: true }).click();
    await expect(dialog.getByTestId("donate-total")).toHaveText("₦5,000");

    await dialog.getByLabel("Custom amount").fill("2500");
    await expect(dialog.getByTestId("donate-total")).toHaveText("₦2,500");
    await expect(pay).toBeEnabled();

    await dialog.getByLabel("Custom amount").fill("50");
    await expect(dialog.getByRole("alert")).toContainText("Minimum donation");
    await expect(pay).toBeDisabled();

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
  });

  test("bill detail page renders a heading without crashing @affected", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/bills/1");
    await krossRevealHeaderControls(page);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 });
    expect(errors).toEqual([]);
  });

  test("home Discover link shows a bill card with a Donate button @affected", async ({ page }) => {
    await page.goto("/");
    await krossRevealHeaderControls(page);
    await krossRevealHeaderControls(page);
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Discover" }).first().click();
    await expect(page).toHaveURL(/\/discover/);
    await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();
    await expect(
      page.getByTestId("swipe-card").first().getByRole("button", { name: "Donate", exact: true }),
    ).toBeVisible();
  });
});
