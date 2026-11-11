import { fundedPercent } from "@/lib/currency";

type ProgressBarProps = {
  /** Amount raised so far. */
  value: number;
  /** Target amount. */
  goal: number;
  /** Accessible name for the progress bar. */
  label?: string;
  className?: string;
};

/** Accessible funding progress bar using brand tokens. Percent is clamped to 0–100. */
export function ProgressBar({ value, goal, label = "Funding progress", className }: ProgressBarProps) {
  const raw = goal > 0 ? fundedPercent(value, goal) : 0;
  const pct = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-testid="progress-bar"
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
