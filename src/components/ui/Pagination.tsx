/**
 * PAGINATION COMPONENT
 *
 * Page picker for long, paged collections (tables, search results, logs).
 * A `<nav>` landmark with prev/next arrows (1-bit ArrowLeft/ArrowRight),
 * boundary pages, sibling pages around the current one, and an ellipsis
 * wherever a gap is skipped.
 *
 * SIZING: the visible plate follows the Button scale (`h-control-sm|md|lg`,
 * 32 / 40 / 48px) while every button's hit area stays at least
 * `touch.target` (44px). The button element is the full hit area and the
 * plate is an inner span, because the plate clip-path would also clip any
 * enlarged hit area drawn on the button itself.
 *
 * STATES: the current page is the primary plate (fill, not color alone) and
 * carries `aria-current="page"`. Prev/next disable at the ends.
 *
 * TOKENS USED:
 * - button.primary.background / text (current page)
 * - button.ghost.background / background-hover / text (other pages)
 * - control.height.sm/md/lg (plate), touch.target (hit area)
 * - plate.round, focus inset ring, duration.fast
 */

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ControlSize } from "@/lib/size";
import { TuiIcon, type TuiIconSize } from "./TuiIcon";

/** A page number, or a skipped gap rendered as an ellipsis. */
export type PaginationRangeItem = number | "ellipsis-start" | "ellipsis-end";

const range = (start: number, end: number) =>
  end < start ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i);

/**
 * Computes the visible page list: `boundaryCount` pages at each end,
 * `siblingCount` pages on each side of `page`, and ellipsis markers for gaps.
 * The list length stays constant while paging so the control never jumps.
 * Exported for custom renderers and tests.
 */
export function getPaginationRange(
  page: number,
  pageCount: number,
  siblingCount = 1,
  boundaryCount = 1
): PaginationRangeItem[] {
  if (pageCount <= 0) return [];
  const current = Math.min(Math.max(1, page), pageCount);
  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);

  const siblingsStart = Math.max(
    Math.min(current - siblingCount, pageCount - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  );
  const siblingsEnd = Math.min(
    Math.max(current + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length > 0 ? endPages[0] - 2 : pageCount - 1
  );

  const items: PaginationRangeItem[] = [...startPages];

  if (siblingsStart > boundaryCount + 2) {
    items.push("ellipsis-start");
  } else if (boundaryCount + 1 < pageCount - boundaryCount) {
    items.push(boundaryCount + 1);
  }

  items.push(...range(siblingsStart, siblingsEnd));

  if (siblingsEnd < pageCount - boundaryCount - 1) {
    items.push("ellipsis-end");
  } else if (pageCount - boundaryCount > boundaryCount) {
    items.push(pageCount - boundaryCount);
  }

  items.push(...endPages);

  // Small counts can produce duplicates / out-of-range entries; normalize.
  const seen = new Set<PaginationRangeItem>();
  return items.filter((it) => {
    if (typeof it === "number" && (it < 1 || it > pageCount)) return false;
    if (seen.has(it)) return false;
    seen.add(it);
    return true;
  });
}

export interface PaginationProps {
  /** Current page, 1-based (controlled). Pair with `onPageChange`. */
  page?: number;
  /** Starting page when uncontrolled (default 1). */
  defaultPage?: number;
  /** Total number of pages. Renders nothing when 0. */
  pageCount: number;
  /** Fires with the requested 1-based page when the user picks a page or steps prev/next. */
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current page (default 1). */
  siblingCount?: number;
  /** Pages always shown at the start and end (default 1). */
  boundaryCount?: number;
  /** Plate height from the Button scale: sm 32px, md 40px (default), lg 48px. Hit areas stay 44px or more. */
  size?: ControlSize;
  /** Show the previous/next arrow buttons (default true). */
  showPrevNext?: boolean;
  /** Accessible name of each page button (default "Page 3"). */
  getPageLabel?: (page: number) => string;
  /** Accessible name of the previous button (default "Previous page"). */
  previousLabel?: string;
  /** Accessible name of the next button (default "Next page"). */
  nextLabel?: string;
  /** Accessible name of the nav landmark (default "Pagination"). */
  "aria-label"?: string;
  /** Extra classes for the `<nav>`. */
  className?: string;
}

const PLATE_SIZE: Record<ControlSize, string> = {
  sm: "h-control-sm min-w-control-sm px-2 text-sm",
  md: "h-control-md min-w-control-md px-2.5 text-sm",
  lg: "h-control-lg min-w-control-lg px-3 text-base",
};

const HIT_SIZE: Record<ControlSize, string> = {
  sm: "min-h-touch min-w-touch",
  md: "min-h-touch min-w-touch",
  lg: "min-h-control-lg min-w-control-lg",
};

const ICON_SIZE: Record<ControlSize, TuiIconSize> = { sm: "4", md: "4", lg: "5" };

function PageButton({
  size,
  current = false,
  disabled = false,
  label,
  onClick,
  children,
}: {
  size: ControlSize;
  current?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center justify-center font-mono focus:outline-none",
        HIT_SIZE[size],
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "plate-round inline-flex items-center justify-center tabular-nums",
          "transition-colors [transition-duration:var(--duration-fast)] motion-reduce:transition-none",
          "group-focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]",
          PLATE_SIZE[size],
          current
            ? "bg-[var(--button-primary-background)] text-[var(--button-primary-text)]"
            : cn(
                "bg-[var(--button-ghost-background)] text-[var(--button-ghost-text)]",
                !disabled && "group-hover:bg-[var(--button-ghost-background-hover)]"
              )
        )}
      >
        {children}
      </span>
    </button>
  );
}

