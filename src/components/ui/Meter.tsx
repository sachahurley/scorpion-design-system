/**
 * METER COMPONENT
 *
 * A gauge for a value inside a known range: disk usage, quota, battery,
 * signal. Not a progress bar (use it for "how full", not "how far along").
 * Renders `role="meter"` with `aria-valuenow` / `min` / `max` /
 * `aria-valuetext`, drawn as stepped blocks on the pixel grid.
 *
 * THRESHOLDS follow the native `<meter>` model: `low` and `high` split the
 * range into three regions, and `optimum` says which region is good.
 * - value in the optimum's region: `success`
 * - one region away: `warning`
 * - two regions away (optimum low, value high, or the reverse): `error`
 * With no thresholds the meter stays `primary`. Pass `tone` to override:
 * it takes decision 0024's five roles (neutral, info, success, warning,
 * error) plus Meter's own `primary`.
 *
 * COLOR IS NEVER THE ONLY SIGNAL: the label and the value text are always
 * visible, and warning / error states add a 1-bit icon.
 *
 * TOKENS USED:
 * - primary / neutral (secondary) / info / success / warning / error
 *   semantic scales (filled blocks: 600 on light, 400 on dark)
 * - surface.muted (empty blocks), surface.container-stroke (block ring)
 * - text.primary (label), text.secondary (value text)
 */

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ControlSize } from "@/lib/size";
import { TuiIcon } from "./TuiIcon";

/**
 * Semantic tone of the filled blocks: the five semantic roles plus `primary`,
 * the accent a meter shows when no thresholds are set.
 */
export type MeterTone = "primary" | "neutral" | "info" | "success" | "warning" | "error";

export interface MeterProps {
  /** Current value. Clamped to `[min, max]`. */
  value: number;
  /** Lower bound (default 0). */
  min?: number;
  /** Upper bound (default 100). */
  max?: number;
  /** Upper edge of the low region. Values below it are "low". */
  low?: number;
  /** Lower edge of the high region. Values above it are "high". */
  high?: number;
  /** The ideal value; decides which region reads as good. */
  optimum?: number;
  /** Visible label ("Disk"). Also the meter's accessible name. */
  label: ReactNode;
  /**
   * Human-readable value, shown next to the label and used as
   * `aria-valuetext` ("42 GB of 64 GB"). Defaults to a percentage.
   */
  valueText?: string;
  /** Force a tone instead of deriving it from the thresholds. */
  tone?: MeterTone;
  /** Number of blocks the range is divided into (default 20). */
  segments?: number;
  /** Block height: sm 8px, md 12px (default). */
  size?: Extract<ControlSize, "sm" | "md">;
  /** Extra classes for the wrapper. */
  className?: string;
}

/**
 * Derives the meter tone from thresholds using the native `<meter>` rules.
 * Returns `primary` when no thresholds are set. Exported for custom gauges.
 */
export function getMeterTone({
  value,
  min = 0,
  max = 100,
  low,
  high,
  optimum,
}: Pick<MeterProps, "value" | "min" | "max" | "low" | "high" | "optimum">): MeterTone {
  if (low == null && high == null && optimum == null) return "primary";
  const lo = Math.min(Math.max(low ?? min, min), max);
  const hi = Math.min(Math.max(high ?? max, lo), max);
  const opt = optimum ?? (min + max) / 2;
  const region = (v: number) => (v < lo ? 0 : v > hi ? 2 : 1);
  const distance = Math.abs(region(Math.min(Math.max(value, min), max)) - region(opt));
  return distance === 0 ? "success" : distance === 1 ? "warning" : "error";
}

const FILL: Record<MeterTone, string> = {
  primary: "bg-primary-600 dark:bg-primary-400",
  neutral: "bg-secondary-600 dark:bg-secondary-400",
  info: "bg-info-600 dark:bg-info-400",
  success: "bg-success-600 dark:bg-success-400",
  warning: "bg-warning-600 dark:bg-warning-400",
  error: "bg-error-600 dark:bg-error-400",
};

/**
 * Meter
 *
 * ```tsx
 * <Meter label="Disk" value={58} max={64} high={48} optimum={0} valueText="58 GB of 64 GB" />
 * ```
 */
export function Meter({
  value,
  min = 0,
  max = 100,
  low,
  high,
  optimum,
  label,
  valueText,
  tone: toneProp,
  segments = 20,
  size = "md",
  className,
}: MeterProps) {
  const labelId = useId();
  const span = max - min || 1;
  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / span;
  const text = valueText ?? `${Math.round(ratio * 100)}%`;
  const tone = toneProp ?? getMeterTone({ value, min, max, low, high, optimum });
  const count = Math.max(1, Math.round(segments));
  const filled = Math.round(ratio * count);

  return (
    <div className={cn("font-mono text-sm", className)} data-tone={tone}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-[var(--text-primary)]">
          {label}
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums text-[var(--text-secondary)]">
          {tone === "warning" && <TuiIcon name="AlertTriangle" size="3" />}
          {tone === "error" && <TuiIcon name="AlertCircle" size="3" />}
          {text}
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuenow={clamped}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text}
        className="flex gap-0.5"
      >
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            data-filled={i < filled || undefined}
            className={cn(
              "flex-1",
              size === "sm" ? "h-2" : "h-3",
              i < filled ? FILL[tone] : "bg-[var(--surface-muted)] ring-1 ring-inset ring-[var(--surface-container-stroke)]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

Meter.displayName = "Meter";
