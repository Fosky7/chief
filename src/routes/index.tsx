import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, ShieldCheck } from "lucide-react";
import { CategoryBadge, GradientButton, SectionHeading, StatCard } from "@/components/ui/brand";
import { formatNaira } from "@/lib/currency";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chief — fund the bills that matter" },
      {
        name: "description",
        content:
          "Chief helps neighbours chip in on real bills — rent, school fees, hospital costs — and lets a small review team approve each bill before it goes live.",
      },
    ],
  }),
  component: HomePage,
});

const highlights = [
  {
    title: "Real bills, real proof",
    body: "Every bill is submitted with a photo of the document and the amount owed, so donors know exactly where their money goes.",
  },
  {
    title: "Reviewed before it goes live",
    body: "A small review team checks each submission for duplicates and clarity before anyone can donate to it.",
  },
  {
    title: "Paid straight to the biller",
    body: "Once a bill is fully funded, the review team pays the biller directly and marks it as paid.",
  },
];

const featuredBills = [
  {
    id: "sample-malaria",
    title: "Malaria treatment for Amina's twins",
    category: "health",
    location: "Kano",
    needed: 180000,
    raised: 126000,
  },
  {
    id: "sample-school-fees",
    title: "Final year school fees for Chidi",
    category: "education",
    location: "Enugu",
    needed: 250000,
    raised: 100000,
  },
  {
    id: "sample-rent",
    title: "One year rent for the Okafor family",
    category: "housing",
    location: "Lagos",
    needed: 600000,
    raised: 450000,
  },
];

export function HomePage() {
  return (
    <div className="relative isolate">
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <section className="glass shadow-elegant relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-card/40" />
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">
            Community bill funding
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Pay a bill with a swipe
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Chief turns a stack of unpaid bills into a transparent, reviewed list the whole
            community can chip in on. Small amounts add up fast when everyone can see the
            progress.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GradientButton to="/discover" size="lg">
              Start swiping
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </GradientButton>
            <GradientButton to="/discover" size="lg" variant="ghost">
              Discover bills
            </GradientButton>
            <GradientButton to="/auth" size="lg" variant="ghost">
              Post a bill
            </GradientButton>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <StatCard value={formatNaira(1000000)} label="Funded this month" />
            <StatCard value={formatNaira(48000)} label="Average gift" />
            <StatCard value="100%" label="Bills reviewed before going live" />
          </div>
        </section>

        <section id="how-it-works" className="mt-16">
          <SectionHeading eyebrow="How it works" title="Three steps, zero guesswork" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="glass shadow-elegant rounded-2xl p-6"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Live queue"
            title="Bills people are paying today"
            action={
              <Link
                to="/discover"
                className="text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
              >
                See all bills
              </Link>
            }
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {featuredBills.map((bill) => {
              const pct = bill.needed > 0 ? Math.min(100, Math.round((bill.raised / bill.needed) * 100)) : 0;
              return (
                <article
                  key={bill.id}
                  className="glass shadow-elegant flex flex-col justify-between rounded-2xl p-6"
                >
                  <div>
                    <CategoryBadge category={bill.category} />
                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-foreground">
                      <Link
                        to="/bills/$id"
                        params={{ id: bill.id }}
                        className="transition-colors hover:text-primary"
                      >
                        {bill.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{bill.location}</p>
                  </div>
                  <div className="mt-5">
                    <div
                      role="progressbar"
                      aria-label={`Funding progress for ${bill.title}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={pct}
                      className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="bg-brand-gradient h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {formatNaira(bill.raised)}{" "}
                      <span className="font-normal text-muted-foreground">
                        raised of {formatNaira(bill.needed)}
                      </span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-16 grid gap-6 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-elegant sm:grid-cols-[1.4fr_1fr] sm:p-10">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Keeping the queue honest
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Before a bill reaches donors it sits in the review queue. Reviewers approve the ones
              that check out, reject duplicates, and mark fully funded bills as paid once the
              biller has been settled. Every action is listed with the bill it belongs to, so the
              queue stays easy to audit.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-2xl bg-brand-gradient p-6 text-primary-foreground">
            <p className="text-sm font-medium text-white/85">Reviewer or auditor?</p>
            <GradientButton to="/admin" variant="ghost" size="md" className="w-full">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Open the review queue
            </GradientButton>
            <GradientButton to="/auth" variant="ghost" size="md" className="w-full">
              Reviewer sign in
            </GradientButton>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
