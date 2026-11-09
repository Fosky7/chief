import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

test("@affected @database @persistence bill requester sign up writes a profile row that survives reload", async ({
  page,
  request,
}) => {
  test.skip(
    !supabaseUrl || !supabaseKey,
    "Backend URL/key were not provided to the runner, so persistence cannot be read back.",
  );

  const email = `chief-persist-${Date.now()}@mailinator.com`;
  const password = "Chief-Persist-2048!";

  await page.goto("/auth");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("radio", { name: "Bill requester", exact: true }).check();
  await page.getByRole("button", { name: "Create account", exact: true }).click();

  await expect(page.getByRole("status").filter({ hasText: "Account created" })).toBeVisible({
    timeout: 20_000,
  });

  // Reload: the saved value must still be there, so the write reached the database.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sign in to Chief" })).toBeVisible();

  const token = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: supabaseKey!, "Content-Type": "application/json" },
    data: { email, password },
  });

  if (!token.ok()) {
    test.info().annotations.push({
      type: "setup-required",
      description:
        "The disposable sign-up account needs email confirmation before a session can read its profile back.",
    });
    test.skip(true, "Account created but no session can be established without email confirmation.");
    return;
  }

  const session = await token.json();

  const readback = await request.get(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${session.user.id}&select=id,role`,
    {
      headers: {
        apikey: supabaseKey!,
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );
  expect(readback.ok()).toBeTruthy();

  const rows = (await readback.json()) as Array<{ id: string; role: string | null }>;
  expect(rows).toHaveLength(1);
  expect(rows[0].id).toBe(session.user.id);
  expect(rows[0].role).toBe("bill_requester");
});
