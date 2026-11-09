import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getSampleBill } from "@/lib/sampleBills";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/bills/$id")({
  head: () => ({ meta: [{ title: "Bill details" }] }),
  component: BillDetailPage,
});

type NormalizedBill = {
  id: string;
  title: string;
  summary: string;
  raised: number;
  goal: number;
  pending: boolean;
};

function firstNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (v === null || v === undefined || v === "") continue;
    const n = typeof v === "string" ? Number(v.replace(/[^0-9.-]/g, "")) : (v as number);
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return 0;
}

function normalize(raw: any): NormalizedBill | null {
  if (!raw || typeof raw !== "object") return null;
  const status = String(raw.status ?? raw.reviewStatus ?? raw.review_status ?? "approved").toLowerCase();
  return {
    id: String(raw.id),
    title: String(raw.title ?? raw.name ?? "Untitled bill"),
    summary: String(raw.summary ?? raw.description ?? raw.story ?? ""),
    raised: firstNumber(
      raw.raised,
      raw.amountRaised,
      raw.raisedAmount,
      raw.amount_raised,
      raw.raised_amount,
      raw.funded,
      raw.fundedAmount,
      raw.funded_amount,
      raw.current_amount,
      raw.currentAmount,
    ),
    goal: firstNumber(
      raw.goal,
      raw.goalAmount,
      raw.amountNeeded,
      raw.needed,
      raw.target,
      raw.targetAmount,
      raw.funding_goal,
      raw.fundingGoal,
      raw.target_amount,
      raw.goal_amount,
      raw.amount_needed,
      raw.amount,
    ),
    pending: status.includes("pending") || raw.pending === true,
  };
}

function naira(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

const AMOUNTS = [1000, 5000, 10000, 25000];

function BillDetailPage() {
  const { id } = Route.useParams();
  const auth = useAuth() as any;
  const user = auth?.user ?? auth?.session?.user ?? null;
  const [bill, setBill] = useState<NormalizedBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      let found: NormalizedBill | null = null;
      // Sample bills first so known fixtures render deterministically.
      try {
        found = normalize((getSampleBill as any)(id));
      } catch {
        found = null;
      }
      if (!found) {
        try {
          const { data } = await (supabase as any).from("bills").select("*").eq("id", id).maybeSingle();
          found = normalize(data);
        } catch {
          found = null;
        }
      }
      if (active) {
        setBill(found);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function confirmDonation() {
    if (!bill || !amount) return;
    if (!user) {
      setMessage("Please sign in to donate.");
      return;
    }
    setSaving(true);
    setMessage(null);
    const { error } = await (supabase as any)
      .from("donations")
      .insert({ bill_id: bill.id, user_id: user.id, amount });
    setSaving(false);
    if (error) {
      setMessage("Could not record donation: " + error.message);
      return;
    }
    setBill({ ...bill, raised: bill.raised + amount });
    setMessage(`Thank you! You donated ${naira(amount)}.`);
    setDonateOpen(false);
    setAmount(null);
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Loading bill…</div>;
  }

  if (!bill) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Bill not found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find a bill with that id.</p>
        <Link to="/discover" className="mt-4 inline-block underline">
          Back to discover
        </Link>
      </div>
    );
  }

  const pct = bill.goal > 0 ? Math.min(100, Math.round((bill.raised / bill.goal) * 100)) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/discover" className="text-sm underline opacity-80">
        ← Back to discover
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{bill.title}</h1>
      {bill.pending && (
        <span className="mt-3 inline-block rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-600">
          Pending review
        </span>
      )}
      <p className="mt-4 text-lg leading-relaxed opacity-90">{bill.summary}</p>

      <section aria-label="Funding progress" className="mt-8 rounded-xl border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Funding progress</h2>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/10"
        >
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span>
            <strong>{naira(bill.raised)}</strong> raised
          </span>
          <span>
            {naira(bill.goal)} goal · {pct}%
          </span>
        </div>
      </section>

      <button
        type="button"
        disabled={bill.pending}
        onClick={() => setDonateOpen(true)}
        className="mt-6 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Donate
      </button>

      {message && (
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      )}

      {donateOpen && (
        <div role="dialog" aria-modal="true" aria-label="Choose an amount" className="mt-6 rounded-xl border p-5">
          <h2 className="text-lg font-semibold">Choose an amount</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                aria-pressed={amount === a}
                className={`rounded-lg border px-4 py-2 ${amount === a ? "border-emerald-600 bg-emerald-600/10" : ""}`}
              >
                {naira(a)}
              </button>
            ))}
          </div>
          {!user && (
            <p className="mt-3 text-sm">
              <Link to="/auth" className="underline">
                Sign in
              </Link>{" "}
              to complete your donation.
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={!amount || saving}
              onClick={confirmDonation}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Processing…" : "Confirm donation"}
            </button>
            <button type="button" onClick={() => setDonateOpen(false)} className="rounded-lg border px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
