# Chief — Implementation Plan

## Module 1 — App foundation & landing page

### Goal
Ship the shared app chrome (header + shell) and a landing page at `/` that explains the product
and funnels users into discovery.

### Acceptance criteria (Module 1)

| # | Criterion | Where it lives |
|---|-----------|----------------|
| 1 | Landing hero shows the text **"Swipe right to pay a bill"** | `src/routes/index.tsx` (hero section) |
| 2 | Clicking **"Start swiping"** reveals a section headed **"Verified requests"** | `src/routes/index.tsx` (`useState` toggle + `useRef` scroll) |
| 3 | The page shows a **"How it works"** section with three numbered steps | `src/routes/index.tsx` (three steps from `landingSteps`) |
| 4 | The header shows the nav links **"Discover"** and **"Dashboard"** | `src/components/Header.tsx` via `siteConfig.navigation`, rendered by `AppShell` on every page |
| 5 | Clicking **Discover** opens `/discover` showing "Verified requests" | `src/routes/discover.tsx` |
| 6 | Clicking **Dashboard** opens `/dashboard` showing "Your pledges" | `src/routes/dashboard.tsx` |

### Design tokens
All colors, gradients, spacing and copy come from `src/config/theme.ts`. No hardcoded color
values in components — use Tailwind token classes (`bg-background`, `text-muted-foreground`,
`border-border`, `ring-ring`, `text-primary-foreground`, …) and the exported `gradients` /
`layout` helpers.

### Architecture

```
src/
  components/
    AppShell.tsx      // sticky header + <main> + footer chrome (wraps every page)
    Header.tsx        // brand lockup + primary nav (Discover / Dashboard)
  config/
    theme.ts          // siteConfig (name, nav), gradients, layout helpers, landingSteps
  routes/
    index.tsx         // landing page (hero, Start swiping toggle, How it works)
    discover.tsx      // /discover — verified request queue
    dashboard.tsx     // /dashboard — donor pledge summary
```

`AppShell` is the single source of page chrome. Every route renders inside it so navigation is
always one click away — including `/`, which is what surfaces the **Discover** and
**Dashboard** links on the landing page.

### Interaction design

1. **Hero** — headline "Swipe right to pay a bill", supporting paragraph, primary CTA
   **Start swiping**.
2. **Start swiping** — sets local state `hasStarted = true`, which mounts the
   **Verified requests** panel (a preview list of verified bills) and scrolls it into view.
   The panel also links to `/discover` and `/dashboard`.
3. **How it works** — ordered list (`<ol>`) with three numbered steps: verify the bill, browse
   verified requests, swipe right to pay.
4. **Discover** — the verified request queue, each card showing recipient, biller, bill total and
   the amount still needed.
5. **Dashboard** — "Your pledges" totals plus a pledge history list, with "Back to Discover".

### Accessibility
- Header nav uses `<nav aria-label="Primary">` with TanStack Router `activeProps` for the
  current route.
- A single `<h1>` per page and a skip-to-content link in `AppShell`.
- Focus-visible rings are preserved on all interactive elements.
- The revealed panel is announced via `aria-live="polite"` and linked with `aria-controls`.

### Out of scope for this module
Card swipe gestures, real bill data, authentication and payments land in Module 2+.

---

## Module 10 — Donor settings

### Goal
Give a signed-in donor one place to shape how Chief behaves: the name they are greeted with, the
pledge amount they reach for first (NGN presets), which notifications they want, a
reduced-motion/accessibility preference, and housekeeping for the local swipe session — all of it
stored on this device and resettable, and none of it able to touch the giving ledger.

### Architecture

```
src/
  types/
    preferences.ts          // DonorPreferences, DEFAULT_PREFERENCES, NGN presets, clamping helpers
  services/
    donorPreferences.ts     // localStorage store (chief:preferences:v1) + subscribe/getSnapshot
  hooks/
    useDonorPreferences.ts  // useSyncExternalStore binding -> { preferences, actions }
  components/
    SettingRow.tsx          // SettingRow / Chief / SettingSelect primitives
    Toast.tsx               // polite live-region toast with optional Undo
    AppShell.tsx            // footer site nav now includes Settings
    Header.tsx              // primary nav now includes Settings
  routes/
    settings.tsx            // /settings — the settings page
```

The store follows exactly the pattern established by `src/services/swipeSession.ts`: a module-scope
snapshot plus `subscribe(listener)` / `getSnapshot()`, consumed through `useSyncExternalStore` in a
thin hook. Every setter writes through to `localStorage` inside a `try`/`catch` and notifies
subscribers; a window `storage` listener re-syncs a second tab.

### Acceptance criteria (Module 10)

