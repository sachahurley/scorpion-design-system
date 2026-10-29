/**
 * SELECT COMPONENT
 * 
 * Custom select dropdown component with multiple sizes
 * Uses custom dropdown menu matching Dropdown component styling
 * Built entirely from design tokens defined in tokens.json
 * 
 * SIZES: Matching input heights
 * - sm: 32px height
 * - md: 40px height (default)
 * - lg: 48px height
 * 
 * STATES:
 * - default: Standard select appearance
 * - hover: Subtle border change on mouse over
 * - focused: Primary color focus ring (keyboard accessible)
 * - disabled: Reduced opacity, not interactive
 * - error: Red border to indicate validation issues
 * 
 * Features:
 * - Custom dropdown menu matching Dropdown component styling
 * - Keyboard navigation (Arrow keys, Escape, Enter, Tab closes), announced
 *   through `aria-activedescendant` on the trigger
 * - Click outside to close
 * - Maintains form compatibility with hidden native select
 * - Children are flattened, so fragments, arrays and `<optgroup>` all work
 */

import { Children, Fragment, isValidElement, useState, useRef, useEffect, forwardRef, useImperativeHandle, useId, type ReactElement, type ReactNode, type SelectHTMLAttributes } from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import { TuiIcon } from "./TuiIcon";
import { resolveSize, type ControlSizeProp } from "@/lib/size";

/** One flattened option, plus the label of the `<optgroup>` it came from. */
interface ParsedOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

/** Text of an option child: a string, a number, or a run of them. */
function optionLabel(children: ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (Array.isArray(children)) return children.map(optionLabel).join("");
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (isValidElement(children)) {
    return optionLabel((children.props as { children?: ReactNode }).children);
  }
  return String(children);
}

/**
 * Flattens `children` into options.
 *
 * `Children.forEach` already walks arrays (a static option next to a mapped
 * list), fragments are unwrapped here, and `<optgroup>` children are read with
 * the group's `label` and `disabled` inherited, so nothing is silently dropped.
 * Any other element is still read as an option (its `value`, text and
 * `disabled`), which keeps custom option wrappers working as before.
 */
function parseOptions(children: ReactNode, group?: string, groupDisabled?: boolean, out: ParsedOption[] = []): ParsedOption[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{
      value?: string | number | readonly string[];
      children?: ReactNode;
      disabled?: boolean;
      label?: string;
    }>;
    const props = element.props;

    if (element.type === Fragment) {
      parseOptions(props.children, group, groupDisabled, out);
      return;
    }

    if (element.type === "optgroup") {
      parseOptions(props.children, props.label ?? group, props.disabled || groupDisabled, out);
      return;
    }

    const label = optionLabel(props.children);
    out.push({
      // Native fallback: an option with no `value` submits its text
      value: props.value != null ? String(props.value) : label,
      label,
      disabled: props.disabled || groupDisabled || undefined,
      group,
    });
  });

  return out;
}

/**
 * Moves the highlight to the next non-disabled option, wrapping at both ends.
 * Indices are raw `options` indices, so the highlighted row, the row Enter
 * selects and the row `aria-activedescendant` names are always the same one.
 */
function nextEnabledIndex(options: ParsedOption[], from: number, delta: 1 | -1): number {
  const count = options.length;
  if (count === 0) return -1;
  let index = from;
  for (let step = 0; step < count; step++) {
    index += delta;
    if (index >= count) index = 0;
    if (index < 0) index = count - 1;
    if (!options[index]?.disabled) return index;
  }
  return -1;
}

// Define the props interface for the Select component
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Trigger height: sm 32px, md 40px (default), lg 48px. Legacy names are deprecated aliases. */
  size?: ControlSizeProp;
  /** Error styling without a message. Prefer `errorMessage` so users learn what to fix. */
  error?: boolean;
  /** Hint shown under the trigger. Linked via `aria-describedby`. */
  helperText?: ReactNode;
  /**
   * Validation message shown under the trigger. Sets the error state and
   * `aria-invalid`, and replaces `helperText` while present.
   */
  errorMessage?: ReactNode;
  /**
   * Optional visible label; associates with the custom trigger via `htmlFor` / `id` on the button.
   */
  label?: ReactNode;
}

