import { fundedPercent } from "@/lib/currency";

type ProgressBarProps = {
  /** Amount raised so far. */
  value: number;
  /** Target amount. */
  goal: number;
  /** Accessible label for the progressbar. */
  label?: string;
  className?: string;
  /** Visual size of the track. */
  size?: "sm" | "md";
};

/** Accessible funding progress bar using brand design tokens. */
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
        className="bg-brand-gradient h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
