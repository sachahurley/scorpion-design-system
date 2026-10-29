/**
 * STATUS LINE COMPONENT (status bar)
 *
 * The bottom bar of a terminal app (vim, tmux): a strip of short segments
 * in three zones, left / center / right. Segments are `StatusLineSegment`
 * elements that can carry a 1-bit icon and a semantic tone.
 *
 * TONES: `neutral` (plain text), `primary` (the highlighted mode segment,
 * primary button fill), and `success` / `warning` / `error` / `info`
 * (tinted plates using the Badge AA pairs). Pair a tone with an icon or
 * words ("3 errors", not a red dot) so color is never the only signal.
 *
 * LIVE UPDATES: by default the bar is a named group and changes are not
 * announced. Set `live` to make it `role="status"` (polite announcements)
 * when its text reflects results the user is waiting on.
 *
 * TOKENS USED:
 * - surface.muted (bar), border.hairline (top edge)
 * - button.primary.background / text (primary segment)
 * - success / warning / error / info 50 / 950 fills with 800 / 300 text
 * - text.primary (neutral), control.height.sm (bar height)
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

/** Semantic tone of a status segment. */
export type StatusLineTone = "neutral" | "primary" | "success" | "warning" | "error" | "info";

export interface StatusLineProps {
  /** Left zone segments (mode, branch, file). */
  left?: ReactNode;
  /** Center zone segments (message, progress). */
  center?: ReactNode;
  /** Right zone segments (position, encoding, clock). */
  right?: ReactNode;
  /** Announce changes politely (`role="status"`). Off by default to avoid chatter. */
  live?: boolean;
  /** Accessible name of the bar (default "Status"). */
  "aria-label"?: string;
  /** Extra classes for the bar. */
  className?: string;
}

const TONES: Record<StatusLineTone, string> = {
  neutral: "text-[var(--text-primary)]",
  primary: "bg-[var(--button-primary-background)] text-[var(--button-primary-text)] font-bold",
  success: "bg-success-50 text-success-800 dark:bg-success-950 dark:text-success-300",
  warning: "bg-warning-50 text-warning-800 dark:bg-warning-950 dark:text-warning-300",
  error: "bg-error-50 text-error-800 dark:bg-error-950 dark:text-error-300",
  info: "bg-info-50 text-info-800 dark:bg-info-950 dark:text-info-300",
};

/**
 * StatusLine
 *
 * ```tsx
 * <StatusLine
 *   left={<StatusLineSegment tone="primary">NORMAL</StatusLineSegment>}
 *   center={<StatusLineSegment>sessions.log</StatusLineSegment>}
 *   right={<StatusLineSegment icon="AlertCircle" tone="error">2 errors</StatusLineSegment>}
 * />
 * ```
 */
export function StatusLine({
  left,
  center,
  right,
  live = false,
  "aria-label": ariaLabel = "Status",
  className,
}: StatusLineProps) {
  return (
    <div
      role={live ? "status" : "group"}
      aria-live={live ? "polite" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "grid min-h-control-sm w-full grid-cols-[1fr_auto_1fr] items-stretch border-t border-[var(--border-hairline)] bg-[var(--surface-muted)] font-mono text-xs text-[var(--text-primary)]",
        className
      )}
    >
      <div className="flex min-w-0 items-stretch justify-start">{left}</div>
      <div className="flex min-w-0 items-stretch justify-center">{center}</div>
      <div className="flex min-w-0 items-stretch justify-end">{right}</div>
    </div>
  );
}

StatusLine.displayName = "StatusLine";

export interface StatusLineSegmentProps {
  /** Icon before the text, a TuiIcon name or an element. Use one with any non-neutral tone. */
  icon?: IconSlot;
  /** Semantic tone (default "neutral"). */
  tone?: StatusLineTone;
  /** Segment text. Keep it to a few words. */
  children: ReactNode;
  /** Extra classes for the segment. */
  className?: string;
}

/** One segment of a StatusLine zone. */
export function StatusLineSegment({ icon, tone = "neutral", children, className }: StatusLineSegmentProps) {
  return (
    <span
      data-tone={tone}
      className={cn("inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap px-3", TONES[tone], className)}
    >
      {icon && renderIconSlot(icon, { size: "3", className: "shrink-0" })}
      <span className="truncate">{children}</span>
    </span>
  );
}

StatusLineSegment.displayName = "StatusLineSegment";
