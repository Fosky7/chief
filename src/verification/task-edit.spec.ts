import { test, expect } from "@playwright/test";

test.describe("home page: 'Want the short version?' blurb removed", () => {
  test("blurb and its two links are gone while the rest of the CTA remains", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await expect(page.getByText("Want the short version?")).toHaveCount(0);
    await expect(page.getByText("Visit the home overview")).toHaveCount(0);
    await expect(page.getByText("See a missing page")).toHaveCount(0);
    await expect(page.getByTestId("home-cta-home-link")).toHaveCount(0);
    await expect(page.getByTestId("home-cta-not-found-link")).toHaveCount(0);

    // Neighbouring CTA content is preserved.
    await expect(page.getByText("Someone's bill could be paid today")).toBeVisible();
    await expect(page.getByTestId("home-admin-link")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to your account" })).toBeVisible();
    await expect(page.getByTestId("home-overview-link")).toBeVisible();
  });
});
