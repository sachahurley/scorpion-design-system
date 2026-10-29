/**
 * MODAL COMPONENT
 * 
 * A reusable modal dialog component with backdrop overlay
 * Built entirely from design tokens defined in tokens.json
 * 
 * FEATURES:
 * - Fixed header with title and a secondary-plate close button (always visible)
 * - Optional fixed footer band for CTAs via `footerContent`
 * - Scrollable content area (the panel is capped at 80vh; the body takes
 *   whatever is left after the header and optional footer and scrolls)
 * - Fades in on open and out on close (duration.normal); stays mounted
 *   through the exit animation and unmounts on animationend
 * - Focus trap: while modal, Tab and Shift+Tab cycle inside the panel
 * - Backdrop scrim (semi-transparent overlay)
 * - `docked` variant: at or above the `--breakpoint-docked` token (960px) the
 *   panel skips the scrim and pins bottom-center as a NON-modal dialog (no
 *   aria-modal, no scroll lock, page stays interactive), so the content behind
 *   stays in view while the dialog acts on it. Below it docked falls back to
 *   the standard centered modal, so consumers never branch on breakpoint
 *   themselves.
 * - Drop shadow using elevation tokens
 * - Click outside to close
 * - ESC key to close
 * - Full light/dark theme support
 * 
 * DIMENSIONS:
 * - Width: `size` sm 360px, md 640px, lg 740px (default), full viewport
 * - Max height: 80% of viewport height
 *
 * SHAPE: the panel is a large plate (--plate-round-lg, stepped one-bit corners)
 * built with the ring recipe — outer layer is the stroke color clipped to the
 * plate, inner layer is the card fill clipped 1px inset (clip-path slices real
 * borders, so a border property cannot draw the ring).
 *
 * TOKENS USED:
 * - breakpoint.docked: the width at which `docked` takes effect
 * - surface.card, surface.container-stroke, surface.overlay
 * - text.primary (title)
 * - plate.round-lg: panel silhouette
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { TuiIcon } from "./TuiIcon";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useControllableState } from "@/lib/use-controllable-state";
import { warnDeprecated } from "@/lib/deprecate";

/**
 * Value of `global.breakpoint.docked` in tokens.json, used only where the
 * stylesheet cannot be read (SSR, jsdom test runners). Keep it in step with
 * `--breakpoint-docked`; the drift test in @scorp-ds/tokens guards the token
 * itself, and this is the last-resort copy.
 */
const DOCKED_BREAKPOINT_FALLBACK_PX = 960;

/**
 * Builds the docked media query from the `--breakpoint-docked` token on the
 * document element, so the switch point lives in tokens.json rather than being
 * typed into this component. Falls back to the token's current value when
 * there is no document or the stylesheet has not been loaded.
 */
function dockedMediaQuery(): string {
  let px = DOCKED_BREAKPOINT_FALLBACK_PX;
  if (typeof document !== "undefined") {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-docked");
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) px = parsed;
  }
  return `(min-width: ${px}px)`;
}

/**
 * Panel width per `size`, a five-step scale chosen from the widths consumers
 * actually use. `xl` (740px) is the long-standing default; `lg` is the docked
 * compare card; `md` a picker or a short form; `sm` a confirmation; `xs` a
 * celebratory notice. `full` asks for the whole viewport and is capped by
 * `max-w-full` (the scrim padding, or the viewport when docked). There are no
 * width tokens: like the old `width` default, these are component geometry.
 */
const MODAL_WIDTHS = {
  xs: "320px",
  sm: "360px",
  md: "440px",
  lg: "640px",
  xl: "740px",
  full: "100vw",
} as const;

export interface ModalProps {
  /**
   * Whether the dialog is shown. Pass it with `onOpenChange` to control the
   * dialog: set it true to open, and false when `onOpenChange(false)` fires.
   * Omit it (and use `defaultOpen`) for a dialog that manages its own state.
   */
  open?: boolean;
  /**
   * Initial open state when `open` is not passed (default false). The dialog
   * then closes itself on Escape, the scrim or the close button.
   */
  defaultOpen?: boolean;
  /**
   * Called with `false` when the user asks to close (close button, Escape, or
   * a scrim click). Set `open` to false here when the dialog is controlled.
   */
  onOpenChange?: (open: boolean) => void;
  /** Heading in the fixed header; also the dialog's accessible name, so make it say what the dialog is for. */
  title: string;
  /** Body content. It scrolls inside the panel when it is taller than the viewport allows; header and footer stay fixed. */
  children: ReactNode;
  /**
   * Optional fixed footer for CTAs. Render DS Buttons here (e.g. a secondary
   * "Cancel" + primary confirm); actions align to the right on a subtle band.
   */
  footerContent?: ReactNode;
  /**
   * Panel width: `xs` (320px) for a one-line notice or reward, `sm` (360px)
   * for a confirmation, `md` (440px) for a picker or short form, `lg` (640px)
   * for a compare card or a form with sections, `xl` (740px, the default when
   * neither `size` nor `width` is passed) for a full task, `full` for the whole
   * viewport width. The panel never grows past the viewport.
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  /**
   * @deprecated Use `size`. Still honoured when `size` is not passed:
   * numbers are px, strings pass through.
   */
  width?: number | string;
  /**
   * Dock instead of covering: at or above the `--breakpoint-docked` token
   * (960px) the panel pins bottom-center with no scrim and no scroll lock (a
   * non-modal dialog), keeping the page behind visible and interactive. Below
   * it this is ignored and the standard centered modal renders, so the
   * responsive fallback lives here, not in the consumer.
   */
  docked?: boolean;
}

