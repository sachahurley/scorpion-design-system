/**
 * HARNESS PAGE
 *
 * The verification story: everything in scorp-ds that can fail. Lint rules,
 * CI workflows, the token drift test, the accessibility pass, the visual
 * baselines, the API-surface contract, and the written records behind them.
 *
 * Authored as a typed EditorialBlock array, the same editorial layout as the
 * Essay, Case Study and Skills pages, with two additions the other pages
 * don't use:
 *
 * - `ascii` blocks for the diagrams. Preformatted box-drawing text rather
 *   than images, so they stay selectable, retint with the theme, and never
 *   need a second asset for dark mode. Every glyph is from Box Drawing
 *   (U+2500-257F), which the DS ships a face for and audits in CI.
 * - `slot` blocks for live specimens: a LogView showing what a failed gate
 *   actually prints, a StatusLine summarising a run, and the generated
 *   tables of rules, workflows and decisions.
 *
 * Every number and list on this page is READ FROM src/data/harness-index.json,
 * never typed here. vendor:ds regenerates it from the scorp-ds repo via
 * scripts/gen-harness-index.mjs and ds:check flags drift, so a page about a
 * system that refuses to report what it did not check cannot itself quote a
 * count the repo no longer has.
 */

import { Link as RouterLink } from "react-router-dom";
import type { CaseStudySlots } from "@/components/ui/CaseStudy";
import { EditorialBlocks, type EditorialBlock } from "@/components/docs/EditorialBlocks";
import { Link } from "@/components/ui/Link";
import { ListRow } from "@/components/ui/ListRow";
import { LogView } from "@/components/ui/LogView";
import { StatusLine, StatusLineSegment } from "@/components/ui/StatusLine";
import { TuiIcon } from "@/components/ui/TuiIcon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import harnessIndex from "@/data/harness-index.json";
// The vendored snapshot marker, the same file ds:check reports on. Read here
// rather than baked into harness-index.json, which must not change when an
// unrelated scorp-ds commit lands.
import vendorVersion from "../../vendor/scorp-ds/VERSION?raw";

/** Short sha of the scorp-ds commit this site is vendored from. */
const SNAPSHOT = vendorVersion.trim().split(/\s+/)[0];

/** One entry of the generated index (see scripts/gen-harness-index.mjs). */
interface LintRule {
  name: string;
  description: string | null;
  appliesTo: string[];
  enabled: boolean;
}
interface Workflow {
  file: string;
  name: string;
  summary: string | null;
  note: string | null;
  triggers: string[];
  steps: string[];
  url: string;
}
interface Decision {
  id: string;
  title: string;
  affects: string;
  url: string;
}
interface Insight {
  date: string;
  title: string;
  url: string;
}
interface HarnessIndex {
  source: string;
  links: Record<string, string>;
  counts: Record<string, number>;
  lintRules: LintRule[];
  workflows: Workflow[];
  decisions: Decision[];
  insights: Insight[];
}
const h = harnessIndex as HarnessIndex;
const n = h.counts;

// Text tones matching the CaseStudy body treatment (see Specs page)
const BODY_TEXT = "text-sm font-mono text-secondary-800 dark:text-secondary-500";
const MUTED_CELL = "text-secondary-700 dark:text-secondary-600";

/**
 * Which tree a rule is switched on for, from the globs in eslint.config.mjs.
 * The page cares about the distinction: a rule that only runs on stories is a
 * narrower promise than one that runs on every component.
 */
function scopeOf(rule: LintRule): string {
  const globs = rule.appliesTo.join(" ");
  const trees = [
    globs.includes("components/src") && "components",
    globs.includes("stories") && "stories",
    globs.includes("presets") && "presets",
  ].filter(Boolean);
  return trees.length ? trees.join(" · ") : "defined, not enabled";
}

/** The workflows that gate a pull request, in the order they matter. */
const GATES = h.workflows.filter((w) => w.triggers.includes("pull_request"));
/** Small counts read as words in a sentence, as digits in a table. */
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const spell = (count: number) => WORDS[count] ?? String(count);
/** The workflow that publishes, which is a consequence of merging, not a gate. */
const PUBLISH = h.workflows.find((w) => w.name.startsWith("Deploy"));

