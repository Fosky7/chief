import { expect, test } from "@playwright/test";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test("@affected @database donations expose Paystack payment columns for realtime raised updates", async ({
  page,
  request,
}) => {
  await page.goto("/discover");
  await expect(page.getByRole("heading", { level: 1, name: "Discover bills" })).toBeVisible();

  if (!supabaseUrl || !supabaseKey || !email || !password) {
    test.info().annotations.push({
      type: "setup-required",
      description: "Backend URL/key and a disposable test account are needed to probe the donations schema.",
    });
    test.skip(true, "Backend configuration not provided to the runner");
    return;
  }

  const signIn = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: supabaseKey, "Content-Type": "application/json" },
    data: { email, password },
  });
  expect(signIn.ok()).toBeTruthy();
  const session = await signIn.json();

  // PostgREST returns 200 only if every selected column exists.
  const probe = await request.get(
    `${supabaseUrl}/rest/v1/donations?select=id,bill_id,amount,status,paystack_reference,payment_reference,currency,paid_at&limit=0`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${session.access_token}` } },
  );
  expect(probe.status()).toBe(200);
  expect(await probe.json()).toEqual([]);
});
