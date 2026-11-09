import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/dashboard')({
  head: () => ({ meta: [{ title: 'Dashboard | Kross' }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    }).catch(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Account</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <Link to="/discover" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Discover bills
        </Link>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        {loading ? <p className="text-sm text-muted-foreground">Loading your session...</p> : null}
        {!loading && email ? <p className="text-sm">Signed in as {email}</p> : null}
        {!loading && !email ? (
          <p className="text-sm">
            You are browsing as a guest. <Link to="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link> to track bills.
          </p>
        ) : null}
      </section>

      <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
        <Link to="/admin" className="rounded-md border px-4 py-2">Admin review</Link>
        <Link to="/discover" className="rounded-md border px-4 py-2">Discover</Link>
      </div>
    </main>
  );
}
