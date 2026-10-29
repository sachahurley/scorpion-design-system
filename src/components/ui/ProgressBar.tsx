/**
 * PROGRESS BAR COMPONENT
 *
 * Shows how far along a task is. Determinate when you know the fraction
 * (`value` of `max`), indeterminate when you only know that work is
 * happening (omit `value`).
 *
 * TUI RENDERING: the track is a sharp hairline-ringed bar filled with
 * discrete blocks on the 2px pixel grid, like a terminal progress meter.
 * Progress fills whole blocks (never a smooth sliver), so 20 blocks read in
 * 5% steps. Indeterminate progress is a short run of blocks that hops along
 * the track one block at a time; with prefers-reduced-motion it holds still
 * as a dimmed, fully filled track instead.
 *
 * ACCESSIBILITY: role="progressbar" with aria-valuemin/max/now (and a
 * percentage aria-valuetext). Indeterminate bars omit aria-valuenow, which is
 * how assistive tech knows the value is unknown. Always name the bar with
 * `label` (shown above it, or hidden with `showLabel={false}`).
 *
 * TOKENS USED:
 * - border.default (ring), surface.subtle (track), surface.muted (empty blocks)
 * - primary / neutral (secondary) / info / success / warning / error scales
 *   (filled blocks)
 * - text.primary, text.secondary, duration.fast (indeterminate hop interval)
 *
 * TONES: `tone` takes decision 0024's five roles plus ProgressBar's own
 * `primary`, the default accent.
 */

import { useEffect, useId, useState } from "react";
import type { ControlSize } from "@/lib/size";
import { cn } from "@/lib/utils";

/** Fill colour of a ProgressBar: the five semantic roles plus `primary`, the default accent. */
export type ProgressBarTone = "primary" | "neutral" | "info" | "success" | "warning" | "error";

export interface ProgressBarProps {
  /** Current progress, 0 to `max`. Omit (or pass `null`) for an indeterminate bar. */
  value?: number | null;
  /** Value that means complete (default 100). */
  max?: number;
  /** Accessible name, e.g. "Uploading report.pdf". Shown above the bar unless `showLabel` is false. */
  label: string;
  /** Show the label visually (default true). When false it is still announced. */
  showLabel?: boolean;
  /** Show the percentage next to the label for determinate bars (default true). */
  showValue?: boolean;
  /** Track thickness: sm, md (default), lg. */
  size?: ControlSize;
  /** Fill colour by meaning: primary (the default accent), or a semantic role: neutral, info, success, warning, error. */
  tone?: ProgressBarTone;
  /** Number of blocks across the track (default 20, so each block is 5%). */
  segments?: number;
  /** Extra classes for the root (width). */
  className?: string;
}

const FILL: Record<ProgressBarTone, string> = {
  primary: "bg-primary-500 dark:bg-primary-400",
  neutral: "bg-secondary-600 dark:bg-secondary-400",
  info: "bg-info-600 dark:bg-info-400",
  success: "bg-success-600 dark:bg-success-400",
  warning: "bg-warning-600 dark:bg-warning-400",
  error: "bg-error-600 dark:bg-error-400",
};

const TRACK_HEIGHT = { sm: "h-2", md: "h-3", lg: "h-4" } as const;

/** Blocks in the indeterminate run. */
const RUN = 4;

/**
 * Hop interval, read from the duration.fast token so the march speeds up or
 * slows down with the motion scale (falls back to its current 120ms).
 */
function tickMs() {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return 120;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--duration-fast").trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
  return Number.isFinite(ms) && ms > 0 ? ms : 120;
}

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/**
 * Shows how far a task has got: determinate when `value` is set, indeterminate when it is omitted.
 *
 * @example
 * <ProgressBar label="Uploading" value={42} />
 * <ProgressBar label="Connecting" />  // indeterminate
 *
 * @param value - Progress toward `max`; omit for indeterminate
 * @param label - Accessible name (visible by default)
 * @param tone - primary (default), neutral, info, success, warning, error
 * @param size - sm, md, lg track thickness
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = true,
  showValue = true,
  size = "md",
  tone = "primary",
  segments = 20,
  className,
}: ProgressBarProps) {
  const labelId = useId();
  const indeterminate = value == null || Number.isNaN(value);
  const safeMax = max > 0 ? max : 100;
  const clamped = indeterminate ? 0 : Math.min(Math.max(value as number, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);
  const filled = Math.floor((clamped / safeMax) * segments);

  // Indeterminate hop: the run advances one block per tick (a stepped march,
  // not a glide). Paused entirely under reduced motion.
  const reducedMotion = usePrefersReducedMotion();
  const [head, setHead] = useState(0);
  useEffect(() => {
    if (!indeterminate || reducedMotion) return;
    const id = window.setInterval(() => setHead((h) => (h + 1) % (segments + RUN)), tickMs());
    return () => window.clearInterval(id);
  }, [indeterminate, reducedMotion, segments]);

  const isOn = (i: number) => {
    if (!indeterminate) return i < filled;
    if (reducedMotion) return true;
    return i > head - RUN - 1 && i <= head - 1;
  };

  return (
    <div className={cn("w-full space-y-1.5 font-mono", className)}>
      {showLabel && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span id={labelId} className="min-w-0 truncate text-[var(--text-primary)]">
            {label}
          </span>
          {showValue && !indeterminate && (
            <span className="shrink-0 tabular-nums text-[var(--text-secondary)]" aria-hidden="true">
              {percent}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-labelledby={showLabel ? labelId : undefined}
        aria-label={showLabel ? undefined : label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={indeterminate ? undefined : `${percent}%`}
        data-state={indeterminate ? "indeterminate" : clamped >= safeMax ? "complete" : "loading"}
        data-tone={tone}
        className="bg-[var(--border-default)] p-px"
      >
        <div
          className={cn("flex gap-0.5 bg-[var(--surface-subtle)] p-0.5", TRACK_HEIGHT[size])}
          aria-hidden="true"
        >
          {Array.from({ length: segments }, (_, i) => (
            <span
              key={i}
              data-filled={isOn(i) || undefined}
              className={cn(
                "h-full flex-1",
                isOn(i) ? FILL[tone] : "bg-[var(--surface-muted)]",
                indeterminate && reducedMotion && "opacity-50"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

ProgressBar.displayName = "ProgressBar";
