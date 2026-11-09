import { test, expect } from "@playwright/test";
import { sampleBills } from "../lib/sampleBills";

const bills = (sampleBills as any[]) ?? [];
const isPending = (b: any) => String(b?.status ?? "").toLowerCase().includes("pending");
const openBill = bills.find((b) => !isPending(b));
const pendingBill = bills.find((b) => isPending(b));

test.describe("@affected bill detail step 4", () => {
  test("funding progress shows naira amount and Donate opens amount chooser", async ({ page }) => {
    if (!openBill) {
      test.info().annotations.push({ type: "setup-required", description: "No non-pending sample bill available" });
      test.skip(true, "No non-pending sample bill available");
    }
    await page.goto(`/bills/${openBill.id}`);
    const region = page.getByRole("region", { name: "Funding progress" });
    await expect(region).toBeVisible();
    await expect(region).toContainText("₦");
    await page.getByRole("button", { name: "Donate" }).click();
    await expect(page.getByText("Choose an amount")).toBeVisible();
  });

  test("pending bill shows Pending review and disables Donate", async ({ page }) => {
    if (!pendingBill) {
      test.info().annotations.push({ type: "setup-required", description: "No pending sample bill available" });
      test.skip(true, "No pending sample bill available");
    }
    await page.goto(`/bills/${pendingBill.id}`);
    await expect(page.getByText("Pending review").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Donate" })).toBeDisabled();
  });
});
