/**
 * ESSAY PAGE
 *
 * "Design Systems for AI-First Product Development" - the long-form essay
 * that used to live inside the Home page's Design Philosophy modal, now a
 * page of its own. The content is authored as a typed EditorialBlock array
 * and rendered by EditorialBlocks: headings per section, and the DS case
 * study blocks for the rest (prose for paragraphs, insights for the numbered
 * workflow steps, callouts and lists for the short bullet runs).
 *
 * The words are Sacha's original essay text, restructured into the block
 * vocabulary - edit the ESSAY array to revise the content.
 */

import { Link as RouterLink } from "react-router-dom";
import { EditorialBlocks, type EditorialBlock } from "@/components/docs/EditorialBlocks";
import { Link } from "@/components/ui/Link";

// The essay, section by section. Blocks render in array order.
const ESSAY: EditorialBlock[] = [
  {
    type: "heading",
    kicker: "Essay",
    title: "Design Systems for AI-First Product Development",
  },

  // THE PHILOSOPHY
  { type: "heading", title: "The Philosophy" },
  {
    type: "prose",
    text: "As product design evolves with AI-first tools, design-system-first has become essential, not optional. The quality of your input, whether design tokens in Figma or a code-based design system, directly determines the quality and accuracy of AI-generated outputs. Pixel-perfect products require systematic, high-quality foundations that AI agents can reliably draw from.",
  },

  // THE CHALLENGE
  {
    type: "heading",
    title: "The Challenge",
    text: "Most teams face one of these scenarios:",
  },
  {
    type: "list",
    items: [
      { title: "No design system exists", text: "" },
      { title: "Design system only exists in code", text: "" },
      {
        title: "Robust systems exist in both Figma and code, but they're disconnected",
        text: "Creating a gap between what designers make and what gets implemented.",
      },
    ],
  },

  // APPROACH 1: ZERO TO ONE
  {
    type: "heading",
    title: "Approach 1: Zero to One (No Design System)",
    text: "Foundation First: Establish a three-layer design token system covering:",
  },
  {
    type: "callouts",
    items: [
      { title: "Base colors → Semantic colors", text: "" },
      { title: "Typography", text: "" },
      { title: "Spacing and corner radius", text: "" },
      { title: "Surface colors", text: "Page, container, card, button, etc." },
    ],
  },
  { type: "heading", title: "The Workflow" },
  {
    type: "insights",
    items: [
      {
        title: "Start with Established Foundations",
        text: "Leverage existing frameworks like Tailwind colors as your starting point. Build base colors first, then semantic colors, then typography. Create documentation simultaneously: you're designing and maintaining the design system hand-in-hand.",
      },
      {
        title: "The Cursor → Figma → Cursor Loop",
        text: 'Use Cursor agents to generate HTML documentation pages expressing your design tokens (e.g., "bring in Tailwind amber colors"). Use an HTML-to-Figma plugin to pull these components into Figma. In Figma, refine the visual expression and tokenize elements (e.g., color swatches for amber 100-950). Use Figma MCP to create a link to your refined design. Paste the link in Cursor and instruct the agent to replace the initial documentation with pixel-perfect implementation from your Figma design.',
      },
      {
        title: "Create Your Token Naming Structure",
        text: "Once you have a rough skeleton, document every token in your foundational structure: Base colors → Semantic colors; radius variables (e.g., 0-32); containers, hover states, all foundational elements. Use Claude (or your preferred LLM) to help establish consistent naming conventions. Generate a markdown file containing your complete token naming system.",
      },
      {
        title: "Integrate the Naming System into Your Workflow",
        text: "Add the markdown file to your Cursor project. Paste it into chat and explain your design system structure to the agent. This file becomes your comparison tool and source of truth. As you build components (buttons, inputs, etc.), ensure the code uses accurate token names. Perform code reviews: map each new page against your markdown naming file to catch inconsistencies.",
      },
      {
        title: "Build with Precision",
        text: 'As you add components, make sure token names are embedded in the page construction. This enables precise communication: "Change button radius from radius-sm to radius-md". For complex tokens (e.g., primary button hover states), exact naming lets you communicate changes clearly and accurately.',
      },
    ],
  },
  {
    type: "callouts",
    items: [
      {
        title: "Critical Step",
        text: "Your documentation must show: (1) the visual expression of each token, and (2) the exact naming convention.",
      },
    ],
  },
  {
    type: "prose",
    text: "This documentation becomes your controlled palette: the guardrails that constrain what AI agents can use when generating product flows.",
  },

  // APPROACH 2: EXISTING CODE TOKEN SYSTEM
  {
    type: "heading",
    title: "Approach 2: Existing Code Token System (No Visual Documentation)",
    text: "The Reality: A design token system exists in code, but there's no visual documentation for designers to reference. Designers can't see what tokens exist or how they're expressed visually.",
  },
  { type: "heading", title: "The Workflow" },
  {
    type: "insights",
    items: [
      {
        title: "Extract the Existing Token System",
        text: "Dive into the codebase and pull out all existing design tokens. Document the complete token structure: base colors and semantic colors; typography scales and weights; spacing and radius values; component-specific tokens (buttons, inputs, cards, etc.). Create a comprehensive markdown file listing every token name and its value. This is your learning tool: you're adopting the company's existing naming conventions.",
      },
      {
        title: "Build Visual Documentation Using Existing Tokens",
        text: "Use Cursor agents to generate HTML documentation pages. Critical: Instruct agents to use only the extracted tokens from the existing system. Build documentation pages for each token category (colors, typography, spacing, components). Ensure every visual element displays both the visual expression of the token and the exact token name from the existing system.",
      },
      {
        title: "The Cursor → Figma → Cursor Loop (Learning the System)",
        text: "Use Cursor to express the existing tokens in HTML documentation. Use HTML-to-Figma plugin to pull these documented components into Figma. In Figma, refine the visual presentation (but keep the token names consistent with code). Create color swatches, type specimens, component examples, all labeled with the existing token names. Use Figma MCP to create links to your refined documentation design. Feed these back to Cursor to update the documentation pixel-perfectly.",
      },
      {
        title: "Internalize the Naming Conventions",
        text: "As you document each component, you're learning how the company names things. Your markdown file becomes the bridge between code and visual documentation. Paste this file into Cursor chat as your reference. When building new pages or components, always reference existing token names. Perform code reviews: map your work against the markdown file to ensure you're using company conventions correctly.",
      },
      {
        title: "Document as You Learn",
        text: "Start with foundational tokens (colors, typography, spacing). Move to component tokens (buttons, inputs, cards). Then document complex interactions (hover states, focus states, disabled states). Each documentation page you build teaches you more about the system's logic and naming patterns. The documentation you create becomes the visual reference designers have been missing.",
      },
      {
        title: "Maintain Token Accuracy",
        text: 'Ensure all documentation code uses the actual token names from the codebase. This enables precise communication: "Change the button to use color-primary-600 instead of color-primary-500". As you document more components, you build fluency in the company\'s design language. The visual documentation bridges the gap between what exists in code and what designers need to see.',
      },
    ],
  },
  {
    type: "prose",
    text: "The Key Difference: You're not creating a new system; you're making the existing system visible and learnable. By pulling tokens from code and documenting them visually, you create the missing bridge between engineering and design while adopting the company's established conventions.",
  },

  // THE PAYOFF
  { type: "heading", title: "The Payoff" },
  {
    type: "prose",
    text: "A well-documented design system with accurate token naming allows you to rapidly assemble components when working with AI agents, ensuring consistency and quality while dramatically accelerating development speed. The bidirectional workflow between Figma and code, anchored by your markdown naming system, keeps design and implementation synchronized from day one.",
  },
];

export default function Essay() {
  return (
    <div className="container mx-auto px-5 lg:px-10 pt-5 lg:pt-10 pb-5 lg:pb-20">
      {/* Reading column: breakout figures size against this inline-size container */}
      <div className="mx-auto max-w-2xl [container-type:inline-size]">
        <EditorialBlocks blocks={ESSAY} />

        {/* Outbound links: the essay argues the approach, these show it applied.
            Matches the footer row on Home, Case Study, Skills and Harness. */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <Link as={RouterLink} asProps={{ to: "/case-study" }} className="text-sm">
            The same argument, applied
          </Link>
          <Link as={RouterLink} asProps={{ to: "/harness" }} className="text-sm">
            How the guardrails are enforced
          </Link>
        </div>
      </div>
    </div>
  );
}
