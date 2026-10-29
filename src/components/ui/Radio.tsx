/**
 * RADIO COMPONENT
 * 
 * Reusable radio button component with multiple sizes
 * Built entirely from design tokens defined in tokens.json
 * 
 * SIZES: Proportional to button/input height system
 * - sm: 16px × 16px
 * - md: 20px × 20px (default)
 * - lg: 24px × 24px
 * SHAPE: the stepped plate silhouette (--plate-round), same as Checkbox;
 * checked shows a square dot where Checkbox shows a check.
 * Every size gets an invisible 44×44px hit area centered on the box (a
 * pseudo-element, so layout is unchanged) to meet the touch-target rule.
 * 
 * STATES:
 * - unchecked: Default state with border
 * - checked: Filled with primary color, inner square dot
 * - disabled: Reduced opacity, not interactive
 * - error: Red border to indicate validation issues
 * 
 * Features:
 * - Accessible (ARIA attributes, keyboard support)
 * - Focus states matching design system
 * - Smooth transitions
 * - Optional label
 * - Optional helperText / errorMessage under the label, wired through
 *   `aria-describedby` by the shared field helper (same as Checkbox)
 * - Works with radio groups (use same name prop)
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import type { ControlSize } from "@/lib/size";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Box size: sm 16px, md 20px (default), lg 24px. The tap target is 44×44px at every size. */
  size?: ControlSize;
  /** Visible label next to the box; clicking it selects the radio. Without one, pass `aria-label`. */
  label?: string | ReactNode;
  /**
   * Error styling without a message. Prefer `errorMessage` so users learn what to fix.
   * Styling only: announce the invalid state with `aria-invalid` on the group
   * (`<fieldset role="radiogroup">`), since ARIA does not support it on a radio.
   */
  error?: boolean;
  /** Secondary line under the label (explains what picking this option means). */
  helperText?: ReactNode;
  /**
   * Validation message under the label, read through `aria-describedby`. Sets the
   * error styling and replaces `helperText`. Put `aria-invalid` on the group, not here.
   */
  errorMessage?: ReactNode;
  /**
   * Called with this radio's checked state after a change (alternative to
   * `onChange`). A radio only fires when it becomes selected, so the value is
   * `true`; losing selection to a sibling fires nothing, as with a native radio.
   */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * One option in a group where exactly one can be chosen; radios with the same `name` form the group.
 * 
 * @param size - Radio size (default: "md")
 * @param label - Optional label text displayed next to radio
 * @param error - Whether radio has a validation error
 * @param helperText - Secondary line under the label
 * @param errorMessage - Validation message under the label (implies `error`)
 * @param disabled - Whether radio is disabled
 * @param checked - Controlled checked state; omit it to use the native
 *                  uncontrolled behavior (`defaultChecked` + radio-group name)
 * @param name - Name attribute for radio group (required for grouping)
 * @param value - Value attribute for this radio option
 * @param onCheckedChange - Callback when radio state changes (alternative to onChange)
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
      className = "",
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    // Helper and error text share the Checkbox / Input plumbing: one place
    // owns the message id and `aria-describedby`. The radio uses `invalid`
    // for styling only; see the input below for where aria-invalid goes.
    const field = useFieldMessage({ error: errorProp, helperText, errorMessage, describedBy: ariaDescribedBy });
    const error = field.invalid;
    // Size styles proportional to button/input system
    // Small: 16px × 16px
    // Medium: 20px × 20px (matches medium icon size)
    // Large: 24px × 24px (matches large icon size)
    const sizeStyles = {
      sm: {
        radio: "w-4 h-4",                          // 16px × 16px
        dot: "w-1.5 h-1.5",                       // 6px square dot
        label: "text-sm",                         // 14px text
        messageIndent: "pl-6",                    // box 16 + gap 8
      },
      md: {
        radio: "w-5 h-5",                         // 20px × 20px
        dot: "w-2 h-2",                           // 8px square dot
        label: "text-sm",                         // 14px text
        messageIndent: "pl-7",                    // box 20 + gap 8
      },
      lg: {
        radio: "w-6 h-6",                         // 24px × 24px
        dot: "w-2.5 h-2.5",                       // 10px square dot
        label: "text-sm",                         // 14px text
        messageIndent: "pl-8",                    // box 24 + gap 8
      },
    };

    const currentSizeStyles = sizeStyles[size];

    // PLATE RING RECIPE: same silhouette as Checkbox (the stepped
    // --plate-round corners; Scorp DS has no circles). Outer layer is the
    // border color clipped to the plate, inner layer the fill clipped 1px
    // inset. Checked floods both with the primary fill and reveals a square
    // dot, so radio (dot) and checkbox (check) still read differently.
    // Selection renders from the NATIVE input via peer-checked, so both
    // controlled (`checked`) and uncontrolled (`defaultChecked` + group name)
    // radios show state; a JS-only visual misses native group deselection.
    const ringStyles = error
      ? 'bg-[var(--field-border-error)]'
      : `bg-[var(--field-border)] hover:bg-[var(--field-border-hover)]
         peer-checked:bg-[var(--button-primary-background)]
         peer-checked:hover:bg-[var(--button-primary-background-hover)]`;

    // Focus: inset ring on the plate (the clip swallows outside rings).
    // Lives on the visual so only the native input is exposed to assistive tech.
    const focusPeerRing = error
      ? 'peer-focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-error)]'
      : 'peer-focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]';

    // `currentTarget` is this radio, so the callback always reports THIS
    // input's state rather than whatever element the event started on.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.currentTarget.checked;
      if (onChange) {
        onChange(e);
      }
      if (onCheckedChange) {
        onCheckedChange(isChecked);
      }
    };

    const hasLabel = label != null && label !== false && label !== '';

    // HIT AREA: the wrapper carries a 44×44px pseudo-element centered on the
    // box. It sits inside the <label>, so a tap anywhere in it selects.
    const control = (
      <span className="relative inline-flex shrink-0 before:content-[''] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-touch before:h-touch">
        {/* No aria-invalid here: ARIA 1.2 does not support it on role radio.
            The invalid state belongs on the group the caller renders
            (`<fieldset role="radiogroup" aria-invalid>`); this radio's own
            message is still read through aria-describedby. */}
        <input
          ref={ref}
          type="radio"
          {...(checked !== undefined ? { checked } : {})}
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only"
          aria-describedby={field.describedBy}
          {...props}
        />
        <span
          aria-hidden="true"
          className={`
            plate-round p-px inline-flex shrink-0
            ${currentSizeStyles.radio}
            transition-colors [transition-duration:var(--duration-fast)]
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            ${ringStyles}
            ${error ? 'peer-checked:[&>span]:bg-[var(--field-border-error)]' : 'peer-checked:[&>span]:bg-[var(--button-primary-background)]'}
            peer-checked:[&>span>span]:opacity-100
            ${focusPeerRing}
          `}
        >
          <span
            className={`
              plate-round inline-flex h-full w-full items-center justify-center
              bg-[var(--field-background)]
              transition-colors [transition-duration:var(--duration-fast)]
            `}
          >
            {/* Square dot, revealed by peer-checked on the outer span */}
            <span
              className={`
                ${currentSizeStyles.dot}
                opacity-0
                transition-opacity [transition-duration:var(--duration-fast)]
                ${error ? 'bg-[var(--button-destructive-text)]' : 'bg-[var(--button-primary-text)]'}
              `}
            />
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

Radio.displayName = "Radio";

