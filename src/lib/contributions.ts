/**
 * Personal giving ledger for the donor dashboard (Module 8).
 *
 * The ledger is intentionally framework-agnostic: it exposes a tiny
 * `useSyncExternalStore`-compatible surface (`subscribeToContributions`,
 * `getContributions`, `getServerContributions`) plus plain mutation helpers
 * (`recordContribution`, `clearContributions`) so any module can record a
 * pledge without owning dashboard state.
 *
 * Persistence:
 * - Contributions made through this module are stored under
 *   `chief:contributions:v1` in localStorage and survive reloads.
 * - Other modules may either call `recordContribution()` directly or dispatch a
 *   `chief:contribution` window event carrying `{ recipientName, amount, ... }`.
 * - As a best-effort backfill, any localStorage key that looks like a
 *   contribution/pledge ledger written by an earlier module is imported once it
 *   contains objects with both a recipient name and a positive amount. Every
 *   read is defensive (try/catch) so a corrupt entry can never break the page.
 *
 * Cross-tab: the `storage` event re-hydrates the snapshot so two open tabs stay
 * in sync.
 */

export type Contribution = {
  /** Stable identifier used for React keys and de-duplication. */
  id: string;
  /** Display name of the person whose bill was paid. */
  recipientName: string;
  /** Amount given, in whole Naira. */
  amount: number;
  /** Utility / biller the money went to. */
  billerName?: string;
  /** Bill category (Electricity, Water, ...) used for the accent colour. */
  category?: string;
  /** Optional recipient slug, kept for future deep links. */
  recipientSlug?: string;
  /** ISO timestamp of the pledge. */
  createdAt: string;
  /** Where the record came from (`dashboard`, `swipe-deck`, `event`, ...). */
  source?: string;
};

export type NewContribution = {
  id?: string;
  recipientName: string;
  amount: number;
  billerName?: string;
  category?: string;
  recipientSlug?: string;
  createdAt?: string;
  source?: string;
};

const STORAGE_KEY = "chief:contributions:v1";
const PLEDGE_EVENT = "chief:contribution";

/** Only localStorage keys that clearly belong to a giving ledger are imported. */
const IMPORT_KEY_PATTERN = /(contribution|pledge|giving|donation)/i;

const NAME_KEYS = [
  "recipientName",
  "recipient_name",
  "recipient",
  "payeeName",
  "payee",
  "name",
] as const;

const AMOUNT_KEYS = [
  "amount",
  "amountNgn",
  "amountNGN",
  "amountNaira",
  "naira",
  "value",
  "total",
] as const;

/** Shared empty array so the server snapshot is referentially stable. */
const EMPTY: Contribution[] = [];

let snapshot: Contribution[] = EMPTY;
let initialized = false;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/* -------------------------------------------------------------------------- */
/* Parsing helpers                                                            */
/* -------------------------------------------------------------------------- */

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    // Handles "₦2,500", "2500.00", "NGN 2 500" …
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) return Math.round(numeric);
  }
  return null;
}

function pickString(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0 && trimmed.length <= 120) return trimmed;
    }
  }
  return null;
}

