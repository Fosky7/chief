import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/auth", "/sign-in", "/signin", "/discover", "/dashboard"];

test.describe("@affected Supabase runtime configuration", () => {
  for (const route of publicRoutes) {
    test(`${route} renders without a Supabase configuration crash`, async ({
      page,
    }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();

      expect(
        pageErrors.filter((error) =>
          error.message.includes("Supabase is not configured"),
        ),
      ).toEqual([]);
    });
  }

  test("/auth keeps the Module 2 account controls available", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page.getByRole("radio", { name: "Donor" })).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Bill requester" }),
    ).toBeVisible();
  });
});
