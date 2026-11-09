import { fundedPercent, progressRatio } from "@/lib/currency";

/**
 * Funding progress bar used across the swipe deck and bill pages.
 *
 * The visual fill is driven by the raw (0–1) funding ratio so partial funding
 * is always visible, while the accessible `aria-valuenow` exposes the rounded
 * 0–100 percentage to assistive technology and to tests.
 */

export type ProgressBarSize = "sm" | "md" | "lg";
export type ProgressBarTone = "brand" | "success";

export type ProgressBarProps = {
  /** Amount already raised, in whole Naira (tolerant of strings/null). */
  value: number | string | null | undefined;
  /** Amount needed to fully fund the bill, in whole Naira. */
  goal: number | string | null | undefined;
  className?: string;
  /** Accessible name announced for the progress bar. */
  label?: string;
  size?: ProgressBarSize;
  tone?: ProgressBarTone;
  /** Renders the rounded percentage beside the track. */
  showPercent?: boolean;
};

const TRACK_SIZE: Record<ProgressBarSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3",
};

const FILL_TONE: Record<ProgressBarTone, string> = {
  brand: "bg-brand-gradient",
  success: "bg-success",
};

export function ProgressBar({
  value,
  goal,
  className = "",
  label,
  size = "md",
  tone = "brand",
  showPercent = false,
}: ProgressBarProps) {
  const ratio = progressRatio(value, goal);
  const percent = fundedPercent(value, goal);
  // Keeps the fill proportional; a funded bill yields 100% and an empty one 0%.
  const width = `${(ratio * 100).toFixed(2)}%`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Funding progress"}
        data-testid="progress-bar"
        className={`relative w-full overflow-hidden rounded-full bg-muted ${TRACK_SIZE[size]}`}
      >
        <div
          data-testid="progress-bar-fill"
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${FILL_TONE[tone]}`}
          style={{ width }}
        />
      </div>
      {showPercent && (
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {percent}%
        </span>
      )}
    </div>
  );
}

export default ProgressBar;
