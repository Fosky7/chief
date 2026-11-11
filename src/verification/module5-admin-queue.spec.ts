import { test, expect } from "@playwright/test";

test.describe("admin review queue @affected", () => {
  test("home page opens the admin review queue @affected", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Admin review" }).first().click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();
  });

  test("pending bill can be approved and the page confirms it @affected", async ({ page }) => {
    await page.goto("/admin");

    const approve = page.getByRole("button", { name: "Approve" }).first();
    await expect(approve).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" }).first()).toBeVisible();

    await approve.click();

    await expect(page.getByRole("status")).toContainText("Bill approved");
  });

  test("funded bill can be marked paid to the biller @affected", async ({ page }) => {
    await page.goto("/admin");

    const payout = page.getByRole("button", { name: "Mark paid to biller" }).first();
    await expect(payout).toBeVisible();

    await payout.click();

    await expect(page.getByRole("status")).toContainText("Paid out");
  });

  test("non-admin visitor sees the admins only notice @affected", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/admin");

    await expect(page.getByText("Admins only")).toBeVisible();

    await context.close();
  });
});
