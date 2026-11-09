import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type DiscoverBill = {
  id: string;
  title: string;
  description?: string | null;
  amount?: number | null;
  status?: string | null;
  biller_name?: string | null;
};

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
  head: () => ({
    meta: [
      { title: "Discover bills | KrossBuild" },
      { name: "description", content: "Browse bills that need support." },
    ],
  }),
});

function DiscoverPage() {
  const [bills, setBills] = useState<DiscoverBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setBills((data ?? []) as DiscoverBill[]);
      }
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Discover bills</h1>
      <p className="mt-2 text-sm text-slate-600">
        Swipe through bills that need support. Raised funds go straight to the biller once approved.
      </p>

      {loading ? <p className="mt-6 text-sm text-slate-600">Loading bills…</p> : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!loading && !error && bills.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
          No bills to discover yet.
        </p>
      ) : null}

      <ul className="mt-6 space-y-4">
        {bills.map((bill) => (
          <li
            key={bill.id}
            data-testid="discover-bill-card"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{bill.title}</h2>
              {bill.status ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                  {bill.status}
                </span>
              ) : null}
            </div>
            {bill.biller_name ? <p className="text-sm text-slate-600">{bill.biller_name}</p> : null}
            {typeof bill.amount === "number" ? (
              <p className="mt-2 text-xl font-bold text-slate-900">
                ₦{bill.amount.toLocaleString("en-NG")}
              </p>
            ) : null}
            {bill.description ? (
              <p className="mt-2 text-sm text-slate-600">{bill.description}</p>
            ) : null}
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-emerald-700">Raised</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
