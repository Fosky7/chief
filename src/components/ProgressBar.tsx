type ProgressBarProps = {
  value?: number;
  percent?: number;
  raised?: number;
  goal?: number;
  label?: string;
  className?: string;
  /** Optional test hook so cards can expose their own bar. */
  testId?: string;
};

export function ProgressBar({ value, percent, raised, goal, label, className, testId }: ProgressBarProps) {
  let pct = value ?? percent;
  if (pct === undefined && typeof raised === "number" && typeof goal === "number") {
    pct = goal > 0 ? (raised / goal) * 100 : 0;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  return (
    <div
      role="progressbar"
      aria-label={label ?? "Funding progress"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      data-testid={testId}
      className={`h-2.5 w-full overflow-hidden rounded-full bg-white/10 ${className ?? ""}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default ProgressBar;
