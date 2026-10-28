/**
 * SPECS PAGE
 *
 * The documentation layer: every component, primitive, and pattern in
 * Scorp DS has a spec file in the repo (docs/specs/*.md), maintained with
 * /update-spec. The repo copy is the only copy, so every link here opens the
 * rendered markdown on GitHub.
 *
 * The index is generated, not hand-kept: vendor:ds runs
 * scripts/gen-specs-index.mjs over the spec files and writes
 * src/data/specs-index.json (name, status, category, first sentence of the
 * intent, GitHub URL). ds:check flags drift when a spec is added or changes.
 *
 * Page structure follows the Case Study editorial layout: the title and
 * summary via CaseStudyHeader, with DS Table and ListRow for the spec
 * anatomy and index (content the block vocabulary doesn't cover).
 */

import { EditorialHeadingView } from "@/components/docs/EditorialBlocks";
import { CaseStudyHeader, type CaseStudy } from "@/components/ui/CaseStudy";
import { Link } from "@/components/ui/Link";
import { ListRow } from "@/components/ui/ListRow";
import { TuiIcon } from "@/components/ui/TuiIcon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import specsIndex from "@/data/specs-index.json";

/** One row of the generated index (see scripts/gen-specs-index.mjs) */
interface SpecEntry {
  name: string;
  file: string;
  url: string;
  layer: string | null;
  category: string | null;
  status: string | null;
  story: string | null;
  updated: string | null;
  component: string | null;
  summary: string | null;
}
interface SpecsIndex {
  source: string;
  total: number;
  groups: { title: string; specs: SpecEntry[] }[];
}
const index = specsIndex as SpecsIndex;

const allSpecs = index.groups.flatMap((g) => g.specs);
const countIn = (title: string) => index.groups.find((g) => g.title === title)?.specs.length ?? 0;

// The worked example: the Link spec (status fields read live from the index)
const LINK_SPEC = allSpecs.find((s) => s.name === "Link");

// The page header: the title and the one-paragraph summary.
const HEADER: Pick<CaseStudy, "title" | "summary"> = {
  title: "Every Part Has a Paper Trail",
  summary:
    "Every component, primitive, and pattern in Scorp DS has a spec: a markdown file in the repo covering its status, intent, anatomy, properties, token usage, states, Storybook coverage, accessibility contract, and usage rules. Specs are written from the source and kept current by the /update-spec skill, which preserves human-written sections across regenerations. The repo copy is the only copy: every link on this page opens the spec on GitHub.",
};

const INDEX_TEXT = `The full index: ${countIn("Components and primitives")} components and primitives, ${countIn("Patterns")} patterns, and ${countIn("Foundation and meta")} foundation and meta specs. It is generated from the spec files each time the design system is vendored, and each row opens that spec on GitHub.`;

// Text tones matching the CaseStudy body treatment
const BODY_TEXT = "text-sm font-mono text-secondary-800 dark:text-secondary-500";
const HEADING_TEXT = "text-sm font-mono text-[var(--text-primary)]";
const MUTED_CELL = "text-secondary-700 dark:text-secondary-600";

/** One labeled sub-section of the example spec */
function SpecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className={`${HEADING_TEXT} mb-3`}>{title}</h3>
      {children}
    </section>
  );
}

