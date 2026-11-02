import { useId } from 'react';

import { gradients, layout, stepGradient, tints, typography } from '@/config/theme';

/**
 * Three restrained value pillars introduced between the verified-requests deck
 * and the "How it works" explainer.
 *
 * Purely presentational: no props, no state, no data dependencies. Every
 * colour comes from the shared token layer (`tints.*`, `gradients.*`,
 * `stepGradient()`), so light/dark parity and the brand ramp stay in
 * `src/config/theme.ts`.
 *
 * The section is `contained` (`layout.container` + `layout.section`) and uses
 * `<section aria-labelledby>` with a real, generated heading id so it composes
 * safely into any route without colliding with another instance's ids.
 */
interface ValuePillar {
  /** Short pillar title, rendered with the shared subheading scale. */
  title: string;
  /** One or two lines of supporting copy. */
  copy: string;
  /** Soft brand tint used as the pillar surface. */
  tint: string;
}

const pillars: readonly ValuePillar[] = [
  {
    title: 'Matched to a real account',
    copy: 'Every bill is tied to a verified utility account, so nothing enters the deck until the provider confirms it.',
    tint: tints.roseSoft,
  },
  {
    title: 'Paid straight to the provider',
    copy: 'Your swipe settles with the biller directly — no middlemen, no cash hand-offs, no guesswork.',
    tint: tints.amberSoft,
  },
  {
    title: 'Every Naira accounted for',
    copy: 'Amounts are shown in Naira and logged in your giving history the moment a payment clears.',
    tint: tints.indigoSoft,
  },
];

export function HomeValueStrip() {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={`${layout.container} ${layout.section}`}
    >
      {/* Signature spectrum rule above the band, matching the deck + explainer. */}
      <span
        aria-hidden='true'
        className={`block h-1 w-24 rounded-full ${gradients.spectrum}`}
      />

      <h2 id={headingId} className={`mt-5 ${typography.heading}`}>
        Giving built on verified bills
      </h2>

      <p className={`mt-3 max-w-2xl ${typography.body}`}>
        Chief keeps the colourful parts simple: verified requests, direct
        provider payments, and a clear record of every Naira you give.
      </p>

      <ul className='mt-8 grid gap-4 sm:grid-cols-3'>
        {pillars.map((pillar, index) => (
          <li
            key={pillar.title}
            className={`min-w-0 rounded-3xl border border-border/60 p-5 ${pillar.tint}`}
          >
            <span
              aria-hidden='true'
              className={`mb-4 block size-2.5 rounded-full ${stepGradient(index)}`}
            />
            <h3 className={`min-w-0 ${typography.subheading}`}>
              {pillar.title}
            </h3>
            <p className={`mt-2 ${typography.caption}`}>{pillar.copy}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HomeValueStrip;
