import { test, expect } from "@playwright/test";

const emailDomain = process.env.E2E_EMAIL_DOMAIN ?? "example.com";

test.describe("Module 2 — accounts, sign up and role selection", () => {
  test("shows the default sign-in form @affected", async ({ page }) => {
    await page.goto("/auth");

    await expect(
      page.getByRole("heading", { name: "Sign in to Chief" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
  });

  test("allows selecting the Bill requester role @affected", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "I'm joining as" }),
    ).toBeVisible();

    const donor = page.getByRole("radio", { name: "Donor", exact: true });
    const requester = page.getByRole("radio", {
      name: "Bill requester",
      exact: true,
    });

    await expect(donor).toBeChecked();
    await expect(requester).not.toBeChecked();
    await requester.check();
    await expect(requester).toBeChecked();
    await expect(donor).not.toBeChecked();
  });

  test("creates and persists a Bill requester profile through the live database trigger @affected @database @persistence", async ({
    page,
  }) => {
    const uniqueEmail = `chief-requester-${crypto.randomUUID()}@${emailDomain}`;
    const password = "ChiefTest!2048";

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);

    const requester = page.getByRole("radio", {
      name: "Bill requester",
      exact: true,
    });
    await requester.check();
    await expect(requester).toBeChecked();

    await page.getByRole("button", { name: "Create account" }).click();

    // Successful completion exercises auth.users insertion and the
    // handle_new_user profile trigger, including its avatar_url column write.
    await expect(page.getByRole("status")).toHaveText("Account created");
    await expect(requester).toBeChecked();

    // Reload and retrying the same disposable account verifies the first write
    // persisted in the connected backend rather than only updating local UI.
    await page.reload();
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Email", { exact: true }).fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await requester.check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("alert")).toContainText("already exist");
  });

  test("shows a safe error for invalid credentials @affected", async ({ page }) => {
    await page.goto("/auth");
    await page
      .getByLabel("Email", { exact: true })
      .fill(`missing-${crypto.randomUUID()}@${emailDomain}`);
    await page
      .getByLabel("Password", { exact: true })
      .fill("DefinitelyWrong!2048");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByRole("alert")).toHaveText(
      "Invalid login credentials",
    );
  });

  test("shows Sign out after a successful sign in @affected", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    test.skip(
      !email || !password,
      "E2E_USER_EMAIL and E2E_USER_PASSWORD are required for the existing-account sign-in check.",
    );

    await page.goto("/auth");
    await page.getByLabel("Email", { exact: true }).fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("button", { name: "Sign out", exact: true }),
    ).toBeVisible();
  });
});
