import { createFileRoute, Link } from "@tanstack/react-router";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { formatNaira } from "@/lib/currency";

function money(value: number): string {
  try {
    const formatted = formatNaira(value as any);
    if (typeof formatted === "string" && formatted.trim().length > 0) return formatted;
  } catch {
    /* fall back to a plain currency string */
  }
  return `₦${value.toLocaleString()}`;
}

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills — Chief" },
      { name: "description", content: "Swipe through approved bills and support the ones you care about." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { bills, loading, error } = useApprovedBills();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Discover bills</h1>
        <Link to="/" className="text-sm font-semibold text-indigo-600">
          Back to home
        </Link>
      </header>

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading bills…</p> : null}
      {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

      {!loading && !error && bills.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No approved bills yet. Check back after the moderation queue clears.
        </p>
      ) : null}

      <ul className="mt-6 space-y-4">
        {bills.map((bill) => {
          const percent =
            bill.target_amount > 0
              ? Math.min(100, Math.round((bill.raised_amount / bill.target_amount) * 100))
              : 0;

          return (
            <li key={bill.id}>
              <Link
                to="/bills/$id"
                params={{ id: bill.id }}
                data-testid="discover-bill-card"
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{bill.title}</h2>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    {bill.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {bill.chamber ?? "Chamber not set"} · {bill.sponsor ?? "Unknown sponsor"}
                </p>
                {bill.summary ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {bill.summary}
                  </p>
                ) : null}
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Raised</span> {money(bill.raised_amount)} of{" "}
                    {money(bill.target_amount)} ({percent}%)
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
