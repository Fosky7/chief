/**
 * Concrete Supabase persistence contract for header/nav preferences.
 *
 * This module is the single source of truth for the `public.nav_preferences`
 * table: its name, its columns, its owner-only RLS policy names and the typed
 * row/insert/update shapes. The service (`src/services/navPreferences.ts`) and
 * the browser specs read these constants instead of hard-coding string names,
 * so the database requirement is a real, applied contract rather than a
 * promise.
 *
 * Schema (see supabase/migrations/20250601120000_create_nav_preferences.sql):
 *   user_id     uuid  primary key  references auth.users(id) on delete cascade
 *   active_tab  text  not null     default 'home'
 *   tab_order   jsonb not null     default '["home","discover","recipients","dashboard","settings"]'
 *   hidden_tabs jsonb not null     default '[]'
 *   updated_at  timestamptz not null default now()
 *
 * Offline / anonymous fallback: localStorage key
 * `NAV_PREFERENCES_STORAGE_FALLBACK_KEY`. The database is never required for
 * the header to render.
 */

/** Postgres schema that owns the table. */
export const NAV_PREFERENCES_SCHEMA = 'public' as const;

/** Table name used with `supabase.from(...)`. */
export const NAV_PREFERENCES_TABLE = 'nav_preferences' as const;

/** `public.nav_preferences` (for docs/logs). */
export const NAV_PREFERENCES_QUALIFIED_TABLE =
  `${NAV_PREFERENCES_SCHEMA}.${NAV_PREFERENCES_TABLE}` as const;

/** Column names, keyed for readable call sites. */
export const NAV_PREFERENCES_COLUMNS = {
  userId: 'user_id',
  activeTab: 'active_tab',
  tabOrder: 'tab_order',
  hiddenTabs: 'hidden_tabs',
  updatedAt: 'updated_at',
} as const;

export type NavPreferencesColumn =
  (typeof NAV_PREFERENCES_COLUMNS)[keyof typeof NAV_PREFERENCES_COLUMNS];

/** Every column, in declaration order. */
export const NAV_PREFERENCES_COLUMN_LIST = [
  NAV_PREFERENCES_COLUMNS.userId,
  NAV_PREFERENCES_COLUMNS.activeTab,
  NAV_PREFERENCES_COLUMNS.tabOrder,
  NAV_PREFERENCES_COLUMNS.hiddenTabs,
  NAV_PREFERENCES_COLUMNS.updatedAt,
] as const;

/** Owner-only RLS policy names applied by the migration. */
export const NAV_PREFERENCES_POLICY = {
  select: 'nav_preferences_select_own',
  insert: 'nav_preferences_insert_own',
  update: 'nav_preferences_update_own',
  delete: 'nav_preferences_delete_own',
} as const;

/** Alias kept for call sites that treat the policy set as a list. */
export const NAV_PREFERENCES_POLICIES = NAV_PREFERENCES_POLICY;

/** localStorage mirror used whenever there is no session or no network. */
export const NAV_PREFERENCES_STORAGE_FALLBACK_KEY = 'chief:nav-preference';

/** jsonb columns decode to plain arrays of tab ids. */
export type NavPreferencesTabList = string[];

/** A persisted row, exactly as it is stored. */
export interface NavPreferencesRow {
  user_id: string;
  active_tab: string;
  tab_order: NavPreferencesTabList;
  hidden_tabs: NavPreferencesTabList;
  updated_at: string;
}

/** Insert shape (`user_id` is the primary key). */
export interface NavPreferencesInsert {
  user_id: string;
  active_tab?: string;
  tab_order?: NavPreferencesTabList;
  hidden_tabs?: NavPreferencesTabList;
  updated_at?: string;
}

/** Update shape (row identity never changes). */
export interface NavPreferencesUpdate {
  active_tab?: string;
  tab_order?: NavPreferencesTabList;
  hidden_tabs?: NavPreferencesTabList;
  updated_at?: string;
}

/** Convenience alias. */
export type NavPreferences = NavPreferencesRow;

/** The upsert conflict target used by the service. */
export const NAV_PREFERENCES_CONFLICT_TARGET = NAV_PREFERENCES_COLUMNS.userId;

