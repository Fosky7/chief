import { test, expect } from "@playwright/test";

test.describe("Create bill alias @affected", () => {
  test("/create-bill opens the bill submission form @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "Disposable test account (E2E_USER_EMAIL/E2E_USER_PASSWORD) not supplied",
      });
      test.skip(true, "Disposable test account not supplied");
      return;
    }

    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Sign out", exact: true }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto("/create-bill");
    await expect(page).toHaveURL(/\/bills\/new$/);
    for (const label of ["Title", "Story", "Category", "Biller name", "Amount (₦)", "Due date", "Proof of bill"]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
  });
});
