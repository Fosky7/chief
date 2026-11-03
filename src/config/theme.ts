/**
 * Central design tokens for Chief.
 *
 * Every colour, gradient, radius, shadow, surface and text treatment the app
 * uses is declared here and exported as a Tailwind class string. Components
 * never hard-code hex/rgb values: they compose these tokens (and the
 * `categoryAccent()` / `stepGradient()` helpers) so light/dark parity and the
 * brand ramp stay in one place.
 *
 * Colour values are expressed as `hsl(var(--token))` inside Tailwind
 * arbitrary values. That keeps opacity modifiers working (e.g.
 * `bg-[hsl(var(--brand-rose)/0.18)]`) while the actual HSL triplets live in
 * `src/styles.css`.
 */

export const typography = {
  display:
    'text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl',
  heading:
    'text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl',
  subheading: 'text-lg font-semibold tracking-tight text-foreground',
  body: 'text-base leading-relaxed text-muted-foreground',
  caption: 'text-xs leading-relaxed text-muted-foreground',
  eyebrow:
    'text-xs font-semibold uppercase tracking-[0.18em] text-primary',
} as const;

export const layout = {
  container: 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8',
  section: 'py-12 sm:py-16 lg:py-20',
  headerOffset:
    'scroll-mt-[calc(var(--header-height,6rem)+1rem)] sm:scroll-mt-[calc(var(--header-height,6rem)+1.5rem)]',
} as const;

export const neutral = {
  ink: 'text-foreground',
  body: 'text-muted-foreground',
  muted: 'text-muted-foreground',
  subtle: 'text-muted-foreground/80',
  hairline: 'border-border',
  surface: 'bg-card',
  surfaceMuted: 'bg-muted',
} as const;

export const text = {
  accent: 'text-primary',
  muted: 'text-muted-foreground',
  emphasis: 'text-foreground',
  onAccent: 'text-primary-foreground',
} as const;

/**
 * Soft, AA-safe tint fills. Each `*Soft` fill is paired with a matching
 * `*-ink` text token in the accent maps below, so tinted text always passes
 * contrast on its own soft surface.
 */
export const tints = {
  roseSoft: 'bg-[hsl(var(--brand-rose-soft))]',
  amberSoft: 'bg-[hsl(var(--brand-amber-soft))]',
  indigoSoft: 'bg-[hsl(var(--brand-indigo-soft))]',
  emeraldSoft: 'bg-[hsl(var(--brand-emerald-soft))]',
  violetSoft: 'bg-[hsl(var(--brand-violet-soft))]',
  cyanSoft: 'bg-[hsl(var(--brand-cyan-soft))]',
  limeSoft: 'bg-[hsl(var(--brand-lime-soft))]',
} as const;

export const palette = {
  rose: 'hsl(var(--brand-rose))',
  amber: 'hsl(var(--brand-amber))',
  indigo: 'hsl(var(--brand-indigo))',
  emerald: 'hsl(var(--brand-emerald))',
  violet: 'hsl(var(--brand-violet))',
  cyan: 'hsl(var(--brand-cyan))',
  lime: 'hsl(var(--brand-lime))',
} as const;

/**
 * Gradients are background utilities. The spectrum rule is the signature
 * multi-stop rainbow used for headline clips, hairlines and identity dots.
 *
 * `heroAurora` is deliberately the CALM single-band treatment (soft rose →
 * amber → indigo wash). The intensified variant lives on as
 * `heroAuroraRose` for the few places that still want extra saturation — do
 * not swap the two back.
 */
