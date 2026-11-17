import { test, expect } from "@playwright/test";

test.describe("Chief static branding @affected", () => {
  test("document title says Chief and has no old brand @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Chief/);
    const title = await page.title();
    expect(title).not.toMatch(/Swi(p|f)ePay/i);
  });

  test("favicon.svg is served as an SVG cap logo @affected", async ({ request }) => {
    const res = await request.get("/favicon.svg");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("Chief");
  });

  test("navbar renders the chief cap logo @affected", async ({ page }) => {
    await page.goto("/");
    const brand = page.getByRole("link", { name: "Chief home" });
    await expect(brand).toBeVisible();
    await expect(brand.getByTestId("chief-logo").first()).toBeVisible();
  });
});
