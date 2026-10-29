/**
 * CASE STUDY
 *
 * Long-form, narrative pages (case studies, write-ups, project pages)
 * authored as data. A page is a structured `CaseStudy`: a header every page
 * has to fill (title and a one-line summary; outcomes, meta and a cover when
 * there are any), then an ordered list of sections.
 *
 * - Reorder a section by moving it in `sections`; hide one with
 *   `hidden: true`. Section numbers and figure numbers are counted over the
 *   visible sections only, so hiding one renumbers the rest.
 * - Each section opens on its number and name (`02 THE PROBLEM`), so authors
 *   never type numbers or headings as blocks. Sections are set apart by
 *   space alone, no rule between them.
 * - Every content block has one shape per meaning: steps and principles
 *   (`list`) read as a tree, findings (`insights`) carry large numerals,
 *   pillars (`callouts`) are cards, a testimonial (`quote`) hangs off an
 *   accent rule, a thesis (`statement`) is set large between rules, and
 *   results (`outcomes`) are accent figures.
 *
 * Figures degrade in one direction: every figure renders the hatch
 * placeholder until it has an `src` or a filled slot, so a page can be laid
 * out before its art exists and swapped a figure at a time.
 *
 * Don't use this for: app UI or dashboards. These are editorial blocks. The
 * `slot` block is the escape hatch when a page needs a live component inside
 * the narrative: the page owns that markup, not this library.
 *
 * Replaces CaseStudyBlocks (a flat block list); see
 * docs/decisions/0014-case-studies-are-structured-pages.md.
 *
 * TOKENS USED:
 * - text.primary, accent, secondary scale in AA theme pairs (700/600 labels,
 *   800/500 body), surface.muted (cards), surface.container-stroke (rules)
 * - plate.round + border.hairline (figure ring), surface.subtle/muted (hatch)
 * - border.width.hairline (the one rule weight)
 * - font.size.pageTitle (the h1 at sm and up); outcome figures stay at 2xl
 *   so the title is always the largest type on the page
 * - Avatar component (quote attribution)
 *
 * Breakout figures (`width: "wide" | "full"`) size against the nearest
 * inline-size container (100cqw); give an ancestor `container-type:
 * inline-size` (or rely on the viewport fallback).
 */

import type { CSSProperties, ReactNode } from "react";
import { Avatar } from "./Avatar";

type BreakWidth = "wide" | "full" | undefined;

/** Live content for `slot` blocks, keyed by the block's `name`. */
export type CaseStudySlots = Record<string, ReactNode>;

/** A title + blurb pair, shared by list, insights and callouts. */
export interface CaseStudyItem {
  /** Short heading for the item: a step name, a finding, a pillar. */
  title: string;
  /** One or two sentences under the title explaining it. */
  text: string;
}

/** One big result figure: `{ value: "43", label: "components" }`. */
export interface CaseStudyOutcome {
  /** The figure itself, set large in the accent colour ("43", "2x", "-60%"). Keep it short. */
  value: string;
  /** What the figure counts, in a few words ("components shipped"). */
  label: string;
}

/** A single picture: real art via `src`, the hatch placeholder without. */
export interface CaseStudyFigure {
  /** Image URL. Omit it to render the hatch placeholder, so a page can be laid out before its art exists. */
  src?: string;
  /** Empty string (the default) marks the image decorative. */
  alt?: string;
  /** CSS aspect-ratio, e.g. "21 / 9". Defaults to "16 / 9". */
  aspect?: string;
  /** Text under the figure; inside a section it is prefixed with the figure number. */
  caption?: string;
  /** Break out of the text column: `wide` or `full` bleed. Omit it to keep the figure in the column. */
  width?: "wide" | "full";
}

