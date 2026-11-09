import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills — Kross" },
      { name: "description", content: "Swipe through bills looking for funding on Kross." },
    ],
  }),
  component: DiscoverPage,
});

interface BillCard {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  funded?: number;
  status?: string | null;
  category?: string | null;
}

const seedBills: BillCard[] = [
  {
    id: "seed-clinic-solar",
    title: "Raised: Clinic solar backup",
    description: "Keep vaccines cold through outages at the rural clinic.",
    amount: 480000,
    funded: 192000,
    status: "Raised",
    category: "Health",
  },
  {
    id: "seed-school-bus",
    title: "School bus transmission repair",
    description: "Get 42 pupils back to class with a repaired bus.",
    amount: 250000,
    funded: 75000,
    status: "Raised",
    category: "Education",
  },
  {
    id: "seed-market-stall",
    title: "Market stall roofing",
    description: "Replace storm-damaged roofing for six traders.",
    amount: 130000,
    funded: 130000,
    status: "Raised",
    category: "Trade",
  },
];

function DiscoverPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [bills, setBills] = useState<BillCard[]>(seedBills);
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/sign-in" });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { data, error } = await supabase.from("bills").select("*").limit(20);
        if (cancelled || error || !data || data.length === 0) return;

        setBills(
          data.map((row: Record<string, unknown>) => ({
            id: String(row.id),
            title: String(row.title ?? "Untitled bill"),
            description: (row.description as string | null) ?? null,
            amount: Number(row.amount ?? 0),
            funded: Number(row.funded ?? row.amount_funded ?? 0),
            status: (row.status as string | null) ?? "Raised",
            category: (row.category as string | null) ?? null,
          })),
        );
      } catch {
        /* keep the seed data when the backend is unavailable */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function advance(message?: string) {
    if (message) setNotice(message);
    setIndex((current) => (bills.length ? (current + 1) % bills.length : 0));
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  const bill = bills.length ? bills[index % bills.length] : null;

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight">Discover bills</h1>
        <p className="mt-1 text-sm text-muted-foreground">Swipe left to skip, right to register interest.</p>

        {bill ? (
          <div
            data-testid="bill-card"
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStartX === null) return;
              const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
              setTouchStartX(null);
              if (Math.abs(delta) > 60) advance(delta > 0 ? "Interest recorded" : "Skipped");
            }}
            className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                {bill.status ?? "Raised"}
              </span>
              {bill.category ? (
                <span className="text-xs uppercase tracking-wide text-slate-500">{bill.category}</span>
              ) : null}
            </div>

            <h2 className="mt-4 text-xl font-semibold">{bill.title}</h2>
            {bill.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{bill.description}</p>
            ) : null}

            <p className="mt-4 text-2xl font-bold text-emerald-300">{formatNaira(bill.amount)}</p>
            {typeof bill.funded === "number" ? (
              <p className="mt-1 text-xs text-slate-500">Funded so far {formatNaira(bill.funded)}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => advance("Skipped")}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => advance("Interest recorded")}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Interested
              </button>
            </div>

            <Link
              to="/bills/$id"
              params={{ id: bill.id }}
              className="mt-4 inline-block text-sm text-emerald-300 hover:underline"
            >
              View bill details
            </Link>
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-slate-800 p-4 text-sm text-muted-foreground">
            No bills to review right now.
          </p>
        )}

        {notice ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
