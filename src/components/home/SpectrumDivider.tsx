import { gradients, layout } from "@/config/theme";

export interface SpectrumDividerProps {
  /**
   * Vertical rhythm (and any extra layout classes) owned by the caller. The
   * divider deliberately carries *no* margin of its own so spacing stays
   * correct whether the deck above it is open or collapsed.
   */
  className?: string;
}

/**
 * Decorative multi-hue rule between the deck and the explainer.
 *
 * - `aria-hidden="true"` — it is pure decoration, never content.
 * - Full container width (`layout.container`) so it reads as a deliberate
 *   band break rather than a heading underline.
 * - A soft blurred twin sits underneath the crisp rule to soften the
 *   spectrum's mid-stops without washing out the hue order.
 * - The incoming `className` supplies all vertical spacing, so the component
 *   stays rhythm-neutral when reused on other routes.
 */
export function SpectrumDivider({ className }: SpectrumDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={[layout.container, className].filter(Boolean).join(" ")}
    >
      <div className="relative">
        {/* Softened halo under the rule. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full opacity-30 blur-md ${gradients.spectrum}`}
        />

        {/* The crisp rule itself. */}
        <span
          aria-hidden="true"
          className={`relative block h-1.5 w-full rounded-full opacity-90 ${gradients.spectrum}`}
        />
      </div>
    </div>
  );
}

export default SpectrumDivider;
