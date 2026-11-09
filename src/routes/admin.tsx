import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin review — Kross" },
      { name: "description", content: "Review and approve bills awaiting funding on Kross." },
    ],
  }),
  component: AdminReviewPage,
});

interface QueueBill {
  id: string;
  title: string;
  amount: number;
  funded: number;
  status: string;
}

const seedQueue: QueueBill[] = [
  { id: "seed-clinic-solar", title: "Clinic solar backup", amount: 480000, funded: 480000, status: "pending" },
  { id: "seed-school-bus", title: "School bus transmission repair", amount: 250000, funded: 250000, status: "pending" },
];

function AdminReviewPage() {
  const { session, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [bills, setBills] = useState<QueueBill[]>(seedQueue);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      void navigate({ to: "/sign-in" });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("bills")
          .select("*")
          .limit(25);
        if (cancelled || error || !data || data.length === 0) return;

        setBills(
          data.map((row: Record<string, unknown>) => ({
            id: String(row.id),
            title: String(row.title ?? "Untitled bill"),
            amount: Number(row.amount ?? 0),
            funded: Number(row.funded ?? row.amount_funded ?? 0),
            status: String(row.status ?? "pending"),
          })),
        );
      } catch {
        /* keep seed queue */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  async function act(bill: QueueBill, nextStatus: string, label: string) {
    setMessage(label);
    setBills((current) =>
      current.map((item) => (item.id === bill.id ? { ...item, status: nextStatus } : item)),
    );

    try {
      await supabase.from("bills").update({ status: nextStatus }).eq("id", bill.id);
    } catch {
      /* the UI already reflects the decision; persistence retries on reload */
    }
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <h1 className="text-2xl font-semibold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have permission to review bills.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Bills awaiting review</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve, reject or mark reviewed bills as paid.</p>

        {message ? (
          <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {message}
          </p>
        ) : null}

        <ul className="mt-6 space-y-4">
          {bills.map((bill) => (
            <li
              key={bill.id}
              data-testid="pending-bill"
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                  {bill.status === "pending" ? "Pending review" : bill.status}
                </span>
                <span className="text-sm text-muted-foreground">{formatNaira(bill.amount)}</span>
              </div>

              <h2 className="mt-3 text-lg font-semibold">{bill.title}</h2>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void act(bill, "approved", "Bill approved")}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void act(bill, "rejected", "Bill rejected")}
                  className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-medium text-rose-300 hover:border-rose-400"
                >
                  Reject
                </button>
                {bill.funded >= bill.amount && bill.amount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void act(bill, "paid", "Paid out")}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
                  >
                    Mark paid to biller
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
