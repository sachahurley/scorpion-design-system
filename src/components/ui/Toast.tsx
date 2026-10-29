/**
 * TOAST COMPONENT
 *
 * Transient feedback plates, upstreamed from the portfolio's XP toaster.
 * A Toast is a small plate (ring recipe: ring layer + fill inset 1px) that
 * rises from the bottom edge on a stepped transition: steps(), not an ease,
 * so the plate hops on the pixel grid like the rest of the system's art.
 *
 * Don't use this for: errors that require action (use Alert), or anything
 * the user must read before continuing (use Modal).
 *
 * TWO WAYS TO DRIVE IT:
 * 1. Imperative (recommended): mount `<Toaster />` once near the app root,
 *    then call `toast("Saved")`, `toast.success(...)`, `toast.error(...)`
 *    from anywhere, including outside React. `useToast()` exposes the same
 *    queue to components that want to read it.
 * 2. Controlled (original API): `<Toaster toasts={...} onDismiss={...} />`
 *    renders a queue the app owns. Items only auto-dismiss when they set a
 *    `duration`, so existing callers keep their own timing.
 *
 * VARIANTS: default | success | warning | error | info, with the same 1-bit
 * severity icons and semantic colors as Alert (default Bell, info Info,
 * success CheckCircle, warning AlertTriangle, error AlertCircle).
 *
 * TIMING: imperative toasts auto-dismiss after 5000ms; the timer pauses while
 * the plate is hovered or holds focus, and `duration: Infinity` persists
 * the toast (it then shows a dismiss button so keyboard users can close it).
 *
 * ACCESSIBILITY: the region is `aria-live="polite"`; error toasts are
 * `role="alert"` (announced immediately), all others `role="status"`.
 *
 * TOKENS USED:
 * - plate.round (silhouette); default: border.hairline (ring), surface.muted (fill)
 * - variants: success / warning / error / info 50, 300, 700, 950 scales (as Alert)
 * - text.primary, duration.normal + steps(5) (motion), focus.ring.*
 * - z-index.popover (toasts stack above modals by decision)
 */

import { useEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type ReactNode } from "react";
import { TuiIcon, type TuiIconName } from "./TuiIcon";

/** Severity of a toast; picks the icon, colors, and live-region role. */
export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

/** A single inline action on a toast, e.g. `{ label: "Undo", onClick: restore }`. */
export interface ToastAction {
  /** Short verb shown as the button text ("Undo", "Retry", "View"). */
  label: string;
  /** Runs when the action is pressed; the toast dismisses itself afterwards. */
  onClick: () => void;
}

/** A single toast entry rendered by the Toaster region. */
export interface ToastItem {
  /** Stable key for the toast (also used by dismissal callbacks). */
  id: string | number;
  /** Toast content. Keep it to one short line. */
  message: ReactNode;
  /** Severity (default: "default"). "error" is announced assertively. */
  variant?: ToastVariant;
  /** Optional inline action, such as Undo. */
  action?: ToastAction;
  /**
   * Milliseconds before auto-dismiss; `Infinity` persists. Omit on
   * controlled items to keep managing timing yourself.
   */
  duration?: number;
}

export interface ToasterProps {
  /**
   * Controlled mode: the toasts to render, oldest first (the newest renders
   * closest to the screen edge). Omit to render the imperative `toast()` queue.
   */
  toasts?: ToastItem[];
  /**
   * Controlled mode: called when a toast is clicked, its action runs, or its
   * `duration` elapses. Ignored in imperative mode (the queue dismisses itself).
   */
  onDismiss?: (id: ToastItem["id"]) => void;
}

export interface ToastProps {
  /** Toast content. Keep it to one short line. */
  children: ReactNode;
  /** Called when the plate is clicked (pointer shortcut; wire to dismiss). */
  onClick?: () => void;
  /** Severity (default: "default"): icon, colors, and `role` (error = alert). */
  variant?: ToastVariant;
  /** Optional inline action button, such as Undo. Pressing it also dismisses. */
  action?: ToastAction;
  /**
   * Auto-dismiss after this many ms, paused on hover and focus. `Infinity`
   * persists and shows a dismiss button. Needs `onDismiss`.
   */
  duration?: number;
  /** Removes the toast (timer, action, or the dismiss button call it). */
  onDismiss?: () => void;
}

// Same icon per severity as Alert, so the two read as one family.
const VARIANT_ICONS: Record<ToastVariant, TuiIconName> = {
  default: "Bell",
  success: "CheckCircle",
  warning: "AlertTriangle",
  error: "AlertCircle",
  info: "Info",
};

