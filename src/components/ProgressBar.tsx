import type { CSSProperties } from 'react';

export type ProgressBarProps = {
  /** Amount raised so far (naira). */
  value: number;
  /** Target / needed amount (naira). */
  goal: number;
  /** Accessible name for the bar. */
  label?: string;
  /** Extra classes for the wrapper. */
  className?: string;
  /** Render the percentage caption underneath the bar. */
  showPercent?: boolean;
  /** Optional test hook for the wrapper element. */
  testId?: string;
};

/** Guards against NaN / Infinity coming from partially populated records. */
function toSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/** Clamped, rounded funding percentage for a raised/goal pair. */
export function percentage(value: number, goal: number): number {
  const safeGoal = toSafeNumber(goal);
  const safeValue = Math.max(0, toSafeNumber(value));
  if (safeGoal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((safeValue / safeGoal) * 100)));
}

/**
 * Accessible funding progress bar used by the swipe deck.
 *
 * Exposes the standard progressbar role/aria attributes so screen readers and
 * automated checks can read the current percentage, and renders an empty bar
 * instead of dividing by zero when a bill has no target amount.
 */
export function ProgressBar({
  value,
  goal,
  label,
  className,
  showPercent = false,
  testId,
}: ProgressBarProps) {
  const percent = percentage(value, goal);
  const wrapperClass = ['w-full', className].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass} data-testid={testId}>
      <div
        role='progressbar'
        aria-label={label ?? 'Funding progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}% funded`}
        className='h-2 w-full overflow-hidden rounded-full bg-muted'
      >
        <div
          className='bg-brand-gradient h-full rounded-full transition-[width] duration-500 ease-out'
          style={{ width: `${percent}%` } as CSSProperties}
        />
      </div>
      {showPercent ? (
        <p className='mt-1 text-xs font-semibold text-muted-foreground'>
          {percent}% funded
        </p>
      ) : null}
    </div>
  );
}

export default ProgressBar;
