import { createFileRoute, Link } from "@tanstack/react-router";
import { formatNaira, fundedPercent } from "@/lib/currency";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const stats = [
  { label: "Raised this month", value: formatNaira(1000000) },
  { label: "Bills fully paid", value: "142" },
  { label: "Kind donors", value: "3,870" },
];

const steps = [
  { title: "Swipe", body: "Browse verified bills one card at a time. Swipe right to help, left to skip." },
  { title: "Give", body: "Chip in any amount securely via Paystack — card, bank transfer or USSD." },
  { title: "See it paid", body: "Track progress live and get notified when the bill is settled." },
];

const featured = [
  {
    title: "Ada's final-year school fees",
    category: "Education",
    city: "Enugu",
    raised: 185000,
    goal: 250000,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
  },
  {
    title: "Baba Tunde's hospital bill",
    category: "Health",
    city: "Ibadan",
    raised: 420000,
    goal: 600000,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
  },
  {
    title: "Rent for a single mum of three",
    category: "Housing",
    city: "Lagos",
    raised: 90000,
    goal: 350000,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
  },
];

function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Verified bills · Real people
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Pay a bill with a swipe
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Chief connects people with urgent rent, school and hospital bills to donors who want
            to help. Every bill is checked by our team before it goes live, so your money goes
            exactly where it should.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/discover"
              className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Start swiping
            </Link>
            <Link
              to="/signin"
              className="rounded-lg border border-border bg-background px-5 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Post a bill
            </Link>
          </div>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1607863680198-23d4b2565df0?auto=format&fit=crop&w=900&q=70"
            alt="A smiling person holding a phone"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg"
          />
        </div>
      </section>

      <section aria-label="Sample stats" className="border-y border-border bg-muted/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-border bg-card p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Bills people are paying today</h2>
          <Link to="/discover" className="text-sm font-semibold text-primary hover:underline">
            See all
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b) => {
            const pct = fundedPercent(b.raised, b.goal);
            return (
              <article key={b.title} className="overflow-hidden rounded-xl border border-border bg-card">
                <img src={b.image} alt={b.title} className="aspect-video w-full object-cover" loading="lazy" />
                <div className="p-5">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    {b.category} · {b.city}
                  </div>
                  <h3 className="mt-1 font-semibold">{b.title}</h3>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="font-semibold">{formatNaira(b.raised)}</span>
                    <span className="text-muted-foreground">of {formatNaira(b.goal)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
