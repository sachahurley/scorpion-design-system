/**
 * SIDE NAV COMPONENT (navigation rail)
 *
 * The Patterns/SideNavigation recipe as a component: plate rows on a
 * container surface. Idle rows are quiet secondary text; hover fills the
 * plate with surface.muted and flips the text to the accent; the active
 * route holds that state (fill + color, never color alone, never weight)
 * and carries `aria-current="page"`.
 *
 * COMPOUND API:
 *   <SideNav aria-label="Primary">
 *     <SideNavSection heading="Workspace">
 *       <SideNavItem icon="Star" label="Home" href="/" active />
 *       <SideNavItem icon="Settings" label="Settings">
 *         <SideNavItem label="Profile" href="/settings/profile" />
 *       </SideNavItem>
 *     </SideNavSection>
 *   </SideNav>
 *
 * An item with child items becomes a collapsible group: its row is a
 * button with `aria-expanded` / `aria-controls`, and it starts expanded
 * when it contains the active item.
 *
 * COLLAPSED MODE: `collapsed` shrinks the rail to icon-only rows. Labels
 * move into each row's accessible name (`aria-label`) and a Tooltip, and
 * section headings become screen-reader only.
 *
 * TOKENS USED:
 * - surface.container (rail), border.hairline (rail edge)
 * - surface.muted (hover / active fill), accent (hover / active text)
 * - text.secondary (idle rows, section headings)
 * - plate.round, focus inset ring, duration.fast, touch.target (row height)
 */

import React, {
  createContext,
  useContext,
  useId,
  useState,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Tooltip";
import { TuiIcon } from "./TuiIcon";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

type SideNavContextValue = { collapsed: boolean };
const SideNavContext = createContext<SideNavContextValue>({ collapsed: false });

export interface SideNavProps {
  /**
   * Accessible name for the nav landmark, e.g. "Primary". Required when the
   * page has more than one `<nav>`.
   */
  "aria-label"?: string;
  /** Icon-only rail: labels become accessible names plus tooltips. */
  collapsed?: boolean;
  /** SideNavSection and/or SideNavItem children. */
  children: ReactNode;
  /** Extra classes for the `<nav>` (width, height, borders). */
  className?: string;
}

/**
 * Navigation rail root. Renders a `<nav>` on the container surface. Children
 * are SideNavSection groups, or SideNavItem rows directly.
 */
export function SideNav({ "aria-label": ariaLabel, collapsed = false, children, className }: SideNavProps) {
  // Loose items get wrapped in a list so the markup stays valid.
  const hasSections = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === SideNavSection
  );
  return (
    <SideNavContext.Provider value={{ collapsed }}>
      <nav
        aria-label={ariaLabel}
        data-collapsed={collapsed || undefined}
        className={cn(
          "border border-[var(--border-hairline)] bg-[var(--surface-container)] font-mono text-sm",
          collapsed ? "w-fit p-2" : "w-64 p-4",
          className
        )}
      >
        {hasSections ? (
          <div className="space-y-4">{children}</div>
        ) : (
          <ul className="space-y-1">{children}</ul>
        )}
      </nav>
    </SideNavContext.Provider>
  );
}

SideNav.displayName = "SideNav";

export interface SideNavSectionProps {
  /** Optional section heading. Screen-reader only when the rail is collapsed. */
  heading?: ReactNode;
  /** SideNavItem rows. */
  children: ReactNode;
  /** Extra classes for the section wrapper. */
  className?: string;
}