/** What a section can contain. Headings are not blocks: sections own them. */
export type CaseStudyContentBlock =
  | {
      type: "prose";
      /** A paragraph of body copy. */
      text: string;
    }
  | ({ type: "image" } & CaseStudyFigure)
  | {
      type: "imagePair";
      /** One caption per image, left then right; each gets its own figure number. */
      captions?: [string, string];
      /** Break the pair out of the text column, as on `CaseStudyFigure`. */
      width?: "wide" | "full";
      /** Image URLs, left then right; an `undefined` entry renders the hatch placeholder. */
      srcs?: [string | undefined, string | undefined];
      /** Alt text for each image, left then right; omit for decorative images. */
      alts?: [string | undefined, string | undefined];
    }
  | {
      /** A box-drawing diagram kept as live text (generate with
       *  @scorp-ds/tui-art). `label` says what it shows, for screen readers. */
      type: "ascii";
      /** The diagram, line breaks included, rendered in monospace exactly as written. */
      text: string;
      /** Numbered caption under the diagram. */
      caption?: string;
      /** Break the diagram out of the text column. */
      width?: "wide" | "full";
      /** Accessible description of what the diagram shows; falls back to the caption. */
      label?: string;
    }
  | {
      /** A live region filled through the `slots` prop, keyed by `name`. */
      type: "slot";
      /** Key into the `slots` prop; a name with no entry renders the hatch placeholder. */
      name: string;
      /** Numbered caption under the slot. */
      caption?: string;
      /** Break the slot out of the text column. */
      width?: "wide" | "full";
      /** CSS aspect-ratio for the placeholder, e.g. "4 / 3". */
      aspect?: string;
    }
  /** Steps, flows or principles: a connected tree, title over text. */
  | { type: "list"; items: CaseStudyItem[] }
  /** Findings: the loudest block, large numerals and ruled rows. */
  | { type: "insights"; items: CaseStudyItem[] }
  /** Pillars or options: cards, two up, or three up (wide) for three. */
  | { type: "callouts"; items: CaseStudyItem[] }
  /** A testimonial: hangs off an accent rule, optional attribution. */
  | {
      type: "quote";
      /** The quotation, without quote marks. */
      text: string;
      /** Who said it. */
      name?: string;
      /** Their role or company, shown under the name. */
      role?: string;
      /** Portrait URL for the small avatar beside the attribution (the attribution only renders with `name`). */
      image?: string;
    }
  /** The thesis or challenge, set large between rules. */
  | {
      type: "statement";
      /** The thesis or challenge in one or two sentences. */
      text: string;
      /** Small accent label above the statement ("the challenge"). */
      kicker?: string;
    }
  /** Results as big accent figures. */
  | { type: "outcomes"; items: CaseStudyOutcome[] };

/** One numbered section of the page. */
export interface CaseStudySection {
  /** Short section name shown in the rule: "the problem". */
  kicker: string;
  /** The section's heading, a sentence that states its point. */
  title: string;
  /** Optional lead paragraph under the title. */
  intro?: string;
  /** Content in reading order. Figures inside are numbered across the whole page. */
  blocks?: CaseStudyContentBlock[];
  /** Leave the section out of the page (and out of the numbering). */
  hidden?: boolean;
  /** Anchor id. Defaults to the kicker, slugified. */
  id?: string;
}

/** The whole page. `title` and `summary` are the fields every study needs. */
export interface CaseStudy {
  /** The page title, the largest type on the page. */
  title: string;
  /** One line: what this was and what it achieved. */
  summary: string;
  /** Headline results, shown as accent figures in the header. */
  outcomes?: CaseStudyOutcome[];
  /** Label and value rows in the header: role, team, timeline, year. */
  meta?: { label: string; value: string }[];
  /** Cover image under the header. */
  cover?: CaseStudyFigure;
  /** The body, in reading order; reorder by moving entries and hide one with `hidden`. */
  sections: CaseStudySection[];
}

// AA-passing theme pairs
const LABEL_TEXT = "text-secondary-700 dark:text-secondary-600";
const BODY_TEXT = "text-secondary-800 dark:text-secondary-500";
const TITLE_TEXT = "text-[var(--text-primary)]";
const ACCENT_TEXT = "text-[var(--accent)]";
const RULE = "border-[var(--surface-container-stroke)]";

