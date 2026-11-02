import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { buttons, typography } from "@/config/theme";
import { useSwipeSession } from "@/hooks/useSwipeSession";
import { formatNaira, recipients as seedRecipients } from "@/lib/recipients";

/**
 * DeckSummary — Module 6.
 *
 * The running session panel on `/discover`, which becomes the end-of-deck
 * summary once every verified request has been dismissed (skipped or pledged):
 *
 *  - "Bills reviewed" — how many cards were dismissed, out of the deck.
 *  - "Total pledged"  — the Naira value of the donor's pledges.
 *  - "You've reached the end" — shown the moment the deck is exhausted.
 *  - "Reset deck"     — restarts the demo from card 1 of 12.
 *
 * The two headline numbers are always visible so the donor can watch their
 * impact grow while they swipe; only the "deck complete" copy waits for the
 * final card. The panel reads the shared session store (`useSwipeSession`,
 * Module 4) — the same hook the swipe deck uses — so a drag, an arrow key or a
 * fallback button all land here with identical numbers. When the store is not
 * externally shared (or its public field names differ), the panel additionally
 * reads any persisted swipe/deck/session snapshot from localStorage, which
 * keeps the totals truthful without coupling to the store's internals.
 */

type UnknownRecord = Record<string, unknown>;

/** Size of the seeded deck — 12 in the demo. */
const SEED_DECK_SIZE = Array.isArray(seedRecipients) ? seedRecipients.length : 0;

/** Narrow an unknown value to a plain object record. */
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Read a finite number off a record, if that field exists. */
const readNumber = (record: UnknownRecord, key: string): number | undefined => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

/** Read a callable off a record, if that field exists. */
const readFunction = (record: UnknownRecord, key: string): (() => void) | undefined => {
  const value = record[key];
  return typeof value === "function" ? (value as () => void) : undefined;
};

/** Store objects sometimes nest their data one level down. */
const NESTED_STATE_KEYS = ["state", "session", "store", "snapshot", "data"] as const;

/** Fields a store may use to expose its history of dismissed cards. */
const DECISION_COLLECTION_KEYS = [
  "decisions",
  "swipes",
  "history",
  "events",
  "log",
] as const;

/** Candidate field names for the numbers this panel reports. */
const NUMBER_FIELDS = {
  reviewed: [
    "reviewed",
    "reviewedCount",
    "dismissed",
    "dismissedCount",
    "seenCount",
    "seen",
    "handled",
  ],
  total: ["total", "totalCount", "queueLength", "deckSize", "deckLength", "count"],
  pledged: ["totalPledged", "pledgedTotal", "totalPledgeAmount", "pledged", "amountPledged"],
  index: ["index", "currentIndex", "cursor", "position"],
} as const;

/** Boolean flags a store may publish for "nothing left to swipe". */
const EXHAUSTED_FIELDS = [
  "isExhausted",
  "exhausted",
  "isComplete",
  "complete",
  "isDone",
  "done",
  "finished",
] as const;

/** Actions that put the deck back at the first card. */
const RESET_FIELDS = [
  "reset",
  "resetDeck",
  "restart",
  "restartDeck",
  "startOver",
  "clearDeck",
] as const;

/** Direction markers used by different decision shapes. */
const PLEDGE_MARKERS = new Set(["pledge", "pledged", "pay", "paid", "right", "support"]);
const SKIP_MARKERS = new Set(["skip", "skipped", "pass", "passed", "left", "dismiss", "dismissed"]);

/**
 * Flatten a value into a list of records to inspect: the object itself, any
 * nested state object, and — if it is a tuple such as `[state, actions]` —
 * each element of that tuple.
 */
const collectSources = (value: unknown): UnknownRecord[] => {
  const sources: UnknownRecord[] = [];

  const visit = (current: unknown, depth: number): void => {
    if (depth > 1) return;

    if (Array.isArray(current)) {
      current.slice(0, 4).forEach((item) => visit(item, depth + 1));
      return;
    }

    if (!isRecord(current)) return;

    sources.push(current);

    for (const key of NESTED_STATE_KEYS) {
      const nested = current[key];
      if (isRecord(nested)) visit(nested, depth + 1);
    }
  };

  visit(value, 0);
  return sources;
};

/** First matching numeric field across every inspected source. */
const pickNumber = (sources: UnknownRecord[], keys: readonly string[]): number | undefined => {
  for (const source of sources) {
    for (const key of keys) {
      const value = readNumber(source, key);
      if (value !== undefined) return value;
    }
  }
  return undefined;
};

