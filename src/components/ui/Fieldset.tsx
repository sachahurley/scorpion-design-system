/**
 * FIELDSET COMPONENT
 *
 * A native `<fieldset>` whose `<legend>` names a group of related controls:
 * radios answering one question, checkboxes for one setting, or a titled
 * section of a settings card. Screen readers announce the legend when focus
 * enters the group.
 *
 * The browser's fieldset chrome (border, padding, `min-width: min-content`) is
 * reset; a Fieldset draws no frame, because forms already sit in a Card or a
 * page column. The legend takes one of the two voices in the composition
 * rules: `eyebrow` (`text-xs uppercase tracking-wider`, `--text-primary`,
 * `mb-3`) or `field` (the Input label style: `text-sm`, `secondary-800` /
 * `secondary-200`, `mb-2`). The children sit in a flex column whose `gap` uses
 * Stack's gap scale. A description and an error message share the field helper,
 * so they read like every other field's small print.
 */

import {
  forwardRef,
  useId,
  type FieldsetHTMLAttributes,
  type ReactNode,
} from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import { cn } from "@/lib/utils";

// Stack's gap scale, repeated rather than imported: the consumers vendor
// components and primitives into one folder and rewrite only `../lib/` imports,
// so a component importing from `../primitives/` would not resolve there.
const gapClass = {
  none: "gap-0",
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "5": "gap-5",
  "6": "gap-6",
  "8": "gap-8",
} as const;

/** Space between a Fieldset's children; the same steps as `StackGap`. */
export type FieldsetGap = keyof typeof gapClass;

/**
 * Legend voice: `eyebrow` titles a group in a settings card, `field` asks one
 * question in a form (the composition rules' "eyebrow style" and "field label style").
 */
export type FieldsetVariant = "eyebrow" | "field";

const legendVoice: Record<FieldsetVariant, { text: string; space: string }> = {
  eyebrow: {
    text: "text-xs uppercase tracking-wider text-[var(--text-primary)]",
    space: "mb-3",
  },
  field: {
    text: "text-sm text-secondary-800 dark:text-secondary-200",
    space: "mb-2",
  },
};

export interface FieldsetProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "role"> {
  /**
   * The group's name, rendered as the `<legend>` and announced when focus enters
   * the group. Write the question ("Theme") or the section title ("Notifications").
   * To hide it visually, pass `<VisuallyHidden>Name</VisuallyHidden>`.
   */
  legend: ReactNode;
  /**
   * The controls in the group: Radios sharing one `name`, Checkboxes, Switches or
   * fields. They are laid out in a column with `gap` between them.
   */
  children: ReactNode;
  /**
   * One line under the legend that explains the choice. It is linked to the group
   * with `aria-describedby`, so it is read after the legend.
   */
  description?: ReactNode;
  /**
   * Legend voice. `eyebrow` (default, `text-xs` uppercase) titles a group inside a settings card;
   * `field` matches the Input label and suits a group that asks one question in a form.
   */
  variant?: FieldsetVariant;
  /**
   * Space between the children, on the Stack gap scale: `2` (default) between the
   * options of one choice group, `4` for a group mixing Switch rows and Checkboxes.
   */
  gap?: FieldsetGap;
  /**
   * Disables every control in the group natively (the browser disables each
   * descendant input and button) and dims the controls but not the legend, as
   * Input dims its field but not its label. Do not also pass `disabled` to the
   * children, or they dim twice.
   */
  disabled?: boolean;
  /**
   * Group-level error without a message. Prefer `errorMessage` so the user learns
   * what to fix. With `role="radiogroup"` it sets `aria-invalid` on the group; a plain
   * group cannot carry `aria-invalid` (ARIA 1.2), so there only the message is announced.
   * Set `error` on each child as well for the error styling.
   */
  error?: boolean;
  /**
   * Group-level validation message under the controls ("Pick a plan"), linked with
   * `aria-describedby`. Implies `error`. For a message about one option, use that
   * control's own `errorMessage`.
   */
  errorMessage?: ReactNode;
  /**
   * `radiogroup` for a set of Radios: it is the role that can carry the group's
   * invalid state (decision 0029, `Radio.md`). Leave it unset for checkboxes and
   * mixed controls; the native fieldset is already a `group`.
   */
  role?: "group" | "radiogroup";
  /** Layout classes for the fieldset itself (width, margin). The legend and the children column are not styled through it. */
  className?: string;
}

/**
 * Names a group of related controls with a legend, so forms stop hand-writing
 * `fieldset` and `legend` styling. Use it around radios that answer one question,
 * a set of checkboxes, or a titled group of settings. For a single control use
 * that control's own `label`; for a framed group with a header and footer use `Card`.
 *
 * ```tsx
 * <Fieldset legend="Theme" variant="field" role="radiogroup">
 *   <Radio name="theme" value="light" label="Light" />
 *   <Radio name="theme" value="dark" label="Dark" />
 * </Fieldset>
 * ```
 */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset(
  {
    legend,
    children,
    description,
    variant = "eyebrow",
    gap = "2",
    disabled = false,
    error = false,
    errorMessage,
    role,
    className,
    "aria-describedby": ariaDescribedBy,
    "aria-labelledby": ariaLabelledBy,
    ...rest
  },
  ref
) {
  const baseId = useId();
  const legendId = `${baseId}-legend`;
  const hasDescription = description != null && description !== false && description !== "";
  const descriptionId = hasDescription ? `${baseId}-description` : undefined;
  // The error message goes through the shared field helper, like every control's.
  const field = useFieldMessage({
    error,
    errorMessage,
    describedBy: [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined,
  });
  const voice = legendVoice[variant];

  // ARIA 1.2 supports aria-invalid on radiogroup but not on group, so it is only
  // set for a radio group. Spread rather than written inline because the role is
  // dynamic, which jsx-a11y would read as the fieldset's implicit `group`.
  const groupState =
    role === "radiogroup"
      ? { role: "radiogroup" as const, "aria-invalid": field.invalid || undefined }
      : {};

  return (
    <fieldset
      ref={ref}
      disabled={disabled}
      aria-labelledby={ariaLabelledBy ?? legendId}
      aria-describedby={field.describedBy}
      className={cn("group/fieldset m-0 min-w-0 border-0 p-0", className)}
      {...groupState}
      {...rest}
    >
      <legend
        id={legendId}
        className={cn("block p-0 font-mono", voice.text, hasDescription ? "mb-1" : voice.space)}
      >
        {legend}
      </legend>
      {hasDescription && (
        <FieldMessage id={descriptionId} tone="helper" className={voice.space}>
          {description}
        </FieldMessage>
      )}
      <div className={cn("flex flex-col group-disabled/fieldset:opacity-50", gapClass[gap])}>{children}</div>
      <FieldMessage {...field.message} className="mt-2" />
    </fieldset>
  );
});

Fieldset.displayName = "Fieldset";
