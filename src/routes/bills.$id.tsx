import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/currency";
import { normalizeBill, type AdminQueueBill } from "@/services/admin";

function money(value: number): string {
  try {
    const formatted = formatNaira(value as any);
    if (typeof formatted === "string" && formatted.trim().length > 0) return formatted;
  } catch {
    /* fall back to a plain currency string */
  }
  return `₦${value.toLocaleString()}`;
}

export const Route = createFileRoute("/bills/$id")({
  head: () => ({
    meta: [
      { title: "Bill details — Chief" },
      { name: "description", content: "Read a bill, follow its funding progress and support it." },
    ],
  }),
  component: BillDetailPage,
});

function BillDetailPage() {
  const { id } = Route.useParams();
  const [bill, setBill] = useState<AdminQueueBill | null>(null);
  const [donationTotal, setDonationTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const { data, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (billError) {
      setError(billError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("This bill could not be found.");
      setLoading(false);
      return;
    }

    setBill(normalizeBill(data));

    const { data: donations } = await supabase
      .from("donations")
      .select("amount")
      .eq("bill_id", id);

    const total = (donations ?? []).reduce(
      (sum: number, row: any) => sum + (Number(row?.amount) || 0),
      0,
    );

    setDonationTotal(total);
    setError(null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data?.user) {
        window.location.replace(`/auth?redirect=${encodeURIComponent(`/bills/${id}`)}`);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`bill-${id}-donations`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "donations", filter: `bill_id=eq.${id}` },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, load]);

  const donate = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter a donation amount greater than zero.");
      return;
    }

    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("donations").insert({
      bill_id: id,
      amount: value,
      user_id: auth?.user?.id ?? null,
    });
    setSubmitting(false);

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    setAmount("");
    setMessage("Thanks! Your donation was recorded.");
    await load();
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-500">Loading bill…</p>
      </main>
    );
  }

  if (error || !bill) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Bill details</h1>
        <p className="mt-3 text-sm text-rose-600">{error ?? "This bill could not be found."}</p>
        <Link to="/discover" className="mt-6 inline-block text-sm font-semibold text-indigo-600">
          Back to discover
        </Link>
      </main>
    );
  }

  const raised = Math.max(bill.raised_amount, donationTotal);
  const target = bill.target_amount;
  const percent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link to="/discover" className="text-sm font-semibold text-indigo-600">
        ← Back to discover
      </Link>

      <header className="mt-4">
        <h1 data-testid="bill-title" className="text-3xl font-bold text-slate-900">
          {bill.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-900">Chamber: </span>
            <span data-testid="bill-chamber">{bill.chamber ?? "Not specified"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-900">Sponsor: </span>
            <span data-testid="bill-sponsor">{bill.sponsor ?? "Unknown sponsor"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-900">Status: </span>
            <span data-testid="bill-status" className="capitalize">
              {bill.status}
            </span>
          </p>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h2>
        <p data-testid="bill-summary" className="mt-2 text-sm leading-relaxed text-slate-700">
          {bill.summary ?? "No summary provided."}
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Donation progress
        </h2>
        <p data-testid="bill-raised" className="mt-3 text-2xl font-bold text-slate-900">
          {money(raised)}
          <span className="ml-2 text-sm font-medium text-slate-500">Raised of {money(target)}</span>
        </p>
        <div
          data-testid="bill-progress"
          className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-500">{percent}% funded</p>

        <form onSubmit={donate} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-medium text-slate-700">
            Donation amount
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Recording…" : "Donate"}
          </button>
        </form>
        {message ? (
          <p role="status" className="mt-3 text-sm text-slate-600">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
