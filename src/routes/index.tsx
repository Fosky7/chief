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

/** The three-step story shown under the hero. */
const steps = [
  {
    title: "A bill is submitted",
    body: "Someone shares the bill, the biller and the proof. Nothing goes live until it has been reviewed.",
  },
  {
    title: "Our team verifies it",
    body: "Reviewers check the invoice and the biller so the deck only shows bills that are real.",
  },
  {
    title: "Donors pay the biller",
    body: "Gifts go straight to the biller, never to a middleman. Payments in Naira run through Paystack.",
  },
];

type Role = {
  title: string;
  body: string;
  tint: string;
};

const roles: Role[] = [
  {
    title: "For donors",
    body: "Swipe left to skip, give what you can on the ones that move you. Every naira is tracked against the bill.",
    tint: "bg-brand-violet/10",
  },
  {
    title: "For bill requesters",
    body: "Submit a rent, school, utility or hospital bill for review and let the community help you clear it.",
    tint: "bg-brand-coral/10",
  },
];

function HomePage() {
  return (
    <div className="relative isolate">
      <GlowBackdrop className="opacity-60" />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:pt-20">
        <section className="animate-fade-up">
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">
            Verified bills · Real people
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Pay a bill with a swipe.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Swipe through verified bills and help real people cover rent, school fees and
            hospital bills. Every bill is reviewed before it reaches the deck.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GradientButton to="/discover" size="lg">
              Discover bills
            </GradientButton>
            <Link
              to="/admin"
              data-testid="home-admin-cta"
              className="glass shadow-elegant inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Admin review
            </Link>
            <Link
              to="/sign-in"
              data-testid="home-sign-in-cta"
              className="glass shadow-elegant inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section aria-label="Chief in numbers" className="mt-14 grid gap-4 sm:grid-cols-3">
          <StatCard value="3 steps" label="From submitted bill to paid" className="bg-brand-violet/10" />
          <StatCard value="100%" label="Reviewed by a human" className="bg-brand-coral/10" />
          <StatCard value="₦" label="Paid directly to the biller" className="bg-brand-saffron/15" />
        </section>

        <section className="mt-20" aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="font-display text-3xl font-semibold tracking-tight">
            How Chief works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="glass shadow-elegant rounded-3xl p-6">
                <span
                  aria-hidden="true"
                  className="bg-brand-gradient inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-2" aria-label="Ways to use Chief">
          {roles.map((role) => (
            <article key={role.title} className={`glass shadow-elegant rounded-3xl p-7 ${role.tint}`}>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {role.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{role.body}</p>
            </article>
          ))}
        </section>

        <section className="glass shadow-elegant mt-20 rounded-3xl px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Ready to help someone clear a bill?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Create an account, pick how you want to use Chief and start swiping through
            verified bills today.
          </p>
          <GradientButton to="/auth" size="lg" className="mt-7">
            Create an account
          </GradientButton>
          <p className="mt-5 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/signin"
              data-testid="home-signin-link"
              className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default HomePage;