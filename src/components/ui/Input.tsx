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
 * TRAILING ACTION: `trailingAction` puts one icon button inside the field's
 * end (a password reveal, a clear button). It is a real `<button
 * type="button">` over the input's right end, inside the 1px ring, square at
 * the control height (the same box as an icon-only Button of that size), with a 44px hit
 * area from a centered `::before` and the system's inset focus ring on an
 * `::after` clipped to the plate (decision 0002: the action is a button, not a
 * text field, so 0022 does not apply to it). The input gets right padding equal
 * to the action's width so text never runs under it. The action sits outside
 * the clipped ring wrapper, so the plate clip does not trim its hit area.
 *
 * PLACEHOLDERS: `--field-placeholder` is sepia-700 in light (6.28:1 on the
 * white field) and sepia-500 in dark (9.45:1). Placeholders still must never
 * carry essential information (they vanish on input), so put format hints in
 * `helperText` and the name in `label`.
 */

import { forwardRef, useId, type InputHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import type { ControlSize } from "@/lib/size";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

/**
 * One icon button inside the end of an Input: a password reveal, a clear
 * button, a copy button. Pass it to `trailingAction`.
 */
export interface InputTrailingAction {
  /**
   * The icon: a TuiIcon name (`"Eye"`) or an element. A name is sized to the
   * field (16px at sm, 20px at md, 24px at lg). Swap it with state if the
   * action toggles (`"Eye"` / `"EyeOff"`).
   */
  icon: IconSlot;
  /**
   * Accessible name of the button, read by screen readers and required: the
   * button shows only an icon. Name the action ("Show password", "Clear
   * search"). For a toggle, keep the label fixed and use `pressed` for the state.
   */
  label: string;
  /** Called when the button is clicked or activated with Enter or Space. */
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Makes the action a toggle button: sets `aria-pressed`, so assistive tech
   * announces "pressed" or "not pressed". Use it for a password reveal
   * (`pressed={visible}`). Leave it undefined for a one-shot action (clear,
   * copy), which then carries no `aria-pressed`.
   */
  pressed?: boolean;
}

// Define the props interface for the Input component
// Omit the native HTML 'size' attribute to avoid conflict with our custom size prop
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Field height: sm 32px, md 40px (default), lg 48px. */
  size?: ControlSize;
  /**
   * Visual variant. "box" (default) is the plate field; "quiet" is the
   * underline recipe: transparent, bottom hairline only, the site's voice
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
  /**
   * One icon button inside the end of the field, such as a password reveal
   * (`{ icon: visible ? "EyeOff" : "Eye", label: "Show password", pressed:
   * visible, onClick: toggle }`). Renders a real `<button type="button">` after
   * the input in the tab order, with a 44px hit area and the system focus ring;
   * the input is padded so text never runs under it. `disabled` disables it too.
   */
  trailingAction?: InputTrailingAction;
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
 * @param trailingAction - Icon button inside the end of the field (password reveal, clear)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { 
      size = "md", 
      variant = "box",
      error: errorProp = false,
      helperText,
      errorMessage,
      disabled = false,
      className = "", 
      label,
      trailingAction,
      id: idProp,
      "aria-describedby": ariaDescribedBy,
      ...props 
    },
    ref
  ) => {
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

    // PLATE RING RECIPE: the wrapper is the border color clipped to the plate;
    // the input is the fill clipped 1px inset. The ring walks the portfolio ramp:
    // idle hairline → hover mut → focus accent (via --field-border-* tokens).
    // Focus is only this colour change, as in Select and Combobox: no inset
    // ring on top (docs/decisions/0022). Focus wins over error on the ring, so
    // an errored field still shows focus; the error stays carried by the fill
    // and the message below.
    const ringStyles = error
      ? "bg-[var(--field-border-error)] focus-within:!bg-[var(--field-border-focus)]"
      : "bg-[var(--field-border)] hover:bg-[var(--field-border-hover)] focus-within:!bg-[var(--field-border-focus)]";

    // QUIET VARIANT: the underline recipe: no plate, no ring wrapper; the
    // bottom border itself walks the ramp. Focus is a colour change on the
    // same 1px underline, matching the box variant; focus wins over error.
    const quietStyles = error
      ? "border-b border-[var(--field-border-error)] focus:!border-[var(--field-border-focus)]"
      : "border-b border-[var(--field-border)] hover:border-[var(--field-border-hover)] focus:!border-[var(--field-border-focus)]";

    // TRAILING ACTION: the input is padded on the right by the action's width
    // (the field height: 32 / 40 / 48px), so text stops where the button starts.
    // Quiet strips horizontal padding with `!px-0`, so it needs `!pr-*` to win.
    const actionPadding = trailingAction
      ? variant === "quiet"
        ? { sm: "!pr-8", md: "!pr-10", lg: "!pr-12" }[size]
        : { sm: "pr-8", md: "pr-10", lg: "pr-12" }[size]
      : "";

    const inputEl =
      variant === "quiet" ? (
        <input
          ref={ref}
          id={controlId}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={field.describedBy}
          className={`${baseStyles} ${sizeStyles[size].replace("plate-round", "rounded-none")} !px-0 ${actionPadding} bg-transparent text-[var(--text-primary)] disabled:opacity-50 ${quietStyles} ${className}`}
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
          className={`${baseStyles} ${sizeStyles[size]} ${stateStyles} ${actionPadding} ${className}`}
          {...props}
        />
      </div>
    );

    // The action is a square at the control height (an icon-only Button's box
    // at the same size) over the input's right end. In box it sits 1px in
    // (`top-px right-px`), exactly on the input inside the 1px ring, so the
    // ring stays whole around it and its plate-clipped focus ring matches the
    // input's own stepped corners. Quiet has no ring: it sits at `top-0
    // right-0` over the underline, with a square focus ring.
    // It is a sibling of the ring wrapper, not a child: the wrapper's
    // clip-path would otherwise trim the 44px `::before` hit area on the sm
    // and md fields. `::after` carries the inset focus ring (decision 0002) so
    // the button itself stays unclipped.
    const actionSizeStyles = { sm: "size-control-sm", md: "size-control-md", lg: "size-control-lg" };
    const actionIconSize = { sm: "4", md: "5", lg: "6" } as const;
    const control = trailingAction ? (
      <div className="relative w-full">
        {inputEl}
        <button
          type="button"
          aria-label={trailingAction.label}
          aria-pressed={trailingAction.pressed}
          disabled={disabled}
          onClick={trailingAction.onClick}
          className={`
            absolute ${variant === "quiet" ? "right-0 top-0" : "right-px top-px"} inline-flex items-center justify-center ${actionSizeStyles[size]}
            text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            transition-colors [transition-duration:var(--duration-fast)]
            cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[var(--text-secondary)]
            before:content-[''] before:absolute before:left-1/2 before:top-1/2
            before:-translate-x-1/2 before:-translate-y-1/2 before:w-touch before:h-touch
            after:content-[''] after:absolute after:inset-0 after:pointer-events-none
            ${variant === "quiet" ? "" : "after:[clip-path:var(--plate-round)]"}
            focus:outline-none
            focus-visible:after:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]
          `}
        >
          <span aria-hidden="true" className="inline-flex">
            {renderIconSlot(trailingAction.icon, { size: actionIconSize[size] })}
          </span>
        </button>
      </div>
    ) : (
      inputEl
    );

    const hasLabel = label != null && label !== "";
    if (!hasLabel && !field.hasMessage) {
      return control;
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
        {control}
        <FieldMessage {...field.message} />
      </div>
    );
  }
);

// Set display name for debugging
Input.displayName = "Input";

