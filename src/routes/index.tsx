import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, ShieldCheck } from "lucide-react";
import { NavBar } from "@/components/NavBar";

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

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-12">
        <section className="rounded-3xl bg-slate-900 px-6 py-12 text-white shadow-xl sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Community bill funding
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Fund the bills that matter, one neighbour at a time.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            Chief turns a stack of unpaid bills into a transparent, reviewed list the whole
            community can chip in on. Small amounts add up fast when everyone can see the
            progress.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin review
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              How it works <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section id="how-it-works" className="mt-14">
          <h2 className="text-xl font-semibold">How Chief works</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[1.4fr_1fr] sm:p-8">
          <div>
            <h2 className="text-xl font-semibold">Keeping the queue honest</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Before a bill reaches donors it sits in the review queue. Reviewers approve the
              ones that check out, reject duplicates, and mark fully funded bills as paid once
              the biller has been settled. Every action is listed with the bill it belongs to, so
              the queue stays easy to audit.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">Reviewer or auditor?</p>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              <ShieldCheck className="h-4 w-4" />
              Open the review queue
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
