import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

async function signInIfPossible(page: Page): Promise<boolean> {
  if (!EMAIL || !PASSWORD) return false;

  for (const path of ["/auth", "/login"]) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
    } catch {
      continue;
    }

    const emailField = page.getByLabel(/email/i).first();
    if ((await emailField.count()) === 0) continue;

    await emailField.fill(EMAIL);
    await page.getByLabel(/password/i).first().fill(PASSWORD);
    await page
      .getByRole("button", { name: /sign in|log in|login/i })
      .first()
      .click();
    await page.waitForLoadState("networkidle");
    return true;
  }

  return false;
}

test.describe("module 5 · admin review queue", () => {
  test("@affected /admin loads directly and approves a pending bill", async ({ page }) => {
    test.skip(
      !EMAIL || !PASSWORD,
      "setup-required: E2E_USER_EMAIL / E2E_USER_PASSWORD disposable credentials were not supplied",
    );

    await page.goto("/admin");
    const heading = page.getByRole("heading", { name: /bills awaiting review/i });
    await expect(heading).toBeVisible();

    if ((await page.getByText(/admins only/i).count()) > 0) {
      await signInIfPossible(page);
      await page.goto("/admin");
      await expect(heading).toBeVisible();
    }

    test.skip(
      (await page.getByText(/admins only/i).count()) > 0,
      "setup-required: the disposable E2E account is not an administrator in this environment",
    );

    const approveButton = page.getByRole("button", { name: "Approve" }).first();
    test.skip(
      (await approveButton.count()) === 0,
      "setup-required: no pending bill is available in the admin queue",
    );

    const card = page
      .locator("article")
      .filter({ has: page.getByRole("button", { name: "Approve" }) })
      .first();
    const title = ((await card.getByRole("heading").first().textContent()) ?? "").trim();

    await approveButton.click();
    await expect(page.getByText("Bill approved")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: /bills awaiting review/i })).toBeVisible();

    if (title.length > 0) {
      const reloadedCard = page.locator("article").filter({ hasText: title }).first();
      await expect(reloadedCard).toContainText(/approved/i);
    }
  });
});
