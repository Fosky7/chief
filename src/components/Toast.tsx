import { useEffect } from "react";

import { buttons, gradients, surfaces } from "@/config/theme";

/**
 * Toast (Module 10).
 *
 * A small confirmation that floats above the page, announces itself politely
 * to assistive tech and can carry a single action (typically "Undo").
 *
 * Accessibility notes:
 * - The live region (`role="status" aria-live="polite" aria-atomic`) is always
 *   mounted and only its *contents* change, which is what reliably triggers an
 *   announcement in screen readers.
 * - The auto dismiss timer lives in a `useEffect` keyed on the toast id, so it
 *   is cleared on unmount and re-armed when a new toast replaces the current
 *   one (rapid toggles never leave a stale dismissal behind).
 *
 * Styling comes from `src/config/theme.ts` (`surfaces`, `buttons`, `gradients`)
 * plus token utility classes — no raw colour values.
 */

/** An optional action rendered beside the message (e.g. "Undo"). */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * The payload rendered by {@link Toast}. Bumping `id` re-arms the dismiss
 * timer, so showing the same message twice still works.
 */
export interface ToastMessage {
  id: number;
  message: string;
  action?: ToastAction;
  /** Override the auto-dismiss delay (ms). Defaults to 4s. */
  durationMs?: number;
}

/** How long a toast stays on screen before dismissing itself. */
export const TOAST_DURATION_MS = 4000;

export interface ToastProps {
  /** The toast to show, or `null` when nothing is active. */
  toast: ToastMessage | null;
  /** Called by the timer, the close button, or after the action runs. */
  onDismiss: () => void;
  className?: string;
}

/**
 * Polite live-region toast with an optional undo action and auto-dismiss.
 *
 * ```tsx
 * const [toast, setToast] = useState<ToastMessage | null>(null);
 * const dismissToast = useCallback(() => setToast(null), []);
 * // ...
 * <Toast toast={toast} onDismiss={dismissToast} />;
 * ```
 *
 * Keep `onDismiss` referentially stable (e.g. `useCallback`) so the effect does
 * not restart the countdown on every render.
 */
export function Toast({ toast, onDismiss, className }: ToastProps) {
  const toastId = toast?.id ?? null;
  const durationMs = toast?.durationMs ?? TOAST_DURATION_MS;

  useEffect(() => {
    if (toastId === null) return undefined;

    const timer = window.setTimeout(() => onDismiss(), durationMs);
    // Cleared on unmount, and whenever a new toast replaces the current one.
    return () => window.clearTimeout(timer);
  }, [toastId, durationMs, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6 sm:justify-end ${className ?? ""}`}
    >
      {toast ? (
        <div
          className={`${surfaces.card} pointer-events-auto flex w-full max-w-md items-start gap-3 p-3.5 shadow-xl`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold leading-none text-primary-foreground shadow-sm ${gradients.brandMark}`}
          >
            ✓
          </span>

          <p className="min-w-0 flex-1 self-center text-sm font-medium text-foreground">
            {toast.message}
          </p>

          {toast.action ? (
            <button
              type="button"
              onClick={() => toast.action?.onClick()}
              className={`${buttons.secondary} shrink-0 whitespace-nowrap`}
            >
              {toast.action.label}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="ml-0.5 grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span aria-hidden="true" className="text-base leading-none">
              ×
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default Toast;
