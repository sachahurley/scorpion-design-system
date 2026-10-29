/**
 * BADGE COMPONENT
 * 
 * Reusable badge/tag component for labels, status indicators, and counts
 * Built entirely from design tokens defined in tokens.json
 * 
 * TONES (decision 0024's colour roles, plus Badge's own primary and bone):
 * - neutral: Neutral gray badge
 * - primary: Amber/primary brand color
 * - success: Green for positive states
 * - warning: Purple for warnings
 * - error: Red for errors
 * - info: Blue for informational messages
 * - bone: filled sepia-500 chip, identical in both themes — the
 *   tier-neutral state marker for surfaces that must not ride the accent
 *   or re-theme (the portfolio's equipped/loot chips)
 * The deprecated `variant` prop still works; its `default` maps to `neutral`.
 * 
 * SIZES:
 * - sm: Compact badge (20px height)
 * - md: Standard badge (24px height, default)
 * - lg: Larger badge (28px height)
 * 
 * FEATURES:
 * - Optional remove button (onDismiss prop, named by dismissLabel)
 * - Icon support (iconLeft prop)
 * - caps: uppercase eyebrow voice (uppercase + .08em tracking) for state
 *   chips ("EQUIPPED", "LEVEL UP") without per-site className overrides
 * - dashed: the not-yet-real voice — transparent fill with a dashed
 *   hairline for placeholders, empty slots, and free tiers ("FREE").
 *   Composes with any tone; the dash rides the tone's text color,
 *   except bone whose dash stays theme-stable sepia-500.
 * - Full light/dark theme support
 */

import { type ReactNode } from "react";
import { TuiIcon } from "./TuiIcon";
import { resolveSize, type ControlSizeProp } from "@/lib/size";
import { warnDeprecated } from "@/lib/deprecate";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

/**
 * Colour role of a Badge: the five semantic roles plus Badge's own `primary`
 * (the brand accent) and `bone` (a fixed tint that never follows the theme).
 */
export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error" | "primary" | "bone";

export interface BadgeProps {
  /** Colour role. Pair a semantic role with text that says the same thing, since colour alone is not enough; `bone` is a fixed tint that never follows the theme. Default: "neutral". */
  tone?: BadgeTone;
  /**
   * Colour role under its old name; `default` maps to `neutral`. When both are set, `tone` wins.
   * @deprecated Use `tone`.
   */
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info" | "bone";
  /** Badge height: sm 20px, md 24px (default), lg 28px. Legacy names are deprecated aliases. */
  size?: ControlSizeProp;
  /** Uppercase eyebrow voice: uppercase text with .08em tracking. */
  caps?: boolean;
  /**
   * Not-yet-real voice: transparent fill with a 1px dashed border in the
   * tone's text color, for placeholders, empty slots, and free tiers.
   * Dashed chips drop the plate clip for sharp corners (the notched clip
   * would slice the dashes).
   */
  dashed?: boolean;
  /** The label: a word, a short phrase or a number. Keep it to one line. */
  children: ReactNode;
  /** Icon before the label, to reinforce the meaning of a status badge. Takes a TuiIcon name (`"Check"`) or an element. */
  iconLeft?: IconSlot | ReactNode;
  /** Adds a remove (x) button that calls this when pressed. Use it for filter chips and tags the user can clear. */
  onDismiss?: () => void;
  /**
   * Remove callback under its old name. When both are set, `onDismiss` wins.
   * @deprecated Use `onDismiss`.
   */
  onClose?: () => void;
  /**
   * Accessible name for the remove button. Defaults to `Remove {children}`
   * when the badge label is a plain string (so a list of filter chips reads as
   * "Remove Draft", "Remove Archived"), and to "Remove badge" otherwise. Pass
   * it explicitly whenever the label alone does not identify what is removed.
   */
  dismissLabel?: string;
  /**
   * Remove button name under its old name. When both are set, `dismissLabel` wins.
   * @deprecated Use `dismissLabel`.
   */
  onCloseLabel?: string;
  /** Extra classes on the badge (margin, alignment). */
  className?: string;
}

/**
 * A short status, category or count label set beside other content; with `onDismiss` it becomes a removable chip (a filter, a tag).
 */
