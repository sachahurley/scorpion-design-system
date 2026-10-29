/**
 * TABLE — semantic data grid primitives with token-backed chrome.
 * Compose `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, and `TableCell`.
 *
 * STATES: `TableBody` owns the loading and empty states, because the body is
 * the part that changes. `loading` swaps the rows for Skeleton rows (one
 * placeholder per column) and marks the whole `<table>` `aria-busy`;
 * `emptyState` renders in one full-width cell when the body has no rows. Both
 * span the header's column count, read from the rendered `<thead>` unless
 * `colSpan` says otherwise.
 *
 * TOKENS: rules are drawn at `--border-width-hairline` (1px), the system's
 * only rule weight, replacing the ad hoc 0.5px rules that browsers snapped
 * unevenly. Column headers are `font-bold` (`--font-weight-bold`, 700);
 * the weight scale is 400 / 500 / 700, so `font-semibold` (600) was off-token.
 */

import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type TableHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

// useLayoutEffect warns during SSR; fall back to useEffect off the browser.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Row padding density. `compact` is the default data-grid rhythm; the other
 *  two step up the cell padding on the 4px grid for lower-density reading. */
export type TableDensity = "compact" | "comfortable" | "spacious";

/** Cell padding per density (shared by TableHead + TableCell via context). */
const DENSITY_CELL_PADDING: Record<TableDensity, string> = {
  compact: "px-3 py-2",      // 12 / 8
  comfortable: "px-4 py-3",  // 16 / 12
  spacious: "px-5 py-4",     // 20 / 16
};

const TableDensityContext = createContext<TableDensity>("compact");

/** Lets a loading `TableBody` mark its `<table>` busy: +1 while loading, -1 after. */
const TableBusyContext = createContext<((delta: 1 | -1) => void) | null>(null);

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Zebra striping for body rows (even rows use `surface-subtle`). */
  striped?: boolean;
  /** Full outer border around the table. */
  bordered?: boolean;
  /** Row padding rhythm (default `compact`); cells read it via context. */
  density?: TableDensity;
};

/**
 * Root `<table>`. Wrap in a scroll container in product code when needed (`overflow-x-auto`).
 * `bordered` frames the table on the large plate via the ring recipe (outer layer =
 * stroke clipped to the plate, inner layer = fill clipped 1px inset) — clip-path
 * slices real borders, so a border property cannot draw the frame.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, striped, bordered, density = "compact", children, "aria-busy": ariaBusy, ...props },
  ref
) {
  // How many TableBody sections are loading; any one makes the table busy.
  const [busyCount, setBusyCount] = useState(0);
  const reportBusy = useCallback((delta: 1 | -1) => setBusyCount((n) => n + delta), []);

  const table = (
    <TableBusyContext.Provider value={reportBusy}>
      <TableDensityContext.Provider value={density}>
        <table
          ref={ref}
          aria-busy={ariaBusy ?? (busyCount > 0 ? true : undefined)}
          className={cn(
            "w-full border-collapse font-mono text-sm text-[var(--text-primary)]",
            striped && "[&_tbody_tr:nth-child(even)]:bg-[var(--surface-subtle)]",
            className
          )}
          {...props}
        >
          {children}
        </table>
      </TableDensityContext.Provider>
    </TableBusyContext.Provider>
  );

  if (!bordered) return table;

  return (
    <div className="plate-round-lg p-px bg-[var(--surface-container-stroke)]">
      <div className="plate-round-lg bg-[var(--surface-card)]">{table}</div>
    </div>
  );
});

Table.displayName = "Table";

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

/**
 * `<thead>` — sticky header styling is left to the product (optional `className`).
 */
export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(function TableHeader(
  { className, ...props },
  ref
) {
  return (
    <thead
      ref={ref}
      className={cn(
        "border-b-[length:var(--border-width-hairline)] border-solid border-[var(--surface-container-stroke)] bg-[var(--surface-subtle)]",
        className
      )}
      {...props}
    />
  );
});

