import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { formatNaira } from "@/lib/currency";
import { GlowBackdrop } from "@/components/ui/brand";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kross" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { contributions, loading, error, reload } = useApprovedBills();

  if (authLoading) {
    return (
      <main className="relative min-h-dvh px-4 py-10">
        <GlowBackdrop />
        <p className="relative mx-auto w-full max-w-3xl text-muted-foreground">Loading dashboard…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative min-h-dvh px-4 py-10">
        <GlowBackdrop />
        <div className="relative mx-auto w-full max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to see your approved contributions.
          </p>
          <Link to="/" className="mt-6 inline-flex text-sm text-primary">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh px-4 py-10">
      <GlowBackdrop />
      <div className="relative mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Approved contributions</h2>
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
            >
              Refresh
            </button>
          </div>

          {loading ? <p className="mt-3 text-sm text-muted-foreground">Loading contributions…</p> : null}
          {error ? (
            <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {!loading && !error && contributions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No approved contributions yet.</p>
          ) : null}

          {contributions.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {contributions.map((contribution) => (
                <li
                  key={contribution.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm"
                >
                  <span className="font-medium">
                    {contribution.billTitle ?? contribution.billId}
                  </span>
                  <span>{formatNaira(contribution.amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </main>
  );
}