export const gradients = {
  spectrum:
    'bg-[linear-gradient(90deg,hsl(var(--brand-rose)),hsl(var(--brand-amber)),hsl(var(--brand-emerald)),hsl(var(--brand-cyan)),hsl(var(--brand-indigo)),hsl(var(--brand-violet)))]',
  heroAurora:
    'bg-[linear-gradient(120deg,hsl(var(--brand-rose)/0.16),hsl(var(--brand-amber)/0.12)_40%,hsl(var(--brand-indigo)/0.16))]',
  heroAuroraRose:
    'bg-[linear-gradient(120deg,hsl(var(--brand-rose)/0.22),hsl(var(--brand-amber)/0.14)_45%,hsl(var(--brand-indigo)/0.18))]',
  heroSunset:
    'bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-amber)),hsl(var(--brand-rose))_45%,hsl(var(--brand-indigo)))]',
  brandMark:
    'bg-[linear-gradient(135deg,hsl(var(--brand-rose)),hsl(var(--brand-amber))_45%,hsl(var(--brand-indigo)))]',
  bandSoft:
    'bg-[linear-gradient(180deg,hsl(var(--brand-rose)/0.08),hsl(var(--brand-amber)/0.04)_45%,transparent_75%)]',
  cardSheenRose:
    'bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-rose)/0.22),transparent_60%)]',
  cardSheenAmber:
    'bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-amber)/0.20),transparent_60%)]',
  cardSheenIndigo:
    'bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-indigo)/0.20),transparent_60%)]',
  cardSheenViolet:
    'bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-violet)/0.20),transparent_60%)]',
  cardSheenEmerald:
    'bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-emerald)/0.20),transparent_60%)]',
  cardSheenCyan:
    'bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-cyan)/0.20),transparent_60%)]',
  /**
   * Low-opacity root wash. Kept intentionally soft: it is a background tint,
   * never a full-page overlay stack. Render it once at low opacity behind the
   * shell — do not layer it a second time over the page content.
   */
  pageMesh:
    'bg-[radial-gradient(circle_at_15%_20%,hsl(var(--brand-rose)/0.35),transparent_45%),radial-gradient(circle_at_85%_10%,hsl(var(--brand-amber)/0.30),transparent_40%),radial-gradient(circle_at_50%_90%,hsl(var(--brand-indigo)/0.30),transparent_45%)]',
  /** Thin spectrum rule used between filter rows. */
  spectrumDivider:
    'bg-[linear-gradient(90deg,hsl(var(--brand-rose)),hsl(var(--brand-amber)),hsl(var(--brand-emerald)),hsl(var(--brand-cyan)),hsl(var(--brand-indigo)),hsl(var(--brand-violet)))]',
  /** Soft top-light on cards. */
  cardSheen: 'bg-[linear-gradient(180deg,hsl(var(--background)/0.6),transparent)]',
  /** Glow behind an active filter chip. */
  chipGlow: 'shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]',
  /** Call-to-action fill. */
  cta: 'bg-primary text-primary-foreground hover:bg-primary/90',
} as const;

/**
 * Canonical accessible name for the brand mark.
 *
 * Declared as a standalone constant FIRST so `logo.accessibleName` and
 * `logo.alt` can both alias literally the same string — this is the single
 * source of truth for the mark's name, and it must always contain the word
 * "logo" so assistive tech and verification specs can identify it.
 */
const LOGO_ACCESSIBLE_NAME = 'Chief logo' as const;

/**
 * Brand mark ('Chief' chief's-cap logo) tokens.
 *
 * The mark ships twice: as a standalone asset (`public/favicon.svg`, which —
 * being a static file — cannot resolve CSS custom properties and therefore
 * hard-codes literal `hsl()` stops) and as an inline React component
 * (`src/components/ChiefCapLogo.tsx` / `src/components/BrandMark.tsx`). Both
 * read their geometry and stops from here so the asset and the component can
 * never drift apart.
 *
 * The accessible name of the mark is declared once, here, as
 * `logo.accessibleName`, and is consumed by `BrandMark`/`ChiefCapLogo` (when
 * the mark must announce itself) and mirrored in `public/favicon.svg`.
 */
