import { Link } from '@tanstack/react-router';

import { GradientBand } from '@/components/GradientBand';
import { gradients, interactive, tints, typography } from '@/config/theme';

export interface HomeHeroProps {
  showRequests: boolean;
  onStartSwiping: () => void;
}

const trustItems = [
  'Verified bills',
  'Paid to the provider',
  'Priced in Naira',
] as const;

/**
 * Landing hero — colourful but restrained.
 *
 * The visual shell is the shared `GradientBand` primitive, decorated with two
 * enlarged blurred blobs and a spectrum hairline at the bottom edge. The
 * headline keeps the signature clip-to-text rainbow on the phrase 'pay a
 * bill', with a plain `text-foreground` fallback so unsupported engines still
 * read the copy.
 *
 * Functional contract: the CTA renders 'Start swiping' while the deck is
 * collapsed and 'Hide requests' while it is open, and always forwards
 * `aria-controls='verified-requests'` plus the current `aria-expanded` value.
 * The Discover and Dashboard links keep their original destinations.
 */
export function HomeHero({ showRequests, onStartSwiping }: HomeHeroProps) {
  return (
    <GradientBand accent='rose' className='relative overflow-hidden border-border/60'>
      {/* Decorative sunset blob — static, pointer-events-none, aria-hidden. */}
      <div
        aria-hidden='true'
        className={`pointer-events-none absolute -right-24 -top-28 size-72 rounded-full opacity-30 blur-3xl sm:-right-36 sm:-top-36 sm:size-[26rem] sm:opacity-40 lg:size-[30rem] ${gradients.heroSunset}`}
      />

      {/* Decorative brand-mark blob — the counterweight to the sunset blob. */}
      <div
        aria-hidden='true'
        className={`pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full opacity-25 blur-3xl sm:-bottom-32 sm:-left-28 sm:size-96 sm:opacity-35 ${gradients.brandMark}`}
      />

      {/* Spectrum hairline pinned to the bottom edge of the band. */}
      <span
        aria-hidden='true'
        className={`absolute inset-x-0 bottom-0 h-0.5 ${gradients.spectrum}`}
      />

      <div className='relative px-5 py-10 sm:px-9 sm:py-14 lg:px-12'>
        {/* Eyebrow pill with a spectrum identity dot. */}
        <p
          className={`inline-flex items-center gap-2 rounded-full border border-[hsl(var(--brand-rose)/0.35)] px-3 py-1 shadow-sm ${tints.roseSoft}`}
        >
          <span
            aria-hidden='true'
            className={`size-2 rounded-full ${gradients.spectrum}`}
          />
          <span className={typography.eyebrow}>Verified giving, made simple</span>
        </p>

        {/*
         * Clip-to-text rainbow on 'pay a bill'. `text-foreground` is the
         * fallback; the supports variant only becomes transparent when the
         * engine actually supports background-clip: text.
         */}
        <h1 className={`mt-5 ${typography.display}`}>
          Swipe right to{' '}
          <span
            className={`${gradients.spectrum} bg-clip-text text-foreground supports-[background-clip:text]:text-transparent`}
          >
            pay a bill
          </span>
        </h1>

        <span
          aria-hidden='true'
          className={`mt-5 block h-1.5 w-40 rounded-full ${gradients.spectrum}`}
        />

        <p className={`mt-5 max-w-2xl ${typography.body}`}>
          Chief matches every request to a verified utility account, so your
          swipe clears a real bill and pays the provider directly in Naira.
        </p>

        <div className='mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
          <button
            type='button'
            onClick={onStartSwiping}
            aria-controls='verified-requests'
            aria-expanded={showRequests}
            className={`${interactive.primaryButton} ${interactive.focusRing}`}
          >
            {showRequests ? 'Hide requests' : 'Start swiping'}
          </button>

          <Link
            to='/discover'
            className={`${interactive.secondaryButton} ${interactive.focusRing}`}
          >
            Discover
          </Link>

          <Link
            to='/dashboard'
            className={`${interactive.secondaryButton} ${interactive.focusRing}`}
          >
            Dashboard
          </Link>
        </div>

        {/* Compact trust strip: three quiet reassurances under the CTAs. */}
        <ul className='mt-7 flex flex-wrap items-center gap-x-5 gap-y-2'>
          {trustItems.map((item) => (
            <li
              key={item}
              className={`inline-flex items-center gap-2 ${typography.caption}`}
            >
              <span
                aria-hidden='true'
                className={`size-1.5 rounded-full ${gradients.spectrum}`}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </GradientBand>
  );
}

export default HomeHero;
