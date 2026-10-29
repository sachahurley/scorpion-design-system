/**
 * BUTTON COMPONENT
 * 
 * Reusable button component with multiple variants and sizes
 * Built entirely from design tokens defined in tokens.json
 * 
 * VARIANTS (fills from semantic CSS variables in tokens.css — theme switches via `.dark`):
 * - primary: gold CTA fill · secondary: the quiet plate that flips to gold on hover
 * - ghost / outline / destructive / link: same semantic layer
 * - icon: square plate using `--button-icon-*` (background, hover, text, disabled)
 *
 * SHAPE: every button is clipped to the plate silhouette (--plate-round, stepped
 * one-bit corners). The clip swallows outside focus outlines, so focus renders as
 * an INSET ring (box-shadow) using the --focus-ring-* tokens. The outline variant
 * uses the ring recipe (element = border color clipped, ::before = opaque fill
 * clipped 1px inset) so its border walks the stepped corners like every other
 * bordered plate; its fill is the page surface, not transparent.
 * 
 * SIZES: All defined in tokens.json
 * - sm: 32px height
 * - md: 40px height (default)
 * - lg: 48px height
 * Icon-only buttons are detected automatically and squared at every size.
 *
 * ICON-ONLY BUTTONS: `variant` picks the look, `size` picks the dimension.
 * `variant="icon"` is the dedicated icon plate (`--button-icon-*`); any other
 * variant with only an icon child is also squared.
 *
 * LINK VARIANT vs `Link`: `variant="link"` is a BUTTON that looks like text,
 * for in-place actions ("Forgot password?", "Show more"). For navigation to
 * another page, use the `Link` component so it has anchor semantics.
 */

import { forwardRef, useEffect, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent } from "react";
import type { ControlSize } from "@/lib/size";
import { Spinner } from "./Spinner";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

/** Props every Button takes, whether it renders a `<button>` or an `<a>`. */
// React's HTML attributes carry an RDFa `rel`; it is omitted so the link and
// button forms below own `rel` outright.
interface ButtonBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "rel"> {
  /**
   * Visual style (default: "primary"). One primary per view; "link" is an
   * action styled as text (navigate with `Link` instead); "icon" is the
   * square icon plate, pair it with `aria-label`.
   */
  variant?: "primary" | "secondary" | "ghost" | "link" | "outline" | "destructive" | "icon";
  /**
   * Height: sm 32px, md 40px (default), lg 48px, from the control-height
   * tokens. Icon-only buttons are squared automatically.
   */
  size?: ControlSize;
  /** Disables the button (anchors drop `href` and set `aria-disabled`). */
  disabled?: boolean;
  /**
   * Icon before the label, usually a `TuiIcon`, to make the action quicker to
   * recognise ("+ New"). For an icon-only button, pass the icon as `children`
   * instead (the button squares itself) and give it an `aria-label`. Takes a TuiIcon name (`"Check"`) or an element.
   */
  iconLeft?: IconSlot | React.ReactNode;
  /**
   * Icon after the label, for direction or destination (an arrow on "Next", an
   * external-link glyph on a link CTA). Takes a TuiIcon name (`"Check"`) or an element.
   */
  iconRight?: IconSlot | React.ReactNode;
  /**
   * Busy state for async actions (submitting, saving). Shows a Spinner over
   * the label, sets `aria-busy` and `aria-disabled`, and ignores clicks. The
   * button stays focusable (no native `disabled`, so focus isn't dropped
   * mid-submit) and keeps its width: the label is hidden in place, not
   * removed. Works for icon-only buttons too. `disabled` wins over `loading`.
   */
  loading?: boolean;
}

/** The link form: `href` turns the button into an `<a>`, and only then do `target` and `rel` apply. */
interface ButtonLinkProps {
  /**
   * Render as an `<a>` with this destination instead of a `<button>`: same
   * plate styling for link CTAs ("view project ↗"). Disabled anchors drop the
   * href and set `aria-disabled`.
   */
  href: string;
  /** Anchor target, e.g. "_blank". Only accepted together with `href`. */
  target?: string;
  /** Anchor rel; pair `target="_blank"` with "noopener noreferrer". Only accepted together with `href`. */
  rel?: string;
}

