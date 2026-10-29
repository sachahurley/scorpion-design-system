/**
 * COMPOSER COMPONENT
 *
 * The prompt box of a chat surface: a multi-line field that grows with its
 * content from `minRows` to `maxRows`, sends on Enter (Shift+Enter breaks
 * the line), and turns its send button into a stop button while a reply is
 * streaming. Field and actions share one plate, so it reads as a command
 * line rather than a form with a button parked beside it.
 *
 * SHAPE: Textarea's plate ring recipe on the large plate. The ring wrapper
 * is the border color clipped to --plate-round-lg; the fill layer is
 * clipped 1px inset and holds the context row, the field and the action
 * row. The ring walks the same ramp: idle hairline, hover, focus accent.
 *
 * FOCUS: a colour change only, as in every text field (decision 0022): the
 * 1px ring turns --field-border-focus while the textarea has focus, and
 * focus wins over error. The ring follows the textarea, not the whole form,
 * so tabbing on to an action or the send button shows only that button's
 * own inset ring instead of lighting both.
 *
 * NAME: the field's accessible name is required by the props type
 * (decision 0029): a visible `label`, an `aria-label` or an
 * `aria-labelledby`. There is no default name.
 *
 * KEYBOARD: `submitKey="enter"` (default) sends on Enter and breaks the line
 * on Shift+Enter; `"mod-enter"` sends on Cmd/Ctrl+Enter and leaves Enter
 * alone. Enter never sends during IME composition. While `busy`, Enter does
 * not send; the field stays editable so the next message can be drafted.
 *
 * TOKENS USED:
 * - field.background / field.background-error (fill)
 * - field.border / -hover / -focus / -error (ring)
 * - field.placeholder, text.primary, text.secondary (hint)
 * - plate.round-lg
 * - duration.fast (ring transition)
 */

import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { FieldMessage, useFieldMessage } from "@/lib/field";
import type { ControlSize } from "@/lib/size";
import { useAutosize } from "@/lib/use-autosize";
import { useControllableState } from "@/lib/use-controllable-state";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Kbd } from "./Kbd";
import { TuiIcon } from "./TuiIcon";

/** Which key combination sends. */
export type ComposerSubmitKey = "enter" | "mod-enter";

/** Composer sizes. There is no `sm`: a 32px prompt cannot hold the action row at a 44px touch target. */
export type ComposerSize = Extract<ControlSize, "md" | "lg">;

