/**
 * CASE STUDY PAGE
 *
 * "Building the Scorpion Design System" - the story of how this system was
 * built: a CaseStudyHeader (title, summary, meta) over one run of
 * CaseStudyContent blocks (prose, insights, quote). A first draft: when the
 * story gains named sections, move it to CaseStudyPage and they number
 * themselves.
 *
 * The full block-library documentation lives in the deployed Storybook
 * (Patterns/CaseStudy).
 */

import { Link as RouterLink } from "react-router-dom";
import {
  CaseStudyContent,
  CaseStudyHeader,
  type CaseStudy,
  type CaseStudyContentBlock,
} from "@/components/ui/CaseStudy";
import { Link } from "@/components/ui/Link";

// The page header: title, one-line summary, and the label/value meta rows.
const HEADER: Pick<CaseStudy, "title" | "summary" | "meta"> = {
  title: "Building the Scorpion Design System",
  summary:
    "A TUI-inspired design system built tokens-first, maintained by AI agents working inside written rules, and shipped to its consumers as vendored code.",
  meta: [
    { label: "Role", value: "Designer & Builder" },
    { label: "Timeline", value: "2025-2026" },
    { label: "Team", value: "Sacha + AI agents" },
  ],
};

// The story itself, in reading order. It has no named sections, so it
// renders as one run of content under the header rather than numbered ones.
const STUDY: CaseStudyContentBlock[] = [
  {
    type: "prose",
    text: "The system started with tokens, not components. Every color, type size, spacing step, and motion duration lives in a single W3C-format JSON file, organized in three layers: global scales (amber, sepia, and the status hues), then light and dark semantic layers that map those scales onto surfaces, text, and focus. The JSON and the CSS custom properties beside it are both written by hand, on purpose: the CSS carries measured contrast ratios and one documented exception that no generator would reproduce, and a unit test fails the build the moment the two disagree. Components reference only semantic names like primary-400 or surface-card. The rule that made it stick: raw values are allowed in exactly one file, and everything downstream is a reference.",
  },
  {
    type: "prose",
    text: "The visual identity is terminal UI, applied without exceptions: sharp corners via a stepped plate clip instead of border-radius, Fragment Mono everywhere, a warm amber-on-sepia palette, hairline borders instead of shadows, and interactive states that settle in under 200ms. Constraints this strict turned out to be the point. They are cheap to verify, easy to write down, and they give every page a voice even when a machine is doing the assembly.",
  },
  {
    type: "prose",
    text: "Most of the code was written by AI agents working from written rules: a project constitution that bans hardcoded values, per-component specs, and a set of repeatable skills for audits, token changes, and doc sync. My job shifted from typing components to designing the constraints and reviewing the diffs. When an agent got something wrong, the fix was usually a better rule, not a better prompt.",
  },
  {
    type: "prose",
    text: "Then the written rules got teeth. Every \"never\" in the project constitution became a lint rule that fails at error, the three test commands that nobody was running got a CI workflow, spec staleness stopped being a guess from file timestamps and became a hash of each component's public API, and every story started being screenshotted in both themes and diffed against a committed image. None of that changed how the system looks. It changed what a green pull request means.",
  },
  {
    type: "prose",
    text: "Distribution is deliberately boring: consumer sites, including this one, take the system as a committed vendored snapshot with a check script that diffs their copy against the source, so nothing drifts silently and nothing breaks when the upstream moves. Reference documentation lives in Storybook, where every story doubles as an axe accessibility test in both themes. This site stays lean on purpose: a portfolio front door, with the library itself one link away.",
  },
  {
    type: "insights",
    items: [
      {
        title: "Tokens before components",
        text: "Getting the three-layer token architecture right first meant every later component was mostly composition. Retheming stays possible because components only know semantic names, never raw scales.",
      },
      {
        title: "Constraints make agents accurate",
        text: "AI agents are only as good as the guardrails they build inside. The no-hardcoding rule, the semantic-alias rule, and the plate corner language turned subjective review into mechanical checks.",
      },
      {
        title: "A rule that cannot fail is a comment",
        text: "The written rules were already good. What changed everything was giving each one a check that fails out loud in CI, and only adding a check the codebase already satisfied, so each one froze a clean state instead of opening a backlog.",
      },
      {
        title: "Vendoring keeps consumers honest",
        text: "Shipping the system as a checked, committed snapshot instead of a live dependency made every consumer upgrade an explicit, reviewable diff, and made drift visible the moment it happened.",
      },
    ],
  },
  {
    type: "quote",
    text: "The design system is the prompt. Every rule I write down is a decision an agent never has to guess.",
    name: "Sacha Hurley",
    role: "Designer & Builder",
  },
];

export default function CaseStudyPage() {
  return (
    <div className="container mx-auto px-5 lg:px-10 pt-5 lg:pt-10 pb-5 lg:pb-20">
      {/* Reading column: breakout figures size against this inline-size container */}
      <div className="mx-auto max-w-2xl [container-type:inline-size]">
        <CaseStudyHeader study={HEADER} />
        <CaseStudyContent blocks={STUDY} className="mt-12" />

        {/* Outbound links: the block vocabulary has no link block, so they
            live in a footer row matching the Home, Skills and Harness pages */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link as={RouterLink} asProps={{ to: "/harness" }} className="text-sm">
            What checks all of this
          </Link>
          <Link as={RouterLink} asProps={{ to: "/skills" }} className="text-sm">
            The skills the agents run
          </Link>
          <Link as={RouterLink} asProps={{ to: "/essay" }} className="text-sm">
            The essay behind the approach
          </Link>
        </div>
      </div>
    </div>
  );
}