TableHeader.displayName = "TableHeader";

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement> & {
  /** Show placeholder rows instead of the children while the data loads. Sets
   *  `aria-busy` on the parent `Table`; keep it on until the real rows render. */
  loading?: boolean;
  /** How many Skeleton rows `loading` shows (default 3). Match the page size you
   *  expect so the table does not jump when the rows arrive. */
  loadingRows?: number;
  /** What to show when the body has no rows: a sentence, or an `EmptyState
   *  size="sm"`. Rendered in one cell spanning every column. Ignored while `loading`. */
  emptyState?: ReactNode;
  /** Columns the loading and empty rows span. Leave it unset to use the
   *  `TableHeader` column count; set it when the table has no header row. */
  colSpan?: number;
};

/**
 * `<tbody>`. Pass `loading` while the data is on its way and `emptyState` for
 * the no-rows case; otherwise it renders its children unchanged.
 *
 * @example
 * <TableBody loading={isLoading} emptyState={<EmptyState size="sm" title="No builds yet" />}>
 *   {builds.map((b) => <TableRow key={b.id}>...</TableRow>)}
 * </TableBody>
 */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, loading = false, loadingRows = 3, emptyState, colSpan, children, ...props },
  ref
) {
  const reportBusy = useContext(TableBusyContext);
  const localRef = useRef<HTMLTableSectionElement | null>(null);
  const setRef = useCallback(
    (node: HTMLTableSectionElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  const empty = !loading && emptyState != null && Children.toArray(children).length === 0;
  const spansColumns = loading || empty;

  // The header's column count, read from the rendered <thead> (colSpans summed).
  const [headerColumns, setHeaderColumns] = useState(1);
  useIsoLayoutEffect(() => {
    if (!spansColumns || colSpan != null) return;
    const headerRow = localRef.current?.closest("table")?.tHead?.rows[0];
    if (!headerRow) return;
    const count = Array.from(headerRow.cells).reduce((sum, cell) => sum + cell.colSpan, 0);
    setHeaderColumns(Math.max(1, count));
  }, [spansColumns, colSpan]);
  const columns = Math.max(1, colSpan ?? headerColumns);

  useEffect(() => {
    if (!loading || !reportBusy) return;
    reportBusy(1);
    return () => reportBusy(-1);
  }, [loading, reportBusy]);

  let content: ReactNode = children;
  if (loading) {
    const rowCount = Math.max(1, Math.floor(loadingRows));
    // Placeholder rows carry no meaning, so they are hidden from assistive tech;
    // aria-busy on the table is what says the content is on its way.
    content = Array.from({ length: rowCount }, (_, row) => (
      <TableRow key={row} aria-hidden="true" data-table-loading-row="">
        {Array.from({ length: columns }, (_, col) => (
          <TableCell key={col}>
            <div className="flex h-5 items-center">
              <Skeleton />
            </div>
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (empty) {
    content = (
      <TableRow data-table-empty-row="">
        <TableCell colSpan={columns} className="text-center">
          {emptyState}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <tbody ref={setRef} className={cn(className)} {...props}>
      {content}
    </tbody>
  );
});

TableBody.displayName = "TableBody";

export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

/** `<tfoot>` — often used for summary rows */
export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(function TableFooter(
  { className, ...props },
  ref
) {
  return (
    <tfoot
      ref={ref}
      className={cn(
        "border-t-[length:var(--border-width-hairline)] border-solid border-[var(--surface-container-stroke)] bg-[var(--surface-subtle)]",
        className
      )}
      {...props}
    />
  );
});

TableFooter.displayName = "TableFooter";

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

/** `<tr>` */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { className, ...props },
  ref
) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b-[length:var(--border-width-hairline)] border-solid border-[var(--surface-container-stroke)] transition-colors [transition-duration:var(--duration-normal)]",
        className
      )}
      {...props}
    />
  );
});

TableRow.displayName = "TableRow";

export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;

/** `<th>` — defaults `scope="col"` for column headers */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { className, scope = "col", ...props },
  ref
) {
  const density = useContext(TableDensityContext);
  return (
    <th
      ref={ref}
      scope={scope}
      className={cn(
        DENSITY_CELL_PADDING[density],
        "text-left font-bold text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  );
});

TableHead.displayName = "TableHead";

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

/** `<td>` */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { className, ...props },
  ref
) {
  const density = useContext(TableDensityContext);
  return (
    <td
      ref={ref}
      className={cn(
        DENSITY_CELL_PADDING[density],
        "align-middle text-secondary-800 dark:text-secondary-200",
        className
      )}
      {...props}
    />
  );
});

TableCell.displayName = "TableCell";
