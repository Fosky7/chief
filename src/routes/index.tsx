import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { formatNaira, fundedPercent } from "@/lib/currency";
import {
  CategoryBadge,
  GlowBackdrop,
  GradientButton,
  ProgressBar,
  SectionHeading,
  StatCard,
} from "@/components/ui/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Chief — Pay a bill with a swipe" }],
  }),
  component: HomePage,
});

/** Path of the bill submission page (proof upload form). */
const SUBMIT_BILL_PATH = "/bills/new";

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
    id: "ada-school-fees",
    title: "Ada's final-year school fees",
    category: "Education",
    city: "Enugu",
    raised: 185000,
    goal: 250000,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    category: "Health",
    city: "Ibadan",
    raised: 420000,
    goal: 600000,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "single-mum-rent",
    title: "Rent for a single mum of three",
    category: "Housing",
    city: "Lagos",
    raised: 90000,
    goal: 350000,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
  },
];

type Bill = (typeof featured)[number];

/** Per-step visual tint, mapped to brand tokens. */
const stepTints = [
  "bg-brand-violet/12 text-brand-violet ring-brand-violet/25",
  "bg-brand-coral/12 text-brand-coral ring-brand-coral/25",
  "bg-brand-saffron/15 text-brand-saffron ring-brand-saffron/30",
];

const donorInitials = [
  { initials: "AO", tone: "bg-brand-violet" },
  { initials: "TB", tone: "bg-brand-magenta" },
  { initials: "CN", tone: "bg-brand-coral" },
  { initials: "FK", tone: "bg-cat-health" },
];

