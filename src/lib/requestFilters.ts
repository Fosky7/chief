/**
 * Pure, dependency-free filtering helpers for the Discover grid (Module 11).
 *
 * Everything in this module is a plain function: no React, no browser APIs, no
 * side effects. The same helpers are used by the URL search-param parser
 * (TanStack Router `validateSearch`), the `useRequestFilters` hook and — if it
 * ever needs them — any test.
 *
 * IMPORTANT: these helpers are presentation-only. They must never be wired back
 * into the swipe session store (`chief:swipe-session:v1`) or the giving ledger.
 */

import { recipients } from "@/lib/recipients";
import type { Recipient } from "@/lib/recipients";
import {
  ALL_CATEGORIES,
  ALL_CATEGORIES_LABEL,
  DEFAULT_REQUEST_FILTERS,
  REQUEST_SORT_KEYS,
  type RequestCategoryOption,
  type RequestFilters,
  type RequestSortKey,
} from "@/types/requestFilters";

/* -------------------------------------------------------------------------- */
/* Guards                                                                     */
/* -------------------------------------------------------------------------- */

/** Type guard for a supported sort key. */
export function isSortKey(value: unknown): value is RequestSortKey {
  return (
    typeof value === "string" &&
    (REQUEST_SORT_KEYS as readonly string[]).includes(value)
  );
}

/**
 * Category values known to the app.
 *
 * Derived from the seeded request data (guarded, so a missing/empty seed can
 * never throw) so a newly added category is accepted by the URL parser without
 * any code change.
 */
