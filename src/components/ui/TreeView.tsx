/**
 * TREE VIEW COMPONENT
 *
 * Hierarchical list with expandable branches: file trees, outlines, org
 * charts. Implements the WAI-ARIA tree pattern: `role="tree"` with
 * `treeitem` nodes, `group` children, `aria-expanded` on branches,
 * `aria-level` / `aria-setsize` / `aria-posinset` on every node, and
 * `aria-selected` for the (single) selection.
 *
 * KEYBOARD (one tab stop, roving focus):
 * - Up / Down: previous / next visible node
 * - Right: expand a closed branch; on an open branch, move to its first child
 * - Left: collapse an open branch; otherwise move to the parent
 * - Home / End: first / last visible node
 * - Enter / Space: select the focused node (Enter also fires `onActivate`)
 * - Printable characters: type-ahead to the next node whose label starts
 *   with the typed text
 *
 * MOUSE: clicking a row selects it; clicking a branch row also toggles it.
 *
 * STATE: `expanded` and `selected` are each controlled or uncontrolled
 * (`defaultExpanded` / `defaultSelected`).
 *
 * DISCLOSURE ICONS: 1-bit ChevronRight (closed) and ChevronDown (open).
 *
 * TOKENS USED:
 * - surface.muted (hover and selected fill), accent (selected text)
 * - text.primary / text.secondary, plate.round, focus inset ring
 * - duration.fast, touch.target (row height), spacing.4 (indent step)
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { TuiIcon, type TuiIconName } from "./TuiIcon";

/** One node of the tree. Nodes with `children` are branches. */
export interface TreeNode {
  /** Unique, stable id across the whole tree. */
  id: string;
  /** Row content. */
  label: ReactNode;
  /** Plain-text label for type-ahead when `label` is not a string. */
  textValue?: string;
  /** Optional 1-bit icon before the label. */
  icon?: TuiIconName;
  /** Child nodes. An empty array still renders a (childless) branch. */
  children?: TreeNode[];
  /** Skip this node for selection and activation (it stays focusable). */
  disabled?: boolean;
}

export interface TreeViewProps {
  /** Root nodes. */
  nodes: TreeNode[];
  /** Accessible name of the tree (pass this or `aria-labelledby`). */
  "aria-label"?: string;
  /** Id of a visible heading naming the tree. */
  "aria-labelledby"?: string;
  /** Ids of open branches (controlled). */
  expanded?: string[];
  /** Ids of branches open on first render (uncontrolled). */
  defaultExpanded?: string[];
  /** Fires with the next list of open branch ids. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Selected node id (controlled). `null` for no selection. */
  selected?: string | null;
  /** Node selected on first render (uncontrolled). */
  defaultSelected?: string | null;
  /** Fires when the selection changes. */
  onSelectedChange?: (id: string) => void;
  /** Fires when a node is activated with Enter or a click (open the file, go to the route). */
  onActivate?: (id: string) => void;
  /** Type-ahead on printable keys (default true). */
  typeahead?: boolean;
  /** Extra classes for the tree root. */
  className?: string;
}

type FlatNode = {
  node: TreeNode;
  level: number;
  parentId: string | null;
  isBranch: boolean;
};

function textOf(node: TreeNode): string {
  if (node.textValue) return node.textValue;
  return typeof node.label === "string" || typeof node.label === "number" ? String(node.label) : "";
}

const ROW =
  "plate-round flex min-h-touch cursor-pointer items-center gap-2 py-1 pr-3 font-mono text-sm " +
  "pl-[calc(var(--tree-level)_*_theme(spacing.4)_+_theme(spacing.2))] " +
  "transition-colors [transition-duration:var(--duration-fast)] motion-reduce:transition-none";

/**
 * TreeView
 *
 * ```tsx
 * <TreeView
 *   aria-label="Files"
 *   defaultExpanded={["src"]}
 *   nodes={[{ id: "src", label: "src", children: [{ id: "index", label: "index.ts" }] }]}
 *   onActivate={(id) => open(id)}
 * />
 * ```
 */
