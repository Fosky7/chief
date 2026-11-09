type ProgressBarProps = {
  /** Amount raised so far. */
  value: number;
  /** Target amount. */
  goal: number;
  /** Accessible label for screen readers. */
  label?: string;
  className?: string;
};

/** Clamp the funded percentage into 0–100 and guard against a zero goal. */
export function percentOf(value: number, goal: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
}

/** Accessible funding progress bar styled with brand tokens. */
export function ProgressBar({ value, goal, label, className }: ProgressBarProps) {
  const pct = percentOf(value, goal);
  return (
    <div
      role="progressbar"
      aria-label={label ?? "Funding progress"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}% funded`}
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
