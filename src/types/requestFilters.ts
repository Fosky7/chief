/**
 * Discover filter model (Module 11).
 *
 * These types are intentionally framework free: they are shared by the URL
 * search-param parser (`parseRequestSearch`), the pure filtering helpers in
 * `src/lib/requestFilters.ts` and the read-only `useRequestFilters` hook.
 *
 * Filtering is presentation-only. Nothing here is ever written back into the
 * swipe session store (`chief:swipe-session:v1`) or the giving ledger.
 */

/** Sentinel category meaning "do not filter by category". */
export const ALL_CATEGORIES = "all";

/** Human label for the {@link ALL_CATEGORIES} chip. */
export const ALL_CATEGORIES_LABEL = "All";

/**
 * Supported sort orders for the browsable request grid.
 *
 * - `need`     — biggest outstanding amount first (default)
 * - `progress` — closest to fully funded first
 * - `amount`   — largest bill first
 * - `name`     — alphabetical by recipient name
 */
export type RequestSortKey = "need" | "progress" | "amount" | "name";

/** The complete, shareable filter state persisted in the URL. */
export interface RequestFilters {
  /** Free-text query matched against name, biller and location. */
  q: string;
  /** Category value, or {@link ALL_CATEGORIES}. */
  category: string;
  /** Active sort order. */
  sort: RequestSortKey;
}

/** Defaults used when a search param is absent or invalid. */
export const DEFAULT_REQUEST_FILTERS: RequestFilters = {
  q: "",
  category: ALL_CATEGORIES,
  sort: "need",
};

/** Runtime list of valid sort keys (used by the `isSortKey` guard). */
export const REQUEST_SORT_KEYS: readonly RequestSortKey[] = [
  "need",
  "progress",
  "amount",
  "name",
];

/** Sort options rendered by the sort control, in display order. */
export const REQUEST_SORT_OPTIONS: ReadonlyArray<{
  value: RequestSortKey;
  label: string;
  hint: string;
}> = [
  { value: "need", label: "Biggest need", hint: "Largest outstanding amount first" },
  { value: "progress", label: "Closest to funded", hint: "Nearly-complete bills first" },
  { value: "amount", label: "Largest bill", hint: "Biggest bill total first" },
  { value: "name", label: "A–Z", hint: "Alphabetical by recipient name" },
];

/** A single category chip: the filter value, its label and its live count. */
export interface RequestCategoryOption {
  value: string;
  label: string;
  count: number;
}
