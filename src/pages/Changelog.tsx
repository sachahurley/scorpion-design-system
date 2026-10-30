/**
 * CHANGELOG PAGE
 *
 * Every pull request merged into scorp-ds, and whether it changed what the
 * three consumer sites run, plus the agent-readiness scorecard.
 *
 * Nothing on this page is typed by hand. vendor:ds runs
 * scripts/gen-changelog-index.mjs over the scorp-ds history and writes
 * src/data/changelog-index.json: one entry per merged PR, tagged "ships" when
 * it touched the component source or the token package outside tests (what
 * the sites vendor), "repo only" otherwise; and the latest monthly audit from
 * scorp-ds issue #136. ds:check flags drift the moment scorp-ds merges
 * anything new, so a page about what changed cannot itself lag behind.
 *
 * Page structure follows the Specs page: CaseStudyHeader for the title and
 * summary, EditorialHeadingView for the sections, DS Table for the lists.
 */

import { Link as RouterLink } from "react-router-dom";
import { EditorialHeadingView } from "@/components/docs/EditorialBlocks";
import { CaseStudyHeader, type CaseStudy } from "@/components/ui/CaseStudy";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/components/ui/Link";
import { StatusLine, StatusLineSegment } from "@/components/ui/StatusLine";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import changelogIndex from "@/data/changelog-index.json";
// The vendored snapshot marker, read directly for the same reason the Harness
// page does: baking it into the index would add drift that says nothing.
import vendorVersion from "../../vendor/scorp-ds/VERSION?raw";

/** One merged pull request (see scripts/gen-changelog-index.mjs). */
interface Change {
  pr: number;
  title: string;
  date: string;
  sha: string;
  ships: boolean;
  areas: string[];
  url: string;
}
interface Criterion {
  n: number;
  name: string;
  original: number;
  latest: number;
}
interface ChangelogIndex {
  source: string;
  links: Record<string, string>;
  counts: { changes: number; shipped: number; repoOnly: number };
  first: string;
  audit: {
    issue: string;
    report: string;
    date: string | null;
    commit: string | null;
    kind: string;
    passCondition: string | null;
    criteria: Criterion[];
  };
  months: { month: string; label: string; changes: Change[] }[];
}
const index = changelogIndex as ChangelogIndex;
const n = index.counts;
const audit = index.audit;

/** Short sha of the scorp-ds commit this site is vendored from. */
const SNAPSHOT = vendorVersion.trim().split(/\s+/)[0];

// Text tones matching the CaseStudy body treatment (see Specs page)
const BODY_TEXT = "text-sm font-mono text-secondary-800 dark:text-secondary-500";
const HEADING_TEXT = "text-sm font-mono text-[var(--text-primary)]";
const MUTED_CELL = "text-secondary-700 dark:text-secondary-600";

/** Areas past this many collapse to "+N more", so one sweeping PR stays one row. */
const MAX_AREAS = 6;
const areaText = (areas: string[]) =>
  areas.length > MAX_AREAS
    ? `${areas.slice(0, MAX_AREAS).join(", ")} +${areas.length - MAX_AREAS} more`
    : areas.join(", ");

const HEADER: Pick<CaseStudy, "title" | "summary"> = {
  title: "What Changed, and Where It Went",
  summary:
    "Scorp DS is not a published package. Three sites run a committed copy of it: this one, the portfolio, and a prototype dashboard. Merging into scorp-ds changes none of them until each is re-vendored, so every merge is followed by a vendor pull request into all three. This page lists every pull request merged into scorp-ds and says whether it changed what the sites run. It is generated from the repo's history each time this site is vendored, so it cannot fall behind the code it describes.",
};