/** The button form: no `target` or `rel`, since they mean nothing without `href`. */
interface ButtonActionProps {
  /** A destination that may be undefined: a defined value still renders an `<a>`. To pass `target` or `rel`, `href` must be a definite string. */
  href?: string;
  /** Not accepted without `href`: an anchor target means nothing on a `<button>`. */
  target?: never;
  /** Not accepted without `href`: an anchor rel means nothing on a `<button>`. */
  rel?: never;
}

/**
 * Button props. `target` and `rel` type-check only alongside a string `href`
 * (the link form); everything else is shared by both forms.
 */
export type ButtonProps = ButtonBaseProps & (ButtonLinkProps | ButtonActionProps);

/**
 * The control for triggering an action, or for navigating when given `href`; pick the `variant` by the action's weight on the page.
 * 
 * @param variant - Button style variant (default: "primary")
 * @param size - Button size (default: "md")
 * @param disabled - Whether button is disabled
 * @param className - Additional CSS classes to apply
 * @param children - Button content (text, icons, etc.)
 * @param iconLeft - Icon element to display on the left side of text
 * @param iconRight - Icon element to display on the right side of text
 * @param loading - Busy state: Spinner over the label, clicks ignored, stays focusable
 *
 * Icon-only usage: pass `aria-label` or `aria-labelledby` (standard button attributes) so assistive tech has an accessible name.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      variant = "primary", 
      size = "md", 
      disabled = false, 
      className = "", 
      children,
      iconLeft,
      iconRight,
      href,
      target,
      rel,
      loading = false,
      onClick,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props 
    },
    ref
  ) => {
    // BASE STYLES - Applied to all buttons
    // Uses tokens: font.size.sm (14px)
    // Border radius is size-specific (see sizeStyles)
    const baseStyles = `
      inline-flex items-center justify-center
      font-mono text-sm
      transition-colors [transition-duration:var(--duration-fast)]
      cursor-pointer
      disabled:cursor-not-allowed disabled:opacity-50
      focus:outline-none
      focus-visible:![box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--btn-ring)]
    `;

    // Helper function to check if button is icon-only (no text label)
    // Icon-only buttons should be square (no padding) regardless of variant
    const isIconOnly = () => {
      // If variant is "icon", it's always icon-only
      if (variant === "icon") return true;
      
      // If no children, it's not icon-only (empty button)
      if (!children) return false;
      
      // Check if children is a single React element (likely an icon)
      // If children is a string or number, it's text (not icon-only)
      if (typeof children === 'string' || typeof children === 'number') return false;
      
      // If children is an object with a 'type' property, it's likely a React element (icon)
      if (typeof children === 'object' && children !== null && 'type' in children) {
        // Check if it's a React element (not an array or fragment)
        return typeof (children as any).type !== 'undefined';
      }
      
      // If children is an array, check if all elements are React elements (icons)
      if (Array.isArray(children)) {
        return children.every(child => 
          typeof child === 'object' && child !== null && 'type' in child
        );
      }
      
      return false;
    };

    useEffect(() => {
      if (import.meta.env.PROD) return;
      const iconOnly = variant === "icon" || isIconOnly();
      if (!iconOnly) return;
      const named =
        (ariaLabel != null && String(ariaLabel).trim() !== "") ||
        (ariaLabelledBy != null && String(ariaLabelledBy).trim() !== "");
      if (!named) {
        console.warn(
          "[@scorp-ds/components] Button: icon-only buttons should include aria-label or aria-labelledby for screen readers."
        );
      }
    }, [variant, size, children, iconLeft, iconRight, ariaLabel, ariaLabelledBy]);

    // SIZE STYLES - All values from tokens.json
    // Small: 32px height, 16px horizontal padding
    // Medium: 40px height, 20px horizontal padding
    // Large: 48px height, 24px horizontal padding
    // Corners: plate silhouette (--plate-round) is the shape language; radius tokens are retired
    // Icon-only buttons: Square buttons matching size dimensions (no padding, uses flex centering)
    // Function to get size styles based on variant and whether button is icon-only
    const getSizeStyles = () => {
      const iconOnly = isIconOnly();
      
      // For icon-only buttons (any variant), use square dimensions matching the size
      // TUI: all corners sharp (plate-round)
      if (iconOnly || variant === "icon") {
        switch (size) {
          case "sm":
            return "size-control-sm plate-round";
          case "lg":
            return "size-control-lg plate-round";
          default: // medium
            return "size-control-md plate-round";
        }
      }
      
      // For regular buttons with labels, use standard size styles
      // TUI: all corners sharp (plate-round)
      switch (size) {
        case "sm":
          return "h-control-sm px-4 py-1.5 plate-round";
        case "lg":
          return "h-control-lg px-6 py-3.5 plate-round";
        default: // medium
          return "h-control-md px-5 py-2.5 plate-round";
      }
    };

    // VARIANT STYLES — semantic CSS variables from @scorp-ds/tokens (theme = :root / .dark)
    const variantStyles = {
      primary: `
        bg-[var(--button-primary-background)] hover:bg-[var(--button-primary-background-hover)] active:brightness-95
        text-[var(--button-primary-text)]
      `,

      secondary: `
        bg-[var(--button-secondary-background)] hover:bg-[var(--button-secondary-background-hover)] active:brightness-95
        text-[var(--button-secondary-text)] hover:text-[var(--button-secondary-text-hover)]
      `,

      ghost: `
        bg-[var(--button-ghost-background)] hover:bg-[var(--button-ghost-background-hover)] active:brightness-95
        text-[var(--button-ghost-text)]
      `,

      link: `
        bg-transparent hover:underline
        text-[var(--button-link-text)] hover:text-[var(--button-link-text-hover)]
      `,

      outline: `
        relative isolate
        bg-[var(--button-outline-border)]
        text-[var(--button-outline-text)]
        before:content-[''] before:absolute before:inset-px before:-z-[1]
        before:[clip-path:var(--plate-round)]
        before:bg-[var(--button-outline-background)] hover:before:bg-[var(--button-outline-background-hover)]
        before:transition-colors before:[transition-duration:var(--duration-fast)]
        active:brightness-95
        focus-visible:before:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--btn-ring)]
      `,

      destructive: `
        bg-[var(--button-destructive-background)] hover:bg-[var(--button-destructive-background-hover)] active:brightness-95
        text-[var(--button-destructive-text)]
      `,

      icon: `
        bg-[var(--button-icon-background)] hover:bg-[var(--button-icon-background-hover)] active:brightness-95
        text-[var(--button-icon-text)]
        disabled:bg-[var(--button-icon-disabled-background)] disabled:text-[var(--button-icon-disabled-text)]
        disabled:opacity-100
      `,
    };

    // ICON SIZING - Icons scale with button size
    // Small: 16px, Medium: 20px, Large: 24px
    const iconSizeStyles = {
      sm: "w-4 h-4",    // 16px
      md: "w-5 h-5",   // 20px
      lg: "w-6 h-6",    // 24px
    };

    // GAP SPACING - Space between icon and text
    // Intentional variation: Smaller gaps for smaller buttons maintain visual balance
    // Small: 6px (gap-1.5) - tighter spacing for compact buttons
    // Medium: 8px (gap-2) - standard spacing for most use cases
    // Large: 10px (gap-2.5) - slightly more breathing room for larger buttons
    const gapStyles = {
      sm: "gap-1.5",    // 6px - tighter for visual balance in compact buttons
      md: "gap-2",     // 8px - standard spacing
      lg: "gap-2.5",    // 10px - more breathing room for larger buttons
    };

    // Helper function to wrap icons with proper sizing classes
    // This ensures icons are perfectly centered and aligned with text
    const renderIcon = (slot: React.ReactNode) => {
      if (!slot) return null;
      // A TuiIcon name becomes the icon element, then gets the same sizing box.
      const icon = renderIconSlot(slot);
      
      // If it's a React element, clone it with size classes
      if (typeof icon === 'object' && icon !== null && 'type' in icon) {
        return (
          <span className={`inline-flex items-center justify-center shrink-0 ${iconSizeStyles[size]}`}>
            {icon}
          </span>
        );
      }
      
      // Otherwise just render it as-is
      return icon;
    };

    // Helper function to wrap children with icon sizing when button is icon-only
    // For icon-only buttons, children should be icons and need consistent sizing based on button size
    // Icon sizes match buttons with labels: small=16px, medium=20px, large=24px
    const renderChildren = () => {
      const iconOnly = isIconOnly();
      
      // If this is an icon-only button (any variant), wrap children with icon size classes
      if (iconOnly && children) {
        // Check if children is a single React element (icon)
        if (typeof children === 'object' && children !== null && 'type' in children) {
          return (
            <span className={`inline-flex items-center justify-center shrink-0 ${iconSizeStyles[size]}`}>
              {children}
            </span>
          );
        }
        // If children is already wrapped or contains multiple elements, wrap the whole thing
        return (
          <span className={`inline-flex items-center justify-center shrink-0 ${iconSizeStyles[size]}`}>
            {children}
          </span>
        );
      }
      
      // For regular buttons, render children as-is
      return children;
    };

    // Focus ring color — semantic tokens (values swap under .dark in tokens.css)
    const focusRingStyles = {
      '--btn-ring':
        variant === 'primary' || variant === 'link'
          ? 'var(--focus-ring-primary)'
          : variant === 'destructive'
            ? 'var(--focus-ring-destructive)'
            : variant === 'icon'
              ? 'var(--focus-ring-icon)'
              : 'var(--focus-ring-secondary)',
      outline: 'none',
    } as CSSProperties;

    // LOADING: busy, not disabled. The click is swallowed (preventDefault also
    // stops a submit button from submitting its form again) while focus stays
    // put. Disabled wins over loading.
    const busy = loading && !disabled;
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (busy) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };
    const busyStyles = busy ? "relative cursor-progress" : "";

    // Content: while busy, the label stays in the layout (so the width holds)
    // at opacity 0 (so it stays in the accessible name), and the Spinner is
    // overlaid in the center. The overlay is aria-hidden: aria-busy on the
    // button carries the state, the label carries the name.
    const content = (
      <>
        {iconLeft && renderIcon(iconLeft)}
        {renderChildren()}
        {iconRight && renderIcon(iconRight)}
      </>
    );
    const body = busy ? (
      <>
        <span className={`inline-flex items-center justify-center opacity-0 ${gapStyles[size]}`}>{content}</span>
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <Spinner size={size} />
        </span>
      </>
    ) : (
      content
    );

    // Anchor rendering: same classes and focus ring, real link semantics.
    if (href) {
      return (
        <a
          ref={ref as unknown as React.Ref<HTMLAnchorElement>}
          href={disabled ? undefined : href}
          target={target}
          rel={rel}
          aria-disabled={disabled || busy || undefined}
          aria-busy={busy || undefined}
          className={`${baseStyles} ${getSizeStyles()} ${variantStyles[variant]} ${gapStyles[size]} ${busyStyles} no-underline ${
            disabled ? "pointer-events-none opacity-50" : ""
          } ${className}`}
          style={focusRingStyles}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          onClick={handleClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
          {...(props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {body}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${getSizeStyles()} ${variantStyles[variant]} ${gapStyles[size]} ${busyStyles} ${className}`}
        style={focusRingStyles}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
        onClick={handleClick}
        {...props}
      >
        {body}
      </button>
    );
  }
);

// Set display name for debugging
Button.displayName = "Button";

