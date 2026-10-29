/**
 * BOTTOM SHEET COMPONENT
 *
 * A bottom-anchored panel, upstreamed from the portfolio's iOS-style sheet.
 * The sheet is a large plate whose top corners step (--plate-round-lg-top)
 * while the bottom edge squares off against the viewport, built with the
 * ring recipe (stroke layer + fill layer, since clip-path slices borders).
 *
 * Don't use this for: blocking confirmations (use Modal) or persistent
 * navigation. Sheets are for menus and quick actions that dismiss easily.
 *
 * FEATURES:
 * - Scrim backdrop (surface.overlay), click or ESC to close
 * - Visible close button (1-bit X, 44px target) in the top-right of the header band
 * - Focus moves onto the sheet on open and returns to the invoker on close
 * - Focus trap: Tab and Shift+Tab cycle inside the sheet (it is aria-modal)
 * - Grabber marker at the top seam. It is a static marker, NOT a drag handle:
 *   there is no swipe or drag gesture, so every dismissal path is the scrim,
 *   the close button, or Escape.
 * - Slides up with the slow duration token
 * - Body scroll is locked while open
 *
 * TOKENS USED:
 * - plate.round-lg-top (silhouette), surface.container-stroke (ring), surface.card (fill)
 * - surface.overlay (scrim), z-index.overlay / z-index.modal (layers)
 * - duration.slow (enter/exit), duration.fast (close button hover)
 * - touch.target (44px close button)
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { TuiIcon } from "./TuiIcon";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useControllableState } from "@/lib/use-controllable-state";
import { warnDeprecated } from "@/lib/deprecate";

interface BottomSheetBaseProps {
  /**
   * Whether the sheet is shown. Pass it with `onOpenChange` to control the
   * sheet: set it true to open, and false when `onOpenChange(false)` fires.
   * Omit it (and use `defaultOpen`) for a sheet that manages its own state.
   */
  open?: boolean;
  /**
   * Initial open state when `open` is not passed (default false). The sheet
   * then closes itself on Escape, the scrim or the close button.
   */
  defaultOpen?: boolean;
  /**
   * Called with `false` when the user dismisses the sheet (close button, scrim
   * click or Escape). Set `open` to false here when the sheet is controlled.
   */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Use `open`. Still honoured when `open` is not passed. */
  isOpen?: boolean;
  /** @deprecated Use `onOpenChange`. Still called whenever `onOpenChange(false)` is. */
  onClose?: () => void;
  /**
   * Accessible name for the close button. Override it when several sheets can
   * be announced in the same view and "Close" alone would be ambiguous.
   */
  closeLabel?: string;
  /** Sheet content. */
  children: ReactNode;
}

/** Names the sheet with `aria-label` (the current prop). */
interface BottomSheetNamedProps extends BottomSheetBaseProps {
  /** Accessible name announced for the sheet dialog, e.g. "Site menu". Required. */
  "aria-label": string;
  /** @deprecated Use `aria-label`. Ignored when `aria-label` is passed. */
  ariaLabel?: string;
}

/** Names the sheet with the deprecated `ariaLabel`, so existing callers still type-check. */
interface BottomSheetLegacyNamedProps extends BottomSheetBaseProps {
  /** Accessible name announced for the sheet dialog, e.g. "Site menu". Required. */
  "aria-label"?: string;
  /** @deprecated Use `aria-label`. Ignored when `aria-label` is passed. */
  ariaLabel: string;
}

/**
 * Props for `BottomSheet`. An accessible name is required: pass `aria-label`
 * (or, deprecated, `ariaLabel`).
 */
export type BottomSheetProps = BottomSheetNamedProps | BottomSheetLegacyNamedProps;

/**
 * A modal panel that slides up from the bottom edge, for short tasks and option lists on narrow screens.
 *
 * @example
 * <BottomSheet open={open} onOpenChange={setOpen} aria-label="Site menu">
 *   <nav>...</nav>
 * </BottomSheet>
 */
