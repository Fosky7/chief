import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard" }],
  }),
  component: DashboardPage,
});

type Row = Record<string, unknown>;

function naira(n: unknown): string {
  const v = typeof n === "number" ? n : Number(n ?? 0);
  return `₦${(Number.isFinite(v) ? v : 0).toLocaleString("en-NG")}`;
}

function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [approved, setApproved] = useState<Row[]>([]);
  const [donations, setDonations] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setApproved([]);
      setDonations([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("approved_bills")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (active && !error && Array.isArray(data)) setApproved(data);
      } catch {
        /* table may not exist; keep empty */
      }
      try {
        const { data, error } = await (supabase as any)
          .from("donations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (active && !error && Array.isArray(data)) setDonations(data);
      } catch {
        /* keep empty */
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-4 text-sm opacity-70">Loading…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm opacity-80">
            Sign in to see the bills you approved and your donations.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm opacity-70">{session.user.email}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Approved bills</h2>
          {approved.length === 0 ? (
            <p className="mt-3 text-sm opacity-70">
              No approved bills yet. <Link to="/discover" className="underline">Discover bills</Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {approved.map((row, i) => {
                const billId = String(row.bill_id ?? row.id ?? i);
                const title = String(row.title ?? row.bill_title ?? billId);
                return (
                  <li key={String(row.id ?? i)} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <Link to="/bills/$id" params={{ id: billId }} className="hover:underline">
                      {title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Donations</h2>
          {donations.length === 0 ? (
            <p className="mt-3 text-sm opacity-70">No donations yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {donations.map((row, i) => (
                <li
                  key={String(row.id ?? i)}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <span>{String(row.bill_title ?? row.bill_id ?? "Donation")}</span>
                  <span className="font-semibold">{naira(row.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
