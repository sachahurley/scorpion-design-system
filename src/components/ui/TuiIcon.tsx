import React from "react";
import { cn } from "@/lib/utils";

/**
 * TuiIcon -- Terminal UI Icon component (Tier 2)
 *
 * Every icon is 1-bit pixel art on a 7x7 grid (TUI_ICON_BITMAPS), drawn as
 * crisp SVG squares. One art pixel is 2px at the default size, the same
 * 2px step the plates and the portfolio's Urizen tiles use; larger sizes
 * step in whole pixels so edges never blur. The odd grid gives every icon a
 * true center column, so 1-pixel lines stay symmetric.
 *
 * TUI_ICON_GLYPHS keeps each icon's Unicode form for plain-text contexts
 * (tui-art frames, terminal-style strings); those render consistently via
 * the Scorp Symbols face in --font-family-mono.
 */

/**
 * Unicode text form of each icon name (Lucide-compatible keys), for plain-text
 * contexts. TuiIcon itself renders the bitmaps in {@link TUI_ICON_BITMAPS}.
 */
export const TUI_ICON_GLYPHS = {
  AlertCircle: "\u26A0", // ⚠ warning sign
  AlertTriangle: "\u26A0", // ⚠ warning sign
  Archive: "\u2707", // ✇ tape drive
  ArrowLeft: "\u2190", // ← left arrow
  ArrowRight: "\u2192", // → right arrow
  Bell: "\u266A", // ♪ notification bell
  Check: "\u2713", // ✓ check mark
  CheckCircle: "\u2713", // ✓ check mark
  ChevronDown: "\u25BC", // ▼ down triangle
  ChevronRight: "\u25B6", // ▶ right triangle
  ChevronUp: "\u25B2", // ▲ up triangle
  Copy: "\u2398", // ⎘ copy
  Download: "\u2913", // ⤓ downwards arrow to bar
  Edit: "\u270E", // ✎ pencil
  ExternalLink: "\u2197", // ↗ arrow upper right (leaves this context)
  Eye: "\u25C9", // ◉ fisheye
  EyeOff: "\u25CC", // ◌ dotted circle
  FileText: "\u2637", // ☷ file
  Globe: "\u2295", // ⊕ circled plus
  HelpCircle: "?", // ? question mark
  Info: "i", // i info letter
  Lock: "\u2616", // ☖ lock
  LogOut: "\u2192", // → right arrow (exit)
  Mail: "\u2709", // ✉ envelope
  Menu: "\u2630", // ☰ trigram for heaven (hamburger menu)
  Minus: "\u2212", // − minus sign (indeterminate, remove)
  Moon: "\u263E", // ☾ last quarter moon
  MoreVertical: "\u22EE", // ⋮ vertical ellipsis
  Music2: "\u266B", // ♫ beamed eighth notes
  Pause: "\u23F8", // pause bars (media pause)
  Play: "\u25B6", // right triangle (media play)
  Plus: "+", // + plus sign
  Repeat: "\u21BB", // clockwise open circle arrow (repeat)
  Save: "\u2913", // ⤓ downwards arrow to bar
  Search: "\u2315", // ⌕ telephone recorder / search
  Send: "\u27A4", // ➤ arrow
  Settings: "\u2699", // ⚙ gear
  Share2: "\u2197", // ↗ arrow upper right
  Shield: "\u2616", // ☖ shield
  Shuffle: "\u21C4", // rightwards over leftwards arrows (shuffle)
  SkipBack: "\u23EE", // previous track (bar + left triangle)
  SkipForward: "\u23ED", // next track (right triangle + bar)
  Star: "\u2605", // ★ black star
  Stop: "\u23F9", // stop square (media stop, ends a running response)
  Sun: "\u2600", // ☀ sun
  Tag: "\u2302", // ⌂ house / label
  Trash2: "\u2717", // ✗ ballot X
  Upload: "\u2912", // ⤒ upwards arrow to bar
  User: "@", // @ at-sign (person)
  Volume2: "\u266B", // ♫ music note
  VolumeX: "\u2716", // ✖ heavy X
  X: "\u2715", // ✕ multiplication X
} as const satisfies Record<string, string>;

