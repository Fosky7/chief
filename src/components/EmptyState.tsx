import type { ReactNode } from "react";

import { gradients, typography } from "@/config/theme";

/**
 * Shared empty / no-match panel.
 *
 * Used by the discover queue (no matches), the dashboard (no pledges yet) and
 * the not-found page. It stays generic on purpose — callers own the copy and
 * the action — but from this revision on it can carry an optional colour
 * identity via the `accent` prop:
 *
 *  - `neutral` (the default, matching every existing caller) renders the
 *    previous neutral card with no extra tint, so no call site changes look
 *    different unless it opts in.
 *  - any other accent adds a soft tinted sheen and a spectrum hairline so the
 *    panel reads as colourful as the rest of the redesigned pages.
 *
 * Status is always conveyed in text (title + description), never by colour
 * alone, and every colour comes from a design token — no raw values here.
 */

export type EmptyStateAccent =
  | "neutral"
  | "violet"
  | "rose"
  | "amber"
  | "emerald"
  | "cyan"
  | "indigo"
  | "fuchsia";

/** Soft radial sheen per accent — token driven, low opacity so text stays AA. */
const ACCENT_SHEEN: Record<Exclude<EmptyStateAccent, "neutral">, string> = {
  violet: gradients.cardSheenViolet,
  rose: gradients.cardSheenRose,
  amber: gradients.cardSheenAmber,
  emerald: gradients.cardSheenEmerald,
  cyan: gradients.cardSheenCyan,
  indigo: gradients.cardSheenIndigo,
  fuchsia:
    "bg-[radial-gradient(circle_at_20%_0%,hsl(var(--brand-fuchsia)/0.22),transparent_68%)]",
};

/** Matches the accent chip/badge text colour to the sheen. */
const ACCENT_TEXT: Record<Exclude<EmptyStateAccent, "neutral">, string> = {
  violet: "text-[hsl(var(--brand-violet-ink))]",
  rose: "text-[hsl(var(--brand-rose-ink))]",
  amber: "text-[hsl(var(--brand-amber-ink))]",
  emerald: "text-[hsl(var(--brand-emerald-ink))]",
  cyan: "text-[hsl(var(--brand-cyan-ink))]",
  indigo: "text-[hsl(var(--brand-indigo-ink))]",
  fuchsia: "text-[hsl(var(--brand-fuchsia-ink))]",
};

export type EmptyStateProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  /** Optional action row rendered under the copy. */
  action?: ReactNode;
  /** Optional leading visual (icon, illustration, dot). */
  icon?: ReactNode;
  /** Defaults to `neutral` so existing callers keep their current look. */
  accent?: EmptyStateAccent;
  className?: string;
};

export function EmptyState({
  title,
  description,
  eyebrow,
  action,
  icon,
  accent = "neutral",
  className = "",
}: EmptyStateProps) {
  const isNeutral = accent === "neutral";
  const sheen = isNeutral ? null : ACCENT_SHEEN[accent];
  const accentText = isNeutral ? typography.eyebrow : ACCENT_TEXT[accent];

  return (
    <div
      className={`relative isolate overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm backdrop-blur-sm ${className}`}
    >
      {/* Soft tinted sheen — decorative only, skipped for the neutral look. */}
      {sheen ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 ${sheen}`}
        />
      ) : null}

      {/* Spectrum hairline along the top edge when a colour is chosen. */}
      {isNeutral ? null : (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${gradients.spectrum}`}
        />
      )}

      <div className="flex flex-col items-start gap-3 p-6 sm:p-8">
        {icon ? (
          <div aria-hidden="true" className="mb-1">
            {icon}
          </div>
        ) : null}

        {eyebrow ? (
          <p
            className={
              isNeutral
                ? typography.eyebrow
                : `text-xs font-semibold uppercase tracking-[0.18em] ${accentText}`
            }
          >
            {eyebrow}
          </p>
        ) : null}

        <h2 className={typography.subheading}>{title}</h2>

        {description ? (
          <p className={`max-w-2xl ${typography.body}`}>{description}</p>
        ) : null}

        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}

export type KeyboardHintProps = {
  /** Extra layout classes from the caller. */
  className?: string;
  /** Short caption shown after the key caps. */
  label?: string;
};

/**
 * Small, static keyboard affordance for the discover hero.
 *
 * Renders the `←` / `→` key caps plus a short caption so the arrow-key shortcut
 * is discoverable. The key caps are real text content (announced once), so the
 * paragraph is not hidden from assistive tech; it is purely informational and
 * therefore has no interactive handlers or focusable elements.
 */
export function KeyboardHint({
  className = "",
  label = "to pass or pledge",
}: KeyboardHintProps) {
  const keyCap =
    "inline-flex min-w-6 items-center justify-center rounded border border-border bg-card/70 px-1.5 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur";

  return (
    <p
      className={`inline-flex flex-wrap items-center gap-1.5 ${typography.caption} ${className}`.trim()}
    >
      <kbd className={keyCap}>←</kbd>
      <span aria-hidden="true">/</span>
      <kbd className={keyCap}>→</kbd>
      <span>{label}</span>
    </p>
  );
}

export default EmptyState;