// ── The diagrams ───────────────────────────────────────────────────────────
//
// Box Drawing glyphs only (U+2500-257F) plus ASCII: the DS ships a face for
// that range and CI fails if any character in it would fall back to a system
// font. Kept under 72 columns so the wide breakout never needs to scroll.
//
// Strips the newlines that let the literal start on its own line, and nothing
// else: String.trim() would also eat the first row's indentation, which shears
// the top border of every box one column to the left.
const diagram = (s: string) => s.replace(/^\n+|\n+$/g, "");

const GATES_DIAGRAM = diagram(`
      a change to a token, a component, a story, or a spec
                               │
                               │  open a pull request
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────┴──────────┐   ┌───────┴───────┐   ┌──────────┴────────┐
   │ CI            │   │ Storybook     │   │ Visual regression │
   │ about a min   │   │ a11y          │   │                   │
   │               │   │               │   │ ${String(n.baselines).padEnd(3)} baselines     │
   │ lint          │   │ glyph audit   │   │ light and dark    │
   │ type-check    │   │ axe, light    │   │ diffs uploaded    │
   │ unit tests    │   │ axe, dark     │   │ on failure        │
   │ api manifest  │   │               │   │                   │
   └────┬──────────┘   └───────┬───────┘   └──────────┬────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │  all three green, and a human
                      ┌────────┴────────┐
                      │  merge to main  │
                      └────────┬────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
   ┌──────────┴──────────┐        ┌─────────────┴─────────────┐
   │ Deploy Storybook    │        │ /vendor-portfolio         │
   │ the public          │        │ portfolio, this site,     │
   │ reference docs      │        │ protodash: one PR each    │
   └─────────────────────┘        └───────────────────────────┘
`);

const TOKENS_DIAGRAM = diagram(`
   ┌────────────────────────────────────────────────────────┐
   │ global      amber · sepia · green · blue · purple ·    │
   │             red, type, space, motion, plates, z-index  │
   │             THE ONLY PLACE A RAW VALUE MAY LIVE        │
   └───────────────────────────┬────────────────────────────┘
                   ┌───────────┴───────────┐
   ┌───────────────┴───────┐   ┌───────────┴───────────────┐
   │ light                 │   │ dark        (the default) │
   │ surface · text ·      │   │ surface · text ·          │
   │ border · focus ·      │   │ border · focus ·          │
   │ control · field       │   │ control · field           │
   └───────────────┬───────┘   └───────────┬───────────────┘
                   └───────────┬───────────┘
   ┌───────────────────────────┴────────────────────────────┐
   │ components  primary-400 · surface-card · var(--accent) │
   │             semantic aliases only, never a raw scale   │
   └────────────────────────────────────────────────────────┘
`);

const BASELINE_DIAGRAM = diagram(`
        │  capture the frame
        │
        ├── no baseline yet ───────────────────── write it
        │
        ├── different dimensions ──────────────── write it
        │
        ├── more than 0 differing pixels ──────── write it
        │
        └── otherwise ─────────────────────────── keep it, log SETTLED
`);

// ── The page ───────────────────────────────────────────────────────────────

