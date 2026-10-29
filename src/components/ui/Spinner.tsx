/**
 * SPINNER COMPONENT
 *
 * TUI loading indicator in the 1-bit icon language: eight square dots on an
 * 8x8 pixel grid (the terminal "dots" spinner, drawn as crisp SVG squares
 * like TuiIcon) with a two-dot gap that steps around the ring. Frames step,
 * they never ease, so the motion hops on the pixel grid like the plates.
 * It paints with `currentColor`, so inside a Button, a Toast, or a table
 * cell it takes on that surface's text color.
 *
 * SIZES (box matches the TuiIcon scale; whole-pixel steps keep edges sharp):
 * - sm: 12px, for inline text and 32px controls
 * - md: 16px (default), for 40px controls
 * - lg: 24px, for 48px controls and empty states
 *
 * ACCESSIBILITY:
 * - role="status" with a visually hidden `label` (default "Loading"), so a
 *   screen reader hears what is loading once, not the frames.
 * - The graphic is aria-hidden.
 * - prefers-reduced-motion: the spinner holds a static frame (the full
 *   ring) instead of cycling.
 *
 * TOKENS USED: color inherits (currentColor); no timing token applies to a
 * continuous loop, so the frame interval is a structural constant.
 */

import { useEffect, useState } from "react";
import { resolveSize, type ControlSizeProp } from "@/lib/size";
import { cn } from "@/lib/utils";

/** Ring dot origins on the 8x8 grid, clockwise from the top-left corner. */
const DOTS: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [3, 0], [6, 0], [6, 3], [6, 6], [3, 6], [0, 6], [0, 3],
];

/** Dots dark per frame: the gap orbits clockwise, one dot per step. */
const GAP = 2;

/** Milliseconds per frame: fast enough to read as motion, slow enough to stay calm. */
const FRAME_MS = 100;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** SVG path for one frame: every lit dot as a 2x2 square. `null` lights all eight. */
function framePath(frame: number | null): string {
  return DOTS.filter((_, i) => frame === null || (i - frame + DOTS.length) % DOTS.length >= GAP)
    .map(([x, y]) => `M${x} ${y}h2v2h-2Z`)
    .join("");
}

const FRAME_PATHS = DOTS.map((_, i) => framePath(i));
const STATIC_PATH = framePath(null);

/** Tracks the OS reduced-motion setting and updates if it changes while mounted. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export interface SpinnerProps {
  /** Box size: sm 12px (inline, 32px controls), md 16px (default), lg 24px (48px controls, empty states). */
  size?: ControlSizeProp;
  /**
   * What is loading, read by screen readers and never shown (default "Loading").
   * Be specific when several things load at once: "Loading invoices".
   */
  label?: string;
  /** Extra classes for the wrapper, e.g. a text color (`text-[var(--text-secondary)]`). */
  className?: string;
}

/**
 * A small animated indicator that something is loading.
 *
 * Use for waits of unknown length. For a button that is submitting, prefer
 * `<Button loading>`, which places a Spinner for you and keeps the button's
 * width stable.
 *
 * @param size - sm | md | lg (default: "md")
 * @param label - Visually hidden status text (default: "Loading")
 * @param className - Extra wrapper classes (color, margin)
 */
export function Spinner({ size: sizeProp = "md", label = "Loading", className }: SpinnerProps) {
  const size = resolveSize(sizeProp, "Spinner");
  const reducedMotion = usePrefersReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % DOTS.length), FRAME_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  // Box classes match TuiIcon's 3 / 4 / 6; `pixel` is one art pixel in px.
  const sizeStyles = {
    sm: { box: "w-3 h-3", pixel: 1.5 },
    md: { box: "w-4 h-4", pixel: 2 },
    lg: { box: "w-6 h-6", pixel: 3 },
  } as const;
  const { box, pixel } = sizeStyles[size];

  return (
    <span role="status" className={cn("inline-flex shrink-0 items-center justify-center", box, className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 8 8"
        width={8 * pixel}
        height={8 * pixel}
        fill="currentColor"
        shapeRendering="crispEdges"
        data-spinner-frame={reducedMotion ? "static" : frame}
      >
        <path d={reducedMotion ? STATIC_PATH : FRAME_PATHS[frame]} />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

Spinner.displayName = "Spinner";
