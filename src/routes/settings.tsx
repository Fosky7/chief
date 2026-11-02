import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import {
  SettingRow,
  SettingSelect,
  SettingSwitch,
  settingControlClassName,
} from "@/components/SettingRow";
import { Toast, type ToastAction, type ToastMessage } from "@/components/Toast";
import { buttons, gradients, layout, surfaces, typography } from "@/config/theme";
import { useDonorPreferences } from "@/hooks/useDonorPreferences";
import {
  AMOUNT_PRESET_OPTIONS,
  DEFAULT_PREFERENCES,
  MAX_DISPLAY_NAME_LENGTH,
  SWIPE_SESSION_KEY_PREFIX,
  SWIPE_SESSION_STORAGE_KEY,
  clampDisplayName,
  type NotificationKey,
} from "@/types/preferences";

/**
 * Settings page ("/settings") — Module 10.
 *
 * A signed-in donor can shape how Chief behaves:
 *  1. Profile & giving — display name (debounced save + save on blur), the
 *     preferred pledge amount preset (NGN) and anonymous giving.
 *  2. Notifications & accessibility — two notification toggles and a
 *     reduced-motion preference that augments (never overrides) the OS hint.
 *  3. Data & privacy — a read-only currency row, "Clear swipe session" (with
 *     an Undo toast) and "Reset preferences" (with an Undo toast).
 *
 * Everything is persisted through `useDonorPreferences()`, which wraps the
 * localStorage-backed store in `useSyncExternalStore`. Clearing the swipe
 * session never touches the giving ledger.
 *
 * Design (reverted, calm composition): the hero is a SINGLE
 * `gradients.heroAurora` band over the one `ColorBackdrop` layer rendered by
 * `__root.tsx`. There is deliberately no wash, sheen, mesh or extra fixed
 * overlay stacked on top of it here — the page paints at most one decorative
 * layer above `bg-background`. Cards use the plain `surfaces.card` token.
 *
 * All colour/gradient decisions come from `src/config/theme.ts`.
 */

/** How long typing pauses before the display name is persisted. */
const DISPLAY_NAME_DEBOUNCE_MS = 500;

/** Select options for the NGN pledge presets. */
const amountOptions = AMOUNT_PRESET_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

/** The currency row is locked to NGN — multi-currency needs a backend. */
const currencyOptions = [{ value: "NGN", label: "NGN — Nigerian Naira (₦)" }];

/** Default preset, formatted for the "Reset preferences" description. */
const defaultAmountLabel = `₦${DEFAULT_PREFERENCES.preferredAmount.toLocaleString(
  "en-NG",
)}`;

/** True when a localStorage key belongs to the swipe deck session. */
function isSwipeSessionKey(key: string): boolean {
  if (key === SWIPE_SESSION_STORAGE_KEY) return true;
  return key.toLowerCase().startsWith(SWIPE_SESSION_KEY_PREFIX);
}

interface SwipeSessionBackup {
  entries: Array<[string, string]>;
}

/**
 * Snapshot the raw swipe-session entries so the Undo toast can put them back.
 * Only swipe-session keys are captured — the giving ledger is never read or
 * written here.
 */
function captureSwipeSession(): SwipeSessionBackup {
  const entries: Array<[string, string]> = [];
  if (typeof window === "undefined") return { entries };

  try {
    const storage = window.localStorage;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !isSwipeSessionKey(key)) continue;

      const value = storage.getItem(key);
      if (value !== null) entries.push([key, value]);
    }
  } catch {
    // Storage blocked (private mode): there is simply nothing to restore.
  }

  return { entries };
}

/**
 * Best-effort restore of a previously captured swipe session. The deck store
 * picks the restored values up on its next read (e.g. the next visit to
 * /discover); this never touches contributions or preferences.
 */
function restoreSwipeSession(backup: SwipeSessionBackup): void {
  if (typeof window === "undefined" || backup.entries.length === 0) return;

  try {
    const storage = window.localStorage;
    for (const [key, value] of backup.entries) {
      storage.setItem(key, value);
    }
  } catch {
    // Best effort only — the toast still confirms the intent.
  }
}

