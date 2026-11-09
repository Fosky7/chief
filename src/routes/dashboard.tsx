import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: DashboardPage,
});

type Row = Record<string, unknown>;

type DashBill = { id: string; title: string; goal: number; raised: number };

function num(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function toBill(row: Row): DashBill {
  return {
    id: String(row.id),
    title: String(row.title ?? row.name ?? "Untitled bill"),
    goal: num(row, ["amount_needed", "goal_amount", "target_amount", "amount", "goal"]),
    raised: num(row, ["amount_raised", "raised_amount", "funded_amount", "raised"]),
  };
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function localApprovedIds(): string[] {
  const ids = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !/approv|swipe|right/i.test(key)) continue;
      const parsed = JSON.parse(localStorage.getItem(key) ?? "null");
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "string") ids.add(item);
          else if (item && typeof item === "object" && "id" in item) ids.add(String((item as Row).id));
        }
      }
    }
  } catch {
    /* ignore malformed storage */
  }
  return [...ids];
}

async function donatedBillIds(userId: string): Promise<string[]> {
  for (const col of ["donor_id", "user_id"]) {
    const { data, error } = await supabase.from("donations").select("bill_id").eq(col, userId);
    if (!error && data) return data.map((d: Row) => String(d.bill_id));
  }
  return [];
}

function DashboardPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [bills, setBills] = useState<DashBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id ?? null;
      setUserId(id);
      setChecked(true);
      if (!id) navigate({ to: "/auth" as string });
    });
  }, [navigate]);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const ids = [...new Set([...localApprovedIds(), ...(await donatedBillIds(userId))])].filter(Boolean);
      if (ids.length === 0) {
        setBills([]);
        return;
      }
      const { data, error: err } = await supabase.from("bills").select("*").in("id", ids);
      if (err) throw err;
      setBills((data ?? []).map((r: Row) => toBill(r)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load bills");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    load();
    const channel = supabase
      .channel(`dashboard-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  if (!checked || !userId) {
    return <div className="p-8 text-center text-sm opacity-70">Loading…</div>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your dashboard</h1>
      {loading ? (
        <p className="text-sm opacity-70">Loading your bills…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-500">{error}</p>
      ) : bills.length === 0 ? (
        <div data-testid="dashboard-empty" className="rounded-xl border p-8 text-center">
          <p className="mb-4">You haven't approved any bills yet.</p>
          <Link to={"/discover" as string} className="font-semibold underline">
            Discover bills
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bills.map((b) => {
            const pct = b.goal > 0 ? Math.min(100, Math.round((b.raised / b.goal) * 100)) : 0;
            return (
              <li key={b.id} data-testid="dashboard-bill">
                <Link
                  to={"/bills/$id" as string}
                  params={{ id: b.id } as never}
                  className="block rounded-xl border p-4 hover:shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">{b.title}</span>
                    <span className="text-sm">{formatAmount(b.goal)}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200"
                  >
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs opacity-70">
                    {formatAmount(b.raised)} raised · {pct}%
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
