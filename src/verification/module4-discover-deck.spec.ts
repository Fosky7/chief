import { test, expect } from "@playwright/test";

test.describe("Module 4 — discover deck data @affected", () => {
  test("discover shows a top bill card with a Needed amount @affected", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: "Discover bills" })).toBeVisible();

    const top = page.getByTestId("swipe-card-top");
    await expect(top).toBeVisible();
    await expect(top.getByText("Needed", { exact: true })).toBeVisible();
    await expect(top.getByText("Raised", { exact: true })).toBeVisible();
    await expect(top.getByTestId("swipe-card-needed")).toHaveText(/^₦\d{1,3}(,\d{3})*$/);
    await expect(top.getByRole("progressbar")).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test("Start swiping on home leads to cards with Needed @affected", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start swiping" }).click();
    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByTestId("swipe-card-top").getByTestId("swipe-card-needed")).toBeVisible();
  });
});