interface ComposerOwnProps {
  /** Controlled text. Pair with `onValueChange`; the parent clears it after a send. */
  value?: string;
  /** Starting text when uncontrolled (default ""). An uncontrolled Composer clears itself after a send. */
  defaultValue?: string;
  /** Fires on every edit with the new text, and with "" when an uncontrolled Composer clears itself after a send. */
  onValueChange?: (value: string) => void;
  /**
   * Fires with the trimmed text on Enter (per `submitKey`) or the send
   * button, only when the text is not blank and the Composer is neither
   * `busy` nor `disabled`.
   */
  onSubmit: (value: string) => void;
  /**
   * A reply is streaming. With `onStop` the send button becomes a stop
   * button; without it, send shows Button's loading state. Enter does not
   * send, but the field stays editable so the next message can be drafted.
   */
  busy?: boolean;
  /** Called by the stop button while `busy`. Pass it whenever the reply can be cancelled. */
  onStop?: () => void;
  /** `enter` (default): Enter sends, Shift+Enter breaks the line. `mod-enter`: Cmd/Ctrl+Enter sends, for long multi-paragraph messages. */
  submitKey?: ComposerSubmitKey;
  /** Rows shown when empty (default 1). Raise it where messages are usually long. */
  minRows?: number;
  /** Rows the field grows to before it scrolls instead (default 8). */
  maxRows?: number;
  /** Type size, padding and send button size: `md` (default), or `lg` for a prompt that leads the page. */
  size?: ComposerSize;
  /** Row of chips above the field for what the message refers to: attachments, referenced components (`@Card`). */
  context?: ReactNode;
  /** Leading actions in the action row (attach, insert): ghost icon-only Buttons with `type="button"` and an `aria-label`. More than three belong in a menu. */
  actions?: ReactNode;
  /** Text before the send button, linked to the field as its description. Defaults to the shortcut for `submitKey`; `false` hides it. Hidden below `sm`. */
  hint?: ReactNode | false;
  /** Placeholder text (default "Message"). Never the only description of the field: it vanishes as soon as someone types. */
  placeholder?: string;
  /** Visible label above the plate, wired to the field; one of `label`, `aria-label` or `aria-labelledby` is required. A chat pane usually uses `aria-label` instead. */
  label?: ReactNode;
  /** Accessible name of the field when there is no visible label, such as "Message"; one of `label`, `aria-label` or `aria-labelledby` is required. Wins over `label`. */
  "aria-label"?: string;
  /** Id of visible text elsewhere that names the field, such as the pane title. Wins over `label` and `aria-label`. */
  "aria-labelledby"?: string;
  /** Hint under the plate (a character limit, why typing is off), linked as a description. Hidden while `errorMessage` is set. */
  helperText?: ReactNode;
  /** Error under the plate. Sets the error ring and fill and `aria-invalid`, and replaces `helperText`. */
  errorMessage?: ReactNode;
  /** Disables the field, the actions and the send button together (one disabled fieldset) and dims the plate to 50%. Use it when typing is off, not while a reply streams (use `busy`). */
  disabled?: boolean;
  /** Native character limit on the field. Say what the limit is in `helperText`. */
  maxLength?: number;
  /** Accessible name of the send button (default "Send message"). */
  sendLabel?: string;
  /** Accessible name of the stop button (default "Stop response"). */
  stopLabel?: string;
  /** Field `name`, for native form handling. */
  name?: string;
  /** Extra classes for the ring wrapper (margin). Width comes from the parent. */
  className?: string;
}

/** The field's accessible name, required (decision 0029). */
type ComposerName = { label: ReactNode } | { "aria-label": string } | { "aria-labelledby": string };

/** Props of `Composer`: its own props plus a required accessible name, given as `label`, `aria-label` or `aria-labelledby`. */
export type ComposerProps = ComposerOwnProps & ComposerName;

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * The prompt box of a chat surface: type a request, Enter sends it, and the
 * send button becomes stop while the reply streams. Use `Textarea` in forms,
 * where Enter must insert a line break.
 *
 * ```tsx
 * <Composer aria-label="Message" onSubmit={send} busy={streaming} onStop={stop} />
 * ```
 */
