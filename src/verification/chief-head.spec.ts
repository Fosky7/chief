import { test, expect } from "@playwright/test";

const routes = ["/", "/discover", "/dashboard", "/sign-in", "/signin"];

test.describe("Chief static document head @affected", () => {
  for (const path of routes) {
    test(`head has Chief favicon and meta on ${path} @affected`, async ({ page }) => {
      await page.goto(path);
      const icons = page.locator('link[rel="icon"]');
      await expect(icons).toHaveCount(1);
      await expect(icons.first()).toHaveAttribute("href", "/favicon.svg");
      await expect(icons.first()).toHaveAttribute("type", "image/svg+xml");
      await expect(page.locator('meta[name="application-name"]').first()).toHaveAttribute("content", "Chief");
      await expect(page.locator('meta[property="og:site_name"]').first()).toHaveAttribute("content", "Chief");
      await expect(page).toHaveTitle(/Chief/);
      expect(await page.title()).not.toContain("SwifePay");
    });
  }

  test("favicon.svg is served as the Chief cap @affected", async ({ request }) => {
    const res = await request.get("/favicon.svg");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("<title>Chief</title>");
  });
});
