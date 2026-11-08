import { createFileRoute, Link } from "@tanstack/react-router";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { CategoryBadge, ProgressBar } from "@/components/ui/brand";
import { liveSampleBills } from "@/lib/sampleBills";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [{ title: "Discover bills — Chief" }],
  }),
  component: DiscoverPage,
});

// Left accent bar colour per category, using design tokens only.
const accentClass: Record<string, string> = {
  Education: "bg-cat-education",
  Health: "bg-cat-health",
  Housing: "bg-cat-housing",
  Utilities: "bg-cat-utilities",
};

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function DiscoverPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <section className="animate-fade-up">
        <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Verified · Real people</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Discover bills
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Verified bills from people who need a hand right now.</p>
      </section>

      <ul className="mt-10 space-y-5">
        {liveSampleBills.map((b, i) => (
          <li
            key={b.id}
            className="animate-fade-up glass shadow-elegant relative overflow-hidden rounded-2xl p-5 pl-7 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${80 + i * 90}ms` }}
          >
            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${accentClass[b.category] ?? "bg-primary"}`} />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CategoryBadge category={b.category} />
                <h2 className="mt-3 break-words text-xl font-semibold leading-snug">
                  <Link
                    to="/bills/$id"
                    params={{ id: b.id }}
                    className="after:absolute after:inset-0 hover:text-primary focus-visible:outline-none"
                  >
                    {b.title}
                  </Link>
                </h2>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <PinIcon />
                  {b.city}
                </p>
              </div>
              <span className="bg-brand-gradient shrink-0 rounded-full px-3 py-1 text-sm font-bold text-primary-foreground">
                {fundedPercent(b.raised, b.goal)}%
              </span>
            </div>
            <ProgressBar value={b.raised} goal={b.goal} className="mt-4" label={`${b.title} funding progress`} />
            <p className="mt-3 text-sm">
              <span className="font-semibold text-foreground">{formatNaira(b.raised)}</span>
              <span className="text-muted-foreground"> raised of {formatNaira(b.goal)}</span>
            </p>
          </li>
        ))}
      </ul>

      <Link
        to="/"
        className="glass mt-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <span aria-hidden="true">←</span> Back home
      </Link>
    </main>
  );
}
