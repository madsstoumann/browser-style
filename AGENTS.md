# Browser Style — project architecture

**Browser Style** is a CSS-first component library and design system built on native browser
capabilities: design tokens, container queries, cascade layers, light-DOM custom elements.

**Repository:** https://github.com/madsstoumann/browser-style
**Homepage:** https://browser.style/ · **v4 preview:** https://v4.browser.style/
**Package scope:** `@browser.style/*`

> **v4 is the current line, and it is what you should be writing.** The operational
> guide — reading order, gates, sharp edges — is `docs/v4.md`, auto-loaded alongside
> this file. Pre-v4 code still sits on disk; see § Legacy at the bottom and never
> pattern-match from it.

## Project structure

```
browser-style/
├── package.json          Workspace root (npm workspaces)
├── ui/                   Component packages (45 published, ~194 dirs incl. unconverted)
│   ├── base/             @browser.style/base — tokens, reset, animation + stagger engines
│   ├── card/             @browser.style/card — THE card/content system (<ui-card>/<ui-media>/<ui-content>)
│   ├── carousel/         @browser.style/carousel — scroll-marker controls + Safari polyfill
│   ├── reveal/           @browser.style/reveal — <ui-reveal>, the second card host
│   └── [component]/      Leaf packages (chip, sticker, avatar, accordion, …)
├── layout/               @browser.style/layout — <lay-out>, builder-generated grid CSS
├── apps/                 Standalone apps, games & tools (not npm packages)
│   ├── games/  science/  media/  music/  utilities/
├── cms/
│   ├── baseline/         @browser.style/baseline — content models (UCM) + instances (UCF)
│   ├── editors/          CMS field editor components (@browser.style/editor-*)
│   └── integrations/     CMS platform wrappers (Contentful, Umbraco, …)
├── scripts/              Build, bundle, hash and publish utilities
├── dist/                 Site-only demo CSS bundle (content-hashed)
└── docs/                 v4.md, guide.md, performance.md, token-comparison.md, plans/
```

## Architecture principles

- **CSS-first** — native features (custom properties, container queries, cascade layers,
  `@property`, scroll-driven animation) over JavaScript. JS is progressive enhancement.
- **Light DOM, no Shadow DOM** — v4 elements are unregistered or lightly-registered custom
  elements styled by attribute selectors, so page CSS and frameworks reach them.
- **Token DSLs on attributes** — behaviour is selected by tokens (`variant="col lg:row"`,
  `media="asr(16/9) chip(ts)"`, `content="hl(lg) pad(md)"`, `lg="grid(3a) cg(sm)"`), not by
  class combinations.
- **Zero-specificity selectors** — `:where()` throughout, so consumers override without
  specificity wars.
- **Monorepo** — npm workspaces, independent versioning, published to the public registry.

## The v4 systems

| System | Path | Read |
|---|---|---|
| Design tokens & base | `ui/base/` | `DESIGN.md` (token reference) |
| Card / content system | `ui/card/` | `ui/card/AGENTS.md` (the master map) |
| Layout system | `layout/` | `layout/AGENTS.md` |
| Carousel controls | `ui/carousel/` | `ui/carousel/readme.md`, `polyfill/readme.md` |
| Reveal (second host) | `ui/reveal/` | `ui/reveal/readme.md` |
| Content models | `cms/baseline/` | `cms/baseline/CLAUDE.md`, `pages/UCM.md`, `pages/UCF.md` |

`@browser.style/base` is a **required peer of everything** — it owns the global tokens, the
`[animate]`/`[animate-self]` engine, the stagger engine and the scroll-fade engine. Load it
first; the other packages assume it.

**Peer-exclusive bundles.** Four packages ship a `dist/` bundle — `ui/base`, `ui/card`,
`ui/carousel`, `ui/reveal`. A bundle contains only its own package's CSS, so pages load one
`<link>` per package in dependency order (base → carousel → card → reveal) and the requests
parallelise. `scripts/css-bundle.js` fails the build if a package inlines a foreign sheet.
Leaf packages ship `index.css` + `ui-<name>.css` with no bundle.

## Key docs & skills

| Doc | What it carries |
|---|---|
| `docs/v4.md` | **Auto-loaded.** Reading order, load-bearing facts, the verification gates, sharp edges |
| `DESIGN.md` | The design-token reference — every global token family |
| `docs/guide.md` | Narrative guide: card → section → page |
| `docs/performance.md` | CPU/GPU policy, `will-change` rules, measured animation costs |
| `docs/token-comparison.md` | Naming rationale vs Tailwind v4 / Open Props |
| `docs/plans/open-items.md` | The one live backlog (implemented plans are deleted, not archived) |

**Skills live in `.claude/skills/`** — invoke them instead of reconstructing a procedure:
`add-layout`, `build-layout`, `create-layout`, `add-card`, `add-card-token`, `add-schema`,
`build-demo`, `demo-css`, `perf-pass`, `convert-to-v4`.

## Development

**Run these from the repo root** — they are root-`package.json` scripts, and from a package
directory npm reports `Missing script`.

