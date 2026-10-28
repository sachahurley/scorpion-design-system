/**
 * SKILLS PAGE
 *
 * The agent-operations story: the named, repeatable workflows (Claude Code
 * skills) that build and maintain Scorp DS. Authored as a typed CaseStudy
 * and rendered by CaseStudyPage, the same editorial layout as the Case Study
 * page: the header for the title, one numbered section per group of skills,
 * list blocks for the skills themselves.
 *
 * The list is a curated snapshot of the repo's skill index (Figma-pipeline
 * skills are deliberately omitted here). Source of truth:
 * https://github.com/sachahurley/scorp-ds/tree/main/.claude/skills
 */

import { Link as RouterLink } from "react-router-dom";
import { CaseStudyPage, type CaseStudy } from "@/components/ui/CaseStudy";
import { Link } from "@/components/ui/Link";

const SKILLS_SOURCE_URL =
  "https://github.com/sachahurley/scorp-ds/tree/main/.claude/skills";

// The page: a header, then numbered sections in array order.
const SKILLS: CaseStudy = {
  title: "The Skills That Run This System",
  summary:
    "Scorp DS is built and maintained by AI agents working inside written rules. The rules live in the repo; the workflows live in named skills: markdown playbooks an agent invokes as slash commands. A spec update, an accessibility audit, or a release is one command, and the skill defines every step, so any agent session produces the same result. These are the skills, grouped by role.",
  sections: [
    {
      kicker: "Core Workflows",
      title: "The day-to-day build loop: make a change, propagate it, document it, ship it.",
      blocks: [
        {
          type: "list",
          items: [
            {
              title: "/update-component",
              text: "Edit a component and propagate the change through every builder function, story playground, and screen template that uses it.",
            },
            {
              title: "/update-spec",
              text: "Generate or update the spec for any layer of the system (tokens, primitives, components, patterns, screens), written from the source into docs/specs.",
            },
            {
              title: "/compose-screen",
              text: "Build a screen composition from existing components and shared builder functions, from free-form instructions.",
            },
            {
              title: "/ds-health",
              text: "Full health check across all design system layers: spec drift and staleness, tokens, storybook, static analysis, and tests, with a prioritized report.",
            },
            {
              title: "/generate-component-refs",
              text: "Generate portable component reference files that consumer projects use to build against the system without reading its source.",
            },
            {
              title: "/release-notes",
              text: "Generate a formatted changelog, bump the package version, and tag the release.",
            },
          ],
        },
      ],
    },
    {
      kicker: "Audits",
      title: "Enforcement of the written rules. These are what keep 'every rule written for agents' honest.",
      blocks: [
        {
          type: "list",
          items: [
            {
              title: "/review-component",
              text: "Audit one component file against the project rules: hardcoded values, naming, docs, accessibility, and exports.",
            },
            {
              title: "/a11y-audit",
              text: "WCAG AA accessibility audit across the whole system: semantic labels, contrast, touch targets, focus, motion, and screen reader support.",
            },
            {
              title: "/audit-cascade",
              text: "Trace the blast radius of a token change: which semantic tokens, components, presets, stories, and screens are affected.",
            },
            {
              title: "/storybook-audit",
              text: "Audit stories, samples, and presets for token compliance: flags hardcoded values and incorrect token usage.",
            },
            {
              title: "/storybook-check",
              text: "Verify a story follows the documentation page structure rules every doc page must share.",
            },
            {
              title: "/token-audit",
              text: "Verify the token documentation is in sync with the actual foundation token files.",
            },
          ],
        },
      ],
    },
    {
      kicker: "Sync and Operations",
      title: "Keeping specs and consumers honest: specs match the source, and every consumer site carries the current vendored copy.",
      blocks: [
        {
          type: "list",
          items: [
            {
              title: "/sync-specs",
              text: "Detect changed files across all layers and batch-update their specs in docs/specs.",
            },
            {
              title: "/vendor-portfolio",
              text: "After any merge to main, re-vendor the design system into all three consumer sites (the portfolio, this showcase, and the scorp-protodash prototype) and ship their update PRs.",
            },
          ],
        },
      ],
    },
    {
      kicker: "The Specs These Skills Maintain",
      title: "Every component, primitive, and pattern has a spec file in the repo covering status, intent, tokens, and accessibility.",
      blocks: [
        {
          type: "prose",
          text: "The markdown in the repo is the only copy, and GitHub renders it as readable documents. The Specs page indexes every one of them, generated from the spec files each time the design system is vendored.",
        },
      ],
    },
    {
      kicker: "What Checks Their Work",
      title: "A skill makes an agent repeatable. It does not make it right.",
      blocks: [
        {
          type: "prose",
          text: "Nothing above can fail on its own: a skill is a document, and an agent following one can still write a hardcoded value, leave a spec behind its source, or change how a component looks without noticing. That is the harness's job. Every pull request runs lint, types, unit tests, an API-surface check, an accessibility pass in both themes, and a screenshot diff, and none of it cares which agent opened it.",
        },
      ],
    },
  ],
};

export default function Skills() {
  return (
    <div className="container mx-auto px-5 lg:px-10 pt-5 lg:pt-10 pb-5 lg:pb-20">
      {/* Reading column: same editorial width as Essay and Case Study */}
      <div className="mx-auto max-w-2xl [container-type:inline-size]">
        <CaseStudyPage study={SKILLS} />

        {/* Outbound links: block vocabulary has no link block, so they live
            in a footer row matching the Home page footer treatment */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={SKILLS_SOURCE_URL} external className="text-sm">
            Skill definitions on GitHub
          </Link>
          <Link as={RouterLink} asProps={{ to: "/harness" }} className="text-sm">
            The harness that checks them
          </Link>
          <Link as={RouterLink} asProps={{ to: "/specs" }} className="text-sm">
            Browse all specs
          </Link>
        </div>
      </div>
    </div>
  );
}
