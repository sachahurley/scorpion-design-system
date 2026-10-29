/**
 * ALERT COMPONENT
 * 
 * Reusable alert/notification component for user feedback
 * Built entirely from design tokens defined in tokens.json
 * 
 * VARIANTS:
 * - default: Neutral gray alert
 * - success: Green for success messages
 * - warning: Purple for warnings
 * - error: Red for error messages
 * - info: Blue for informational messages
 * 
 * FEATURES:
 * - Severity icon per variant from the 1-bit set: default Bell, info Info,
 *   success CheckCircle, warning AlertTriangle, error AlertCircle
 *   (override with iconLeft)
 * - Optional close button (onClose prop), a 1-bit X. It is a `type="button"`
 *   control so an Alert inside a form never submits it, carries the system's
 *   inset focus ring, and gets an invisible 44x44px hit area from a
 *   pseudo-element (same recipe as Checkbox, so the visual stays 12px).
 * - Optional title and description
 * - Full light/dark theme support
 * - Accessible (ARIA attributes)
 */

import { type ReactNode } from "react";
import { TuiIcon, type TuiIconName } from "./TuiIcon";

export interface AlertProps {
  /** Severity: picks the color set and the 1-bit severity icon. */
  variant?: "default" | "success" | "warning" | "error" | "info";
  /** Short bold headline, one line. Say what happened, not "Error". */
  title?: string;
  /** Body copy under the title: what it means and what to do next. */
  description?: ReactNode;
  /** Replaces the variant's severity icon. Use a `TuiIcon`. */
  iconLeft?: ReactNode;
  /** Adds a dismiss control (44px hit area) and is called when it is pressed. */
  onClose?: () => void;
  /** Extra classes on the outer ring layer (spacing and width only). */
  className?: string;
}

/**
 * An inline message about the state of a page or form that stays until the user acts, with an optional title, icon and dismiss button.
 * 
 * @param variant - Alert color variant (default: "default")
 * @param title - Optional alert title
 * @param description - Optional alert description/content
 * @param iconLeft - Optional custom icon (defaults to variant icon)
 * @param onClose - Optional callback when close button is clicked
 * @param className - Additional CSS classes
 */
export function Alert({
  variant = "default",
  title,
  description,
  iconLeft,
  onClose,
  className = "",
}: AlertProps) {
  // 1-bit severity icons, one per variant (default and info differ, so the
  // icon, not just the color, tells them apart)
  const severityIcons: Record<NonNullable<AlertProps["variant"]>, TuiIconName> = {
    default: "Bell",
    success: "CheckCircle",
    warning: "AlertTriangle",
    error: "AlertCircle",
    info: "Info",
  };

  // Use custom icon if provided, otherwise the variant's 1-bit icon
  const icon = iconLeft || <TuiIcon name={severityIcons[variant]} size="4" />;

  // VARIANT STYLES - Color combinations using semantic tokens
  // All variants support light and dark themes.
  // PLATE RING RECIPE: `ring` is the border color painted on the outer layer
  // (clipped to the plate), `fill` is the surface painted on the inner layer
  // 1px inset — clip-path slices real borders, so the ring is a layer.
  const variantStyles = {
    // Default: neutral semantic surfaces (surface + border roles)
    default: {
      ring: "bg-[var(--border-default)]",
      fill: "bg-[var(--surface-subtle)]",
      icon: "text-secondary-800 dark:text-secondary-300",
      title: "text-[var(--text-primary)]",
      description: "text-secondary-800 dark:text-secondary-300",
    },
    
    // Success: Green for positive states
    success: {
      ring: "bg-success-300 dark:bg-success-700",
      fill: "bg-success-50 dark:bg-success-950",
      icon: "text-success-800 dark:text-success-400",
      title: "text-success-900 dark:text-success-50",
      description: "text-success-900 dark:text-success-300",
    },
    
    // Warning: Purple for warnings
    warning: {
      ring: "bg-warning-300 dark:bg-warning-700",
      fill: "bg-warning-50 dark:bg-warning-950",
      icon: "text-warning-800 dark:text-warning-400",
      title: "text-warning-900 dark:text-warning-50",
      description: "text-warning-900 dark:text-warning-300",
    },
    
    // Error: Red for errors
    error: {
      ring: "bg-error-300 dark:bg-error-700",
      fill: "bg-error-50 dark:bg-error-950",
      icon: "text-error-700 dark:text-error-400",
      title: "text-error-900 dark:text-error-50",
      description: "text-error-900 dark:text-error-300",
    },
    
    // Info: Blue for informational messages
    info: {
      ring: "bg-info-300 dark:bg-info-700",
      fill: "bg-info-50 dark:bg-info-950",
      icon: "text-info-800 dark:text-info-400",
      title: "text-info-900 dark:text-info-50",
      description: "text-info-900 dark:text-info-300",
    },
  };

  const styles = variantStyles[variant];

  // Close control focus ring: the system's inset box-shadow ring (an outside
  // ring would be sliced by the plate clip). There is no per-severity ring
  // token, so error takes the error ring and every other variant the primary.
  const closeFocusRing =
    variant === "error"
      ? "focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-error)]"
      : "focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]";

  return (
    <div role="alert" className={`plate-round p-px ${styles.ring} ${className}`}>
    <div
      className={`
        plate-round
        flex items-start gap-3
        p-4
        ${styles.fill}
      `}
    >
      {/* Icon — boxed to the title's first-line height (text-sm = 20px) and
          centered in it, so the prefix sits optically level with the title */}
      {icon && (
        <div className={`flex h-5 flex-shrink-0 items-center ${styles.icon}`}>
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-mono text-sm font-bold mb-1 ${styles.title}`}>
            {title}
          </h4>
        )}
        {description && (
          <div className={`font-mono text-sm ${styles.description}`}>
            {description}
          </div>
        )}
      </div>

      {/* Close Button: 12px glyph, 44px hit area from a centered
          pseudo-element (layout unchanged), inset token focus ring */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`
            relative flex-shrink-0
            font-mono text-xs font-bold
            ${styles.description}
            hover:text-error-800 dark:hover:text-error-300
            transition-colors [transition-duration:var(--duration-fast)]
            before:content-[''] before:absolute before:left-1/2 before:top-1/2
            before:-translate-x-1/2 before:-translate-y-1/2
            before:w-touch before:h-touch
            focus:outline-none ${closeFocusRing}
          `}
          aria-label="Close alert"
        >
          <TuiIcon name="X" size="3" />
        </button>
      )}
    </div>
    </div>
  );
}





