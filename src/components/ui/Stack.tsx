import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const gapClass = {
  none: "gap-0",
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "5": "gap-5",
  "6": "gap-6",
  "8": "gap-8",
} as const;

export type StackGap = keyof typeof gapClass;

/** One layout direction: `vertical` is a column, `horizontal` a row that wraps. */
export type StackAxisValue = "vertical" | "horizontal";

/** Breakpoint names, matching the breakpoint tokens wired into the Tailwind `screens` scale. */
export type StackBreakpoint = "base" | "sm" | "md" | "lg" | "xl";

/**
 * A direction per breakpoint, mobile first. `base` is required and applies below
 * `sm` (640px); each later key applies from its breakpoint up until the next key
 * overrides it: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.
 */
export type StackResponsiveAxis = { base: StackAxisValue } & Partial<
  Record<Exclude<StackBreakpoint, "base">, StackAxisValue>
>;

/** A fixed direction, or a direction per breakpoint (decision 0032). */
export type StackAxis = StackAxisValue | StackResponsiveAxis;

/** Cross-axis placement of children, at every breakpoint. */
export type StackAlign = "start" | "center" | "end" | "stretch";

/*
 * Every class is written out in full so Tailwind sees it in source; never build
 * one from a template string. A value means the same thing at every breakpoint:
 * `horizontal` is a wrapping row, `vertical` a column that does not wrap. From
 * `sm` up, `vertical` also resets the wrap a lower `horizontal` turned on. The
 * `base` row is exactly what the plain-string form has always emitted.
 */
const axisClass: Record<StackBreakpoint, Record<StackAxisValue, string>> = {
  base: { vertical: "flex-col", horizontal: "flex-row flex-wrap" },
  sm: { vertical: "sm:flex-col sm:flex-nowrap", horizontal: "sm:flex-row sm:flex-wrap" },
  md: { vertical: "md:flex-col md:flex-nowrap", horizontal: "md:flex-row md:flex-wrap" },
  lg: { vertical: "lg:flex-col lg:flex-nowrap", horizontal: "lg:flex-row lg:flex-wrap" },
  xl: { vertical: "xl:flex-col xl:flex-nowrap", horizontal: "xl:flex-row xl:flex-wrap" },
};

/*
 * The cross-axis placement each direction brings when `align` is not set: a row
 * centres its children, a column stretches them (the flex default, so `base`
 * emits nothing for it).
 */
const axisAlignClass: Record<StackBreakpoint, Record<StackAxisValue, string | undefined>> = {
  base: { vertical: undefined, horizontal: "items-center" },
  sm: { vertical: "sm:items-stretch", horizontal: "sm:items-center" },
  md: { vertical: "md:items-stretch", horizontal: "md:items-center" },
  lg: { vertical: "lg:items-stretch", horizontal: "lg:items-center" },
  xl: { vertical: "xl:items-stretch", horizontal: "xl:items-center" },
};

const alignClass: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

/** Breakpoint order, so a responsive axis always emits mobile-first classes. */
const BREAKPOINT_ORDER: StackBreakpoint[] = ["base", "sm", "md", "lg", "xl"];

/** Turns an `axis` value into its mobile-first direction, wrap and alignment classes. */
function resolveAxis(axis: StackAxis, align: StackAlign | undefined): string[] {
  const steps: [StackBreakpoint, StackAxisValue][] =
    typeof axis === "string"
      ? [["base", axis]]
      : BREAKPOINT_ORDER.flatMap((breakpoint) => {
          const value = axis[breakpoint];
          return value === undefined ? [] : [[breakpoint, value] as [StackBreakpoint, StackAxisValue]];
        });
  return steps.flatMap(([breakpoint, value]) => {
    const classes = [axisClass[breakpoint][value]];
    const placement = axisAlignClass[breakpoint][value];
    if (align === undefined && placement !== undefined) classes.push(placement);
    return classes;
  });
}

export interface StackProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Stack contents; laid out along `axis` with `gap` between them. */
  children: ReactNode;
  /**
   * Maps to the spacing scale (`gap-*` utilities): `none` 0, `1` 4px, `2` 8px,
   * `3` 12px, `4` 16px (default), `5` 20px, `6` 24px, `8` 32px.
   */
  gap?: StackGap;
  /** Additional CSS classes (width, padding, alignment overrides). */
  className?: string;
  /**
   * Layout direction: `"vertical"` (default, a column), `"horizontal"` (a row
   * that wraps and centres its children), or a breakpoint map such as
   * `{ base: "vertical", md: "horizontal" }` (keys `base`, `sm`, `md`, `lg`,
   * `xl`; `base` required). Use the map for a split that stacks on small
   * screens and sits side by side from a breakpoint.
   */
  axis?: StackAxis;
  /**
   * Cross-axis placement of children at every breakpoint; unset, a column
   * stretches them and a row centres them. Set `stretch` on a responsive split
   * so its panes share one height once they sit side by side.
   */
  align?: StackAlign;
}

/**
 * Stack is vertical or horizontal layout with token-backed gap spacing.
 * Use inside screens and compound components instead of ad-hoc `flex` + raw gap values.
 *
 * `axis` can change at a breakpoint (`{ base: "vertical", md: "horizontal" }`), so a
 * two-pane split that stacks on phones needs no hand-written flex.
 *
 * Forwards its ref to the underlying `<div>` and spreads any extra native
 * attributes (`id`, `role`, `aria-*`, `data-*`), so a stack can be a labelled
 * region or a scroll anchor without a wrapper element.
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { children, gap = "4", className, axis = "vertical", align, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        resolveAxis(axis, align),
        gapClass[gap],
        align !== undefined && alignClass[align],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

Stack.displayName = "Stack";
