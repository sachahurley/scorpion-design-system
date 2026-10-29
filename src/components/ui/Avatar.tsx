/**
 * AVATAR COMPONENT
 * 
 * Reusable avatar component for user profiles, comments, and team displays
 * Built entirely from design tokens defined in tokens.json
 * 
 * VARIANTS:
 * - image: Display user image (src prop)
 * - initials: Display user initials (initials prop)
 * - icon: Display icon (icon prop)
 * 
 * SIZES:
 * - sm: 24px × 24px
 * - md: 40px × 40px (default)
 * - lg: 64px × 64px
 * - xl: 96px × 96px
 * 
 * FEATURES:
 * - Status indicator (online/offline dot)
 * - Fallback to initials if image fails to load
 * - Full light/dark theme support
 * - Always named: `alt` is required and names the image or, for initials and
 *   icons, the box (`role="img"`); `alt=""` marks a decorative avatar
 */

import { useState, type ReactNode } from "react";
import type { ControlSize } from "@/lib/size";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

export interface AvatarProps {
  /** Image URL. Shown when set and it loads; otherwise the avatar falls back to `initials`, then `icon`, then an `@` glyph. */
  src?: string;
  /**
   * Who the avatar shows, usually the person's name. Required, because it names
   * the avatar whatever it renders: the image's alt text, and the name of the
   * initials or icon fallback (which is also what a broken image falls back to).
   * Pass `""` when the name is already written next to the avatar, so it is
   * hidden from assistive tech instead of being read twice.
   */
  alt: string;
  /** One or two letters shown when there is no image, or the image fails to load. */
  initials?: string;
  /** Icon shown when there is neither an image nor initials (for a team, a bot, a system account). Takes a TuiIcon name (`"Check"`) or an element. */
  icon?: IconSlot | ReactNode;
  /** Diameter: sm 24px, md 40px (default), lg 64px, xl 96px. */
  size?: ControlSize | "xl";
  /** Presence dot in the corner, announced as "Status: online" and so on. Omit it to show no dot. */
  status?: "online" | "offline" | "away";
  /** Extra classes on the outer wrapper (margin, positioning). */
  className?: string;
  /** Called when `src` fails to load (to log it, or swap the URL); the avatar shows its fallback either way. */
  onError?: () => void;
}

/**
 * Shows a person or entity as an image, initials or an icon, with an optional presence dot; an image that fails to load falls back to `initials`, then `icon`.
 */
export function Avatar({
  src,
  alt,
  initials,
  icon,
  size = "md",
  status,
  className = "",
  onError,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  // SIZE STYLES - Square avatars matching design system
  // Small: 24px, Medium: 40px, Large: 64px, XL: 96px
  const sizeStyles = {
    sm: {
      container: "w-6 h-6",           // 24px × 24px
      text: "text-xs",                 // 12px font
      icon: "w-3 h-3",                 // 12px icon
      status: "w-1.5 h-1.5",           // 6px status dot
      statusOffset: "bottom-0 right-0", // Position for small
    },
    md: {
      container: "w-10 h-10",         // 40px × 40px
      text: "text-sm",                 // 14px font
      icon: "w-5 h-5",                 // 20px icon
      status: "w-2 h-2",               // 8px status dot
      statusOffset: "bottom-0 right-0", // Position for medium
    },
    lg: {
      container: "w-16 h-16",         // 64px × 64px
      text: "text-lg",                 // 18px font
      icon: "w-8 h-8",                 // 32px icon
      status: "w-3 h-3",               // 12px status dot
      statusOffset: "bottom-1 right-1", // Position for large
    },
    xl: {
      container: "w-24 h-24",         // 96px × 96px
      text: "text-2xl",                // 24px font
      icon: "w-12 h-12",               // 48px icon
      status: "w-4 h-4",               // 16px status dot
      statusOffset: "bottom-2 right-2", // Position for xl
    },
  };

  const currentSize = sizeStyles[size];

  // Handle image load error - fallback to initials or icon
  const handleImageError = () => {
    setImageError(true);
    if (onError) {
      onError();
    }
  };

  // Determine what to display: image → initials → icon → default icon
  const showImage = src && !imageError;
  const showInitials = !showImage && initials;
  const showIcon = !showImage && !showInitials && icon;
  const showDefaultIcon = !showImage && !showInitials && !showIcon;

  // NAME: an image is named by its alt. The initials and icon fallbacks are
  // drawn text, not an image, so the box itself becomes the image and carries
  // the name; its content would otherwise be read as stray letters. `alt=""`
  // marks a decorative avatar (the name is printed beside it). An untyped
  // caller that omits `alt` keeps the old behaviour: the image reads "Avatar"
  // and the fallback is unnamed.
  const decorative = alt === "";
  const fallbackName =
    showImage || alt === undefined
      ? {}
      : decorative
        ? { "aria-hidden": true as const }
        : { role: "img", "aria-label": alt };

  // STATUS INDICATOR COLORS
  const statusColors = {
    online: "bg-success-600 dark:bg-success-500",
    offline: "bg-secondary-500 dark:bg-secondary-600",
    away: "bg-warning-600 dark:bg-warning-500",
  };

  return (
    <div className={`relative inline-block ${currentSize.container} ${className}`}>
      {/* Avatar Container */}
      <div
        {...fallbackName}
        className={`
          ${currentSize.container}
          plate-round
          overflow-hidden
          flex items-center justify-center
          bg-secondary-200 dark:bg-secondary-800
          text-secondary-900 dark:text-secondary-50
          font-mono font-bold
          ${currentSize.text}
        `}
      >
        {/* Image */}
        {showImage && (
          <img
            src={src}
            alt={alt ?? "Avatar"}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        )}

        {/* Initials */}
        {showInitials && (
          <span className="select-none">{initials}</span>
        )}

        {/* Custom Icon — centered in its box like the default glyph (a bare
            sized div leaves glyph icons sitting off-position) */}
        {showIcon && (
          <div className={`${currentSize.icon} inline-flex items-center justify-center leading-none text-secondary-700 dark:text-secondary-300`}>
            {renderIconSlot(icon)}
          </div>
        )}

        {/* TUI Tier 2: @ character instead of Lucide User icon */}
        {showDefaultIcon && (
          <span className={`${currentSize.icon} inline-flex items-center justify-center font-mono font-bold text-secondary-900 dark:text-secondary-100`} aria-hidden="true">@</span>
        )}
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          role="img"
          className={`
            absolute block
            ${currentSize.statusOffset}
            ${currentSize.status}
            ${statusColors[status]}
            rounded-none
            border-2 border-[var(--field-background)]
          `}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}





