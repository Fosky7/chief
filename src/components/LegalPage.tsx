import type { ReactNode } from "react";

export type LegalSection = { heading: string; body: ReactNode };

/** Shared, readable layout for every legal document page. */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
  testId,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  testId: string;
}) {
  return (
    <article data-testid={testId} className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Legal</p>
      <h1 className="mt-2 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
      <p className="mt-6 text-base leading-relaxed text-foreground">{intro}</p>

      <div className="glass shadow-elegant mt-10 space-y-8 rounded-3xl p-6 sm:p-10">
        {sections.map((s, i) => (
          <section key={s.heading} aria-labelledby={`${testId}-s${i}`}>
            <h2 id={`${testId}-s${i}`} className="text-xl font-semibold text-foreground">
              {i + 1}. {s.heading}
            </h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{s.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}

export function legalHead(title: string, description: string) {
  const full = `${title} — Chief`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}

export default LegalPage;
