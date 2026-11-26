// Paystack webhook: verifies the HMAC signature and marks donations as paid.
// Idempotent: a donation is only credited once even if Paystack retries.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
const headers = { "Content-Type": "application/json" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

async function hmacSha512Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison to avoid timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  // CORS preflight — required for browser calls.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  if (!signature) return json({ error: "Invalid signature" }, 401);
  if (!secret || !supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500);

  const expected = await hmacSha512Hex(secret, raw);
  if (!safeEqual(expected, signature.toLowerCase())) return json({ error: "Invalid signature" }, 401);

  let event: { event?: string; data?: { reference?: string; amount?: number; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid payload" }, 400);
  }

  // Only successful charges change state; acknowledge everything else.
  if (event.event !== "charge.success" || !event.data?.reference) return json({ received: true });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const reference = event.data.reference;

  const { data: donation } = await admin
    .from("donations")
    .select("id, bill_id, amount, status")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (!donation) return json({ received: true, note: "unknown reference" });

  // Guard against amount tampering: Paystack amount is in kobo.
  const paidNaira = Math.round(Number(event.data.amount ?? 0) / 100);
  if (paidNaira < Number(donation.amount)) {
    await admin.from("donations").update({ status: "failed" }).eq("id", donation.id).eq("status", "pending");
    return json({ received: true, note: "amount mismatch" });
  }

  // Conditional update makes this idempotent across retries.
  const { data: updated } = await admin
    .from("donations")
    .update({ status: "success", paid_at: new Date().toISOString() })
    .eq("id", donation.id)
    .neq("status", "success")
    .select("id");

  if (updated && updated.length > 0) {
    // Recompute raised total from successful donations (robust against double counting).
    const { data: rows } = await admin
      .from("donations")
      .select("amount")
      .eq("bill_id", donation.bill_id)
      .eq("status", "success");
    const total = (rows ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
    await admin.from("bills").update({ amount_raised: total }).eq("id", donation.bill_id);
  }

  return json({ received: true });
});