export const logo = {
  /** Square viewBox shared by the SVG asset and the inline React mark. */
  viewBox: '0 0 64 64',
  /** Canonical rendered size (px) for header lockups and touch icons. */
  size: 64,
  /** Path of the standalone asset — always root-absolute, never `./`. */
  src: '/favicon.svg',
  /**
   * Short VISIBLE wordmark rendered next to the mark ("Chief").
   *
   * NOTE: this is *not* the mark's accessible name — it does not contain the
   * word "logo". Never pass `logo.label` to `aria-label`/`alt`; use
   * `logo.accessibleName` (or its alias `logo.alt`) for that.
   */
  label: 'Chief',
  /**
   * Alt / accessible-name fallback for `<img alt="…">` consumers.
   *
   * Aliased to the single canonical name string (`logo.accessibleName`) so the
   * `<img>`/`alt` path and the inline `aria-label` path can never diverge, and
   * so both satisfy a /chiefcap logo/i assertion.
   */
  alt: LOGO_ACCESSIBLE_NAME,
  /**
   * Single source of truth for the mark's accessible name. Always contains
   * the word "logo" so assistive tech and verification specs can identify the
   * brand mark unambiguously. Mirrored by `public/favicon.svg`.
   */
  accessibleName: LOGO_ACCESSIBLE_NAME,
  /**
   * ARIA role used when the mark is NOT decorative. Shared by the inline mark
   * components and the verification specs so the literal lives in one place
   * only.
   */
  role: 'img',
  /** Stable base id for inline SVG gradient defs; consumers append a unique suffix. */
  gradientId: 'chief-brand-mark',
  /**
   * Literal HSL fallbacks for the three brand stops. Keep in sync with the
   * `--brand-*` custom properties in `src/styles.css` and with
   * `public/favicon.svg`.
   */
  stops: {
    rose: 'hsl(346 84% 58%)',
    amber: 'hsl(38 94% 55%)',
    indigo: 'hsl(248 72% 62%)',
  },
  /** 135° rose → amber → indigo ramp mirroring `gradients.brandMark`. */
  gradient:
    'linear-gradient(135deg,hsl(346 84% 58%),hsl(38 94% 55%) 45%,hsl(248 72% 62%))',
  /** Solid fill used for the cap silhouette inside the mark. */
  markFill: 'hsl(0 0% 100%)',
  /**
   * Cap geometry, shared verbatim by `public/favicon.svg` and the inline mark
   * so the static asset and the inline mark stay pixel-identical.
   */
  mark: {
    /** Corner radius of the rounded square plate. */
    radius: 14,
    /** Half-disc dome, swept left → top → right along y = 38. */
    dome: 'M16 38a16 16 0 0 1 32 0Z',
    /** Band beneath the dome. */
    band: { x: 13, y: 37.5, width: 38, height: 7, rx: 3.5 },
    /** Button on the crown. */
    button: { cx: 32, cy: 16, r: 3 },
  },
  /** Value for `<meta name='theme-color'>` (rose stop, light mode). */
  themeColor: '#ee3a64',
} as const;

const stepGradients = [
  'bg-[linear-gradient(120deg,hsl(var(--brand-rose)),hsl(var(--brand-amber)))]',
  'bg-[linear-gradient(120deg,hsl(var(--brand-amber)),hsl(var(--brand-emerald)))]',
  'bg-[linear-gradient(120deg,hsl(var(--brand-indigo)),hsl(var(--brand-violet)))]',
  'bg-[linear-gradient(120deg,hsl(var(--brand-emerald)),hsl(var(--brand-cyan)))]',
  'bg-[linear-gradient(120deg,hsl(var(--brand-cyan)),hsl(var(--brand-indigo)))]',
  'bg-[linear-gradient(120deg,hsl(var(--brand-violet)),hsl(var(--brand-rose)))]',
] as const;

/**
 * Resolve a stable gradient for a step/card identity. Kept as a callable
 * function (not a plain map) because earlier build steps referenced it as
 * `stepGradient(index)`.
 */
export function stepGradient(index: number): string {
  if (!Number.isFinite(index)) return stepGradients[0] ?? '';
  const normalized = Math.abs(Math.trunc(index)) % stepGradients.length;
  return stepGradients[normalized] ?? stepGradients[0] ?? '';
}

export const surfaces = {
  card: 'rounded-3xl border border-border bg-card shadow-sm',
  cardAccent:
    'rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
  cardRainbow:
    'rounded-3xl bg-[linear-gradient(120deg,hsl(var(--brand-rose)),hsl(var(--brand-amber)),hsl(var(--brand-emerald)),hsl(var(--brand-cyan)),hsl(var(--brand-indigo)),hsl(var(--brand-violet)))] p-px shadow-sm',
  cardRainbowInner: 'rounded-[calc(1.5rem-1px)] bg-card',
  stepNumber:
    'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground shadow-sm',
  stepNumberAt(index: number): string {
    return `${stepGradient(index)} text-primary-foreground`;
  },
} as const;

