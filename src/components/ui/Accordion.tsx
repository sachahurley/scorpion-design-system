/**
 * ACCORDION COMPONENT
 *
 * Stacked sections whose bodies expand and collapse under their headings.
 * Use it to shorten long pages of optional detail (FAQs, settings groups,
 * spec sheets). Don't hide content most people need; show that inline.
 *
 * API (compound):
 *   <Accordion type="single" collapsible defaultValue="shipping">
 *     <AccordionItem value="shipping">
 *       <AccordionTrigger>Shipping</AccordionTrigger>
 *       <AccordionContent>Ships in 2 days.</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 *
 * - type="single": one item open at a time. Add `collapsible` to let the
 *   open item close again; without it, the open trigger is aria-disabled.
 * - type="multiple": any number open; value is a string array.
 * - Controlled via `value` + `onValueChange`, or uncontrolled via `defaultValue`.
 *
 * ACCESSIBILITY (WAI-ARIA accordion pattern): each trigger is a button
 * inside a heading (`headingLevel`, default 3) with aria-expanded and
 * aria-controls; each body is a region labelled by its trigger. Enter and
 * Space toggle; ArrowDown / ArrowUp move between triggers (wrapping), Home /
 * End jump to the first / last.
 *
 * MOTION: the body height animates on a grid-rows transition over
 * duration.normal (200ms) and the 1-bit ChevronRight rotates to point down.
 * Both are instant under prefers-reduced-motion. Collapsed bodies are
 * visibility-hidden, so they leave the tab order and accessibility tree.
 *
 * TOKENS USED:
 * - border.hairline (item dividers), surface.subtle (trigger hover)
 * - text.primary, text.secondary, focus.ring.primary (inset focus ring)
 * - duration.normal, duration.fast
 */

import {
  createContext,
  useContext,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import { useControllableState } from "@/lib/use-controllable-state";
import { TuiIcon } from "./TuiIcon";

interface AccordionBaseProps {
  /** AccordionItem children. */
  children: ReactNode;
  /** Heading level wrapping each trigger, to fit the page outline (default 3). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Disable every item. */
  disabled?: boolean;
  /** Extra classes for the root. */
  className?: string;
}

export interface AccordionSingleProps extends AccordionBaseProps {
  /** One item open at a time (default). */
  type?: "single";
  /** Controlled open item value (`""` for none). Pair with `onValueChange`. */
  value?: string;
  /** Initially open item when uncontrolled. */
  defaultValue?: string;
  /** Called with the open item's value (`""` when all are closed). */
  onValueChange?: (value: string) => void;
  /** Allow closing the open item so none are open (default false). */
  collapsible?: boolean;
}

export interface AccordionMultipleProps extends AccordionBaseProps {
  /** Any number of items open at once. */
  type: "multiple";
  /** Controlled open item values. Pair with `onValueChange`. */
  value?: string[];
  /** Initially open items when uncontrolled. */
  defaultValue?: string[];
  /** Called with the open item values. */
  onValueChange?: (value: string[]) => void;
  /** Always true for multiple; accepted for API symmetry. */
  collapsible?: boolean;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  /** An open item that cannot be closed (single, not collapsible). */
  isLocked: (value: string) => boolean;
  headingLevel: 2 | 3 | 4 | 5 | 6;
  disabled: boolean;
  rootRef: RefObject<HTMLDivElement | null>;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

interface ItemContextValue {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
}

const ItemContext = createContext<ItemContextValue | null>(null);

function useAccordion(part: string) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error(`${part} must be used inside <Accordion>.`);
  return ctx;
}

function useItem(part: string) {
  const ctx = useContext(ItemContext);
  if (!ctx) throw new Error(`${part} must be used inside <AccordionItem>.`);
  return ctx;
}

/**
 * Accordion root. Holds which items are open and the keyboard roving
 * between triggers.
 *
 * @param type - "single" (default) or "multiple"
 * @param collapsible - Single mode: allow closing the open item
 * @param value / defaultValue / onValueChange - Controlled or uncontrolled
 * @param headingLevel - Heading element wrapping each trigger (default 3)
 */
export function Accordion(props: AccordionProps) {
  const { children, headingLevel = 3, disabled = false, className } = props;
  const multiple = props.type === "multiple";
  const rootRef = useRef<HTMLDivElement>(null);

  // Normalize both modes onto a string array internally
  const toArray = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? v : v === "" ? [] : [v];

  const [open, setOpen] = useControllableState<string[]>({
    value: toArray(props.value),
    defaultValue: toArray(props.defaultValue) ?? [],
  });

  const emit = (next: string[]) => {
    setOpen(next);
    if (multiple) (props.onValueChange as ((v: string[]) => void) | undefined)?.(next);
    else (props.onValueChange as ((v: string) => void) | undefined)?.(next[0] ?? "");
  };

  const collapsible = multiple || props.collapsible === true;

  const ctx: AccordionContextValue = {
    isOpen: (v) => open.includes(v),
    isLocked: (v) => !collapsible && open.includes(v),
    toggle: (v) => {
      if (open.includes(v)) {
        if (!collapsible) return;
        emit(open.filter((x) => x !== v));
      } else {
        emit(multiple ? [...open, v] : [v]);
      }
    },
    headingLevel,
    disabled,
    rootRef,
  };

  // Arrow / Home / End move focus between enabled triggers
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.hasAttribute("data-accordion-trigger")) return;
    const triggers = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-accordion-trigger]:not(:disabled)") ?? []
    ).filter((el) => el.closest("[data-accordion-root]") === rootRef.current);
    const index = triggers.indexOf(target as HTMLButtonElement);
    if (index === -1) return;
    let next: number | null = null;
    if (e.key === "ArrowDown") next = (index + 1) % triggers.length;
    else if (e.key === "ArrowUp") next = (index - 1 + triggers.length) % triggers.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = triggers.length - 1;
    if (next !== null) {
      e.preventDefault();
      triggers[next].focus();
    }
  };

  return (
    <AccordionContext.Provider value={ctx}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- delegated arrow-key navigation between the item triggers, which are real buttons */}
      <div
        ref={rootRef}
        data-accordion-root=""
        onKeyDown={onKeyDown}
        className={cn("w-full border-t border-[var(--border-hairline)] font-mono", className)}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  /** Unique value identifying this item within the Accordion. */
  value: string;
  /** Disable just this item. */
  disabled?: boolean;
  /** AccordionTrigger and AccordionContent. */
  children: ReactNode;
  /** Extra classes for the item wrapper. */
  className?: string;
}

