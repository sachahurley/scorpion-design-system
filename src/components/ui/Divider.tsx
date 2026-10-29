/**
 * DIVIDER COMPONENT
 *
 * Reusable divider/separator component for visual separation
 * Built entirely from design tokens defined in tokens.json
 *
 * FORMS:
 * - orientation="horizontal": full-width rule (default)
 * - orientation="vertical": full-height rule
 * - label: a horizontal rule with a centred label between box-drawing runs
 *
 * `variant` (horizontal | vertical | withText) and `text` are deprecated
 * aliases for `orientation` and `label` (decision 0024).
 *
 * SPACING: vertical margins (`my-*`) on every horizontal form, labelled or
 * not; side margins (`mx-*`) on the vertical rule.
 */

import { type ReactNode } from "react";
import { warnDeprecated } from "@/lib/deprecate";
import { resolveSize, type ControlSizeProp } from "@/lib/size";

export interface DividerProps {
  /** `horizontal` (default) for a full-width rule between stacked blocks; `vertical` for a full-height rule between items in a row (the parent needs a height). */
  orientation?: "horizontal" | "vertical";
  /** Centred label on a horizontal rule ("or", a section name), drawn between box-drawing runs. Passing it gives the labelled form; a string label is also the separator's accessible name. Ignored when `orientation` is `vertical`. */
  label?: ReactNode;
  /**
   * @deprecated Use `orientation`, and `label` for the labelled form (`withText`).
   * `horizontal` and `vertical` map onto `orientation`; `withText` is a horizontal rule
   * that shows `text`. `orientation` and `label` win when both forms are passed.
   */
  variant?: "horizontal" | "vertical" | "withText";
  /** @deprecated Use `label`. Shown only with `variant="withText"`; `label` wins when both are passed. */
  text?: ReactNode;
  /** Margin around the rule: none, sm 4px, md 16px (default), lg 32px. Above and below a horizontal rule (labelled or not), either side of a vertical one. Legacy names are deprecated aliases. */
  spacing?: "none" | ControlSizeProp;
  /** Extra classes on the rule (width, colour override, alignment). */
  className?: string;
}

/** Margin per spacing step: vertical margins for a horizontal rule, side margins for a vertical one. */
const SPACING = {
  horizontal: { none: "", sm: "my-1", md: "my-4", lg: "my-8" },
  vertical: { none: "", sm: "mx-1", md: "mx-4", lg: "mx-8" },
} as const;

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
  orientation: orientationProp,
  label: labelProp,
  variant,
  text,
  spacing: spacingProp = "md",
  className = "",
}: DividerProps) {
  if (variant !== undefined) warnDeprecated("Divider", "variant", "orientation, and label for the labelled form");
  if (text !== undefined) warnDeprecated("Divider", "text", "label");

  const orientation: NonNullable<DividerProps["orientation"]> = orientationProp ?? (variant === "vertical" ? "vertical" : "horizontal");
  // The legacy `text` only ever showed on `variant="withText"`; keep that.
  const label = labelProp ?? (variant === "withText" ? text : undefined);
  const spacing = resolveSize(spacingProp, "Divider", "md" as "none" | "sm" | "md" | "lg");
  const margin = SPACING[orientation][spacing];

  if (orientation === "vertical") {
    return (
      <div
        className={`h-full border-l border-solid border-term-dim ${margin} ${className}`}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // TUI Tier 2: the labelled form draws ─── Label ─── with box-drawing characters.
  // An empty label falls back to the plain rule.
  if (label != null && label !== false && label !== "") {
    return (
      <div
        className={`flex items-center w-full ${margin} ${className}`}
        role="separator"
        aria-label={typeof label === "string" ? label : undefined}
      >
        <span className="flex-1 overflow-hidden whitespace-nowrap font-mono text-term-dim leading-none select-none" aria-hidden="true">
          {"─".repeat(80)}
        </span>
        <span className="px-2 font-mono text-xs text-term-dim whitespace-nowrap">{label}</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap font-mono text-term-dim leading-none select-none" aria-hidden="true">
          {"─".repeat(80)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`w-full border-t border-solid border-term-dim ${margin} ${className}`}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}
