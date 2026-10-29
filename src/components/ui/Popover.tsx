/**
 * POPOVER COMPONENT
 *
 * An anchored floating panel: rich, interactive content that opens next to a
 * trigger (filters, a small form, a details card). It is non-modal, like a
 * disclosure: the page stays interactive, focus is never trapped, and Tab
 * moves naturally from the trigger into the panel and back out.
 *
 * POSITIONING: written in-house (no floating-ui). The panel is fixed-position
 * and placed on `side` + `align` of the anchor; it flips to the opposite side
 * when it would overflow the viewport, shifts along the anchor to stay on
 * screen, and repositions on scroll, resize and size changes. The math lives
 * in lib/position.ts (`computePosition`) and lib/use-anchored-position.ts so
 * Combobox and future menus reuse it.
 *
 * DISMISSAL: outside click, Escape, and focus leaving both trigger and panel
 * close it. Escape and trigger toggles return focus to the trigger; an
 * outside click leaves focus where the user put it.
 *
 * SHAPE: plate ring recipe (stroke layer clipped to the plate, card fill
 * clipped 1px inset), stacked on `--z-index-popover`.
 *
 * Don't use this for: short hints (use Tooltip), action lists (use
 * Dropdown), or anything that must block the page (use Modal).
 *
 * TOKENS USED:
 * - surface.container-stroke (ring), surface.card (fill), text.primary
 * - plate.round, z-index.popover, duration.fast (fade)
 */

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  type AriaRole,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { FloatingAlign, FloatingSide } from "@/lib/position";
import { useAnchoredPosition } from "@/lib/use-anchored-position";
import { useControllableState } from "@/lib/use-controllable-state";

export type PopoverSide = FloatingSide;
export type PopoverAlign = FloatingAlign;

export interface PopoverProps {
  /** Controlled open state. Pair with `onOpenChange`; omit for uncontrolled use. */
  open?: boolean;
  /** Initial open state when uncontrolled (default false). */
  defaultOpen?: boolean;
  /** Called whenever the popover asks to open or close (trigger, Escape, outside click, blur). */
  onOpenChange?: (open: boolean) => void;
  /**
   * The element that toggles the popover, usually a `Button`. It receives
   * `aria-expanded`, `aria-controls` and `aria-haspopup`, and a click handler
   * that toggles the panel (your own `onClick` still runs first).
   */
  trigger?: ReactElement;
  /**
   * Position against an element you render yourself instead of `trigger`
   * (e.g. an input). Clicks inside the anchor never count as outside clicks.
   * You own opening and ARIA wiring in that case.
   */
  anchorRef?: RefObject<HTMLElement | null>;
  /** Panel content. */
  children: ReactNode;
  /** Preferred side of the anchor (default "bottom"). Flips when there is no room. */
  side?: PopoverSide;
  /** Alignment along the anchor edge (default "start"). */
  align?: PopoverAlign;
  /** Gap between anchor and panel in px (default 8, one plate step multiple). */
  offset?: number;
  /** Close when the user presses outside the trigger and panel (default true). */
  closeOnOutsideClick?: boolean;
  /** Close on Escape (default true). */
  closeOnEscape?: boolean;
  /**
   * Move focus into the panel on open: the first focusable element, else the
   * panel itself (default true). Set false for panels that must leave focus
   * on the anchor, like a combobox listbox.
   */
  autoFocus?: boolean;
  /** Send focus back to the trigger when closed via Escape or the trigger (default true). */
  returnFocus?: boolean;
  /** Make the panel at least as wide as the anchor (default false). */
  matchAnchorWidth?: boolean;
  /**
   * ARIA role of the panel (default "dialog", a non-modal dialog). Pass
   * `null` when the content carries its own role (a listbox, a menu).
   */
  role?: AriaRole | null;
  /** Accessible name for the panel. Required for `role="dialog"` unless `aria-labelledby` is set. */
  "aria-label"?: string;
  /** Id of a visible heading inside the panel that names it. */
  "aria-labelledby"?: string;
  /** Id for the panel; generated when omitted. */
  id?: string;
  /** Extra classes for the outer ring layer (width, max-width). */
  className?: string;
  /** Extra classes for the inner fill (padding, layout). Defaults to `p-4`. */
  contentClassName?: string;
  /**
   * Render the panel into `document.body` (default false). Turn this on
   * inside plate-clipped containers (Card, Modal): clip-path clips even
   * fixed-position descendants. Inline rendering keeps DOM order, so Tab
   * flows from the trigger into the panel; a portaled panel relies on
   * `autoFocus` instead.
   */
  portal?: boolean;
  /** Extra classes for the span that wraps `trigger`. */
  triggerWrapperClassName?: string;
}

type CloseReason = "trigger" | "escape" | "outside" | "blur" | "programmatic";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A non-modal panel anchored to a trigger, for interactive content (filters, a short form) that a `Tooltip` cannot hold.
 *
 * @example
 * <Popover trigger={<Button variant="secondary">Filters</Button>} aria-label="Filters">
 *   <Checkbox label="Only open issues" />
 * </Popover>
 *
 * @param trigger - Element that toggles the panel (or use `anchorRef`)
 * @param open / defaultOpen / onOpenChange - Controlled or uncontrolled state
 * @param side / align - Preferred placement; flips and shifts to stay on screen
 * @param role - Panel role, "dialog" by default
 */