/** One section: a trigger plus its content. */
export function AccordionItem({ value, disabled = false, children, className }: AccordionItemProps) {
  const root = useAccordion("AccordionItem");
  const id = useId();
  const open = root.isOpen(value);
  const item: ItemContextValue = {
    value,
    open,
    disabled: disabled || root.disabled,
    triggerId: `${id}-trigger`,
    contentId: `${id}-content`,
  };
  return (
    <ItemContext.Provider value={item}>
      <div data-state={open ? "open" : "closed"} className={cn("border-b border-[var(--border-hairline)]", className)}>
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export interface AccordionTriggerProps {
  /** Section title. Keep it short; it is the heading text. */
  children: ReactNode;
  /** Extra classes for the button. */
  className?: string;
}

/** The heading button that toggles its item. */
export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const root = useAccordion("AccordionTrigger");
  const item = useItem("AccordionTrigger");
  const Heading = `h${root.headingLevel}` as "h3";
  const locked = root.isLocked(item.value);

  return (
    <Heading className="m-0">
      <button
        type="button"
        id={item.triggerId}
        data-accordion-trigger=""
        aria-expanded={item.open}
        aria-controls={item.contentId}
        aria-disabled={locked || undefined}
        disabled={item.disabled}
        onClick={() => root.toggle(item.value)}
        className={cn(
          "flex min-h-touch w-full items-center justify-between gap-3 px-4 py-3 text-left font-mono text-sm font-medium",
          "text-[var(--text-primary)] transition-colors [transition-duration:var(--duration-fast)]",
          "hover:bg-[var(--surface-subtle)] focus:outline-none",
          "focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
          locked && "cursor-default",
          className
        )}
      >
        <span className="min-w-0 flex-1">{children}</span>
        <TuiIcon
          name="ChevronRight"
          className={cn(
            "shrink-0 text-[var(--text-secondary)] transition-transform [transition-duration:var(--duration-normal)] motion-reduce:transition-none",
            item.open && "rotate-90"
          )}
        />
      </button>
    </Heading>
  );
}

export interface AccordionContentProps {
  /** Section body. */
  children: ReactNode;
  /** Extra classes for the inner padding box. */
  className?: string;
}

/** The collapsible body, a region labelled by its trigger. */
export function AccordionContent({ children, className }: AccordionContentProps) {
  const item = useItem("AccordionContent");
  return (
    <div
      id={item.contentId}
      role="region"
      aria-labelledby={item.triggerId}
      data-state={item.open ? "open" : "closed"}
      className={cn(
        // grid-rows 0fr -> 1fr animates to the content's natural height;
        // visibility flips at the end of the close so hidden bodies leave
        // the tab order and accessibility tree.
        "grid transition-[grid-template-rows,visibility] [transition-duration:var(--duration-normal)] motion-reduce:transition-none",
        item.open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn("px-4 pb-4 pt-1 font-mono text-sm text-[var(--text-secondary)]", className)}>{children}</div>
      </div>
    </div>
  );
}
