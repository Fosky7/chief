import { test, expect } from "@playwright/test";

test("admin review queue: gate, approve and payout @affected", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { level: 1, name: "Bills awaiting review" })).toBeVisible();
  // Anonymous visitor is not an admin.
  await expect(page.getByRole("heading", { name: "Admins only" })).toBeVisible();

  await page.getByRole("button", { name: "Explore sample queue" }).click();

  const water = page.getByRole("article", { name: "Bill from City Water" });
  await expect(water.getByRole("button", { name: "Approve" })).toBeVisible();
  await expect(water.getByRole("button", { name: "Reject" })).toBeVisible();

  await water.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("status")).toHaveText("Bill approved");
  await expect(water.getByText("Approved", { exact: true })).toBeVisible();
  await expect(water.getByRole("button", { name: "Approve" })).toHaveCount(0);

  const internet = page.getByRole("article", { name: "Bill from Metro Internet" });
  await internet.getByRole("button", { name: "Mark paid to biller" }).click();
  await expect(page.getByRole("status")).toContainText("Paid out");
  await expect(internet.getByText("Paid out", { exact: true })).toBeVisible();
});
