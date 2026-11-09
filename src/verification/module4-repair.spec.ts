import { expect, test } from "@playwright/test";

test.describe("Module 4 repair @affected", () => {
  test("signed-out dashboard shows heading and sign-in link @affected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to continue" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("discover card shows Needed @affected", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();
    await expect(page.getByTestId("swipe-card").getByText("Needed", { exact: true })).toBeVisible();
  });

  test("pending bill detail shows Pending review @affected", async ({ page }) => {
    await page.goto("/bills/solar-pump-kaduna");
    await expect(page.getByText("Pending review", { exact: true })).toBeVisible();
  });
});