export function Badge({
  tone: toneProp,
  variant,
  size: sizeProp = "md",
  caps = false,
  dashed = false,
  children,
  iconLeft,
  onDismiss: onDismissProp,
  onClose,
  dismissLabel,
  onCloseLabel,
  className = "",
}: BadgeProps) {
  const size = resolveSize(sizeProp, "Badge");
  // Deprecated aliases (decision 0024): the old names keep working, warn once,
  // and lose to the new names when both are passed.
  if (variant !== undefined) warnDeprecated("Badge", "variant", "tone");
  if (onClose !== undefined) warnDeprecated("Badge", "onClose", "onDismiss");
  if (onCloseLabel !== undefined) warnDeprecated("Badge", "onCloseLabel", "dismissLabel");
  const tone: BadgeTone = toneProp ?? (variant === "default" ? "neutral" : variant) ?? "neutral";
  const onDismiss = onDismissProp ?? onClose;
  // Name the remove button after the chip it removes when the label is plain
  // text; a caller can always override, and rich children fall back to the
  // generic name.
  const removeLabel =
    dismissLabel ?? onCloseLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove badge");
  // SIZE STYLES - Heights and padding matching design system
  // Small: 20px height, 8px horizontal padding, 4px vertical padding
  // Medium: 24px height, 10px horizontal padding, 4px vertical padding
  // Large: 28px height, 12px horizontal padding, 6px vertical padding
  const sizeStyles = {
    sm: "h-5 px-2 py-1 text-xs",      // h-5 = 20px, px-2 = 8px, text-xs = 12px
    md: "h-6 px-2.5 py-1 text-xs",   // h-6 = 24px, px-2.5 = 10px, text-xs = 12px
    lg: "h-7 px-3 py-1.5 text-sm",    // h-7 = 28px, px-3 = 12px, text-sm = 14px
  };

  // Plate badges — compact filled plates sharing the button silhouette.
  // Tints follow the Alert fills (50 on light, 950 on dark); text scales
  // stay at 800/300 which meet WCAG AA on those fills.
  const toneStyles: Record<BadgeTone, string> = {
    neutral: `
      bg-[var(--surface-muted)]
      text-secondary-800 dark:text-secondary-200
    `,
    primary: `
      bg-primary-50 dark:bg-primary-950
      text-primary-800 dark:text-primary-300
    `,
    success: `
      bg-success-50 dark:bg-success-950
      text-success-800 dark:text-success-300
    `,
    warning: `
      bg-warning-50 dark:bg-warning-950
      text-warning-800 dark:text-warning-300
    `,
    error: `
      bg-error-50 dark:bg-error-950
      text-error-800 dark:text-error-300
    `,
    info: `
      bg-info-50 dark:bg-info-950
      text-info-800 dark:text-info-300
    `,
    // Deliberately theme-stable (same fill light and dark): a fixed bone
    // tint for states that must never follow the accent or the theme,
    // like loot tiers. sepia-950 text clears AA on the sepia-500 fill.
    bone: `
      bg-secondary-500 text-secondary-950
    `,
  };

  // DASHED TONES: no fill, so only the text scales remain (they meet AA
  // on page surfaces just as they do on the tinted fills). The border rides
  // border-current so each tone's dash matches its text. Bone is the
  // exception: the DASH stays theme-stable sepia-500 (the empty-slot
  // counterpart to the filled bone chip) but the text keeps the per-theme
  // scales — sepia-500 text fails AA on the light page.
  const dashedToneStyles: Record<BadgeTone, string> = {
    neutral: "border-current text-secondary-800 dark:text-secondary-200",
    primary: "border-current text-primary-800 dark:text-primary-300",
    success: "border-current text-success-800 dark:text-success-300",
    warning: "border-current text-warning-800 dark:text-warning-300",
    error: "border-current text-error-800 dark:text-error-300",
    info: "border-current text-info-800 dark:text-info-300",
    bone: "border-secondary-500 text-secondary-800 dark:text-secondary-200",
  };

  // ICON SIZES - Icons scale with badge size
  const iconSizes = {
    sm: "w-3 h-3",    // 12px
    md: "w-3.5 h-3.5", // 14px
    lg: "w-4 h-4",    // 16px
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-mono font-medium
        ${
          dashed
            ? `rounded-none border border-dashed bg-transparent ${dashedToneStyles[tone]}`
            : `plate-round ${toneStyles[tone]}`
        }
        ${sizeStyles[size]}
        ${caps ? "uppercase [letter-spacing:.08em]" : ""}
        ${className}
      `}
    >
      {/* Left Icon */}
      {iconLeft && (
        <span className={`inline-flex items-center justify-center ${iconSizes[size]} flex-shrink-0`}>
          {renderIconSlot(iconLeft)}
        </span>
      )}
      
      {/* Label — the plate is the container (bracket decoration retired with the TUI tier) */}
      <span className="inline-flex items-center">{children}</span>
      
      {/* Close button: 1-bit X icon.
          HIT AREA: a 44x44 pseudo-element centered on the 12px icon, the
          system's touch-target recipe (Checkbox, Toast). On a plate badge the
          chip's clip-path trims the part of it that reaches past the chip, so
          the effective target is the full chip height by 44px wide; give
          removable chips room in their row rather than packing them edge to
          edge. */}
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={`
            relative inline-flex items-center justify-center
            before:content-[''] before:absolute before:left-1/2 before:top-1/2
            before:-translate-x-1/2 before:-translate-y-1/2 before:w-touch before:h-touch
            font-mono font-bold
            text-secondary-800 dark:text-secondary-200
            hover:text-error-700 dark:hover:text-error-400
            transition-colors [transition-duration:var(--duration-fast)]
            flex-shrink-0
            focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-primary)]
            focus:ring-offset-1 focus:ring-offset-[var(--focus-offset-color)]
          `}
          aria-label={removeLabel}
        >
          <TuiIcon name="X" size="3" />
        </button>
      )}
    </span>
  );
}





