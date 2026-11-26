import type { ReactNode } from 'react';

export type EmptyStateProps = {
  /** Short, plain-language headline such as 'No bills yet'. */
  title: string;
  /** One or two sentences telling the visitor what to do next. */
  description?: string;
  /** Decorative visual (icon or illustration). Hidden from assistive tech. */
  icon?: ReactNode;
  /** Primary call to action - a button or a link. */
  action?: ReactNode;
  className?: string;
  /** Stable hook used by the browser verification specs. */
  testId?: string;
};

/** Neutral placeholder glyph so an empty state never looks broken. */
const defaultIcon = (
  <svg
    width='26'
    height='26'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.8}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M4 7h16' />
    <path d='M4 12h16' />
    <path d='M4 17h10' />
  </svg>
);

/**
 * Shared empty state used when a collection legitimately has nothing in it
 * (no bills yet, deck exhausted, no donations, ...).
 *
 * The headline is a real <h2> so it is reachable by heading navigation, and it
 * is linked to the surrounding region through aria-labelledby.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  testId = 'empty-state',
}: EmptyStateProps) {
  const headingId = `${testId}-title`;

  return (
    <section
      data-testid={testId}
      aria-labelledby={headingId}
      className={`glass shadow-elegant flex w-full flex-col items-center rounded-3xl border border-border/60 px-6 py-14 text-center ${className ?? ''}`}
    >
      <span
        aria-hidden='true'
        className='mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary'
      >
        {icon ?? defaultIcon}
      </span>

      <h2 id={headingId} className='text-2xl font-semibold tracking-tight text-foreground'>
        {title}
      </h2>

      {description ? (
        <p className='mt-3 max-w-md text-sm leading-relaxed text-muted-foreground'>{description}</p>
      ) : null}

      {action ? <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>{action}</div> : null}
    </section>
  );
}
