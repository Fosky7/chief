import { useCallback, useMemo, useSyncExternalStore } from "react";

import * as ledger from "@/lib/contributions";

/**
 * Personal giving ledger hook (Module 8).
 *
 * `@/lib/contributions` owns the raw, persistent ledger (localStorage + a
 * `chief:contribution` window event + cross-tab `storage` sync). This hook is
 * the thin React adapter around it:
 *
 * - `useSyncExternalStore` subscribes to the ledger so every consumer re-renders
 *   the moment a pledge is recorded (e.g. right after a ₦2,500 contribution).
 * - Raw entries are normalised into a stable, presentation-friendly
 *   `ContributionView` shape so the dashboard never has to guess field names.
 * - Totals (total given / pledge count / people supported) are memoised.
 *
 * Every read is defensive: a corrupt or partially-shaped entry can never break
 * the dashboard, it simply renders as "₦0" / is skipped.
 */

export type ContributionView = {
  /** Stable key for React lists. */
  id: string;
  /** Name of the person whose bill was paid (e.g. "Maria Alvarez"). */
  recipientName: string;
  /** Amount in Naira (not kobo). */
  amount: number;
  /** Pre-formatted Naira string, e.g. "₦2,500". */
  formattedAmount: string;
  /** Optional biller/category label, e.g. "Electricity bill". */
  category?: string;
  /** Optional short note/description for the pledge. */
  note?: string;
  /** ISO timestamp of the pledge ("" when unknown). */
  createdAt: string;
  /** Human readable date, e.g. "12 Mar 2025" (falls back to "Recently"). */
  formattedDate: string;
};

type RawContribution = Record<string, unknown>;

type LedgerBridge = {
  subscribeToContributions?: (listener: () => void) => unknown;
  getContributions?: () => unknown;
  getServerContributions?: () => unknown;
  clearContributions?: () => unknown;
};

const bridge = ledger as unknown as LedgerBridge;

const EMPTY_VIEWS: readonly ContributionView[] = [];
const EMPTY_RAW: readonly RawContribution[] = [];

const NAIRA_SIGN = "\u20A6";

const amountFormatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Format a Naira amount the way the product speaks: `₦2,500` (no trailing
 * `.00` for whole amounts, at most two decimals otherwise).
 */
export function formatNairaAmount(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  return `${NAIRA_SIGN}${amountFormatter.format(safe)}`;
}

function formatPledgeDate(iso: string): string {
  if (!iso) return "Recently";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";
  return dateFormatter.format(date);
}

function pickValue(source: RawContribution, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    const nested = value as RawContribution;
    return toNumber(nested.amount ?? nested.value ?? nested.total);
  }
  return null;
}

function resolveRecipientName(raw: RawContribution): string {
  const direct = pickValue(raw, [
    "recipientName",
    "recipient",
    "recipientTitle",
    "payeeName",
    "payee",
    "name",
    "biller",
  ]);

  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  if (direct && typeof direct === "object") {
    const nested = direct as RawContribution;
    const nestedName = pickValue(nested, ["name", "fullName", "title", "displayName"]);
    if (typeof nestedName === "string" && nestedName.trim()) {
      return nestedName.trim();
    }
  }

  return "Verified request";
}

function resolveAmount(raw: RawContribution): number {
  // Some ledgers record kobo; prefer an explicit kobo field when present.
  const kobo = toNumber(
    pickValue(raw, ["amountKobo", "amount_kobo", "amountInKobo", "kobo"]),
  );
  if (kobo !== null) {
    return Math.round(kobo) / 100;
  }

  const naira = toNumber(
    pickValue(raw, [
      "amountNaira",
      "amount",
      "pledgeAmount",
      "total",
      "value",
    ]),
  );

  return naira !== null ? naira : 0;
}

function resolveCreatedAt(raw: RawContribution): string {
  const value = pickValue(raw, [
    "createdAt",
    "created_at",
    "pledgedAt",
    "timestamp",
    "date",
    "time",
  ]);

  if (typeof value === "string" && value.trim()) return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  return "";
}

function normaliseEntry(raw: RawContribution, index: number): ContributionView {
  const amount = resolveAmount(raw);
  const createdAt = resolveCreatedAt(raw);

  const idValue = pickValue(raw, ["id", "contributionId", "transactionId", "reference"]);
  const categoryValue = pickValue(raw, ["category", "categoryLabel", "billCategory", "service"]);
  const noteValue = pickValue(raw, ["note", "description", "message", "billTitle"]);

  return {
    id:
      typeof idValue === "string" && idValue.trim()
        ? idValue.trim()
        : `contribution-${index}`,
    recipientName: resolveRecipientName(raw),
    amount,
    formattedAmount: formatNairaAmount(amount),
    category:
      typeof categoryValue === "string" && categoryValue.trim()
        ? categoryValue.trim()
        : undefined,
    note:
      typeof noteValue === "string" && noteValue.trim() ? noteValue.trim() : undefined,
    createdAt,
    formattedDate: formatPledgeDate(createdAt),
  };
}

function normaliseAll(raw: readonly RawContribution[]): readonly ContributionView[] {
  if (raw.length === 0) return EMPTY_VIEWS;
  return raw.map((entry, index) =>
    normaliseEntry(entry && typeof entry === "object" ? entry : {}, index),
  );
}