/**
 * Whether the OS asks for reduced motion. This is a hint shown next to the
 * switch — the stored preference augments it, it never overrides it.
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return undefined;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handleChange);
      return () => query.removeEventListener("change", handleChange);
    }

    // Safari < 14 fallback.
    query.addListener(handleChange);
    return () => query.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

function SettingsPage() {
  const { preferences, actions } = useDonorPreferences();
  const prefersReducedMotion = usePrefersReducedMotion();

  /* ------------------------------------------------------------------ */
  /* Toast                                                              */
  /* ------------------------------------------------------------------ */

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nextToastId = useRef(0);

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, action?: ToastAction) => {
    nextToastId.current += 1;
    setToast({ id: nextToastId.current, message, action });
  }, []);

  /* ------------------------------------------------------------------ */
  /* Display name (debounced write)                                     */
  /* ------------------------------------------------------------------ */

  const [nameDraft, setNameDraft] = useState<string>(preferences.displayName);
  // The last value we actually wrote to the store — used to tell our own
  // writes apart from external changes (another tab, reset, undo).
  const lastSavedName = useRef<string>(preferences.displayName);

  // Pull external changes into the draft without clobbering what is typed.
  useEffect(() => {
    if (preferences.displayName === lastSavedName.current) return;

    lastSavedName.current = preferences.displayName;
    setNameDraft(preferences.displayName);
  }, [preferences.displayName]);

  const persistName = useCallback(
    (value: string) => {
      const next = clampDisplayName(value);
      if (next === lastSavedName.current) return;

      actions.setDisplayName(next);
      lastSavedName.current = next;

      showToast(
        next.trim().length > 0 ? "Display name saved." : "Display name cleared.",
      );
    },
    [actions, showToast],
  );

  // Debounced save while typing; cleaned up if the draft changes again.
  useEffect(() => {
    const next = clampDisplayName(nameDraft);
    if (next === lastSavedName.current) return undefined;

    const timer = window.setTimeout(
      () => persistName(nameDraft),
      DISPLAY_NAME_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [nameDraft, persistName]);

  /* ------------------------------------------------------------------ */
  /* Row handlers                                                       */
  /* ------------------------------------------------------------------ */

  const handleAmountChange = useCallback(
    (value: string) => {
      const amount = Number.parseInt(value, 10);
      actions.setPreferredAmount(amount);

      const option = amountOptions.find((entry) => entry.value === value);
      showToast(`Preferred pledge set to ${option?.label ?? value}.`);
    },
    [actions, showToast],
  );

  const handleNotificationChange = useCallback(
    (key: NotificationKey, label: string, next: boolean) => {
      actions.toggleNotification(key, next);
      showToast(`${label} ${next ? "on" : "off"}.`);
    },
    [actions, showToast],
  );

  const handleClearSwipeSession = useCallback(() => {
    // Capture first so "Undo" can put the deck back exactly as it was.
    const backup = captureSwipeSession();
    const cleared = actions.clearSwipeSession();

    if (!cleared) {
      showToast("There is no swipe session to clear on this device.");
      return;
    }

    showToast("Swipe session cleared — your giving history is untouched.", {
      label: "Undo",
      onClick: () => {
        restoreSwipeSession(backup);
        // A fresh toast re-arms the dismiss timer and replaces this one.
        showToast("Swipe session restored.");
      },
    });
  }, [actions, showToast]);

  const handleResetPreferences = useCallback(() => {
    const previous = preferences;
    actions.resetPreferences();

    showToast("Preferences reset to defaults.", {
      label: "Undo",
      onClick: () => {
        actions.setDisplayName(previous.displayName);
        actions.setPreferredAmount(previous.preferredAmount);
        actions.toggleNotification(
          "notifyOnVerifiedRequest",
          previous.notifyOnVerifiedRequest,
        );
        actions.toggleNotification(
          "notifyOnPayment",
          previous.notifyOnPayment,
        );
        actions.setReduceMotion(previous.reduceMotion);
        actions.setAnonymousGiving(previous.anonymousGiving);
        showToast("Preferences restored.");
      },
    });
  }, [actions, preferences, showToast]);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  const displayNameHint =
    nameDraft.trim().length > 0
      ? `Saved as “${nameDraft.trim()}”.`
      : "Leave this blank to stay unnamed.";

  return (
    <AppShell>
      {/* ----------------------------------------------------------------
          Hero — a single calm aurora band over the root backdrop.
          No extra wash/overlay layers are stacked on top of it, so the page
          renders exactly one decorative layer above `bg-background`.
         ---------------------------------------------------------------- */}
      <PageHero
        eyebrow="Your Chief account"
        title="Settings"
        description="Shape how Chief works for you — the name you are greeted with, the pledge amount you reach for first, which notifications you want, and how much motion the interface uses. Everything here is stored on this device and can be reset at any time."
      />

      {/* ----------------------------------------------------------------
          Preference cards — plain `surfaces.card`, no stacked sheen.
         ---------------------------------------------------------------- */}
      <section className={`${layout.container} ${layout.section}`}>
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {/* --------------------------------------------------------
              1. Profile & giving
             -------------------------------------------------------- */}
          <section
            aria-labelledby="profile-heading"
            className={`${surfaces.card} p-5 sm:p-6`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${gradients.brandMark}`}
              />
              <div className="min-w-0">
                <h2 id="profile-heading" className={typography.subheading}>
                  Profile &amp; giving
                </h2>
                <p className={`mt-1 ${typography.caption}`}>
                  How Chief greets you, the amount you reach for first, and
                  whether your name travels with your giving.
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-border border-t border-border">
              <SettingRow
                id="display-name"
                htmlFor="display-name-input"
                label="Display name"
                description="Used to greet you, and shown to the neighbours whose bills you pay unless you give anonymously."
                hint={displayNameHint}
              >
                {({ descriptionId, hintId }) => (
                  <input
                    id="display-name-input"
                    name="displayName"
                    type="text"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    onBlur={() => persistName(nameDraft)}
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    autoComplete="name"
                    spellCheck={false}
                    placeholder="e.g. Ada"
                    aria-describedby={
                      [descriptionId, hintId].filter(Boolean).join(" ") ||
                      undefined
                    }
                    className={`${settingControlClassName} w-full sm:w-64`}
                  />
                )}
              </SettingRow>

              <SettingRow
                id="preferred-amount"
                htmlFor="preferred-amount-select"
                label="Preferred pledge amount"
                description="The amount Chief preselects when you back a bill. Every preset is in Naira (NGN)."
              >
                <SettingSelect
                  id="preferred-amount-select"
                  name="preferredAmount"
                  value={String(preferences.preferredAmount)}
                  onValueChange={handleAmountChange}
                  options={amountOptions}
                />
              </SettingRow>

              <SettingRow
                id="anonymous-giving"
                label="Give anonymously"
                description="Hide your name from the neighbours whose bills you pay. Your giving record stays on your own dashboard."
              >
                {({ labelId, descriptionId }) => (
                  <SettingSwitch
                    checked={preferences.anonymousGiving}
                    onCheckedChange={(next) => {
                      actions.setAnonymousGiving(next);
                      showToast(`Anonymous giving ${next ? "on" : "off"}.`);
                    }}
                    labelledBy={labelId}
                    describedBy={descriptionId}
                  />
                )}
              </SettingRow>
            </div>
          </section>

          {/* --------------------------------------------------------
              2. Notifications & accessibility
             -------------------------------------------------------- */}
          <section
            aria-labelledby="notifications-heading"
            className={`${surfaces.card} p-5 sm:p-6`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${gradients.brandMark}`}
              />
              <div className="min-w-0">
                <h2 id="notifications-heading" className={typography.subheading}>
                  Notifications &amp; accessibility
                </h2>
                <p className={`mt-1 ${typography.caption}`}>
                  In-app notices only in this build — email and push delivery
                  need a backend.
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-border border-t border-border">
              <SettingRow
                id="notify-verified"
                label="New verified requests"
                description="Tell me when a freshly verified bill joins the swipe deck."
              >
                {({ labelId, descriptionId }) => (
                  <SettingSwitch
                    checked={preferences.notifyOnVerifiedRequest}
                    onCheckedChange={(next) =>
                      handleNotificationChange(
                        "notifyOnVerifiedRequest",
                        "New verified request notifications",
                        next,
                      )
                    }
                    labelledBy={labelId}
                    describedBy={descriptionId}
                  />
                )}
              </SettingRow>

              <SettingRow
                id="notify-payment"
                label="Payment confirmations"
                description="Tell me when a pledge I made is paid to the provider."
              >
                {({ labelId, descriptionId }) => (
                  <SettingSwitch
                    checked={preferences.notifyOnPayment}
                    onCheckedChange={(next) =>
                      handleNotificationChange(
                        "notifyOnPayment",
                        "Payment notifications",
                        next,
                      )
                    }
                    labelledBy={labelId}
                    describedBy={descriptionId}
                  />
                )}
              </SettingRow>

              <SettingRow
                id="reduce-motion"
                label="Reduce motion"
                description="Use calmer transitions and skip decorative movement across Chief."
                hint={
                  prefersReducedMotion
                    ? "Your device is already set to reduce motion — Chief always honours that."
                    : "Your device allows motion. Turning this on adds calmer transitions on top."
                }
              >
                {({ labelId, descriptionId, hintId }) => (
                  <SettingSwitch
                    checked={preferences.reduceMotion}
                    onCheckedChange={(next) => {
                      actions.setReduceMotion(next);
                      showToast(`Reduced motion ${next ? "on" : "off"}.`);
                    }}
                    labelledBy={labelId}
                    describedBy={
                      [descriptionId, hintId].filter(Boolean).join(" ") ||
                      undefined
                    }
                  />
                )}
              </SettingRow>
            </div>
          </section>

          {/* --------------------------------------------------------
              3. Data & privacy
             -------------------------------------------------------- */}
          <section
            aria-labelledby="data-heading"
            className={`${surfaces.card} p-5 sm:p-6`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${gradients.brandMark}`}
              />
              <div className="min-w-0">
                <h2 id="data-heading" className={typography.subheading}>
                  Data &amp; privacy
                </h2>
                <p className={`mt-1 ${typography.caption}`}>
                  Housekeeping for what Chief keeps on this device. Your pledges
                  and giving history are never deleted from here.
                </p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-border border-t border-border">
              <SettingRow
                id="currency"
                htmlFor="currency-select"
                label="Currency"
                description="Pledges are charged in Naira. Supporting other currencies needs a backend ledger, so this control stays locked for now."
              >
                <SettingSelect
                  id="currency-select"
                  value="NGN"
                  onValueChange={() => undefined}
                  options={currencyOptions}
                  disabled
                  className="w-full sm:w-64"
                />
              </SettingRow>

              <SettingRow
                id="clear-swipe-session"
                label="Clear swipe session"
                description="Forgets which request cards you've swiped on this device so the deck starts from the first card again. Pledges and giving history are never touched."
              >
                <button
                  type="button"
                  onClick={handleClearSwipeSession}
                  className={buttons.secondary}
                >
                  Clear swipe session
                </button>
              </SettingRow>

              <SettingRow
                id="reset-preferences"
                label="Reset preferences"
                description={`Restores the shipped defaults: no display name, a ${defaultAmountLabel} pledge preset, notifications on and the same currency and motion settings. Giving history and the swipe session are kept.`}
              >
                <button
                  type="button"
                  onClick={handleResetPreferences}
                  className={buttons.secondary}
                >
                  Reset preferences
                </button>
              </SettingRow>
            </div>
          </section>

          {/* --------------------------------------------------------
              Where to next
             -------------------------------------------------------- */}
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/discover" className={buttons.primary}>
              Back to discover
            </Link>
            <Link to="/dashboard" className={buttons.secondary}>
              Go to dashboard
            </Link>
          </div>
        </div>
      </section>

      <Toast toast={toast} onDismiss={dismissToast} />
    </AppShell>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

export default SettingsPage;
