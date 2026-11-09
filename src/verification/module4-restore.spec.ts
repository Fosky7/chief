import { expect, test } from "@playwright/test";

test.describe("Module 4 restore @affected", () => {
  test("signed-out dashboard shows heading and Sign in to continue @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "Sign in to continue" }).click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("discover shows a card with Needed and Pass advances the deck @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("swipe-card")).toBeVisible();
    await expect(page.getByText("Needed").first()).toBeVisible();
    await page.getByRole("button", { name: "Back this bill" }).click();
    await expect(page.getByTestId("backed-count")).toHaveText("Backed: 1");
  });

  test("bill detail shows naira progress @affected", async ({ page }) => {
    await page.goto("/bills/baba-tunde-hospital");
    const progress = page.getByRole("region", { name: "Funding progress" });
    await expect(progress.getByText("₦420,000", { exact: true })).toBeVisible();
  });
});
