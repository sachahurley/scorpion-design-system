/**
 * AUTOSIZE (internal)
 *
 * Grows a textarea with its content, from `minRows` to `maxRows`, then lets
 * it scroll. Heights are measured from the element's own computed line
 * height, padding and border, so they follow whatever size classes the
 * component applies; nothing here is a fixed pixel value.
 *
 * Re-measures when `value` changes and when the element's width changes
 * (narrower means more wrapped lines). Written for Composer; Textarea can
 * adopt it as `autoGrow`.
 *
 * Not exported from the package barrel.
 */

import { useLayoutEffect, type RefObject } from "react";

export interface AutosizeOptions {
  /** The current text. Each change re-measures. */
  value: string;
  /** Rows shown when empty (default 1). */
  minRows?: number;
  /** Rows before the field scrolls instead of growing. Omit to grow without limit. */
  maxRows?: number;
  /** Turn sizing off, leaving the element's own height alone (default true). */
  enabled?: boolean;
}

const px = (v: string) => parseFloat(v) || 0;

/** Height for a textarea's content, clamped to the row limits; null when there is no line height to measure. */
function measureAutosize(el: HTMLTextAreaElement, minRows: number, maxRows?: number) {
  const cs = getComputedStyle(el);
  // `normal` line height has no number; CSS resolves it near 1.2 x font size.
  const lineHeight = Number.isFinite(parseFloat(cs.lineHeight))
    ? parseFloat(cs.lineHeight)
    : parseFloat(cs.fontSize) * 1.2;
  if (!Number.isFinite(lineHeight)) return null;

  const padding = px(cs.paddingTop) + px(cs.paddingBottom);
  const border = px(cs.borderTopWidth) + px(cs.borderBottomWidth);
  const min = minRows * lineHeight + padding + border;
  const max = maxRows === undefined ? Infinity : maxRows * lineHeight + padding + border;

  // Collapse first so scrollHeight reports the content, not the old height.
  el.style.height = "auto";
  // scrollHeight includes padding but not border.
  const natural = el.scrollHeight + border;
  return { height: Math.min(Math.max(natural, min), max), overflows: natural > max };
}

export function useAutosize(
  ref: RefObject<HTMLTextAreaElement | null>,
  { value, minRows = 1, maxRows, enabled = true }: AutosizeOptions
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const resize = () => {
      const size = measureAutosize(el, minRows, maxRows);
      if (!size) return;
      el.style.height = `${size.height}px`;
      el.style.overflowY = size.overflows ? "auto" : "hidden";
    };
    resize();

    if (typeof ResizeObserver === "undefined") return;
    let width = el.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (el.offsetWidth === width) return; // our own height writes also fire
      width = el.offsetWidth;
      resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, value, minRows, maxRows, enabled]);
}