// PLATE RING RECIPE per variant: `ring` paints the outer layer, `fill` the
// inner layer 1px inset. Colors match Alert's semantic pairs.
const VARIANT_STYLES: Record<ToastVariant, { ring: string; fill: string; icon: string; text: string }> = {
  default: {
    ring: "bg-[var(--border-hairline)]",
    fill: "bg-[var(--surface-muted)]",
    icon: "text-secondary-800 dark:text-secondary-300",
    text: "text-[var(--text-primary)]",
  },
  success: {
    ring: "bg-success-300 dark:bg-success-700",
    fill: "bg-success-50 dark:bg-success-950",
    icon: "text-success-800 dark:text-success-400",
    text: "text-success-900 dark:text-success-50",
  },
  warning: {
    ring: "bg-warning-300 dark:bg-warning-700",
    fill: "bg-warning-50 dark:bg-warning-950",
    icon: "text-warning-800 dark:text-warning-400",
    text: "text-warning-900 dark:text-warning-50",
  },
  error: {
    ring: "bg-error-300 dark:bg-error-700",
    fill: "bg-error-50 dark:bg-error-950",
    icon: "text-error-700 dark:text-error-400",
    text: "text-error-900 dark:text-error-50",
  },
  info: {
    ring: "bg-info-300 dark:bg-info-700",
    fill: "bg-info-50 dark:bg-info-950",
    icon: "text-info-800 dark:text-info-400",
    text: "text-info-900 dark:text-info-50",
  },
};

// Small text buttons inside the plate: a 44px-tall invisible hit area
// (pseudo-element, layout unchanged) and the system's inset focus ring.
const INLINE_BUTTON = `
  relative shrink-0 inline-flex items-center px-1 font-mono text-sm font-bold cursor-pointer
  before:content-[''] before:absolute before:inset-x-0 before:top-1/2 before:-translate-y-1/2 before:h-touch
  focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]
`;

/**
 * A single toast plate. Usually rendered via `Toaster`, but exported for
 * custom placements. Announced via `role="status"` (`role="alert"` for errors).
 */
