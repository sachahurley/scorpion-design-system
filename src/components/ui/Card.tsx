/**
 * CARD COMPONENT
 * 
 * Reusable card component with header, content, and footer sections
 * Built using design tokens for consistent styling
 * 
 * Features:
 * - Optional header with title and subtitle
 * - Flexible content area
 * - Optional footer for actions
 * - Consistent spacing and styling
 * - `layout="flex"` turns the card into a flex column so the content section
 *   fills a fixed height and the footer pins to the bottom
 *
 * TOKENS: section rules are drawn at `--border-width-hairline` (1px), the
 * system's single rule weight.
 */

import { type ReactNode } from "react";

/** How the card distributes its sections vertically. */
export type CardLayout = "block" | "flex";

export interface CardProps {
  // Header content
  /** Card title, rendered as the header heading. */
  title?: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Custom header node; replaces `title` / `subtitle` when set. */
  headerContent?: ReactNode;

  // Main content
  /** Main card content. */
  children: ReactNode;

  // Footer content
  /** Footer node (buttons, links) behind a hairline rule. */
  footerContent?: ReactNode;

  // Styling
  /**
   * Section layout. `block` (default) lets the card grow with its content.
   * `flex` makes the card a flex column whose content section fills the
   * remaining height, so a fixed-height card can pin its footer to the
   * bottom. Prefer this over the legacy `className` sniff below.
   */
  layout?: CardLayout;
  /** Additional CSS classes (width, height, margin). */
  className?: string;
}

/** Matches a standalone `flex` class, not `inline-flex` / `flex-1` / `flex-wrap`. */
const BARE_FLEX_CLASS = /(?:^|\s)flex(?:\s|$)/;

/**
 * Groups related content on a raised surface, with an optional header (title and subtitle) and a footer for actions.
 *
 * @param title - Card title (shown in header)
 * @param subtitle - Card subtitle/description (shown below title)
 * @param headerContent - Custom header content (overrides title/subtitle if provided)
 * @param children - Main card content
 * @param footerContent - Footer content (buttons, links, etc.)
 * @param layout - "block" (default) or "flex" (content section fills the height)
 * @param className - Additional CSS classes
 */
export function Card({
  title,
  subtitle,
  headerContent,
  children,
  footerContent,
  layout,
  className = "",
}: CardProps) {
  // LAYOUT: `layout` is the supported switch. With no `layout` the card falls
  // back to the legacy behaviour for compatibility, but only for a standalone
  // `flex` class: the old `className.includes('flex')` test also fired on
  // `inline-flex`, `flex-1` and `flex-wrap`, silently turning plain cards into
  // flex columns. Pass `layout="flex"` in new code.
  const isFlexLayout = layout ? layout === "flex" : BARE_FLEX_CLASS.test(className);

  // PLATE RING RECIPE — outer layer is the stroke clipped to the large plate,
  // inner layer is the card fill clipped 1px inset. Note: the clip bounds any
  // overflowing children (menus should render outside the card or via portals).
  return (
    <div
      className={`
        plate-round-lg p-px bg-[var(--surface-container-stroke)]
        ${isFlexLayout ? 'flex flex-col' : ''}
        ${className}
      `}
    >
    <div
      className={`
        plate-round-lg bg-[var(--surface-card)] h-full w-full
        ${isFlexLayout ? 'flex flex-col flex-1 min-h-0' : ''}
      `}
    >
      {/* Header Section — plain title + subtitle (box-drawing decoration retired with the TUI tier) */}
      {(title || subtitle || headerContent) && (
        <div className="p-4 lg:p-6 border-b-[length:var(--border-width-hairline)] border-solid border-[var(--surface-container-stroke)] overflow-hidden rounded-none">
          {headerContent ? (
            headerContent
          ) : (
            <div>
              {title && (
                <h3 className="text-base font-mono font-bold text-[var(--text-primary)] mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="font-mono text-sm text-secondary-800 dark:text-secondary-300">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className={`p-4 lg:p-6 ${isFlexLayout ? 'flex-1 flex flex-col min-h-0' : ''}`}>
        {children}
      </div>

      {/* Footer Section */}
      {footerContent && (
        <div className="p-4 lg:p-6 border-t-[length:var(--border-width-hairline)] border-solid border-[var(--surface-container-stroke)] overflow-hidden">
          {footerContent}
        </div>
      )}
    </div>
    </div>
  );
}