export function TreeView({
  nodes,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  onActivate,
  typeahead = true,
  className,
}: TreeViewProps) {
  const [expandedState, setExpandedState] = useState<string[]>(defaultExpanded);
  const expandedList = expandedProp ?? expandedState;
  const expandedSet = useMemo(() => new Set(expandedList), [expandedList]);

  const [selectedState, setSelectedState] = useState<string | null>(defaultSelected);
  const selected = selectedProp !== undefined ? selectedProp : selectedState;

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const pendingFocusRef = useRef(false);
  const typeaheadRef = useRef({ buffer: "", timer: 0 as unknown as ReturnType<typeof setTimeout> });

  // Visible nodes in document order (children of closed branches skipped).
  const visible = useMemo(() => {
    const out: FlatNode[] = [];
    const walk = (list: TreeNode[], level: number, parentId: string | null) => {
      for (const node of list) {
        const isBranch = Array.isArray(node.children);
        out.push({ node, level, parentId, isBranch });
        if (isBranch && expandedSet.has(node.id)) walk(node.children!, level + 1, node.id);
      }
    };
    walk(nodes, 1, null);
    return out;
  }, [nodes, expandedSet]);

  // The single tab stop: focused node, else the selection, else the first node.
  const tabStopId =
    (focusedId && visible.some((v) => v.node.id === focusedId) && focusedId) ||
    (selected && visible.some((v) => v.node.id === selected) && selected) ||
    visible[0]?.node.id ||
    null;

  useEffect(() => {
    if (!pendingFocusRef.current || !focusedId) return;
    pendingFocusRef.current = false;
    itemRefs.current.get(focusedId)?.focus();
  }, [focusedId, visible]);

  useEffect(() => () => clearTimeout(typeaheadRef.current.timer), []);

  const moveFocus = (id: string | undefined) => {
    if (!id) return;
    pendingFocusRef.current = true;
    setFocusedId(id);
    // Same id: the effect will not rerun, so focus directly.
    if (id === focusedId) itemRefs.current.get(id)?.focus();
  };

  const setExpanded = useCallback(
    (id: string, open: boolean) => {
      const has = expandedSet.has(id);
      if (has === open) return;
      const next = open ? [...expandedList, id] : expandedList.filter((x) => x !== id);
      if (expandedProp === undefined) setExpandedState(next);
      onExpandedChange?.(next);
    },
    [expandedSet, expandedList, expandedProp, onExpandedChange]
  );

  const select = (flat: FlatNode) => {
    if (flat.node.disabled) return;
    if (selected !== flat.node.id) {
      if (selectedProp === undefined) setSelectedState(flat.node.id);
      onSelectedChange?.(flat.node.id);
    }
  };

  const runTypeahead = (char: string, fromIndex: number) => {
    const ta = typeaheadRef.current;
    clearTimeout(ta.timer);
    ta.buffer += char.toLowerCase();
    ta.timer = setTimeout(() => {
      ta.buffer = "";
    }, 500);
    const n = visible.length;
    // A repeated single character cycles; a longer buffer matches from the current node.
    const start = ta.buffer.length === 1 ? fromIndex + 1 : fromIndex;
    for (let k = 0; k < n; k++) {
      const candidate = visible[(start + k) % n];
      if (textOf(candidate.node).toLowerCase().startsWith(ta.buffer)) {
        moveFocus(candidate.node.id);
        return;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLLIElement>, flat: FlatNode) => {
    // Nested treeitems bubble: only the focused item handles the key.
    if (e.target !== e.currentTarget) return;
    const index = visible.findIndex((v) => v.node.id === flat.node.id);
    const open = expandedSet.has(flat.node.id);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveFocus(visible[index + 1]?.node.id);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus(visible[index - 1]?.node.id);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (!flat.isBranch) break;
        if (!open) setExpanded(flat.node.id, true);
        else if (visible[index + 1]?.parentId === flat.node.id) moveFocus(visible[index + 1].node.id);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (flat.isBranch && open) setExpanded(flat.node.id, false);
        else if (flat.parentId) moveFocus(flat.parentId);
        break;
      case "Home":
        e.preventDefault();
        moveFocus(visible[0]?.node.id);
        break;
      case "End":
        e.preventDefault();
        moveFocus(visible[visible.length - 1]?.node.id);
        break;
      case "Enter":
        e.preventDefault();
        select(flat);
        if (!flat.node.disabled) onActivate?.(flat.node.id);
        break;
      case " ":
        e.preventDefault();
        select(flat);
        break;
      default:
        if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\S/.test(e.key)) {
          e.preventDefault();
          runTypeahead(e.key, index);
        }
    }
  };

  const renderNodes = (list: TreeNode[], level: number, parentId: string | null): ReactNode =>
    list.map((node, i) => {
      const isBranch = Array.isArray(node.children);
      const open = isBranch && expandedSet.has(node.id);
      const isSelected = selected === node.id;
      const flat: FlatNode = { node, level, parentId, isBranch };
      return (
        <li
          key={node.id}
          ref={(el) => {
            if (el) itemRefs.current.set(node.id, el);
            else itemRefs.current.delete(node.id);
          }}
          role="treeitem"
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={i + 1}
          aria-expanded={isBranch ? open : undefined}
          aria-selected={isSelected}
          aria-disabled={node.disabled || undefined}
          tabIndex={tabStopId === node.id ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, flat)}
          onFocus={(e) => {
            if (e.target === e.currentTarget) setFocusedId(node.id);
          }}
          className="focus:outline-none [&:focus-visible>div]:[box-shadow:inset_0_0_0_var(--focus-ring-width)_var(--focus-ring-primary)]"
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- pointer path for the row; the treeitem handles the keyboard with roving tabindex */}
          <div
            style={{ ["--tree-level" as string]: level - 1 }}
            onClick={(e) => {
              e.stopPropagation();
              moveFocus(node.id);
              select(flat);
              if (isBranch) setExpanded(node.id, !open);
              if (!node.disabled && !isBranch) onActivate?.(node.id);
            }}
            className={cn(
              ROW,
              isSelected
                ? "bg-[var(--surface-muted)] text-[var(--accent)]"
                : "text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
              node.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="inline-flex w-4 shrink-0 justify-center text-[var(--text-secondary)]">
              {isBranch && <TuiIcon name={open ? "ChevronDown" : "ChevronRight"} size="3" />}
            </span>
            {node.icon && <TuiIcon name={node.icon} className="shrink-0" />}
            <span className="min-w-0 truncate">{node.label}</span>
          </div>
          {isBranch && open && node.children!.length > 0 && (
            <ul role="group">{renderNodes(node.children!, level + 1, node.id)}</ul>
          )}
        </li>
      );
    });

  return (
    <ul
      role="tree"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn("font-mono text-sm", className)}
    >
      {renderNodes(nodes, 1, null)}
    </ul>
  );
}

TreeView.displayName = "TreeView";
