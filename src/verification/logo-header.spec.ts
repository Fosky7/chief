import { test, expect } from "@playwright/test";

const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
];

async function expectHeaderLogo(page: import("@playwright/test").Page) {
  const header = page.locator("header").first();
  await expect(header).toBeVisible();
  const logo = header.locator('svg[aria-label*="logo" i], img[alt*="logo" i]').first();
  await expect(logo).toBeVisible();
}

test("home page header shows the Chief logo at phone and desktop widths @affected", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Chief home" })).toBeVisible();
    await expectHeaderLogo(page);
  }
});

test("auth page header shows the Chief logo at phone and desktop widths @affected", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/auth");
    await expect(page.getByRole("link", { name: "Chief home" })).toBeVisible();
    await expectHeaderLogo(page);
  }
});
