/**
 * INPUT COMPONENT
 * 
 * Reusable text input component with multiple sizes
 * Built entirely from design tokens defined in tokens.json
 * 
 * SIZES: Matching button heights
 * - sm: 32px height
 * - md: 40px height (default)
 * - lg: 48px height
 * 
 * STATES:
 * - default: Standard input appearance
 * - hover: Subtle border change on mouse over
 * - focused: a colour change only. The 1px ring turns `--field-border-focus`
 *   (the quiet underline does the same); nothing thickens, so the field does
 *   not look bigger. Focus wins over error, so an errored field still shows
 *   the change. See docs/decisions/0022.
 * - disabled: the whole field (ring wrapper included) drops to 50% opacity;
 *   dimming only the inner fill used to leave a full-strength border.
 * - error: Red ring to indicate validation issues
 *
 * PLACEHOLDERS: `--field-placeholder` is sepia-700 in light (6.28:1 on the
 * white field) and sepia-500 in dark (9.45:1). Placeholders still must never
 * carry essential information (they vanish on input), so put format hints in
 * `helperText` and the name in `label`.
 */

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import { resolveSize, type ControlSizeProp } from "@/lib/size";

// Define the props interface for the Input component
// Omit the native HTML 'size' attribute to avoid conflict with our custom size prop
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Field height: sm 32px, md 40px (default), lg 48px. Legacy small/medium/large are deprecated aliases. */
  size?: ControlSizeProp;
  /**
   * Visual variant. "box" (default) is the plate field; "quiet" is the
   * underline recipe — transparent, bottom hairline only, the site's voice
   * for inline fields (passwords, rename-in-place). Same border ramp:
   * idle hairline → hover mut → focus accent.
   */
  variant?: "box" | "quiet";
  /** Error styling without a message. Prefer `errorMessage` so users learn what to fix. */
  error?: boolean;
  /** Hint shown under the field (format, constraints). Linked via `aria-describedby`. */
  helperText?: ReactNode;
  /**
   * Validation message shown under the field. Sets the error state and
   * `aria-invalid`, and replaces `helperText` while present.
   */
  errorMessage?: ReactNode;
  /**
   * Optional visible label. When set, renders a `<label>` associated with the input via `htmlFor` / `id`.
   * Prefer this or `aria-label` so the field is announced correctly by screen readers.
   */
  label?: ReactNode;
}

/**
 * A single-line text field, with an optional label, helper text and error message wired up for assistive tech.
 * 
 * @param size - Input size matching button heights (default: "md")
 * @param error - Whether input has a validation error
 * @param disabled - Whether input is disabled
 * @param className - Additional CSS classes to apply
 * @param label - Optional visible label wired to the input with matching `id`
 * @param helperText - Hint under the field
 * @param errorMessage - Validation message under the field (implies `error`)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { 
      size: sizeProp = "md", 
      variant = "box",
      error: errorProp = false,
      helperText,
      errorMessage,
      disabled = false,
      className = "", 
      label,
      id: idProp,
      "aria-describedby": ariaDescribedBy,
      ...props 
    },
    ref
  ) => {
    const size = resolveSize(sizeProp, "Input");
    const field = useFieldMessage({ error: errorProp, helperText, errorMessage, describedBy: ariaDescribedBy });
    const error = field.invalid;
    const generatedId = useId();
    const controlId =
      idProp ?? (label != null && label !== "" ? generatedId : undefined);
    // BASE STYLES - Applied to all inputs
    // Uses tokens: font.size.sm (14px)
    // Border width: 1px for all states
    // Border radius is size-specific (see sizeStyles)
    const baseStyles = `
      w-full
      font-mono text-sm
      transition-colors [transition-duration:var(--duration-fast)]
      placeholder:text-[var(--field-placeholder)]
      disabled:cursor-not-allowed
      focus:outline-none
    `;

    // SIZE STYLES - All values matching button sizes from tokens.json
    // Heights match button component exactly: 32px, 40px, 48px
    // Horizontal padding slightly less than buttons for better text alignment
    // Corner radius matches button sizes: 6px (small), 8px (medium), 12px (large)
    const sizeStyles = {
      sm: "h-control-sm px-3 py-1.5 plate-round",
      md: "h-control-md px-4 py-2.5 plate-round",
      lg: "h-control-lg px-5 py-3.5 plate-round",
    };

    // STATE STYLES - Color combinations for different states using SEMANTIC TOKENS
    // Priority: error > disabled > default
    // Error state overrides all other visual states
    const stateStyles = error
      ? `bg-[var(--field-background-error)] text-[var(--text-primary)]`
      : `bg-[var(--field-background)] text-[var(--text-primary)]`;

    // PLATE RING RECIPE — the wrapper is the border color clipped to the plate;
    // the input is the fill clipped 1px inset. The ring walks the portfolio ramp:
    // idle hairline → hover mut → focus accent (via --field-border-* tokens).
    // Focus is only this colour change, as in Select and Combobox: no inset
    // ring on top (docs/decisions/0022). Focus wins over error on the ring, so
    // an errored field still shows focus; the error stays carried by the fill
    // and the message below.
    const ringStyles = error
      ? "bg-[var(--field-border-error)] focus-within:!bg-[var(--field-border-focus)]"
      : "bg-[var(--field-border)] hover:bg-[var(--field-border-hover)] focus-within:!bg-[var(--field-border-focus)]";

    // QUIET VARIANT — the underline recipe: no plate, no ring wrapper; the
    // bottom border itself walks the ramp. Focus is a colour change on the
    // same 1px underline, matching the box variant; focus wins over error.
    const quietStyles = error
      ? "border-b border-[var(--field-border-error)] focus:!border-[var(--field-border-focus)]"
      : "border-b border-[var(--field-border)] hover:border-[var(--field-border-hover)] focus:!border-[var(--field-border-focus)]";

    const inputEl =
      variant === "quiet" ? (
        <input
          ref={ref}
          id={controlId}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={field.describedBy}
          className={`${baseStyles} ${sizeStyles[size].replace("plate-round", "rounded-none")} !px-0 bg-transparent text-[var(--text-primary)] disabled:opacity-50 ${quietStyles} ${className}`}
          {...props}
        />
      ) : (
      // DISABLED: the opacity lives on the ring wrapper so the border dims
      // with the fill; applying it to the input alone left a full-strength ring.
      <div
        className={`w-full plate-round p-px transition-colors [transition-duration:var(--duration-fast)] ${ringStyles} ${disabled ? "opacity-50" : ""}`}
      >
        <input
          ref={ref}
          id={controlId}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={field.describedBy}
          className={`${baseStyles} ${sizeStyles[size]} ${stateStyles} ${className}`}
          {...props}
        />
      </div>
    );

    const hasLabel = label != null && label !== "";
    if (!hasLabel && !field.hasMessage) {
      return inputEl;
    }

    return (
      <div className="w-full space-y-1">
        {hasLabel && (
          <label
            htmlFor={controlId}
            className="block font-mono text-sm text-secondary-800 dark:text-secondary-200"
          >
            {label}
          </label>
        )}
        {inputEl}
        <FieldMessage {...field.message} />
      </div>
    );
  }
);

// Set display name for debugging
Input.displayName = "Input";

