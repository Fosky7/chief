interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
  return (
    <div className="w-full" data-testid="progress-bar">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-white/70">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default ProgressBar;