/** A labelled group of rows inside SideNav. The heading names the group for assistive tech. */
export function SideNavSection({ heading, children, className }: SideNavSectionProps) {
  const { collapsed } = useContext(SideNavContext);
  const headingId = useId();
  return (
    <div
      role={heading ? "group" : undefined}
      aria-labelledby={heading ? headingId : undefined}
      className={className}
    >
      {heading && (
        <div
          id={headingId}
          className={cn(
            "px-3 pb-2 text-xs uppercase tracking-wider text-[var(--text-secondary)]",
            collapsed && "sr-only"
          )}
        >
          {heading}
        </div>
      )}
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

SideNavSection.displayName = "SideNavSection";

export interface SideNavItemProps {
  /** Row text. Also the accessible name and tooltip in collapsed mode. */
  label: string;
  /** Icon shown before the label, a TuiIcon name or an element (strongly recommended; required for a useful collapsed rail). */
  icon?: IconSlot;
  /** Marks the current route: holds the hover fill and sets `aria-current="page"`. */
  active?: boolean;
  /** Destination; renders an `<a>`. */
  href?: string;
  /** Click handler. Without `href`, the row renders as a `<button>`. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Custom link component (e.g. a router `<Link>`); its props go in `asProps`. */
  as?: ElementType;
  /**
   * Props for the `as` component (`to`, `state`, ...), spread onto it as-is. They are spread untyped: TypeScript does not check them against the `as` component's own props, so a misspelt `to` is not caught at compile time.
   */
  asProps?: Record<string, unknown>;
  /** Trailing content at the row end (a count Badge, a Kbd hint). Hidden when collapsed. */
  trailing?: ReactNode;
  /**
   * Nested SideNavItem rows. Turns this row into a collapsible group button
   * with `aria-expanded`; `href` / `onClick` are then ignored.
   */
  children?: ReactNode;
  /** Group open state (controlled). */
  expanded?: boolean;
  /** Initial group open state. Defaults to true when a descendant is `active`. */
  defaultExpanded?: boolean;
  /** Fires when a group row toggles. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Extra classes for the row element. */
  className?: string;
}

const ROW =
  "plate-round flex w-full min-h-touch items-center gap-3 px-3 py-2 text-left font-mono text-sm " +
  "transition-colors [transition-duration:var(--duration-fast)] motion-reduce:transition-none " +
  "focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]";
const ROW_IDLE = "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--accent)]";
const ROW_ACTIVE = "bg-[var(--surface-muted)] text-[var(--accent)]";

function containsActive(children: ReactNode): boolean {
  let found = false;
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return;
    const props = child.props as { active?: boolean; children?: ReactNode };
    if (props.active || containsActive(props.children)) found = true;
  });
  return found;
}

/**
 * One navigation row. Renders `<a href>`, a router link (`as`), or a
 * `<button>` (`onClick` only). With nested SideNavItem children it becomes a
 * collapsible group.
 */
export function SideNavItem({
  label,
  icon,
  active = false,
  href,
  onClick,
  as: As,
  asProps,
  trailing,
  children,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  className,
}: SideNavItemProps) {
  const { collapsed } = useContext(SideNavContext);
  const groupId = useId();
  const isGroup = React.Children.toArray(children).some(React.isValidElement);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    () => defaultExpanded ?? (isGroup && containsActive(children))
  );
  const open = expandedProp ?? uncontrolledOpen;

  const toggle = () => {
    const next = !open;
    if (expandedProp === undefined) setUncontrolledOpen(next);
    onExpandedChange?.(next);
  };

  const body = (
    <>
      {icon && renderIconSlot(icon, { className: "shrink-0" })}
      <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{label}</span>
      {!collapsed && trailing && <span className="ml-auto shrink-0">{trailing}</span>}
      {isGroup && (
        <TuiIcon
          name={open ? "ChevronDown" : "ChevronRight"}
          size={collapsed ? "3" : "4"}
          className={cn("shrink-0", !collapsed && "ml-auto")}
        />
      )}
    </>
  );

  const rowClasses = cn(ROW, active ? ROW_ACTIVE : ROW_IDLE, collapsed && "min-w-touch justify-center gap-1 px-2", className);
  // Collapsed rows hide the visible label, so name them directly.
  const nameProps = collapsed ? { "aria-label": label } : {};

  let row: ReactNode;
  if (isGroup) {
    row = (
      <button
        type="button"
        aria-expanded={open}
        aria-controls={groupId}
        onClick={toggle}
        className={rowClasses}
        {...nameProps}
      >
        {body}
      </button>
    );
  } else if (As) {
    row = (
      <As
        className={rowClasses}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        {...nameProps}
        {...asProps}
      >
        {body}
      </As>
    );
  } else if (href != null) {
    row = (
      <a
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        className={rowClasses}
        {...nameProps}
      >
        {body}
      </a>
    );
  } else {
    row = (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        className={rowClasses}
        {...nameProps}
      >
        {body}
      </button>
    );
  }

  return (
    <li>
      {collapsed ? (
        <Tooltip content={label} side="right">
          {row}
        </Tooltip>
      ) : (
        row
      )}
      {isGroup && open && (
        <ul id={groupId} className={cn("mt-1 space-y-1", !collapsed && "ml-6")}>
          {children}
        </ul>
      )}
    </li>
  );
}

SideNavItem.displayName = "SideNavItem";