/** Keys of {@link TUI_ICON_GLYPHS} — use for typed catalogs or selects. */
export type TuiIconName = keyof typeof TUI_ICON_GLYPHS;

/**
 * The 1-bit icon set: seven rows of seven pixels each, `#` on and `.` off.
 * Keyed by every {@link TuiIconName}, so a name without a bitmap is a type
 * error. Filled silhouettes with knocked-out detail (the ! in AlertTriangle)
 * follow the Urizen 1-bit tileset the portfolio uses.
 */
export const TUI_ICON_BITMAPS: Record<TuiIconName, readonly string[]> = {
  AlertCircle: [
    ".#####.",
    "#######",
    "###.###",
    "###.###",
    "#######",
    "###.###",
    ".#####.",
  ],
  AlertTriangle: [
    "...#...",
    "..###..",
    "..#.#..",
    ".##.##.",
    ".#####.",
    "###.###",
    "#######",
  ],
  Archive: [
    "#######",
    "#######",
    ".#####.",
    ".#...#.",
    ".#####.",
    ".#####.",
    ".#####.",
  ],
  ArrowLeft: [
    ".......",
    "..#....",
    ".#.....",
    "#######",
    ".#.....",
    "..#....",
    ".......",
  ],
  ArrowRight: [
    ".......",
    "....#..",
    ".....#.",
    "#######",
    ".....#.",
    "....#..",
    ".......",
  ],
  Bell: [
    "...#...",
    "..###..",
    ".#####.",
    ".#####.",
    ".#####.",
    "#######",
    "...#...",
  ],
  Check: [
    ".......",
    "......#",
    ".....#.",
    "#...#..",
    ".#.#...",
    "..#....",
    ".......",
  ],
  CheckCircle: [
    ".#####.",
    "#####.#",
    "####.##",
    "#.#.###",
    "##.####",
    "#######",
    ".#####.",
  ],
  ChevronDown: [
    ".......",
    ".......",
    "#######",
    ".#####.",
    "..###..",
    "...#...",
    ".......",
  ],
  ChevronRight: [
    "..#....",
    "..##...",
    "..###..",
    "..####.",
    "..###..",
    "..##...",
    "..#....",
  ],
  ChevronUp: [
    ".......",
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    ".......",
    ".......",
  ],
  Copy: [
    "..#####",
    "..#...#",
    "#####.#",
    "#...#.#",
    "#...###",
    "#...#..",
    "#####..",
  ],
  Download: [
    "...#...",
    "...#...",
    "...#...",
    ".#####.",
    "..###..",
    "...#...",
    "#######",
  ],
  Edit: [
    ".....#.",
    "....###",
    "...###.",
    "..###..",
    ".###...",
    ".##....",
    "#......",
  ],
  ExternalLink: [
    "...####",
    ".....##",
    "##..#.#",
    "#..#...",
    "#.#...#",
    "#.....#",
    "#######",
  ],
  Eye: [
    ".......",
    "..###..",
    ".#...#.",
    "#..#..#",
    ".#...#.",
    "..###..",
    ".......",
  ],
  EyeOff: [
    ".......",
    ".......",
    "#.....#",
    ".#...#.",
    "..###..",
    ".#.#.#.",
    ".......",
  ],
  FileText: [
    ".####..",
    ".#####.",
    ".#...#.",
    ".#####.",
    ".#...#.",
    ".#####.",
    ".#####.",
  ],
  Globe: [
    "..###..",
    ".#.#.#.",
    "#..#..#",
    "#######",
    "#..#..#",
    ".#.#.#.",
    "..###..",
  ],
  HelpCircle: [
    ".#####.",
    "##...##",
    "####.##",
    "###.###",
    "#######",
    "###.###",
    ".#####.",
  ],
  Info: [
    ".#####.",
    "###.###",
    "#######",
    "###.###",
    "###.###",
    "###.###",
    ".#####.",
  ],
  Lock: [
    "..###..",
    ".#...#.",
    ".#...#.",
    "#######",
    "###.###",
    "###.###",
    "#######",
  ],
  LogOut: [
    "###....",
    "#...#..",
    "#....#.",
    "#.#####",
    "#....#.",
    "#...#..",
    "###....",
  ],
  Mail: [
    "#######",
    "##...##",
    "#.#.#.#",
    "#..#..#",
    "#.....#",
    "#.....#",
    "#######",
  ],
  Menu: [
    ".......",
    "#######",
    ".......",
    "#######",
    ".......",
    "#######",
    ".......",
  ],
  Minus: [
    ".......",
    ".......",
    ".......",
    "#######",
    ".......",
    ".......",
    ".......",
  ],
  Moon: [
    "..###..",
    ".##....",
    "##.....",
    "##.....",
    "##.....",
    ".##...#",
    "..####.",
  ],
  MoreVertical: [
    ".......",
    "...#...",
    ".......",
    "...#...",
    ".......",
    "...#...",
    ".......",
  ],
  Music2: [
    ".......",
    "..#####",
    "..#...#",
    "..#...#",
    "..#...#",
    "###.###",
    "###.###",
  ],
  Pause: [
    ".##.##.",
    ".##.##.",
    ".##.##.",
    ".##.##.",
    ".##.##.",
    ".##.##.",
    ".##.##.",
  ],
  Play: [
    "..#....",
    "..##...",
    "..###..",
    "..####.",
    "..###..",
    "..##...",
    "..#....",
  ],
  Plus: [
    "...#...",
    "...#...",
    "...#...",
    "#######",
    "...#...",
    "...#...",
    "...#...",
  ],
  Repeat: [
    ".....#.",
    "#######",
    "#....#.",
    "#.....#",
    ".#....#",
    "#######",
    ".#.....",
  ],
  Save: [
    "#####..",
    "#...##.",
    "#...###",
    "#######",
    "#.....#",
    "#.....#",
    "#######",
  ],
  Search: [
    ".###...",
    "#...#..",
    "#...#..",
    "#...#..",
    ".####..",
    "....##.",
    ".....##",
  ],
  Send: [
    "#......",
    "###....",
    ".####..",
    "..#####",
    ".####..",
    "###....",
    "#......",
  ],
  Settings: [
    "...#...",
    ".#####.",
    ".##.##.",
    "##...##",
    ".##.##.",
    ".#####.",
    "...#...",
  ],
  Share2: [
    ".....##",
    "....###",
    "##.#...",
    "###....",
    "##.#...",
    "....###",
    ".....##",
  ],
  Shield: [
    "#######",
    "#.....#",
    "#.....#",
    "#.....#",
    ".#...#.",
    "..#.#..",
    "...#...",
  ],
  Shuffle: [
    ".....#.",
    "##..###",
    "..#.##.",
    "...#...",
    "..#.##.",
    "##..###",
    ".....#.",
  ],
  SkipBack: [
    ".#....#",
    ".#...##",
    ".#..###",
    ".#.####",
    ".#..###",
    ".#...##",
    ".#....#",
  ],
  SkipForward: [
    "#....#.",
    "##...#.",
    "###..#.",
    "####.#.",
    "###..#.",
    "##...#.",
    "#....#.",
  ],
  Star: [
    "...#...",
    "...#...",
    "#######",
    ".#####.",
    "..###..",
    ".##.##.",
    ".#...#.",
  ],
  Stop: [
    ".......",
    ".#####.",
    ".#####.",
    ".#####.",
    ".#####.",
    ".#####.",
    ".......",
  ],
  Sun: [
    "...#...",
    ".#...#.",
    "..###..",
    "#.###.#",
    "..###..",
    ".#...#.",
    "...#...",
  ],
  Tag: [
    "####...",
    "#.###..",
    "######.",
    ".######",
    "..#####",
    "...###.",
    "....#..",
  ],
  Trash2: [
    "..###..",
    "#######",
    ".#####.",
    ".#.#.#.",
    ".#.#.#.",
    ".#.#.#.",
    ".#####.",
  ],
  Upload: [
    "...#...",
    "..###..",
    ".#####.",
    "...#...",
    "...#...",
    "...#...",
    "#######",
  ],
  User: [
    "..###..",
    ".#####.",
    "..###..",
    ".......",
    ".#####.",
    "#######",
    "#######",
  ],
  Volume2: [
    "...#...",
    "..##.#.",
    "####..#",
    "####..#",
    "####..#",
    "..##.#.",
    "...#...",
  ],
  VolumeX: [
    "..#....",
    ".##....",
    "###.#.#",
    "###..#.",
    "###.#.#",
    ".##....",
    "..#....",
  ],
  X: [
    "#.....#",
    ".#...#.",
    "..#.#..",
    "...#...",
    "..#.#..",
    ".#...#.",
    "#.....#",
  ],
};

