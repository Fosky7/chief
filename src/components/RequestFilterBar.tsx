import { useId } from "react";
import type { ChangeEvent } from "react";

import { gradients, surfaces, typography } from "@/config/theme";
import {
  DEFAULT_REQUEST_FILTERS,
  type RequestSortKey,
} from "@/types/requestFilters";

/**
 * Filter controls for the browsable request grid on `/discover`.
 *
 * Presentation only: every change is reported straight back through the
 * `on*Change` callbacks, which the route writes into the URL. Nothing here
 * filters, sorts or stores state itself — the URL stays the single source of
 * truth, and `replace: true` navigation is untouched.
 *
 * Colourful redesign notes: the active category chip picks up
 * `gradients.chipGlow`, and the search field gets a brand-tinted focus ring /
 * border. 44px tap targets, labels and `aria-pressed` semantics are preserved.
 */

export interface RequestFilterCategory {
  value: string;
  label: string;
  count?: number;
}

export interface RequestFilterBarProps {
  /** Current filter state (mirrors the URL search params). */
  filters: { q?: string; category?: string; sort?: string };
  /** Category chips, including the “All” entry. */
  categories: readonly RequestFilterCategory[];
  /** Human-readable summary of the current result set. */
  summary: string;
  /** Number of filters that differ from the defaults (drives “Clear”). */
  activeFilterCount: number;
  onQueryChange: (q: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: RequestSortKey) => void;
  onReset: () => void;
  /** Extra classes for the outer panel. */
  className?: string;
}

/** Human labels for the sort keys we render as options. */
const SORT_LABELS: Record<string, string> = {
  "most-needed": "Most needed",
  "least-needed": "Least needed",
  newest: "Newest first",
  oldest: "Oldest first",
  largest: "Largest bill",
  smallest: "Smallest bill",
  urgent: "Most urgent",
};

/** Fallback set of sort options; the default key is always merged in below. */
const SORT_OPTION_VALUES: readonly string[] = [
  "most-needed",
  "newest",
  "largest",
];

/** Turn an unknown key like `due-soonest` into `Due soonest`. */
function prettifySortKey(value: string): string {
  const words = value.replace(/[-_]+/g, " ").trim();
  if (!words) return "Recommended";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** De-duplicate, drop empties, and keep the default key first. */
function sortOptionValues(current: string): string[] {
  const values = [DEFAULT_REQUEST_FILTERS.sort, ...SORT_OPTION_VALUES, current];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string" || value.length === 0) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

const chipFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const fieldLabel =
  "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export function RequestFilterBar({
  filters,
  categories,
  summary,
  activeFilterCount,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onReset,
  className,
}: RequestFilterBarProps) {
  const searchId = useId();
  const sortId = useId();
  const categoryLabelId = useId();

  const query = filters.q ?? "";
  const activeCategory = filters.category ?? DEFAULT_REQUEST_FILTERS.category;
  const currentSort = filters.sort ?? DEFAULT_REQUEST_FILTERS.sort;
  const chips = Array.isArray(categories) ? categories : [];

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    // The DOM only ever hands back a string from our own option list.
    onSortChange(event.target.value as RequestSortKey);
  };

  return (
    <div
      className={`${surfaces.card} relative overflow-hidden p-4 sm:p-5${
        className ? ` ${className}` : ""
      }`}
    >
      {/* Colourful chrome: spectrum rule + soft sheen, both behind the controls. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${gradients.spectrumDivider}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${gradients.cardSheen}`}
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Search ------------------------------------------------------- */}
          <div className="w-full sm:max-w-sm">
            <label htmlFor={searchId} className={fieldLabel}>
              Search
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Name, biller or location"
              autoComplete="off"
              className="mt-1 h-11 w-full rounded-full border border-input bg-card/90 px-4 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-[hsl(var(--brand-violet)/0.55)] focus:ring-2 focus:ring-[hsl(var(--brand-violet)/0.35)]"
            />
          </div>

          {/* Sort --------------------------------------------------------- */}
          <div className="w-full sm:w-52">
            <label htmlFor={sortId} className={fieldLabel}>
              Sort by
            </label>
            <select
              id={sortId}
              value={currentSort}
              onChange={handleSortChange}
              className="mt-1 h-11 w-full rounded-full border border-input bg-card/90 px-4 text-sm font-medium text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-[hsl(var(--brand-violet)/0.55)] focus:ring-2 focus:ring-[hsl(var(--brand-violet)/0.35)]"
            >
              {sortOptionValues(currentSort).map((value) => (
                <option key={value} value={value}>
                  {SORT_LABELS[value] ?? prettifySortKey(value)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear -------------------------------------------------------- */}
          {activeFilterCount > 0 ? (
            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={onReset}
                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary sm:w-auto ${chipFocus}`}
              >
                Clear filters
                <span className="rounded-full bg-brand-violet-soft px-1.5 text-xs font-semibold tabular-nums text-[hsl(var(--brand-violet))]">
                  {activeFilterCount}
                </span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Category chips ------------------------------------------------ */}
        <div>
          <p id={categoryLabelId} className={fieldLabel}>
            Category
          </p>
          <ul
            role="group"
            aria-labelledby={categoryLabelId}
            className="mt-2 flex flex-wrap gap-2"
          >
            {chips.map((chip) => {
              const isActive = chip.value === activeCategory;

              return (
                <li key={chip.value}>
                  <button
                    type="button"
                    onClick={() => onCategoryChange(chip.value)}
                    aria-pressed={isActive}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold tracking-tight transition-colors ${chipFocus} ${
                      isActive
                        ? `${gradients.chipGlow} border-[hsl(var(--brand-violet)/0.45)] text-foreground`
                        : "border-border bg-card/80 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${
                        isActive ? gradients.brandMark : "bg-border"
                      }`}
                    />
                    <span>{chip.label}</span>
                    {typeof chip.count === "number" ? (
                      <span className="tabular-nums text-muted-foreground">
                        {chip.count}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Live result summary ------------------------------------------ */}
        <p className={typography.caption} role="status">
          {summary}
        </p>
      </div>
    </div>
  );
}

export default RequestFilterBar;
