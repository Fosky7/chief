import { test, expect, type Page } from "@playwright/test";

function freshEmail(tag: string) {
  return `chief.e2e.${tag}.${Date.now()}${Math.floor(Math.random() * 1000)}@gmail.com`;
}

const PASSWORD = "Naira-Test-2468";

async function signUp(page: Page, email: string, roleLabel: "Donor" | "Bill requester") {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByText(roleLabel, { exact: true }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Account created" })).toBeVisible({ timeout: 15000 });
  return (await page.getByTestId("needs-confirmation").count()) > 0;
}

const visibleSignOut = (page: Page) => page.locator('text="Sign out" >> visible=true').first();

test.describe("Module 2 — accounts, sign up & role selection", () => {
  test("auth form shows Email, Password and Sign in @affected", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("Create an account shows Donor and Bill requester @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByText("Donor", { exact: true })).toBeVisible();
    await expect(page.getByText("Bill requester", { exact: true })).toBeVisible();
  });

  test("signing up as Bill requester shows Account created @affected @database", async ({ page }) => {
    await signUp(page, freshEmail("req"), "Bill requester");
    await expect(page.getByText("Bill requester").first()).toBeVisible();
  });

  test("invalid password shows Invalid login credentials @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill(freshEmail("bad"));
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Invalid login credentials", { timeout: 15000 });
  });

  test("after signing in the nav bar shows Sign out @affected", async ({ page }) => {
    const email = freshEmail("nav");
    const needsConfirmation = await signUp(page, email, "Donor");
    test.skip(needsConfirmation, "Backend requires email confirmation before the first sign in.");
    // Sign out, then sign back in with the same credentials.
    await page.goto("/");
    await visibleSignOut(page).click();
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(visibleSignOut(page)).toBeVisible();
  });

  test("signed-in session survives a reload @affected @database @persistence", async ({ page }) => {
    const needsConfirmation = await signUp(page, freshEmail("persist"), "Bill requester");
    test.skip(needsConfirmation, "Backend requires email confirmation before the first sign in.");
    await page.goto("/");
    await expect(visibleSignOut(page)).toBeVisible();
    await page.reload();
    await expect(visibleSignOut(page)).toBeVisible();
  });

  test("a separate visitor is not signed in as another account @affected @database @permissions", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    const needsConfirmation = await signUp(a, freshEmail("perm"), "Donor");
    if (!needsConfirmation) {
      await a.goto("/");
      await expect(visibleSignOut(a)).toBeVisible();
    }
    await b.goto("/");
    await expect(b.locator('text="Sign in" >> visible=true').first()).toBeVisible();
    await expect(b.locator('text="Sign out" >> visible=true')).toHaveCount(0);
    await ctxA.close();
    await ctxB.close();
  });
});
