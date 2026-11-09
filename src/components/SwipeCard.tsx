import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { formatNaira } from '@/lib/currency';
import { ProgressBar, percentage } from '@/components/ProgressBar';

/**
 * Shape of a bill rendered by the swipe deck. The route can feed either the
 * approved bill records from Supabase or the bundled sample deck, so every
 * field accepts the naming conventions used across the app.
 */
export type SwipeBill = {
  id: string;
  title: string;
  photoUrl?: string | null;
  imageUrl?: string | null;
  photo?: string | null;
  image?: string | null;
  category?: string | null;
  location?: string | null;
  city?: string | null;
  needed?: number | null;
  goal?: number | null;
  goalAmount?: number | null;
  neededAmount?: number | null;
  raised?: number | null;
  raisedAmount?: number | null;
};

type SwipeCardProps = {
  bill: SwipeBill;
  /** Only the top card is interactive (drag gesture + links). */
  isTop?: boolean;
  onSkip?: (bill: SwipeBill) => void;
  onGive?: (bill: SwipeBill) => void;
  className?: string;
};

/** Horizontal travel (px) that counts as "swipe left to skip". */
const SKIP_DRAG_THRESHOLD = 110;
/** Movement (px) after which a pointer gesture is a drag, not a tap. */
const TAP_SLOP = 6;
/** Must match the exit transition applied inline below. */
const EXIT_MS = 220;

/** Returns the first finite, non-negative amount from the candidates. */
function pickAmount(candidates: Array<number | null | undefined>): number {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(candidate, 0);
    }
  }
  return 0;
}

/**
 * A single bill in the discovery deck.
 *
 * The top card shows the bill photo, title, Needed / Raised naira amounts and
 * a funding progress bar, links to the bill detail page via View details, and
 * can be dragged left with a pointer (mouse, pen or touch) to skip to the
 * next bill.
 */
export function SwipeCard({ bill, isTop = false, onSkip, className }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startXRef = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const listenersRef = useRef<{
    move: (event: PointerEvent) => void;
    up: (event: PointerEvent) => void;
  } | null>(null);

  const needed = pickAmount([bill.needed, bill.goal, bill.neededAmount, bill.goalAmount]);
  const raised = pickAmount([bill.raised, bill.raisedAmount]);
  const percent = percentage(raised, needed);
  const photo = bill.photoUrl ?? bill.imageUrl ?? bill.photo ?? bill.image ?? null;
  const place = bill.location ?? bill.city ?? null;

  /** Remove any window-level listeners attached for the active gesture. */
  const detachListeners = useCallback(() => {
    const listeners = listenersRef.current;
    if (!listeners) return;
    window.removeEventListener('pointermove', listeners.move);
    window.removeEventListener('pointerup', listeners.up);
    window.removeEventListener('pointercancel', listeners.up);
    listenersRef.current = null;
  }, []);

  useEffect(
    () => () => {
      detachListeners();
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    },
    [detachListeners],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isTop || !onSkip) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      // A fresh gesture: cancel any previous listeners/exits first.
      detachListeners();
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      startXRef.current = event.clientX;
      draggedRef.current = false;

      const handleMove = (moveEvent: PointerEvent) => {
        if (startXRef.current === null) return;
        const delta = moveEvent.clientX - startXRef.current;
        if (Math.abs(delta) > TAP_SLOP) draggedRef.current = true;
        setDragging(true);
        // Only leftward travel moves the card; dragging right is inert.
        setDragX(Math.min(delta, 0));
      };

      const handleUp = (upEvent: PointerEvent) => {
        detachListeners();
        setDragging(false);

        const startX = startXRef.current;
        startXRef.current = null;
        const delta = startX === null ? 0 : upEvent.clientX - startX;

        if (delta <= -SKIP_DRAG_THRESHOLD) {
          const width = typeof window === 'undefined' ? 800 : window.innerWidth;
          // Fly the card out, then advance the deck.
          setDragX(-width);
          exitTimerRef.current = window.setTimeout(() => {
            exitTimerRef.current = null;
            onSkip?.(bill);
            // Reset so the card stays usable when it is the last bill.
            setDragX(0);
          }, EXIT_MS);
          return;
        }

        // Not far enough: spring back into place.
        setDragX(0);
      };

      listenersRef.current = { move: handleMove, up: handleUp };
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    },
    [bill, detachListeners, isTop, onSkip],
  );

  /** A completed drag must not trigger the links/buttons underneath it. */
  const handleClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (!draggedRef.current) return;
    draggedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const classes = [
    'glass shadow-elegant rounded-2xl p-4 will-change-transform',
    isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      data-testid={isTop ? 'swipe-card-top' : 'swipe-card-under'}
      data-bill-id={bill.id}
      aria-hidden={isTop ? undefined : true}
      onPointerDown={handlePointerDown}
      onClickCapture={handleClickCapture}
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX / 45}deg)`,
        transition: dragging ? 'none' : `transform ${EXIT_MS}ms ease-out`,
        touchAction: 'pan-y',
      }}
      className={classes}
    >
      <div className='relative h-44 w-full overflow-hidden rounded-xl bg-muted'>
        {photo ? (
          <img
            src={photo}
            alt=''
            draggable={false}
            data-testid={isTop ? 'swipe-card-photo' : undefined}
            className='h-full w-full select-none object-cover'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-sm text-muted-foreground'>
            No photo yet
          </div>
        )}
        {bill.category ? (
          <span className='glass absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold'>
            {bill.category}
          </span>
        ) : null}
      </div>

      <h2
        data-testid={isTop ? 'swipe-card-title' : undefined}
        className='mt-4 font-display text-xl font-semibold leading-snug'
      >
        {bill.title}
      </h2>
      {place ? <p className='mt-1 text-sm text-muted-foreground'>{place}</p> : null}

      <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
        <div>
          <dt className='text-muted-foreground'>Needed</dt>
          <dd
            data-testid={isTop ? 'swipe-card-needed' : undefined}
            className='mt-0.5 font-semibold text-foreground'
          >
            {formatNaira(needed)}
          </dd>
        </div>
        <div>
          <dt className='text-muted-foreground'>Raised</dt>
          <dd
            data-testid={isTop ? 'swipe-card-raised' : undefined}
            className='mt-0.5 font-semibold text-primary'
          >
            {formatNaira(raised)}
          </dd>
        </div>
      </dl>

      <ProgressBar
        value={raised}
        goal={needed}
        label={`Funding progress for ${bill.title}`}
        className='mt-3'
        testId={isTop ? 'swipe-card-progress' : undefined}
      />

      <div className='mt-4 flex items-center justify-between gap-3'>
        <span className='text-xs font-semibold text-muted-foreground'>{percent}% funded</span>
        <Link
          to='/bills/$id'
          params={{ id: bill.id }}
          className='glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          View details
        </Link>
      </div>
    </article>
  );
}

export default SwipeCard;