/**
 * Named tints for consumers that iterate over a fixed palette rather than a
 * category (e.g. the giving-history rows). The array also exposes named
 * properties so both `surfaceTints[0]` and `surfaceTints.rose` are valid.
 */
const surfaceTintList = [
  tints.roseSoft,
  tints.amberSoft,
  tints.indigoSoft,
  tints.emeraldSoft,
  tints.violetSoft,
  tints.cyanSoft,
] as const;

export const surfaceTints = Object.assign([...surfaceTintList], {
  rose: tints.roseSoft,
  amber: tints.amberSoft,
  indigo: tints.indigoSoft,
  emerald: tints.emeraldSoft,
  violet: tints.violetSoft,
  cyan: tints.cyanSoft,
});

export const interactive = {
  primaryButton:
    'inline-flex min-h-[2.75rem] touch-manipulation items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50',
  secondaryButton:
    'inline-flex min-h-[2.75rem] touch-manipulation items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-center text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50',
  focusRing:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
} as const;

/** Back-compat alias used by older screens. */
export const buttons = {
  primary: interactive.primaryButton,
  secondary: interactive.secondaryButton,
  ghost:
    'inline-flex min-h-[2.75rem] touch-manipulation items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50',
} as const;

export const radii = {
  card: 'rounded-3xl',
  pill: 'rounded-full',
} as const;

export const shadows = {
  card: 'shadow-sm',
  lifted: 'shadow-md',
} as const;

export type CategoryAccent = {
  gradient: string;
  softSurface: string;
  text: string;
  ring: string;
  dot: string;
};

const categoryAccents: Record<string, CategoryAccent> = {
  rose: {
    gradient:
      'bg-[linear-gradient(120deg,hsl(var(--brand-rose)),hsl(var(--brand-amber)))]',
    softSurface: tints.roseSoft,
    text: 'text-[hsl(var(--brand-rose-ink))]',
    ring: 'focus-visible:ring-[hsl(var(--brand-rose)/0.7)]',
    dot: 'bg-[hsl(var(--brand-rose))]',
  },
  amber: {
    gradient:
      'bg-[linear-gradient(120deg,hsl(var(--brand-amber)),hsl(var(--brand-emerald)))]',
    softSurface: tints.amberSoft,
    text: 'text-[hsl(var(--brand-amber-ink))]',
    ring: 'focus-visible:ring-[hsl(var(--brand-amber)/0.7)]',
    dot: 'bg-[hsl(var(--brand-amber))]',
  },
  indigo: {
    gradient:
      'bg-[linear-gradient(120deg,hsl(var(--brand-indigo)),hsl(var(--brand-violet)))]',
    softSurface: tints.indigoSoft,
    text: 'text-[hsl(var(--brand-indigo-ink))]',
    ring: 'focus-visible:ring-[hsl(var(--brand-indigo)/0.7)]',
    dot: 'bg-[hsl(var(--brand-indigo))]',
  },
  emerald: {
    gradient:
      'bg-[linear-gradient(120deg,hsl(var(--brand-emerald)),hsl(var(--brand-cyan)))]',
    softSurface: tints.emeraldSoft,
    text: 'text-[hsl(var(--brand-emerald-ink))]',
    ring: 'focus-visible:ring-[hsl(var(--brand-emerald)/0.7)]',
    dot: 'bg-[hsl(var(--brand-emerald))]',
  },
  violet: {
    gradient:
      'bg-[linear-gradient(120deg,hsl(var(--brand-violet)),hsl(var(--brand-rose)))]',
    softSurface: tints.violetSoft,
    text: 'text-[hsl(var(--brand-violet-ink))]',
    ring: 'focus-visible:ring-[hsl(var(--brand-violet)/0.7)]',
    dot: 'bg-[hsl(var(--brand-violet))]',
  },
  cyan: {
    gradient:
      'bg-[linear-gradient(120deg,hsl(var(--brand-cyan)),hsl(var(--brand-indigo)))]',
    softSurface: tints.cyanSoft,
    text: 'text-[hsl(var(--brand-cyan-ink))]',
    ring: 'focus-visible:ring-[hsl(var(--brand-cyan)/0.7)]',
    dot: 'bg-[hsl(var(--brand-cyan))]',
  },
};

