import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

test("@affected @database @persistence exposes the Module 2 schema columns", async ({
  page,
  request,
}) => {
  await page.goto("/auth");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

  if (!supabaseUrl || !supabaseKey) {
    test.info().annotations.push({
      type: "setup-required",
      description: "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are needed to read the live schema.",
    });
    test.skip(true, "Backend configuration not provided to the runner");
  }

  const response = await request.get(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseKey!,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: "application/openapi+json",
    },
  });
  expect(response.ok()).toBeTruthy();

  const schema = await response.json();
  const definitions = schema.definitions ?? schema.components?.schemas;

  expect(definitions?.profiles?.properties).toEqual(
    expect.objectContaining({
      id: expect.anything(),
      role: expect.anything(),
      full_name: expect.anything(),
      avatar_url: expect.anything(),
      city: expect.anything(),
    }),
  );
});
