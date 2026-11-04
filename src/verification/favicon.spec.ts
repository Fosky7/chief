import { test, expect } from "@playwright/test";

// Head tags (title, icon link) are declared statically in index.html.
test.describe("Chief document shell & favicon @affected", () => {
  test("document title uses Chief, not SwipePay @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Chief/);
    const title = await page.title();
    expect(title).not.toMatch(/Swi(p|f)ePay/i);
  });

  test("favicon link points to the chief cap SVG and it is served @affected", async ({ page }) => {
    await page.goto("/");
    const icon = page.locator('link[rel="icon"][href="/favicon.svg"]').first();
    await expect(icon).toHaveAttribute("type", "image/svg+xml");
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);

    const res = await page.request.get("/favicon.svg");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("<title>Chief</title>");
  });

  test("favicon link is present on discover too @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"][href="/favicon.svg"]').first()).toHaveAttribute("type", "image/svg+xml");
  });

  test("no legacy brand name anywhere in the rendered page @affected", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Chief home" })).toBeVisible();
    const html = await page.content();
    expect(html).not.toMatch(/Swi(p|f)ePay/i);
  });
});