```bash
npm run build            # build --workspaces (base, card, carousel, reveal, layout)
npm run test             # test --workspaces --if-present (ui/card is the real suite)
npm run build:demo       # ui/card/build.js + demo CSS bundle + polyfill inlining
npm run build:demo-css   # bundle ui/card/demo/demo.css -> /dist/demo.<hash>.min.css
npm run dev:demo         # watch mode for the demo bundle (no re-hashing) — see `demo-css` skill
npm run version-all      # npm version patch --workspaces + peer-dep sync
npm run publish-all      # scripts/publish.js (prompts for OTP)
npm run update-peers     # scripts/update-peer-deps.js
```

Package-local gates that the root does **not** reach (run them from the repo root):

```bash
node ui/card/tokens.build.js && node ui/card/tokens.lint.js   # token manifest ↔ CSS sync
node --test ui/card/render.test.js                            # renderer suite
node ui/card/schema.compare.js                                # renderer ↔ demo/schema.html
cd layout && npm run build:all                                # CSS + maps + demos + icons
```

**Workspaces:** `ui/*`, `layout`, `ui/weather/*`, `ui/gui/*`, `ui/data/*`, `ui/charts/*`,
`ui/design-tokens/*`, `cms/baseline`, `cms/editors/*`.

## Component categories (`ui/`)

| Category | Examples |
|----------|----------|
| **Card system** | card, carousel, reveal + furniture: chip, sticker, beacon, save, play, lightbox, marquee |
| **Content sub-components** | accordion, avatar, badge, breadcrumbs, button-group, gradient-text, highlight, icon, progress, quote, rating, timeline |
| **Form controls** | checkbox, radio, select, range, input-button |
| **Data** (`ui/data/`) | grid, entry, mapper |
| **Charts** (`ui/charts/`) | chart + demo pages |
| **Navigation** | nav-compass, tabs, menu |
| **Design tokens** (`ui/design-tokens/`) | core, editors, styles, utils |
| **Weather** (`ui/weather/`) | widget, overview, forecast-*, feelslike |
| **GUI** (`ui/gui/`) | app, control, group, panel, tabs, icon, icon-button |
| **CMS editors** (`cms/editors/`) | editor-card, editor-csp, editor-manifest |
| **Interactive** | piano-keys, rich-text, xy, color-picker, color-palette |

A `ui/` directory is only a package if it has a `package.json` — 45 of ~194 do. The rest are
unconverted v3 components (see § Legacy) or docs-only folders.

## v4 component conventions

1. **Light DOM only** — no Shadow DOM, no `attachShadow`. Style with attribute selectors.
2. **`@layer bs-component`** for component CSS; `@layer layout.*` for layout CSS
   (layout.* outranks bs-component by declaration order — deliberate).
3. **`:where()`** for zero specificity.
4. **Tokens** — `--ui-{component}-{property}`, resolving to the global tokens in
   `ui/base/tokens.css`. No hardcoded fallbacks for global tokens (base is a required peer).
5. **Attributes over classes** — `variant=` / `media=` / `content=` / `theme=` token strings.
6. **`theme=`** — the shared nine-hue axis (red orange green blue accent black white gray
   slate) with `pale`/`muted` modifiers, from `ui/base/theme.css`.
7. **Events** — custom events with `bubbles: true, composed: true`.
8. **Naming** — kebab-case elements, camelCase JS, lowercase `readme.md` / uppercase
   `AGENTS.md` per package.
9. **Security** — never `innerHTML` with attribute or user data; `createElement` +
   `textContent`. Scope queries with `:scope >` or iterate `this.children`.
10. **CSS comments are one-line markers** — prose belongs in the markdown docs (`docs/v4.md`
    § Working discipline).

Converting an old component? Use the **`convert-to-v4`** skill.

## Documentation conventions

- Public API per package: `ui/<component>/readme.md` (lowercase).
- Internal architecture: `ui/<component>/AGENTS.md`, imported by a one-line `CLAUDE.md`.
- Generated docs are marked as such (`ui/card/docs/tokens.md`, the marker-injected
  `<!-- tokens:… -->` tables) — never hand-edit them; edit `ui/card/data/tokens.json`
  and rebuild.

## Legacy (v3 and earlier) — do not pattern-match

These exist on disk for reference or because something still links them. They use PascalCase
custom properties, Shadow DOM, class-based variants, or pre-v4 attributes. Do not copy their
patterns, and do not treat them as part of the system:

| Path | What it is |
|---|---|
| `content/` | The pre-v4 `<content-card>` line (`@browser.style/content-card` 1.0.1). **Not a workspace member.** The content system is now `ui/card`. |
| `ui/card_v1/` | The first card engine |
| `ui/card-expand/`, `ui/card-flip/`, `ui/product-card/` | Superseded by `ui/card` variants + `ui/reveal` |
| `layout/src/components/composer/` | Visual layout composer emitting pre-v4 attributes |
| `_v1/`, `_v2/`, `_tmp/` | Snapshots and scratch |

Unconverted `ui/*` folders without a `package.json` are v3 components awaiting the
`convert-to-v4` skill — usable as *input* to a conversion, never as a style reference.
