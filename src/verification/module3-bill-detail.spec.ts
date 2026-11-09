import { test, expect } from "@playwright/test";
import { sampleBills } from "../lib/sampleBills";

const bills: any[] = (sampleBills as any) ?? [];
const funded = bills.find((b) => !String(b?.status ?? "").toLowerCase().includes("pending")) ?? bills[0];
const pending = bills.find((b) => String(b?.status ?? "").toLowerCase().includes("pending"));

test.describe("@affected bill detail", () => {
  test("unknown id shows not found", async ({ page }) => {
    await page.goto("/bills/does-not-exist-xyz");
    await expect(page.getByRole("heading", { name: "Bill not found" })).toBeVisible();
  });

  test("shows funding progress and donate opens amount chooser", async ({ page }) => {
    test.skip(!funded, "No sample bill available");
    await page.goto(`/bills/${funded.id}`);
    const region = page.getByRole("region", { name: "Funding progress" });
    await expect(region).toBeVisible();
    await expect(region.getByRole("progressbar")).toBeVisible();
    await expect(region).toContainText("₦");
    await page.getByRole("button", { name: "Donate" }).click();
    await expect(page.getByRole("heading", { name: "Choose an amount" })).toBeVisible();
  });

  test("pending bill shows Pending review and disables Donate", async ({ page }) => {
    if (!pending) {
      test.info().annotations.push({ type: "setup-required", description: "No pending sample bill exists" });
      test.skip(true, "No pending sample bill exists");
      return;
    }
    await page.goto(`/bills/${pending.id}`);
    await expect(page.getByText("Pending review")).toBeVisible();
    await expect(page.getByRole("button", { name: "Donate" })).toBeDisabled();
  });
});
