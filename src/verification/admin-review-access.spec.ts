import { test, expect } from "@playwright/test";

/**
 * Module 5 — the /admin review gate.
 *
 * The admin queue hook decides who may moderate. This spec proves the concrete
 * outcome through the real UI: a signed-in visitor without the admin role
 * reaches /admin, still sees the "Bills awaiting review" heading, is shown the
 * gate panel reading "Admins only", and never gets Approve / Reject /
 * Mark paid controls.
 */
test.describe("Module 5 — admin review access gate @affected", () => {
  test("a signed-in visitor without the admin role only sees the review gate @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description:
          "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable non-admin account required to verify the /admin gate.",
      });
      test.skip(true, "Disposable test account not configured");
      return;
    }

    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Sign out", exact: true })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();

    const gate = page.getByTestId("admin-gate");
    await expect(gate).toBeVisible({ timeout: 20_000 });
    await expect(gate).toContainText("Admins only");

    // The gate must replace the queue entirely: no moderation controls at all.
    await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reject", exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Mark paid to biller", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByTestId("admin-queue-card")).toHaveCount(0);
  });
});
