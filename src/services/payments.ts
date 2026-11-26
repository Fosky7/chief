/**
 * Payments service — starts a Paystack checkout for a bill donation and
 * verifies the resulting donation against the backend.
 *
 * Flow:
 *  1. `startCheckout` calls the `paystack-initialize` edge function, which
 *     creates a pending donation row (with a Paystack reference) server-side
 *     and returns Paystack's hosted `authorization_url`.
 *  2. The browser is sent to that checkout URL (same tab, or a popup).
 *  3. Paystack calls the `paystack-webhook` edge function, which marks the
 *     donation as paid and increments the bill's raised amount.
 *  4. `verifyDonation` / `subscribeToDonation` read the donation's status so
 *     the UI can show "Thank you for giving".
 *
 * No secrets live here — the Paystack secret key is only used inside the
 * edge functions.
 */
import { supabase } from "@/integrations/supabase/client";

/** Smallest donation accepted, in naira. */
export const MIN_DONATION_NAIRA = 100;

export type DonationStatus = "pending" | "success" | "failed" | "abandoned";

export type CheckoutSession = {
  /** Paystack hosted checkout URL. */
  authorizationUrl: string;
  /** Paystack transaction reference (also stored on the donation row). */
  reference: string;
  accessCode: string | null;
};

export type StartCheckoutInput = {
  billId: string;
  /** Amount in whole naira. Converted to kobo by the edge function. */
  amount: number;
  /** Where Paystack should send the donor afterwards. Defaults to the current page. */
  callbackUrl?: string;
};

export type DonationRecord = {
  id: string;
  billId: string;
  amount: number;
  status: DonationStatus;
  reference: string;
};

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: "invalid_amount" | "not_signed_in" | "initialize_failed" | "verify_failed",
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

type Row = Record<string, unknown>;

// The generated DB types may not yet include the payment-reference columns
// added by the donations migration, so we query through a loosely typed view.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

function normaliseStatus(value: unknown): DonationStatus {
  const s = String(value ?? "pending").toLowerCase();
  if (s === "success" || s === "paid" || s === "completed") return "success";
  if (s === "failed") return "failed";
  if (s === "abandoned" || s === "cancelled") return "abandoned";
  return "pending";
}

function toDonation(row: Row): DonationRecord {
  return {
    id: String(row.id),
    billId: String(row.bill_id ?? ""),
    amount: Number(row.amount ?? 0) || 0,
    status: normaliseStatus(row.status),
    reference: String(row.paystack_reference ?? row.reference ?? ""),
  };
}

/** Returns a user-facing error string, or null when the amount is acceptable. */
export function validateDonationAmount(amount: number, remaining?: number): string | null {
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) return "Enter a whole naira amount.";
  if (amount < MIN_DONATION_NAIRA) return `The minimum donation is ₦${MIN_DONATION_NAIRA}.`;
  if (remaining !== undefined && remaining > 0 && amount > remaining) {
    return "That's more than this bill still needs.";
  }
  return null;
}

/**
 * Creates a Paystack transaction for the bill via the edge function.
 * Requires a signed-in donor.
 */
export async function initializeCheckout(input: StartCheckoutInput): Promise<CheckoutSession> {
  const invalid = validateDonationAmount(input.amount);
  if (invalid) throw new PaymentError(invalid, "invalid_amount");

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new PaymentError("Sign in to donate.", "not_signed_in");
  }

  const callbackUrl =
    input.callbackUrl ?? (typeof window !== "undefined" ? window.location.href.split("?")[0] : undefined);

  const { data, error } = await supabase.functions.invoke("paystack-initialize", {
    body: { bill_id: input.billId, amount: input.amount, callback_url: callbackUrl },
  });

  if (error) {
    throw new PaymentError(error.message || "Could not start checkout.", "initialize_failed");
  }

  const payload = (data ?? {}) as Row;
  const inner = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Row;
  const authorizationUrl = String(inner.authorization_url ?? inner.authorizationUrl ?? "");
  const reference = String(inner.reference ?? "");

  if (!authorizationUrl || !reference) {
    const msg = typeof payload.error === "string" ? payload.error : "Could not start checkout.";
    throw new PaymentError(msg, "initialize_failed");
  }

  return {
    authorizationUrl,
    reference,
    accessCode: inner.access_code ? String(inner.access_code) : null,
  };
}

/**
 * Initializes the transaction and opens Paystack checkout.
 * `mode: "redirect"` (default) navigates the current tab; `"popup"` opens a new window
 * and falls back to redirect if the popup is blocked.
 */
export async function startCheckout(
  input: StartCheckoutInput,
  options: { mode?: "redirect" | "popup" } = {},
): Promise<CheckoutSession> {
  const session = await initializeCheckout(input);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("chief:last-payment-ref", session.reference);
    } catch {
      /* storage unavailable — non-critical */
    }
    if (options.mode === "popup") {
      const win = window.open(session.authorizationUrl, "_blank", "noopener");
      if (!win) window.location.assign(session.authorizationUrl);
    } else {
      window.location.assign(session.authorizationUrl);
    }
  }
  return session;
}

/** Reads the Paystack reference appended to the callback URL, if any. */
export function readCheckoutReturn(search?: string): string | null {
  const query = search ?? (typeof window !== "undefined" ? window.location.search : "");
  const params = new URLSearchParams(query);
  return params.get("reference") ?? params.get("trxref");
}

/** Removes Paystack return params from the address bar without reloading. */
export function clearCheckoutReturn(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("reference");
  url.searchParams.delete("trxref");
  window.history.replaceState(window.history.state, "", url.toString());
}

/** Fetches the donation row for a Paystack reference (owner-scoped by RLS). */
export async function getDonationByReference(reference: string): Promise<DonationRecord | null> {
  const { data, error } = await db
    .from("donations")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (error) throw new PaymentError(error.message || "Could not verify donation.", "verify_failed");
  return data ? toDonation(data as Row) : null;
}

/**
 * Polls the backend until the donation leaves "pending" (the webhook marks it)
 * or attempts run out. Never marks a donation as paid client-side.
 */
export async function verifyDonation(
  reference: string,
  { attempts = 6, intervalMs = 2000 }: { attempts?: number; intervalMs?: number } = {},
): Promise<DonationRecord | null> {
  let last: DonationRecord | null = null;
  for (let i = 0; i < attempts; i++) {
    last = await getDonationByReference(reference);
    if (last && last.status !== "pending") return last;
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, intervalMs));
  }
  return last;
}

/** Subscribes to realtime updates for one donation. Returns an unsubscribe function. */
export function subscribeToDonation(
  reference: string,
  onChange: (donation: DonationRecord) => void,
): () => void {
  const channel = supabase
    .channel(`donation-${reference}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "donations", filter: `paystack_reference=eq.${reference}` },
      (payload) => {
        const row = (payload.new ?? {}) as Row;
        if (row && row.id) onChange(toDonation(row));
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Subscribes to successful donations on a bill (for live "Raised" updates). */
export function subscribeToBillDonations(
  billId: string,
  onDonation: (donation: DonationRecord) => void,
): () => void {
  const channel = supabase
    .channel(`bill-donations-${billId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "donations", filter: `bill_id=eq.${billId}` },
      (payload) => {
        const row = (payload.new ?? {}) as Row;
        if (!row || !row.id) return;
        const donation = toDonation(row);
        if (donation.status === "success") onDonation(donation);
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
