/**
 * EDITORIAL BLOCKS
 *
 * The Essay and Harness pages were written for the DS's old CaseStudyBlocks,
 * whose `headline` block let a heading sit anywhere in a run of content. The
 * DS replaced it with CaseStudyPage (scorp-ds #79): a header, then numbered
 * sections that each need a short kicker label. Those pages have neither the
 * labels nor a flat structure (the Essay nests "The Workflow" under each
 * approach), so moving them is a writing job, not a vendoring one.
 *
 * Until then this keeps them reading exactly as before: a `heading` block in
 * the list, everything else drawn by the DS's CaseStudyContent. Figure
 * numbers run on across headings, as they did. Site-owned on purpose (not in
 * components/ui), so vendoring never overwrites it.
 */

import type { ReactNode } from "react";
import {
  CaseStudyContent,
  type CaseStudyContentBlock,
  type CaseStudySlots,
} from "@/components/ui/CaseStudy";

/** A heading between runs of content: optional kicker, title, optional lead. */
export interface EditorialHeading {
  type: "heading";
  kicker?: string;
  title: string;
  text?: string;
}

export type EditorialBlock = CaseStudyContentBlock | EditorialHeading;

// Same tones the DS uses for case study labels and body text.
const LABEL_TEXT = "text-secondary-700 dark:text-secondary-600";
const BODY_TEXT = "text-secondary-800 dark:text-secondary-500";

const figureCount = (b: CaseStudyContentBlock) =>
  b.type === "imagePair" ? 2 : b.type === "image" || b.type === "ascii" || b.type === "slot" ? 1 : 0;

/**
 * A heading in an editorial page. The page title is the `<h1>`; every later
 * heading is an `<h2>`.
 */
export function EditorialHeadingView({
  heading,
  level,
}: {
  heading: Omit<EditorialHeading, "type">;
  level: 1 | 2;
}) {
  const Tag = level === 1 ? "h1" : "h2";
  return (
    <header className="mb-7 mt-16 first:mt-0 sm:mt-24 sm:first:mt-0">
      {heading.kicker && (
        <div className={`text-xs first-letter:uppercase ${LABEL_TEXT}`}>{heading.kicker}</div>
      )}
      <Tag className="mt-2 text-xl text-[var(--text-primary)]">{heading.title}</Tag>
      {heading.text && <p className={`mt-3 text-base leading-relaxed ${BODY_TEXT}`}>{heading.text}</p>}
    </header>
  );
}

/**
 * Renders a page authored as one list of headings and DS content blocks.
 *
 * @param blocks - Headings and content in reading order; the first block, if
 *   it is a heading, becomes the page's `<h1>`
 * @param slots - Live content for `slot` blocks, passed through to the DS
 */
export function EditorialBlocks({
  blocks,
  slots,
  className = "",
}: {
  blocks: EditorialBlock[];
  slots?: CaseStudySlots;
  className?: string;
}) {
  const parts: ReactNode[] = [];
  let run: CaseStudyContentBlock[] = [];
  let figure = 1;
  let runStart = 1;

  const flush = () => {
    if (run.length === 0) return;
    parts.push(
      <CaseStudyContent key={`run-${parts.length}`} blocks={run} slots={slots} figureStart={runStart} />
    );
    run = [];
  };

  blocks.forEach((b, i) => {
    if (b.type === "heading") {
      flush();
      parts.push(<EditorialHeadingView key={`h-${i}`} heading={b} level={i === 0 ? 1 : 2} />);
      return;
    }
    if (run.length === 0) runStart = figure;
    run.push(b);
    figure += figureCount(b);
  });
  flush();

  return <div className={`font-mono ${className}`}>{parts}</div>;
}