export function BottomSheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  isOpen: isOpenProp,
  onClose,
  "aria-label": ariaLabelProp,
  ariaLabel: legacyAriaLabel,
  closeLabel = "Close",
  children,
}: BottomSheetProps) {
  if (isOpenProp !== undefined) warnDeprecated("BottomSheet", "isOpen", "open");
  if (onClose !== undefined) warnDeprecated("BottomSheet", "onClose", "onOpenChange");
  if (legacyAriaLabel !== undefined) warnDeprecated("BottomSheet", "ariaLabel", "aria-label");
  const ariaLabel = ariaLabelProp ?? legacyAriaLabel;

  // `open` wins over the deprecated `isOpen`; passing either makes the sheet controlled.
  const [isOpen, setOpenState] = useControllableState({
    value: openProp ?? isOpenProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  // Every dismissal path (close button, Escape, scrim) lands here, so the
  // deprecated `onClose` fires exactly when `onOpenChange(false)` does.
  const requestClose = useCallback(() => {
    if (!isOpen) return;
    setOpenState(false);
    onClose?.();
  }, [isOpen, setOpenState, onClose]);

  // Stay mounted while the exit animation plays; unmount on animationend so the
  // timing always matches the CSS duration token (no JS timer to drift).
  const [visible, setVisible] = useState(isOpen);
  useEffect(() => {
    if (isOpen) setVisible(true);
  }, [isOpen]);
  const closing = visible && !isOpen;

  // FOCUS MANAGEMENT (matches Modal): once the sheet is in the DOM, move
  // focus onto it so screen readers announce the dialog and keyboard users
  // start inside it; on close, hand focus back to the invoker. Keyed on the
  // panel being mounted: `visible` flips true one render after `isOpen`.
  const sheetRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const sheetMounted = isOpen && visible;
  useEffect(() => {
    if (!sheetMounted) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    sheetRef.current?.focus();
    return () => {
      prevFocusRef.current?.focus();
      prevFocusRef.current = null;
    };
  }, [sheetMounted]);

  // FOCUS TRAP: the sheet is aria-modal="true", so Tab and Shift+Tab must cycle
  // inside it instead of reaching the page behind the scrim.
  useFocusTrap(sheetRef, sheetMounted);

  // ESC closes the sheet, matching Modal behavior
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, requestClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!visible) return null;

  return (
    <>
      {/* Scrim — overlay layer, click to dismiss */}
      <div
        className={`fixed inset-0 bg-[var(--surface-overlay)] ${
          closing ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in"
        }`}
        style={{ zIndex: "var(--z-index-overlay)", animationDuration: "var(--duration-slow)" }}
        onClick={requestClose}
        aria-hidden="true"
      />

      {/* Sheet — ring recipe on the top-only large plate; bottom edge squares
          off against the viewport, so the ring layer needs no bottom padding.
          Centered with inset-x-0 + mx-auto (NOT a translate): the slide
          animation interpolates the transform, so a -translate-x-1/2 centering
          would make the sheet travel diagonally instead of straight up. */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`focus:outline-none fixed bottom-0 inset-x-0 mx-auto w-[min(540px,100%)] plate-round-lg-top bg-[var(--surface-container-stroke)] pt-px px-px ${
          closing ? "animate-out slide-out-to-bottom fill-mode-forwards" : "animate-in slide-in-from-bottom"
        }`}
        style={{ zIndex: "var(--z-index-modal)", animationDuration: "var(--duration-slow)" }}
        onAnimationEnd={() => {
          if (closing) setVisible(false);
        }}
      >
        <div className="plate-round-lg-top bg-[var(--surface-card)] px-5 pb-6 pt-1 flex flex-col items-center gap-3 max-h-[70vh]">
          {/* HEADER BAND: a full 44px row so the close button gets its touch
              target without overlapping the content below it. The grabber is
              centered in the band; it is a static seam marker, not a drag
              handle (no drag gesture exists), which is why the sheet now ships
              a real close control. */}
          <div className="relative flex h-touch w-full shrink-0 items-center justify-center">
            <div className="w-9 h-1 bg-[var(--surface-container-stroke)]" aria-hidden="true" />
            <button
              type="button"
              onClick={requestClose}
              aria-label={closeLabel}
              className="absolute right-0 top-0 inline-flex h-touch w-touch items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors [transition-duration:var(--duration-fast)] focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]"
            >
              <TuiIcon name="X" size="4" />
            </button>
          </div>
          {/* Scrollable content region (focusable for keyboard scrolling) */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard-focusable (axe scrollable-region-focusable) */}
          <div className="w-full overflow-y-auto" tabIndex={0}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
