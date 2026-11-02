import { cx } from "@/config/containment";

/**
 * One soft brand blob.
 *
 * `brand` maps to a `--brand-*` custom property declared in `src/styles.css`
 * (`--brand-rose`, `--brand-amber`, `--brand-indigo`). Components never
 * hard-code a colour — they always compose `hsl(var(--brand-*) / <alpha>)` so
 * the backdrop follows the design tokens automatically.
 */
type BrandBlob = {
  /** CSS custom-property suffix, e.g. `rose` → `hsl(var(--brand-rose) / a)`. */
  brand: "rose" | "amber" | "indigo";
  /** Peak alpha of the radial fade. Deliberately low — this is the calm pass. */
  alpha: number;
  /** Diameter of the blob. */
  size: string;
  /** Offsets relative to the fixed backdrop frame. */
  top: string;
  left: string;
};

/**
 * The reverted, calm blob stack: three wide, low-opacity washes that give each
 * route a hint of brand colour without competing with page content. Any blob
 * may bleed past the viewport — the frame clips it, so the document can never
 * grow sideways.
 */
const BRAND_BLOBS: readonly BrandBlob[] = [
  { brand: "rose", alpha: 0.16, size: "44rem", top: "-16rem", left: "-14rem" },
  { brand: "indigo", alpha: 0.14, size: "40rem", top: "-12rem", left: "58%" },
  { brand: "amber", alpha: 0.12, size: "38rem", top: "44%", left: "-12rem" },
];

/** Inline radial fade — no Tailwind arbitrary-value escaping, no hex codes. */
function blobBackground({ brand, alpha }: BrandBlob): string {
  return `radial-gradient(circle at center, hsl(var(--brand-${brand}) / ${alpha}) 0%, hsl(var(--brand-${brand}) / 0) 70%)`;
}

/**
 * Subtle mesh tint. Kept at a very low alpha so it reads as texture rather than
 * a visible grid; it fades out toward the edges via a radial mask.
 */
const MESH_STYLE = {
  backgroundImage:
    "linear-gradient(to right, hsl(var(--brand-indigo) / 0.05) 1px, transparent 1px)," +
    "linear-gradient(to bottom, hsl(var(--brand-indigo) / 0.05) 1px, transparent 1px)",
  backgroundSize: "72px 72px",
  maskImage: "radial-gradient(ellipse at 50% 30%, black 0%, transparent 78%)",
  WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 0%, transparent 78%)",
} as const;

type ColorBackdropProps = {
  /** Optional extra classes for one-off tuning (e.g. burying it in a page). */
  className?: string;
};

/**
 * The app's single decorative background layer.
 *
 * Rendered once from `__root.tsx` at `-z-10`, inside an `isolate` wrapper, so
 * it sits above `bg-background` and below all routed content. It is
 * `pointer-events-none` + `aria-hidden`, so it can never intercept clicks or
 * leak into the accessibility tree.
 *
 * Containment: the frame is `fixed inset-0` with `overflow-hidden`, and the
 * document-level `overflow-x-clip` in `__root.tsx` is the second line of
 * defence — blobs bleeding past the viewport can never widen the page.
 */
export function ColorBackdrop({ className }: ColorBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {BRAND_BLOBS.map((blob) => (
        <div
          key={blob.brand}
          className="absolute rounded-full"
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            left: blob.left,
            background: blobBackground(blob),
          }}
        />
      ))}

      {/* Texture only — never a second full-page wash. */}
      <div className="absolute inset-0 opacity-60" style={MESH_STYLE} />
    </div>
  );
}

export default ColorBackdrop;
