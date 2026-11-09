/**
 * ProgressBar — reusable, accessible funding progress indicator.
 *
 * Rendered by the discover swipe deck (and anywhere else a raised/goal ratio
 * is displayed). It deliberately uses only design tokens (`bg-muted`,
 * `bg-brand-gradient`, text tokens) so it inherits the app's theme and never
 * hardcodes colours.
 *
 * Accessibility: exposes `role="progressbar"` with `aria-valuemin`,
 * `aria-valuemax`, `aria-valuenow` and a human readable `aria-valuetext` so
 * screen readers announce the funding percentage, plus a caller supplied
 * `aria-label` describing which bill the bar belongs to.
 */
import type { CSSProperties } from "react";

export type ProgressBarSize = "sm" | "md" | "lg";

export interface ProgressBarProps {
  /** Amount already raised, in the same unit as `goal` (e.g. naira). */
  value: number;
  /** Target amount. Non-positive / non-finite goals render an empty bar. */
  goal: number;
  /** Accessible name, e.g. "Ada's school fees funding progress". */
  label: string;
  /** Extra classes for the track element (mostly spacing utilities). */
  className?: string;
  /** Track thickness. Defaults to "md". */
  size?: ProgressBarSize;
  /** Optional `data-testid` hook for verification. */
  testId?: string;
  /** Render the rounded percentage beside the track. */
  showPercent?: boolean;
}

const SIZE_CLASS: Record<ProgressBarSize, string> = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

/**
 * Clamp the raised/goal ratio to an integer percentage between 0 and 100.
 * Guards against negative goals, zero goals, NaN and Infinity so a bad record
 * can never produce an overflowed or invalid bar width.
 */
export function progressPercent(value: number, goal: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(goal) || goal <= 0) return 0;
  const ratio = (value / goal) * 100;
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/** Tiny class-name joiner that keeps this component dependency free. */
function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function ProgressBar({
  value,
  goal,
  label,
  className,
  size = "md",
  testId,
  showPercent = false,
}: ProgressBarProps) {
  const percent = progressPercent(value, goal);
  const fillStyle: CSSProperties = { width: `${percent}%` };

  const track = (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}% funded`}
      data-testid={testId}
      className={cx("w-full overflow-hidden rounded-full bg-muted", SIZE_CLASS[size], className)}
    >
      <div
        aria-hidden="true"
        style={fillStyle}
        className={cx(
          "bg-brand-gradient h-full rounded-full transition-[width] duration-500 ease-out",
          percent === 0 && "opacity-0",
        )}
      />
    </div>
  );

  if (!showPercent) return track;

  return (
    <div className="flex items-center gap-3">
      {track}
      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
        {percent}%
      </span>
    </div>
  );
}

export default ProgressBar;
