/**
 * DROPDOWN COMPONENT
 * 
 * A button that opens a menu of actions (action menu dropdown)
 * Built with accessibility in mind - keyboard navigation, ARIA attributes
 * 
 * Features:
 * - Click outside to close
 * - Keyboard navigation (Arrow keys, Escape, Enter, Tab closes)
 * - Customizable trigger (any React element)
 * - Icon support for menu items
 * - Destructive action styling
 * - Left or right alignment
 *
 * Every button here is `type="button"`, so a Dropdown inside a `<form>`
 * opens the menu instead of submitting the form.
 */

import { useState, useRef, useEffect, cloneElement, isValidElement, type MouseEvent as ReactMouseEvent, type ReactElement, type ReactNode } from "react";
import { TuiIcon } from "./TuiIcon";
import { resolveSize, type ControlSizeProp } from "@/lib/size";

// Menu item interface
export interface DropdownItem {
  /** Item text and accessible name. Write it as a verb ("Duplicate"). */
  label: string;
  /** Called on activation; the menu then closes. */
  onClick: () => void;
  /** Left icon grouped with the label (use a `TuiIcon`). */
  icon?: ReactNode;
  /** Right-aligned icon, for a shortcut hint or an external-link marker. */
  iconRight?: ReactNode;
  /** `destructive` colors the item red for irreversible actions. */
  variant?: "default" | "destructive";
  /** Dims the item, blocks activation, and skips it during arrow-key navigation. */
  disabled?: boolean;
}

// Dropdown component props
export interface DropdownProps {
  /**
   * Custom trigger, replacing the default button. A valid React element is
   * cloned: the toggle handler, `aria-haspopup` and `aria-expanded` are
   * attached to the element itself, so pass an interactive, focusable control
   * (a `Button`, for example) and not a bare `<span>`. Anything that is not an
   * element (a string, a fragment, an array) falls back to a `div` wrapper
   * with `role="button"` and `tabIndex={0}`.
   */
  trigger?: ReactNode;
  /** Menu entries, in order. */
  items: DropdownItem[];
  /** Which trigger edge the menu aligns to. Use `right` near the viewport edge. */
  align?: "left" | "right";
  /** Text (and accessible name) of the default trigger button. Ignored with a custom `trigger`. */
  label?: string;
  /** Trigger height, matching Button/Input: sm, md (default), lg. Legacy names are deprecated aliases. */
  size?: ControlSizeProp;
}

/**
 * Moves the highlight to the next non-disabled item, wrapping at both ends.
 * Indices are raw `items` indices (never a filtered list), so the highlighted
 * row and the row Enter activates are always the same one.
 */
function nextEnabledIndex(items: DropdownItem[], from: number, delta: 1 | -1): number {
  const count = items.length;
  if (count === 0) return -1;
  let index = from;
  for (let step = 0; step < count; step++) {
    index += delta;
    if (index >= count) index = 0;
    if (index < 0) index = count - 1;
    if (!items[index]?.disabled) return index;
  }
  return -1;
}

/**
 * A button that opens a menu of commands; for choosing a form value use `Select` instead.
 *
 * @param trigger - Custom trigger element (optional, defaults to button)
 * @param items - Array of menu items with labels, onClick handlers, and optional icons
 * @param align - Menu alignment: "left" or "right" (default: "left")
 * @param label - Label text for default trigger button (default: "Actions")
 * @param size - Default trigger height and item icon size (default: "md")
 */
