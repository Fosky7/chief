import { formatNaira, fundedPercent } from "@/lib/currency";

interface ProgressBarProps {
  /** Amount raised so far (whole naira). */
  value: number;
  /** Target amount (whole naira). */
  goal: number;
  /** Accessible label describing what the bar measures. */
  label?: string;
  className?: string;
}

/** Accessible funding progress bar using brand tokens. */
export function ProgressBar({ value, goal, label = "Funding progress", className }: ProgressBarProps) {
  const pct = fundedPercent(value, goal);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}% funded — ${formatNaira(value)} of ${formatNaira(goal)}`}
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