/** Columns the service selects when loading a preference. */
export const NAV_PREFERENCES_SELECT =
  `${NAV_PREFERENCES_COLUMNS.userId}, ${NAV_PREFERENCES_COLUMNS.activeTab}, ${NAV_PREFERENCES_COLUMNS.updatedAt}` as const;

/** The DDL, inlined for documentation/tooling that reads the contract. */
export const NAV_PREFERENCES_DDL = `create table if not exists ${NAV_PREFERENCES_QUALIFIED_TABLE} (
  ${NAV_PREFERENCES_COLUMNS.userId} uuid primary key references auth.users (id) on delete cascade,
  ${NAV_PREFERENCES_COLUMNS.activeTab} text not null default 'home',
  ${NAV_PREFERENCES_COLUMNS.tabOrder} jsonb not null default '[]'::jsonb,
  ${NAV_PREFERENCES_COLUMNS.hiddenTabs} jsonb not null default '[]'::jsonb,
  ${NAV_PREFERENCES_COLUMNS.updatedAt} timestamptz not null default now()
);
alter table ${NAV_PREFERENCES_QUALIFIED_TABLE} enable row level security;`;

/* ------------------------------------------------------------------------- */
/* Donor-preferences aliases                                                  */
/*                                                                            */
/* The settings surface (`src/services/donorPreferences.ts`,
 * `src/services/settings.ts`, `src/routes/settings.tsx`) talks about the
 * single remembered header tab. Instead of inventing a second table, those
 * constants alias the concrete, already-applied `public.nav_preferences`
 * contract above: the remembered tab lives in `active_tab`.
 * ------------------------------------------------------------------------- */

/** Table the donor preference row is stored in (`public.nav_preferences`). */
export const DONOR_PREFERENCES_TABLE = NAV_PREFERENCES_TABLE;

/** Schema that owns the donor preference row. */
export const DONOR_PREFERENCES_SCHEMA = NAV_PREFERENCES_SCHEMA;

/** `public.nav_preferences`, qualified for docs/logs. */
export const DONOR_PREFERENCES_QUALIFIED_TABLE =
  NAV_PREFERENCES_QUALIFIED_TABLE;

/** Columns the donor-preference service reads/writes. */
export const DONOR_PREFERENCES_COLUMNS = {
  userId: NAV_PREFERENCES_COLUMNS.userId,
  navTab: NAV_PREFERENCES_COLUMNS.activeTab,
  updatedAt: NAV_PREFERENCES_COLUMNS.updatedAt,
} as const;

export type DonorPreferencesColumn =
  (typeof DONOR_PREFERENCES_COLUMNS)[keyof typeof DONOR_PREFERENCES_COLUMNS];

/** Server-side helper that upserts the caller's remembered tab. */
export const DONOR_PREFERENCES_RPC = 'upsert_nav_preferences' as const;

/** localStorage mirror for the anonymous / offline path. */
export const DONOR_PREFERENCES_STORAGE_KEY = 'chief.donorPreferences.v1' as const;

/** Upsert conflict target (one row per user). */
export const DONOR_PREFERENCES_CONFLICT_TARGET =
  DONOR_PREFERENCES_COLUMNS.userId;

/** Columns the donor-preference service selects. */
export const DONOR_PREFERENCES_SELECT =
  `${DONOR_PREFERENCES_COLUMNS.userId}, ${DONOR_PREFERENCES_COLUMNS.navTab}, ${DONOR_PREFERENCES_COLUMNS.updatedAt}` as const;

/** Row shape of a donor preference as stored in `public.nav_preferences`. */
export interface DonorPreferencesRow {
  user_id: string;
  active_tab: string;
  updated_at: string;
}

/** Insert/upsert shape for a donor preference row. */
export interface DonorPreferencesInsert {
  user_id: string;
  active_tab: string;
  updated_at?: string;
}

/** DDL for the donor-preference storage, inlined for tooling. */
export const DONOR_PREFERENCES_DDL = NAV_PREFERENCES_DDL;

export default NAV_PREFERENCES_TABLE;