export function Dropdown({ 
  trigger, 
  items, 
  align = "left",
  label = "Actions",
  size: sizeProp = "md"
}: DropdownProps) {
    const size = resolveSize(sizeProp, "Dropdown");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown open/closed
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(-1); // Reset focus when opening
    }
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Handle item click
  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick();
      closeDropdown();
    }
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
      if (!isOpen) return;

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
          setFocusedIndex((prevIndex) => nextEnabledIndex(items, prevIndex, 1));
          break;

        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prevIndex) => nextEnabledIndex(items, prevIndex, -1));
          break;

        case "Enter":
        case " ":
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < items.length) {
            handleItemClick(items[currentIndex]);
          }
          break;
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, focusedIndex, items]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll('[role="menuitem"]');
      const focusedItem = items[focusedIndex] as HTMLElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  // Size styles matching buttons and inputs
  // Small: 32px height / Medium: 40px / Large: 48px
  // Corners: plate silhouette (--plate-round) is the shape language; radius tokens are retired
  const sizeStyles = {
    sm: {
      button: "h-control-sm px-4 py-1.5 plate-round",
      menu: "",
      menuItem: "",
      icon: "w-4 h-4",
    },
    md: {
      button: "h-control-md px-5 py-2.5 plate-round",
      menu: "",
      menuItem: "",
      icon: "w-5 h-5",
    },
    lg: {
      button: "h-control-lg px-6 py-3.5 plate-round",
      menu: "",
      menuItem: "",
      icon: "w-6 h-6",
    },
  };

  const currentSizeStyles = sizeStyles[size];

  // Default trigger button if none provided
  const defaultTrigger = (
    <button
      type="button"
      onClick={toggleDropdown}
      className={`
        inline-flex items-center justify-center gap-2
        font-mono text-sm
        ${currentSizeStyles.button}
        transition-colors [transition-duration:var(--duration-normal)]
        cursor-pointer
        bg-[var(--button-secondary-background)] hover:bg-[var(--button-secondary-background-hover)] active:brightness-95
        text-[var(--button-secondary-text)] hover:text-[var(--button-secondary-text-hover)]
        focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-secondary)]
      `}
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      {label}
      {/* 1-bit ChevronDown, rotated while the menu is open */}
      <span className={`${currentSizeStyles.icon} inline-flex items-center justify-center font-mono leading-none transition-transform [transition-duration:var(--duration-normal)] ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true"><TuiIcon name="ChevronDown" /></span>
    </button>
  );

  // CUSTOM TRIGGER: clone it and attach the toggle plus the menu ARIA to the
  // element itself. Wrapping it in another `role="button"` element (the old
  // behavior) nested one interactive control inside another and created a
  // second tab stop. The element must therefore be focusable on its own: a
  // `Button` is the intended case; a plain `<span>` gets no keyboard.
  // Non-elements (a string, a fragment, an array) keep the div fallback,
  // which still carries role, tabIndex, keyboard handling and the ARIA.
  const triggerProps = {
    "aria-haspopup": "true" as const,
    "aria-expanded": isOpen,
  };

  let triggerElement: ReactNode;
  if (!trigger) {
    triggerElement = defaultTrigger;
  } else if (isValidElement(trigger)) {
    const element = trigger as ReactElement<{ onClick?: (event: ReactMouseEvent) => void }>;
    triggerElement = cloneElement(element, {
      ...triggerProps,
      onClick: (event: ReactMouseEvent) => {
        element.props.onClick?.(event);
        toggleDropdown();
      },
    });
  } else {
    triggerElement = (
      <div
        {...triggerProps}
        onClick={toggleDropdown}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        {trigger}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger */}
      {triggerElement}

      {/* Dropdown Menu — plate ring recipe (border color clipped + fill inset 1px;
          clip-path slices real borders, so the ring is a wrapper layer).
          Layer: --z-index-dropdown. The menu is absolutely positioned inside
          the trigger's stacking context (no portal), so it only competes with
          siblings there; the popover and modal layers own their own contexts
          and are unaffected. Width: min-w-52 (208px) from the spacing scale. */}
      {isOpen && (
        <div
          style={{ animationDuration: "var(--duration-normal)" }}
          className={`
            absolute top-full mt-2
            ${align === "right" ? "right-0" : "left-0"}
            min-w-52
            plate-round p-px bg-[var(--border-default)]
            z-[var(--z-index-dropdown)]
            animate-in fade-in slide-in-from-top-2
          `}
        >
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`plate-round bg-[var(--surface-card)] ${currentSizeStyles.menu}`}
        >
          {items.map((item, index) => {
            const isDestructive = item.variant === "destructive";
            const isDisabled = item.disabled;
            const isFocused = focusedIndex === index;
            
            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                disabled={isDisabled}
                onClick={() => handleItemClick(item)}
                className={`
                  w-full flex items-center gap-2
                  px-4 py-3
                  font-mono text-sm text-left
                  transition-colors [transition-duration:var(--duration-fast)]
                  ${isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isDestructive
                      ? 'text-[var(--text-error)] hover:bg-[var(--field-background-error)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-muted)]'
                  }
                  ${isFocused && !isDisabled ? (isDestructive ? 'bg-[var(--field-background-error)]' : 'bg-[var(--surface-muted)] text-[var(--accent)]') : ''}
                  ${currentSizeStyles.menuItem}
                `}
              >
                {/* Left icon and label grouped together */}
                {/* Gap-2 (8px) matches medium button gap spacing for consistency */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {item.icon && (
                    <span className={`inline-flex items-center justify-center ${currentSizeStyles.icon} flex-shrink-0`}>
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                
                {/* Right icon aligned to right edge */}
                {item.iconRight && (
                  <span className={`inline-flex items-center justify-center ${currentSizeStyles.icon} flex-shrink-0 ml-auto`}>
                    {item.iconRight}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );
}

