/**
 * FOLLOW SCROLL (internal)
 *
 * Keeps a scroll container pinned to its newest content, like `tail -f`.
 * Scrolling up pauses following so the reader keeps their place, and counts
 * what arrives meanwhile as unseen; scrolling back to the bottom, or calling
 * `resume`, follows again. Shared by LogView and Transcript so the two
 * regions behave the same way.
 *
 * Two triggers re-pin while following:
 * - `content` changing identity (new lines, new turns). `count` is the
 *   number of items in it, used to count unseen arrivals while paused.
 * - the element in `contentRef` changing size, for content that grows in
 *   place (a reply streaming into the last turn). Optional.
 *
 * Not exported from the package barrel.
 */

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Distance from the bottom (px) still treated as "at the bottom". */
export const FOLLOW_BOTTOM_THRESHOLD = 8;

export interface FollowScrollOptions {
  /** Anything whose change should re-pin to the bottom while following. */
  content: unknown;
  /** Items in `content`; growth while paused is added to `unseen`. */
  count: number;
  /** Follow at all (default true). Off: no scrolling, never pauses. */
  enabled?: boolean;
  /** Fires when following pauses or resumes. */
  onFollowChange?: (following: boolean) => void;
  /** Element whose size changes should also re-pin (content growing in place). */
  contentRef?: RefObject<HTMLElement | null>;
}

export interface FollowScroll<T extends HTMLElement> {
  /** Attach to the scroll container. */
  scrollRef: RefObject<T | null>;
  /** Attach to the scroll container's `onScroll`. */
  onScroll: () => void;
  /** Whether the view is pinned to the bottom. */
  following: boolean;
  /** Items that arrived while paused. */
  unseen: number;
  /** Jump to the bottom and follow again. */
  resume: () => void;
}

export function useFollowScroll<T extends HTMLElement = HTMLDivElement>({
  content,
  count,
  enabled = true,
  onFollowChange,
  contentRef,
}: FollowScrollOptions): FollowScroll<T> {
  const scrollRef = useRef<T>(null);
  const [following, setFollowing] = useState(true);
  const [unseen, setUnseen] = useState(0);
  const prevCountRef = useRef(count);

  const updateFollowing = useCallback(
    (next: boolean) => {
      setFollowing((prev) => {
        if (prev !== next) onFollowChange?.(next);
        return next;
      });
    },
    [onFollowChange]
  );

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  // Runs on mount too (starts at the bottom). Our own scrollTop writes also
  // fire scroll events, but they land at the bottom, so following holds.
  // New content: follow when allowed, otherwise count it as unseen.
  useLayoutEffect(() => {
    const added = count - prevCountRef.current;
    prevCountRef.current = count;
    if (!enabled) return;
    if (following) {
      scrollToBottom();
    } else if (added > 0) {
      setUnseen((n) => n + added);
    }
  }, [content, count, enabled, following, scrollToBottom]);

  // Content growing in place (streaming) changes height without changing
  // `content`; follow that too while pinned.
  useLayoutEffect(() => {
    const target = contentRef?.current;
    if (!enabled || !following || !target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => scrollToBottom());
    observer.observe(target);
    return () => observer.disconnect();
  }, [contentRef, enabled, following, scrollToBottom]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_BOTTOM_THRESHOLD;
    updateFollowing(atBottom);
    if (atBottom) setUnseen(0);
  }, [enabled, updateFollowing]);

  const resume = useCallback(() => {
    setUnseen(0);
    updateFollowing(true);
    scrollToBottom();
  }, [updateFollowing, scrollToBottom]);

  return { scrollRef, onScroll, following, unseen, resume };
}
