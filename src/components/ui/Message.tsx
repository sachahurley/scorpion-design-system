/**
 * MESSAGE COMPONENT
 *
 * One turn in a conversation, drawn as a terminal transcript rather than
 * chat bubbles: every turn is full width and left aligned, and turns are told
 * apart by a role label and a gutter marker, never by side or color alone.
 *
 * - user: a ChevronRight prompt marker in the gutter and a --surface-muted
 *   plate behind the text, like a typed command.
 * - assistant: no marker, no plate; the text reads as output.
 * - system: one muted line (a mode change, "Replaying a recorded session").
 *
 * STREAMING: `status="streaming"` appends a block cursor (the full block
 * character, one cell wide in the mono stack) after the last character. It
 * is steady, not blinking: a reply can stream for longer than five seconds,
 * and blinking content that runs that long needs a way to stop it (WCAG
 * 2.2.2). A steady block is also a stable frame for visual regression. The
 * article is `aria-busy` meanwhile, so the transcript announces the finished
 * turn rather than every token.
 *
 * TOKENS USED:
 * - surface.muted (user plate; surface.subtle equals surface.page in dark,
 *   so it would vanish on the default theme), plate.round
 * - accent (prompt marker, cursor)
 * - text.primary (body), text.secondary (label, meta, system line, stopped)
 * - error AA pair 700 / 400 (error footer), as FieldMessage
 */

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "./VisuallyHidden";
import { Button } from "./Button";
import { TuiIcon } from "./TuiIcon";

/** Who a turn is from. */
export type MessageAuthor = "user" | "assistant" | "system";

/** Where a turn is in its life. */
export type MessageStatus = "done" | "streaming" | "stopped" | "error";

export interface MessageProps {
  /** Who the turn is from: `user` (prompt marker and plate), `assistant` (plain output) or `system` (one muted line). Named `author`, not `role`, so it never collides with the ARIA attribute. */
  author: MessageAuthor;
  /** Visible role label, which also names the turn for screen readers (default "You", "Scorp" or "System"). Set it to the model or product name when that is clearer. */
  label?: ReactNode;
  /** Secondary header text after the label: a time, the model, "replayed". */
  meta?: ReactNode;
  /** `done` (default); `streaming` adds the block cursor and `aria-busy`; `stopped` adds a "Stopped" footer; `error` adds the error footer with `errorMessage`. */
  status?: MessageStatus;
  /** Footer text when `status="error"` (default "Something went wrong."). Say what failed and, with `onRetry`, that it can be retried. */
  errorMessage?: ReactNode;
  /** Adds a Retry button to the error footer. Only shown when `status="error"`. */
  onRetry?: () => void;
  /** Header actions (copy, retry, edit): ghost `size="sm"` icon-only Buttons with `type="button"` and an `aria-label`. Always rendered, never only on hover. */
  actions?: ReactNode;
  /** The turn's content. A string keeps its line breaks; nodes (paragraphs, a CodeBlock) render as given, `spacing.3` apart. */
  children: ReactNode;
  /** Anchor id, for linking to a turn. */
  id?: string;
  /** Extra classes for the article (margin). Spacing between turns belongs to `Transcript`. */
  className?: string;
}

const DEFAULT_LABEL: Record<MessageAuthor, string> = { user: "You", assistant: "Scorp", system: "System" };

/** The streaming block cursor: steady, hidden from assistive tech. */
function Cursor() {
  return (
    <span aria-hidden="true" data-cursor="" className="text-[var(--accent)]">
      {"█"}
    </span>
  );
}

/**
 * One turn in a conversation, drawn as a line of terminal transcript rather
 * than a chat bubble. Place Messages inside a `Transcript`, which owns the
 * scrolling and the space between turns.
 *
 * ```tsx
 * <Message author="user" meta="12:04">Make a settings screen</Message>
 * <Message author="assistant" status="streaming">Here is a settings screen</Message>
 * ```
 */
export function Message({
  author,
  label,
  meta,
  status = "done",
  errorMessage = "Something went wrong.",
  onRetry,
  actions,
  children,
  id,
  className,
}: MessageProps) {
  const labelId = useId();
  const name = label ?? DEFAULT_LABEL[author];
  const streaming = status === "streaming";

  if (author === "system") {
    return (
      <article
        id={id}
        aria-labelledby={labelId}
        data-author="system"
        className={cn("flex gap-3 font-mono text-xs text-[var(--text-secondary)]", className)}
      >
        <span aria-hidden="true" className="w-5 shrink-0" />
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
          <VisuallyHidden id={labelId}>{name}</VisuallyHidden>
          {children}
          {meta && <span className="ml-2">{meta}</span>}
        </p>
      </article>
    );
  }

  const user = author === "user";
  const body =
    typeof children === "string" ? (
      <p className="whitespace-pre-wrap break-words">
        {children}
        {streaming && <Cursor />}
      </p>
    ) : (
      <>
        {children}
        {streaming && <Cursor />}
      </>
    );

  return (
    <article
      id={id}
      aria-labelledby={labelId}
      aria-busy={streaming || undefined}
      data-author={author}
      data-status={status}
      className={cn("flex gap-3 font-mono", className)}
    >
      {/* Fixed gutter, so text aligns across turns with and without a marker.
          self-start + the header's height puts the marker on the label line. */}
      <span aria-hidden="true" className="flex min-h-control-sm w-5 shrink-0 items-center self-start text-[var(--accent)]">
        {user && <TuiIcon name="ChevronRight" size="3" />}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <header className="flex min-h-control-sm items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span id={labelId} className="uppercase tracking-wider">
            {name}
          </span>
          {meta && <span>{meta}</span>}
          {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
        </header>
        <div
          className={cn(
            "space-y-3 text-sm leading-relaxed text-[var(--text-primary)]",
            user && "plate-round bg-[var(--surface-muted)] px-3 py-2"
          )}
        >
          {body}
        </div>
        {status === "stopped" && <p className="text-xs text-[var(--text-secondary)]">Stopped</p>}
        {status === "error" && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-error-700 dark:text-error-400">
            <p className="flex items-center gap-1.5">
              <TuiIcon name="AlertCircle" size="3" className="shrink-0" />
              {errorMessage}
            </p>
            {onRetry && (
              <Button type="button" variant="secondary" size="sm" onClick={onRetry} iconLeft="Repeat">
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

Message.displayName = "Message";
