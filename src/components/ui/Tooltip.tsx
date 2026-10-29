/**
 * TOOLTIP COMPONENT
 * 
 * Reusable tooltip component for helpful hints and descriptions
 * Built entirely from design tokens defined in tokens.json
 * 
 * PLACEMENT (`side` + `align`, decision 0024):
 * - side top: Above the trigger element (default)
 * - side bottom: Below the trigger element
 * - side left: To the left of the trigger element
 * - side right: To the right of the trigger element
 * - align center (default) centers the balloon on the trigger; start / end
 *   line its leading / trailing edge up with the trigger's. The caret always
 *   points at the trigger's center.
 *
 * FEATURES:
 * - Arrow/pointer indicator
 * - Viewport-aware: measured after it opens; if the chosen side would
 *   overflow the viewport it flips to the opposite side (when that side has
 *   room), and top/bottom tooltips slide horizontally to stay on screen
 *   while the caret keeps pointing at the trigger
 * - Delay for show/hide (prevents accidental triggers)
 * - Max width constraint
 * - Full light/dark theme support
 *
 * ACCESSIBILITY (WCAG 2.1.1, 1.4.13):
 * - Opens on keyboard focus as well as hover; closes on blur.
 * - Escape dismisses it without moving focus or the pointer.
 * - Hoverable: the pointer can travel from the trigger onto the tooltip (a
 *   transparent bridge spans the gap) without it closing.
 * - The trigger is described by the tooltip via `aria-describedby`. That
 *   wiring needs a single element child (a Button, a link); the tooltip
 *   still opens for other children but can't describe them.
 * - Content is for supplementary hints only: never put the only copy of
 *   essential information, or anything interactive, in a tooltip.
 */

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactElement,
  type ReactNode,
} from "react";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** Trigger-to-balloon gap (the mb-2 / mt-2 / mr-2 / ml-2 offsets, 8px). */
const GAP = 8;
/** Breathing room kept between the balloon and the viewport edge. */
const EDGE = 8;

type Rect = Pick<DOMRect, "top" | "bottom" | "left" | "right" | "width" | "height">;

/**
 * The side to render on: the preferred one if the balloon fits there,
 * otherwise the opposite side if IT fits, otherwise the preferred side
 * (clipping on both sides is no better, so respect the author's choice).
 */
function fitSide(preferred: Side, trigger: Rect, tip: Rect, vw: number, vh: number): Side {
  const room: Record<Side, number> = {
    top: trigger.top,
    bottom: vh - trigger.bottom,
    left: trigger.left,
    right: vw - trigger.right,
  };
  const need = (side: Side) => (side === "top" || side === "bottom" ? tip.height : tip.width) + GAP + EDGE;
  if (room[preferred] >= need(preferred)) return preferred;
  const opposite = OPPOSITE[preferred];
  return room[opposite] >= need(opposite) ? opposite : preferred;
}

/**
 * Where the balloon starts on the cross axis, before any nudge: its left edge
 * for top/bottom, its top edge for left/right. `start` and `end` line the
 * balloon up with the trigger's leading and trailing edge.
 */
function crossStart(align: Align, triggerStart: number, triggerSize: number, tipSize: number): number {
  if (align === "start") return triggerStart;
  if (align === "end") return triggerStart + triggerSize - tipSize;
  return triggerStart + triggerSize / 2 - tipSize / 2;
}

/** Horizontal px nudge that keeps a top/bottom balloon on screen. */
function clampShift(trigger: Rect, tipWidth: number, vw: number, align: Align): number {
  const left = crossStart(align, trigger.left, trigger.width, tipWidth);
  const right = left + tipWidth;
  if (left < EDGE) return EDGE - left;
  if (right > vw - EDGE) return Math.max(EDGE - left, vw - EDGE - right);
  return 0;
}

export interface TooltipProps {
  /** Short supplementary hint. Plain text; no links or buttons. */
  content: ReactNode;
  /** The trigger. Pass one focusable element so keyboard users can open the tooltip and hear it. */
  children: ReactNode;
  /**
   * Preferred side of the trigger (default "top"). It flips to the opposite
   * side when this one would overflow the viewport.
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Where the balloon sits along the trigger edge (default "center"). `start`
   * and `end` line its leading or trailing edge up with the trigger's, for a
   * trigger at the edge of a row; the caret still points at the trigger.
   */
  align?: "start" | "center" | "end";
  /** Delay in milliseconds before showing on hover or focus (default 200). Hiding is immediate. */
  delay?: number;
  /**
   * Max width of the balloon, any CSS length (default "200px"); text wraps
   * inside it. This stays a free CSS length because no token describes a
   * reading width: the spacing scale stops at 96px and the breakpoints are
   * page widths. Widen it for a long hint rather than shortening the copy.
   */
  maxWidth?: string;
  /** Extra classes for the wrapper (e.g. a width class for a full-width trigger). */
  className?: string;
}

