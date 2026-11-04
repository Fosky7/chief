import { test, expect } from "@playwright/test";

test.describe("theme config @affected", () => {
  test("home page renders with brand typography @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Pay a bill with a swipe/i })).toBeVisible();
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont).toContain("Plus Jakarta Sans");
  });

  test("dashboard renders heading and brand gradient @affected", async ({ page }) => {
    await page.goto("/dashboard");
    const heading = page.getByRole("heading", { name: "Dashboard" });
    await expect(heading).toBeVisible();
    const headingFont = await heading.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(headingFont).toContain("Fraunces");
    const eyebrow = page.locator(".text-brand-gradient").first();
    await expect(eyebrow).toBeVisible();
    const bg = await eyebrow.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain("linear-gradient");
  });
});
