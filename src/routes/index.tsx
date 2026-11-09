import { createFileRoute, Link } from "@tanstack/react-router";
import { GlowBackdrop, GradientButton, StatCard } from "@/components/ui/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chief — Pay a bill with a swipe" },
      {
        name: "description",
        content:
          "Swipe through verified bills and help real people pay rent, school fees and hospital bills.",
      },
    ],
  }),
  component: HomePage,
});

/** The three beats of the product, shown under the hero. */
const steps = [
  {
    title: "Discover verified bills",
    body: "Every submission is checked by a moderator before it reaches the deck, so the people you meet are real.",
  },
  {
    title: "Swipe or give",
    body: "Skip the bills you can't help with, then give what you can to the ones that move you.",
  },
  {
    title: "Reach the biller",
    body: "Rent, school fees, hospital and utility bills are paid straight to the biller — never into a middleman's pocket.",
  },
];

const numbers = [
  { value: "100%", label: "Bills reviewed before they go live" },
  { value: "Naira", label: "Payments settled securely through Paystack" },
  { value: "Real", label: "People behind every bill in the deck" },
];

/**
 * Home page.
 *
 * The landing view introduces the swipe deck and links into the product:
 * browsing bills, joining the community, and — for the people who keep the
 * queue honest — the Module 5 moderation workspace at /admin.
 */
function HomePage() {
  return (
    <div className="relative isolate">
      <GlowBackdrop className="opacity-70" />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <section className="animate-fade-up max-w-3xl">
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">
            Verified bills · Real people
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Pay a bill with a swipe
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Swipe through verified bills from people across Nigeria and help cover the rent,
            school fees, hospital stays and utility payments that can't wait.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GradientButton to="/discover" size="lg">
              Browse bills
            </GradientButton>
            <Link
              to="/auth"
              className="glass focus-visible:ring-ring inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2"
            >
              Join the community
            </Link>
          </div>
        </section>

        <section aria-labelledby="how-heading" className="mt-16">
          <h2 id="how-heading" className="font-display text-2xl font-semibold">
            How Chief works
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="glass shadow-elegant animate-fade-up rounded-2xl p-6"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="bg-brand-gradient inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-label="Why Chief" className="mt-12 grid gap-4 sm:grid-cols-3">
          {numbers.map((item) => (
            <StatCard
              key={item.label}
              value={item.value}
              label={item.label}
              className="animate-fade-up bg-brand-violet/10"
            />
          ))}
        </section>

        <section
          aria-labelledby="moderation-heading"
          className="glass shadow-elegant animate-fade-up mt-12 flex flex-col gap-5 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="min-w-0">
            <h2 id="moderation-heading" className="font-display text-2xl font-semibold">
              Moderation
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Volunteer reviewers check each invoice and biller before it reaches the deck, then mark
              funded bills as paid. The review queue is open to moderator accounts only.
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-brand-gradient shadow-elegant inline-flex shrink-0 items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Admin review
          </Link>
        </section>
      </main>
    </div>
  );
}
