import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { fundedPercent } from "@/lib/currency";

/** Minimal className joiner (avoids adding a dependency). */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* GradientButton                                                      */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-primary-foreground shadow-elegant hover:brightness-110 hover:-translate-y-0.5",
  ghost: "glass text-foreground hover:bg-card hover:-translate-y-0.5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 py-3.5 text-base",
};

type CommonButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
};

type LinkButtonProps = CommonButtonProps & {
  to: LinkProps["to"];
  params?: LinkProps["params"];
  search?: LinkProps["search"];
  onClick?: () => void;
  "aria-label"?: string;
  "data-testid"?: string;
};

type NativeButtonProps = CommonButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { to?: undefined };

export type GradientButtonProps = LinkButtonProps | NativeButtonProps;

export function GradientButton(props: GradientButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (props.to !== undefined) {
    const { to, params, search, onClick, variant: _v, size: _s, className: _c, children: _ch, ...rest } =
      props as LinkButtonProps;
    return (
      <Link to={to} params={params} search={search} onClick={onClick} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, to: _t, type, ...rest } =
    props as NativeButtonProps;
  return (
    <button type={type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressBar                                                         */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  goal,
  className,
  label,
}: {
  value: number;
  goal: number;
  className?: string;
  label?: string;
}) {
  const raw = Number(fundedPercent(value, goal));
  const pct = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label ?? "Funding progress"}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="bg-brand-gradient h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CategoryBadge                                                       */
/* ------------------------------------------------------------------ */

const categoryClasses: Record<string, string> = {
  health: "bg-cat-health/12 text-cat-health ring-cat-health/25",
  education: "bg-cat-education/12 text-cat-education ring-cat-education/25",
  housing: "bg-cat-housing/12 text-cat-housing ring-cat-housing/25",
  rent: "bg-cat-housing/12 text-cat-housing ring-cat-housing/25",
  utilities: "bg-cat-utilities/15 text-cat-utilities ring-cat-utilities/30",
};

const categoryDot: Record<string, string> = {
  health: "bg-cat-health",
  education: "bg-cat-education",
  housing: "bg-cat-housing",
  rent: "bg-cat-housing",
  utilities: "bg-cat-utilities",
};

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  const key = category.trim().toLowerCase();
  const tone = categoryClasses[key] ?? "bg-primary/10 text-primary ring-primary/25";
  const dot = categoryDot[key] ?? "bg-primary";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tone,
        className,
      )}
    >
      <span aria-hidden="true" className={cx("h-1.5 w-1.5 rounded-full", dot)} />
      {category}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHeading                                                      */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">{eyebrow}</p>
        )}
        <Tag className="mt-2 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{title}</Tag>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GlowBackdrop                                                        */
/* ------------------------------------------------------------------ */

export function GlowBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div className="animate-float absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-violet/25 blur-3xl" />
      <div
        className="animate-float absolute -right-16 top-10 h-72 w-72 rounded-full bg-brand-magenta/20 blur-3xl"
        style={{ animationDelay: "-2s" }}
      />
      <div
        className="animate-float absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-saffron/25 blur-3xl"
        style={{ animationDelay: "-4s" }}
      />
      <div className="absolute bottom-10 right-1/4 h-56 w-56 rounded-full bg-brand-coral/20 blur-3xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

export function StatCard({
  value,
  label,
  className,
}: {
  value: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={cx("glass shadow-elegant rounded-2xl px-6 py-5 text-center", className)}>
      <div className="text-brand-gradient font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
