import { test, expect, type Page } from "@playwright/test";

async function openBillForm(page: Page, path: string) {
  await page.goto(path);
  const title = page.getByLabel("Title", { exact: true });
  // If the route is protected, sign in through the real UI first.
  if (!(await title.isVisible({ timeout: 5000 }).catch(() => false))) {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account not supplied",
      });
      test.skip(true, "Disposable test account not supplied");
      return;
    }
    await page.getByLabel(/email/i).first().fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    await page.waitForLoadState("networkidle");
    await page.goto(path);
  }
  await expect(page.getByLabel("Title", { exact: true })).toBeVisible();
}

test("bill submission form shows fields, naira formatting and validation @affected", async ({ page }) => {
  await openBillForm(page, "/bills/new");

  for (const label of ["Title", "Story", "Category", "Biller name", "Amount (₦)", "Due date", "Proof of bill"]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }

  await page.getByLabel("Amount (₦)", { exact: true }).fill("250000");
  await expect(page.getByTestId("amount-preview")).toHaveText("₦250,000");

  await page.getByRole("button", { name: "Submit bill" }).click();
  await expect(page.getByText("Title is required")).toBeVisible();
  await expect(page.getByTestId("bill-pending")).toHaveCount(0);
});

test("legacy /create-bill page shows the bill submission form @affected", async ({ page }) => {
  await openBillForm(page, "/create-bill");
  await expect(page.getByLabel("Amount (₦)", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Proof of bill", { exact: true })).toBeVisible();
  await page.getByLabel("Amount (₦)", { exact: true }).fill("1500");
  await expect(page.getByTestId("amount-preview")).toHaveText("₦1,500");
});
