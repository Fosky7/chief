import { test, expect } from "@playwright/test";

const emailDomain = process.env.E2E_EMAIL_DOMAIN ?? "example.com";

test("@affected @database @persistence bill requester sign-up persists via repaired profile trigger", async ({
  page,
}) => {
  const email = `chief-repair-${crypto.randomUUID()}@${emailDomain}`;
  const password = "ChiefRepair!2048";

  await page.goto("/auth");
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("radio", { name: "Donor", exact: true })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("status")).toHaveText("Account created");

  // Reload and retry: the backend must now reject the duplicate, proving persistence.
  await page.reload();
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toContainText("already");
});
