/**
 * DIVIDER COMPONENT
 *
 * Reusable divider/separator component for visual separation
 * Built entirely from design tokens defined in tokens.json
 *
 * FORMS:
 * - orientation="horizontal": full-width rule (default)
 * - orientation="vertical": full-height rule
 * - label: a horizontal rule with a centred label; each side is a hairline that
 *   fills the width beside the label, and a long label truncates
 *
 * SPACING: vertical margins (`my-*`) on every horizontal form, labelled or
 * not; side margins (`mx-*`) on the vertical rule.
 */

import { type ReactNode } from "react";
import type { ControlSize } from "@/lib/size";
import { cn } from "@/lib/utils";

export interface DividerProps {
  /** `horizontal` (default) for a full-width rule between stacked blocks; `vertical` for a full-height rule between items in a row (the parent needs a height). */
  orientation?: "horizontal" | "vertical";
  /** Centred label on a horizontal rule ("or", a section name), drawn between two hairline runs that fill the width beside it. Passing it gives the labelled form; a string label is also the separator's accessible name. Keep it short: a label wider than the row truncates with an ellipsis. Ignored when `orientation` is `vertical`. */
  label?: ReactNode;
  /** Margin around the rule: none, sm 4px, md 16px (default), lg 32px. Above and below a horizontal rule (labelled or not), either side of a vertical one. */
  spacing?: "none" | ControlSize;
  /** Extra classes on the rule (width, colour override, alignment). They win over the defaults, so `w-64` replaces the default `w-full`. */
  className?: string;
}

/** Margin per spacing step: vertical margins for a horizontal rule, side margins for a vertical one. */
const SPACING = {
  horizontal: { none: "", sm: "my-1", md: "my-4", lg: "my-8" },
  vertical: { none: "", sm: "mx-1", md: "mx-4", lg: "mx-8" },
} as const;

/** The one rule weight and colour (decision 0010), shared by every form. */
const RULE = "border-solid border-term-dim";

/** A labelled side: grows into the free width, shrinks to a short minimum run, never wider than its share. */
const SIDE = "flex-1 min-w-4 border-t-[length:var(--border-width-hairline)]";

/**
 * A rule that separates groups of content, horizontal or vertical, optionally with a centred text label.
 *
 * ```tsx
 * <Divider />
 * <Divider label="or" />
 * <Divider orientation="vertical" spacing="none" className="self-stretch" />
 * ```
 */
export function Divider({
  orientation = "horizontal",
  label,
  spacing = "md",
  className = "",
}: DividerProps) {
  const margin = SPACING[orientation][spacing];

  if (orientation === "vertical") {
    return (
      <div
        className={cn("h-full", RULE, "border-l-[length:var(--border-width-hairline)]", margin, className)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // The labelled form draws ─── Label ─── with the same hairline as the plain rule:
  // each side is an empty flex item with a top border, so it fills whatever width
  // is left beside the label and has no intrinsic width to push the parent wider.
  // A label too long for the row truncates with an ellipsis; the sides keep a
  // minimum run so the rule never disappears. An empty label falls back to the plain rule.
  if (label != null && label !== false && label !== "") {
    return (
      <div
        className={cn("flex w-full min-w-0 items-center", margin, className)}
        role="separator"
        aria-label={typeof label === "string" ? label : undefined}
      >
        <span className={cn(SIDE, RULE)} aria-hidden="true" />
        <span className="min-w-0 truncate px-2 font-mono text-xs text-term-dim">{label}</span>
        <span className={cn(SIDE, RULE)} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={cn("w-full", RULE, "border-t-[length:var(--border-width-hairline)]", margin, className)}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}