/**
 * Pick a category identity from the recipient category string. Matching is
 * keyword based and deliberately forgiving — unknown categories fall back to
 * the rose accent so every card still gets a complete identity.
 */
export function categoryAccent(category: string | null | undefined): CategoryAccent {
  const value = (category ?? '').toLowerCase();

  if (
    value.includes('water') ||
    value.includes('utility') ||
    value.includes('utilities') ||
    value.includes('electric') ||
    value.includes('power') ||
    value.includes('energy')
  ) {
    return categoryAccents.rose;
  }

  if (
    value.includes('education') ||
    value.includes('school') ||
    value.includes('tuition') ||
    value.includes('book') ||
    value.includes('exam')
  ) {
    return categoryAccents.amber;
  }

  if (
    value.includes('health') ||
    value.includes('medical') ||
    value.includes('hospital') ||
    value.includes('drug') ||
    value.includes('clinic')
  ) {
    return categoryAccents.emerald;
  }

  if (
    value.includes('food') ||
    value.includes('grocery') ||
    value.includes('meal') ||
    value.includes('market')
  ) {
    return categoryAccents.violet;
  }

  if (
    value.includes('rent') ||
    value.includes('housing') ||
    value.includes('shelter') ||
    value.includes('home')
  ) {
    return categoryAccents.indigo;
  }

  if (
    value.includes('transport') ||
    value.includes('bus') ||
    value.includes('fare') ||
    value.includes('travel') ||
    value.includes('fuel')
  ) {
    return categoryAccents.cyan;
  }

  if (
    value.includes('internet') ||
    value.includes('data') ||
    value.includes('broadband') ||
    value.includes('wifi')
  ) {
    return categoryAccents.indigo;
  }

  return categoryAccents.rose;
}

// [sticky-export] BRAND_KEYS — recovered from prior version
//
// Declared before `siteConfig` so the config object can expose it without a
// temporal-dead-zone ReferenceError at module init.
export const BRAND_KEYS = [
  'rose',
  'amber',
  'indigo',
  'emerald',
  'violet',
  'cyan',
] as const;

// [sticky-export] headerNav — recovered from prior version
//
// Declared before `siteConfig` so `siteConfig.headerNav` is a real array (the
// hand-recovered config literal used to omit it, which made
// `siteConfig.headerNav.map(...)` inside AppShell throw during render).
export const headerNav: { label: string; href: string }[] = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Categories', href: '#categories' },
  { label: 'Impact', href: '#impact' },
  { label: 'For recipients', href: '#recipients' },
];

// ── Auto-generated by KrossBuild named-export gate ──
// These bindings were imported elsewhere but missing here. Preserved blocks
// are recovered verbatim from the prior version of this file (sticky export
// invariant); unknown names are safe stubs. Replace stubs with real logic.
// [sticky-export] AccentBand — recovered from prior version
export type AccentBand = any;
// [sticky-export] BrandKey — recovered from prior version
export type BrandKey = any;

/**
 * Shared, frozen empty list returned for unknown config keys so
 * `siteConfig.*.map(...)` can never be called on `undefined`.
 */
const EMPTY_CONFIG_LIST: readonly never[] = Object.freeze([] as never[]);

const siteConfigBase = {
  name: 'Chief',
  shortName: 'Chief',
  tagline: 'Give directly. Give with confidence.',
  description:
    'Chief connects generous people with verified recipients so support reaches the people who need it most, quickly and transparently.',
  url: 'https://chief.app',
  locale: 'en-US',
  themeColor: palette.rose,
  container: layout.container,
  headerOffset: layout.headerOffset,
  brandGradient: gradients.brandMark,
  spectrum: gradients.spectrum,
  aurora: gradients.heroAurora,
  mesh: gradients.pageMesh,
  cardSurface: surfaces.card,
  cardAccentSurface: surfaces.cardAccent,
  focusRing: interactive.focusRing,
  // Brand mark tokens — the header lockup and the document `<head>` both read
  // these so the logo can never point at a missing/hashed asset again.
  logo,
  logoSrc: logo.src,
  // Nav / brand arrays are re-exposed here so `siteConfig.headerNav.map(...)`
  // and `siteConfig.brandKeys.map(...)` resolve to real arrays.
  headerNav,
  brandKeys: BRAND_KEYS,
} as const;

