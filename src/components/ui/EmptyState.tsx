/**
 * EMPTY STATE COMPONENT
 *
 * What a view shows when it has nothing to show: no results, no items yet,
 * or a cleared inbox. It says what happened and, when there is one, offers
 * the next step (create the first item, clear filters).
 *
 * SIZES:
 * - sm: inline, inside a card, table body, or panel (smaller icon and title)
 * - md: page-level, the main content of an empty screen (default)
 *
 * CONTENT GUIDANCE: the title names the situation in plain words ("No
 * projects yet"), the description says why or what to do, and actions are
 * at most one primary plus one secondary Button. Errors that block the
 * user belong in Alert, not here.
 *
 * TOKENS USED:
 * - surface.subtle (icon plate), text.primary (title), text.secondary
 *   (description, icon), plate.round, Button tokens for actions
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

/** A Button rendered by EmptyState. */
export interface EmptyStateAction {
  /** Button text; start with a verb ("Create project"). */
  label: string;
  /** Click handler. */
  onClick?: () => void;
  /** Renders the button as a link instead. */
  href?: string;
  /** Optional icon before the label: a TuiIcon name or an element. */
  icon?: IconSlot;
}

export interface EmptyStateProps {
  /** Icon shown above the title: a TuiIcon name or an element (default "Archive"). Pass `null` for none. */
  icon?: IconSlot | null;
  /** Short statement of the situation, e.g. "No results". */
  title: ReactNode;
  /** One or two sentences: why it is empty and what to do. */
  description?: ReactNode;
  /** The main next step, rendered as a primary Button. */
  primaryAction?: EmptyStateAction;
  /** An alternative step (e.g. "Clear filters"), rendered as a secondary Button. */
  secondaryAction?: EmptyStateAction;
  /** sm for inline use in cards and tables; md (default) for a whole page or panel. */
  size?: "sm" | "md";
  /** Heading element for the title, to fit the page outline (default "h2"). */
  titleAs?: "h2" | "h3" | "h4" | "p";
  /** Extra content under the actions (a help link, a hint). */
  children?: ReactNode;
  /** Extra classes for the root. */
  className?: string;
}

const SIZES = {
  sm: { root: "gap-3 px-4 py-6", icon: "6" as const, plate: "p-2", title: "text-sm", description: "text-xs", button: "sm" as const },
  md: { root: "gap-4 px-6 py-12", icon: "8" as const, plate: "p-3", title: "text-lg", description: "text-sm", button: "md" as const },
};

/**
 * Explains why a view has nothing to show and offers the next step, inline (`sm`) or filling a page (`md`).
 *
 * @example
 * <EmptyState
 *   icon="Search"
 *   title="No results"
 *   description="Try a shorter search or clear the filters."
 *   secondaryAction={{ label: "Clear filters", onClick: clear }}
 * />
 *
 * @param icon - TuiIcon name above the title
 * @param title - Plain statement of what is empty
 * @param primaryAction / secondaryAction - Optional Buttons
 * @param size - sm inline, md page
 */
export function EmptyState({
  icon = "Archive",
  title,
  description,
  primaryAction,
  secondaryAction,
  size = "md",
  titleAs: Title = "h2",
  children,
  className,
}: EmptyStateProps) {
  const s = SIZES[size];

  const renderAction = (action: EmptyStateAction, variant: "primary" | "secondary") => (
    <Button
      variant={variant}
      size={s.button}
      onClick={action.onClick}
      href={action.href}
      iconLeft={action.icon ? renderIconSlot(action.icon) : undefined}
    >
      {action.label}
    </Button>
  );

  return (
    <div className={cn("flex flex-col items-center text-center font-mono", s.root, className)}>
      {icon && (
        <span className={cn("inline-flex plate-round bg-[var(--surface-subtle)] text-[var(--text-secondary)]", s.plate)}>
          {renderIconSlot(icon, { size: s.icon })}
        </span>
      )}
      <div className="flex max-w-prose flex-col gap-1">
        <Title className={cn("font-medium text-[var(--text-primary)]", s.title)}>{title}</Title>
        {description && <p className={cn("text-[var(--text-secondary)]", s.description)}>{description}</p>}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && renderAction(primaryAction, "primary")}
          {secondaryAction && renderAction(secondaryAction, "secondary")}
        </div>
      )}
      {children}
    </div>
  );
}

EmptyState.displayName = "EmptyState";