export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  anchorRef,
  children,
  side = "bottom",
  align = "start",
  offset = 8,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  autoFocus = true,
  returnFocus = true,
  matchAnchorWidth = false,
  role = "dialog",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  id: idProp,
  className,
  contentClassName,
  triggerWrapperClassName,
  portal = false,
}: PopoverProps) {
  const [open, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const autoId = useId();
  const panelId = idProp ?? `${autoId}-popover`;
  const triggerWrapperRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeReasonRef = useRef<CloseReason>("programmatic");

  // The element positioned against and returned to: the consumer's anchor,
  // else the trigger element itself (first child of our wrapper span).
  const anchor = useMemo<RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        return (
          anchorRef?.current ??
          (triggerWrapperRef.current?.firstElementChild as HTMLElement | null) ??
          triggerWrapperRef.current
        );
      },
    }),
    [anchorRef]
  );

  const { position } = useAnchoredPosition({ open, anchorRef: anchor, floatingRef: panelRef, side, align, offset });

  const close = (reason: CloseReason) => {
    closeReasonRef.current = reason;
    setOpenState(false);
  };

  const isInside = (node: Node | null) =>
    node != null &&
    (panelRef.current?.contains(node) ||
      triggerWrapperRef.current?.contains(node) ||
      anchorRef?.current?.contains(node) ||
      false);

  // Outside press closes (mousedown, so it fires before focus moves)
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDown = (e: MouseEvent) => {
      if (!isInside(e.target as Node)) close("outside");
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, closeOnOutsideClick]);

  // Escape closes when the key comes from the popover, its trigger, or the page body
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const target = e.target as Node | null;
      if (isInside(target) || target === document.body || target === document.documentElement) {
        close("escape");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape]);

  // Focus in on open; back to the trigger on close (except outside press / blur)
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current) {
      closeReasonRef.current = "programmatic";
      if (autoFocus && panelRef.current) {
        const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? panelRef.current).focus({ preventScroll: true });
      }
    }
    if (!open && wasOpen.current && returnFocus) {
      const reason = closeReasonRef.current;
      const active = document.activeElement;
      const focusIsLost = active == null || active === document.body;
      if (reason !== "outside" && reason !== "blur" && (focusIsLost || isInside(active))) {
        anchor.current?.focus({ preventScroll: true });
      }
    }
    wasOpen.current = open;
  }, [open]);

  // Focus leaving both trigger and panel (Tab past the end) closes, non-trapping
  const handlePanelBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !isInside(next)) close("blur");
  };

  const triggerEl =
    trigger && isValidElement(trigger)
      ? cloneElement(
          trigger as ReactElement<{
            onClick?: (e: ReactMouseEvent<HTMLElement>) => void;
            "aria-expanded"?: boolean;
            "aria-controls"?: string;
            "aria-haspopup"?: "dialog" | boolean;
          }>,
          {
            "aria-expanded": open,
            "aria-controls": open ? panelId : undefined,
            "aria-haspopup": role === "dialog" ? "dialog" : undefined,
            onClick: (e: ReactMouseEvent<HTMLElement>) => {
              (trigger.props as { onClick?: (e: ReactMouseEvent<HTMLElement>) => void }).onClick?.(e);
              if (e.defaultPrevented) return;
              if (open) close("trigger");
              else setOpenState(true);
            },
          }
        )
      : null;

  const renderPanel = (node: ReactElement) =>
    portal && typeof document !== "undefined" ? createPortal(node, document.body) : node;

  const panelStyle: CSSProperties = {
    position: "fixed",
    top: position?.top ?? 0,
    left: position?.left ?? 0,
    zIndex: "var(--z-index-popover)" as unknown as number,
    minWidth: matchAnchorWidth && position ? position.anchorWidth : undefined,
    animationDuration: "var(--duration-fast)",
    // Exposed so content can cap its height to the room on the chosen side
    ["--popover-available-height" as string]: position ? `${position.available}px` : undefined,
  };

  return (
    <>
      {triggerEl && (
        <span ref={triggerWrapperRef} className={cn("inline-flex", triggerWrapperClassName)}>
          {triggerEl}
        </span>
      )}
      {open && renderPanel(
        <div
          ref={panelRef}
          id={panelId}
          role={role ?? undefined}
          aria-label={role ? ariaLabel : undefined}
          aria-labelledby={role ? ariaLabelledBy : undefined}
          tabIndex={-1}
          data-side={position?.side ?? side}
          data-align={align}
          onBlur={handlePanelBlur}
          style={panelStyle}
          className={cn(
            "w-max max-w-[calc(100vw-1rem)] plate-round p-px bg-[var(--surface-container-stroke)] focus:outline-none",
            "animate-in fade-in motion-reduce:animate-none",
            // Measured before it is shown, so it never flashes at 0,0
            position ? "opacity-100" : "opacity-0",
            className
          )}
        >
          <div
            className={cn(
              "plate-round bg-[var(--surface-card)] p-4 font-mono text-sm text-[var(--text-primary)]",
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
}

Popover.displayName = "Popover";