/**
 * Pagination
 *
 * ```tsx
 * const [page, setPage] = useState(1);
 * <Pagination page={page} pageCount={20} onPageChange={setPage} />
 * ```
 */
export function Pagination({
  page: pageProp,
  defaultPage = 1,
  pageCount,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  size = "md",
  showPrevNext = true,
  getPageLabel = (p) => `Page ${p}`,
  previousLabel = "Previous page",
  nextLabel = "Next page",
  "aria-label": ariaLabel = "Pagination",
  className,
}: PaginationProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultPage);
  const isControlled = pageProp !== undefined;
  const rawPage = isControlled ? (pageProp as number) : uncontrolled;
  const page = Math.min(Math.max(1, rawPage), Math.max(1, pageCount));

  if (pageCount <= 0) return null;

  const go = (next: number) => {
    const clamped = Math.min(Math.max(1, next), pageCount);
    if (clamped === page) return;
    if (!isControlled) setUncontrolled(clamped);
    onPageChange?.(clamped);
  };

  const items = getPaginationRange(page, pageCount, siblingCount, boundaryCount);

  return (
    <nav aria-label={ariaLabel} className={cn("font-mono", className)}>
      <ul className="flex flex-wrap items-center">
        {showPrevNext && (
          <li>
            <PageButton size={size} label={previousLabel} disabled={page <= 1} onClick={() => go(page - 1)}>
              <TuiIcon name="ArrowLeft" size={ICON_SIZE[size]} />
            </PageButton>
          </li>
        )}
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <PageButton
                size={size}
                current={item === page}
                label={getPageLabel(item)}
                onClick={() => go(item)}
              >
                {item}
              </PageButton>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className={cn(
                "inline-flex items-center justify-center text-[var(--text-secondary)]",
                HIT_SIZE[size],
                size === "lg" ? "text-base" : "text-sm"
              )}
            >
              ...
            </li>
          )
        )}
        {showPrevNext && (
          <li>
            <PageButton size={size} label={nextLabel} disabled={page >= pageCount} onClick={() => go(page + 1)}>
              <TuiIcon name="ArrowRight" size={ICON_SIZE[size]} />
            </PageButton>
          </li>
        )}
      </ul>
    </nav>
  );
}

Pagination.displayName = "Pagination";
