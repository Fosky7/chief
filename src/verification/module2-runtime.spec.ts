import { test, expect } from "@playwright/test";

test.describe("@affected Module 2 runtime", () => {
  test("public and account routes render without a Supabase configuration crash", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const path of ["/", "/auth", "/sign-in", "/signin", "/discover", "/dashboard"]) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
    }

    expect(pageErrors).not.toContain(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  });

  test("auth form exposes sign in and role selection", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("radio", { name: "Donor" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Bill requester" })).toBeVisible();
  });
});
