// Paystack initialize: creates a pending donation and returns a Paystack checkout URL.
// Requires an authenticated user (Authorization: Bearer <access token>).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Row = Record<string, unknown>;

function num(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

const MIN_AMOUNT = 100; // Naira

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500);

  // Authenticate the caller.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Sign in to donate" }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user || !user.email) return json({ error: "Sign in to donate" }, 401);

  if (!paystackSecret) return json({ error: "Payments are not configured" }, 500);

  let body: { billId?: unknown; amount?: unknown; callbackUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const billId = typeof body.billId === "string" ? body.billId : "";
  const amount = Math.round(Number(body.amount));
  if (!billId) return json({ error: "Missing bill" }, 400);
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
    return json({ error: `Minimum donation is ₦${MIN_AMOUNT}` }, 400);
  }

  const { data: bill, error: billError } = await admin.from("bills").select("*").eq("id", billId).maybeSingle();
  if (billError || !bill) return json({ error: "Bill not found" }, 404);

  const status = String((bill as Row).status ?? "approved");
  if (status !== "approved") return json({ error: "This bill isn't accepting donations" }, 409);

  const goal = num(bill as Row, ["amount_needed", "goal_amount", "target_amount", "amount", "goal"]);
  const raised = num(bill as Row, ["amount_raised", "raised_amount", "funded_amount", "raised"]);
  const remaining = Math.max(goal - raised, 0);
  if (goal > 0 && remaining <= 0) return json({ error: "This bill is fully funded" }, 409);
  if (goal > 0 && amount > Math.max(remaining, MIN_AMOUNT)) {
    return json({ error: `You can give up to ₦${remaining.toLocaleString("en-NG")}` }, 400);
  }

  const reference = `chief_${crypto.randomUUID().replace(/-/g, "")}`;

  const { data: donation, error: insertError } = await admin
    .from("donations")
    .insert({
      bill_id: billId,
      donor_id: user.id,
      amount,
      status: "pending",
      paystack_reference: reference,
    })
    .select("id")
    .single();
  if (insertError || !donation) {
    return json({ error: "Could not start your donation" }, 500);
  }

  const callbackUrl = typeof body.callbackUrl === "string" && /^https?:\/\//.test(body.callbackUrl)
    ? body.callbackUrl
    : undefined;

  const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: amount * 100, // kobo
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata: { bill_id: billId, donation_id: donation.id, donor_id: user.id },
    }),
  }).catch(() => null);

  const psJson = psRes ? await psRes.json().catch(() => null) : null;
  if (!psRes || !psRes.ok || !psJson?.status) {
    await admin.from("donations").update({ status: "failed" }).eq("id", donation.id);
    return json({ error: psJson?.message ?? "Paystack is unavailable. Please try again." }, 502);
  }

  return json({
    reference,
    donationId: donation.id,
    authorizationUrl: psJson.data.authorization_url,
    accessCode: psJson.data.access_code,
  });
});
