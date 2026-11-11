import { test, expect } from "@playwright/test";

/**
 * The shared app shell must render a real, labelled logo inside <header> on
 * every route (all routes render through the root Layout / NavBar).
 */
test("@affected shared header shows the Chief logo on / and /auth at phone and desktop widths", async ({
  page,
}) => {
  const cases = [
    { path: "/", width: 390 },
    { path: "/auth", width: 390 },
    { path: "/", width: 1280 },
    { path: "/auth", width: 1280 },
  ];

  for (const { path, width } of cases) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);

    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    const logo = header
      .locator('svg[aria-label*="logo" i], img[alt*="logo" i]')
      .first();
    await expect(logo).toBeVisible();
  }
});
