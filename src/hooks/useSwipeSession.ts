import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  buildDeckKey,
  createSwipeSessionState,
  getProgressLabel,
  SWIPE_SESSION_STORAGE_KEY,
  swipeSessionStore,
  type SwipeRecord,
  type SwipeSessionState,
  type UndoResult,
} from "@/services/swipeSession";

/** Minimum shape the hook needs from a card. */
export interface SwipeableRecipient {
  id: string;
}

/** Feedback rendered in the session's polite live region. */
export interface SwipeSessionNotice {
  id: number;
  message: string;
  detail?: string;
  tone: "success" | "muted";
}

export interface UseSwipeSessionResult<T extends SwipeableRecipient> {
  /** The resolved deck, in queue order. */
  deck: readonly T[];
  /** Card at the top of the deck, or `null` once every request is resolved. */
  current: T | null;
  /** 1-based position of `current` (equals `total` once exhausted). */
  currentPosition: number;
  total: number;
  /** Number of cards already resolved (0 … total). */
  index: number;
  remaining: number;
  /** "1 of 12" — the label rendered on /discover. */
  progressLabel: string;
  /** 0 … 100, for the progress bar. */
  progressPercent: number;
  isExhausted: boolean;
  canUndo: boolean;
  lastAction: SwipeRecord | null;
  notice: SwipeSessionNotice | null;
  skip: () => SwipeRecord | null;
  pledge: () => SwipeRecord | null;
  undo: () => UndoResult;
  reset: () => void;
  dismissNotice: () => void;
}

/**
 * Session swipe store with single-level undo (Module 4).
 *
 * Reads the shared {@link swipeSessionStore} through `useSyncExternalStore`, so
 * every component observing the session re-renders together and the state stays
 * in sync across tabs. The store persists to `localStorage` on every commit,
 * which is what keeps the progress label stable across a browser reload.
 */
export function useSwipeSession<T extends SwipeableRecipient>(
  recipients: readonly T[],
): UseSwipeSessionResult<T> {
  // Normalise the deck once: drop anything without a usable id so a malformed
  // seed can never desync `index` from the rendered cards.
  const deck = useMemo(() => {
    const source = Array.isArray(recipients) ? recipients : [];
    return source.filter(
      (recipient): recipient is T =>
        Boolean(recipient) &&
        typeof recipient.id === "string" &&
        recipient.id.length > 0,
    );
  }, [recipients]);

  const deckIds = useMemo(() => deck.map((recipient) => recipient.id), [deck]);
  const deckKey = useMemo(() => buildDeckKey(deckIds), [deckIds]);

  // Rendered (but not committed) state for the first paint, before the effect
  // below has pointed the store at this deck.
  const idleState = useMemo(
    () => createSwipeSessionState(deckIds),
    [deckIds],
  );

  const snapshot = useSyncExternalStore(
    swipeSessionStore.subscribe,
    swipeSessionStore.getSnapshot,
    swipeSessionStore.getServerSnapshot,
  );

  // A persisted session for a *different* deck must not be rendered against
  // this one — fall back to a clean deck until `ensureDeck` resets the store.
  const state: SwipeSessionState =
    snapshot.deckKey === deckKey ? snapshot : idleState;

  useEffect(() => {
    swipeSessionStore.ensureDeck(deckIds);
  }, [deckIds, deckKey]);

  // Keep two tabs of the same session in step.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SWIPE_SESSION_STORAGE_KEY || event.key === null) {
        swipeSessionStore.syncFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const [notice, setNotice] = useState<SwipeSessionNotice | null>(null);
  const noticeId = useRef<number>(0);

  const announce = useCallback((next: Omit<SwipeSessionNotice, "id">) => {
    noticeId.current += 1;
    setNotice({ ...next, id: noticeId.current });
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const skip = useCallback((): SwipeRecord | null => {
    swipeSessionStore.ensureDeck(deckIds);
    const record = swipeSessionStore.skip();

    if (record) {
      announce({
        message: "Skipped this request.",
        detail: "Press Undo to bring it back.",
        tone: "muted",
      });
    }

    return record;
  }, [announce, deckIds]);

  const pledge = useCallback((): SwipeRecord | null => {
    swipeSessionStore.ensureDeck(deckIds);
    const record = swipeSessionStore.pledge();

    if (record) {
      announce({
        message: "Pledge recorded for this request.",
        detail: "This demo does not charge a card.",
        tone: "success",
      });
    }

    return record;
  }, [announce, deckIds]);

  const undo = useCallback((): UndoResult => {
    swipeSessionStore.ensureDeck(deckIds);
    const result = swipeSessionStore.undo();

    if (result.ok) {
      announce({
        message: "Restored your last swipe.",
        detail: "That request is back at the top of the queue.",
        tone: "success",
      });
    } else {
      announce({
        message: result.message,
        detail: result.detail,
        tone: "muted",
      });
    }

    return result;
  }, [announce, deckIds]);

  const reset = useCallback(() => {
    swipeSessionStore.ensureDeck(deckIds);
    swipeSessionStore.reset();
    announce({
      message: "Session reset.",
      detail: "Starting again from the first request.",
      tone: "success",
    });
  }, [announce, deckIds]);

  const total = state.deck.length;
  const index = Math.max(0, Math.min(state.index, total));
  const currentId = index < total ? state.deck[index] : null;

  const current = useMemo(() => {
    if (!currentId) return null;
    return deck.find((recipient) => recipient.id === currentId) ?? null;
  }, [currentId, deck]);

  const remaining = Math.max(total - index, 0);
  const currentPosition = total === 0 ? 0 : Math.min(index + 1, total);
  const progressLabel = total === 0 ? "0 of 0" : getProgressLabel(state);
  const progressPercent = total === 0 ? 0 : Math.round((index / total) * 100);
  const lastAction =
    state.history.length > 0 ? state.history[state.history.length - 1] : null;

  // Undo is available when something has been resolved *and* the single undo
  // slot has not already been used.
  const canUndo = index > 0 && state.undoSlot === null;

  return {
    deck,
    current,
    currentPosition,
    total,
    index,
    remaining,
    progressLabel,
    progressPercent,
    isExhausted: total > 0 && index >= total,
    canUndo,
    lastAction,
    notice,
    skip,
    pledge,
    undo,
    reset,
    dismissNotice,
  };
}

export default useSwipeSession;
