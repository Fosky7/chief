/**
 * Session swipe store — Module 4.
 *
 * A tiny, framework-agnostic store that remembers what a donor has done in the
 * current `/discover` swipe session and supports a SINGLE level of undo.
 *
 * Why a store instead of component state?
 *  - The deck, the progress label and the undo affordance are read from several
 *    places (session panel today, the full swipe deck in a later module).
 *  - The session has to survive a browser reload, so every commit is mirrored
 *    into `localStorage` under a versioned key. A payload that fails validation
 *    (older build, hand-edited value, blocked storage) is simply discarded and
 *    the session starts fresh — the queue must never be corrupted by bad state.
 *
 * Undo semantics (single level):
 *  - Each resolved card ("skip" or "pledge") is pushed onto `history` and
 *    `index` moves forward.
 *  - `undo()` pulls the last record back out of `history` into `undoSlot` and
 *    moves `index` back by one, so the very same recipient becomes the current
 *    card again.
 *  - While `undoSlot` is occupied a second undo is refused with
 *    `UNDO_ALREADY_MESSAGE` ("Already undone"). Making a new swipe clears the
 *    slot, which is what makes the undo stack exactly one deep.
 */

import { loadSwipeSessionFromCloud, saveSwipeSessionToCloud } from "@/services/cloudSync";

const isBrowser = (): boolean => typeof window !== "undefined";

/** Versioned key: bump the suffix whenever the persisted shape changes. */
export const SWIPE_SESSION_STORAGE_KEY = "chief.swipe-session.v1";

/** Stamped into every payload and checked on read. */
export const SWIPE_SESSION_VERSION = 1;

/** Shown whenever a second (or third…) undo is attempted in a row. */
export const UNDO_ALREADY_MESSAGE = "Already undone";

/** The two ways a donor can resolve a card. */
export type SwipeAction = "skip" | "pledge";

/** One resolved card in the session history. */
export interface SwipeRecord {
  recipientId: string;
  action: SwipeAction;
  /** Epoch milliseconds — useful for ordering/telemetry, never rendered raw. */
  at: number;
}

/** The complete, serialisable session state. */
export interface SwipeSessionState {
  version: number;
  /** `deck.join("|")` — used to detect a seed/order change between reloads. */
  deckKey: string;
  deck: string[];
  /** Number of resolved cards, i.e. the index of the current card. */
  index: number;
  history: SwipeRecord[];
  /** Single-level undo slot; `null` when an undo is available or nothing was done. */
  undoSlot: SwipeRecord | null;
}

export type UndoFailureReason = "already-undone" | "nothing-to-undo";

export type UndoResult =
  | { ok: true; record: SwipeRecord }
  | {
      ok: false;
      reason: UndoFailureReason;
      message: string;
      detail: string;
    };

/* -------------------------------------------------------------------------- */
/* State helpers                                                              */
/* -------------------------------------------------------------------------- */

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Stable signature for an ordered deck of recipient ids. */
export function buildDeckKey(deck: readonly string[]): string {
  return deck.join("|");
}

/** Fresh session for a deck (index 0, no history, nothing to undo). */
export function createSwipeSessionState(
  deck: readonly string[] = [],
): SwipeSessionState {
  const cleanDeck = deck.filter(isNonEmptyString);

  return {
    version: SWIPE_SESSION_VERSION,
    deckKey: buildDeckKey(cleanDeck),
    deck: cleanDeck,
    index: 0,
    history: [],
    undoSlot: null,
  };
}

/** "3 of 12" style label for the current session. */
export function getProgressLabel(state: SwipeSessionState): string {
  const total = state.deck.length;
  if (total === 0) return "0 of 0";
  const position = Math.min(state.index + 1, total);
  return `${position} of ${total}`;
}

/** The recipient at the top of the deck, or `null` once the deck is exhausted. */
export function getCurrentRecipientId(
  state: SwipeSessionState,
): string | null {
  if (state.index < 0 || state.index >= state.deck.length) return null;
  return state.deck[state.index] ?? null;
}

function isSwipeRecord(value: unknown): value is SwipeRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    isNonEmptyString(record.recipientId) &&
    (record.action === "skip" || record.action === "pledge") &&
    typeof record.at === "number" &&
    Number.isFinite(record.at)
  );
}

function parseHistory(value: unknown): SwipeRecord[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;

  const records: SwipeRecord[] = [];
  for (const item of value) {
    if (!isSwipeRecord(item)) return null;
    records.push(item);
  }

  return records;
}

/**
 * Parse and validate a persisted payload.
 *
 * Returns `null` for anything that is not a self-consistent session — an older
 * version, a different deck, a history that does not line up with `index`, or
 * an undo slot that does not describe the card at `index`.
 */
export function parseSwipeSession(raw: string | null): SwipeSessionState | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = parsed as Record<string, unknown>;

  if (candidate.version !== SWIPE_SESSION_VERSION) return null;
  if (!Array.isArray(candidate.deck)) return null;

  const deck: string[] = [];
  for (const id of candidate.deck) {
    if (!isNonEmptyString(id)) return null;
    deck.push(id);
  }

  const deckKey = buildDeckKey(deck);
  if (candidate.deckKey !== deckKey) return null;

  const history = parseHistory(candidate.history);
  if (!history) return null;

  const index =
    typeof candidate.index === "number" ? candidate.index : Number.NaN;
  if (!Number.isInteger(index) || index < 0 || index > deck.length) return null;
  if (history.length !== index) return null;

  let undoSlot: SwipeRecord | null = null;
  const rawUndo = candidate.undoSlot;
  if (rawUndo !== null && rawUndo !== undefined) {
    if (!isSwipeRecord(rawUndo)) return null;
    // The undo slot only ever holds the card sitting at the current index.
    if (deck[index] !== rawUndo.recipientId) return null;
    undoSlot = rawUndo;
  }

  return {
    version: SWIPE_SESSION_VERSION,
    deckKey,
    deck,
    index,
    history,
    undoSlot,
  };
}

