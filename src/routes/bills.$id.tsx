import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSampleBill } from "@/lib/sampleBills";
import { useBillRealtime } from "@/hooks/useBillRealtime";

export const Route = createFileRoute("/bills/$id")({
  head: () => ({ meta: [{ title: "Bill details" }] }),
  component: BillDetailPage,
});

type AnyRecord = Record<string, unknown>;

interface NormalizedBill {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  status: string;
}

function pickString(r: AnyRecord, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

function pickNumber(r: AnyRecord, keys: string[]): number {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function normalize(raw: unknown, id: string): NormalizedBill | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as AnyRecord;
  return {
    id: pickString(r, ["id"], id),
    title: pickString(r, ["title", "name"], "Untitled bill"),
    description: pickString(r, ["description", "summary", "details", "story"]),
    category: pickString(r, ["category", "type"]),
    goal: pickNumber(r, ["goal", "goal_amount", "goalAmount", "target", "amount_needed", "amountNeeded", "needed", "amount"]),
    raised: pickNumber(r, ["raised", "raised_amount", "amount_raised", "amountRaised", "funded", "funded_amount", "fundedAmount"]),
    status: pickString(r, ["status", "review_status", "reviewStatus"], "approved").toLowerCase(),
  };
}

function naira(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

const AMOUNTS = [1000, 5000, 10000, 25000];

function BillDetailPage() {
  const { id } = Route.useParams();
  const [bill, setBill] = useState<NormalizedBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Live updates: merge realtime row changes into the shown bill.
  useBillRealtime(id, (row) => {
    const next = normalize(row, id);
    if (!next) return;
    setBill((prev) => (prev ? { ...prev, ...next } : next));
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      let found: NormalizedBill | null = null;
      let failed = false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("bills")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) {
          // Errors with a database code (e.g. invalid uuid syntax) just mean
          // "not a live bill". Errors without a code are network/transport
          // failures and count as a real load failure.
          const code = (error as { code?: string }).code;
          if (!code) failed = true;
        } else if (data) {
          found = normalize(data, id);
        }
      } catch {
        failed = true;
      }
      if (!found) {
        try {
          found = normalize(getSampleBill(id), id);
        } catch {
          found = null;
        }
      }
      if (!cancelled) {
        setBill(found);
        setLoadError(failed && !found);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div role="status" className="mx-auto max-w-3xl px-4 py-12 text-center text-muted-foreground">Loading bill…</div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">We couldn't load this bill right now. Please try again.</p>
        <Link to="/discover" className="mt-4 inline-block font-medium text-primary underline">
          Back to discover
        </Link>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Bill not found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find a bill with that id.</p>
        <Link to="/discover" className="mt-4 inline-block font-medium text-primary underline">
          Back to discover
        </Link>
      </div>
    );
  }

  const pending = bill.status === "pending" || bill.status === "pending_review" || bill.status === "pending review";
  const percent = bill.goal > 0 ? Math.min(100, Math.round((bill.raised / bill.goal) * 100)) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/discover" className="text-sm text-muted-foreground hover:underline">
        ← Back to discover
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {bill.category && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{bill.category}</span>
        )}
        {pending && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">Pending review</span>
        )}
      </div>
      <h1 className="mt-3 text-3xl font-bold">{bill.title}</h1>
      {bill.description && <p className="mt-4 leading-relaxed text-muted-foreground">{bill.description}</p>}

      <section
        role="region"
        aria-label="Funding progress"
        className="mt-8 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Funding progress</h2>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold">{naira(bill.raised)}</span>
          <span className="text-sm text-muted-foreground">of {naira(bill.goal)} Needed</span>
        </div>
        <div
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{percent}% funded</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setNotice(null);
            setSelected(null);
            setDonateOpen(true);
          }}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Donate
        </button>
        {pending && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Donations open once this bill passes review.
          </p>
        )}
      </section>

      {donateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="donate-title" className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="donate-title" className="text-lg font-semibold">Choose an amount</h2>
              <button type="button" aria-label="Close" onClick={() => setDonateOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setSelected(a)}
                  className={`rounded-xl border px-3 py-2 font-medium ${selected === a ? "border-primary bg-primary/10 text-primary" : ""}`}
                >
                  {naira(a)}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={selected === null}
              onClick={() => setNotice(`Thanks! Payments are coming soon — you chose ${naira(selected ?? 0)}.`)}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
            >
              Continue
            </button>
            {notice && <p className="mt-3 text-sm text-muted-foreground">{notice}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
