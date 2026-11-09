import { test, expect } from "@playwright/test";

test.describe("Design system tokens @affected", () => {
  test("home renders with new brand tokens and fonts @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Pay a bill with a swipe" })).toBeVisible();

    const tokens = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        violet: root.getPropertyValue("--brand-violet").trim(),
        health: root.getPropertyValue("--cat-health").trim(),
        bodyFont: getComputedStyle(document.body).fontFamily,
      };
    });

    expect(tokens.violet).not.toBe("");
    expect(tokens.health).not.toBe("");
    expect(tokens.bodyFont).toContain("Plus Jakarta Sans");
  });
});