const KNOWN_CATEGORIES: readonly string[] = (() => {
  try {
    const list = Array.isArray(recipients) ? recipients : [];
    const seen = new Set<string>();
    for (const request of list) {
      const value = categoryOf(request);
      if (value) seen.add(value);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
})();

/**
 * Type guard for a known category value.
 *
 * `all` always passes. When a reference list is supplied (or the seed data is
 * available) the value must match one of those categories, case-insensitively.
 * With no reference data at all, any non-empty string is accepted so a
 * network-fed queue keeps working before the first payload arrives.
 */
export function isKnownCategory(
  value: unknown,
  knownCategories: readonly string[] = KNOWN_CATEGORIES,
): value is string {
  if (typeof value !== "string") return false;
  const candidate = value.trim();
  if (!candidate) return false;
  if (candidate.toLowerCase() === ALL_CATEGORIES) return true;
  if (knownCategories.length === 0) return true;
  return knownCategories.some((entry) => sameCategory(entry, candidate));
}

/* -------------------------------------------------------------------------- */
/* Text normalisation                                                          */
/* -------------------------------------------------------------------------- */

/** Combining diacritical marks produced by `String.prototype.normalize("NFD")`. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Normalise free text for matching: trim, lowercase, NFD-decompose and strip
 * combining marks so "Adé" matches "ade" and "ADÉ" matches both.
 */
export function normalizeQuery(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .trim()
    .toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* URL search-param parsing                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Coerce an arbitrary search-param bag into a valid {@link RequestFilters}.
 *
 * Anything absent, of the wrong type or unrecognised falls back to
 * {@link DEFAULT_REQUEST_FILTERS}, so `/discover?category=garbage` renders the
 * full queue instead of an empty page.
 *
 * Intended for TanStack Router's `validateSearch`.
 */
export function parseRequestSearch(
  raw: Record<string, unknown> | null | undefined,
): RequestFilters {
  const source: Record<string, unknown> =
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  return {
    q: coerceQuery(source.q),
    category: resolveCategory(source.category),
    sort: isSortKey(source.sort) ? source.sort : DEFAULT_REQUEST_FILTERS.sort,
  };
}

/** Extract a usable query string from an unknown search-param value. */
function coerceQuery(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  // Arrays (`?q=a&q=b`) and objects are not meaningful here — ignore them.
  return DEFAULT_REQUEST_FILTERS.q;
}

/** Map an unknown category param onto a known category (or `all`). */
function resolveCategory(
  value: unknown,
  knownCategories: readonly string[] = KNOWN_CATEGORIES,
): string {
  if (typeof value !== "string") return ALL_CATEGORIES;
  const candidate = value.trim();
  if (!candidate) return ALL_CATEGORIES;
  if (candidate.toLowerCase() === ALL_CATEGORIES) return ALL_CATEGORIES;

  const match = knownCategories.find((entry) => sameCategory(entry, candidate));
  if (match) return match;

  // No reference data yet (e.g. a future network-fed queue): accept the value
  // as-is so the filter still works, otherwise fall back to "all".
  return knownCategories.length === 0 && isKnownCategory(candidate) ? candidate : ALL_CATEGORIES;
}

/* -------------------------------------------------------------------------- */
/* Category chips                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Build the category chips for the grid.
 *
 * The `all` chip comes first; every other chip is derived from the request list
 * itself (so new categories appear automatically, alphabetically) and counted
 * against the current query + sort but ignoring the category filter, which
 * keeps the counts stable while the donor switches categories.
 */
export function requestCategories(
  list: readonly Recipient[],
  filters?: Partial<RequestFilters> | null,
): RequestCategoryOption[] {
  const safeList: readonly Recipient[] = Array.isArray(list) ? list : [];
  const q = typeof filters?.q === "string" ? filters.q : DEFAULT_REQUEST_FILTERS.q;
  const sort: RequestSortKey = isSortKey(filters?.sort)
    ? filters.sort
    : DEFAULT_REQUEST_FILTERS.sort;

  // Counts ignore the category filter itself (category: ALL_CATEGORIES).
  const scoped = applyRequestFilters(safeList, {
    q,
    category: ALL_CATEGORIES,
    sort,
  });

  const counts = new Map<string, number>();
  for (const request of scoped.results) {
    const value = categoryOf(request);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const allCategories = uniqueCategories(safeList);

  return [
    {
      value: ALL_CATEGORIES,
      label: ALL_CATEGORIES_LABEL,
      count: scoped.results.length,
    },
    ...allCategories.map((value) => ({
      value,
      label: value,
      count: counts.get(value) ?? 0,
    })),
  ];
}

/** Sorted, de-duplicated list of the categories present in `list`. */
function uniqueCategories(list: readonly Recipient[]): string[] {
  const seen = new Set<string>();
  for (const request of list) {
    const value = categoryOf(request);
    if (value) seen.add(value);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

/** Trimmed category of a request, or an empty string when unavailable. */
function categoryOf(request: Recipient | null | undefined): string {
  if (!request || typeof request.category !== "string") return "";
  return request.category.trim();
}

/** Case-insensitive category comparison. */
function sameCategory(a: string, b: string): boolean {
  return normalizeQuery(a) === normalizeQuery(b);
}

/* -------------------------------------------------------------------------- */
/* Funding maths                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Share of a bill already covered by pledges, as a whole percentage (0–100).
 * Defensive: missing/non-numeric/zero totals resolve to `0` instead of `NaN`.
 */
export function percentFunded(
  recipient: Pick<Recipient, "amount" | "stillNeeded"> | null | undefined,
): number {
  if (!recipient) return 0;
  const amount = toFiniteNumber(recipient.amount);
  const stillNeeded = toFiniteNumber(recipient.stillNeeded);
  if (amount <= 0) return 0;

  const funded = amount - stillNeeded;
  const ratio = (funded / amount) * 100;
  if (!Number.isFinite(ratio)) return 0;

  return Math.min(100, Math.max(0, Math.round(ratio)));
}

/** Coerce an unknown value into a finite number (0 when it is not numeric). */
function toFiniteNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

/* -------------------------------------------------------------------------- */
/* Sorting                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Comparator for the browsable grid.
 *
 * Every mode tie-breaks by `name` and then by `id`, which gives a stable order
 * (no reshuffling between renders) even when the primary value is identical.
 */
export function compareRequests(
  a: Recipient,
  b: Recipient,
  sort: RequestSortKey = DEFAULT_REQUEST_FILTERS.sort,
): number {
  let primary = 0;

  switch (sort) {
    case "progress":
      primary = percentFunded(b) - percentFunded(a);
      break;
    case "amount":
      primary = toFiniteNumber(b.amount) - toFiniteNumber(a.amount);
      break;
    case "name":
      primary = nameOf(a).localeCompare(nameOf(b));
      break;
    case "need":
    default:
      primary = toFiniteNumber(b.stillNeeded) - toFiniteNumber(a.stillNeeded);
      break;
  }

  if (primary !== 0) return primary;

  const byName = nameOf(a).localeCompare(nameOf(b));
  if (byName !== 0) return byName;

  return idOf(a).localeCompare(idOf(b));
}

function nameOf(request: Recipient | null | undefined): string {
  return request && typeof request.name === "string" ? request.name : "";
}

function idOf(request: Recipient | null | undefined): string {
  return request && request.id != null ? String(request.id) : "";
}

/* -------------------------------------------------------------------------- */
/* Filtering                                                                  */
/* -------------------------------------------------------------------------- */

/** Result of applying the current filter state to a request list. */
export interface RequestFilterResult {
  /** Matching requests, sorted; always a fresh array. */
  results: Recipient[];
  /** Size of the unfiltered input list. */
  total: number;
  /** True when the query, category or sort differs from the defaults. */
  isFiltered: boolean;
  /** How many filters are doing something (query + category + sort). */
  activeFilterCount: number;
}

/**
 * Apply the query + category filters and the sort order to a request list.
 *
 * The input array is never mutated: the filtered copy is sorted in place, not
 * the caller's list.
 */
export function applyRequestFilters(
  list: readonly Recipient[],
  filters?: Partial<RequestFilters> | null,
): RequestFilterResult {
  const safeList: readonly Recipient[] = Array.isArray(list) ? list : [];

  const rawQuery = typeof filters?.q === "string" ? filters.q : DEFAULT_REQUEST_FILTERS.q;
  const query = normalizeQuery(rawQuery);
  const category =
    typeof filters?.category === "string" && filters.category.trim()
      ? filters.category.trim()
      : DEFAULT_REQUEST_FILTERS.category;
  const sort: RequestSortKey = isSortKey(filters?.sort)
    ? filters.sort
    : DEFAULT_REQUEST_FILTERS.sort;

  const filtered = safeList.filter((request) => {
    if (!matchesCategory(request, category)) return false;
    if (!query) return true;
    return searchHaystack(request).includes(query);
  });

  // `filtered` is already a new array, so sorting it cannot touch the input.
  filtered.sort((a, b) => compareRequests(a, b, sort));

  let activeFilterCount = 0;
  if (query) activeFilterCount += 1;
  if (category !== ALL_CATEGORIES) activeFilterCount += 1;
  if (sort !== DEFAULT_REQUEST_FILTERS.sort) activeFilterCount += 1;

  return {
    results: filtered,
    total: safeList.length,
    isFiltered: activeFilterCount > 0,
    activeFilterCount,
  };
}

/** Does a request belong to the chosen category (or is `all` selected)? */
function matchesCategory(request: Recipient, category: string): boolean {
  if (category === ALL_CATEGORIES) return true;
  const value = categoryOf(request);
  return value !== "" && sameCategory(value, category);
}

/** Normalised name + biller + location, searched with `String#includes`. */
function searchHaystack(request: Recipient): string {
  const parts = [request.name, request.biller, request.location];
  return normalizeQuery(
    parts.filter((part): part is string => typeof part === "string").join(" "),
  );
}

/** Convenience: the display label for a category value. */
export function categoryLabel(value: string): string {
  return value === ALL_CATEGORIES ? ALL_CATEGORIES_LABEL : value;
}
