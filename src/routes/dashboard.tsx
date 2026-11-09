import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role, loading } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile((data as Record<string, unknown> | null) ?? null));
  }, [user]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-white">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      {loading ? (
        <p className="mt-6 text-white/60" role="status">
          Loading…
        </p>
      ) : !user ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/80">Sign in to see your dashboard.</p>
          <Link
            to="/sign-in"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-2 font-semibold text-slate-950"
          >
            Sign in
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Signed in as</p>
            <p className="mt-1 font-semibold">{user.email}</p>
            {role && <p className="mt-1 text-sm text-white/60">Role: {String(role)}</p>}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-wide text-white/50">Profile</p>
            <p className="mt-1 font-semibold">
              {String((profile?.display_name as string) ?? (profile?.full_name as string) ?? user.email ?? "")}
            </p>
            <Link to="/discover" className="mt-3 inline-block text-sm text-cyan-300 hover:underline">
              Discover bills
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