function StepIcon({ index }: { index: number }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (index === 0) {
    return (
      <svg {...common}>
        <path d="M4 12h16" />
        <path d="m15 7 5 5-5 5" />
        <path d="m9 7-5 5 5 5" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 2 8.5c0 2.200 1.5 4 3 5.5l7 7Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

/** Image wrapper with a fixed aspect ratio and gradient fallback so failed loads never shift layout. */
function BillImage({ bill, className, eager }: { bill: Bill; className?: string; eager?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-brand-gradient ${className ?? ""}`}>
      <img
        src={bill.image}
        alt={bill.title}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
    </div>
  );
}

function HeroCardStack() {
  const [top, second, third] = featured;
  const topPct = fundedPercent(top.raised, top.goal);

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-sm sm:h-[480px]" aria-label="Example bill cards" role="group">
      <div
        aria-hidden="true"
        className="glass shadow-elegant absolute inset-x-6 top-6 overflow-hidden rounded-3xl"
        style={{ transform: "rotate(6deg)" }}
      >
        <BillImage bill={third} className="aspect-[4/3]" />
        <div className="h-28" />
      </div>
      <div
        aria-hidden="true"
        className="glass shadow-elegant absolute inset-x-4 top-3 overflow-hidden rounded-3xl"
        style={{ transform: "rotate(-6deg)" }}
      >
        <BillImage bill={second} className="aspect-[4/3]" />
        <div className="h-28" />
      </div>

      <div className="animate-float absolute inset-x-0 top-0">
        <article className="ring-gradient shadow-elegant overflow-hidden rounded-3xl bg-card">
          <BillImage bill={top} className="aspect-[4/3]" eager />
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <CategoryBadge category={top.category} />
              <span className="text-xs font-medium text-muted-foreground">{top.city}</span>
            </div>
            <h3 className="text-lg font-semibold leading-snug text-foreground">{top.title}</h3>
            <ProgressBar value={top.raised} goal={top.goal} label={`${top.title} funding progress`} />
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
              <span className="font-semibold text-foreground">{formatNaira(top.raised)}</span>
              <span className="text-muted-foreground">
                {topPct}% of {formatNaira(top.goal)}
              </span>
            </div>
          </div>
        </article>

        <span
          aria-hidden="true"
          className="glass shadow-elegant absolute -left-4 top-1/3 inline-flex -rotate-6 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-destructive sm:-left-8"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/15">✕</span>
          Skip
        </span>
        <span
          aria-hidden="true"
          className="glass shadow-elegant absolute -right-4 top-[22%] inline-flex rotate-6 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-success sm:-right-8"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">✓</span>
          Help
        </span>
      </div>
    </div>
  );
}

function Section({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={`mx-auto max-w-6xl px-4 ${className ?? ""}`}>
      {children}
    </section>
  );
}

function HomePage() {
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative isolate">
        <GlowBackdrop />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 md:grid-cols-2 md:pb-24 md:pt-20">
          <div className="animate-fade-up">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cat-health opacity-70 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cat-health" />
              </span>
              Verified bills · Real people
            </span>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Pay a bill with a <span className="text-brand-gradient italic">swipe</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Chief connects people with urgent rent, school and hospital bills to donors who want
              to help. Every bill is checked by our team before it goes live, so your money goes
              exactly where it should.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <GradientButton to="/discover" size="lg">
                Start swiping
              </GradientButton>
              <Link
                to="/discover"
                data-testid="home-discover-link"
                className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                Discover
              </Link>
              <a
                href={SUBMIT_BILL_PATH}
                data-testid="home-submit-bill-link"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                Submit a bill
              </a>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
              >
                Sign in here
              </Link>
              <span aria-hidden="true" className="mx-2">·</span>
              <Link
                to="/sign-in"
                className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
              >
                Donor sign-in
              </Link>
            </p>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3" aria-hidden="true">
                {donorInitials.map((d) => (
                  <span
                    key={d.initials}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-primary-foreground ring-2 ring-background ${d.tone}`}
                  >
                    {d.initials}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">3,870 kind donors</span> already giving
              </p>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
            <HeroCardStack />
          </div>
        </div>
      </section>

      {/* Stats band */}
      <Section label="Sample stats" className="py-6">
        <div className="bg-brand-gradient shadow-elegant relative isolate overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/25" />
          <div className="grid gap-5 sm:grid-cols-3">
            {stats.map((s) => (
              <StatCard
                key={s.label}
                value={s.value}
                label={s.label}
                className="border-white/20 bg-white/10 shadow-none [&>div:first-child]:bg-none [&>div:first-child]:text-white [&>div:last-child]:text-white/90"
              />
            ))}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="py-20">
        <SectionHeading eyebrow="Simple by design" title="How it works" />
        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-12 hidden border-t-2 border-dotted border-primary/30 md:block"
          />
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="glass shadow-elegant animate-fade-up relative rounded-3xl p-7"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset ${stepTints[i]}`}>
                  <StepIcon index={i} />
                </div>
                <span className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-primary-foreground shadow-elegant">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Featured bills */}
      <Section className="pb-20">
        <SectionHeading
          eyebrow="Live now"
          title="Bills people are paying today"
          action={
            <Link
              to="/discover"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Discover all bills <span aria-hidden="true">→</span>
            </Link>
          }
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b) => {
            const pct = fundedPercent(b.raised, b.goal);
            return (
              <article
                key={b.title}
                className="group glass shadow-elegant overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <div className="relative">
                  <BillImage bill={b} className="aspect-video" />
                  <div className="absolute left-4 top-4">
                    <CategoryBadge category={b.category} className="bg-card/90 backdrop-blur" />
                  </div>
                  <span className="bg-brand-gradient absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-elegant">
                    {pct}% funded
                  </span>
                </div>
                <div className="p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{b.city}</div>
                  <h3 className="mt-1.5 text-lg font-semibold leading-snug text-foreground">{b.title}</h3>
                  <ProgressBar value={b.raised} goal={b.goal} className="mt-5" label={`${b.title} funding progress`} />
                  <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                    <span className="font-semibold text-foreground">{formatNaira(b.raised)}</span>
                    <span className="text-muted-foreground">of {formatNaira(b.goal)}</span>
                  </div>
                  <Link
                    to="/bills/$id"
                    params={{ id: b.id }}
                    aria-label={`View bill: ${b.title}`}
                    className="mt-5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 -ml-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    View bill <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="pb-24">
        <div className="glass ring-gradient shadow-elegant relative isolate overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12">
          <GlowBackdrop className="opacity-70" />
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Make it count</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
            Someone&apos;s bill could be paid today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Every naira goes straight to a verified bill. Give a little, change a lot.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <GradientButton to="/discover" size="lg">
              Start helping now <span aria-hidden="true">→</span>
            </GradientButton>
            <a
              href={SUBMIT_BILL_PATH}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              Need help? Submit a bill
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Returning donor?{" "}
            <Link
              to="/sign-in"
              className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              Sign in to your account
            </Link>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            On the verification team?{" "}
            <Link
              to="/admin"
              data-testid="home-admin-link"
              className="font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              Open the admin dashboard
            </Link>
          </p>
        </div>
      </Section>
    </div>
  );
}