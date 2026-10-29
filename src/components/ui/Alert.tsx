/**
 * ALERT COMPONENT
 * 
 * Reusable alert/notification component for user feedback
 * Built entirely from design tokens defined in tokens.json
 * 
 * TONES (decision 0024's colour roles):
 * - neutral: Neutral gray alert
 * - success: Green for success messages
 * - warning: Purple for warnings
 * - error: Red for error messages
 * - info: Blue for informational messages
 * The deprecated `variant` prop still works; its `default` maps to `neutral`.
 * 
 * FEATURES:
 * - Severity icon per tone from the 1-bit set: neutral Bell, info Info,
 *   success CheckCircle, warning AlertTriangle, error AlertCircle
 *   (override with iconLeft)
 * - Optional dismiss button (onDismiss prop), a 1-bit X. It is a `type="button"`
 *   control so an Alert inside a form never submits it, carries the system's
 *   inset focus ring, and gets an invisible 44x44px hit area from a
 *   pseudo-element (same recipe as Checkbox, so the visual stays 12px).
 * - Optional title and description
 * - Full light/dark theme support
 * - Accessible (ARIA attributes)
 */

import { type ReactNode } from "react";
import { warnDeprecated } from "@/lib/deprecate";
import { TuiIcon, type TuiIconName } from "./TuiIcon";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

/** Semantic colour role of an Alert: picks the colour set and the 1-bit severity icon. */
export type AlertTone = "neutral" | "info" | "success" | "warning" | "error";

export interface AlertProps {
  /** Severity: picks the colour set and the 1-bit severity icon. Default: "neutral". */
  tone?: AlertTone;
  /**
   * Severity under its old name; `default` maps to `neutral`. When both are set, `tone` wins.
   * @deprecated Use `tone`.
   */
  variant?: "default" | "success" | "warning" | "error" | "info";
  /** Short bold headline, one line. Say what happened, not "Error". */
  title?: string;
  /** Body copy under the title: what it means and what to do next. */
  description?: ReactNode;
  /** Replaces the tone's severity icon. Takes a TuiIcon name (`"Check"`) or an element. */
  iconLeft?: IconSlot | ReactNode;
  /** Adds a dismiss control (44px hit area) and is called when it is pressed. */
  onDismiss?: () => void;
  /**
   * Dismiss callback under its old name. When both are set, `onDismiss` wins.
   * @deprecated Use `onDismiss`.
   */
  onClose?: () => void;
  /**
   * Accessible name of the dismiss button (default "Close alert"). Name what it
   * dismisses when a page has several alerts ("Dismiss sync warning").
   */
  dismissLabel?: string;
  /** Extra classes on the outer ring layer (spacing and width only). */
  className?: string;
}

/**
 * An inline message about the state of a page or form that stays until the user acts, with an optional title, icon and dismiss button.
 * 
 * @param tone - Alert colour role (default: "neutral")
 * @param title - Optional alert title
 * @param description - Optional alert description/content
 * @param iconLeft - Optional custom icon (defaults to the tone's icon)
 * @param onDismiss - Optional callback when the dismiss button is clicked
 * @param className - Additional CSS classes
 */
export function Alert({
  tone: toneProp,
  variant,
  title,
  description,
  iconLeft,
  onDismiss: onDismissProp,
  onClose,
  dismissLabel = "Close alert",
  className = "",
}: AlertProps) {
  // Deprecated aliases (decision 0024): the old names keep working, warn once,
  // and lose to the new names when both are passed.
  if (variant !== undefined) warnDeprecated("Alert", "variant", "tone");
  if (onClose !== undefined) warnDeprecated("Alert", "onClose", "onDismiss");
  const tone: AlertTone = toneProp ?? (variant === "default" ? "neutral" : variant) ?? "neutral";
  const onDismiss = onDismissProp ?? onClose;

  // 1-bit severity icons, one per tone (neutral and info differ, so the
  // icon, not just the color, tells them apart)
  const severityIcons: Record<AlertTone, TuiIconName> = {
    neutral: "Bell",
    success: "CheckCircle",
    warning: "AlertTriangle",
    error: "AlertCircle",
    info: "Info",
  };

  // Use custom icon if provided, otherwise the tone's 1-bit icon
  const icon = renderIconSlot(iconLeft, { size: "4" }) || <TuiIcon name={severityIcons[tone]} size="4" />;

  // TONE STYLES - Color combinations using semantic tokens
  // All tones support light and dark themes.
  // PLATE RING RECIPE: `ring` is the border color painted on the outer layer
  // (clipped to the plate), `fill` is the surface painted on the inner layer
  // 1px inset — clip-path slices real borders, so the ring is a layer.
  const toneStyles: Record<AlertTone, { ring: string; fill: string; icon: string; title: string; description: string }> = {
    // Neutral: neutral semantic surfaces (surface + border roles)
    neutral: {
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

  const styles = toneStyles[tone];

  // Close control focus ring: the system's inset box-shadow ring (an outside
  // ring would be sliced by the plate clip). There is no per-severity ring
  // token, so error takes the error ring and every other tone the primary.
  const closeFocusRing =
    tone === "error"
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

      {/* Dismiss Button: 12px glyph, 44px hit area from a centered
          pseudo-element (layout unchanged), inset token focus ring */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
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
          aria-label={dismissLabel}
        >
          <TuiIcon name="X" size="3" />
        </button>
      )}
    </div>
    </div>
  );
}
