import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test("@affected @database @persistence exposes the Module 2 schema columns", async ({
  page,
  request,
}) => {
  await page.goto("/auth");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

  if (!supabaseUrl || !supabaseKey || !email || !password) {
    test.info().annotations.push({
      type: "setup-required",
      description:
        "Backend URL/key and a disposable test account are needed to read the live schema.",
    });
    test.skip(true, "Backend configuration not provided to the runner");
  }

  // Sign in as the disposable test account: profiles is intentionally not
  // anon-readable, so the schema probe must run as an authenticated user.
  const signIn = await request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: supabaseKey!, "Content-Type": "application/json" },
      data: { email, password },
    },
  );
  expect(signIn.ok()).toBeTruthy();
  const session = await signIn.json();

  // Probe the exact columns: PostgREST answers 200 only when every selected
  // column exists in the live schema, and 400 naming the missing one.
  const probe = await request.get(
    `${supabaseUrl}/rest/v1/profiles?select=id,role,full_name,avatar_url,city&limit=0`,
    {
      headers: {
        apikey: supabaseKey!,
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  );
  expect(probe.ok()).toBeTruthy();
});
