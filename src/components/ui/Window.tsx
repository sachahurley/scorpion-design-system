/**
 * WINDOW COMPONENT (pane)
 *
 * A framed terminal pane: the large plate ring (stroke layer + fill layer
 * inset 1px) with a TUI title bar and a scrollable body. Use it for the
 * panes of a workbench layout (file list, inspector, log tail) or any
 * titled region that scrolls on its own.
 *
 * TITLE BAR: `title` on the left, a hairline rule filling the gap (the
 * ruled title line of a terminal frame, drawn with CSS), then optional
 * `status` text and `actions` on the right.
 *
 * VARIANTS:
 * - default: container stroke ring
 * - active: the focused pane. Accent ring, muted title bar, and a
 *   ChevronRight marker before the title, so focus is never shown by
 *   color alone.
 *
 * BODY: a scroll region (`overflow-auto`) that is keyboard focusable, so
 * keyboard users can scroll long content; it is a group named by the title
 * (the section itself is the region landmark).
 *
 * TOKENS USED:
 * - surface.container-stroke (ring), accent (active ring)
 * - surface.card (fill), surface.muted (active title bar)
 * - border.hairline (title rule and bar edge)
 * - text.primary / text.secondary, plate.round-lg, focus inset ring
 */

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TuiIcon } from "./TuiIcon";

export interface WindowProps {
  /** Pane title shown in the title bar; also names the pane and its scroll region. */
  title: ReactNode;
  /** Short status text at the right of the title bar ("tail -f", "3 errors", "12:04"). */
  status?: ReactNode;
  /** Title bar actions (icon Buttons, a Badge). Keep them small (`size="sm"`). */
  actions?: ReactNode;
  /**
   * Marks the focused pane: the accent ring, a muted title bar and a ChevronRight
   * marker, so focus never relies on colour alone. Set it on the one pane the
   * user is working in.
   */
  active?: boolean;
  /** Heading element used for the title (default "h2"). Match your page outline. */
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
  /** Scrolling body (default true). Set false to let content size the pane. */
  scroll?: boolean;
  /** Pane content. */
  children: ReactNode;
  /** Extra classes for the outer frame (set width / height here). */
  className?: string;
  /** Extra classes for the body (padding, max-height). */
  bodyClassName?: string;
}

/**
 * Window
 *
 * ```tsx
 * <Window title="sessions.log" status="tail -f" active scroll={false} bodyClassName="p-0" className="h-80">
 *   <LogView lines={lines} framed={false} className="h-full" />
 * </Window>
 * ```
 */
export function Window({
  title,
  status,
  actions,
  active = false,
  titleAs: TitleTag = "h2",
  scroll = true,
  children,
  className,
  bodyClassName,
}: WindowProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      data-active={active || undefined}
      className={cn(
        "plate-round-lg flex flex-col p-px",
        active ? "bg-[var(--accent)]" : "bg-[var(--surface-container-stroke)]",
        className
      )}
    >
      <div className="plate-round-lg flex min-h-0 flex-1 flex-col bg-[var(--surface-card)] font-mono">
        <div
          className={cn(
            "flex min-h-control-sm shrink-0 items-center gap-2 border-b border-[var(--border-hairline)] px-4 py-1 text-xs",
            active && "bg-[var(--surface-muted)]"
          )}
        >
          {active && <TuiIcon name="ChevronRight" size="3" className="shrink-0 text-[var(--text-primary)]" />}
          <TitleTag
            id={titleId}
            className="min-w-0 truncate text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]"
          >
            {title}
          </TitleTag>
          <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-[var(--surface-container-stroke)]" />
          {status && <span className="shrink-0 text-[var(--text-secondary)]">{status}</span>}
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
        <div
          tabIndex={scroll ? 0 : undefined}
          role={scroll ? "group" : undefined}
          aria-labelledby={scroll ? titleId : undefined}
          className={cn(
            "min-h-0 flex-1 p-4 text-sm text-[var(--text-primary)]",
            scroll &&
              "overflow-auto focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]",
            bodyClassName
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

Window.displayName = "Window";