function readPersisted(): SwipeSessionState | null {
  if (!isBrowser()) return null;

  try {
    return parseSwipeSession(
      window.localStorage.getItem(SWIPE_SESSION_STORAGE_KEY),
    );
  } catch {
    // Storage can throw in private mode / when disabled by policy.
    return null;
  }
}

function writePersisted(state: SwipeSessionState): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      SWIPE_SESSION_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Quota exceeded or storage blocked — the in-memory session still works.
  }
  // Mirror to the database for signed-in donors (no-op otherwise).
  void saveSwipeSessionToCloud(state);
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

type Listener = () => void;

/** Snapshot used when the store is read outside the browser. */
const SERVER_SNAPSHOT: SwipeSessionState = createSwipeSessionState();

class SwipeSessionStore {
  private state: SwipeSessionState = createSwipeSessionState();
  private listeners = new Set<Listener>();
  private hydrated = false;

  /** `useSyncExternalStore` subscription (stable identity). */
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Current snapshot — hydration happens once, lazily, on first read. */
  getSnapshot = (): SwipeSessionState => {
    this.hydrateOnce();
    return this.state;
  };

  getServerSnapshot = (): SwipeSessionState => SERVER_SNAPSHOT;

  /**
   * Point the store at a deck. A no-op while the deck is unchanged; a deck swap
   * (or a seed reorder) starts a brand new session.
   */
  ensureDeck = (deck: readonly string[]): void => {
    this.hydrateOnce();

    const cleanDeck = deck.filter(isNonEmptyString);
    const deckKey = buildDeckKey(cleanDeck);

    if (deckKey === this.state.deckKey) return;

    this.commit(createSwipeSessionState(cleanDeck));
  };

  /** Resolve the current card as skipped. Returns `null` when exhausted. */
  skip = (): SwipeRecord | null => this.pushRecord("skip");

  /** Resolve the current card as pledged. Returns `null` when exhausted. */
  pledge = (): SwipeRecord | null => this.pushRecord("pledge");

  /** Undo the most recent swipe — exactly once. */
  undo = (): UndoResult => {
    this.hydrateOnce();

    const { history, index, undoSlot } = this.state;

    if (undoSlot) {
      return {
        ok: false,
        reason: "already-undone",
        message: UNDO_ALREADY_MESSAGE,
        detail: "Only your most recent swipe can be restored.",
      };
    }

    const lastRecord = index > 0 ? history[index - 1] : undefined;
    if (!lastRecord) {
      return {
        ok: false,
        reason: "nothing-to-undo",
        message: UNDO_ALREADY_MESSAGE,
        detail: "There is nothing to restore yet — swipe a request first.",
      };
    }

    const nextIndex = index - 1;

    this.commit({
      ...this.state,
      index: nextIndex,
      history: history.slice(0, nextIndex),
      undoSlot: lastRecord,
    });

    return { ok: true, record: lastRecord };
  };

  /** Clear the session for the current deck (demo reset). */
  reset = (): void => {
    this.hydrateOnce();
    this.commit(createSwipeSessionState(this.state.deck));
  };

  /** Re-read storage after another tab wrote to it. */
  syncFromStorage = (): void => {
    if (!isBrowser()) return;

    const stored = readPersisted();
    if (!stored) return;
    if (stored.deckKey !== this.state.deckKey) return;

    this.state = stored;
    this.emit();
  };

  private hydrateOnce(): void {
    if (this.hydrated) return;
    this.hydrated = true;

    const stored = readPersisted();
    if (stored) this.state = stored;

    // A session saved from another device wins only for the same deck.
    void loadSwipeSessionFromCloud().then((raw) => {
      const remote = parseSwipeSession(raw);
      if (!remote || remote.deckKey !== this.state.deckKey || remote.history.length < this.state.history.length) {
        // This device is further along (or nothing saved yet): store it.
        if (this.state.history.length > 0) void saveSwipeSessionToCloud(this.state);
        return;
      }
      if (remote.history.length === this.state.history.length) return;
      this.state = remote;
      this.emit();
    });
  }

  private pushRecord(action: SwipeAction): SwipeRecord | null {
    this.hydrateOnce();

    const { deck, index } = this.state;
    const recipientId = deck[index];
    if (!recipientId) return null;

    const record: SwipeRecord = { recipientId, action, at: Date.now() };

    this.commit({
      ...this.state,
      index: index + 1,
      history: [...this.state.history, record],
      // A new decision consumes the undo slot: undo is only ever one level deep.
      undoSlot: null,
    });

    return record;
  }

  private commit(next: SwipeSessionState): void {
    this.state = next;
    writePersisted(next);
    this.emit();
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener();
  }
}

/** Shared singleton — one session per tab. */
export const swipeSessionStore = new SwipeSessionStore();