| # | Criterion | Where it lives |
|---|-----------|----------------|
| 1 | The header shows a **"Settings"** link beside **Discover** and **Dashboard** | `src/components/Header.tsx` → `siteConfig.navigation`, rendered by `AppShell` |
| 2 | The footer shows a **"Settings"** link on every page, including small screens | `src/components/AppShell.tsx` (footer `<nav aria-label="Site">`) |
| 3 | Clicking **Settings** opens `/settings` showing **"Settings"** as the single `<h1>` | `src/routes/settings.tsx` |
| 4 | The donor can set a **display name**; it is saved (debounced while typing, and on blur) | `src/routes/settings.tsx` + `actions.setDisplayName` |
| 5 | The donor can pick a **preferred pledge amount** from the NGN presets (₦500 / ₦1,000 / ₦2,500 / ₦5,000) | `src/components/SettingRow.tsx` (`SettingSelect`) + `actions.setPreferredAmount` |
| 6 | Two **notification** toggles (new verified request, payment confirmation) and an **anonymous giving** toggle persist | `Chief` (`role="switch"`, `aria-checked`) + `actions.toggleNotification` / `actions.setAnonymousGiving` |
| 7 | A **Reduce motion** switch persists and shows the OS `prefers-reduced-motion` state as a hint | `src/routes/settings.tsx` (`usePrefersReducedMotion`) + `actions.setReduceMotion` |
| 8 | The **Currency** row is read-only, clearly explaining that multi-currency needs a backend | `src/routes/settings.tsx` (disabled `SettingSelect`) |
| 9 | Clicking **Clear swipe session** forgets the local deck only, shows a Toast with **Undo** | `actions.clearSwipeSession()` + `src/components/Toast.tsx` |
| 10 | Clicking **Reset preferences** restores the defaults and shows a Toast with **Undo** | `actions.resetPreferences()` + `src/components/Toast.tsx` |
| 11 | `/dashboard` greets the donor by display name and hints the preferred pledge amount on the empty state | `src/routes/dashboard.tsx` via `useDonorPreferences()` |
| 12 | Settings persist across reloads and stay in sync across tabs | `src/services/donorPreferences.ts` (storage write + `storage` event) |

### Preference key & schema

Storage key: **`chief:preferences:v1`** (single JSON object; unknown keys are dropped and missing
keys are filled from `DEFAULT_PREFERENCES`).

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| `displayName` | `string` | `""` | Trimmed/clamped to 40 chars; empty means "no name set" and the dashboard greeting is hidden |
| `preferredAmount` | `500 \| 1000 \| 2500 \| 5000` | `1000` | NGN only. Any value outside the preset list falls back to the default |
| `notifyOnVerifiedRequest` | `boolean` | `true` | In-app notice when a freshly verified bill joins the deck |
| `notifyOnPayment` | `boolean` | `true` | In-app notice when a pledge is paid to the provider |
| `reduceMotion` | `boolean` | `false` | Augments — never overrides — the OS `prefers-reduced-motion` setting |
| `anonymousGiving` | `boolean` | `false` | Hides the donor's name from recipients; the donor's own record is unchanged |

Related storage keys touched by this module:

- **`chief:swipe-session:v1`** (and any `chief:swipe…` variant) — the swipe deck position. Removed by
  **Clear swipe session**; nothing else is deleted.
- **Contributions ledger key** — read by `useContributions()`. Module 10 never writes to or removes
  it: clearing the swipe session and resetting preferences both leave giving history intact.

### Data & privacy rules

1. `clearSwipeSession()` removes only swipe-session keys. A backup of those keys is captured before
   the clear so the Toast's **Undo** can put the deck back exactly as it was.
2. `resetPreferences()` removes only `chief:preferences:v1`; the ledger and the current deck position
   are untouched.
3. Storage failures (Safari private mode, blocked cookies, quota) degrade to an in-memory snapshot so
   the page keeps working — the settings simply do not persist for that session.
4. Corrupt or partially written JSON is parsed inside `try`/`catch` and merged over the defaults, so a
   bad record can never crash the page.

### Accessibility

- Every control is labelled through `SettingRow` (`label` / `aria-labelledby` / `aria-describedby`),
  and switches are real `<button role="switch" aria-checked>` elements that respond to Space/Enter.
- Switch state is spelled out in text ("On" / "Off") so it is never communicated by colour alone.
- The Toast is a persistent live region (`role="status" aria-live="polite" aria-atomic`) whose timer
  is cleared on unmount and re-armed on each new message; it also offers a labelled dismiss button.
- A single `<h1>` ("Settings") and a footer link chain back to `/discover` and `/dashboard`.

### Design tokens
Every colour and gradient on the settings page comes from `src/config/theme.ts` (`gradients`,
`surfaces`, `buttons`, `typography`, `layout`) plus `--brand-*` derived utility classes. No raw
colour values are used anywhere in Module 10.

### Out of scope for this module
Accounts, server-side preference sync, real email/push notification delivery and multi-currency
ledgers all require a backend and are deliberately left out of this build.
