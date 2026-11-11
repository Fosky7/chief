import { test, expect, type Page } from "@playwright/test";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function signInIfNeeded(page: Page, email: string, password: string) {
  const emailField = page.getByLabel(/email/i).first();
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(email);
    await page.getByLabel(/password/i).first().fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).first().click();
    await page.waitForLoadState("networkidle");
  }
}

test.describe("Bill submission on /bills/new @affected", () => {
  test("form shows all bill fields @affected", async ({ page }) => {
    await page.goto("/bills/new");
    for (const label of ["Title", "Story", "Category", "Biller name", "Due date"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
    await expect(page.getByText("Amount (₦)").first()).toBeVisible();
    await expect(page.getByText("Proof of bill").first()).toBeVisible();
  });

  test("amount is formatted in naira @affected", async ({ page }) => {
    await page.goto("/bills/new");
    const amount = page.getByLabel(/Amount/).first();
    await amount.fill("250000");
    await expect(page.getByText("₦250,000").first()).toBeVisible();
  });

  test("missing title shows validation error @affected", async ({ page }) => {
    await page.goto("/bills/new");
    await page.getByRole("button", { name: /submit/i }).first().click();
    await expect(page.getByText("Title is required").first()).toBeVisible();
  });

  test("complete submission shows Pending review @affected @database @persistence", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.info().annotations.push({
        type: "setup-required",
        description: "Disposable test account (E2E_USER_EMAIL/E2E_USER_PASSWORD) not supplied.",
      });
      test.skip(true, "Disposable test account not supplied by the runner");
      return;
    }
    await page.goto("/bills/new");
    await signInIfNeeded(page, email, password);
    if (!page.url().includes("/bills/new")) await page.goto("/bills/new");

    const title = `E2E disposable bill ${Date.now()}`;
    await page.getByLabel(/Title/).first().fill(title);
    await page.getByLabel(/Story/).first().fill("Our family electricity bill is overdue and we need support.");
    const category = page.getByLabel(/Category/).first();
    const tag = await category.evaluate((el) => el.tagName);
    if (tag === "SELECT") await category.selectOption({ index: 1 });
    else await category.fill("Electricity");
    await page.getByLabel(/Biller name/).first().fill("Ikeja Electric");
    await page.getByLabel(/Amount/).first().fill("250000");
    const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    await page.getByLabel(/Due date/).first().fill(due);
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "proof.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await page.getByRole("button", { name: /submit/i }).first().click();
    await expect(page.getByText("Pending review").first()).toBeVisible({ timeout: 20000 });
  });
});