function readClientRaw(): readonly RawContribution[] {
  try {
    if (typeof bridge.getContributions !== "function") return EMPTY_RAW;
    const value = bridge.getContributions();
    return Array.isArray(value) ? (value as readonly RawContribution[]) : EMPTY_RAW;
  } catch {
    return EMPTY_RAW;
  }
}

function readServerRaw(): readonly RawContribution[] {
  try {
    if (typeof bridge.getServerContributions === "function") {
      const value = bridge.getServerContributions();
      if (Array.isArray(value)) return value as readonly RawContribution[];
    }
  } catch {
    // fall through to empty
  }
  return EMPTY_RAW;
}

function snapshotKey(entry: RawContribution): string {
  const id = entry.id ?? entry.contributionId ?? entry.transactionId ?? entry.reference;
  if (typeof id === "string" && id) return `id:${id}`;
  return `v:${String(entry.recipientName ?? entry.recipient ?? entry.name ?? "")}|${String(
    entry.amount ?? entry.amountNaira ?? entry.amountKobo ?? "",
  )}|${String(entry.createdAt ?? entry.timestamp ?? entry.date ?? "")}`;
}

/**
 * Guard against ledgers that hand back a freshly-built array on every read —
 * `useSyncExternalStore` requires a referentially stable snapshot or React
 * loops forever. We compare by content and reuse the cached view array.
 */
function isSameSnapshot(
  next: readonly RawContribution[],
  previous: readonly RawContribution[],
): boolean {
  if (next === previous) return true;
  if (next.length !== previous.length) return false;

  for (let index = 0; index < next.length; index += 1) {
    if (next[index] === previous[index]) continue;
    if (snapshotKey(next[index]) !== snapshotKey(previous[index])) return false;
  }

  return true;
}

let cachedRaw: readonly RawContribution[] | null = null;
let cachedViews: readonly ContributionView[] = EMPTY_VIEWS;
let serverViews: readonly ContributionView[] = EMPTY_VIEWS;

function getClientSnapshot(): readonly ContributionView[] {
  const raw = readClientRaw();

  if (cachedRaw !== null && isSameSnapshot(raw, cachedRaw)) {
    return cachedViews;
  }

  cachedRaw = raw;
  cachedViews = normaliseAll(raw);
  return cachedViews;
}

function getServerSnapshot(): readonly ContributionView[] {
  if (serverViews === EMPTY_VIEWS) {
    const raw = readServerRaw();
    serverViews = raw.length === 0 ? EMPTY_VIEWS : normaliseAll(raw);
  }
  return serverViews;
}

function subscribe(onStoreChange: () => void): () => void {
  const teardown: Array<() => void> = [];

  if (typeof bridge.subscribeToContributions === "function") {
    try {
      const unsubscribe = bridge.subscribeToContributions(onStoreChange);
      if (typeof unsubscribe === "function") {
        teardown.push(unsubscribe as () => void);
      }
    } catch {
      // ignore — the window listeners below keep the page live
    }
  }

  if (typeof window !== "undefined") {
    const onExternalChange = () => onStoreChange();

    // A pledge recorded anywhere in the app (e.g. recipient detail) fires this.
    window.addEventListener("chief:contribution", onExternalChange);
    // Cross-tab sync.
    window.addEventListener("storage", onExternalChange);

    teardown.push(() => {
      window.removeEventListener("chief:contribution", onExternalChange);
      window.removeEventListener("storage", onExternalChange);
    });
  }

  return () => {
    for (const dispose of teardown) {
      try {
        dispose();
      } catch {
        // never let teardown break unmount
      }
    }
  };
}

export type UseContributionsResult = {
  /** Normalised pledges, newest first (as the ledger stores them). */
  contributions: readonly ContributionView[];
  /** Sum of every pledge, in Naira. */
  total: number;
  /** `total` pre-formatted, e.g. "₦2,500". */
  formattedTotal: string;
  /** Number of pledges recorded. */
  pledgeCount: number;
  /** Distinct recipients supported. */
  recipientCount: number;
  /** True until the donor makes their first pledge. */
  isEmpty: boolean;
  /** Wipes the local ledger (used by the demo reset flow). */
  clear: () => void;
};

/**
 * Subscribe to the donor's personal giving ledger.
 */
export function useContributions(): UseContributionsResult {
  const contributions = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const { total, pledgeCount, recipientCount } = useMemo(() => {
    let sum = 0;
    const names = new Set<string>();

    for (const contribution of contributions) {
      sum += contribution.amount;
      const key = contribution.recipientName.trim().toLowerCase();
      if (key) names.add(key);
    }

    return {
      total: sum,
      pledgeCount: contributions.length,
      recipientCount: names.size,
    };
  }, [contributions]);

  const clear = useCallback(() => {
    try {
      if (typeof bridge.clearContributions === "function") {
        bridge.clearContributions();
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("chief:contribution"));
      }
    } catch {
      // best effort — the UI simply keeps the old snapshot
    }
  }, []);

  return {
    contributions,
    total,
    formattedTotal: formatNairaAmount(total),
    pledgeCount,
    recipientCount,
    isEmpty: contributions.length === 0,
    clear,
  };
}

export default useContributions;
