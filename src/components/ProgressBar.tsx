import { fundedPercent } from "@/lib/currency";

export interface ProgressBarProps {
  /** Amount raised so far. */
  value: number;
  /** Target amount. */
  goal: number;
  /** Accessible label describing what the bar measures. */
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

/** Accessible funding progress bar using brand gradient tokens. */
export function ProgressBar({ value, goal, label = "Funding progress", className, size = "md" }: ProgressBarProps) {
  const pct = fundedPercent(value, goal);
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}% funded`}
      className={`w-full overflow-hidden rounded-full bg-muted ${height} ${className ?? ""}`}
    >
      <div
        className="bg-brand-gradient h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
