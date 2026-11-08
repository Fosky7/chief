import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  goal: number;
  label?: string;
  className?: string;
}

/** Accessible funding progress bar using design tokens only. */
export function ProgressBar({ value, goal, label = "Funding progress", className }: ProgressBarProps) {
  const pct = goal > 0 ? Math.min(100, Math.max(0, Math.round((value / goal) * 100))) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      data-testid="progress-bar"
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default ProgressBar;
