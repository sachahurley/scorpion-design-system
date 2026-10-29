/**
 * COMBOBOX COMPONENT
 *
 * A text field with a filtered listbox: type to narrow a long list, then pick
 * one option. Use it instead of Select when the list is long enough that
 * scanning hurts (countries, repos, people). Built on Popover's positioning,
 * so the list flips above the field near the bottom of the viewport.
 *
 * PATTERN: WAI-ARIA 1.2 combobox with a listbox popup and list autocomplete.
 * Focus never leaves the input; the highlighted option is conveyed with
 * `aria-activedescendant`.
 *
 * KEYBOARD:
 * - ArrowDown / ArrowUp: open the list, then move the highlight (wraps)
 * - Alt+ArrowDown: open without moving the highlight
 * - Home / End: first / last option while the list is open
 * - Enter: pick the highlighted option
 * - Escape: close the list (restoring the committed label); when already
 *   closed, clear the field
 * - Tab: close and move on (nothing is picked implicitly)
 *
 * VISUAL: Input's plate ring recipe (field ring ramp: idle, hover, focus
 * accent, error) and control-height sizes; the list is a Popover plate.
 *
 * TOKENS USED:
 * - field.background(-error), field.border(-hover/-focus/-error), field.placeholder
 * - surface.card, surface.container-stroke, surface.subtle (highlight)
 * - text.primary, text.secondary, border.focus (selected check)
 * - control-height.sm|md|lg, duration.fast
 */

import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import type { ControlSize } from "@/lib/size";
import { cn } from "@/lib/utils";
import { useControllableState } from "@/lib/use-controllable-state";
import { Popover } from "./Popover";
import { TuiIcon } from "./TuiIcon";

/** One entry in a Combobox list. */
export interface ComboboxOption {
  /** Value reported through `onValueChange` and the hidden form input. */
  value: string;
  /** Text shown in the list and in the field once picked. */
  label: string;
  /** Shown but not selectable; skipped by keyboard navigation. */
  disabled?: boolean;
}

export interface ComboboxProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size" | "value" | "defaultValue" | "onChange" | "role" | "type"
  > {
  /** Options to filter and choose from. */
  options: ComboboxOption[];
  /** Controlled selected value (`null` for nothing picked). Pair with `onValueChange`. */
  value?: string | null;
  /** Initial selected value when uncontrolled. */
  defaultValue?: string | null;
  /** Called with the picked value and option (or `null` when the field is cleared). */
  onValueChange?: (value: string | null, option: ComboboxOption | null) => void;
  /** Called on every keystroke with the raw query text. */
  onInputChange?: (query: string) => void;
  /**
   * Custom matcher. Defaults to a case-insensitive "label contains query".
   * Return true to keep the option in the list.
   */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Message shown when nothing matches (default "No matches"). */
  emptyText?: ReactNode;
  /** Field height: sm 32px, md 40px (default), lg 48px. */
  size?: ControlSize;
  /** Visible label, wired to the input. Without it, pass `aria-label`. */
  label?: ReactNode;
  /** Hint under the field. Linked via `aria-describedby`. */
  helperText?: ReactNode;
  /** Validation message under the field; sets `aria-invalid` and replaces `helperText`. */
  errorMessage?: ReactNode;
  /** Error styling without a message. Prefer `errorMessage`. */
  error?: boolean;
  /** Open the list when the field gains focus (default false: opens on typing, click, or arrows). */
  openOnFocus?: boolean;
  /**
   * Render the list into `document.body`. Needed inside plate-clipped
   * containers (Card, Modal): clip-path clips fixed-position descendants.
   */
  portal?: boolean;
  /** Extra classes for the outer wrapper (width). */
  className?: string;
}

const defaultFilter = (option: ComboboxOption, query: string) =>
  option.label.toLowerCase().includes(query.trim().toLowerCase());

/**
 * A text input that filters a list of options as the user types, for choosing one value from a list too long to scan.
 *
 * @example
 * <Combobox
 *   label="Country"
 *   options={[{ value: "ca", label: "Canada" }, { value: "fr", label: "France" }]}
 *   onValueChange={(value) => setCountry(value)}
 * />
 *
 * @param options - `{ value, label, disabled? }` entries
 * @param value / defaultValue / onValueChange - Controlled or uncontrolled selection
 * @param filter - Custom matcher (default: label contains query)
 * @param emptyText - Shown when no option matches
 */
