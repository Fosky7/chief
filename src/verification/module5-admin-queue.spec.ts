import { expect, test } from "@playwright/test";

/**
 * Admin review queue flows.
 *
 * The curated sample cards (ids prefixed with `demo-bill-`) are local fixtures,
 * so the approve / payout flows below exercise the real UI and real feedback
 * copy without mutating any live database rows.
 */
const SAMPLE_PENDING_CARD =
  '[data-testid="approval-card"][data-bill-id="demo-bill-rent-arrears"]';
const SAMPLE_FUNDED_CARD =
  '[data-testid="approval-card"][data-bill-id="demo-bill-hospital-bill"]';

test.describe("Module 5 — admin review queue @affected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Bills awaiting review" }),
    ).toBeVisible();
  });

  test("@affected /admin lists reviewable bills with approve and reject actions", async ({
    page,
  }) => {
    const cards = page.getByTestId("approval-card");
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("queue-loading")).toHaveCount(0);

    // A bill awaiting review exposes both review decisions.
    const reviewableCard = cards
      .filter({ has: page.getByRole("button", { name: "Reject", exact: true }) })
      .first();
    await expect(reviewableCard).toBeVisible();
    await expect(
      reviewableCard.getByRole("button", { name: "Approve", exact: true }),
    ).toBeVisible();
    await expect(reviewableCard.getByTestId("bill-status")).toHaveText(/pending|review/i);

    // The summary panel reflects the queue contents.
    await expect(page.getByTestId("summary-pending")).toHaveText(/^\d+$/);
    await expect(page.getByTestId("summary-total")).toHaveText(/^₦/);
  });

  test("@affected approving a pending bill confirms with Bill approved", async ({ page }) => {
    const card = page.locator(SAMPLE_PENDING_CARD);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByTestId("bill-status")).toHaveText(/pending/i);

    await card.getByRole("button", { name: "Approve", exact: true }).click();

    const feedback = page.getByTestId("admin-feedback");
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText("Bill approved");

    // The card leaves the review queue and no longer offers review actions.
    await expect(card.getByTestId("bill-status")).toHaveText("Approved");
    await expect(card.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
    await expect(card.getByRole("button", { name: "Reject", exact: true })).toHaveCount(0);
  });

  test("@affected marking a funded bill paid confirms with Paid out", async ({ page }) => {
    const card = page.locator(SAMPLE_FUNDED_CARD);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByTestId("bill-status")).toHaveText(/funded/i);

    await card.getByRole("button", { name: "Mark paid to biller", exact: true }).click();

    const feedback = page.getByTestId("admin-feedback");
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText("Paid out");

    await expect(card.getByTestId("bill-status")).toHaveText("Paid");
    await expect(card.getByText("No further action needed.")).toBeVisible();
  });

  test("@affected a visitor without the admin role sees the Admins only notice", async ({
    page,
  }) => {
    const notice = page.getByTestId("admin-notice");
    await expect(notice).toBeVisible({ timeout: 15_000 });
    await expect(notice).toContainText("Admins only");
  });
});