/**
 * A form control for choosing one value from a short, fixed list of options.
 * 
 * @param size - Select size matching input heights (default: "md")
 * @param error - Whether select has a validation error
 * @param disabled - Whether select is disabled
 * @param className - Additional CSS classes to apply
 * @param children - Option elements to display in the dropdown
 * @param value - Controlled value
 * @param defaultValue - Uncontrolled default value
 * @param onChange - Change handler
 * @param label - Optional visible label for the custom trigger (preferred over relying on `aria-label` alone)
 * @param helperText - Hint under the trigger
 * @param errorMessage - Validation message under the trigger (implies `error`)
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({
  size: sizeProp = "md",
  error: errorProp = false,
  helperText,
  errorMessage,
  disabled = false,
  className = "",
  children,
  value,
  defaultValue,
  onChange,
  name,
  label,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  id: htmlId,
  ...props
}, ref) {
    const size = resolveSize(sizeProp, "Select");
  const field = useFieldMessage({ error: errorProp, helperText, errorMessage, describedBy: ariaDescribedBy });
  const error = field.invalid;
  const autoId = useId();
  const triggerId = htmlId ?? `${autoId}-trigger`;
  const listboxId = `${autoId}-listbox`;
  const labelId = `${autoId}-label`;
  /** Stable id per option, so the trigger can point `aria-activedescendant` at it. */
  const optionId = (index: number) => `${autoId}-option-${index}`;

  const options = parseOptions(children);

  // Consecutive options from the same `<optgroup>`, for the group headings
  const optionGroups: Array<{ label?: string; entries: Array<{ option: ParsedOption; index: number }> }> = [];
  options.forEach((option, index) => {
    const current = optionGroups[optionGroups.length - 1];
    if (current && current.label === option.group) {
      current.entries.push({ option, index });
    } else {
      optionGroups.push({ label: option.group, entries: [{ option, index }] });
    }
  });

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedValue, setSelectedValue] = useState<string>(
    value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : options[0]?.value || ''
  );
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);

  // Sync with controlled value prop
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(String(value));
      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = String(value);
      }
    }
  }, [value]);

  // Expose ref to hidden select element
  useImperativeHandle(ref, () => hiddenSelectRef.current as HTMLSelectElement);

  // Get selected option label
  const selectedOption = options.find(opt => opt.value === selectedValue);
  const selectedLabel = selectedOption?.label || '';

  // Toggle dropdown open/closed
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedIndex(-1);
      }
    }
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    if (value === undefined) {
      // Uncontrolled mode
      setSelectedValue(optionValue);
    }
    
    // Update hidden select for form submission
    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = optionValue;
    }
    
    // Call onChange if provided
    if (onChange) {
      const syntheticEvent = {
        target: { value: optionValue, name },
        currentTarget: { value: optionValue, name },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
    
    closeDropdown();
  };

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Only handle if dropdown is focused or open
      if (!dropdownRef.current?.contains(event.target as Node) && !isOpen) {
        return;
      }

      if (!isOpen) {
        // Allow opening with Enter/Space/ArrowDown/ArrowUp when closed
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          if (dropdownRef.current?.contains(event.target as Node)) {
            event.preventDefault();
            toggleDropdown();
            // Highlight the selected option, or the first enabled one
            const selectedIndex = options.findIndex(opt => opt.value === selectedValue && !opt.disabled);
            setFocusedIndex(selectedIndex >= 0 ? selectedIndex : nextEnabledIndex(options, -1, 1));
          }
        }
        return;
      }

      const currentIndex = focusedIndex;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          closeDropdown();
          break;

        case "Tab":
          // Let focus move on, but never leave an orphaned menu behind
          closeDropdown();
          break;

        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prevIndex) => nextEnabledIndex(options, prevIndex, 1));
          break;

        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prevIndex) => nextEnabledIndex(options, prevIndex, -1));
          break;

        case "Enter":
        case " ":
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < options.length && !options[currentIndex].disabled) {
            handleSelect(options[currentIndex].value);
          }
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, focusedIndex, options, selectedValue]);

  // Scroll focused item into view. `focusedIndex` is a raw option index and
  // the option buttons render in that same order, so no remapping is needed.
  useEffect(() => {
    if (focusedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll('[role="option"]');
      const focusedItem = items[focusedIndex] as HTMLElement | undefined;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  // Size styles matching Dropdown component exactly
  const sizeStyles = {
    sm: {
      trigger: "h-control-sm px-4 py-1.5 plate-round",
      menu: "",
      menuItem: "",
      icon: "w-4 h-4",
    },
    md: {
      trigger: "h-control-md px-4 py-2.5 plate-round",
      menu: "",
      menuItem: "",
      icon: "w-5 h-5",
    },
    lg: {
      trigger: "h-control-lg px-4 py-3.5 plate-round",
      menu: "",
      menuItem: "",
      icon: "w-6 h-6",
    },
  };

  const currentSizeStyles = sizeStyles[size];

  // STATE STYLES - Color combinations for different states using SEMANTIC TOKENS
  const triggerStyles = error
    ? `bg-[var(--field-background-error)] text-[var(--text-primary)]`
    : `bg-[var(--field-background)] text-[var(--text-primary)]`;

  // PLATE RING RECIPE — wrapper carries the border color (portfolio ramp:
  // idle hairline → hover mut → focus accent); the trigger is the inset fill.
  // Focus wins over error on the ring. Without the focus-within override an
  // errored field showed no focus change at all, which fails WCAG 2.4.7; the
  // error stays conveyed by the error fill and the message below, so it is
  // still carried by more than one channel.
  const triggerRing = error
    ? "bg-[var(--field-border-error)] focus-within:!bg-[var(--field-border-focus)]"
    : "bg-[var(--field-border)] hover:bg-[var(--field-border-hover)] focus-within:!bg-[var(--field-border-focus)]";

  const hasLabel = label != null && label !== "";

  const triggerBlock = (
    <div ref={dropdownRef} className="relative inline-block w-full">
      {/* Hidden native select for form submission */}
      <select
        ref={hiddenSelectRef}
        name={name}
        value={selectedValue}
        onChange={onChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom trigger button — inset fill of the plate ring */}
      <div className={`plate-round p-px transition-colors [transition-duration:var(--duration-fast)] ${triggerRing} ${disabled ? 'opacity-50' : ''}`}>
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- known gap: the trigger should be a select-only combobox, see docs/specs/Select.md */}
      <button
        type="button"
        id={triggerId}
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full
          flex items-center justify-between
          font-mono text-sm
          transition-colors [transition-duration:var(--duration-fast)]
          ${currentSizeStyles.trigger}
          ${triggerStyles}
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        // Names the highlighted option so screen readers announce it while
        // arrowing; focus itself never leaves the trigger.
        aria-activedescendant={isOpen && focusedIndex >= 0 ? optionId(focusedIndex) : undefined}
        aria-invalid={error || undefined}
        aria-describedby={field.describedBy}
        aria-label={hasLabel ? undefined : ariaLabel ?? "Select an option"}
      >
        <span className="truncate text-left flex-1">{selectedLabel || 'Select...'}</span>
        {/* 1-bit ChevronDown, rotated while the menu is open */}
        <span
          className={`
            ${currentSizeStyles.icon}
            inline-flex items-center justify-center font-mono leading-none
            text-[var(--text-secondary)]
            transition-transform [transition-duration:var(--duration-normal)]
            flex-shrink-0 ml-2
            ${isOpen ? 'rotate-180' : ''}
            ${disabled ? 'opacity-50' : ''}
          `}
          aria-hidden="true"
        >
          <TuiIcon name="ChevronDown" />
        </span>
      </button>
      </div>

      {/* Custom dropdown menu: plate ring recipe, matching Dropdown.
          Layer: --z-index-dropdown. The menu is absolutely positioned inside
          the field's own stacking context (no portal), so it only competes
          with siblings there; the popover and modal layers own their own
          contexts. Width min-w-52 (208px) and height max-h-80 (320px, about
          seven 44px rows) come from the spacing scale. */}
      {isOpen && (
        <div
          style={{ animationDuration: "var(--duration-normal)" }}
          className={`
            absolute top-full mt-2 left-0 right-0
            min-w-52
            plate-round p-px bg-[var(--border-default)]
            z-[var(--z-index-dropdown)]
            animate-in fade-in slide-in-from-top-2
          `}
        >
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={hasLabel ? labelId : undefined}
          aria-label={hasLabel ? undefined : ariaLabel ?? "Select an option"}
          className={`plate-round bg-[var(--surface-card)] ${currentSizeStyles.menu} max-h-80 overflow-y-auto`}
        >
          {optionGroups.map((group, groupIndex) => {
            const headingId = `${autoId}-group-${groupIndex}`;
            const rows = group.entries.map(({ option, index }) => {
            const isDisabled = option.disabled;
            const isSelected = option.value === selectedValue;
            const isFocused = focusedIndex === index && !isDisabled;

            return (
              <button
                key={index}
                id={optionId(index)}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                onClick={() => !isDisabled && handleSelect(option.value)}
                className={`
                  w-full flex items-center gap-2
                  px-4 py-3
                  font-mono text-sm text-left
                  transition-colors [transition-duration:var(--duration-fast)]
                  ${isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-muted)] cursor-pointer'
                  }
                  ${isFocused ? 'bg-[var(--surface-muted)] text-[var(--accent)]' : ''}
                  ${currentSizeStyles.menuItem}
                `}
              >
                {/* Option label */}
                <span className="truncate flex-1 min-w-0">{option.label}</span>

                {/* 1-bit Check on the current value */}
                {isSelected && (
                  <span className={`${currentSizeStyles.icon} inline-flex items-center justify-center font-mono font-bold text-[var(--border-focus)] flex-shrink-0`} aria-hidden="true"><TuiIcon name="Check" /></span>
                )}
              </button>
            );
            });

            // Ungrouped options render flat; an `<optgroup>` becomes a
            // labelled `role="group"` with a quiet heading row.
            if (group.label == null) return <Fragment key={groupIndex}>{rows}</Fragment>;
            return (
              <div key={groupIndex} role="group" aria-labelledby={headingId}>
                <div
                  id={headingId}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wide text-[var(--text-secondary)]"
                >
                  {group.label}
                </div>
                {rows}
              </div>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );

  if (!hasLabel && !field.hasMessage) {
    return <div className={`w-full ${className}`.trim()}>{triggerBlock}</div>;
  }

  return (
    <div className={`w-full space-y-1 ${className}`.trim()}>
      {hasLabel && (
        <label
          id={labelId}
          htmlFor={triggerId}
          className="block font-mono text-sm text-secondary-800 dark:text-secondary-200"
        >
          {label}
        </label>
      )}
      {triggerBlock}
      <FieldMessage {...field.message} />
    </div>
  );
});

// Set display name for debugging
Select.displayName = "Select";