export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(
  (
    {
      value,
      defaultValue = "",
      onValueChange,
      onSubmit,
      busy = false,
      onStop,
      submitKey = "enter",
      minRows = 1,
      maxRows = 8,
      size = "md",
      context,
      actions,
      hint,
      placeholder = "Message",
      label,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      helperText,
      errorMessage,
      disabled = false,
      maxLength,
      sendLabel = "Send message",
      stopLabel = "Stop response",
      name,
      className,
    },
    forwardedRef
  ) => {
    const [text, setText] = useControllableState({ value, defaultValue, onChange: onValueChange });
    const controlled = value !== undefined;
    const fieldRef = useRef<HTMLTextAreaElement | null>(null);
    useAutosize(fieldRef, { value: text, minRows, maxRows });

    const setRefs = useCallback(
      (el: HTMLTextAreaElement | null) => {
        fieldRef.current = el;
        if (typeof forwardedRef === "function") forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      },
      [forwardedRef]
    );

    const field = useFieldMessage({ helperText, errorMessage });
    const error = field.invalid;
    const hintId = useId();
    const fieldId = useId();
    const hasLabel = label != null && label !== "";
    const [mod] = useState(() => (isMac() ? "Cmd" : "Ctrl"));
    const blank = text.trim() === "";

    const submit = () => {
      if (blank || busy || disabled) return;
      onSubmit(text.trim());
      if (!controlled) setText("");
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      submit();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
      const withMod = e.metaKey || e.ctrlKey;
      const sends = submitKey === "enter" ? !e.shiftKey : withMod;
      if (!sends) return;
      e.preventDefault();
      submit();
    };

    const defaultHint =
      submitKey === "enter" ? (
        <>
          <Kbd keys={["Enter"]} /> send <Kbd keys={["Shift", "Enter"]} /> new line
        </>
      ) : (
        <>
          <Kbd keys={[mod, "Enter"]} /> send
        </>
      );
    const hintContent = hint === false ? null : (hint ?? defaultHint);

    const describedBy = [hintContent != null ? hintId : null, field.describedBy].filter(Boolean).join(" ") || undefined;

    // Focus is the ring's colour change and nothing else (decision 0022), and
    // it wins over error. It keys on the textarea, so a focused button inside
    // the plate shows only its own ring.
    const ringStyles = error
      ? "bg-[var(--field-border-error)] has-[textarea:focus]:!bg-[var(--field-border-focus)]"
      : "bg-[var(--field-border)] hover:bg-[var(--field-border-hover)] has-[textarea:focus]:!bg-[var(--field-border-focus)]";

    const sizes = {
      md: { text: "text-sm", field: "px-4 pt-3", row: "p-2", context: "px-4 pt-3" },
      lg: { text: "text-base", field: "px-5 pt-4", row: "p-3", context: "px-5 pt-4" },
    }[size];

    // 44px hit area at md (the 40px plate plus a centered pseudo-element), as Alert's close button.
    const hitArea =
      "relative before:content-[''] before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-touch before:h-touch";

    const sendButton =
      busy && onStop ? (
        <Button type="button" variant="secondary" size={size} aria-label={stopLabel} onClick={onStop} className={hitArea}>
          <TuiIcon name="Stop" />
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          size={size}
          aria-label={sendLabel}
          disabled={disabled || (!busy && blank)}
          loading={busy}
          className={hitArea}
        >
          <TuiIcon name="Send" />
        </Button>
      );

    return (
      <div className="w-full space-y-1">
        {hasLabel && (
          <label htmlFor={fieldId} className="block font-mono text-sm text-secondary-800 dark:text-secondary-200">
            {label}
          </label>
        )}
        <form
          onSubmit={handleSubmit}
          className={cn(
            "plate-round-lg w-full p-px transition-colors [transition-duration:var(--duration-fast)]",
            ringStyles,
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          {/* A native fieldset, so `disabled` reaches every control inside, caller
              actions included. It has no legend on purpose: it groups nothing a
              screen reader needs to hear, and an unnamed group is not announced.
              The Fieldset component requires a legend, so it does not fit here. */}
          <fieldset
            disabled={disabled}
            data-error={error || undefined}
            className={cn(
              "plate-round-lg flex min-w-0 flex-col font-mono",
              error ? "bg-[var(--field-background-error)]" : "bg-[var(--field-background)]"
            )}
          >
            {context && <div className={cn("flex flex-wrap gap-1.5", sizes.context)}>{context}</div>}
            <textarea
              ref={setRefs}
              id={fieldId}
              name={name}
              rows={minRows}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={describedBy}
              aria-invalid={error || undefined}
              disabled={disabled}
              maxLength={maxLength}
              className={cn(
                "w-full resize-none bg-transparent text-[var(--text-primary)] focus:outline-none",
                "placeholder:text-[var(--field-placeholder)] disabled:cursor-not-allowed",
                sizes.text,
                sizes.field
              )}
            />
            <div className={cn("flex items-center gap-2", sizes.row)}>
              {actions && <div className="flex items-center gap-1">{actions}</div>}
              <div className="ml-auto flex items-center gap-3">
                {hintContent != null && (
                  <span
                    id={hintId}
                    className="hidden items-center gap-1.5 text-xs text-[var(--text-secondary)] sm:flex"
                  >
                    {hintContent}
                  </span>
                )}
                {sendButton}
              </div>
            </div>
          </fieldset>
        </form>
        <FieldMessage {...field.message} />
      </div>
    );
  }
);

Composer.displayName = "Composer";
