/**
 * TRANSCRIPT COMPONENT
 *
 * The scrolling region that holds a conversation's Messages, oldest first.
 * It follows the newest content the way LogView follows a log: pinned to the
 * bottom while a reply streams, paused when the reader scrolls up, and a
 * "Jump to latest" button with the count of new turns.
 *
 * Unlike a log, a conversation also grows inside its last turn as tokens
 * stream in, so Transcript follows content height (a ResizeObserver on the
 * content column) as well as the number of turns. Both behaviors come from
 * the shared useFollowScroll hook, so LogView and Transcript cannot drift.
 *
 * ACCESSIBILITY: the scroll region is `role="log"` (polite, additions only)
 * and focusable for keyboard scrolling. Its name is required by the props
 * type (decision 0029): `aria-label` or `aria-labelledby`, with no default.
 * Streaming turns are `aria-busy`; because support for that varies, a
 * separate visually hidden status region also says "Responding" and
 * "Response complete" as `busy` changes.
 *
 * TOKENS USED:
 * - surface.container-stroke (ring) and surface.page (fill) when `framed`
 * - plate.round-lg, focus-ring.primary, focus-ring.width
 * - spacing 6 between turns
 */

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { useFollowScroll } from "@/lib/use-follow-scroll";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "./VisuallyHidden";
import { Button } from "./Button";

/** Max width of the content column, from the Container scale (`sm` 640px, `md` 768px, `lg` 1024px). */
export type TranscriptWidth = "sm" | "md" | "lg" | "full";

interface TranscriptOwnProps {
  /** Messages, oldest first. Append new turns to the end; a streaming reply grows in place as the last child. */
  children?: ReactNode;
  /** A reply is streaming. Drives the "Responding" and "Response complete" announcements; pair it with the last Message's `status="streaming"` and the Composer's `busy`. */
  busy?: boolean;
  /** Follow new content to the bottom (default true). Following pauses while the reader is scrolled up and resumes at the bottom or from "Jump to latest". */
  autoScroll?: boolean;
  /** Shown centered when there are no children. Usually an EmptyState with starter prompts that teach what to ask. */
  emptyState?: ReactNode;
  /** Max width of the content column: `sm`, `md` (default), `lg` or `full`, on the Container scale. Use `full` inside a narrow pane. */
  width?: TranscriptWidth;
  /** Draw the plate ring, as LogView does (default false: a Transcript usually fills a pane that is already framed, such as a Window). */
  framed?: boolean;
  /** Accessible name of the log region, such as "Conversation"; this or `aria-labelledby` is required. */
  "aria-label"?: string;
  /** Id of visible text that names the log region, such as the pane title. Use it instead of `aria-label` when such text exists. */
  "aria-labelledby"?: string;
  /** Fires with `false` when following pauses (the reader scrolled up) and `true` when it resumes. */
  onFollowChange?: (following: boolean) => void;
  /** Extra classes for the wrapper. Set the height here (`h-96`) or let a flex parent size it (`min-h-0 flex-1`). */
  className?: string;
}

/** The log region's accessible name, required (decision 0029). */
type TranscriptName = { "aria-label": string } | { "aria-labelledby": string };

/** Props of `Transcript`: its own props plus a required accessible name, given as `aria-label` or `aria-labelledby`. */
export type TranscriptProps = TranscriptOwnProps & TranscriptName;

const WIDTHS: Record<TranscriptWidth, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  full: "max-w-full",
};

/**
 * The scrolling list of turns in a conversation. It stays pinned to the
 * newest text while a reply streams, pauses when the reader scrolls up, and
 * offers "Jump to latest". Use `LogView` for machine output with no turns.
 *
 * ```tsx
 * <Transcript aria-label="Conversation" busy={streaming} className="min-h-0 flex-1">
 *   {turns.map((t) => <Message key={t.id} author={t.author}>{t.text}</Message>)}
 * </Transcript>
 * ```
 */
export function Transcript({
  children,
  busy = false,
  autoScroll = true,
  emptyState,
  width = "md",
  framed = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onFollowChange,
  className,
}: TranscriptProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const count = Children.toArray(children).length;
  const { scrollRef, onScroll, following, unseen, resume } = useFollowScroll<HTMLDivElement>({
    content: children,
    count,
    enabled: autoScroll,
    onFollowChange,
    contentRef,
  });

  // Announce the start and end of a reply once each, not the tokens between.
  const [announcement, setAnnouncement] = useState("");
  const wasBusy = useRef(busy);
  useEffect(() => {
    if (busy === wasBusy.current) return;
    wasBusy.current = busy;
    setAnnouncement(busy ? "Responding" : "Response complete");
  }, [busy]);

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col",
        framed && "plate-round-lg bg-[var(--surface-container-stroke)] p-px",
        className
      )}
    >
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable log must be keyboard-focusable (axe scrollable-region-focusable), as in LogView
        tabIndex={0}
        onScroll={onScroll}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto font-mono",
          framed && "plate-round-lg bg-[var(--surface-page)]",
          "focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]"
        )}
      >
        {/* Always rendered, so the size observer is attached before the first turn arrives */}
        <div
          ref={contentRef}
          className={cn(
            "mx-auto flex w-full flex-col p-4",
            WIDTHS[width],
            count === 0 ? "h-full items-center justify-center" : "gap-6"
          )}
        >
          {count === 0 ? emptyState : children}
        </div>
      </div>
      {autoScroll && !following && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={resume}
            iconLeft="ChevronDown"
            className="pointer-events-auto"
          >
            {unseen > 0 ? `Jump to latest (${unseen} new)` : "Jump to latest"}
          </Button>
        </div>
      )}
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </div>
  );
}

Transcript.displayName = "Transcript";
