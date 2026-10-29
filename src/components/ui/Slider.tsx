/**
 * SLIDER COMPONENT
 *
 * A styled native range input: the missing control tier between Input and
 * Select for continuous or stepped numeric values (zoom, size, bias).
 * Built entirely from design tokens defined in tokens.json.
 *
 * ANATOMY:
 * - Row: a 44px-tall (`h-touch`) full-width band. The whole band is the
 *   pointer target, so the control meets the 44px touch-target rule even
 *   though the visible rail is 4px tall.
 * - Rail: a 4px bar in `--control-track` (3.31:1 on the light page, 5.34:1
 *   on the dark page; the `--surface-muted` it replaced was 1.06:1 / 1.09:1,
 *   effectively invisible).
 * - Fill: the portion before the thumb, in `--accent` (4.9:1 on the light
 *   page, 8.24:1 on the dark page). A slider with no fill reads as unset.
 * - Thumb: a solid accent plate wearing the button silhouette
 *   (--plate-round, the stepped one-bit corners)
 * - Focus: the inset box-shadow ring recipe on the row (outlines get clipped
 *   elsewhere in the system, so focus is consistent ring-style everywhere)
 *
 * WIDTH: the root is a block-level `flex w-full`, so the slider fills its
 * container. Constrain it from the parent (`<div className="w-64">`) or by
 * passing a width in `className`.
 *
 * Native <input type="range"> underneath: keyboard arrows, min/max/step,
 * form participation, and assistive tech all come free.
 *
 * TOKENS USED:
 * - control.track (rail), accent (fill + thumb), text.secondary scale (label)
 * - touch.target (row height), plate.round (thumb)
 * - focus.ring (focus-visible), duration.fast (hover)
 */

import { forwardRef, useId, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /**
   * Optional visible label. When set, renders a <label> associated with the
   * input via htmlFor/id. Prefer this or `aria-label` so the control is
   * announced correctly by screen readers.
   */
  label?: ReactNode;
}

/** Percentage of the range that sits before the thumb, clamped to 0-100. */
function fillPercent(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/**
 * A range input for choosing a number between `min` and `max` by dragging or with the arrow keys.
 *
 * @param label - Optional visible label wired to the input with matching id
 * All other props (min, max, step, value, onChange, disabled, ...) pass
 * through to the native range input.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { label, id, className = "", disabled, min = 0, max = 100, value, defaultValue, onChange, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const minNum = Number(min);
  const maxNum = Number(max);

  // The filled portion has to track the value even when the consumer leaves
  // the input uncontrolled, so an internal mirror follows the native events.
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    defaultValue !== undefined ? Number(defaultValue) : minNum
  );
  const currentValue = isControlled ? Number(value) : uncontrolledValue;
  const percent = fillPercent(currentValue, minNum, maxNum);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setUncontrolledValue(Number(event.target.value));
    onChange?.(event);
  };

  return (
    <span className={`flex w-full flex-col gap-1.5 font-mono ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm text-secondary-800 dark:text-secondary-300">
          {label}
        </label>
      )}
      {/* 44px row: the visible rail is 4px, the target is the whole band. */}
      <span className={`relative flex h-touch w-full items-center ${disabled ? "opacity-50" : ""}`}>
        <span
          aria-hidden="true"
          data-slot="rail"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[var(--control-track)]"
        >
          <span
            data-slot="fill"
            className="block h-full bg-[var(--accent)]"
            style={{ width: `${percent}%` }}
          />
        </span>
        <input
          ref={ref}
          id={inputId}
          type="range"
          min={min}
          max={max}
          disabled={disabled}
          {...(isControlled ? { value } : { defaultValue })}
          onChange={handleChange}
          className={`
            relative m-0 h-touch w-full appearance-none bg-transparent
            ${disabled ? "cursor-default" : "cursor-pointer"}
            focus:outline-none
            focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]
            [&::-webkit-slider-runnable-track]:h-1
            [&::-webkit-slider-runnable-track]:bg-transparent
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:-mt-2
            [&::-webkit-slider-thumb]:bg-[var(--accent)]
            [&::-webkit-slider-thumb]:[clip-path:var(--plate-round)]
            [&::-moz-range-track]:h-1
            [&::-moz-range-track]:bg-transparent
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-3.5
            [&::-moz-range-thumb]:bg-[var(--accent)]
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:[clip-path:var(--plate-round)]
          `}
          {...rest}
        />
      </span>
    </span>
  );
});

Slider.displayName = "Slider";