/** Pull the recorded skip/pledge decisions out of a store, if it keeps them. */
const readDecisions = (sources: UnknownRecord[]): UnknownRecord[] => {
  for (const source of sources) {
    for (const key of DECISION_COLLECTION_KEYS) {
      const value = source[key];
      if (Array.isArray(value) && value.length > 0) {
        return value.filter(isRecord);
      }
    }
  }
  return [];
};

/** Naira amount attached to a single decision (0 when it was a skip). */
const readDecisionAmount = (decision: UnknownRecord): number => {
  for (const key of ["amount", "pledgeAmount", "amountPledged", "value", "pledged"]) {
    const value = readNumber(decision, key);
    if (value !== undefined && value > 0) return value;
  }

  const recipient = decision.recipient;
  if (isRecord(recipient)) {
    for (const key of ["amountPledged", "pledged", "pledgeAmount"]) {
      const value = readNumber(recipient, key);
      if (value !== undefined && value > 0) return value;
    }
  }

  return 0;
};

/** True when a decision represents a pledge rather than a skip. */
const isPledgeDecision = (decision: UnknownRecord): boolean => {
  for (const key of ["action", "direction", "kind", "decision", "type", "swipe", "choice"]) {
    const value = decision[key];
    if (typeof value === "string") {
      const normalised = value.toLowerCase();
      if (PLEDGE_MARKERS.has(normalised)) return true;
      if (SKIP_MARKERS.has(normalised)) return false;
    }
  }

  // No explicit marker: a non-zero amount is the strongest remaining signal.
  return readDecisionAmount(decision) > 0;
};

/** The three numbers this panel reports. */
interface SessionTotals {
  /** Cards dismissed so far. */
  reviewed: number;
  /** Size of the deck — 12 in the seeded demo. */
  total: number;
  /** Naira value of everything pledged this session. */
  pledged: number;
}

/** Derive totals from an arbitrary collection of store records. */
const deriveTotals = (sources: UnknownRecord[]): SessionTotals | null => {
  if (sources.length === 0) return null;

  const decisions = readDecisions(sources);
  const index = pickNumber(sources, NUMBER_FIELDS.index) ?? 0;

  const reviewed =
    pickNumber(sources, NUMBER_FIELDS.reviewed) ??
    (decisions.length > 0 ? decisions.length : index);

  const pledgedFromDecisions = decisions.reduce(
    (sum, decision) => (isPledgeDecision(decision) ? sum + readDecisionAmount(decision) : sum),
    0,
  );

  return {
    reviewed: Math.max(reviewed, 0),
    total: pickNumber(sources, NUMBER_FIELDS.total) ?? 0,
    pledged: pickNumber(sources, NUMBER_FIELDS.pledged) ?? pledgedFromDecisions,
  };
};

/** localStorage keys the swipe session may persist under. */
const STORAGE_KEY_PATTERN = /swipe|deck|session/i;

/** Read every persisted swipe/deck/session snapshot as inspectable records. */
const readStoredSources = (): UnknownRecord[] => {
  if (typeof window === "undefined") return [];

  const sources: UnknownRecord[] = [];

  try {
    const storage = window.localStorage;
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || !STORAGE_KEY_PATTERN.test(key)) continue;

      const raw = storage.getItem(key);
      if (!raw) continue;

      try {
        sources.push(...collectSources(JSON.parse(raw) as unknown));
      } catch {
        // Not JSON — nothing to read from this key.
      }
    }
  } catch {
    // Storage can be unavailable (private mode / SSR).
  }

  return sources;
};

/**
 * Subscribe to the persisted session snapshot. Re-reads on storage events and
 * on a light interval so totals stay live even if the store instance used by
 * the deck is not externally shared.
 */
