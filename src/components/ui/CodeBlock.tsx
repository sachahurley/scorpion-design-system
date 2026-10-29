/**
 * CODE BLOCK COMPONENT
 *
 * Read-only code: a snippet in a chat reply, the generated source of a
 * layout, a config file. A title bar (file name or language, a hairline rule
 * filling the gap as in Window, and a copy button), then the code on the
 * page fill, with optional line numbers and highlighted lines. Same frame as
 * LogView, so code and logs read as the same kind of surface.
 *
 * NO SYNTAX COLORS (v1): the token set has no syntax roles yet, and inventing
 * them here would break the semantic-aliases-only rule (decision 0006).
 *
 * COPY: writes `code` to the clipboard, shows "Copied" (or "Copy failed")
 * for two seconds and announces it through a polite status region. The
 * button is not rendered when the Clipboard API is unavailable.
 *
 * TOKENS USED:
 * - surface.container-stroke (ring, title rule), surface.page (code fill)
 * - surface.muted (highlighted lines), accent (highlight marker)
 * - text.primary (code), text.secondary (title, line numbers)
 * - plate.round-lg, focus-ring.primary, focus-ring.width
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "./VisuallyHidden";
import { Button } from "./Button";
import { TuiIcon } from "./TuiIcon";

export interface CodeBlockProps {
  /** The code, as one string with `\n` line breaks. Rendered as text, never as HTML, so it is safe for generated source. */
  code: string;
  /** Language name ("tsx", "json"). A label only for now (no syntax colors); also set as `data-language`, and the title when `title` is unset. */
  language?: string;
  /** Title bar text, usually the file name ("settings-screen.tsx"). Defaults to `language`. */
  title?: ReactNode;
  /** Show a gutter of 1-based line numbers (default false), for code people will discuss by line. Numbers are hidden from screen readers and from copying. */
  showLineNumbers?: boolean;
  /** 1-based lines to mark with a muted row and a gutter marker (never color alone), for the lines an answer is about. */
  highlightLines?: number[];
  /** Wrap long lines instead of scrolling horizontally (default false). Turn on for prose-like content such as JSON in a narrow pane. */
  wrap?: boolean;
  /** Show the copy button (default true). It is not rendered without the Clipboard API. */
  copyable?: boolean;
  /** Fires with the code after a successful copy, for analytics or a toast. */
  onCopy?: (code: string) => void;
  /** Draw the plate ring (default true). Set false inside a Window body or a tab panel that already frames it. */
  framed?: boolean;
  /** Accessible name of the block. Defaults to the title when it is text, else the language, else "Code"; set it when the title is a node. */
  "aria-label"?: string;
  /** Extra classes for the figure. Cap the height here (`max-h-96`); the code then scrolls. */
  className?: string;
}

/** How long the copy result stays on the button. */
const COPY_RESULT_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

/**
 * Read-only code in a terminal frame: a title bar with the file name and a
 * copy button, then the code with optional line numbers and highlighted
 * lines. Use `LogView` for streaming output and `Kbd` for keys in a sentence.
 *
 * ```tsx
 * <CodeBlock title="settings-screen.tsx" language="tsx" code={source} showLineNumbers />
 * ```
 */
export function CodeBlock({
  code,
  language,
  title,
  showLineNumbers = false,
  highlightLines,
  wrap = false,
  copyable = true,
  onCopy,
  framed = true,
  "aria-label": ariaLabel,
  className,
}: CodeBlockProps) {
  const [copy, setCopy] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const canCopy = copyable && typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";
  const heading = title ?? language;
  const name = ariaLabel ?? (typeof heading === "string" && heading !== "" ? heading : "Code");
  const lines = code.replace(/\n$/, "").split("\n");
  const marked = new Set(highlightLines);
  const hasMarks = marked.size > 0;
  // Gutter sized to the widest line number (content-derived, in ch units).
  const gutterWidth = `${String(lines.length).length}ch`;

  const handleCopy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(code);
      setCopy("copied");
      onCopy?.(code);
    } catch {
      setCopy("failed");
    }
    timer.current = window.setTimeout(() => setCopy("idle"), COPY_RESULT_MS);
  };

  const showBar = heading != null || canCopy;

  return (
    <figure
      aria-label={name}
      data-language={language}
      className={cn("flex min-h-0 flex-col font-mono", framed && "plate-round-lg bg-[var(--surface-container-stroke)] p-px", className)}
    >
      <div className={cn("flex min-h-0 flex-1 flex-col", framed && "plate-round-lg bg-[var(--surface-page)]")}>
        {showBar && (
          <figcaption className="flex min-h-control-sm shrink-0 items-center gap-2 border-b border-[var(--border-hairline)] py-1 pl-4 pr-1 text-xs text-[var(--text-secondary)]">
            {heading != null && <span className="min-w-0 truncate">{heading}</span>}
            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-[var(--surface-container-stroke)]" />
            {canCopy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                iconLeft={copy === "copied" ? "Check" : "Copy"}
              >
                {copy === "copied" ? "Copied" : copy === "failed" ? "Copy failed" : "Copy"}
                {copy === "idle" && <VisuallyHidden> code</VisuallyHidden>}
              </Button>
            )}
          </figcaption>
        )}
        <pre
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- overflowing code must be keyboard-scrollable (axe scrollable-region-focusable), as in LogView
          tabIndex={0}
          className={cn(
            "min-h-0 flex-1 overflow-auto py-2 text-xs leading-relaxed text-[var(--text-primary)]",
            "focus:outline-none focus-visible:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]"
          )}
        >
          <code className="block">
            {lines.map((line, index) => {
              const n = index + 1;
              const isMarked = marked.has(n);
              return (
                <span
                  key={n}
                  data-highlighted={isMarked || undefined}
                  className={cn("flex gap-3 px-4", !wrap && "w-max min-w-full", isMarked && "bg-[var(--surface-muted)]")}
                >
                  {hasMarks && (
                    <span aria-hidden="true" className="flex w-3 shrink-0 select-none items-center text-[var(--accent)]">
                      {isMarked && <TuiIcon name="ChevronRight" size="3" />}
                    </span>
                  )}
                  {showLineNumbers && (
                    <span
                      aria-hidden="true"
                      className="shrink-0 select-none text-right tabular-nums text-[var(--text-secondary)]"
                      style={{ minWidth: gutterWidth }}
                    >
                      {n}
                    </span>
                  )}
                  <span className={cn("min-w-0 flex-1", wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre")}>
                    {/* An empty line still needs height */}
                    {line === "" ? " " : line}
                  </span>
                </span>
              );
            })}
          </code>
        </pre>
      </div>
      <VisuallyHidden role="status">
        {copy === "copied" ? "Copied to clipboard" : copy === "failed" ? "Copy failed" : ""}
      </VisuallyHidden>
    </figure>
  );
}

CodeBlock.displayName = "CodeBlock";
