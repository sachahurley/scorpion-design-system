# Scorpion Design System

A lean nine-page portfolio site for the Scorpion Design System: a TUI-inspired, token-based system built with React, TypeScript, and Tailwind CSS. The site runs on a vendored snapshot of the design system and links out to the deployed Storybook for all reference documentation.

## 🎨 What is This?

This is the design system's **portfolio front door**, not its documentation site. Nine pages in three groups:

**Front door**

- `/` - **Home**: hero, three card rows (what's inside, the writing, the system itself)

**The writing**

- `/essay` - **Essay**: "Design Systems for AI-First Product Development"
- `/case-study` - **Case Study**: "Building the Scorpion Design System"

**The demos**

- `/demos/music-player` - **Music Player**: the floating now-playing pattern with a real audio engine
- `/demos/screens` - **Screens**: a working mini-app (sign-in, settings, profile) composed from DS components

**The system itself**

- `/skills` - **Skills**: the named agent workflows that build and maintain scorp-ds
- `/specs` - **Specs**: every component spec, indexed from `docs/specs/*.md` in scorp-ds
- `/harness` - **Harness**: the lint rules, CI workflows, contracts, visual baselines and decision records that make each written rule fail out loud
- `/changelog` - **Changelog**: every pull request merged into scorp-ds, whether it shipped to the sites or stayed in the repo, and the monthly agent-readiness scorecard

Reference documentation (tokens, components, patterns, theming) lives in the deployed Storybook:

**https://sachahurley.github.io/scorp-ds/**

All old documentation routes (`/foundation/*`, `/components/*`, `/tokens/*`, `/patterns/*`) redirect to the pages above. The full documentation site is archived at the `v1-full-docs-site` tag.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173`

4. **Toggle between light and dark themes** using the theme toggle in the header (dark is the default)!

## 📁 Project Structure

```
scorpion-design-system/
├── src/
│   ├── components/
│   │   ├── ui/                  # Vendored DS components (see "Vendored design system")
│   │   ├── docs/                # Panel/PlateChip doc containers
│   │   └── layout/              # TopBar, TopNav (desktop + mobile), Layout
│   ├── pages/
│   │   ├── Home.tsx             # Homepage
│   │   ├── Essay.tsx            # The AI-first design systems essay
│   │   ├── Skills.tsx           # The agent workflows
│   │   ├── Specs.tsx            # The spec index (reads specs-index.json)
│   │   ├── Harness.tsx          # The verification story (reads harness-index.json)
│   │   ├── Changelog.tsx        # Every merged scorp-ds PR + scorecard (reads changelog-index.json)
│   │   ├── patterns/
│   │   │   ├── CaseStudy.tsx    # Building the Scorpion Design System
│   │   │   └── MusicPlayerPattern.tsx  # Live music player demo
│   │   └── demos/
│   │       └── Screens.tsx      # Mini-app screens demo
│   ├── data/                    # GENERATED at vendor time, do not hand-edit
│   │   ├── specs-index.json     # Specs page index
│   │   ├── harness-index.json   # Harness page facts (rules, workflows, counts)
│   │   └── changelog-index.json # Changelog page (merged PRs, readiness scorecard)
│   ├── theme/
│   │   └── ThemeProvider.tsx    # Theme management
│   ├── index.css                # Imports the vendored token CSS variables
│   └── App.tsx                  # Router setup (9 routes + redirects)
├── vendor/scorp-ds/             # Vendored token CSS, Tailwind preset, component catalog
├── scripts/
│   ├── vendor-ds.sh             # Re-vendor / check the DS snapshot
│   ├── gen-specs-index.mjs      # Builds src/data/specs-index.json
│   ├── gen-harness-index.mjs    # Builds src/data/harness-index.json
│   └── gen-changelog-index.mjs  # Builds src/data/changelog-index.json
├── tailwind.config.ts           # Tailwind config using the vendored preset
└── README.md                    # This file!
```

## 🛠 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Type-check and build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Publish `dist/` to GitHub Pages (gh-pages branch, base `/scorpion-design-system/`)
- `npm run ds:check` - Diff the vendored DS snapshot against scorp-ds (includes both generated indexes)
- `npm run vendor:ds` - Re-sync the vendored DS snapshot and regenerate both indexes

### Deployment

The site is a Vite + React Router SPA deployed to GitHub Pages under the base path `/scorpion-design-system/`. CI (`.github/workflows/deploy.yml`) builds and deploys `dist/` to the `gh-pages` branch on every push to main, so merging is deploying. `npm run build` itself creates the `404.html` SPA fallback (a copy of `index.html`), which GitHub Pages needs to serve deep links; every deploy path ships it automatically. For a manual deploy, use `npm run deploy` (`scripts/deploy.sh`), which builds, verifies the fallback, and publishes.

## 🤝 Credits

Built with:
- [Vite](https://vitejs.dev/) - Lightning-fast build tool
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [next-themes](https://github.com/pacocoursey/next-themes) - Theme management
- [Lucide React](https://lucide.dev/) - Icons

---

**Scorpion Design System** - A design system for your next project 🦂

## Vendored design system

This site wears the merged Scorp DS identity as a deliberate snapshot: token
variables and the Tailwind preset live in `vendor/scorp-ds/`, and the files in
`src/components/ui/` are copies of the scorp-ds component sources (with three
mechanical Vite adaptations). It is NOT auto-synced when scorp-ds merges.

- `npm run ds:check`: diff the snapshot against scorp-ds `origin/main`
- `npm run vendor:ds`: re-sync from `origin/main`, then `npm run build`,
  review the diff, and commit

### Generated page data

Three files under `src/data/` are **generated, never hand-edited**. All are
written by `vendor:ds` and diffed by `ds:check`, so a page cannot quietly quote
a number the design system no longer has:

- `specs-index.json` - built by `scripts/gen-specs-index.mjs` from
  `docs/specs/*.md`. Drives the Specs page.
- `harness-index.json` - built by `scripts/gen-harness-index.mjs` from the
  `scorp/*` lint rules, the CI workflows, the decision-record README, the
  insight files, and file counts (components, specs, stories, visual
  baselines, tokens). Drives the Harness page, and the counts on Home.
- `changelog-index.json` - built by `scripts/gen-changelog-index.mjs` from
  scorp-ds main's first-parent history (one entry per merged PR, tagged
  "ships" when it touched `packages/components/src` or `packages/tokens`
  outside tests) and the latest audit comment on scorp-ds issue #136. Drives
  the Changelog page. It needs full history, so `ds:check` in CI checks
  scorp-ds out with `fetch-depth: 0`; the scorecard is read over the GitHub
  API, and an offline run keeps the committed scorecard with a warning.
  Because every scorp-ds merge adds a row, `ds:check` goes red after any merge
  until the next vendor pass, docs-only merges included.

The harness generator fails loudly rather than writing a confident zero: if a
parse finds no lint rules, no baselines or no decision rows, it exits non-zero.

`vendor/scorp-ds/catalog.md` is the scorp-ds component catalog, vendored the same
way (spec links rewritten to GitHub by `scripts/vendor-catalog.sh`) so agents
working here read the reference for the exact DS version in `src/components/ui/`.
`CLAUDE.md` points them at it.

Source checkout: `~/Projects/scorp-ds` (override with `SCORP_DS_DIR`). The
snapshot commit is recorded in `vendor/scorp-ds/VERSION`.
