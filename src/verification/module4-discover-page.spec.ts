import { test, expect } from "@playwright/test";

test("@affected Skip on /discover shows the next bill card", async ({ page }) => {
  await page.goto("/discover");
  const title = page.getByTestId("card-title");
  await expect(title).toBeVisible({ timeout: 15000 });
  const first = (await title.textContent()) ?? "";
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(title).not.toHaveText(first);
  await expect(page.getByText("Needed").first()).toBeVisible();
});

test("@affected Give on /discover opens Choose an amount", async ({ page }) => {
  await page.goto("/discover");
  await page.getByRole("button", { name: "Give" }).click();
  await expect(page.getByRole("dialog", { name: "Choose an amount" })).toBeVisible();
  await expect(page.getByText("Choose an amount")).toBeVisible();
});

test("@affected home Discover bills link opens /discover with a card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Discover bills/i }).first().click();
  await expect(page).toHaveURL(/\/discover/);
  await expect(page.getByText("Needed").first()).toBeVisible({ timeout: 15000 });
});
