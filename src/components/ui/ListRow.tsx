/**
 * LIST ROW COMPONENT
 *
 * The portfolio's plate row, promoted into the DS: the list/navigation tier
 * of the container system. A row is clipped to the small plate; the clip is
 * invisible until hover fills it (surface.muted), so resting lists stay
 * quiet. Interactive rows carry the accent on their title.
 *
 * Don't use this for: framed content panels (use Card) or tabular data
 * (use Table). Rows are for scannable lists and navigation.
 *
 * TOKENS USED:
 * - plate.round (silhouette), surface.muted (hover fill; `selected` holds it)
 * - accent (interactive title), text.primary; meta/description use the
 *   secondary scale in AA-passing theme pairs (700/600 and 800/500)
 * - duration.fast (hover), focus inset ring (clip swallows outside outlines)
 */

import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ElementType, type HTMLAttributes, type ReactNode } from "react";

type CommonProps = {
  /**
   * Small line above the title (date, category). Rendered one step darker
   * than text.tertiary (`secondary-700` in light, `secondary-600` in dark),
   * so it clears AA (6.13:1 / 5.34:1) at 14px; text.tertiary is 3.31:1 and
   * only safe for large or decorative text.
   */
  meta?: ReactNode;
  /**
   * Row title. Interactive rows (href/onClick) render it in the accent color.
   * Titles are single-line: anything longer than the row ellipsizes.
   */
  title: ReactNode;
  /** Supporting line below the title. */
  description?: ReactNode;
  /** Trailing affordance next to the title (e.g. an external-link glyph). */
  titleSuffix?: ReactNode;
  /**
   * Thumbnail slot beside the text (a sized <img> or framed node; the row
   * reserves the slot with flex-shrink: 0 and never scales it).
   */
  thumb?: ReactNode;
  /** Which side the thumbnail sits on (default "start"). */
  thumbPosition?: "start" | "end";
  /**
   * Marks the row as the current selection (the active nav route, the
   * chosen item): the row holds the hover state — surface.muted fill,
   * accent title — per the SideNavigation pattern (fill + color, never
   * color alone, never weight). Nav consumers should also pass
   * `aria-current="page"` so the state is announced.
   */
  selected?: boolean;
  /** Extra classes on the row element (padding overrides, a divider border between rows). */
  className?: string;
};

export type ListRowProps = CommonProps &
  (
    | ({
        /** Destination URL: the row renders as an `<a>` and navigates. */
        href: string;
        onClick?: never;
        as?: never;
      } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "title">)
    | ({
        /** In-place action: the row renders as a `<button>`. Use `href` instead to navigate. */
        onClick: () => void;
        href?: never;
        as?: never;
      } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "className" | "title">)
    | ({
        /**
         * Custom link component (e.g. a router `<Link>`): the row renders it with
         * interactive styling, so client-side navigation works without a full page load.
         */
        as: ElementType;
        /** Props for the `as` component (`to`, `state`, ...), spread onto it as-is. */
        asProps?: Record<string, unknown>;
        href?: never;
        onClick?: never;
      } & Omit<
        HTMLAttributes<HTMLElement>,
        "className" | "title"
      >)
    | ({ href?: never; onClick?: never; as?: never } & Omit<
        HTMLAttributes<HTMLDivElement>,
        "className" | "title"
      >)
  );

/**
 * One scannable line in a list of items (a post, a project, a setting), either interactive or display-only.
 *
 * Renders an `<a>` when `href` is set, a `<button>` when `onClick` is set,
 * and a plain `<div>` for display-only rows.
 *
 * Extra native attributes (`aria-*`, `id`, `data-*`) are forwarded in every
 * form, including display rows and the `as` form.
 *
 * @param meta - Small line above the title (date, category), in the AA-passing
 *               secondary pair (700 light / 600 dark), not text.tertiary
 * @param title - Row title; accent-colored when the row is interactive, and
 *                truncated with an ellipsis when it outgrows the row
 * @param description - Supporting copy under the title
 * @param titleSuffix - Trailing glyph beside the title (external-link arrows etc.)
 */
export const ListRow = forwardRef<HTMLElement, ListRowProps>(function ListRow(
  { meta, title, description, titleSuffix, thumb, thumbPosition = "start", selected = false, className = "", ...rest },
  ref
) {
  const asComponent = "as" in rest && rest.as ? (rest.as as ElementType) : null;
  const interactive =
    asComponent ? "as" : "href" in rest && rest.href != null ? "a" : "onClick" in rest && rest.onClick != null ? "button" : "div";

  const rowClasses = `
    block w-full text-left p-3 plate-round
    transition-colors [transition-duration:var(--duration-fast)]
    font-mono
    ${interactive !== "div" ? "cursor-pointer hover:bg-[var(--surface-muted)] focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]" : ""}
    ${selected ? "bg-[var(--surface-muted)]" : ""}
    ${className}
  `;

  const text = (
    <>
      {meta && <span className="block text-sm text-secondary-700 dark:text-secondary-600">{meta}</span>}
      {/* Titles are single-line and ellipsize: a row is a scannable line, and
          with a thumb the text column must shrink rather than push the image. */}
      <span
        className={`block truncate text-base leading-6 ${
          interactive !== "div" ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        }`}
      >
        {title}
        {titleSuffix && <span className="ml-2 leading-none">{titleSuffix}</span>}
      </span>
      {description && (
        <span className="mt-1 block text-sm leading-6 text-secondary-800 dark:text-secondary-500">{description}</span>
      )}
    </>
  );

  // With a thumbnail the row becomes a flex pair: fixed slot + shrinking
  // text column, so long titles ellipsize instead of pushing the image.
  const body = thumb ? (
    <span className={`flex items-start gap-4 ${thumbPosition === "end" ? "flex-row-reverse" : ""}`}>
      <span className="flex-shrink-0">{thumb}</span>
      <span className="block min-w-0 flex-1">{text}</span>
    </span>
  ) : (
    text
  );

  if (asComponent) {
    // Native attributes passed alongside `as` (aria-*, id, data-*) are
    // forwarded too; `asProps` wins so router-specific props can override.
    const { asProps, ...withAs } = rest as {
      as: ElementType;
      asProps?: Record<string, unknown>;
    } & HTMLAttributes<HTMLElement>;
    const asRest = { ...withAs } as Partial<{ as: ElementType }> & HTMLAttributes<HTMLElement>;
    delete asRest.as;
    const As = asComponent;
    return (
      <As ref={ref} className={rowClasses} {...asRest} {...asProps}>
        {body}
      </As>
    );
  }
  if (interactive === "a") {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={rowClasses} {...anchorRest}>
        {body}
      </a>
    );
  }
  if (interactive === "button") {
    const { onClick, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement> & { onClick: () => void };
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} type="button" onClick={onClick} className={rowClasses} {...(buttonRest as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {body}
      </button>
    );
  }
  // Display row: native attributes (aria-*, id, data-*) are forwarded, same as
  // the anchor and button forms.
  const divRest = rest as HTMLAttributes<HTMLDivElement>;
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={rowClasses} {...divRest}>
      {body}
    </div>
  );
});

ListRow.displayName = "ListRow";
