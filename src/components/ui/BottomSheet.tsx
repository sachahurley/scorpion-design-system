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

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TuiIcon } from "./TuiIcon";
import { useFocusTrap } from "@/lib/use-focus-trap";

export interface BottomSheetProps {
  /** Controls whether the sheet is visible. */
  isOpen: boolean;
  /** Called when the user dismisses the sheet (close button, scrim click or ESC). */
  onClose: () => void;
  /** Accessible name for the sheet dialog. */
  ariaLabel: string;
  /**
   * Accessible name for the close button. Override it when several sheets can
   * be announced in the same view and "Close" alone would be ambiguous.
   */
  closeLabel?: string;
  /** Sheet content. */
  children: ReactNode;
}

/**
 * A modal panel that slides up from the bottom edge, for short tasks and option lists on narrow screens.
 *
 * @param isOpen - Whether the sheet is currently visible
 * @param onClose - Callback when the user dismisses (close button, scrim click or ESC)
 * @param ariaLabel - Accessible name announced for the dialog
 * @param closeLabel - Accessible name for the close button (default "Close")
 * @param children - Sheet content
 */
export function BottomSheet({ isOpen, onClose, ariaLabel, closeLabel = "Close", children }: BottomSheetProps) {
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
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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
        onClick={onClose}
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
              onClick={onClose}
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