const PAGE: EditorialBlock[] = [
  {
    type: "heading",
    kicker: "Harness",
    title: "Everything Here Is Allowed to Fail",
  },
  {
    type: "prose",
    text: "A design system promises consistency. On its own that promise is prose, and prose cannot fail. The harness is the part of Scorp DS that can: the lint rules, the CI workflows, the token drift test, the accessibility pass, the baseline screenshots, and the written records saying why each one exists. None of it renders a pixel. All of it is the reason the pixels can be trusted.",
  },
  {
    type: "prose",
    text: 'The governing rule is one line: every "never" in the rules file gets a check that fails. Before that rule the repo had a page of prose bans and zero custom lint rules, and three working test commands that no workflow ever invoked. The rules were real. Nothing was checking them.',
  },

  // WHAT RUNS
  {
    type: "heading",
    title: "What Runs on Every Change",
    text: `${spell(GATES.length).replace(/^./, (c) => c.toUpperCase())} workflows gate a pull request. They are split so the cheap one fails first: CI finishes in about a minute, and there is no point building a static Storybook to screenshot code that does not compile.`,
  },
  { type: "ascii", width: "wide", text: GATES_DIAGRAM, label: "A change opens a pull request, which runs three workflows in parallel: CI (lint, type-check, unit tests, API manifest), Storybook accessibility (glyph audit then axe in light and dark), and visual regression against the committed baselines. When all three pass and a human approves, the change merges to main, which deploys the public Storybook and triggers a re-vendor pull request into each of the three consumer sites.", caption: "One change, three gates, two consequences." },
  { type: "slot", name: "workflows", caption: "The workflows, read from .github/workflows at the vendored commit." },

  // THE RULES
  {
    type: "heading",
    title: `${spell(n.lintRules).replace(/^./, (c) => c.toUpperCase())} Rules That Can Fail`,
    text: "Each one encodes a sentence from the rules file. They are scoped: the token package is deliberately exempt, because it is the one place raw values are allowed to live.",
  },
  { type: "slot", name: "rules", caption: "Every scorp/* rule, its scope, and what it catches." },
  {
    type: "prose",
    text: "Two of them, no-raw-color and no-raw-scale, exist to protect one property: that the palette can be swapped without touching a component. That only holds while every component reads a semantic alias and nothing reads a scale directly.",
  },
  { type: "ascii", width: "wide", text: TOKENS_DIAGRAM, label: "The token architecture in three layers. Global holds the raw colour scales, type, space, motion, plates and z-index, and is the only place a raw value may live. Light and dark each map those scales onto surface, text, border, focus, control and field, with dark as the default theme. Components reference only the semantic aliases such as primary-400, surface-card and var(--accent), and never a raw scale.", caption: "Three layers, and one file where a raw value is legal." },
  {
    type: "prose",
    text: "Every one of these went in at error rather than warning, and every one was added only after the codebase already satisfied it. That is the whole trick. They are ratchets holding a clean baseline, not a cleanup backlog, which is why turning them on cost a single afternoon and broke nothing.",
  },
  {
    type: "prose",
    text: "A rule that cannot fail is a comment. Here is what one looks like when it does.",
  },
  { type: "slot", name: "log", caption: "A failing lint gate. The message names the token to use, not just the rule that was broken." },

  // THE LAYERS
  {
    type: "heading",
    title: "The Layers, and What Guards Each One",
    text: "The system is a stack, and each layer has a different failure mode. A token can disagree with itself across two files. A component can hardcode a value. A story can look fine and be unreadable to a screen reader. A consumer can fall behind. One check does not cover four problems.",
  },
  { type: "slot", name: "layers", caption: "Every layer, and the check standing behind it." },

  // SPECS
  {
    type: "heading",
    title: "A Spec With a Hash",
    text: `Every component carries a spec. The question a spec cannot answer about itself is whether it is still true, and the first attempt at answering it mechanically was wrong in a way that read as success.`,
  },
  { type: "slot", name: "drift", caption: "The same question, asked two ways." },
  {
    type: "prose",
    text: "The hash covers exported symbols, props, types, union members, optionality, and defaults, and nothing else. Hashing the whole file would move on a reformatted comment; hashing the public surface moves when, and only when, a consumer of the component would notice. CI regenerates the manifest and fails if the committed one is out of date, because a stale manifest silently disables the check that depends on it.",
  },
  {
    type: "prose",
    text: `Deliberately not in the hash: the prose. Intent, anatomy, when to use it, when not to, and how it composes all live in the ${n.specs} hand-written spec files, which are better at those things than any generator. The contract is for tooling; the specs are for people.`,
  },

  // VISUAL
  {
    type: "heading",
    title: `${n.baselines} Pictures, in Both Themes`,
    text: `Sharp corners, one type family, exact token values: the whole value proposition is visual, and a single token change can alter every component at once. The accessibility pass asserts that a story is usable. It says nothing about whether it still looks right.`,
  },
  {
    type: "prose",
    text: `So every story is screenshotted in light and in dark and diffed against a committed PNG. Two constraints make it work. Baselines are Linux-only, because font rasterisation differs between a laptop and a CI container and a baseline captured on macOS would never match. And a story whose subject only exists after a click carries its own Storybook play function, so the interaction lives next to the story it belongs to. The harness used to hold a map of story id to interaction instead, and two of the ids in it were wrong: those frames captured nothing at all, in silence, and still counted as coverage.`,
  },
  { type: "ascii", width: "wide", text: BASELINE_DIAGRAM, label: "When refreshing baselines, a frame is written if it is new, if its dimensions changed, or if more than zero pixels differ. Otherwise the existing baseline is kept and the run logs SETTLED with the raw pixel count.", caption: "What a baseline refresh is allowed to rewrite. SETTLED carries the raw pixel count, so an invisible difference appears as a number in the log rather than an unexplained modified file in git." },
  {
    type: "callouts",
    items: [
      {
        title: "Write gate: above 0 px",
        text: "Deliberately stricter than the gate that fails a run, so every frame the suite could ever fail on is still rebaselined, with margin.",
      },
      {
        title: "Failure gate: above 10 px",
        text: "Anti-aliased pixels are excluded at any threshold, so they can never fail a run. They were the entire source of the churn.",
      },
    ],
  },
  {
    type: "prose",
    text: "That second half is the fix for a real problem, and the problem was not the pixels. A refresh run used to rewrite every frame, so each one arrived with a handful of files that had changed by three anti-aliased pixels and nothing else. A diff that routinely contains noise is a diff that gets skimmed, and skimming is how a real regression gets waved through. The suite's entire value is someone looking at these images.",
  },

  // A11Y
  {
    type: "heading",
    title: "Accessibility Runs Twice",
    text: "Dark is the default theme here, which means light is the one that quietly rots. So axe runs over every story once in each theme, on every pull request, not as an audit somebody schedules.",
  },
  {
    type: "prose",
    text: "The same workflow runs a glyph audit first, which is the strangest check in the repo and one of the most useful. It asks Chrome which physical font painted each character the system renders, and fails if any of them came from a system fallback rather than the mono stack. A fallback glyph differs per operating system and breaks the monospace grid, so it is a bug even when it looks fine on the machine that introduced it. Every box-drawing character in the diagrams on this page is covered by it.",
  },

  // LIMITS
  {
    type: "heading",
    title: "What the Harness Cannot See",
    text: "A green run is a floor, not a guarantee, and the harness is written to say so rather than imply otherwise.",
  },
  {
    type: "insights",
    items: [
      {
        title: "Class-based linting has a blind spot",
        text: "The rules read Tailwind classes and string literals. Raw values hide in inline style objects and in JS string constants: the Tooltip caret held roughly 28 hardcoded pixel values inside two clip-path polygons that no Tailwind-aware rule would ever match. Reviewers still have to look.",
      },
      {
        title: "A silent skip is worse than a crash",
        text: "The drift script once read two of its four source paths from config and left the other two pointed at directories that do not exist. The function opened with a silent return, so the primitives layer was never scanned and drift reported clean. Both scripts now take every path from config, fail loudly when they cannot, and report a configured-but-missing layer as SKIPPED.",
      },
      {
        title: "A check can look like coverage and be nothing",
        text: "Two of the wrong story ids in the old interaction map. A story that focuses an element in JavaScript, when the focus recipe is focus-visible, which does not match programmatic focus. Both produced a frame that matched its baseline forever. Both are now lint errors, because the failure mode of a check that passes for the wrong reason is that nobody ever looks at it again.",
      },
    ],
  },

  // WHY LAYER
  {
    type: "heading",
    title: "The Why-Layer",
    text: `Rules say what to do. They are useless for stopping someone from undoing a decision they never saw. So each one has a record: ${n.decisions} decision records and ${spell(n.insights)} insights, all in the repo, all linked from the rules file.`,
  },
  {
    type: "prose",
    text: "A record is never edited to reverse its meaning. When a decision changes, a new record supersedes the old one and the old one is marked, so the reasoning stays legible in both directions. Insights are the other half: an observation with a source, tied to the audit or CI run that produced it. When an insight forces a choice, the choice becomes a decision and links back.",
  },
  { type: "slot", name: "decisions", caption: "Every decision record, with what it affects." },
  { type: "slot", name: "insights", caption: "Findings from audits and CI runs, newest first." },

  {
    type: "quote",
    text: "The rules were never the hard part. Getting each one to the point where it can fail out loud, on a Tuesday, in front of everyone, is the work.",
    name: "Sacha Hurley",
    role: "Designer & Builder",
  },
];

