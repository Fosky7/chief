import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chief — Fund the bills that matter" },
      {
        name: "description",
        content:
          "Chief is a community funding app for everyday bills in Nigeria. Swipe through verified bills, see exactly how much is needed and give in seconds.",
      },
    ],
  }),
  component: HomePage,
});

const howItWorks = [
  {
    title: "Swipe through real bills",
    body: "Verified bills from real people — hospital runs, school fees and rent — with photos and proof attached.",
  },
  {
    title: "See what is still needed",
    body: "Every card shows the amount needed, the amount already raised and a live progress bar.",
  },
  {
    title: "Give in a few taps",
    body: "Pick an amount when a bill moves you. Small gifts from many people close real gaps.",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(45,212,191,0.18),transparent_60%)]" />

      <main className="relative mx-auto w-full max-w-5xl px-5 pt-14 pb-24 sm:px-8">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-300">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            Community funded bills
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Real bills.
            <span className="block bg-gradient-to-r from-teal-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
              Real people. Real help.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Chief puts verified bills in front of you in a simple swipe deck. See the photo, the story and the exact
            amount still needed — then decide if you want to help close the gap.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/discover"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 px-7 py-3.5 text-base font-bold text-[#04201B] shadow-lg shadow-teal-500/25 transition hover:brightness-110 sm:w-auto"
            >
              Discover bills
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              to="/discover"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-7 py-3.5 text-base font-semibold text-slate-200 transition hover:border-teal-400/50 hover:text-white sm:w-auto"
            >
              See open bills
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {howItWorks.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left backdrop-blur"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/15 text-teal-300">
                <Check className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-14 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/70 to-teal-950/40 p-7 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Someone&apos;s bill is one swipe away</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Flip through approved bills, skip the ones that are not for you and give to the ones that are. Every naira
            is tracked against the bill it was raised for.
          </p>
          <Link
            to="/discover"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-base font-bold text-slate-900 transition hover:bg-teal-200"
          >
            Discover bills
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
