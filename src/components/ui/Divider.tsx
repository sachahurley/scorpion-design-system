/**
 * DIVIDER COMPONENT
 * 
 * Reusable divider/separator component for visual separation
 * Built entirely from design tokens defined in tokens.json
 * 
 * VARIANTS:
 * - horizontal: Full-width horizontal divider (default)
 * - vertical: Full-height vertical divider
 * - withText: Horizontal divider with centered text label
 * 
 * FEATURES:
 * - Light/dark theme support
 * - Customizable spacing (margin)
 * - Optional text label for horizontal dividers
 */

import { type ReactNode } from "react";
import { resolveSize, type ControlSizeProp } from "@/lib/size";

export interface DividerProps {
  /** `horizontal` (default) for a full-width rule between stacked blocks, `vertical` for a full-height rule between items in a row (the parent needs a height), `withText` for a horizontal rule with a centred label. */
  variant?: "horizontal" | "vertical" | "withText";
  /** Label shown in the middle of a `withText` divider ("or", a section name); a string label is also its accessible name. Ignored by the other variants, and `withText` without it renders a plain rule. */
  text?: ReactNode;
  /** Margin around the rule: none, sm 4px, md 16px (default), lg 32px. Legacy names are deprecated aliases. */
  spacing?: "none" | ControlSizeProp;
  /** Extra classes on the rule (width, colour override, alignment). */
  className?: string;
}

/**
 * A rule that separates groups of content, horizontal or vertical, optionally with a centred text label.
 */
export function Divider({
  variant = "horizontal",
  text,
  spacing: spacingProp = "md",
  className = "",
}: DividerProps) {
    const spacing = resolveSize(spacingProp, "Divider", "md" as "none" | "sm" | "md" | "lg");
  // SPACING STYLES - Margin around divider
  // Uses spacing tokens: 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px)
  const spacingStyles = {
    none: "",
    sm: variant === "horizontal" ? "my-1" : "mx-1",      // 4px margin
    md: variant === "horizontal" ? "my-4" : "mx-4",      // 16px margin
    lg: variant === "horizontal" ? "my-8" : "mx-8",      // 32px margin
  };

  // TUI Tier 2: terminal accent color for divider borders
  const dividerBaseStyles = `
    border-term-dim
  `;

  // Horizontal divider (default) -- terminal accent colored border
  if (variant === "horizontal") {
    return (
      <div
        className={`
          w-full
          border-t border-solid
          ${dividerBaseStyles}
          ${spacingStyles[spacing]}
          ${className}
        `}
        role="separator"
        aria-orientation="horizontal"
      />
    );
  }

  // Vertical divider -- terminal accent colored border
  if (variant === "vertical") {
    return (
      <div
        className={`
          h-full
          border-l border-solid
          ${dividerBaseStyles}
          ${spacingStyles[spacing]}
          ${className}
        `}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // TUI Tier 2: withText variant uses ─── Label ─── box-drawing characters
  if (variant === "withText" && text) {
    return (
      <div
        className={`
          flex items-center
          w-full
          ${spacingStyles[spacing]}
          ${className}
        `}
        role="separator"
        aria-label={typeof text === "string" ? text : undefined}
      >
        {/* Left box-drawing line */}
        <span className="flex-1 overflow-hidden whitespace-nowrap font-mono text-term-dim leading-none select-none" aria-hidden="true">
          {"─".repeat(80)}
        </span>
        
        {/* Centered text */}
        <span className="px-2 font-mono text-xs text-term-dim whitespace-nowrap">
          {text}
        </span>
        
        {/* Right box-drawing line */}
        <span className="flex-1 overflow-hidden whitespace-nowrap font-mono text-term-dim leading-none select-none" aria-hidden="true">
          {"─".repeat(80)}
        </span>
      </div>
    );
  }

  // Fallback to horizontal if withText but no text provided
  return (
    <div
      className={`
        w-full
        border-t border-solid
        ${dividerBaseStyles}
        ${spacingStyles[spacing]}
        ${className}
      `}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}





