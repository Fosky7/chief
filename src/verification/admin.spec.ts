import { test, expect } from "@playwright/test";

test("admin review queue: heading, gate, approve and payout @affected", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();
  await expect(page.getByText("Admins only")).toBeVisible();

  const pending = page.locator('[data-testid="review-card"][data-status="pending"]').first();
  await expect(pending.getByRole("button", { name: "Approve" })).toBeVisible();
  await expect(pending.getByRole("button", { name: "Reject" })).toBeVisible();

  const pendingTitle = await pending.locator("h2").innerText();
  await pending.getByRole("button", { name: "Approve" }).click();
  const approvedCard = page.locator('[data-testid="review-card"]', { hasText: pendingTitle });
  await expect(approvedCard.getByText("Bill approved")).toBeVisible();

  const funded = page.locator('[data-testid="review-card"][data-status="funded"]').first();
  const fundedTitle = await funded.locator("h2").innerText();
  await funded.getByRole("button", { name: "Mark paid to biller" }).click();
  const paidCard = page.locator('[data-testid="review-card"]', { hasText: fundedTitle });
  await expect(paidCard.getByText("Paid out")).toBeVisible();
});