const useStoredTotals = (): SessionTotals | null => {
  const [totals, setTotals] = useState<SessionTotals | null>(null);

  useEffect(() => {
    let lastSignature: string | null = null;

    const refresh = () => {
      const next = deriveTotals(readStoredSources());
      const signature = next ? `${next.reviewed}:${next.total}:${next.pledged}` : null;
      if (signature === lastSignature) return;
      lastSignature = signature;
      setTotals(next);
    };

    refresh();
    const timer = window.setInterval(refresh, 800);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return totals;
};

interface DeckSnapshot {
  /** Cards dismissed so far (clamped to the deck size). */
  reviewed: number;
  /** Size of the deck — 12 in the seeded demo. */
  total: number;
  /** Naira value of everything pledged this session. */
  pledged: number;
  /** True when there is nothing left to swipe. */
  exhausted: boolean;
  /** Store action that returns the deck to the first card, when available. */
  reset?: () => void;
}

/** Normalise whatever the shared session hook returns into a `DeckSnapshot`. */
const readSnapshot = (session: unknown): DeckSnapshot => {
  const sources = collectSources(session);
  const totals = deriveTotals(sources);

  const total = totals?.total && totals.total > 0 ? totals.total : SEED_DECK_SIZE;
  const rawReviewed = totals?.reviewed ?? 0;
  const reviewed = total > 0 ? Math.min(Math.max(rawReviewed, 0), total) : rawReviewed;
  const pledged = totals?.pledged ?? 0;

  let explicitExhausted: boolean | undefined;
  for (const source of sources) {
    if (explicitExhausted !== undefined) break;
    for (const key of EXHAUSTED_FIELDS) {
      const value = source[key];
      if (typeof value === "boolean") {
        explicitExhausted = value;
        break;
      }
    }
  }

  let reset: (() => void) | undefined;
  for (const source of sources) {
    if (reset) break;
    for (const key of RESET_FIELDS) {
      reset = readFunction(source, key);
      if (reset) break;
    }
  }

  const exhausted = explicitExhausted ?? (total > 0 && reviewed >= total);

  return { reviewed, total, pledged, exhausted, reset };
};

/**
 * The shared hook is called with the seed deck so that — regardless of whether
 * it derives the queue from its argument or from module state — this panel
 * observes the same session as the swipe deck above it.
 */
type SessionHook = (queue?: unknown) => unknown;
const useSession = useSwipeSession as unknown as SessionHook;

export interface DeckSummaryProps {
  /** Extra classes applied by the parent for spacing. */
  className?: string;
}

/**
 * Session summary panel for the discover deck. The two headline numbers are
 * always on screen; the end-of-deck copy appears once every card is dismissed.
 */
export function DeckSummary({ className }: DeckSummaryProps) {
  const session = useSession(seedRecipients);
  const snapshot = readSnapshot(session);
  const stored = useStoredTotals();

  const total = snapshot.total > 0 ? snapshot.total : SEED_DECK_SIZE;
  const reviewed = total > 0
    ? Math.min(Math.max(snapshot.reviewed, stored?.reviewed ?? 0), total)
    : Math.max(snapshot.reviewed, stored?.reviewed ?? 0);
  const pledged = Math.max(snapshot.pledged, stored?.pledged ?? 0);
  const exhausted = snapshot.exhausted || (total > 0 && reviewed >= total);

  const { reset } = snapshot;

  const handleReset = useCallback(() => {
    try {
      if (reset) {
        reset();
        return;
      }
    } catch (error) {
      console.error("[DeckSummary] Reset action failed, falling back to a reload.", error);
    }

    // Last-resort demo reset: drop any persisted swipe state and reload so the
    // deck starts again at "1 of 12". Only swipe/deck/session keys are touched.
    try {
      const storage = window.localStorage;
      Object.keys(storage)
        .filter((key) => STORAGE_KEY_PATTERN.test(key))
        .forEach((key) => storage.removeItem(key));
    } catch {
      // Storage can be unavailable (private mode / SSR) — a reload still works.
    }
    window.location.reload();
  }, [reset]);

  if (total === 0) return null;

  return (
    <section
      aria-live="polite"
      data-testid="deck-summary"
      className={[
        "overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8",
        className ?? "",
      ].join(" ")}
    >
      <p className={typography.eyebrow}>{exhausted ? "Deck complete" : "Session summary"}</p>
      <h2 className={`mt-2 ${typography.heading}`}>
        {exhausted ? "You've reached the end" : "Your impact so far"}
      </h2>
      <p className={`mt-3 max-w-2xl ${typography.body}`}>
        {exhausted
          ? "That was every verified request in the queue. Your pledges are saved to your dashboard, and every bill you skipped stays open for another donor."
          : "Every card you review adds to your running totals — pledges are saved to your dashboard and skipped bills stay open for another donor."}
      </p>

      <dl className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/60 p-5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bills reviewed
          </dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {reviewed}
            <span className="ml-1 text-sm font-medium text-muted-foreground">of {total}</span>
          </dd>
        </div>

        <div className="rounded-2xl border border-border bg-muted/60 p-5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total pledged
          </dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {formatNaira(pledged)}
          </dd>
        </div>
      </dl>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleReset} className={buttons.primary}>
          Reset deck
        </button>
        <Link to="/dashboard" className={buttons.secondary}>
          View your pledges
        </Link>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Starting over puts you back on card 1 of {total}.
      </p>
    </section>
  );
}

export default DeckSummary;
