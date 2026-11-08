import { formatNaira, fundedPercent } from "@/lib/currency";

export interface ProgressBarProps {
  /** Amount raised so far (Naira). */
  value: number;
  /** Target amount (Naira). */
  goal: number;
  /** Accessible label describing what is being measured. */
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const heights: Record<NonNullable<ProgressBarProps["size"]>, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

/**
 * Accessible funding progress bar. Uses design tokens only (muted track,
 * brand gradient fill).
 */
export function ProgressBar({ value, goal, label = "Funding progress", size = "md", className }: ProgressBarProps) {
  const pct = fundedPercent(value, goal);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}% funded — ${formatNaira(value)} of ${formatNaira(goal)}`}
      data-testid="bill-progress"
      className={`w-full overflow-hidden rounded-full bg-muted ${heights[size]} ${className ?? ""}`}
    >
      <div
        className="bg-brand-gradient h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
