import { test, expect } from "@playwright/test";

/**
 * Module 5 — admin review & approval queue.
 *
 * Flows: reaching /admin from the home page, approving a pending bill, marking
 * a funded bill as paid to the biller, and the signed-out non-admin notice.
 */
test.describe("admin review queue @affected", () => {
  test("home page opens the admin review queue @affected", async ({ page }) => {
    await page.goto("/");

    // The shared header renders on every page, including the home page.
    await expect(page.getByTestId("brand-link")).toBeVisible();

    await page.getByRole("link", { name: "Admin review" }).first().click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();

    // Each pending bill exposes an approve and a reject action.
    await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" }).first()).toBeVisible();
  });

  test("pending bill can be approved and the page confirms it @affected", async ({ page }) => {
    await page.goto("/admin");

    const approve = page.getByRole("button", { name: "Approve" }).first();
    await expect(approve).toBeVisible();

    await approve.click();

    await expect(page.getByTestId("admin-feedback")).toContainText("Bill approved");
  });

  test("funded bill can be marked paid to the biller @affected", async ({ page }) => {
    await page.goto("/admin");

    const payout = page.getByRole("button", { name: "Mark paid to biller" }).first();
    await expect(payout).toBeVisible();

    await payout.click();

    await expect(page.getByTestId("admin-feedback")).toContainText("Paid out");
  });

  test("non-admin visitor sees the admins only notice @affected", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/admin");

    await expect(page.getByTestId("admin-notice")).toContainText("Admins only");

    await context.close();
  });
});