const HATCH: CSSProperties = {
  background:
    "repeating-linear-gradient(45deg, var(--surface-subtle), var(--surface-subtle) 8px, var(--surface-muted) 8px, var(--surface-muted) 16px)",
};

/** Column breakouts: wide pushes ~120px past the column each side, full runs
 *  to the container margins; both stay centred, never exceed the container,
 *  and never fall narrower than the column itself. */
const breakClass = (w: BreakWidth) =>
  w === "wide"
    ? " [--csp-bw:max(100%,min(calc(100%+240px),calc(100cqw-48px)))] w-[var(--csp-bw)] ml-[calc((100%-var(--csp-bw))/2)]"
    : w === "full"
      ? " [--csp-bw:max(100%,calc(100cqw-48px))] w-[var(--csp-bw)] ml-[calc((100%-var(--csp-bw))/2)]"
      : "";

/** Fragment Mono's advance width in em (measured: 0.618), rounded up so a
 *  shrink-to-fit diagram never lands a fraction too wide. */
const MONO_ADVANCE = 0.62;

/** The shrink-to-fit font size for an `ascii` diagram: text-xs, or smaller
 *  when the longest line would not fit the figure. Exported for tests. */
export const asciiFontSize = (text: string) => {
  const longest = Math.max(...text.split("\n").map((l) => l.length));
  return `min(var(--font-size-xs), calc((100cqw - var(--spacing-10)) / ${(longest * MONO_ADVANCE).toFixed(2)}))`;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** How many numbered figures a block contributes. */
const figureCount = (b: CaseStudyContentBlock) =>
  b.type === "imagePair" ? 2 : b.type === "image" || b.type === "ascii" || b.type === "slot" ? 1 : 0;

/** First figure number for each figure block, counted in reading order. */
function numberFigures(blocks: CaseStudyContentBlock[], start = 1) {
  const map = new Map<CaseStudyContentBlock, number>();
  let n = start;
  for (const b of blocks) {
    const c = figureCount(b);
    if (c) {
      map.set(b, n);
      n += c;
    }
  }
  return map;
}

function Caption({ fig, caption }: { fig?: number; caption?: string }) {
  if (!fig && !caption) return null;
  return (
    <figcaption className="mt-3 flex gap-3 text-xs leading-relaxed">
      {fig !== undefined && <span className={`flex-none ${ACCENT_TEXT}`}>fig. {pad2(fig)}</span>}
      {caption && <span className={LABEL_TEXT}>{caption}</span>}
    </figcaption>
  );
}

function Figure({
  fig,
  caption,
  width,
  children,
}: {
  fig?: number;
  caption?: string;
  width?: BreakWidth;
  children: ReactNode;
}) {
  return (
    <figure className={`my-10 m-0${breakClass(width)}`}>
      <div className="plate-round p-px bg-[var(--border-hairline)]">{children}</div>
      <Caption fig={fig} caption={caption} />
    </figure>
  );
}

function Art({ src, alt, aspect }: { src?: string; alt?: string; aspect?: string }) {
  const ratio = aspect ?? "16 / 9";
  return src ? (
    <img
      src={src}
      alt={alt ?? ""}
      className="plate-round block w-full"
      style={{ aspectRatio: ratio, objectFit: "cover" }}
    />
  ) : (
    <div className="plate-round w-full" style={{ aspectRatio: ratio, ...HATCH }} />
  );
}

function Outcomes({ items }: { items: CaseStudyOutcome[] }) {
  const cols =
    items.length >= 4 ? "sm:grid-cols-4" : items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <dl className={`m-0 grid grid-cols-2 gap-x-8 gap-y-6 ${cols}`}>
      {items.map((it) => (
        // dt stays first for screen readers; the figure is moved above it
        // visually, so every figure hangs from the top of its cell however
        // its label wraps. Figure and label centre in their cell.
        <div key={it.label} className="flex flex-col items-center text-center">
          <dt className={`mt-2 text-xs ${LABEL_TEXT}`}>{it.label}</dt>
          <dd className={`order-first m-0 text-2xl leading-none ${ACCENT_TEXT}`}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Block({
  b,
  fig,
  slots,
}: {
  b: CaseStudyContentBlock;
  fig?: number;
  slots?: CaseStudySlots;
}) {
  switch (b.type) {
    case "prose":
      return <p className={`my-6 text-base leading-relaxed ${BODY_TEXT}`}>{b.text}</p>;

    case "image":
      return (
        <Figure fig={fig} caption={b.caption} width={b.width}>
          <Art src={b.src} alt={b.alt} aspect={b.aspect} />
        </Figure>
      );

    case "imagePair":
      return (
        <div className={`my-10 grid grid-cols-1 gap-4 sm:grid-cols-2${breakClass(b.width)}`}>
          {([0, 1] as const).map((i) => (
            <figure key={i} className="m-0">
              <div className="plate-round p-px bg-[var(--border-hairline)]">
                <Art src={b.srcs?.[i]} alt={b.alts?.[i]} aspect="4 / 3" />
              </div>
              <Caption fig={fig === undefined ? undefined : fig + i} caption={b.captions?.[i]} />
            </figure>
          ))}
        </div>
      );

    case "ascii": {
      // Shrink to fit: the type steps down from text-xs until the longest
      // line fits the figure (its own inline-size container), so a phone
      // sees the whole diagram instead of a sideways scroll. Wide screens
      // keep text-xs. overflow-x-auto stays as the fallback.
      const fit = asciiFontSize(b.text);
      return (
        <Figure fig={fig} caption={b.caption} width={b.width}>
          <div className="[container-type:inline-size]">
            <pre
              role="img"
              aria-label={b.label ?? b.caption ?? "diagram"}
              className={`plate-round m-0 overflow-x-auto p-5 leading-snug ${BODY_TEXT}`}
              style={{ fontSize: fit }}
            >
              {b.text}
            </pre>
          </div>
        </Figure>
      );
    }

    case "slot": {
      const filled = slots?.[b.name];
      return (
        <Figure fig={fig} caption={b.caption} width={b.width}>
          {filled ? (
            <div className="plate-round overflow-hidden">{filled}</div>
          ) : (
            <Art aspect={b.aspect} />
          )}
        </Figure>
      );
    }

    case "list":
      // A tree drawn with rules rather than box glyphs, so trunk and branches
      // meet exactly. The trunk runs from the first branch to the last; each
      // branch sits on the midline of its title's first line (top-3 of a
      // leading-6 line). Title over text at every width.
      return (
        <ul className="my-10 list-none p-0">
          {b.items.map((it, i) => {
            const first = i === 0;
            const last = i === b.items.length - 1;
            const trunk = `${first ? "top-3" : "top-0"} ${last ? "h-3" : "bottom-0"}`;
            return (
              <li key={it.title} className={`relative pl-8 ${last ? "" : "pb-6"}`}>
                {!(first && last) && (
                  <span aria-hidden="true" className={`absolute left-1 border-l-hairline ${RULE} ${trunk}`} />
                )}
                <span aria-hidden="true" className={`absolute left-1 top-3 w-4 border-t-hairline ${RULE}`} />
                <div className={`text-sm leading-6 ${TITLE_TEXT}`}>{it.title}</div>
                <p className={`m-0 mt-1 text-sm leading-6 ${BODY_TEXT}`}>{it.text}</p>
              </li>
            );
          })}
        </ul>
      );

    case "insights":
      return (
        <ol className={`my-10 list-none border-b-hairline p-0 ${RULE}`}>
          {b.items.map((it, i) => (
            <li
              key={it.title}
              className={`grid grid-cols-[theme(spacing.16)_1fr] border-t-hairline py-6 ${RULE}`}
            >
              <span className={`text-2xl leading-none ${ACCENT_TEXT}`}>{pad2(i + 1)}</span>
              <div>
                <div className={`text-lg leading-snug ${TITLE_TEXT}`}>{it.title}</div>
                <p className={`m-0 mt-2 text-sm leading-relaxed ${BODY_TEXT}`}>{it.text}</p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "callouts": {
      // Three cards break out wide so each keeps a readable measure in a
      // monospace face; two or four sit two up in the column.
      const three = b.items.length === 3;
      return (
        <div
          className={`my-10 grid grid-cols-1 gap-4 ${three ? `sm:grid-cols-3${breakClass("wide")}` : "sm:grid-cols-2"}`}
        >
          {b.items.map((it) => (
            <div key={it.title} className="plate-round bg-[var(--surface-muted)] p-5">
              <div className={`text-base leading-snug ${TITLE_TEXT}`}>{it.title}</div>
              <p className={`m-0 mt-2 text-sm leading-relaxed ${BODY_TEXT}`}>{it.text}</p>
            </div>
          ))}
        </div>
      );
    }

    case "quote":
      return (
        <figure className={`my-10 m-0 border-l-hairline border-[var(--accent)] pl-6`}>
          <blockquote className={`m-0 p-0 text-lg leading-relaxed ${TITLE_TEXT}`}>{b.text}</blockquote>
          {b.name && (
            <figcaption className="mt-4 flex items-center gap-3 text-sm">
              <Avatar size="md" src={b.image} alt="" />
              <span>
                <span className={`block ${TITLE_TEXT}`}>{b.name}</span>
                {b.role && <span className={`block text-xs ${LABEL_TEXT}`}>{b.role}</span>}
              </span>
            </figcaption>
          )}
        </figure>
      );

    case "statement":
      return (
        <div className={`my-12 border-y-hairline py-10 ${RULE}${breakClass("wide")}`}>
          {b.kicker && (
            <div className={`mb-4 text-xs uppercase tracking-wider ${ACCENT_TEXT}`}>{b.kicker}</div>
          )}
          <p className={`m-0 text-2xl leading-snug ${TITLE_TEXT}`}>{b.text}</p>
        </div>
      );

    case "outcomes":
      return (
        <div className="my-10">
          <Outcomes items={b.items} />
        </div>
      );
  }
}

/**
 * CaseStudyContent: content blocks with no section chrome. Use it for a
 * short page that does not need numbered sections; `CaseStudyPage` uses it
 * inside every section.
 *
 * @param blocks - Content blocks in order
 * @param slots - Live content for `slot` blocks
 * @param figureStart - First figure number (pages count across sections)
 */
export function CaseStudyContent({
  blocks,
  slots,
  figureStart = 1,
  className = "",
}: {
  blocks: CaseStudyContentBlock[];
  slots?: CaseStudySlots;
  figureStart?: number;
  className?: string;
}) {
  const figs = numberFigures(blocks, figureStart);
  return (
    <div className={`font-mono ${className}`}>
      {blocks.map((b, i) => (
        <Block key={i} b={b} fig={figs.get(b)} slots={slots} />
      ))}
    </div>
  );
}

/**
 * CaseStudyHeader: the page's `<h1>`, one-line summary, outcomes strip,
 * meta facts (label and value on a dotted leader) and optional wide cover. The largest type on the
 * page, so it always outranks the section titles below it.
 */
export function CaseStudyHeader({
  study,
  className = "",
}: {
  study: Pick<CaseStudy, "title" | "summary" | "outcomes" | "meta" | "cover">;
  className?: string;
}) {
  const { title, summary, outcomes, meta, cover } = study;
  return (
    <header className={`font-mono ${className}`}>
      <h1 className={`m-0 text-2xl leading-tight sm:text-page-title ${TITLE_TEXT}`}>{title}</h1>
      <p className={`m-0 mt-5 text-base leading-relaxed sm:text-lg ${BODY_TEXT}`}>{summary}</p>
      {outcomes && outcomes.length > 0 && (
        <div className="mt-10">
          <Outcomes items={outcomes} />
        </div>
      )}
      {meta && meta.length > 0 && (
        // One fact a line: label and value joined by a dotted leader, like a
        // contents page. A long value wraps and stays flush right.
        <dl className="m-0 mt-10 flex flex-col gap-2">
          {meta.map((it) => (
            <div key={it.label} className="flex items-baseline gap-3 text-sm">
              <dt className={`flex-none text-xs uppercase tracking-wider ${LABEL_TEXT}`}>{it.label}</dt>
              <span
                aria-hidden="true"
                className={`min-w-4 flex-1 border-b-hairline border-dotted ${RULE}`}
              />
              <dd className={`m-0 text-right leading-relaxed ${TITLE_TEXT}`}>{it.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {cover && (
        <figure className={`mt-12 m-0${breakClass(cover.width ?? "wide")}`}>
          <div className="plate-round p-px bg-[var(--border-hairline)]">
            <Art src={cover.src} alt={cover.alt} aspect={cover.aspect} />
          </div>
          <Caption caption={cover.caption} />
        </figure>
      )}
    </header>
  );
}

/** Opens a section: number and name, then the title. No rule: the space
 *  above (see CaseStudySections) is what separates sections. */
function SectionHeader({ n, section }: { n: number; section: CaseStudySection }) {
  return (
    <header>
      <div className="flex gap-3 text-xs uppercase tracking-wider">
        <span className={ACCENT_TEXT}>{pad2(n)}</span>
        <span className={LABEL_TEXT}>{section.kicker}</span>
      </div>
      <h2 className={`m-0 mt-4 text-xl leading-snug sm:text-2xl ${TITLE_TEXT}`}>{section.title}</h2>
      {section.intro && (
        <p className={`m-0 mt-4 text-base leading-relaxed ${BODY_TEXT}`}>{section.intro}</p>
      )}
    </header>
  );
}

/**
 * CaseStudySections: the visible sections, numbered, each with its
 * header and content, set apart by generous space rather than rules. `CaseStudyPage` is this plus `CaseStudyHeader`; use
 * it alone when a page draws its own header.
 *
 * @param sections - Sections in reading order; `hidden` ones are skipped
 *   and do not take a number
 * @param slots - Live content for `slot` blocks
 */
export function CaseStudySections({
  sections,
  slots,
  className = "",
}: {
  sections: CaseStudySection[];
  slots?: CaseStudySlots;
  className?: string;
}) {
  const visible = sections.filter((s) => !s.hidden);
  let fig = 1;
  return (
    <div className={`font-mono ${className}`}>
      {visible.map((s, i) => {
        const start = fig;
        fig += (s.blocks ?? []).reduce((sum, b) => sum + figureCount(b), 0);
        return (
          <section
            key={s.id ?? s.kicker}
            id={s.id ?? slugify(s.kicker)}
            className="mt-24 first:mt-0 sm:mt-32 sm:first:mt-0"
          >
            <SectionHeader n={i + 1} section={s} />
            {s.blocks && s.blocks.length > 0 && (
              <CaseStudyContent blocks={s.blocks} slots={slots} figureStart={start} />
            )}
          </section>
        );
      })}
    </div>
  );
}

/**
 * The page template for a portfolio case study, rendered from one `CaseStudy` data object.
 *
 * Renders a whole case study: the header, then each visible section with a
 * numbered header and its content blocks.
 *
 * @param study - The page (see {@link CaseStudy})
 * @param slots - Live content for `slot` blocks; a name with no entry falls
 *   back to the hatch placeholder
 * @param className - Additional classes on the wrapper (e.g. a column width)
 */
export function CaseStudyPage({
  study,
  slots,
  className = "",
}: {
  study: CaseStudy;
  slots?: CaseStudySlots;
  className?: string;
}) {
  return (
    <article className={`font-mono ${className}`}>
      <CaseStudyHeader study={study} />
      <CaseStudySections sections={study.sections} slots={slots} className="mt-24 sm:mt-32" />
    </article>
  );
}
