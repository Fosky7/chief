import { test, expect } from "@playwright/test";

test.describe("Module 5 – admin review and approval queue", () => {
  test("the /admin route loads directly and shows the review heading with a bill card @affected", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /bills awaiting review/i })).toBeVisible();

    const card = page.getByTestId("admin-bill-card").first();
    await expect(card).toBeVisible();
  });

  test("an admin can approve a bill and sees the confirmation @affected", async ({ page }) => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "setup-required: needs a disposable admin account (E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD) to exercise the approval flow",
    );

    await page.goto("/admin");

    const card = page.getByTestId("admin-bill-card").first();
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: /^approve$/i }).click();

    await expect(page.getByTestId("admin-message")).toContainText(/bill approved/i);
  });
});
