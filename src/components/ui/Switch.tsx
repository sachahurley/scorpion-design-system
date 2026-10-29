/**
 * SWITCH COMPONENT
 *
 * Reusable toggle switch component with multiple sizes
 * Built using design tokens for consistent styling
 *
 * SIZES: Proportional to button/input height system. Every measurement comes
 * from the `global.switch` tokens (`--switch-track-*`, `--switch-knob-*`), so
 * nothing about the geometry is typed into this file:
 * - sm: 24px track (one step below the control scale; no control-height token)
 * - md: 32px track, aliases `--control-height-sm` (default)
 * - lg: 40px track, aliases `--control-height-md`
 * Every size's tap target is at least 44px tall: the (unclipped) button
 * carries a pseudo-element hit area, so the visual track keeps its size.
 *
 * SHAPE: track and knob are both clipped to the small plate (--plate-round).
 * The clip lives on an inner track span, not the button, so the hit area
 * isn't clipped away. Focus is an inset ring on the track and the knob
 * glides on the standard ease at duration-normal (200ms) — smooth, inside
 * the 150-200ms interactive-motion ceiling, and instant under
 * prefers-reduced-motion.
 *
 * CONTRAST: the off track is `--control-track` (sepia-600): 3.31:1 on the
 * light page / 5.34:1 on the dark page, and 3.39:1 / 5.69:1 against the knob,
 * so the control reads as a control per WCAG 1.4.11. The on track is
 * `--accent`, which keeps the same knob separation (4.9:1 light, 8.78:1 dark);
 * the bright `--button-primary-background` amber it replaced left the white
 * knob at 1.67:1 in the light theme.
 *
 * Features:
 * - Accessible (ARIA attributes, keyboard support)
 * - Focus states matching design system
 * - Smooth knob glide (duration-normal), reduced-motion safe
 * - A required accessible name (`label`, `aria-label` or `aria-labelledby`);
 *   a visible label is clickable like a native control label
 * - Controlled (`checked`) or uncontrolled (`defaultChecked`)
 * - Optional icon inside knob (for special use cases like theme toggle)
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { resolveSize, type ControlSize, type ControlSizeProp } from "@/lib/size";
import { useControllableState } from "@/lib/use-controllable-state";
import { renderIconSlot, type IconSlot } from "@/lib/icon-slot";

/** Every Switch prop except the requirement that one accessible name is set. */
interface SwitchOwnProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "defaultChecked" | "aria-label" | "aria-labelledby"> {
  /** Whether the switch is on, for a controlled switch: keep it in state and update it from `onCheckedChange`. Omit it (and use `defaultChecked`) to let the switch keep its own state. */
  checked?: boolean;
  /** Whether an uncontrolled switch starts on. Ignored when `checked` is set. Default: false. */
  defaultChecked?: boolean;
  /** Called with the next value when the user clicks the track or label, or presses Space or Enter. A controlled switch cannot change without it. */
  onCheckedChange?: (checked: boolean) => void;
  /** Track size. The tap target is at least 44px tall at every size. */
  size?: ControlSizeProp;
  /** Visible label and accessible name; one of `label`, `aria-label` or `aria-labelledby` is required. Clicking it toggles the switch. Use `hideLabel` to keep it aria-only. */
  label?: string;
  /** Accessible name when there is no `label` (a theme toggle whose state is shown by an icon). Wins over `label` when both are set. */
  "aria-label"?: string;
  /** Id of visible text elsewhere that names the switch, such as a settings row heading. Wins over `label` and `aria-label`. */
  "aria-labelledby"?: string;
  /**
   * Keep `label` as the accessible name only (no visible text). Use in
   * compositions where the row already carries a visible heading, such as a
   * settings row, so the name isn't duplicated next to the track.
   */
  hideLabel?: boolean;
  /** Blocks interaction and dims the switch. Prefer explaining nearby why a setting is unavailable. */
  disabled?: boolean;
  /** Icon drawn inside the knob, for a switch whose two states have a picture (a moon and sun for the theme toggle). Takes a TuiIcon name (`"Check"`) or an element. */
  icon?: IconSlot | ReactNode;
}

/**
 * The name a Switch is announced by. The type requires one: a switch read as
 * only "on" or "off" does not say what it turns on.
 */
type SwitchName = { label: string } | { "aria-label": string } | { "aria-labelledby": string };