/**
 * A short text hint shown while its trigger is hovered or focused; for interactive content use `Popover`.
 *
 * @example
 * <Tooltip content="Copy" side="bottom">
 *   <Button variant="ghost" aria-label="Copy"><TuiIcon name="Copy" /></Button>
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  side: position = "top",
  align = "center",
  delay = 200,
  maxWidth = "200px",
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  // Resolved side (after flipping) and the horizontal nudge, in px, that
  // keeps a top/bottom balloon inside the viewport.
  const [placement, setPlacement] = useState<Side>(position);
  const [shift, setShift] = useState(0);
  // Counter-nudge for the caret so it still points at the trigger's center:
  // horizontal for top/bottom, vertical for left/right.
  const [caretShift, setCaretShift] = useState(0);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (fadeRef.current) clearTimeout(fadeRef.current);
  };

  // Show after the delay (hover or focus)
  const show = () => {
    clearTimers();
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Small delay before actually showing to allow positioning calculation
      fadeRef.current = setTimeout(() => setShowTooltip(true), 50);
    }, delay);
  };

  // Hide immediately (pointer leaves, focus leaves, Escape)
  const hide = useCallback(() => {
    clearTimers();
    setIsVisible(false);
    setShowTooltip(false);
  }, []);

  // Blur only hides when focus leaves the wrapper entirely
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!wrapperRef.current?.contains(e.relatedTarget as Node | null)) hide();
  };

  // Escape dismisses from anywhere while open (1.4.13 "dismissible")
  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isVisible, hide]);

  // Cleanup timeouts on unmount
  useEffect(() => clearTimers, []);

  // VIEWPORT FIT: measured before paint, while the balloon is still at
  // opacity 0. Uses the trigger's rect plus the balloon's size (independent
  // of side, thanks to w-max), so one measurement decides the side.
  useLayoutEffect(() => {
    if (!isVisible) return;
    const trigger = wrapperRef.current?.getBoundingClientRect();
    const tip = tooltipRef.current?.getBoundingClientRect();
    if (!trigger || !tip) return;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const next = fitSide(position, trigger, tip, vw, vh);
    const vertical = next === "top" || next === "bottom";
    const nudge = vertical ? clampShift(trigger, tip.width, vw, align) : 0;
    // The caret is centred on the balloon; move it to the trigger's center,
    // measured along the cross axis from where the balloon actually starts.
    // For the default center alignment that is exactly -nudge.
    const tipSize = vertical ? tip.width : tip.height;
    const triggerStart = vertical ? trigger.left : trigger.top;
    const triggerSize = vertical ? trigger.width : trigger.height;
    const balloonStart = crossStart(align, triggerStart, triggerSize, tipSize) + nudge;
    const toTriggerCenter =
      align === "center" ? -nudge : triggerStart + triggerSize / 2 - (balloonStart + tipSize / 2);
    // Keep the 16px caret on the balloon body (inside its stepped corners)
    const caretLimit = Math.max(0, tipSize / 2 - 12);
    setPlacement(next);
    setShift(nudge);
    setCaretShift(Math.min(caretLimit, Math.max(-caretLimit, toTriggerCenter)));
  }, [isVisible, position, align, content, maxWidth]);

  // Describe the trigger while the tooltip is open. Only possible when the
  // child is a single element we can clone.
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
        "aria-describedby":
          [
            (children as ReactElement<{ "aria-describedby"?: string }>).props["aria-describedby"],
            isVisible ? tooltipId : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined,
      })
    : children;

  // POSITION STYLES - Positioning tooltip relative to trigger.
  // The container needs w-max: an absolutely-positioned box's auto width is
  // capped by the space from its `left` offset to the containing block edge,
  // so on a narrow trigger the box collapses and the min-width balloon
  // overflows it — translate centering then centers the collapsed box, not
  // the visible balloon.
  const sideStyles = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };
  // Cross-axis alignment: horizontal for top/bottom, vertical for left/right.
  const alignStyles = {
    horizontal: { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" },
    vertical: { start: "top-0", center: "top-1/2 -translate-y-1/2", end: "bottom-0" },
  };
  const isVertical = placement === "top" || placement === "bottom";
  const positionStyles = `${sideStyles[placement]} ${alignStyles[isVertical ? "horizontal" : "vertical"][align]}`;

  // 1-BIT STEPPED CARET — two stacked stepped polygons (ring layer + fill layer,
  // fill overlapping the tooltip edge 1px so the ring reads continuous). The
  // assembly is authored pointing DOWN (tooltip above trigger) and rotated per
  // side. Geometry is structural (shape language), not a themable value —
  // colors come from the same tokens as the plate ring.
  // 16×8 outer / 12×6 inner on the 2px step grid: the visible ring is ~2px,
  // matching the plate's hairline weight instead of reading as a dense wedge.
  // Caret geometry is tokenised (--plate-caret-*) so the arrow steps on the same
  // 2px rhythm as --plate-round. Changing the plate step means changing one place.
  const CARET_OUTER = "var(--plate-caret-outer)";
  const CARET_INNER = "var(--plate-caret-inner)";

  // Placement + rotation per position; the 1px translate keeps the fill layer
  // overlapping the tooltip body so ring and plate read as one outline.
  const caretPlacement = {
    top: "top-full left-1/2 -translate-x-1/2 -translate-y-px",
    bottom: "bottom-full left-1/2 -translate-x-1/2 translate-y-px rotate-180",
    left: "left-full top-1/2 -translate-y-1/2 translate-x-[calc(var(--plate-caret-offset)*-1)] -rotate-90",
    right: "right-full top-1/2 -translate-y-1/2 translate-x-[var(--plate-caret-offset)] rotate-90",
  };

  // HOVER BRIDGE: transparent strip filling the 8px gap between trigger and
  // balloon, so the pointer can cross onto the tooltip without leaving the
  // wrapper (the tooltip is a DOM child of the wrapper).
  const bridgePlacement = {
    top: "top-full inset-x-0 h-2",
    bottom: "bottom-full inset-x-0 h-2",
    left: "left-full inset-y-0 w-2",
    right: "right-full inset-y-0 w-2",
  };

  return (
    <div
      ref={wrapperRef}
      // w-fit keeps the wrapper hugging the trigger even where the container
      // blockifies/stretches it (grid or flex items) — otherwise the tooltip
      // centers on the stretched wrapper, not the trigger. Pass a width class
      // via `className` if the trigger itself is full-width.
      className={`relative inline-block w-fit ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={handleBlur}
    >
      {/* Trigger Element */}
      {trigger}

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`
            absolute
            ${positionStyles}
            w-max
            z-[var(--z-index-tooltip)]
            ${showTooltip ? "opacity-100" : "opacity-0"}
            transition-opacity [transition-duration:var(--duration-fast)]
          `}
          data-placement={placement}
          data-align={align}
          // The nudge is a margin, not a transform, so it composes with the
          // translate-centering classes instead of replacing them.
          style={{ maxWidth, marginLeft: shift || undefined }}
        >
          <span className={`absolute ${bridgePlacement[placement]}`} aria-hidden="true" />

          {/* Tooltip Content — plate ring recipe (stroke layer + fill inset 1px) */}
          <div className="plate-round p-px bg-[var(--surface-container-stroke)]">
            <div className="plate-round bg-[var(--surface-card)] min-w-16 px-3 py-2 text-center font-mono text-xs text-[var(--text-primary)] whitespace-normal">
              {content}
            </div>
          </div>

          {/* 1-bit stepped caret pointing at the trigger */}
          <div
            className={`absolute ${caretPlacement[placement]}`}
            style={isVertical ? { marginLeft: caretShift || undefined } : { marginTop: caretShift || undefined }}
            aria-hidden="true"
          >
            <div className="relative h-[var(--plate-caret-height)] w-[var(--plate-caret-width)]">
              <div
                className="absolute inset-0 bg-[var(--surface-container-stroke)]"
                style={{ clipPath: CARET_OUTER }}
              />
              <div
                className="absolute left-[var(--plate-caret-inner-inset-x)] top-[var(--plate-caret-inner-inset-y)] h-[var(--plate-caret-inner-height)] w-[var(--plate-caret-inner-width)] bg-[var(--surface-card)]"
                style={{ clipPath: CARET_INNER }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





