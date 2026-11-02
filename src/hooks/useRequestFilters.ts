/**
 * Derived Discover filter state (Module 11).
 *
 * A thin, read-only binding between the URL-backed {@link RequestFilters} and
 * the pure helpers in `src/lib/requestFilters.ts`. Every derivation is memoised
 * on the request list plus the individual filter fields, so re-renders caused
 * by unrelated state never rebuild the grid.
 *
 * The hook is deliberately pure/read-only: it exposes no `resetFilters()` and
 * never writes to the URL. Filter writes belong to the route
 * (`/discover?q=…&category=…&sort=…`), which keeps the state shareable and
 * restorable via the browser back/forward buttons.
 *
 * IMPORTANT: filtering is presentation-only. Nothing produced here is ever fed
 * back into the swipe session store (`chief:swipe-session:v1`) — the swipe deck
 * keeps operating on the full, unfiltered queue.
 */

import { useMemo } from "react";

import type { Recipient } from "@/lib/recipients";
import { applyRequestFilters, requestCategories } from "@/lib/requestFilters";
import {
  ALL_CATEGORIES,
  DEFAULT_REQUEST_FILTERS,
  type RequestCategoryOption,
  type RequestFilters,
  type RequestSortKey,
} from "@/types/requestFilters";

/**
 * Stable empty array so a missing/invalid request list never re-creates the
 * reference on every render (which would defeat the memos below).
 */
const EMPTY_REQUESTS: Recipient[] = [];

/** Shape returned by {@link useRequestFilters}. */
export interface UseRequestFiltersResult {
  /** Category chips (with `all` first) and their live counts. */
  categories: RequestCategoryOption[];
  /** Matching requests, sorted. Always a fresh array. */
  results: Recipient[];
  /** Size of the unfiltered queue. */
  total: number;
  /** True when any filter deviates from the defaults. */
  isFiltered: boolean;
  /** Number of active filters (query + category + sort). */
  activeFilterCount: number;
  /** Short human summary, e.g. "3 of 12 requests" or "12 requests". */
  summary: string;
}

/**
 * Derive everything the Discover grid needs from the current filter state.
 *
 * @param requestList The full verified-request queue (may be non-array while a
 *                    future module hydrates it from the network).
 * @param filters     The URL-backed filter state.
 */
export function useRequestFilters(
  requestList: readonly Recipient[] | null | undefined,
  filters: RequestFilters,
): UseRequestFiltersResult {
  // Mirror the defensive `Array.isArray(recipients)` guard used by the route.
  const safeList = useMemo<readonly Recipient[]>(
    () => (Array.isArray(requestList) ? requestList : EMPTY_REQUESTS),
    [requestList],
  );

  // Read the individual fields so each memo only re-runs when its inputs change.
  const q = typeof filters?.q === "string" ? filters.q : DEFAULT_REQUEST_FILTERS.q;
  const category =
    typeof filters?.category === "string" && filters.category.trim()
      ? filters.category.trim()
      : DEFAULT_REQUEST_FILTERS.category;
  const sort: RequestSortKey = filters?.sort ?? DEFAULT_REQUEST_FILTERS.sort;

  // Chips ignore the category filter so the counts stay stable while browsing.
  const categories = useMemo(
    () => requestCategories(safeList, { q, category: ALL_CATEGORIES, sort }),
    [safeList, q, sort],
  );

  const applied = useMemo(
    () => applyRequestFilters(safeList, { q, category, sort }),
    [safeList, q, category, sort],
  );

  const { results, total, isFiltered, activeFilterCount } = applied;

  const summary = useMemo(() => {
    if (total === 0) return "No requests";
    if (isFiltered) {
      return `${results.length} of ${total} request${total === 1 ? "" : "s"}`;
    }
    return `${total} request${total === 1 ? "" : "s"}`;
  }, [isFiltered, results.length, total]);

  return useMemo<UseRequestFiltersResult>(
    () => ({
      categories,
      results,
      total,
      isFiltered,
      activeFilterCount,
      summary,
    }),
    [categories, results, total, isFiltered, activeFilterCount, summary],
  );
}

export default useRequestFilters;
