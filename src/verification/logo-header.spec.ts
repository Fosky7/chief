import { test, expect } from "@playwright/test";

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const vp of viewports) {
  for (const path of ["/", "/discover"]) {
    test(`header shows the Chief logo on ${path} at ${vp.name} width @affected`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path);
      const header = page.locator("header").first();
      await expect(header).toBeVisible();
      const logo = header.locator('svg[aria-label*="logo" i], img[alt*="logo" i]').first();
      await expect(logo).toBeVisible();
      await expect(page.getByTestId("brand-link")).toBeVisible();
    });
  }
}