// ── Live slots ─────────────────────────────────────────────────────────────

/** Shared two-line row used by the rule and decision lists. */
function RowList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1 p-2">{children}</div>;
}

/**
 * A table inside a `slot` figure. The figure shell clips to the plate
 * silhouette with overflow-hidden, so a table wider than the column loses its
 * last cells rather than scrolling: the workflows table ran 18px past the
 * plate at 390px wide. This gives it its own scroll axis inside the clip.
 */
function TableScroller({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

/** A failing CI gate, as it actually prints. */
const LOG_LINES = [
  { id: 1, timestamp: "12:04:01", level: "info" as const, text: "CI · lint · packages/components/src" },
  { id: 2, timestamp: "12:04:07", level: "error" as const, text: "Card.tsx:52  scorp/no-raw-color" },
  { id: 3, timestamp: "12:04:07", level: "error" as const, text: "  Raw hex color '#3a2f26'. Use a token-backed Tailwind class (bg-secondary-900) or var(--token)." },
  { id: 4, timestamp: "12:04:07", level: "error" as const, text: "Tooltip.tsx:118  scorp/no-arbitrary-values" },
  { id: 5, timestamp: "12:04:07", level: "error" as const, text: "  Bare value in 'w-[18px]'. Route it through a token, or allowlist it with a reason." },
  { id: 6, timestamp: "12:04:08", level: "error" as const, text: "2 problems, 0 warnings" },
  { id: 7, timestamp: "12:04:08", level: "info" as const, text: "type-check, unit tests and api manifest not reached" },
  { id: 8, timestamp: "12:04:08", level: "warning" as const, text: "CI failed in 1m 04s. Storybook a11y and Visual regression still running." },
];

const SLOTS: CaseStudySlots = {
  // The workflows, generated from .github/workflows
  workflows: (
    <TableScroller>
      <Table density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Workflow</TableHead>
          <TableHead>Runs on</TableHead>
          <TableHead>What it proves</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {h.workflows.map((w) => (
          <TableRow key={w.file}>
            <TableCell>
              <Link href={w.url} external className="text-sm">
                {w.name}
              </Link>
            </TableCell>
            <TableCell className={MUTED_CELL}>
              {w.triggers.map((t) => t.replace("_", " ")).join(", ")}
            </TableCell>
            <TableCell className={MUTED_CELL}>{w.summary}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TableScroller>
  ),

  // The lint rules, generated from eslint-rules/index.js + eslint.config.mjs
  rules: (
    <RowList>
      {h.lintRules.map((r) => (
        <ListRow
          key={r.name}
          meta={scopeOf(r)}
          title={r.name}
          description={r.description ?? undefined}
          titleSuffix={<TuiIcon name="ExternalLink" size="3" className="ml-1" />}
          href={h.links.lintRules}
          target="_blank"
          rel="noopener noreferrer"
        />
      ))}
    </RowList>
  ),

  log: (
    <LogView
      lines={LOG_LINES}
      framed={false}
      showLineNumbers
      className="h-60"
      aria-label="A failing lint gate"
    />
  ),

  // The stack, and the check that guards each step of it. A table rather than
  // a diagram: it is two columns of prose, and the DS already has the
  // component for that.
  layers: (
    <TableScroller>
      <Table density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Layer</TableHead>
          <TableHead>Guarded by</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(
          [
            ["tokens.json and tokens.css", "A drift test: every token exists in both files at the same value. Neither file generates the other."],
            ["The Tailwind preset", "It is the whole set of classes a component is allowed to use."],
            [`${n.components} components, ${n.primitives} primitives`, `${n.lintRules} lint rules at error, plus one API-surface hash each.`],
            [`${n.specs} specs`, "Spec drift: the hash recorded in the spec against the live one."],
            [`${n.stories} stories`, `axe in light and axe in dark, plus ${n.baselines} baseline frames.`],
            ["3 consumer sites", "A committed vendored copy, and a check script that diffs it."],
          ] as const
        ).map(([layer, guard]) => (
          <TableRow key={layer}>
            <TableCell>{layer}</TableCell>
            <TableCell className={MUTED_CELL}>{guard}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TableScroller>
  ),

  // Modification times against an API hash, on the three cases that decide it.
  drift: (
    <TableScroller>
      <Table density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Case</TableHead>
          <TableHead>Modification times</TableHead>
          <TableHead>An API hash</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(
          [
            ["A prop is added or renamed", "Drift, correctly", "Drift, correctly"],
            ["A fresh clone or worktree", "Clean, wrongly: every file gets the same checkout time", "Unchanged"],
            ["A formatter runs", "Stale, wrongly: every file is newer than its spec", "Unchanged"],
            ["A comment is rewritten", "Stale, wrongly", "Unchanged"],
          ] as const
        ).map(([label, mtime, hash]) => (
          <TableRow key={label}>
            <TableCell>{label}</TableCell>
            <TableCell className={MUTED_CELL}>{mtime}</TableCell>
            <TableCell className={MUTED_CELL}>{hash}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TableScroller>
  ),

  decisions: (
    <RowList>
      {h.decisions.map((d) => (
        <ListRow
          key={d.id}
          meta={`${d.id} · ${d.affects}`}
          title={d.title}
          titleSuffix={<TuiIcon name="ExternalLink" size="3" className="ml-1" />}
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
        />
      ))}
    </RowList>
  ),

  // A table rather than rows: an insight's title is a full sentence, and a
  // ListRow title is single-line and ellipsizes. A table cell wraps.
  insights: (
    <TableScroller>
      <Table density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Finding</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {h.insights.map((i) => (
          <TableRow key={i.url}>
            <TableCell className={`${MUTED_CELL} whitespace-nowrap align-top`}>{i.date}</TableCell>
            <TableCell>
              <Link href={i.url} external className="text-sm">
                {i.title}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </TableScroller>
  ),
};

export default function Harness() {
  return (
    <div className="container mx-auto px-5 lg:px-10 pt-5 lg:pt-10 pb-5 lg:pb-20">
      {/* Reading column: same editorial width as Essay, Case Study and Skills */}
      <div className="mx-auto max-w-2xl [container-type:inline-size]">
        {/* The run this page describes, as the system's own status bar. Not
            live data: the counts are the vendored ones, the verdict is what a
            passing run looks like. */}
        <StatusLine
          className="mb-10"
          aria-label="Harness summary"
          left={<StatusLineSegment tone="primary">SCORP DS</StatusLineSegment>}
          center={
            <StatusLineSegment icon="Check" tone="success">
              {n.lintRules} rules · {n.stories} stories · {n.baselines} frames
            </StatusLineSegment>
          }
          right={<StatusLineSegment icon="Tag">{SNAPSHOT}</StatusLineSegment>}
        />

        {/* The ascii block ships at leading-snug, which suits a caption-height
            code sample and breaks box drawing: the vertical rules land a few
            pixels short of the next row, so every box reads as dashed. One
            line-height per character cell closes them. Scoped to the ascii
            block's own `pre[role="img"]`, page-side, so the vendored
            CaseStudy.tsx stays byte-identical to scorp-ds and ds:check keeps
            working. Worth fixing upstream. */}
        <EditorialBlocks
          blocks={PAGE}
          slots={SLOTS}
          className="[&_pre[role=img]]:leading-none"
        />

        {/* Outbound links, matching the Home and Skills footer treatment */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={h.links.rules} external className="text-sm">
            The rules file
          </Link>
          <Link href={h.links.vision} external className="text-sm">
            What the system is for
          </Link>
          <Link href={h.links.workflows} external className="text-sm">
            The workflows
          </Link>
          <Link as={RouterLink} asProps={{ to: "/skills" }} className="text-sm">
            The skills that run it
          </Link>
          <Link as={RouterLink} asProps={{ to: "/specs" }} className="text-sm">
            The specs it checks
          </Link>
          <Link as={RouterLink} asProps={{ to: "/changelog" }} className="text-sm">
            Every change it has let through
          </Link>
        </div>

        {/* The publishing consequence of a green run, named so the deploy
            workflow in the table above has somewhere to point. */}
        {PUBLISH && (
          <p className={`${BODY_TEXT} mt-6`}>
            A green run on main publishes the reference documentation:{" "}
            <Link href="https://sachahurley.github.io/scorp-ds/" external className="text-sm">
              the deployed Storybook
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
