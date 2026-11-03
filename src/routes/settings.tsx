import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { SettingRow, SettingSelect, SettingSwitch, settingControlClassName } from "@/components/SettingRow";
import { Toast, type ToastAction, type ToastMessage } from "@/components/Toast";
import { buttons, gradients, layout, surfaces, typography } from "@/config/theme";
import { signOutDonor, useAuthSession } from "@/hooks/useAuthSession";
import {
  getDonorSettings,
  getServerDonorSettings,
  resetDonorSettings,
  subscribeDonorSettings,
  updateDonorSettings,
} from "@/services/donorSettings";
import {
  AMOUNT_PRESET_OPTIONS,
  DEFAULT_PREFERENCES,
  MAX_DISPLAY_NAME_LENGTH,
  SWIPE_SESSION_KEY_PREFIX,
  SWIPE_SESSION_STORAGE_KEY,
  clampDisplayName,
} from "@/types/preferences";

/**
 * Settings page ("/settings").
 *
 * Account (sign in / out), profile & giving, notifications & motion, and data
 * housekeeping. Every setting is saved on this device instantly and, when the
 * donor is signed in, to the `donor_settings` table so it survives a refresh
 * and follows them to other devices.
 */
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Chief" },
      { name: "description", content: "Choose your display name, preferred Naira pledge amount, privacy and notifications on Chief." },
    ],
  }),
  component: SettingsPage,
});

const amountOptions = AMOUNT_PRESET_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));
const NAME_DEBOUNCE_MS = 500;

function isSwipeKey(key: string) {
  return key === SWIPE_SESSION_STORAGE_KEY || key.toLowerCase().startsWith(SWIPE_SESSION_KEY_PREFIX);
}

