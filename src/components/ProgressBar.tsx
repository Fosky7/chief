import { fundedPercent } from "@/lib/currency";

export interface ProgressBarProps {
  /** Amount raised so far (naira). */
  value: number;
  /** Target amount (naira). */
  goal: number;
  /** Accessible label describing what this bar measures. */
  label?: string;
  className?: string;
}

/**
 * Accessible funding progress bar. Clamps to 0–100% and exposes
 * role="progressbar" with aria values so assistive tech can read progress.
 */
export function ProgressBar({ value, goal, label = "Funding progress", className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, fundedPercent(value, goal)));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-testid="swipe-card-progress"
      className={`h-2.5 w-full overflow-hidden rounded-full bg-muted ${className ?? ""}`}
    >
      <div
        className="bg-brand-gradient h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
