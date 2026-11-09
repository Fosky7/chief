import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/bills/$id")({
  head: () => ({
    meta: [
      { title: "Bill details — Kross" },
      { name: "description", content: "See the details of a bill on Kross." },
    ],
  }),
  component: BillDetailPage,
});

interface BillDetail {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  funded?: number;
  status?: string | null;
}

const seedBills: BillDetail[] = [
  {
    id: "seed-clinic-solar",
    title: "Clinic solar backup",
    description: "Keep vaccines cold through outages at the rural clinic.",
    amount: 480000,
    funded: 192000,
    status: "Raised",
  },
  {
    id: "seed-school-bus",
    title: "School bus transmission repair",
    description: "Get 42 pupils back to class with a repaired bus.",
    amount: 250000,
    funded: 75000,
    status: "Raised",
  },
  {
    id: "seed-market-stall",
    title: "Market stall roofing",
    description: "Replace storm-damaged roofing for six traders.",
    amount: 130000,
    funded: 130000,
    status: "Raised",
  },
];

function BillDetailPage() {
  const { id } = Route.useParams();
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const fallback = seedBills.find((bill) => bill.id === id) ?? null;
  const [bill, setBill] = useState<BillDetail | null>(fallback);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/sign-in" });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    let cancelled = false;
    const local = seedBills.find((item) => item.id === id) ?? null;
    setBill(local);
    setNotFound(false);

    void (async () => {
      try {
        const { data, error } = await supabase.from("bills").select("*").eq("id", id).maybeSingle();
        if (cancelled) return;
        if (error) {
          if (!local) setNotFound(true);
          return;
        }
        if (!data) {
          if (!local) setNotFound(true);
          return;
        }
        setBill({
          id: String((data as Record<string, unknown>).id),
          title: String((data as Record<string, unknown>).title ?? "Untitled bill"),
          description: ((data as Record<string, unknown>).description as string | null) ?? null,
          amount: Number((data as Record<string, unknown>).amount ?? 0),
          funded: Number(
            (data as Record<string, unknown>).funded ??
              (data as Record<string, unknown>).amount_funded ??
              0,
          ),
          status: ((data as Record<string, unknown>).status as string | null) ?? "Raised",
        });
      } catch {
        if (!cancelled && !local) setNotFound(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  if (notFound || !bill) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-2xl font-semibold">Bill not found</h1>
          <Link to="/discover" className="mt-4 inline-block text-sm text-emerald-300 hover:underline">
            Back to discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-xl">
        <Link to="/discover" className="text-sm text-emerald-300 hover:underline">
          ← Back to discover
        </Link>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
            {bill.status ?? "Raised"}
          </span>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{bill.title}</h1>
          <p className="mt-3 text-3xl font-bold text-emerald-300">{formatNaira(bill.amount)}</p>

          {bill.description ? (
            <p className="mt-3 text-sm text-muted-foreground">{bill.description}</p>
          ) : null}

          {typeof bill.funded === "number" ? (
            <p className="mt-2 text-xs text-slate-500">Funded so far {formatNaira(bill.funded)}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setNotice("Interest recorded")}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Fund this bill
            </button>
            <button
              type="button"
              onClick={() => setNotice("Saved for later")}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
            >
              Save for later
            </button>
          </div>

          {notice ? (
            <p role="status" className="mt-4 text-sm text-emerald-300">
              {notice}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
