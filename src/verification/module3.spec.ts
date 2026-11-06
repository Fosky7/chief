import { test, expect } from "@playwright/test";

const APPROVED = "/bills/demo-school-fees-lagos";
const PENDING = "/bills/demo-pending-electricity";

test.describe("Module 3 — bill detail page @affected", () => {
  test("shows title, Story, Biller and Due date @affected", async ({ page }) => {
    await page.goto(APPROVED);
    await expect(page.getByRole("heading", { level: 1, name: "Second-term school fees for Adaeze" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Story" })).toBeVisible();
    await expect(page.getByText("Biller", { exact: true })).toBeVisible();
    await expect(page.getByText("Due date", { exact: true })).toBeVisible();
    await expect(page.getByText("Queen's College Bursary, Yaba")).toBeVisible();
  });

  test("progress shows 'raised of' with naira amounts @affected", async ({ page }) => {
    await page.goto(APPROVED);
    const progress = page.getByTestId("bill-progress-text");
    await expect(progress).toContainText("raised of");
    await expect(progress).toContainText("₦");
  });

  test("clicking Donate opens Choose an amount @affected", async ({ page }) => {
    await page.goto(APPROVED);
    await page.getByRole("button", { name: "Donate", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a pending bill shows Pending review @affected", async ({ page }) => {
    await page.goto(PENDING);
    await expect(page.getByText("Pending review", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Donate", exact: true })).toBeDisabled();
  });

  test("unknown id shows Bill not found @affected", async ({ page }) => {
    await page.goto("/bills/does-not-exist");
    await expect(page.getByRole("heading", { name: "Bill not found" })).toBeVisible();
  });
});
