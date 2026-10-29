/**
 * CHECKBOX COMPONENT
 * 
 * Reusable checkbox component with multiple sizes
 * Built entirely from design tokens defined in tokens.json
 * 
 * SIZES: Proportional to button/input height system
 * - sm: 16px × 16px
 * - md: 20px × 20px (default)
 * - lg: 24px × 24px
 * Every size gets an invisible 44×44px hit area centered on the box (a
 * pseudo-element, so layout is unchanged) to meet the touch-target rule.
 * 
 * STATES:
 * - unchecked: Default state with border
 * - checked: Filled with primary color, checkmark icon
 * - disabled: 50% opacity, applied once on the <label> so the box and the
 *   label dim together (stacking it on the box too rendered it at ~25%)
 * - error: Red border to indicate validation issues; the mark switches to
 *   `--button-destructive-text`, the system's ink for a destructive fill
 * 
 * Features:
 * - Accessible (ARIA attributes, keyboard support)
 * - Focus states matching design system
 * - Smooth transitions
 * - Optional label
 */

import { forwardRef, useCallback, useLayoutEffect, useRef, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import { TuiIcon } from "./TuiIcon";
import type { ControlSize } from "@/lib/size";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Box size. The tap target is 44×44px at every size. */
  size?: ControlSize;
  /** Visible label; clicking it toggles the box. Without one, pass `aria-label`. */
  label?: string | ReactNode;
  /** Error styling without a message. Prefer `errorMessage` so users learn what to fix. */
  error?: boolean;
  /** Secondary line under the label (explains the consequence of checking). */
  helperText?: ReactNode;
  /** Validation message under the label. Sets the error state and replaces `helperText`. */
  errorMessage?: ReactNode;
  /** Called with the new checked state (alternative to `onChange`). */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Mixed state, for a parent box whose children are partly checked ("select
   * all" over a half-selected list). Sets the native `indeterminate` property,
   * so assistive tech announces "mixed", and draws a 1-bit bar instead of the
   * check. The prop is the source of truth: a click still fires `onChange` /
   * `onCheckedChange`, and the box stays mixed until you pass `false`
   * (typically after checking or clearing every child).
   */
  indeterminate?: boolean;
}

/**
 * A labelled on/off choice that is submitted with a form, or one item in a multi-select list; also has a mixed (indeterminate) state.
 * 
 * @param size - Checkbox size (default: "md")
 * @param label - Optional label text displayed next to checkbox
 * @param error - Whether checkbox has a validation error
 * @param helperText - Secondary line under the label
 * @param errorMessage - Validation message under the label (implies `error`)
 * @param disabled - Whether checkbox is disabled
 * @param checked - Controlled checked state; omit it to use the native
 *                  uncontrolled behavior (`defaultChecked`)
 * @param onCheckedChange - Callback when checkbox state changes (alternative to onChange)
 * @param indeterminate - Mixed state (native `indeterminate`), drawn as a bar
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = "md",
      label,
      error: errorProp = false,
      helperText,
      errorMessage,
      disabled = false,
      checked,
      onChange,
      onCheckedChange,
      indeterminate = false,
      className = "",
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {

    // INDETERMINATE has no HTML attribute, only a DOM property, so it is set
    // through a ref merged with the forwarded one. Runs after every render:
    // a click clears the native flag, and the prop re-asserts it.
    const inputRef = useRef<HTMLInputElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );
    useLayoutEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    });
    const field = useFieldMessage({ error: errorProp, helperText, errorMessage, describedBy: ariaDescribedBy });
    const error = field.invalid;

    // Size styles proportional to button/input system
    // Small: 16px × 16px
    // Medium: 20px × 20px (matches medium icon size)
    // Large: 24px × 24px (matches large icon size)
    // Box wears the plate silhouette; glyph gets an explicit token size so it
    // renders predictably inside the box (no inherited-size overflow).
    const sizeStyles = {
      sm: {
        checkbox: "w-4 h-4",
        glyph: "3" as const,
        label: "text-sm",
        messageIndent: "pl-6", // box 16 + gap 8
      },
      md: {
        checkbox: "w-5 h-5",
        glyph: "4" as const,
        label: "text-sm",
        messageIndent: "pl-7", // box 20 + gap 8
      },
      lg: {
        checkbox: "w-6 h-6",
        glyph: "5" as const,
        label: "text-sm",
        messageIndent: "pl-8", // box 24 + gap 8
      },
    };

    const currentSizeStyles = sizeStyles[size];

    // STATE STYLES - Color combinations for different states using SEMANTIC TOKENS
    // Priority: error > disabled > checked > default
    // Includes hover states for unchecked checkboxes
    // Includes focus states with ring
    // PLATE RING RECIPE — outer layer is the border color clipped to the plate,
    // inner layer is the fill clipped 1px inset. Checked floods both layers
    // with the primary (gold) fill, matching the primary button. State renders
    // from the NATIVE input via peer-checked so controlled and uncontrolled
    // (`defaultChecked`) checkboxes both show the checkmark.
    // Indeterminate renders from the native :indeterminate state the same way,
    // so the bar clears the moment a click clears the native flag.
    const ringStyles = error
      ? 'bg-[var(--field-border-error)]'
      : `bg-[var(--field-border)] hover:bg-[var(--field-border-hover)]
         peer-checked:bg-[var(--button-primary-background)]
         peer-checked:hover:bg-[var(--button-primary-background-hover)]
         peer-indeterminate:bg-[var(--button-primary-background)]
         peer-indeterminate:hover:bg-[var(--button-primary-background-hover)]`;

    // Focus: inset ring on the plate (the clip swallows outside rings)
    const focusPeerRing = error
      ? 'peer-focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-error)]'
      : 'peer-focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
      // The click cleared the native flag; the prop is the source of truth
      // (a parent that re-renders with indeterminate={false} clears it).
      e.target.indeterminate = indeterminate;
    };

    const hasLabel = label != null && label !== false && label !== '';

    // HIT AREA: the wrapper (unclipped, unlike the plate) carries a 44×44px
    // pseudo-element centered on the box. It sits inside the <label>, so a
    // tap anywhere in it toggles the input.
    const control = (
      <span className="relative inline-flex shrink-0 before:content-[''] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-touch before:h-touch">
        <input
          ref={setRefs}
          type="checkbox"
          {...(checked !== undefined ? { checked } : {})}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
          aria-invalid={error || undefined}
          aria-describedby={field.describedBy}
          {...props}
        />
        <span
          aria-hidden="true"
          className={`
            plate-round p-px inline-flex shrink-0
            ${currentSizeStyles.checkbox}
            transition-colors [transition-duration:var(--duration-fast)]
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${ringStyles}
            ${error
              ? 'peer-checked:[&>span]:bg-[var(--field-border-error)] peer-indeterminate:[&>span]:bg-[var(--field-border-error)]'
              : 'peer-checked:[&>span]:bg-[var(--button-primary-background)] peer-indeterminate:[&>span]:bg-[var(--button-primary-background)]'}
            peer-checked:[&_[data-mark=check]]:opacity-100
            peer-indeterminate:[&_[data-mark=check]]:opacity-0
            peer-indeterminate:[&_[data-mark=bar]]:opacity-100
            ${focusPeerRing}
          `}
        >
          <span
            className={`
              plate-round relative inline-flex h-full w-full items-center justify-center
              bg-[var(--field-background)]
              transition-colors [transition-duration:var(--duration-fast)]
            `}
          >
            {/* Marks, stacked: the check (peer-checked) and the bar
                (peer-indeterminate, which wins when both apply) */}
            {(["check", "bar"] as const).map((mark) => (
              <span
                key={mark}
                data-mark={mark}
                className={`absolute inset-0 inline-flex items-center justify-center opacity-0 transition-opacity [transition-duration:var(--duration-fast)] ${
                  error ? 'text-[var(--button-destructive-text)]' : 'text-[var(--button-primary-text)]'
                }`}
                aria-hidden="true"
              >
                <TuiIcon name={mark === "check" ? "Check" : "Minus"} size={currentSizeStyles.glyph} />
              </span>
            ))}
          </span>
        </span>
      </span>
    );

    // Always a <label>: the native input is sr-only, so without one a click
    // on the visible box would never reach it.
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <label
          className={`inline-flex items-center gap-2 font-mono ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          {control}
          {hasLabel && (
            <span className={`${currentSizeStyles.label} text-[var(--text-primary)]`}>{label}</span>
          )}
        </label>
        <FieldMessage {...field.message} className={currentSizeStyles.messageIndent} />
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

