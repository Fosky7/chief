import { test, expect } from "@playwright/test";

const routes = ["/", "/auth", "/sign-in", "/signin", "/discover", "/dashboard"];

for (const route of routes) {
  test(`@affected ${route} renders without a Supabase configuration crash`, async ({
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

test("@affected auth form retains sign-in and role-selection behavior", async ({
  page,
}) => {
  await page.goto("/auth");

  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("radio", { name: "Donor" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Bill requester" })).toBeVisible();
});

test("@affected invalid sign-in shows a concrete credentials error", async ({
  page,
}) => {
  await page.goto("/auth");

  await page.getByLabel("Email").fill(`invalid-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText("Invalid login credentials");
});
