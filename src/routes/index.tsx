import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, HandCoins, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bill Chief — neighbours paying bills together" },
      {
        name: "description",
        content:
          "Bill Chief helps communities submit, verify and fund real bills for people who need a hand, with an admin review queue behind every request.",
      },
    ],
  }),
  component: HomePage,
});

const highlights = [
  {
    icon: ShieldCheck,
    title: "Proof-checked requests",
    body: "Every bill arrives with a hospital invoice, school receipt or supplier quote before it can be funded.",
  },
  {
    icon: Users,
    title: "Neighbours chip in",
    body: "Small contributions from many people add up — watch each bill's progress bar fill in real time.",
  },
  {
    icon: HandCoins,
    title: "Paid straight to the biller",
    body: "Once a bill is fully funded, admins release the money to the hospital, school or supplier.",
  },
];

function HomePage() {
  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Community bill funding
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          Real bills, verified by people who care.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Bill Chief is a place where someone facing a medical, school or business bill can share it, and neighbours can
          fund it together. Admins review every request before a single naira moves.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Admin review <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-slate-500">Open the queue to approve, reject or pay out bills.</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Are you an admin?</h2>
            <p className="text-sm text-muted-foreground">Review the bills waiting for approval and release funded payouts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-emerald-300"
            >
              Sign in to your account
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              Admin review <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}