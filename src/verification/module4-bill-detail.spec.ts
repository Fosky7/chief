import { test, expect } from "@playwright/test";
import { sampleBills } from "../lib/sampleBills";

const bills: any[] = Array.isArray(sampleBills) ? (sampleBills as any[]) : [];
const isPending = (b: any) =>
  String(b?.status ?? b?.reviewStatus ?? "").toLowerCase().includes("pending") || b?.pending === true;
const has420k = (b: any) =>
  Object.values(b ?? {}).some((v) => v === 420000 || v === "420000");
const fundedBill = bills.find((b) => has420k(b) && !isPending(b)) ?? bills.find((b) => !isPending(b));
const pendingBill = bills.find(isPending);

test.describe("@affected module4 bill detail", () => {
  test("funding progress shows naira amount and Donate opens amount chooser", async ({ page }) => {
    if (!fundedBill) {
      test.info().annotations.push({ type: "setup-required", description: "No non-pending sample bill exists" });
      test.skip(true, "No non-pending sample bill exists");
      return;
    }
    await page.goto(`/bills/${fundedBill.id}`);
    const region = page.getByRole("region", { name: "Funding progress" });
    await expect(region).toBeVisible();
    await expect(region.getByRole("progressbar")).toBeVisible();
    if (has420k(fundedBill)) {
      await expect(region).toContainText("₦420,000");
    } else {
      await expect(region).toContainText("₦");
    }
    await page.getByRole("button", { name: "Donate", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
  });

  test("pending bill shows Pending review and disables Donate", async ({ page }) => {
    if (!pendingBill) {
      test.info().annotations.push({ type: "setup-required", description: "No pending sample bill exists" });
      test.skip(true, "No pending sample bill exists");
      return;
    }
    await page.goto(`/bills/${pendingBill.id}`);
    await expect(page.getByText("Pending review")).toBeVisible();
    await expect(page.getByRole("button", { name: "Donate", exact: true })).toBeDisabled();
  });
});
