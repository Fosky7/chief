interface ProgressBarProps {
  /** Amount raised so far. */
  value: number;
  /** Target amount. */
  goal: number;
  /** Accessible label for the progress bar. */
  label?: string;
  className?: string;
}

/** Funding progress bar using brand tokens; clamps to 0–100%. */
export function ProgressBar({ value, goal, label = "Funding progress", className }: ProgressBarProps) {
  const pct = goal > 0 ? Math.max(0, Math.min(100, Math.round((value / goal) * 100))) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`h-2.5 w-full overflow-hidden rounded-full bg-muted ${className ?? ""}`}
    >
      <div
        className="bg-brand-gradient h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
