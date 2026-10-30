# CLAUDE.md

The Scorpion Design System showcase: the portfolio front door for scorp-ds
(https://github.com/sachahurley/scorp-ds), live at
https://sachahurley.github.io/scorpion-design-system/. Nine pages; `README.md`
lists them. Reference documentation lives in the deployed Storybook
(https://sachahurley.github.io/scorp-ds/), not here: do not add reference doc
pages. The generated Specs, Harness and Changelog pages are fine; they are data
pages about the system.

**Merging to `main` deploys.** The Pages workflow builds and publishes on every
push to `main`, so a merge is a release. A change to what the site renders needs
screenshots in both themes before it merges.

## Commands

- `npm run dev`: Vite dev server
- `npm run build`: `tsc -b`, `vite build`, then copies `index.html` to `404.html`
  (the SPA fallback every deep link depends on on GitHub Pages)
- `npm run vendor:ds`: re-vendor scorp-ds `origin/main` (read with git from
  `~/Projects/scorp-ds`, or `SCORP_DS_DIR`; `SCORP_DS_REF` reads another commit)
- `npm run ds:check`: fails when anything vendored or generated differs from
  scorp-ds; CI runs it on every PR, on `main`, and daily
- `npm run lint`: ESLint. Not run in CI and not clean on `main`; keep the files
  you change clean

## To find or use a component, read `vendor/scorp-ds/catalog.md` first

It is the scorp-ds component catalog, vendored with the code: what each
component is for, what to use instead, and every prop with the values it accepts.
It always matches the components in `src/components/ui/`, so do not guess a prop
value it does not list. **Imports differ from the catalog:** there is no package
here, so import each component from its own file:

```tsx
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
```

## Never edit generated or vendored files

`ds:check` fails on any hand edit to these. Change scorp-ds and re-vendor instead.

| Path | What it is |
|---|---|
| `src/components/ui/*` | Every scorp-ds component and layout primitive, with mechanical Vite rewrites (see `scripts/vendor-ds.sh`). Except `MusicPlayer.tsx` |
| `src/lib/*` | The scorp-ds `lib/` helpers. Except `assets.ts` |
| `vendor/scorp-ds/*` | `tokens.css`, the Tailwind preset, `catalog.md`, and `VERSION` (reported by `ds:check`, not diffed) |
| `src/data/*-index.json` | The Specs, Harness and Changelog page data, built by `scripts/gen-*-index.mjs` |

Two deliberate forks are the site's own and are listed by every `ds:check` run:
`src/components/ui/MusicPlayer.tsx` (a real audio engine in the DS pattern shell)
and `src/theme/ThemeProvider.tsx`. Everything else in `src/` (pages, `layout/`,
`docs/`, `LightModeNotice.tsx`, `lib/assets.ts`) is site code you can change.

## Site code follows the scorp-ds rules

Tokens only (no raw hex, sizes or spacing), sharp corners or plate silhouettes,
Fragment Mono throughout, dark as the default theme, 44px touch targets. The rules
and their reasons are in scorp-ds's `CLAUDE.md` and `docs/decisions/`.

## When the DS is the thing that needs to change

Make the change in scorp-ds, not here. Before its PR, scorp-ds's
`npm run consumers:check` builds this site (and the other two consumers) against
the branch. Merge scorp-ds first; the vendor pass that follows every scorp-ds
merge brings it here. Until then this site's `ds-check` is red by design, and
since the Changelog page lists every scorp-ds PR, that includes docs-only merges.
