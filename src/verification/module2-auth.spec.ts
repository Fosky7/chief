import { test, expect } from "@playwright/test";

const emailDomain = process.env.E2E_EMAIL_DOMAIN ?? "example.com";

test.describe("Module 2 — accounts, sign up & role selection", () => {
  test("auth form shows Email, Password and Sign in @affected", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("Create an account exposes selectable Donor and Bill requester roles @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();

    const donor = page.getByRole("radio", { name: "Donor", exact: true });
    const requester = page.getByRole("radio", { name: "Bill requester", exact: true });

    await expect(donor).toBeChecked();
    await expect(requester).not.toBeChecked();

    await page.getByText("Bill requester", { exact: true }).click();
    await expect(requester).toBeChecked();
    await expect(donor).not.toBeChecked();
  });

  test("signing up as Bill requester shows Account created @affected @database @persistence", async ({ page }) => {
    const email = `chief.e2e+${Date.now()}@${emailDomain}`;
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByText("Bill requester", { exact: true }).click();
    await expect(page.getByRole("radio", { name: "Bill requester", exact: true })).toBeChecked();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("ChiefTest!2345");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Account created" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Bill requester", { exact: true })).toBeVisible();
  });

  test("invalid password shows Invalid login credentials @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill(`nobody.${Date.now()}@${emailDomain}`);
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Invalid login credentials", { timeout: 15000 });
  });

  test("after signing in the nav bar shows Sign out @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    test.skip(!email || !password, "Requires a confirmed test account in E2E_USER_EMAIL / E2E_USER_PASSWORD");
    await page.goto("/auth");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "Sign out" }).first()).toBeVisible();
  });
});