/**
 * A dialog that interrupts the page for a focused task or a confirmation; it traps focus (except when `docked`) and closes on Escape, the scrim or the close button.
 */
export function Modal({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  children,
  footerContent,
  size,
  width,
  docked = false,
}: ModalProps) {
  if (width !== undefined) warnDeprecated("Modal", "width", "size");

  // Passing `open` makes the dialog controlled.
  const [isOpen, setOpenState] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  // Every dismissal path (close button, Escape, scrim) lands here.
  const requestClose = useCallback(() => {
    if (!isOpen) return;
    setOpenState(false);
  }, [isOpen, setOpenState]);

  // `size` wins over the deprecated `width`; with neither, the panel is `xl`.
  const panelWidth =
    size !== undefined || width === undefined
      ? MODAL_WIDTHS[size ?? "xl"]
      : typeof width === "number"
        ? `${width}px`
        : width;

  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Stay mounted while the exit fade plays; unmount on animationend so the
  // timing always matches the CSS duration token (same pattern as BottomSheet).
  const [visible, setVisible] = useState(isOpen);
  useEffect(() => {
    if (isOpen) setVisible(true);
  }, [isOpen]);
  const closing = visible && !isOpen;

  // Docked applies on wide viewports only; below the breakpoint the docked
  // request degrades to the standard centered modal. The width comes from the
  // --breakpoint-docked token. Environments without matchMedia (SSR, jsdom
  // test runners) fall back to the centered modal.
  const dockedQuery = useMemo(dockedMediaQuery, []);
  const [wideViewport, setWideViewport] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" &&
      window.matchMedia(dockedQuery).matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(dockedQuery);
    const onChange = () => setWideViewport(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [dockedQuery]);
  const isDocked = docked && wideViewport;

  // FOCUS MANAGEMENT: on open, remember the invoker and move focus into the
  // dialog (the panel itself, so screen readers announce the dialog name);
  // on close, hand focus back to wherever the user was. Keyed on the panel
  // actually being mounted: on the render where `isOpen` flips true,
  // `visible` is still false and the panel isn't in the DOM yet.
  const panelMounted = isOpen && visible;
  useEffect(() => {
    if (panelMounted) {
      prevFocusRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
      return () => {
        prevFocusRef.current?.focus();
        prevFocusRef.current = null;
      };
    }
  }, [panelMounted]);

  // FOCUS TRAP: a dialog with aria-modal="true" promises nothing behind it is
  // reachable, so Tab and Shift+Tab cycle inside the panel. The docked variant
  // is deliberately non-modal (the page behind stays interactive), so it never
  // traps.
  useFocusTrap(panelRef, panelMounted && !isDocked);


  // EFFECT: Handle ESC key press to close modal
  // This listens for keyboard events and closes the modal when ESC is pressed
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    // Only add listener when modal is open
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    // Cleanup: Remove listener when modal closes or component unmounts
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, requestClose]);

  // EFFECT: Prevent body scroll when modal is open. Docked mode is
  // non-modal, so the page keeps scrolling underneath.
  useEffect(() => {
    if (isOpen && !isDocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup: Restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isDocked]);

  // Fully unmounted only after the exit fade has finished
  if (!visible) return null;

  // MODAL CONTAINER — plate ring recipe
  // - Outer layer: stroke color clipped to the large plate (the ring)
  // - Inner layer: card fill clipped 1px inset (p-px on the outer)
  // - Clicking inside the panel does NOT close it (stopPropagation)
  const panel = (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- stops backdrop clicks inside the panel; Escape and the close button are the keyboard path
        <div
          ref={panelRef}
          tabIndex={-1}
          className="max-w-full max-h-[80vh] plate-round-lg p-px bg-[var(--surface-container-stroke)] flex focus:outline-none"
          style={{ width: panelWidth }}
          role="dialog"
          aria-modal={isDocked ? undefined : "true"}
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
        <div className="w-full plate-round-lg bg-[var(--surface-card)] flex flex-col overflow-hidden">
          {/* 
            FIXED HEADER
            - Always visible at top (does not scroll)
            - Contains title on left, close button on right
            - Flexbox layout for positioning
            - Padding: 24px horizontal (px-6), 20px vertical (py-5)
            - Border bottom separates header from content
          */}
          {/* Header — plain title (box-drawing decoration retired with the TUI tier) */}
          <div className="flex items-center justify-between px-6 py-5 border-b-[length:var(--border-width-hairline)] border-solid border-[var(--surface-container-stroke)]">
            <h2 className="text-base font-mono text-[var(--text-primary)] font-medium flex-1 min-w-0 truncate">
              {title}
            </h2>

            {/*
              Close control: icon-only secondary plate button (square, gold drawn X).

              HIT AREA: the button is 32px (size-control-sm) and is plate-clipped,
              and a clip-path slices the button's own pseudo-elements, so the
              44x44 hit area lives on this unclipped wrapper instead (same idea as
              Checkbox, which hangs the pseudo off the wrapper outside the plate).
              The wrapper forwards only clicks that land on the pseudo ring
              (target === the wrapper itself); clicks on the button bubble up with
              a different target and are ignored, so the close fires exactly once.
            */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- enlarges the close button hit area for pointers; the button itself is the keyboard path */}
            <span
              className="relative ml-4 inline-flex shrink-0 before:content-[''] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-touch before:h-touch"
              onClick={(e) => {
                if (e.target === e.currentTarget) requestClose();
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={requestClose}
                aria-label="Close modal"
              >
                <TuiIcon name="X" />
              </Button>
            </span>
          </div>

          {/* 
            SCROLLABLE CONTENT AREA
            - Takes remaining height after header
            - Scrolls vertically when content exceeds available space
            - Padding: 24px horizontal (px-6), 20px vertical (py-5), matching the header
            - overflow-y-auto adds scrollbar only when needed
          */}
          {/* tabIndex allows keyboard focus into the scroll region (axe scrollable-region-focusable / Safari). */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable (axe scrollable-region-focusable) */}
          <div className="overflow-y-auto px-6 py-5" tabIndex={0}>
            {children}
          </div>

          {/* Optional fixed footer — CTA band, actions right-aligned. Same
              card fill as the header (no tint), separated by the hairline. */}
          {footerContent && (
            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t-[length:var(--border-width-hairline)] border-solid border-[var(--surface-container-stroke)]">
              {footerContent}
            </div>
          )}
        </div>
        </div>
  );

  // DOCKED (wide viewports): no scrim, no backdrop click-away — the panel
  // floats bottom-center over a live page. Elevation is a drop-shadow, not
  // the boxShadow tokens: the plate clip-path slices box shadows off, and
  // drop-shadow follows the stepped silhouette (values track
  // elevation.high's dark blur).
  // Centered with inset-x-0 + mx-auto (NOT a translate): the enter/exit
  // animations interpolate the transform, so a -translate-x-1/2 centering
  // would make the panel slide in from the side instead of fading in place.
  if (isDocked) {
    return (
      <div
        className={`fixed inset-x-0 mx-auto w-fit max-w-full ${
          closing ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in"
        }`}
        style={{
          zIndex: "var(--z-index-modal)",
          bottom: "var(--spacing-12)",
          animationDuration: "var(--duration-normal)",
          filter: "var(--elevation-docked-filter)",
        }}
        onAnimationEnd={() => {
          if (closing) setVisible(false);
        }}
      >
        {panel}
      </div>
    );
  }

  return (
    <>
      {/*
        BACKDROP / SCRIM
        - Full-screen semi-transparent overlay
        - Covers entire viewport with dark shade (including sidebar)
        - Clicking it closes the modal
        - Uses fade-in/fade-out animation
        - Uses z-index token for modal layer (1040) to ensure it covers sidebar
      */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop click to close; Escape and the close button are the keyboard path */}
      <div
        className={`fixed inset-0 flex items-center justify-center p-5 bg-[var(--surface-overlay)] ${
          closing ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in"
        }`}
        style={{ zIndex: "var(--z-index-modal)", animationDuration: "var(--duration-normal)" }}
        onClick={requestClose}
        onAnimationEnd={() => {
          if (closing) setVisible(false);
        }}
      >
        {panel}
      </div>
    </>
  );
}

