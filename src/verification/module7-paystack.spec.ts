import { test, expect } from "@playwright/test";

const backendUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

test.describe("Module 7 — Paystack edge functions @affected", () => {
  test("initialize rejects signed-out callers and webhook rejects unsigned events @affected", async ({ request }) => {
    if (!backendUrl || !anonKey) {
      test.info().annotations.push({
        type: "setup-required",
        description: "Connected backend URL and publishable key are required to reach edge functions.",
      });
      test.skip(true, "Backend configuration not supplied");
      return;
    }

    const init = await request.post(`${backendUrl}/functions/v1/paystack-initialize`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      data: { billId: "00000000-0000-0000-0000-000000000000", amount: 1000 },
    });
    expect(init.status()).toBe(401);
    expect((await init.json()).error).toBe("Sign in to donate");

    const hook = await request.post(`${backendUrl}/functions/v1/paystack-webhook`, {
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      data: { event: "charge.success", data: { reference: "forged", amount: 100000 } },
    });
    expect(hook.status()).toBe(401);
  });
});
