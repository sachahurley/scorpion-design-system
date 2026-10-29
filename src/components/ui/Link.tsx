/**
 * LINK COMPONENT
 *
 * Inline text link for navigation. Always renders a real anchor (or a custom
 * router link via `as`), never a button: links navigate, buttons act. Use
 * `Button` with `href` for plate-shaped link CTAs; use `Link` inside prose,
 * captions, and nav lists.
 *
 * VARIANTS:
 * - inline (default): persistent underline, the safe treatment inside body
 *   text (color is never the sole indicator of a link)
 * - quiet: underline only on hover/focus, for nav lists and footers where
 *   position already signals the link
 *
 * There is no disabled state by design: a link with no destination is just
 * text, so render text instead.
 *
 * TOKENS USED:
 * - accent: resting link color ("Brand accent: links, active nav" per the
 *   token docs; also what ListRow interactive titles use, and what theme
 *   eggs override at runtime). text.link's rest value predates the merged
 *   identity and is NOT used here.
 * - text.link-hover: hover color (darkens in light, brightens in dark)
 * - focus.ring.primary + --focus-ring-width/--focus-ring-offset: outside
 *   outline (links are not plate-clipped, so outside outlines are safe;
 *   buttons need inset rings because the clip slices them off)
 * - duration.fast: hover color transition
 */

import { forwardRef, type AnchorHTMLAttributes, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TuiIcon } from "./TuiIcon";

type CommonProps = {
  /**
   * Visual treatment. `inline` (default) keeps a persistent underline so the
   * link reads inside body text without relying on color alone; `quiet`
   * underlines only on hover/focus, for nav lists and footers where position
   * already signals the link.
   */
  variant?: "inline" | "quiet";
  /**
   * Marks an external destination: opens in a new tab (`target="_blank"`,
   * `rel="noopener noreferrer"`, both overridable), appends the ExternalLink
   * glyph, and announces "(opens in new tab)" to screen readers. Behaves the
   * same in the `as` form: the new-tab attributes are passed to the custom
   * component (router links forward them to the anchor they render), and
   * anything in `asProps` overrides them.
   */
  external?: boolean;
  /** Additional CSS classes (size, margin, color overrides). */
  className?: string;
  /** Link text. Keep it descriptive of the destination; avoid bare "here". */
  children: ReactNode;
};

export type LinkProps = CommonProps &
  (
    | ({
        /** Destination URL. Renders a plain `<a href>`; use `as` instead for a router link. */
        href: string;
        as?: never;
        asProps?: never;
      } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">)
    | {
        /**
         * Custom link component (e.g. a router `<Link>`), rendered with identical
         * styling so client-side navigation works without a full page load.
         */
        as: ElementType;
        /**
         * Props for the `as` component (`to`, `state`, ...), spread onto it as-is and
         * winning over the `external` new-tab defaults. They are spread untyped: TypeScript does not check them against the `as` component's own props, so a misspelt `to` is not caught at compile time.
         */
        asProps?: Record<string, unknown>;
        href?: never;
      }
  );

/**
 * Text navigation, inline in prose or quiet in chrome; external links open a new tab and say so.
 *
 * Renders an `<a href>` by default, or a custom component via `as`/`asProps`
 * (mirrors the `ListRow` polymorphism, so router links work the same way in
 * both).
 *
 * @param variant - "inline" (persistent underline, default) or "quiet"
 * @param external - Open in a new tab with the external glyph and SR notice
 * @param children - Descriptive link text
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { variant = "inline", external = false, className = "", children, ...rest },
  ref
) {
  const classes = cn(
    "font-mono text-[var(--accent)] transition-colors [transition-duration:var(--duration-fast)] hover:text-[var(--text-link-hover)]",
    "focus:outline-none focus-visible:[outline:var(--focus-ring-width)_solid_var(--focus-ring-primary)] focus-visible:[outline-offset:var(--focus-ring-offset)]",
    variant === "inline"
      ? "underline underline-offset-2"
      : "no-underline hover:underline focus-visible:underline",
    className
  );

  const content = (
    <>
      {children}
      {external && (
        <>
          <TuiIcon name="ExternalLink" size="3" className="ml-1" />
          <span className="sr-only"> (opens in new tab)</span>
        </>
      )}
    </>
  );

  if ("as" in rest && rest.as) {
    const { as: As, asProps } = rest as { as: ElementType; asProps?: Record<string, unknown> };
    // `external` means the same thing in both forms: the glyph, the screen
    // reader notice AND the new-tab attributes. Router links forward unknown
    // props to their underlying anchor, so target/rel land on the real <a>.
    // `asProps` still wins, so a consumer can opt out per link.
    const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : undefined;
    return (
      <As ref={ref} className={classes} {...externalProps} {...asProps}>
        {content}
      </As>
    );
  }

  const { href, target, rel, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };
  return (
    <a
      ref={ref}
      href={href}
      className={classes}
      target={external ? (target ?? "_blank") : target}
      rel={external ? (rel ?? "noopener noreferrer") : rel}
      {...anchorRest}
    >
      {content}
    </a>
  );
});

Link.displayName = "Link";