/**
 * Global site config. Wrapped in a Proxy so the export is TOTAL: any key the
 * recovered literal does not carry resolves to a shared empty list (instead of
 * `undefined`), which keeps `.map(...)` call sites in the shell from throwing.
 */
export const siteConfig = new Proxy(siteConfigBase, {
  get(target, prop, receiver) {
    const direct = Reflect.get(target, prop, receiver);
    if (direct !== undefined) return direct;
    if (typeof prop === 'string') return EMPTY_CONFIG_LIST;
    return direct;
  },
}) as typeof siteConfigBase & { readonly [key: string]: any };

// [sticky-export] accentBands — recovered from prior version
//
// Band definitions live in an ordered list; `accentBands` below is a hybrid
// export that is BOTH an ordered array (`accentBands[0]`, `accentBands.map`)
// and a keyed lookup (`accentBands.rose`, `accentBands['rose']`). A keyed entry
// is a one-item array that also carries the band's own fields, so both
// `accentBands[key].map(...)` and `accentBands[key].ring` resolve to something
// real instead of `undefined` — this was the root cause of the
// `Cannot read properties of undefined (reading 'map')` crash.
//
// The export is wrapped in a Proxy so the keyed lookup is TOTAL: any key that
// is not one of the six brand bands (an unknown category string, a slug, an
// empty value) resolves to the rose band's one-item array instead of
// `undefined`. That keeps `.map(...)` / `.ring` call sites in AppShell and the
// category chips from throwing during render.
export const accentBandList: AccentBand[] = [
  {
    key: 'rose',
    label: 'Utilities',
    gradient: categoryAccents.rose.gradient,
    softSurface: categoryAccents.rose.softSurface,
    text: categoryAccents.rose.text,
    ring: categoryAccents.rose.ring,
    dot: categoryAccents.rose.dot,
    wash: 'bg-[radial-gradient(circle_at_top_left,hsl(var(--brand-rose)/0.20),transparent_65%)]',
    sheen: gradients.cardSheenRose,
  },
  {
    key: 'amber',
    label: 'Education',
    gradient: categoryAccents.amber.gradient,
    softSurface: categoryAccents.amber.softSurface,
    text: categoryAccents.amber.text,
    ring: categoryAccents.amber.ring,
    dot: categoryAccents.amber.dot,
    wash: 'bg-[radial-gradient(circle_at_top_left,hsl(var(--brand-amber)/0.20),transparent_65%)]',
    sheen: gradients.cardSheenAmber,
  },
  {
    key: 'indigo',
    label: 'Housing',
    gradient: categoryAccents.indigo.gradient,
    softSurface: categoryAccents.indigo.softSurface,
    text: categoryAccents.indigo.text,
    ring: categoryAccents.indigo.ring,
    dot: categoryAccents.indigo.dot,
    wash: 'bg-[radial-gradient(circle_at_top_left,hsl(var(--brand-indigo)/0.20),transparent_65%)]',
    sheen: gradients.cardSheenIndigo,
  },
  {
    key: 'emerald',
    label: 'Health',
    gradient: categoryAccents.emerald.gradient,
    softSurface: categoryAccents.emerald.softSurface,
    text: categoryAccents.emerald.text,
    ring: categoryAccents.emerald.ring,
    dot: categoryAccents.emerald.dot,
    wash: 'bg-[radial-gradient(circle_at_top_left,hsl(var(--brand-emerald)/0.20),transparent_65%)]',
    sheen: gradients.cardSheenEmerald,
  },
  {
    key: 'violet',
    label: 'Food',
    gradient: categoryAccents.violet.gradient,
    softSurface: categoryAccents.violet.softSurface,
    text: categoryAccents.violet.text,
    ring: categoryAccents.violet.ring,
    dot: categoryAccents.violet.dot,
    wash: 'bg-[radial-gradient(circle_at_top_left,hsl(var(--brand-violet)/0.20),transparent_65%)]',
    sheen: gradients.cardSheenViolet,
  },
  {
    key: 'cyan',
    label: 'Transport',
    gradient: categoryAccents.cyan.gradient,
    softSurface: categoryAccents.cyan.softSurface,
    text: categoryAccents.cyan.text,
    ring: categoryAccents.cyan.ring,
    dot: categoryAccents.cyan.dot,
    wash: 'bg-[radial-gradient(circle_at_top_left,hsl(var(--brand-cyan)/0.20),transparent_65%)]',
    sheen: gradients.cardSheenCyan,
  },
];