/** Two-column key/value table used by the example spec */
function KeyValueTable({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <Table density="compact">
      <TableBody>
        {rows.map(([field, value]) => (
          <TableRow key={field}>
            <TableCell className={MUTED_CELL}>{field}</TableCell>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Specs() {
  return (
    <div className="container mx-auto px-5 lg:px-10 pt-5 lg:pt-10 pb-5 lg:pb-20">
      {/* Reading column: same editorial width as Essay and Case Study */}
      <div className="mx-auto max-w-2xl [container-type:inline-size]">
        <CaseStudyHeader study={HEADER} />
        <div className="mt-16">
          <EditorialHeadingView
            heading={{ title: "Anatomy of a Spec", text: "The Link spec, abbreviated to its key sections." }}
            level={2}
          />
        </div>

        {/* EXAMPLE SPEC: curated sections of docs/specs/Link.md */}
        <div className="mt-8">
          <SpecSection title="Status">
            <KeyValueTable
              rows={[
                ["Component", "Link"],
                ["Layer", LINK_SPEC?.layer ?? "component"],
                ["Category", LINK_SPEC?.category ?? "Navigation"],
                ["Story", LINK_SPEC?.story ?? "Components/Navigation/Link"],
                ["Status", LINK_SPEC?.status ?? "draft"],
                ["Last updated", LINK_SPEC?.updated ?? ""],
              ]}
            />
          </SpecSection>

          <SpecSection title="Intent">
            <p className={`${BODY_TEXT} leading-6 mb-3`}>
              Link is the inline text link for navigation inside prose,
              captions, nav lists, and footers. It always renders a real anchor
              (or a router link), never a button: links navigate, Button acts.
              The inline variant keeps a persistent underline so a link in body
              text never relies on color alone; quiet reserves the underline
              for hover and focus where position already signals the link.
            </p>
            <p className={`${BODY_TEXT} leading-6`}>
              There is deliberately no disabled state: a link without a
              destination is just text, so render text.
            </p>
          </SpecSection>

          <SpecSection title="Properties">
            <Table density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  [
                    ["variant", '"inline" | "quiet"', '"inline"'],
                    ["external", "boolean", "false"],
                    ["href", "string", "-"],
                    ["as / asProps", "ElementType / props", "-"],
                    ["children", "ReactNode", "required"],
                  ] as const
                ).map(([prop, type, def]) => (
                  <TableRow key={prop}>
                    <TableCell>{prop}</TableCell>
                    <TableCell className={MUTED_CELL}>{type}</TableCell>
                    <TableCell className={MUTED_CELL}>{def}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SpecSection>

          <SpecSection title="Token Map">
            <Table density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  [
                    ["--accent", "Resting text color (the links and active nav role)"],
                    ["--text-link-hover", "Hover color: darkens in light, brightens in dark"],
                    ["--focus-ring-primary", "Outside outline on focus-visible"],
                    ["--duration-fast", "Color transition (120ms)"],
                  ] as const
                ).map(([token, usage]) => (
                  <TableRow key={token}>
                    <TableCell>{token}</TableCell>
                    <TableCell className={MUTED_CELL}>{usage}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SpecSection>

          <SpecSection title="Do / Don't">
            <ul className={`${BODY_TEXT} leading-6 list-none space-y-2`}>
              <li>DO use Link for navigation inside prose and for nav or footer lists.</li>
              <li>DO write link text that names the destination, not "click here".</li>
              <li>DON'T use Link for actions (open modal, submit); that's Button.</li>
              <li>DON'T use quiet inside running body text; without the underline the link is signalled by color alone.</li>
              <li>DON'T disable a link; drop the wrapper and render text.</li>
            </ul>
          </SpecSection>

          <p className={`${BODY_TEXT} mb-4`}>
            The full spec also covers anatomy, states, Storybook coverage,
            hardcoded values, dependencies, accessibility, composition rules,
            known gaps, and its changelog.{" "}
            {LINK_SPEC && (
              <Link href={LINK_SPEC.url} external className="text-sm">
                Read the complete Link spec
              </Link>
            )}
            .
          </p>
        </div>

        {/* THE INDEX */}
        <div className="mt-16">
          <EditorialHeadingView heading={{ title: "All Specs", text: INDEX_TEXT }} level={2} />
        </div>
        <div className="mt-6">
          {index.groups.map((group) => (
            <section key={group.title} className="mb-8">
              <h3 className={`${HEADING_TEXT} mb-3`}>{group.title}</h3>
              <div className="flex flex-col gap-1">
                {group.specs.map((spec) => (
                  <ListRow
                    key={spec.file}
                    meta={[spec.category, spec.status].filter(Boolean).join(" · ")}
                    title={spec.name}
                    description={spec.summary ?? undefined}
                    titleSuffix={<TuiIcon name="ExternalLink" size="3" className="ml-1" />}
                    href={spec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Outbound link, matching the Home footer treatment */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={index.source} external className="text-sm">
            All spec sources on GitHub
          </Link>
        </div>
      </div>
    </div>
  );
}
