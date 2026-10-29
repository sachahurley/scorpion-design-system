/**
 * SKELETON COMPONENT
 *
 * Placeholder blocks that hold the shape of content while it loads, so the
 * layout does not jump when the real content arrives. Use for loads that
 * take long enough to notice (roughly 300ms and up); for short waits show
 * nothing, for known progress use ProgressBar.
 *
 * SHAPES:
 * - text: one or more text lines (`lines`); the last line of a paragraph is
 *   shorter so it reads as prose
 * - rect: a block (image, card, chart); size it with `className`
 * - avatar: a square plate matching Avatar / control heights (sm, md, lg)
 *
 * MOTION: a stepped pulse (the opacity hops in 4 steps instead of easing),
 * on the pixel-grid voice of the rest of the system. It stops entirely under
 * prefers-reduced-motion.
 *
 * ACCESSIBILITY: every Skeleton is `aria-hidden`; placeholders carry no
 * meaning. Mark the region that is loading instead:
 *
 *   <section aria-busy="true" aria-live="polite">
 *     <span className="sr-only">Loading profile</span>
 *     <Skeleton variant="avatar" />
 *     <Skeleton lines={3} />
 *   </section>
 *
 * and flip `aria-busy` to false when the real content renders.
 *
 * TOKENS USED: surface.muted (block fill), plate.round (rect / avatar
 * silhouette), control-height.sm|md|lg (avatar), duration tokens via the pulse
 */

import type { CSSProperties } from "react";
import type { ControlSize } from "@/lib/size";
import { cn } from "@/lib/utils";

export interface SkeletonProps {
  /** Placeholder shape: text lines (default), a rect block, or an avatar square. */
  variant?: "text" | "rect" | "avatar";
  /** Number of text lines for `variant="text"` (default 1). The last of several is shorter. */
  lines?: number;
  /**
   * Avatar square size: sm 32px, md 40px (default), lg 48px (control heights).
   * Only the `avatar` variant reads it: `text` and `rect` ignore it, so size those
   * with `lines` and `className`.
   */
  size?: ControlSize;
  /**
   * Whether the stepped pulse runs. Defaults to `true`; pass `false` to hold the
   * placeholder still (e.g. many skeletons on one screen). Reduced motion always
   * stops the pulse, whatever this says.
   */
  animated?: boolean;
  /** Sizing classes. Rects need a height (e.g. `h-32 w-full`); text lines take the container width. */
  className?: string;
}

const AVATAR = { sm: "size-control-sm", md: "size-control-md", lg: "size-control-lg" } as const;

// Stepped pulse: the Tailwind pulse keyframes, hopping in 4 steps instead of
// easing, so the shimmer moves like the system's other pixel-grid motion.
const STEPPED: CSSProperties = { animationTimingFunction: "steps(4, jump-none)" };

/**
 * A placeholder shape that holds the layout while content loads, drawn as text lines, a rectangle or an avatar.
 *
 * @example
 * <Skeleton lines={3} />
 * <Skeleton variant="rect" className="h-40 w-full" />
 * <Skeleton variant="avatar" size="lg" />
 *
 * @param variant - text, rect, or avatar
 * @param lines - Text line count
 * @param size - Avatar size (sm, md, lg); ignored by text and rect
 * @param animated - Stepped pulse on (default true) or off
 */
export function Skeleton({ variant = "text", lines = 1, size = "md", animated = true, className }: SkeletonProps) {
  const pulse = animated ? "animate-pulse motion-reduce:animate-none" : "";
  const style = animated ? STEPPED : undefined;

  if (variant === "text") {
    const count = Math.max(1, Math.floor(lines));
    return (
      <div aria-hidden="true" data-skeleton="text" className={cn("flex w-full flex-col gap-2", className)}>
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            style={style}
            className={cn(
              "block h-3 bg-[var(--surface-muted)]",
              count > 1 && i === count - 1 ? "w-3/5" : "w-full",
              pulse
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      aria-hidden="true"
      data-skeleton={variant}
      style={style}
      className={cn(
        "block shrink-0 plate-round bg-[var(--surface-muted)]",
        variant === "avatar" ? AVATAR[size] : "h-24 w-full",
        pulse,
        className
      )}
    />
  );
}

Skeleton.displayName = "Skeleton";