/** A small table needs its own scroll axis inside the reading column on a phone. */
function TableScroller({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export default function Changelog() {
  return (
    <div className="container mx-auto px-5 lg:px-10 pt-5 lg:pt-10 pb-5 lg:pb-20">
      {/* Reading column: same editorial width as Specs and Harness */}
      <div className="mx-auto max-w-2xl [container-type:inline-size]">
        <StatusLine
          className="mb-10"
          aria-label="Changelog summary"
          left={<StatusLineSegment tone="primary">SCORP DS</StatusLineSegment>}
          center={
            <StatusLineSegment icon="Check" tone="success">
              {n.changes} PRs · {n.shipped} shipped · {n.repoOnly} repo only
            </StatusLineSegment>
          }
          right={<StatusLineSegment icon="Tag">{SNAPSHOT}</StatusLineSegment>}
        />

        <CaseStudyHeader study={HEADER} />

        {/* SHIPS OR STAYS */}
        <div className="mt-16">
          <EditorialHeadingView
            heading={{
              title: "Ships, or Stays in the Repo",
              text: `A change ships when it touches the component source or the token package, outside tests, because that is what the sites copy. ${n.shipped} of the ${n.changes} pull requests did. The other ${n.repoOnly} stayed in scorp-ds: specs, decision records, lint rules, CI, stories and tooling. They change no pixel on any site. They change how safely the next pixel can be changed.`,
            }}
            level={2}
          />
        </div>
        <p className={`${BODY_TEXT} leading-6`}>
          This site is vendored from{" "}
          <Link href={`${index.source}/commit/${SNAPSHOT}`} external className="text-sm">
            {SNAPSHOT}
          </Link>
          . This site's ds-check turns red when scorp-ds merges something new, and stays red
          until that merge is vendored here too.
        </p>

        {/* SCORECARD */}
        <div className="mt-16">
          <EditorialHeadingView
            heading={{
              title: "Agent-Readiness, Scored Monthly",
              text: "On the first of every month a cloud agent audits scorp-ds against nine criteria for whether an AI agent can build a correct screen from the repo alone, scores each from 0 to 3, and posts its report to a GitHub issue. It reports only: it never commits. Here is the latest report beside the original audit.",
            }}
            level={2}
          />
        </div>
        <TableScroller>
          <Table density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Criterion</TableHead>
                <TableHead>2026-10-28</TableHead>
                <TableHead>{audit.date ?? "Latest"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.criteria.map((c) => (
                <TableRow key={c.n}>
                  <TableCell>
                    {c.n}. {c.name}
                  </TableCell>
                  <TableCell className={MUTED_CELL}>{c.original}</TableCell>
                  <TableCell>{c.latest}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroller>
        <p className={`${BODY_TEXT} leading-6 mt-4`}>
          {audit.passCondition && <>Pass condition: {audit.passCondition}. </>}
          The latest score is the {audit.kind}
          {audit.date && <> of {audit.date}</>}
          {audit.commit && <> at {audit.commit}</>}; changes merged after it are scored at the next
          run.{" "}
          <Link href={audit.report} external className="text-sm">
            Read the report
          </Link>
          .
        </p>

        {/* EVERY PR */}
        <div className="mt-16">
          <EditorialHeadingView
            heading={{
              title: "Every Pull Request",
              text: `${n.changes} pull requests since ${index.first}, newest first. Before the first one, scorp-ds was built by pushing straight to main; that history is in the commit log.`,
            }}
            level={2}
          />
        </div>
        {index.months.map((month) => (
          <section key={month.month} className="mb-10">
            <h3 className={`${HEADING_TEXT} mb-3`}>
              {month.label} · {month.changes.length}
            </h3>
            <TableScroller>
              <Table density="compact">
                <TableHeader>
                  <TableRow>
                    <TableHead>Change</TableHead>
                    <TableHead>Sites</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {month.changes.map((c) => (
                    <TableRow key={c.pr}>
                      <TableCell className="align-top">
                        <Link href={c.url} external className="text-sm">
                          {c.title} #{c.pr}
                        </Link>
                        {/* The date shares the muted line with what shipped, so the table
                            stays two columns and fits a phone without scrolling. */}
                        <div className={`text-xs mt-1 ${MUTED_CELL}`}>
                          {[c.date, areaText(c.areas)].filter(Boolean).join(" · ")}
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        {c.ships ? (
                          <Badge tone="success" size="sm" iconLeft="Check">
                            ships
                          </Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">
                            repo only
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroller>
          </section>
        ))}

        {/* Outbound links, matching the Harness and Specs footer treatment */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={index.links.pulls} external className="text-sm">
            Merged pull requests on GitHub
          </Link>
          <Link href={index.links.commits} external className="text-sm">
            The commit log
          </Link>
          <Link href={index.links.vision} external className="text-sm">
            Why the sites vendor a copy
          </Link>
          <Link href={audit.issue} external className="text-sm">
            Every audit report
          </Link>
          <Link as={RouterLink} asProps={{ to: "/harness" }} className="text-sm">
            The checks each change passes
          </Link>
        </div>
      </div>
    </div>
  );
}
