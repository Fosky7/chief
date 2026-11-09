import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("Module 5 — admin review queue @affected", () => {
  test("a pending bill is listed in the review queue and can be approved @affected", async ({
    page,
  }) => {
    if (!adminEmail || !adminPassword) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "Admin review needs a disposable admin-role account (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD). The runner supplies donor accounts only, so the review queue cannot be exercised yet.",
      });
      test.skip(true, "Admin-role disposable account not configured");
      return;
    }

    // Sign in through the real UI as the admin account.
    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(adminEmail);
    await page.getByLabel("Password", { exact: true }).fill(adminPassword);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).not.toHaveURL(/\/auth$/, { timeout: 15_000 });

    // The review queue renders its heading and at least one pending bill card.
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();

    const pendingCard = page
      .getByTestId("admin-queue-card")
      .filter({ hasText: "Pending review" })
      .first();
    await expect(pendingCard).toBeVisible();
    await expect(pendingCard.getByRole("button", { name: "Approve" })).toBeVisible();
    await expect(pendingCard.getByRole("button", { name: "Reject" })).toBeVisible();

    // Approving performs the real write and reports the concrete outcome.
    await pendingCard.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Bill approved" })).toBeVisible({
      timeout: 15_000,
    });

    // Reloading keeps the queue stable after the status change.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();
  });
});
