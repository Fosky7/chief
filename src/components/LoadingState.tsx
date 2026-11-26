import type { ReactNode } from 'react';

export type LoadingStateProps = {
  /** Visible, plain-language description of what is loading, e.g. 'Loading bills'. */
  label?: string;
  /** Optional second line explaining what happens next. */
  description?: string;
  /** How many skeleton rows to draw underneath the label. */
  rows?: number;
  /** Hide the skeleton rows (for inline spinners). */
  compact?: boolean;
  /** Optional visual shown instead of the spinner. */
  icon?: ReactNode;
  className?: string;
  /** Stable hook used by the browser verification specs. */
  testId?: string;
};

/**
 * Shared loading state for every data-backed surface.
 *
 * `role="status"` with `aria-live="polite"` announces the label exactly once
 * and `aria-busy` tells assistive technology the region is still filling in.
 * The skeleton rows keep the vertical rhythm identical to the content that
 * replaces them so the page never jumps while bills load.
 */
export function LoadingState({
  label = 'Loading',
  description,
  rows = 3,
  compact = false,
  icon,
  className,
  testId = 'loading-state',
}: LoadingStateProps) {
  const skeletonRows = Math.max(1, Math.round(rows));

  return (
    <div
      role='status'
      aria-live='polite'
      aria-busy='true'
      data-testid={testId}
      className={`w-full ${className ?? ''}`}
    >
      <div className='flex items-center gap-3'>
        {icon ? (
          <span aria-hidden='true' className='text-primary'>
            {icon}
          </span>
        ) : (
          <span
            aria-hidden='true'
            className='h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none'
          />
        )}
        <p className='text-base font-semibold text-foreground'>{label}</p>
      </div>

      {description ? (
        <p className='mt-2 pl-8 text-sm leading-relaxed text-muted-foreground'>{description}</p>
      ) : null}

      {compact ? null : (
        <div aria-hidden='true' className='mt-6 space-y-3'>
          {Array.from({ length: skeletonRows }).map((_, index) => (
            <div
              key={index}
              className='h-20 animate-pulse rounded-2xl border border-border/60 bg-muted/60 motion-reduce:animate-none'
            />
          ))}
        </div>
      )}
    </div>
  );
}
