import { expect, test } from "@playwright/test";

test.describe("@affected Module 2 client configuration & role options", () => {
  for (const route of ["/", "/auth", "/discover", "/dashboard"]) {
    test(`${route} renders without an uncaught Supabase init error`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(route);
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      expect(errors.filter((m) => /supabase/i.test(m))).toEqual([]);
    });
  }

  test("sign up offers Donor (default) and Bill requester roles", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
    await expect(page.getByRole("radio", { name: "Bill requester", exact: true })).toBeChecked();
  });
});