/** Bitmap rows to one SVG path: each horizontal run of `#` becomes a rect. */
function bitmapPath(rows: readonly string[]): string {
  let d = "";
  rows.forEach((row, y) => {
    for (const run of row.matchAll(/#+/g)) {
      d += `M${run.index} ${y}h${run[0].length}v1h-${run[0].length}Z`;
    }
  });
  return d;
}

/** Precomputed once: TuiIcon renders on every button, so skip re-parsing. */
const ICON_PATHS = Object.fromEntries(
  Object.entries(TUI_ICON_BITMAPS).map(([name, rows]) => [name, bitmapPath(rows)])
) as Record<TuiIconName, string>;

/* Size presets: the box matches Lucide's w-3..w-8; `pixel` is the rendered
 * size of one art pixel. Whole-pixel steps keep 1-bit edges sharp, so the
 * 7x7 art sits centered with a small margin rather than stretching to fill.
 * The text size only applies to the "?" shown for an unknown name. */
/** Icon box sizes, named after the Tailwind size number (4 = 16px). */
export type TuiIconSize = "3" | "4" | "5" | "6" | "8";

const SIZE_MAP: Record<TuiIconSize, { box: string; pixel: number }> = {
  "3": { box: "w-3 h-3 text-xs", pixel: 1.5 },
  "4": { box: "w-4 h-4 text-sm", pixel: 2 },
  "5": { box: "w-5 h-5 text-base", pixel: 2 },
  "6": { box: "w-6 h-6 text-lg", pixel: 3 },
  "8": { box: "w-8 h-8 text-2xl", pixel: 4 },
};

export interface TuiIconProps {
  /** Icon name -- must match a key in {@link TUI_ICON_GLYPHS} (same as the Lucide component name). */
  name: string;
  /** Box size as a Tailwind size number: "3" (12px), "4" (16px, default), "5" (20px), "6" (24px), "8" (32px). */
  size?: TuiIconSize;
  /** Additional CSS classes (color, margin, etc.) */
  className?: string;
}

/**
 * Renders a design-system icon as 1-bit pixel art on a 7x7 grid.
 *
 * Use it anywhere an icon is needed: inside `Button` via `iconLeft` / `iconRight`,
 * in rows, headers and empty states. Icons carry no colour of their own, so they
 * inherit `currentColor` from the surrounding text: set colour with a text class
 * on the icon or its parent.
 *
 * One art pixel is 2px at the default size, the same 2px step the plates use, and
 * larger sizes step in whole pixels so edges never blur. An icon used on its own
 * as the meaning of a control is decorative to assistive tech: give the control an
 * `aria-label` rather than relying on the glyph.
 */
export const TuiIcon: React.FC<TuiIconProps> = ({
  name,
  size = "4",
  className,
}) => {
  const path = ICON_PATHS[name as TuiIconName];
  const { box, pixel } = SIZE_MAP[size] ?? SIZE_MAP["4"];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-mono leading-none select-none",
        box,
        className
      )}
      aria-hidden="true"
    >
      {path ? (
        <svg
          viewBox="0 0 7 7"
          width={7 * pixel}
          height={7 * pixel}
          fill="currentColor"
          shapeRendering="crispEdges"
        >
          <path d={path} />
        </svg>
      ) : (
        "?"
      )}
    </span>
  );
};

export default TuiIcon;
