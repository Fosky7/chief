import { fundedPercent } from '@/lib/currency';

export interface ProgressBarProps {
  value: number;
  goal: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, goal, label = 'Funding progress', className = '' }: ProgressBarProps) {
  const raw = Number(fundedPercent(value, goal));
  const percent = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}% funded`}
      className={`h-2.5 overflow-hidden rounded-full bg-muted ${className}`}
    >
      <div
        className="h-full rounded-full bg-brand-gradient transition-[width] motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default ProgressBar;
