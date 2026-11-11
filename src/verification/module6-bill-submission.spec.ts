import { test, expect } from "@playwright/test";

// 1x1 transparent PNG used as disposable proof of bill.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Module 6 — bill submission with proof upload @affected", () => {
  test("form shows all fields and a live naira amount @affected", async ({ page }) => {
    await page.goto("/bills/new");
    for (const label of ["Title", "Story", "Category", "Biller name", "Amount (₦)", "Due date", "Proof of bill"]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
    await page.getByLabel("Amount (₦)", { exact: true }).fill("250000");
    await expect(page.getByTestId("amount-preview")).toHaveText("₦250,000");
  });

  test("submitting without a title shows Title is required @affected", async ({ page }) => {
    await page.goto("/bills/new");
    await expect(page.getByText("Proof of bill").first()).toBeVisible();
    await page.getByRole("button", { name: "Submit bill" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();
  });

  test("submitting a complete form saves a pending bill @affected @database @persistence", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "E2E_USER_EMAIL / E2E_USER_PASSWORD disposable account required.",
      });
      test.skip(true, "Disposable test account not configured");
      return;
    }

    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });

    const title = `E2E disposable bill ${Date.now()}`;
    await page.goto("/bills/new");
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page
      .getByLabel("Story", { exact: true })
      .fill("Disposable verification bill created by automated tests. Please ignore.");
    await page.getByLabel("Category", { exact: true }).selectOption("Health");
    await page.getByLabel("Biller name", { exact: true }).fill("E2E General Hospital");
    await page.getByLabel("Amount (₦)", { exact: true }).fill("250000");
    await expect(page.getByText("₦250,000").first()).toBeVisible();
    await page.getByLabel("Due date", { exact: true }).fill("2030-01-15");
    await page
      .getByLabel("Proof of bill", { exact: true })
      .setInputFiles({ name: "proof.png", mimeType: "image/png", buffer: PNG });
    await page.getByRole("button", { name: "Submit bill" }).click();

    await expect(page.getByText("Pending review").first()).toBeVisible({ timeout: 20_000 });

    // Readback after a full reload from the saved bill page.
    await page.getByRole("link", { name: "View your bill" }).click();
    await expect(page).toHaveURL(/\/bills\/[0-9a-f-]{36}$/);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Pending review").first()).toBeVisible();
  });
});
