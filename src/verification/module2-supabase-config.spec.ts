import { test, expect } from "@playwright/test";

test("@affected public and authentication routes load with the managed Supabase configuration", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

  for (const path of ["/", "/auth", "/sign-in", "/signin", "/discover", "/dashboard"]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
  }

  expect(
    pageErrors.filter((error) =>
      error.message.includes("Supabase is not configured"),
    ),
  ).toEqual([]);
});