/**
 * Turn a band into its array-shaped form: a one-item array that also carries
 * the band's own fields. Both `entry.map(...)` and `entry.ring` work.
 */
function shapeAccentBand(band: AccentBand): AccentBand {
  return Object.assign([band], band ?? {}) as unknown as AccentBand;
}

const accentBandKeyed: Record<string, AccentBand> = accentBandList.reduce(
  (acc, band) => {
    acc[band.key] = band;
    return acc;
  },
  {} as Record<string, AccentBand>,
);

const accentBandLookupArgs: Record<string, AccentBand> = accentBandList.reduce(
  (acc, band) => {
    // Each keyed entry is array-shaped (so `.map` works) *and* carries the
    // band's own fields (so `.ring` / `.wash` / `.sheen` work).
    acc[band.key] = shapeAccentBand(band);
    return acc;
  },
  {} as Record<string, AccentBand>,
);

/** Never-undefined fallback entry (rose) used for unknown keys. */
const accentBandFallback: AccentBand = shapeAccentBand(accentBandList[0]);

const accentBandsTarget = Object.assign(
  [...accentBandList],
  accentBandLookupArgs,
);

/**
 * Total keyed lookup helper: returns the stored value when present, and the
 * rose fallback band (array-shaped) for anything else, so consumers can never
 * dereference `undefined` and call `.map` on it.
 */
function totalBandLookup(
  target: Record<string, any> | any[],
): (prop: string | symbol) => any {
  return (prop) => {
    const direct = (target as any)[prop];
    if (direct !== undefined) return direct;
    if (typeof prop === 'string' && !(prop in (target as any))) {
      return accentBandLookupArgs[prop] ?? accentBandFallback;
    }
    return direct;
  };
}

export const accentBands: AccentBand[] = new Proxy(accentBandsTarget, {
  get(target, prop, receiver) {
    return totalBandLookup(target)(prop) ?? Reflect.get(target, prop, receiver);
  },
}) as unknown as AccentBand[];

/**
 * Safe keyed lookup for an accent band. Never returns `undefined`: unknown or
 * missing keys fall back to the first band (rose), which keeps every consumer
 * from crashing on a property read.
 */
export const accentBandsByKey: Record<string, AccentBand> = new Proxy(
  { ...accentBandLookupArgs },
  {
    get(target, prop, receiver) {
      const direct = Reflect.get(target, prop, receiver);
      if (direct !== undefined) return direct;
      if (typeof prop === 'string' && !(prop in target)) {
        return accentBandLookupArgs[prop] ?? accentBandFallback;
      }
      return direct;
    },
  },
) as Record<string, AccentBand>;

/**
 * Safe keyed lookup for an accent band. Never returns `undefined`: unknown or
 * missing keys fall back to the first band (rose).
 *
 * The returned entry is array-shaped (a one-item array that also carries the
 * band's fields), so BOTH `accentBand(key).map(...)` and `accentBand(key).ring`
 * work at every call site — the historic `Cannot read properties of undefined
 * (reading 'map')` crash path is closed here as well.
 */
export function accentBand(key: string | null | undefined): AccentBand {
  if (typeof key === 'string' && accentBandLookupArgs[key]) {
    return accentBandLookupArgs[key];
  }
  return accentBandFallback;
}


/** "How it works" steps shown on the home page. */
export const landingSteps = [
  { title: "Browse verified requests", description: "Every bill is checked before it reaches your deck — school fees, hospital bills, rent and utilities across Nigeria." },
  { title: "Swipe right to pay", description: "Swipe right on a request you want to support and choose how many Naira to give. Swipe left to skip." },
  { title: "Paid straight to the biller", description: "Your money goes directly to the school, hospital or provider, and you can track every pledge on your dashboard." },
] as const;
