/**
 * LOG VIEW COMPONENT
 *
 * A monospace, scrolling log tail: build output, server logs, job runs.
 * Each line shows an optional line number, an optional timestamp, the
 * level as a 1-bit icon PLUS a text tag (INFO / WARN / ERROR / DEBUG, so
 * color is never the only signal), and the message.
 *
 * AUTO-SCROLL: with `autoScroll` (default on) the view follows new lines,
 * like `tail -f`. Scrolling up pauses following so the reader keeps their
 * place; a "Jump to latest" button appears with the count of unseen lines
 * and resumes following. Scrolling back to the bottom also resumes.
 *
 * ACCESSIBILITY: the scroll container is `role="log"` with
 * `aria-live="polite"`, so appended lines are announced without
 * interrupting. It is focusable so keyboard users can scroll it.
 *
 * TOKENS USED:
 * - surface.page (log background), surface.container-stroke (ring);
 *   unframed logs inherit the surrounding surface
 * - text.primary (messages), text.secondary (numbers, timestamps)
 * - info / warning / error semantic scales (level tags, AA pairs 700 on
 *   light, 400 on dark), secondary scale (debug)
 * - plate.round-lg (frame), focus inset ring
 */

import type { ReactNode } from "react";
import { useFollowScroll } from "@/lib/use-follow-scroll";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { TuiIcon, type TuiIconName } from "./TuiIcon";

/** Severity of a log line. Drives the icon, the text tag, and the tag color. */
export type LogLevel = "info" | "warn" | "error" | "debug";

/** One line in the log. */
export interface LogLine {
  /** Stable id (used as the React key; keep it unique and stable across appends). */
  id: string | number;
  /** The message. Plain text keeps the monospace grid; nodes are allowed. */
  text: ReactNode;
  /** Severity. Lines without a level render no tag. */
  level?: LogLevel;
  /** Timestamp text, pre-formatted ("12:04:01"). */
  timestamp?: string;
}

export interface LogViewProps {
  /** Lines to show, oldest first. Append to the end to stream. */
  lines: LogLine[];
  /** Follow new lines to the bottom (default true). Pauses while the user is scrolled up. */
  autoScroll?: boolean;
  /** Show a gutter of 1-based line numbers (default false). */
  showLineNumbers?: boolean;
  /** Wrap long lines instead of scrolling horizontally (default true). */
  wrap?: boolean;
  /** Accessible name of the log region (default "Log"). */
  "aria-label"?: string;
  /** Rendered when `lines` is empty (default "No output yet."). */
  emptyState?: ReactNode;
  /**
   * Draw the plate ring frame (default true). Set false when the log sits
   * inside another frame, such as a Window body.
   */
  framed?: boolean;
  /** Fires when following pauses (user scrolled up) or resumes. */
  onFollowChange?: (following: boolean) => void;
  /** Extra classes for the frame. Set the height here (default h-80). */
  className?: string;
}

const LEVELS: Record<LogLevel, { icon: TuiIconName; tag: string; tone: string }> = {
  info: { icon: "Info", tag: "INFO", tone: "text-info-700 dark:text-info-400" },
  warn: { icon: "AlertTriangle", tag: "WARN", tone: "text-warning-700 dark:text-warning-400" },
  error: { icon: "AlertCircle", tag: "ERROR", tone: "text-error-700 dark:text-error-400" },
  debug: { icon: "Settings", tag: "DEBUG", tone: "text-secondary-700 dark:text-secondary-400" },
};

/**
 * LogView
 *
 * ```tsx
 * <LogView
 *   aria-label="Build output"
 *   showLineNumbers
 *   lines={[{ id: 1, level: "info", timestamp: "12:04:01", text: "connection accepted" }]}
 * />
 * ```
 */
export function LogView({
  lines,
  autoScroll = true,
  showLineNumbers = false,
  wrap = true,
  "aria-label": ariaLabel = "Log",
  emptyState = "No output yet.",
  framed = true,
  onFollowChange,
  className,
}: LogViewProps) {
  // Follow, pause and resume live in the shared useFollowScroll hook.
  const { scrollRef, onScroll: handleScroll, following, unseen, resume } = useFollowScroll({
    content: lines,
    count: lines.length,
    enabled: autoScroll,
    onFollowChange,
  });

  // Keep the level column aligned for lines without a level.
  const hasLevels = lines.some((l) => l.level);

  // Gutter sized to the widest line number (content-derived, in ch units).
  const gutterWidth = `${String(Math.max(lines.length, 1)).length}ch`;

  return (
    <div
      className={cn(
        "relative flex h-80 flex-col",
        framed && "plate-round-lg bg-[var(--surface-container-stroke)] p-px",
        className
      )}
    >
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label={ariaLabel}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable log must be keyboard-focusable (axe scrollable-region-focusable)
        tabIndex={0}
        onScroll={handleScroll}
        className={cn(
          "min-h-0 flex-1 overflow-auto py-2 font-mono text-xs leading-relaxed text-[var(--text-primary)]",
          framed && "plate-round-lg bg-[var(--surface-page)]",
          "focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]"
        )}
      >
        {lines.length === 0 ? (
          <p className="px-3 text-[var(--text-secondary)]">{emptyState}</p>
        ) : (
          lines.map((line, index) => {
            const level = line.level ? LEVELS[line.level] : null;
            return (
              <div
                key={line.id}
                data-level={line.level}
                className={cn("flex gap-3 px-3", wrap ? "items-start" : "w-max min-w-full items-start")}
              >
                {showLineNumbers && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 select-none text-right tabular-nums text-[var(--text-secondary)]"
                    style={{ minWidth: gutterWidth }}
                  >
                    {index + 1}
                  </span>
                )}
                {line.timestamp && (
                  <span className="shrink-0 tabular-nums text-[var(--text-secondary)]">{line.timestamp}</span>
                )}
                {level ? (
                  <span className={cn("inline-flex w-16 shrink-0 items-center gap-1 font-bold", level.tone)}>
                    <TuiIcon name={level.icon} size="3" className="shrink-0" />
                    {level.tag}
                  </span>
                ) : (
                  hasLevels && <span aria-hidden="true" className="w-16 shrink-0" />
                )}
                <span className={cn("min-w-0 flex-1", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>
                  {line.text}
                </span>
              </div>
            );
          })
        )}
      </div>
      {autoScroll && !following && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={resume}
            iconLeft={<TuiIcon name="ChevronDown" size="4" />}
            className="pointer-events-auto"
          >
            {unseen > 0 ? `Jump to latest (${unseen} new)` : "Jump to latest"}
          </Button>
        </div>
      )}
    </div>
  );
}

LogView.displayName = "LogView";