function CardHeading({ id, title, caption }: { id: string; title: string; caption: string }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full ${gradients.brandMark}`} />
      <div className="min-w-0">
        <h2 id={id} className={typography.subheading}>{title}</h2>
        <p className={`mt-1 ${typography.caption}`}>{caption}</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  const settings = useSyncExternalStore(subscribeDonorSettings, getDonorSettings, getServerDonorSettings);
  const { user, ready } = useAuthSession();

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastId = useRef(0);
  const showToast = useCallback((message: string, action?: ToastAction) => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, action });
  }, []);

  const savedSuffix = user ? " Saved to your account." : " Saved on this device.";

  // Display name: debounced save while typing, immediate on blur.
  const [nameDraft, setNameDraft] = useState(settings.displayName);
  const lastName = useRef(settings.displayName);
  useEffect(() => {
    if (settings.displayName !== lastName.current) {
      lastName.current = settings.displayName;
      setNameDraft(settings.displayName);
    }
  }, [settings.displayName]);

  const persistName = useCallback(
    (value: string) => {
      const next = clampDisplayName(value).trim();
      if (next === lastName.current) return;
      lastName.current = next;
      void updateDonorSettings({ displayName: next });
      showToast((next ? "Display name saved." : "Display name cleared.") + savedSuffix);
    },
    [savedSuffix, showToast],
  );

  useEffect(() => {
    if (clampDisplayName(nameDraft).trim() === lastName.current) return undefined;
    const t = window.setTimeout(() => persistName(nameDraft), NAME_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [nameDraft, persistName]);

  const clearSwipeSession = () => {
    const backup: Array<[string, string]> = [];
    try {
      const s = window.localStorage;
      for (let i = s.length - 1; i >= 0; i -= 1) {
        const key = s.key(i);
        if (key && isSwipeKey(key)) {
          backup.push([key, s.getItem(key) ?? ""]);
          s.removeItem(key);
        }
      }
    } catch {
      /* storage blocked */
    }
    if (backup.length === 0) {
      showToast("There is no swipe progress to clear on this device.");
      return;
    }
    showToast("Swipe progress cleared — your giving history is untouched.", {
      label: "Undo",
      onClick: () => {
        try {
          backup.forEach(([k, v]) => window.localStorage.setItem(k, v));
        } catch {
          /* best effort */
        }
        showToast("Swipe progress restored.");
      },
    });
  };

  const resetAll = () => {
    const previous = settings;
    void resetDonorSettings();
    showToast("Settings reset to defaults.", {
      label: "Undo",
      onClick: () => {
        void updateDonorSettings(previous);
        showToast("Settings restored.");
      },
    });
  };

  return (
    <AppShell>
      <PageHero
        eyebrow="Your Chief account"
        title="Settings"
        description="Your name, the pledge amount you reach for first, privacy and notifications."
      />

      <section className={`${layout.container} pb-16`}>
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {/* Account */}
          <section aria-labelledby="account-heading" className={`${surfaces.card} p-5 sm:p-6`}>
            <CardHeading
              id="account-heading"
              title="Account"
              caption="Sign in to keep your pledges, swipe progress and settings on every device."
            />
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 break-words text-sm text-foreground">
                {!ready ? "Checking…" : user ? <>Signed in as <strong>{user.email}</strong></> : "You're not signed in. Everything is saved on this device only."}
              </p>
              {ready ? (
                user ? (
                  <button
                    type="button"
                    className={buttons.secondary}
                    onClick={async () => {
                      await signOutDonor();
                      showToast("Signed out. Your data stays saved to your account.");
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link to="/auth" className={buttons.primary}>Sign in</Link>
                )
              ) : null}
            </div>
          </section>

          {/* Profile & giving */}
          <section aria-labelledby="profile-heading" className={`${surfaces.card} p-5 sm:p-6`}>
            <CardHeading id="profile-heading" title="Profile & giving" caption="How Chief greets you and the amount you pledge most." />
            <div className="mt-4 divide-y divide-border border-t border-border">
              <SettingRow
                id="display-name"
                htmlFor="display-name-input"
                label="Display name"
                description="Shown to the people whose bills you pay, unless you give anonymously."
              >
                <input
                  id="display-name-input"
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => persistName(nameDraft)}
                  maxLength={MAX_DISPLAY_NAME_LENGTH}
                  autoComplete="name"
                  placeholder="e.g. Ada"
                  className={`${settingControlClassName} w-full sm:w-64`}
                />
              </SettingRow>
              <SettingRow
                id="preferred-amount"
                htmlFor="preferred-amount-select"
                label="Preferred pledge amount"
                description="Preselected when you back a bill. All amounts are in Naira."
              >
                <SettingSelect
                  id="preferred-amount-select"
                  value={String(settings.preferredAmount)}
                  onValueChange={(value) => {
                    const amount = Number.parseInt(value, 10);
                    void updateDonorSettings({ preferredAmount: amount });
                    const label = amountOptions.find((o) => o.value === value)?.label ?? value;
                    showToast(`Preferred pledge set to ${label}.${savedSuffix}`);
                  }}
                  options={amountOptions}
                />
              </SettingRow>
              <SettingRow id="anonymous" label="Give anonymously" description="Hide your name from the people you help.">
                {({ labelId, descriptionId }) => (
                  <SettingSwitch
                    checked={settings.anonymous}
                    onCheckedChange={(next) => {
                      void updateDonorSettings({ anonymous: next });
                      showToast(`Anonymous giving ${next ? "on" : "off"}.`);
                    }}
                    labelledBy={labelId}
                    describedBy={descriptionId}
                  />
                )}
              </SettingRow>
            </div>
          </section>

          {/* Notifications & motion */}
          <section aria-labelledby="notify-heading" className={`${surfaces.card} p-5 sm:p-6`}>
            <CardHeading id="notify-heading" title="Notifications & motion" caption="Choose what Chief tells you about and how much the screen moves." />
            <div className="mt-4 divide-y divide-border border-t border-border">
              {[
                { key: "pledgeUpdates", label: "Pledge updates", description: "When a bill you backed is paid to the biller." },
                { key: "weeklyDigest", label: "Weekly digest", description: "A short summary of new verified requests each week." },
              ].map((n) => (
                <SettingRow key={n.key} id={`notify-${n.key}`} label={n.label} description={n.description}>
                  {({ labelId, descriptionId }) => (
                    <SettingSwitch
                      checked={settings.notifications[n.key] ?? false}
                      onCheckedChange={(next) => {
                        void updateDonorSettings({ notifications: { [n.key]: next } });
                        showToast(`${n.label} ${next ? "on" : "off"}.`);
                      }}
                      labelledBy={labelId}
                      describedBy={descriptionId}
                    />
                  )}
                </SettingRow>
              ))}
              <SettingRow id="reduced-motion" label="Reduce motion" description="Calmer card swipes and transitions.">
                {({ labelId, descriptionId }) => (
                  <SettingSwitch
                    checked={settings.reducedMotion}
                    onCheckedChange={(next) => {
                      void updateDonorSettings({ reducedMotion: next });
                      showToast(`Reduce motion ${next ? "on" : "off"}.`);
                    }}
                    labelledBy={labelId}
                    describedBy={descriptionId}
                  />
                )}
              </SettingRow>
            </div>
          </section>

          {/* Data */}
          <section aria-labelledby="data-heading" className={`${surfaces.card} p-5 sm:p-6`}>
            <CardHeading id="data-heading" title="Data" caption="Your pledges and giving history are never deleted from here." />
            <div className="mt-4 divide-y divide-border border-t border-border">
              <SettingRow id="currency" label="Currency" description="Pledges are in Nigerian Naira (₦).">
                <span className="text-sm font-semibold text-foreground">NGN — ₦</span>
              </SettingRow>
              <SettingRow id="clear-swipe" label="Clear swipe progress" description="Start the deck from the first card again on this device.">
                <button type="button" onClick={clearSwipeSession} className={buttons.secondary}>Clear progress</button>
              </SettingRow>
              <SettingRow
                id="reset"
                label="Reset settings"
                description={`Back to defaults: no display name and a ₦${DEFAULT_PREFERENCES.preferredAmount.toLocaleString("en-NG")} pledge.`}
              >
                <button type="button" onClick={resetAll} className={buttons.secondary}>Reset</button>
              </SettingRow>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link to="/discover" className={buttons.primary}>Back to swiping</Link>
            <Link to="/dashboard" className={buttons.secondary}>View your giving</Link>
          </div>
        </div>
      </section>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </AppShell>
  );
}

export default SettingsPage;