function pickAmount(record: Record<string, unknown>): number | null {
  for (const key of AMOUNT_KEYS) {
    const amount = normalizeAmount(record[key]);
    if (amount !== null) return amount;
  }
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Turns an unknown record into a `Contribution` when it has both a recipient
 * name and a positive amount. Returns `null` for everything else so arbitrary
 * persisted objects never leak into the ledger.
 */
function toContribution(raw: unknown): Contribution | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const recipientName = pickString(record, NAME_KEYS);
  if (!recipientName) return null;

  const amount = pickAmount(record);
  if (amount === null) return null;

  const rawDate =
    record.createdAt ?? record.date ?? record.timestamp ?? record.pledgedAt;
  const createdAt =
    typeof rawDate === "string" && !Number.isNaN(Date.parse(rawDate))
      ? new Date(rawDate).toISOString()
      : new Date().toISOString();

  const billerName = pickString(record, [
    "billerName",
    "biller",
    "provider",
    "billProvider",
  ]);
  const category = pickString(record, [
    "category",
    "billCategory",
    "utility",
  ]);
  const recipientSlug = pickString(record, [
    "recipientSlug",
    "slug",
    "recipientId",
  ]);
  const explicitId = pickString(record, ["id", "contributionId", "pledgeId"]);
  const source = pickString(record, ["source", "origin"]);

  // Deterministic fallback id so the same imported pledge de-dupes across reads.
  const id =
    explicitId ??
    `auto-${slugify(recipientName)}-${amount}-${createdAt.slice(0, 10)}`;

  return {
    id,
    recipientName,
    amount,
    createdAt,
    ...(billerName ? { billerName } : {}),
    ...(category ? { category } : {}),
    ...(recipientSlug ? { recipientSlug } : {}),
    ...(source ? { source } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                    */
/* -------------------------------------------------------------------------- */

function readOwn(): Contribution[] {
  if (!isBrowser()) return [];

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  const parsed = safeParseJson(raw);
  if (!Array.isArray(parsed)) return [];

  const result: Contribution[] = [];
  for (const entry of parsed) {
    const contribution = toContribution(entry);
    if (contribution) result.push(contribution);
  }
  return result;
}

function writeOwn(list: readonly Contribution[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Private mode / quota exceeded — the in-memory snapshot still works.
  }
}

/** Recursively collects contribution-shaped objects from an arbitrary value. */
function collectFrom(value: unknown, out: Contribution[], depth: number): void {
  if (depth > 6 || value === null || typeof value !== "object") return;

  if (Array.isArray(value)) {
    for (const item of value) collectFrom(item, out, depth + 1);
    return;
  }

  const match = toContribution(value);
  if (match) {
    out.push(match);
    return;
  }

  for (const child of Object.values(value as Record<string, unknown>)) {
    collectFrom(child, out, depth + 1);
  }
}

/** Best-effort import from ledgers persisted by other modules. */
function readImported(): Contribution[] {
  if (!isBrowser()) return [];

  let keys: string[] = [];
  try {
    keys = Object.keys(window.localStorage);
  } catch {
    return [];
  }

  const found: Contribution[] = [];

  for (const key of keys) {
    if (key === STORAGE_KEY || !IMPORT_KEY_PATTERN.test(key)) continue;

    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      continue;
    }
    if (!raw || raw.length > 200_000) continue;

    const parsed = safeParseJson(raw);
    if (parsed === undefined) continue;

    collectFrom(parsed, found, 0);
  }

  return found.map((contribution) => ({ ...contribution, source: "import" }));
}

/* -------------------------------------------------------------------------- */
/* Snapshot management                                                        */
/* -------------------------------------------------------------------------- */

function normalizeList(list: readonly Contribution[]): Contribution[] {
  const seen = new Set<string>();
  const result: Contribution[] = [];

  for (const item of list) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result.sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.id.localeCompare(b.id);
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function computeSnapshot(): Contribution[] {
  if (!isBrowser()) return EMPTY;
  const merged = normalizeList([...readOwn(), ...readImported()]);
  return merged.length > 0 ? merged : EMPTY;
}

function notify(): void {
  for (const listener of listeners) listener();
}

function refresh(): void {
  snapshot = computeSnapshot();
  notify();
}

function appendContribution(contribution: Contribution): Contribution {
  const next = normalizeList([...readOwn(), contribution]);
  writeOwn(next);
  refresh();
  return contribution;
}

/* -------------------------------------------------------------------------- */
/* Event wiring                                                               */
/* -------------------------------------------------------------------------- */

function handlePledgeEvent(event: Event): void {
  const detail = (event as CustomEvent<unknown>).detail;

  if (Array.isArray(detail)) {
    for (const entry of detail) {
      const contribution = toContribution(entry);
      if (contribution) appendContribution(contribution);
    }
    return;
  }

  const contribution = toContribution(detail);
  if (contribution) appendContribution(contribution);
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  refresh();
}

function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;
  snapshot = computeSnapshot();

  if (!isBrowser()) return;

  window.addEventListener(PLEDGE_EVENT, handlePledgeEvent);
  window.addEventListener("storage", handleStorageEvent);
}

/* -------------------------------------------------------------------------- */
/* Public store surface                                                       */
/* -------------------------------------------------------------------------- */

/** Subscribe to ledger changes (useSyncExternalStore contract). */
export function subscribeToContributions(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Current ledger snapshot — referentially stable between changes. */
export function getContributions(): Contribution[] {
  ensureInitialized();
  return snapshot;
}

/** Server / hydration snapshot: always empty, re-rendered after mount. */
export function getServerContributions(): Contribution[] {
  return EMPTY;
}

/**
 * Records a pledge in the donor's giving ledger.
 * Returns `null` when the payload is invalid (missing name / non-positive
 * amount) so callers can surface a friendly error instead of corrupting state.
 */
export function recordContribution(input: NewContribution): Contribution | null {
  const recipientName = input.recipientName?.trim();
  const amount = normalizeAmount(input.amount);

  if (!recipientName || amount === null) return null;

  const createdAt =
    input.createdAt && !Number.isNaN(Date.parse(input.createdAt))
      ? new Date(input.createdAt).toISOString()
      : new Date().toISOString();

  const contribution: Contribution = {
    id: input.id ?? `pledge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    recipientName,
    amount,
    createdAt,
    source: input.source ?? "dashboard",
    ...(input.billerName ? { billerName: input.billerName } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.recipientSlug ? { recipientSlug: input.recipientSlug } : {}),
  };

  ensureInitialized();
  return appendContribution(contribution);
}

/** Clears the locally-stored ledger (imported records are re-derived). */
export function clearContributions(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures — refresh below still resets the snapshot.
  }
  refresh();
}

/**
 * Formats a Naira amount the way the product copy expects: `₦2,500`.
 * Built manually (instead of Intl currency) so the symbol and grouping never
 * depend on the runtime's ICU data.
 */
export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₦${safe.toLocaleString("en-US")}`;
}
