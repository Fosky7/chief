import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Chief" }] }),
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
  return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n)}`;
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function donatedBillIds(userId: string): Promise<string[]> {
  for (const col of ["donor_id", "user_id"]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("donations").select("bill_id").eq(col, userId);
    if (!error && data) return data.map((d: Row) => String(d.bill_id));
  }
  return [];
}

function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [bills, setBills] = useState<DashBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUserId(data.session?.user?.id ?? null);
      })
      .catch(() => setUserId(null))
      .finally(() => setChecked(true));
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const ids = [...new Set([...localApprovedIds(), ...(await donatedBillIds(userId))])].filter((id) =>
        UUID_RE.test(id),
      );
      if (ids.length === 0) {
        setBills([]);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any).from("bills").select("*").in("id", ids);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-4xl font-semibold tracking-tight text-foreground">Dashboard</h1>
      {!checked ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !userId ? (
        <div className="glass shadow-elegant rounded-3xl p-8 text-center">
          <p className="mb-5 text-muted-foreground">Sign in to see the bills you've backed and track their progress.</p>
          <Link
            to="/auth"
            className="bg-brand-gradient shadow-elegant inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in to continue
          </Link>
        </div>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading your bills…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : bills.length === 0 ? (
        <div data-testid="dashboard-empty" className="glass shadow-elegant rounded-3xl p-8 text-center">
          <p className="mb-4 text-muted-foreground">You haven't approved any bills yet.</p>
          <Link to="/discover" className="font-semibold text-primary underline-offset-4 hover:underline">
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
                  to="/bills/$id"
                  params={{ id: b.id }}
                  className="glass shadow-elegant block rounded-3xl p-5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-foreground">{b.title}</span>
                    <span className="text-sm text-muted-foreground">{formatAmount(b.goal)}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div className="bg-brand-gradient h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatAmount(b.raised)} raised · {pct}%
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
