import { test, expect, type Page } from "@playwright/test";

async function signInAsAdmin(page: Page): Promise<boolean> {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    test.info().annotations.push({
      type: "setup-required",
      description: "An admin test account (E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD) is required to exercise admin actions.",
    });
    return false;
  }
  await page.goto("/auth");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForTimeout(1500);
  return true;
}

test("@affected home navigation reaches the admin queue", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const adminLink = nav.getByRole("link", { name: /admin/i }).first();
  if (!(await adminLink.isVisible())) {
    await nav.getByRole("button", { name: /open menu/i }).click();
  }
  await adminLink.click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();
  await expect(page.getByText(/Admins only|Approve|Mark paid to biller|queue is clear/).first()).toBeVisible();
});

test("@affected non-admin visitor sees Admins only", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();
  await expect(page.getByText("Admins only")).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
});

test("@affected admin approves a pending bill and pays out a funded bill", async ({ page }) => {
  const ok = await signInAsAdmin(page);
  test.skip(!ok, "Admin account not supplied by runner");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Bills awaiting review" })).toBeVisible();
  const pendingCard = page.getByTestId("review-bill-card").filter({ has: page.getByRole("button", { name: "Approve" }) }).first();
  await expect(pendingCard.getByRole("button", { name: "Reject" })).toBeVisible();
  await pendingCard.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Bill approved")).toBeVisible();

  const funded = page.getByRole("button", { name: "Mark paid to biller" }).first();
  await expect(funded).toBeVisible();
  await funded.click();
  await expect(page.getByText("Paid out")).toBeVisible();
});
