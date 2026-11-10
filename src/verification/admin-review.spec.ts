import { test, expect } from "@playwright/test";

/**
 * Module 5 — admin review & approval queue.
 * One test per flow: queue + decisions, payout, non-admin notice, navigation.
 */
const HEADING = "Bills awaiting review";

test.describe("admin review and approval queue @affected", () => {
  test("the review queue lists bills with naira amounts and records approve/reject decisions @affected", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: HEADING })).toBeVisible();

    const cards = page.getByTestId("approval-card");
    await expect(cards.first()).toBeVisible();
    await expect.poll(async () => cards.count()).toBeGreaterThanOrEqual(2);

    const firstCard = cards.first();
    await expect(firstCard.getByTestId("bill-amount")).toContainText("₦");
    await expect(cards.nth(1).getByTestId("bill-amount")).toContainText("₦");

    await expect(
      firstCard.getByRole("button", { name: "Approve", exact: true }),
    ).toBeVisible();
    await expect(
      firstCard.getByRole("button", { name: "Reject", exact: true }),
    ).toBeVisible();

    await firstCard.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(page.getByTestId("admin-feedback")).toHaveText("Bill approved");

    await page.getByRole("button", { name: "Reject", exact: true }).first().click();
    await expect(page.getByTestId("admin-feedback")).toHaveText("Bill rejected");
  });

  test("a funded bill can be marked paid to the biller @affected", async ({ page }) => {
    await page.goto("/admin");

    const payout = page.getByRole("button", { name: "Mark paid to biller", exact: true });
    await expect(payout.first()).toBeVisible();

    await payout.first().click();
    await expect(page.getByTestId("admin-feedback")).toHaveText("Paid out");
  });

  test("a visitor who is not an admin sees the Admins only notice @affected", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByTestId("admin-notice")).toContainText("Admins only");
    await expect(page.getByTestId("admin-notice")).toBeVisible();
  });

  test("the Admin doorway in the site navigation opens the review queue from home @affected", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("nav-admin").click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: HEADING })).toBeVisible();
  });
});
