/**
 * BREADCRUMBS COMPONENT
 *
 * Shows where the current page sits in a hierarchy: a `<nav>` landmark
 * wrapping an ordered list of links, ending on the current page. Separators
 * are the 1-bit ChevronRight icon (hidden from assistive tech, the list
 * semantics already convey order).
 *
 * COLLAPSE: when `maxItems` is set and the trail is longer, the middle
 * items fold into a single overflow button. Activating it expands the trail
 * in place and moves focus to the first revealed link, so keyboard users
 * never lose their position.
 *
 * ROUTING: each item renders through `Link` (variant "quiet"), so an item
 * can be a plain `href` or a router link via `as` / `asProps`, the same
 * polymorphism Link and ListRow use.
 *
 * TOKENS USED:
 * - accent / text.link-hover (via Link), text.primary (current page)
 * - text.secondary (separators), surface.muted (overflow hover fill)
 * - plate.round (overflow button silhouette), focus inset ring
 * - touch.target (44px hit areas on links and the overflow button)
 */

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Link } from "./Link";
import { TuiIcon } from "./TuiIcon";

/** One step in the trail. The last item is always treated as the current page. */
export interface BreadcrumbItem {
  /** Visible text for this step. Keep it short; long labels truncate. */
  label: ReactNode;
  /** Destination for ancestor steps. Ignored on the last (current) item. */
  href?: string;
  /**
   * Custom link component (e.g. a router `<Link>`) used instead of `<a href>`.
   * Its props go in `asProps` (`to`, `state`, ...).
   */
  as?: ElementType;
  /**
   * Props for the `as` component (`to`, `state`, ...), spread onto it as-is. They are spread untyped: TypeScript does not check them against the `as` component's own props, so a misspelt `to` is not caught at compile time.
   */
  asProps?: Record<string, unknown>;
  /** Stable React key. Defaults to the index. */
  key?: string;
}

export interface BreadcrumbsProps {
  /** Trail from the root to the current page (last item = current page). */
  items: BreadcrumbItem[];
  /**
   * Collapse the middle of the trail once it has more than this many items.
   * Leave unset to always show every item.
   */
  maxItems?: number;
  /** Items kept visible before the overflow button when collapsed (default 1). */
  itemsBeforeCollapse?: number;
  /** Items kept visible after the overflow button when collapsed (default 1). */
  itemsAfterCollapse?: number;
  /**
   * Accessible name for the overflow button; receives the hidden count.
   * Default: "Show 3 more breadcrumbs".
   */
  expandLabel?: (hiddenCount: number) => string;
  /** Accessible name of the nav landmark (default "Breadcrumb"). */
  "aria-label"?: string;
  /** Extra classes for the `<nav>`. */
  className?: string;
}

const FOCUS_INSET =
  "focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]";

/**
 * Breadcrumbs
 *
 * ```tsx
 * <Breadcrumbs
 *   maxItems={4}
 *   items={[
 *     { label: "Home", href: "/" },
 *     { label: "Projects", href: "/projects" },
 *     { label: "Scorp DS" },
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({
  items,
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 1,
  expandLabel = (n) => `Show ${n} more breadcrumb${n === 1 ? "" : "s"}`,
  "aria-label": ariaLabel = "Breadcrumb",
  className,
}: BreadcrumbsProps) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const focusIndexRef = useRef<number | null>(null);

  const before = Math.max(0, itemsBeforeCollapse);
  const after = Math.max(1, itemsAfterCollapse);
  const shouldCollapse =
    !expanded && maxItems != null && items.length > maxItems && items.length > before + after;
  const hiddenCount = shouldCollapse ? items.length - before - after : 0;

  // After expanding, move focus to the first item that was hidden.
  useEffect(() => {
    if (!expanded || focusIndexRef.current == null) return;
    const target = listRef.current?.querySelector<HTMLElement>(
      `[data-crumb-index="${focusIndexRef.current}"] a, [data-crumb-index="${focusIndexRef.current}"] [data-crumb-link]`
    );
    target?.focus();
    focusIndexRef.current = null;
  }, [expanded]);

  const lastIndex = items.length - 1;

  const renderItem = (item: BreadcrumbItem, index: number, showSeparator: boolean) => {
    const isCurrent = index === lastIndex;
    return (
      <li
        key={item.key ?? index}
        data-crumb-index={index}
        className="inline-flex min-w-0 items-center"
      >
        {showSeparator && (
          <TuiIcon name="ChevronRight" size="3" className="mx-1 shrink-0 text-[var(--text-secondary)]" />
        )}
        {isCurrent ? (
          <span
            aria-current="page"
            className="inline-flex min-h-touch min-w-0 items-center truncate px-1 text-[var(--text-primary)]"
          >
            {item.label}
          </span>
        ) : item.as ? (
          <Link
            variant="quiet"
            as={item.as}
            asProps={{ ...item.asProps, "data-crumb-link": "" }}
            className="inline-flex min-h-touch min-w-0 items-center truncate px-1"
          >
            {item.label}
          </Link>
        ) : (
          <Link
            variant="quiet"
            href={item.href ?? "#"}
            className="inline-flex min-h-touch min-w-0 items-center truncate px-1"
          >
            {item.label}
          </Link>
        )}
      </li>
    );
  };

  let content: ReactNode;
  if (shouldCollapse) {
    const head = items.slice(0, before);
    const tail = items.slice(items.length - after);
    content = (
      <>
        {head.map((item, i) => renderItem(item, i, i > 0))}
        <li className="inline-flex items-center">
          {before > 0 && (
            <TuiIcon name="ChevronRight" size="3" className="mx-1 shrink-0 text-[var(--text-secondary)]" />
          )}
          <button
            type="button"
            aria-label={expandLabel(hiddenCount)}
            onClick={() => {
              focusIndexRef.current = before;
              setExpanded(true);
            }}
            className={cn(
              "plate-round inline-flex h-touch min-w-touch items-center justify-center px-2 text-[var(--text-primary)]",
              "transition-colors [transition-duration:var(--duration-fast)] motion-reduce:transition-none hover:bg-[var(--surface-muted)]",
              FOCUS_INSET
            )}
          >
            <span aria-hidden="true">...</span>
          </button>
        </li>
        {tail.map((item, i) => renderItem(item, items.length - after + i, true))}
      </>
    );
  } else {
    content = items.map((item, i) => renderItem(item, i, i > 0));
  }

  return (
    <nav aria-label={ariaLabel} className={cn("font-mono text-sm", className)}>
      <ol ref={listRef} className="flex min-w-0 flex-wrap items-center">
        {content}
      </ol>
    </nav>
  );
}

Breadcrumbs.displayName = "Breadcrumbs";
