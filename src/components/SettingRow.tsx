import type { ReactNode } from "react";

import { typography } from "@/config/theme";

/**
 * Settings primitives (Module 10).
 *
 * Three small, token-driven building blocks shared by the settings page and
 * any future preference surface:
 *
 * - `SettingRow` — the label / description / control layout. The label text is
 *   exposed with a stable id so a custom control (e.g. the switch, which is a
 *   `<button role="switch">`) can reference it with `aria-labelledby`.
 * - `SettingSwitch` — a real, keyboard-operable switch. Because a switch is a
 *   button, the state is also spelled out in text ("On" / "Off") so it is never
 *   communicated by colour alone.
 * - `SettingSelect` — a native `<select>` for short option lists (pledge
 *   presets), styled with the same tokens as the text inputs.
 *
 * Every colour, gradient and type style comes from `src/config/theme.ts` — no
 * raw colour values live here.
 */

/**
 * Shared styles for native form controls (text input in the route, select
 * below). Exported so the settings page can style its text input identically
 * without duplicating the token list.
 */
export const settingControlClassName =
  "rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

/** Ids handed to render-prop children so ARIA wiring can never drift. */
export interface SettingRowIds {
  /** Id of the element that holds the row's label text. */
  labelId: string;
  /** Present only when the row has a `description`. */
  descriptionId?: string;
  /** Present only when the row has a `hint`. */
  hintId?: string;
}

export interface SettingRowProps {
  /** Row identifier — used to derive the label / description / hint ids. */
  id: string;
  /** Primary label, rendered as a `<label>` when `htmlFor` is provided. */
  label: string;
  /** Supporting copy shown under the label. */
  description?: ReactNode;
  /** Extra, more granular helper text (e.g. the current saved value). */
  hint?: ReactNode;
  /** Id of a native control (input / select) this row labels. */
  htmlFor?: string;
  className?: string;
  /**
   * The control slot. Pass a node, or a function that receives the generated
   * ids — the latter keeps `aria-labelledby` / `aria-describedby` correct for
   * controls that are not natively labelable (like the switch button).
   */
  children: ReactNode | ((ids: SettingRowIds) => ReactNode);
}

/**
 * One settings row: label + optional description/hint on the left, control on
 * the right. Rows are separated by the parent's `divide-y`, so this component
 * deliberately draws no borders of its own.
 */
export function SettingRow({
  id,
  label,
  description,
  hint,
  htmlFor,
  className,
  children,
}: SettingRowProps) {
  const labelId = `${id}-label`;
  const descriptionId =
    description !== undefined && description !== null
      ? `${id}-description`
      : undefined;
  const hintId = hint !== undefined && hint !== null ? `${id}-hint` : undefined;

  const ids: SettingRowIds = { labelId, descriptionId, hintId };
  const control = typeof children === "function" ? children(ids) : children;

  return (
    <div
      className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8 ${className ?? ""}`}
    >
      <div className="min-w-0 sm:max-w-sm">
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            id={labelId}
            className="block cursor-pointer text-sm font-semibold tracking-tight text-foreground"
          >
            {label}
          </label>
        ) : (
          <p
            id={labelId}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {label}
          </p>
        )}

        {descriptionId ? (
          <p id={descriptionId} className={`mt-1 ${typography.caption}`}>
            {description}
          </p>
        ) : null}

        {hintId ? (
          <p id={hintId} className="mt-1 text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 sm:shrink-0 sm:pt-0.5">{control}</div>
    </div>
  );
}

export interface SettingSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Id of the row's label element (`SettingRow` render prop: `labelId`). */
  labelledBy?: string;
  /** Id of the row's description element. */
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Accessible on/off switch.
 *
 * Rendered as `<button type="button" role="switch" aria-checked>` so it
 * responds to Space/Enter out of the box. The track uses the brand gradient
 * when on and the muted token when off, and the textual "On" / "Off" status
 * means the state never depends on colour alone.
 */
export function SettingSwitch({
  checked,
  onCheckedChange,
  labelledBy,
  describedBy,
  disabled = false,
  className,
}: SettingSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex items-center gap-2.5 rounded-full py-1 pr-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-cta-gradient" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-card shadow ring-1 ring-inset ring-border/70 transition-transform ${
            checked ? "translate-x-[1.25rem]" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="w-7 text-left text-xs font-semibold tabular-nums text-foreground">
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

export interface SettingSelectOption {
  value: string;
  label: string;
}

export interface SettingSelectProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<SettingSelectOption>;
  /** Id of the row's label element — used when there is no `htmlFor`. */
  labelledBy?: string;
  describedBy?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}

/**
 * Native `<select>` for short, fixed option lists (the NGN pledge presets and
 * the read-only currency row). A native control is intentional: it is
 * keyboard- and screen-reader-friendly on every device, including mobile,
 * with no custom popover to get wrong.
 */
export function SettingSelect({
  id,
  value,
  onValueChange,
  options,
  labelledBy,
  describedBy,
  disabled = false,
  name,
  className,
}: SettingSelectProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onChange={(event) => onValueChange(event.target.value)}
      className={`${settingControlClassName} w-full sm:w-48 ${className ?? ""}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default SettingRow;