export function Toast({ children, onClick, variant = "default", action, duration, onDismiss }: ToastProps) {
  // Rise-in: start below, hop up on mount. steps(5) matches the portfolio's
  // "physical plate" motion: no fade, position snaps on a pixel grid.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // AUTO-DISMISS with pause: the remaining time survives hover/focus pauses.
  // onDismiss lives in a ref so a new callback identity (inline arrows in the
  // parent) doesn't restart the clock.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });
  const remaining = useRef(duration ?? 0);
  useEffect(() => {
    remaining.current = duration ?? 0;
  }, [duration]);
  useEffect(() => {
    if (paused || duration == null || !Number.isFinite(duration) || !onDismissRef.current) return;
    const started = Date.now();
    const id = setTimeout(() => onDismissRef.current?.(), Math.max(0, remaining.current));
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - started;
    };
  }, [paused, duration]);

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  const styles = VARIANT_STYLES[variant];
  const persistent = duration === Infinity && onDismiss != null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- pointer shortcut to dismiss; the dismiss and action buttons are the keyboard path
    <div
      role={variant === "error" ? "alert" : "status"}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      className={`
        plate-round p-px ${styles.ring}
        transition-transform [transition-duration:var(--duration-normal)] [transition-timing-function:steps(5)]
        ${entered ? "translate-y-0" : "translate-y-16"}
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      <div
        className={`plate-round flex max-w-[min(28rem,calc(100vw-2rem))] items-center gap-2 px-3 py-2.5 font-mono text-sm ${styles.fill} ${styles.text}`}
      >
        <span className={`inline-flex shrink-0 ${styles.icon}`}>
          <TuiIcon name={VARIANT_ICONS[variant]} size="4" />
        </span>
        <span className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">{children}</span>
        {action && (
          <button
            type="button"
            className={`${INLINE_BUTTON} underline underline-offset-2`}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              onDismiss?.();
            }}
          >
            {action.label}
          </button>
        )}
        {persistent && (
          <button
            type="button"
            aria-label="Dismiss notification"
            className={INLINE_BUTTON}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
          >
            <TuiIcon name="X" size="3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Imperative queue: a module-level store, so toast() works anywhere.  */
/* ------------------------------------------------------------------ */

/** Options for `toast()`; everything but the message is optional. */
export interface ToastOptions {
  /** Severity (default: "default"). The `toast.success()` style helpers set it for you. */
  variant?: ToastVariant;
  /** Optional inline action, such as Undo. */
  action?: ToastAction;
  /** Milliseconds before auto-dismiss (default 5000); `Infinity` persists. */
  duration?: number;
  /** Reuse an id to replace a toast in place (e.g. "Saving..." then "Saved"). */
  id?: ToastItem["id"];
}

type ShowToast = (message: ReactNode, options?: Omit<ToastOptions, "variant">) => ToastItem["id"];

/** The `toast` function plus its severity helpers and `dismiss`. */
export interface ToastApi {
  /** Queues a toast and returns its id. Needs a mounted `<Toaster />` to be seen. */
  (message: ReactNode, options?: ToastOptions): ToastItem["id"];
  /** Queues a success toast (CheckCircle, green). */
  success: ShowToast;
  /** Queues a warning toast (AlertTriangle, purple). */
  warning: ShowToast;
  /** Queues an error toast (AlertCircle, red), announced with `role="alert"`. */
  error: ShowToast;
  /** Queues an info toast (Info, blue). */
  info: ShowToast;
  /** Removes one toast by id, or every toast when called without one. */
  dismiss: (id?: ToastItem["id"]) => void;
}

const DEFAULT_DURATION = 5000;
const EMPTY: ToastItem[] = [];
let queue: ToastItem[] = EMPTY;
let seq = 0;
const listeners = new Set<() => void>();

function setQueue(next: ToastItem[]) {
  queue = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => queue;
const getServerSnapshot = () => EMPTY;

function show(message: ReactNode, options: ToastOptions = {}): ToastItem["id"] {
  const { id = `toast-${++seq}`, duration = DEFAULT_DURATION, ...rest } = options;
  setQueue([...queue.filter((t) => t.id !== id), { id, message, duration, ...rest }]);
  return id;
}

function dismiss(id?: ToastItem["id"]) {
  setQueue(id === undefined ? EMPTY : queue.filter((t) => t.id !== id));
}

/**
 * Queue a toast from anywhere. Render `<Toaster />` once (no props) to show them.
 *
 * @example
 * toast("Link copied");
 * toast.success("Profile saved");
 * toast.error("Upload failed", { action: { label: "Retry", onClick: retry } });
 * toast("Item deleted", { action: { label: "Undo", onClick: restore }, duration: 8000 });
 * const id = toast("Syncing", { duration: Infinity }); toast.dismiss(id);
 */
export const toast: ToastApi = Object.assign(show, {
  success: (message: ReactNode, options?: Omit<ToastOptions, "variant">) => show(message, { ...options, variant: "success" }),
  warning: (message: ReactNode, options?: Omit<ToastOptions, "variant">) => show(message, { ...options, variant: "warning" }),
  error: (message: ReactNode, options?: Omit<ToastOptions, "variant">) => show(message, { ...options, variant: "error" }),
  info: (message: ReactNode, options?: Omit<ToastOptions, "variant">) => show(message, { ...options, variant: "info" }),
  dismiss,
});

/**
 * Reads the imperative toast queue from a component (e.g. to render a
 * custom region or show a count). Returns the live `toasts` plus the same
 * `toast` and `dismiss` functions exported at module level.
 */
export function useToast() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { toasts, toast, dismiss };
}

/**
 * Fixed toast region, bottom-center. Screen readers hear new toasts via the
 * polite live region (errors assertively via `role="alert"`); pointer users
 * can click a plate to dismiss it.
 *
 * - `<Toaster />`: renders the imperative `toast()` queue.
 * - `<Toaster toasts={...} onDismiss={...} />`: renders a queue the app owns.
 *
 * @param toasts - Controlled queue; omit for the imperative queue
 * @param onDismiss - Controlled dismissal callback
 */
export function Toaster({ toasts, onDismiss }: ToasterProps) {
  const queued = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const controlled = toasts !== undefined;
  const items = controlled ? toasts : queued;
  const handleDismiss = controlled ? onDismiss : dismiss;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      style={{ zIndex: "var(--z-index-popover)" }}
    >
      {items.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          action={t.action}
          duration={t.duration}
          onClick={handleDismiss ? () => handleDismiss(t.id) : undefined}
          onDismiss={handleDismiss ? () => handleDismiss(t.id) : undefined}
        >
          {t.message}
        </Toast>
      ))}
    </div>
  );
}