export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    options,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    onInputChange,
    filter = defaultFilter,
    emptyText = "No matches",
    size = "md",
    label,
    helperText,
    errorMessage,
    error: errorProp = false,
    openOnFocus = false,
    portal = false,
    disabled = false,
    placeholder,
    name,
    id: idProp,
    className,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    onKeyDown,
    onFocus,
    onBlur,
    ...inputProps
  },
  forwardedRef
) {
  const field = useFieldMessage({ error: errorProp, helperText, errorMessage, describedBy: ariaDescribedBy });
  const autoId = useId();
  const inputId = idProp ?? `${autoId}-input`;
  const listboxId = `${autoId}-listbox`;
  const labelId = `${autoId}-label`;
  // The popup when nothing matches: aria-expanded="true" requires aria-controls
  const emptyId = `${autoId}-empty`;
  const optionId = (index: number) => `${autoId}-option-${index}`;

  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
  });
  const selected = options.find((o) => o.value === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  // True once the user types; false after a pick or a close. While false the
  // full list shows, so reopening a filled field offers every option.
  const [filtering, setFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const ringRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the field text in step with the committed selection
  useEffect(() => {
    if (!open) setQuery(selected?.label ?? "");
  }, [selected?.label, open]);

  const visible = useMemo(
    () => (filtering && query !== "" ? options.filter((o) => filter(o, query)) : options),
    [filtering, query, options, filter]
  );

  const enabledIndexes = visible.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const firstEnabled = enabledIndexes[0] ?? -1;
  const lastEnabled = enabledIndexes[enabledIndexes.length - 1] ?? -1;

  const step = (from: number, dir: 1 | -1) => {
    if (enabledIndexes.length === 0) return -1;
    const pos = enabledIndexes.indexOf(from);
    if (pos === -1) return dir === 1 ? firstEnabled : lastEnabled;
    const next = (pos + dir + enabledIndexes.length) % enabledIndexes.length;
    return enabledIndexes[next];
  };

  const openList = (highlight: "selected" | "first" | "last" | "none") => {
    if (disabled) return;
    setOpen(true);
    const selectedIndex = selected ? visible.findIndex((o) => o.value === selected.value && !o.disabled) : -1;
    if (highlight === "selected") setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled);
    else if (highlight === "first") setActiveIndex(firstEnabled);
    else if (highlight === "last") setActiveIndex(lastEnabled);
    else setActiveIndex(-1);
  };

  const closeList = () => {
    setOpen(false);
    setFiltering(false);
    setActiveIndex(-1);
    setQuery(selected?.label ?? "");
  };

  const commit = (option: ComboboxOption | null) => {
    setValue(option?.value ?? null);
    if ((option?.value ?? null) !== value) onValueChange?.(option?.value ?? null, option);
    setQuery(option?.label ?? "");
    setFiltering(false);
    setOpen(false);
    setActiveIndex(-1);
  };

  // Scroll the highlighted option into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = document.getElementById(optionId(activeIndex));
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
    setFiltering(true);
    onInputChange?.(next);
    if (!disabled) {
      setOpen(true);
      // Highlight the first match so Enter picks it (list autocomplete)
      const matches = next === "" ? options : options.filter((o) => filter(o, next));
      setActiveIndex(matches.findIndex((o) => !o.disabled));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList(e.altKey ? "none" : "selected");
        else setActiveIndex((i) => step(i, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList(selected ? "selected" : "last");
        else setActiveIndex((i) => step(i, -1));
        break;
      case "Home":
        if (open && enabledIndexes.length) {
          e.preventDefault();
          setActiveIndex(firstEnabled);
        }
        break;
      case "End":
        if (open && enabledIndexes.length) {
          e.preventDefault();
          setActiveIndex(lastEnabled);
        }
        break;
      case "Enter":
        if (open && activeIndex >= 0 && visible[activeIndex] && !visible[activeIndex].disabled) {
          e.preventDefault();
          commit(visible[activeIndex]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeList();
        } else if (query !== "" || value != null) {
          e.preventDefault();
          commit(null);
        }
        break;
      case "Tab":
        if (open) closeList();
        break;
    }
  };

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const sizeStyles = {
    sm: { input: "h-control-sm pl-3 pr-9", icon: "right-3" },
    md: { input: "h-control-md pl-4 pr-10", icon: "right-4" },
    lg: { input: "h-control-lg pl-5 pr-11", icon: "right-5" },
  }[size];

  const invalid = field.invalid;
  // Focus wins over error on the ring. Without the focus-within override an
  // errored field showed no focus change at all, which fails WCAG 2.4.7; the
  // error stays conveyed by the error fill and the message below, so it is
  // still carried by more than one channel.
  const ringStyles = invalid
    ? "bg-[var(--field-border-error)] focus-within:!bg-[var(--field-border-focus)]"
    : "bg-[var(--field-border)] hover:bg-[var(--field-border-hover)] focus-within:!bg-[var(--field-border-focus)]";

  const hasLabel = label != null && label !== "";
  const activeDescendant = open && activeIndex >= 0 && visible[activeIndex] ? optionId(activeIndex) : undefined;

  // The list renders outside the field column: the ring's clip-path would
  // clip it, and the column's space-y margin would offset the fixed panel.
  return (
    <div className={cn("w-full", className)}>
    <div className="w-full space-y-1">
      {hasLabel && (
        <label
          id={labelId}
          htmlFor={inputId}
          className="block font-mono text-sm text-secondary-800 dark:text-secondary-200"
        >
          {label}
        </label>
      )}

      <div
        ref={ringRef}
        className={cn(
          "relative w-full plate-round p-px transition-colors [transition-duration:var(--duration-fast)]",
          ringStyles,
          disabled && "opacity-50"
        )}
      >
        <input
          {...inputProps}
          ref={setRefs}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? (visible.length > 0 ? listboxId : emptyId) : undefined}
          aria-activedescendant={activeDescendant}
          aria-invalid={invalid || undefined}
          aria-describedby={field.describedBy}
          aria-label={hasLabel ? undefined : ariaLabel}
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!open) openList("selected");
          }}
          onFocus={(e) => {
            onFocus?.(e);
            if (openOnFocus && !open) openList("selected");
          }}
          onBlur={(e) => {
            onBlur?.(e);
            // Leaving the field abandons the query (options keep focus on
            // the input by preventing mousedown, so a pick never blurs)
            if (open) closeList();
          }}
          className={cn(
            "w-full plate-round font-mono text-sm",
            "transition-colors [transition-duration:var(--duration-fast)]",
            "placeholder:text-[var(--field-placeholder)] focus:outline-none disabled:cursor-not-allowed",
            invalid
              ? "bg-[var(--field-background-error)] text-[var(--text-primary)]"
              : "bg-[var(--field-background)] text-[var(--text-primary)]",
            sizeStyles.input
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 inline-flex text-[var(--text-secondary)]",
            "transition-transform [transition-duration:var(--duration-normal)] motion-reduce:transition-none",
            open && "rotate-180",
            sizeStyles.icon
          )}
        >
          <TuiIcon name="ChevronDown" />
        </span>
      </div>

      <FieldMessage {...field.message} />
    </div>

      {name != null && <input type="hidden" name={name} value={value ?? ""} />}

      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next) closeList();
        }}
        anchorRef={ringRef}
        role={null}
        autoFocus={false}
        returnFocus={false}
        closeOnEscape={false}
        matchAnchorWidth
        portal={portal}
        offset={4}
        contentClassName="p-0"
      >
        {visible.length > 0 ? (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={hasLabel ? labelId : undefined}
            aria-label={hasLabel ? undefined : ariaLabel}
            className="max-h-[min(var(--control-menu-max-height),var(--popover-available-height,var(--control-menu-max-height)))] overflow-y-auto py-1"
          >
            {visible.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- pointer path only; the keyboard selects through the input with aria-activedescendant
                <li
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  // Keep focus in the input while clicking
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => {
                    if (!option.disabled && activeIndex !== index) setActiveIndex(index);
                  }}
                  onClick={() => {
                    if (!option.disabled) commit(option);
                  }}
                  className={cn(
                    "flex min-h-touch items-center gap-2 px-4 py-2 font-mono text-sm",
                    option.disabled
                      ? "cursor-not-allowed text-[var(--text-disabled)]"
                      : "cursor-pointer text-[var(--text-primary)]",
                    isActive && !option.disabled && "bg-[var(--surface-subtle)]"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {isSelected && (
                    <TuiIcon name="Check" className="shrink-0 text-[var(--border-focus)]" />
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div id={emptyId} role="status" className="px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
            {emptyText}
          </div>
        )}
      </Popover>
    </div>
  );
});

Combobox.displayName = "Combobox";
