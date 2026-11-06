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

  expect(supabaseUrl, "VITE_SUPABASE_URL must be available to verify the live schema").toBeTruthy();
  expect(
    supabaseKey,
    "VITE_SUPABASE_PUBLISHABLE_KEY must be available to verify the live schema",
  ).toBeTruthy();

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
      avatar_url: expect.any(Object),
      city: expect.any(Object),
    }),
  );
  expect(definitions?.bills?.properties).toEqual(
    expect.objectContaining({
      amount_required: expect.any(Object),
      amount_raised: expect.any(Object),
      document_url: expect.any(Object),
    }),
  );
  expect(definitions?.donations?.properties).toEqual(
    expect.objectContaining({
      payment_reference: expect.any(Object),
      updated_at: expect.any(Object),
    }),
  );
});