/** Props of `Switch`: its own props plus a required accessible name, given as `label`, `aria-label` or `aria-labelledby`. */
export type SwitchProps = SwitchOwnProps & SwitchName;

/**
 * Track and knob geometry, read straight off the `global.switch` tokens.
 * `travel` is the knob's x offset when on (track width - knob size - inset)
 * and `inset` its x offset when off, so the glide never needs a literal.
 */
const SWITCH_GEOMETRY: Record<ControlSize, {
  track: string;
  knob: string;
  knobOff: string;
  knobOn: string;
  iconSize: string;
}> = {
  sm: {
    track: "h-[var(--switch-track-height-sm)] w-[var(--switch-track-width-sm)]",
    knob: "h-[var(--switch-knob-size-sm)] w-[var(--switch-knob-size-sm)]",
    knobOff: "var(--switch-knob-inset-sm)",
    knobOn: "var(--switch-knob-travel-sm)",
    iconSize: "w-3 h-3",
  },
  md: {
    track: "h-[var(--switch-track-height-md)] w-[var(--switch-track-width-md)]",
    knob: "h-[var(--switch-knob-size-md)] w-[var(--switch-knob-size-md)]",
    knobOff: "var(--switch-knob-inset-md)",
    knobOn: "var(--switch-knob-travel-md)",
    iconSize: "w-3 h-3",
  },
  lg: {
    track: "h-[var(--switch-track-height-lg)] w-[var(--switch-track-width-lg)]",
    knob: "h-[var(--switch-knob-size-lg)] w-[var(--switch-knob-size-lg)]",
    knobOff: "var(--switch-knob-inset-lg)",
    knobOn: "var(--switch-knob-travel-lg)",
    iconSize: "w-4 h-4",
  },
};

/**
 * A toggle for a setting that takes effect at once, such as a preference; for a choice submitted with a form use `Checkbox`.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      size: sizeProp = "md",
      label,
      "aria-label": ariaLabel,
      hideLabel = false,
      disabled = false,
      icon,
      className = "",
      ...props
    },
    ref
  ) => {
    const size = resolveSize(sizeProp, "Switch");
    const geometry = SWITCH_GEOMETRY[size];

    // Controlled when `checked` is set; otherwise the switch keeps its own
    // state, seeded from `defaultChecked`. `onCheckedChange` fires either way.
    const [checked, setChecked] = useControllableState({
      value: checkedProp,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });

    const handleClick = () => {
      if (!disabled) setChecked(!checked);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Switch Track */}
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={ariaLabel ?? (label || undefined)}
          disabled={disabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={`
            group relative inline-flex shrink-0
            before:content-[''] before:absolute before:inset-x-0 before:top-1/2 before:-translate-y-1/2 before:h-touch
            focus:outline-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          {...props}
        >
          {/* Track: the visible plate */}
          <span
            aria-hidden="true"
            data-state={checked ? "on" : "off"}
            className={`
              relative inline-flex items-center
              ${geometry.track}
              plate-round
              transition-colors [transition-duration:var(--duration-normal)] motion-reduce:transition-none
              group-focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]
              ${checked
                ? 'bg-[var(--accent)]'
                : 'bg-[var(--control-track)]'
              }
            `}
          >
          {/* Sliding Knob */}
          <span
            className={`
              inline-flex items-center justify-center
              ${geometry.knob}
              plate-round
              bg-[var(--field-background)]
              shadow-none
              transform transition-transform [transition-duration:var(--duration-normal)] motion-reduce:transition-none
            `}
            style={{
              transform: `translateX(${checked ? geometry.knobOn : geometry.knobOff})`,
            }}
          >
            {/* Optional icon inside knob */}
            {icon && (
              <span className={geometry.iconSize}>
                {renderIconSlot(icon)}
              </span>
            )}
          </span>
          </span>
        </button>

        {/* Optional Label (skipped when hideLabel keeps it aria-only). It is not
            a <label> (a button is not a labelable element), so the click is
            wired by hand; the accessible name still comes from aria-label. */}
        {label && !hideLabel && (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the visible label forwards pointer clicks to the switch button, which is the keyboard path
          <span
            onClick={handleClick}
            className={`select-none text-sm font-mono ${
              disabled
                ? 'cursor-not-allowed text-secondary-700 dark:text-secondary-400'
                : 'cursor-pointer text-[var(--text-primary)]'
            }`}
          >
            {label}
          </span>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
