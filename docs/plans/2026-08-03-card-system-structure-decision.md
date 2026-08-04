# Card system: naming decision + packaging repair

## Context

Open question from `ui/card/structure_change.md`: the original two concepts were
*lay-out* and *content*; `/content` became `ui/card`, and the host is now
`<ui-card>` with `<ui-media>` + `<ui-content>` beneath it. Proposal on the table
was to rename `<ui-content>` → `<ui-text>`, recycle `<ui-content>` for the host,
move the whole thing to a root `content/` project, and split the primitives into
`ui/media` + `ui/text`.

Investigation found the naming is **not** where the damage is. The packaging is.
`@browser.style/card` ships a broken tarball today. This plan records the naming
decision (so it is not re-litigated) and fixes the packaging.

---

## Decision 1 — naming stays; documentation changes

**`<ui-card>` keeps its name. `<ui-content>` keeps its name. No DOM rename.**

Rationale: `<ui-content>` is not ambiguous *in the system* — it has exactly one
meaning (the text area) and never denotes the whole card. The ambiguity is in
English: a newcomer reads "content" and expects the container. That is a
learnability cost, not a correctness cost.

The recycling half of the proposal was the real hazard and is rejected outright:
renaming `<ui-card>` → `<ui-content>` leaves old markup **valid but meaning
something else**, and forces a two-phase sentinel rename of 1,673
`--ui-content-*` alongside 383 `--ui-card-*`. Blast radius measured at ~6,470
edits across 122 files, ~60 of which fail silently (6 `matches('ui-card,
ui-reveal')` selectors, 3 `preset.element ===` branches, 41 `render.js` tag
literals, 4 schema enum values plus `"default": "ui-card"`). It is additionally
blocked as specified: `content=` → `text=` collides with the existing
`preset.text` field (`card-preset.schema.json:112-124`, read at `render.js:987,1002`).

The standalone `<ui-content>` → `<ui-text>` rename (keeping `<ui-card>`) is
coherent and one-directional, but costs ~3,900 edits and a major version to buy a
nicer word. Not worth it while nothing else needs the name.

**What would reverse this:** a second host that composes media + text but is not a
card. There isn't one — `<ui-reveal>` *is* a card plus a flipside, which is why it
imports the card engine rather than competing with it.

### Work item A — the documentation pass (~15 sites)

1. **One word for one thing.** Docs currently alternate between "content column"
   and "text column". Standardise on **text area / text column** everywhere:
   `ui/card/AGENTS.md`, `readme.md`, `card.md`, `content.md`, `typography.md`,
   the `content.css` / `content.typography.css` file headers, and the
   `"description"` strings in `cms/baseline/models/card-preset.schema.json` +
   `card.schema.json`.
2. **State the altitude once, at the top**, where the three DSLs are introduced
   (`ui/card/AGENTS.md`, `ui/card/readme.md`): `<ui-card>` is the host; its two
   areas are the **media area** (`<ui-media>`, `media=`) and the **text area**
   (`<ui-content>`, `content=`). "Content" names the text area, not the card.
3. **Fix the one editor-facing leak.** `cms/baseline/models/card-preset.schema.json:77-80`
   offers `ui-content` labelled `"<ui-content> (bare content column)"` — a
   standalone element called "content" that refuses media is exactly where the
   word misleads. Relabel: `"<ui-content> — text column only, no media"`.
4. Record the rejected rename in `docs/plans/open-items.md` with its blast radius,
   so the decision is available rather than lost.

---

## Decision 2 — repair the packaging

### Work item B — publish defects (bugs, not refactors)

| # | Defect | Evidence |
|---|---|---|
| B1 | `media.lightbox.css` is `@import`ed but **absent from the tarball** — the published `index.css` chain 404s | `ui/card/ui-card.css:13` imports it; `ui/card/package.json` `files` (lines 33-56) omits it |
| B2 | `lightbox.js` ships in `files` but is **blocked by `exports`** — consumers cannot `import '@browser.style/card/lightbox.js'` | `ui/card/package.json` `exports` has no `./lightbox.js` |
| B3 | `lightbox.js` imports `../common/command.js` — a path that **does not exist in the tarball**; `@browser.style/common` is not a declared peer (it already is one for `ui/play` and `ui/lightbox`) | `ui/card/lightbox.js:41` |
| B4 | `lightbox.js` dynamically imports `../../polyfill/carousel-controls.js` — escapes the package root into a folder that is **not a workspace package at all**. Cannot survive `npm publish` | `ui/card/lightbox.js:284` — resolved by work item C |
| B5 | `ui/card` styles seven furniture elements but declares **no peerDependency** on any of them | `media.css`, `media.carousel.css`, `media.lightbox.css`, `media.video.css` carry `ui-chip`/`ui-sticker`/`ui-beacon`/`ui-save`/`ui-play`/`ui-lightbox`/`ui-marquee` selectors; `package.json:78-80` lists only `base`. Declare as **optional** peers (`peerDependenciesMeta`) — the CSS degrades cleanly when an element is absent |
| B6 | `ui/reveal` `@import`s **relative filesystem paths** that resolve only by monorepo directory accident | `ui/reveal/ui-reveal.css:8-9` — `'../card/ui-card.css'`, `'../icon/index.css'`. Both targets are already valid export subpaths; switch to package specifiers |
| B7 | `ui/reveal` peer-depends on **`@browser.style/icon: ^1.0.11`** — unsatisfiable, icon is at `4.0.0` | `ui/reveal/package.json` vs `ui/icon/package.json` |
| B8 | Dead workspace symlinks + leftovers | `node_modules/@browser.style/{layout,content-card,baseline}` point at `ui/layout` (empty stub), `ui/content-card` (untracked duplicate of `content/card`), and a nonexistent `baseline`. No symlink exists for `card`, `reveal`, or any furniture package |
| B9 | Doc drift found while auditing | `docs/plans/open-items.md:70` says "`content/card` is not a workspace member" — false since the root `content/*` glob was added |
| B10 | Two orphan directories with **no `package.json`** | `ui/gradient-text` (but used live in `ui/card/media.furniture.html`) and `ui/carousel` (legacy stub: `index.html` + `ui-carousel.css`). Decide per directory: package it or archive it. `ui/carousel` must be resolved before work item C claims the path |

### Work item C — extract the carousel engine

> **Update 2026-08-04 — the title overstates what shipped.** Only the *controls*
> moved (`carousel.css` + polyfill). The **engine** — `ui/card/carousel.js`: loop
> clones, autoplay, `scanCarousels` — is still a card module, so the polyfill waits
> on card's idle scan for `[data-clone]` slides, `carousel-controls.js` keeps a
> lint-guarded verbatim copy of four `shared.js` primitives, and `layout` still
> peer-depends on the whole of `@browser.style/card` for that one file. Finish-the-job
> proposal + costs: [`open-items.md` §6](./open-items.md).

`ui/base/carousel.css` is **65.7 KB — the largest file in the system** — and
selects `:where(ui-card, ui-reveal, ui-media, lay-out[overflow])`
(`ui/base/carousel.css:8`). Its own header points at `ui/card/media.carousel.md`
for documentation. The lowest package in the stack hardcodes three higher-level
components, and every consumer of the base barrel — including someone who only
wanted `ui/button` — pulls the whole card carousel.

**New package `@browser.style/carousel` at `ui/carousel/`** (resolve the legacy
stub first, B10). Moves in:

- `ui/base/carousel.css` → `ui/carousel/carousel.css` (65.7 KB)
- `polyfill/carousel.css` (36.9 KB), `polyfill/carousel.js`,
  `polyfill/carousel-controls.js`, `polyfill/readme.md` → `ui/carousel/polyfill/`

Consequences:

- Drop `@import './carousel.css';` from `ui/base/index.css:12`.
- Add `@browser.style/carousel` as a peer of `card`, `reveal` and `layout`.
- `ui/card/lightbox.js:284` becomes a package specifier — **this closes B4**.
- Update `<link>`/import paths in `ui/card/media.carousel.html`,
  `media.carousel.builder.html`, `media.lightbox.html`, `layout/src/pages/carousel.html`,
  `layout/dist/carousel.html`.
- **`ui/card/tokens.lint.js`**: its `SHEETS` list includes `ui/base/carousel.css`,
  and its NOT_SLIDE mirror check reads `polyfill/carousel-controls.js`. Both paths
  change — the lint fails loudly if missed, which is the desired behaviour.
- Docs: `ui/card/media.carousel.md`, `carousel.md`, `ui/card/AGENTS.md`,
  `layout/AGENTS.md`, `docs/session-start.md`, `ui/base/AGENTS.md`.

**Also partially resolves the deferred `layout+base double-load` item** — pages
loading both `base` and `layout.css` currently ship carousel/animations/stagger
twice (~13 KB gzip). This removes the carousel third of that duplication.

**Cascade risk to verify, not assume:** `carousel.css` lives in `@layer
bs-component`. Layer order is fixed by first appearance across all sheets, so
pulling the file out of the base barrel changes *load* order. Confirm the layer
sort is unchanged in a browser before calling this done.

### Work item D — declare layout's real dependency

`layout/package.json` declares **zero** dependencies, yet:

- `layout/core/base.css:357-364` (built into `layout/dist/layout.css:361-367`)
  reads `--ui-carousel-controls-bg`, `--ui-carousel-below-gap`,
  `--ui-carousel-band`, `--ui-carousel-above-gap` — all defined in the carousel
  sheet — with **hand-synced hardcoded fallbacks** (`0.5rem`, `2.75rem`).
- `layout/core/animations.css:5-16` records that the `[animate]`/`[animate-self]`/
  `[easing]` engine and the `@keyframes` library moved into `@browser.style/base`,
  and that layout's `stack(reveal)` override wins **by declaration order**.

So the dependency noted in `structure_change.md` ("layout … with dependencies on
ui/base") is real and currently invisible to npm. Add
`@browser.style/base` + `@browser.style/carousel` as peerDependencies, and
document the custom-property contract and the load-order requirement in
`layout/AGENTS.md` § Browser quirks.

### Work item E — package layout: move demos and docs out of the root

`ls ui/card` is **72 entries**. CSS is only 12 of them — grouping the CSS into
`media/` + `content/` was considered and **rejected**: the files are already
namespaced `media.*` / `content.*`, so nesting swaps `.` for `/` while breaking 4
declared export subpaths (`./ui-card.css` is public), 7 `@import`s, ~25 demo
`<link>`s, reveal's cross-package import, `tokens.lint.js`'s `SHEETS` list and
every `sources` ref in `tokens.json`. The clutter is demos and docs, not CSS.

```
ui/card/demo/   21 *.html + articles/ vimeo-data/ youtube-data/ 39018.jpg (481 KB)
ui/card/docs/   ~12 *.md   (readme.md, AGENTS.md, CLAUDE.md stay at root)
```

Root drops 72 → ~23 entries. **No published path changes** except `tokens.md`
(the one doc in `files` → becomes `docs/tokens.md`). Also touched:

- `tokens.build.js` `DOC_DIRS = ['ui/card/', 'ui/reveal/']` — the marker-injection
  scan. Miss this and the 16 `<!-- tokens:… -->` tables silently stop updating.
- ~25 demo pages rewrite their relative `<link>`/`<script>` paths (`./media.css`
  → `../media.css`).
- `render.snapshot.js` and the `render.html` driver's data paths.
- Doc cross-links: the doc map in `ui/card/AGENTS.md`, `docs/session-start.md`,
  `layout/docs/card-integration.md`.
- Delete `ui/card/structure_change.md` once this plan supersedes it.

### Work item F — CSS bundles (for the import waterfall, not the bytes)

Minification is the consumer's job; the **import graph is ours**. Today:

```
<link href="index.css"> → ui-card.css → { 7 sheets }        3 sequential round trips
<link href="reveal/index.css"> → ui-reveal.css → ../card/ui-card.css → { 7 }   4
<link href="base/index.css"> → { 15 sheets }                2
```

`@import` targets are discovered only after the parent sheet parses, so they
cannot be preloaded and no consumer-side minifier fixes it. Bundler users are
unaffected; `<link>` users — including browser.style itself and all 21 demo
pages — eat the waterfall.

**Do not copy layout's build.** Layout's is a *generator* (`build:maps`,
`build:demo`, `build:icons` — JSON → CSS). This is a *bundler*, one entry per
package. `ui/card/build.js` already shells esbuild and prints a gzip/brotli size
table; esbuild bundles CSS natively, so no postcss is needed.

Scope: `card`, `base`, `reveal`, and the new `carousel` package from work item C.
`ui/base` has **no `scripts` block at all** today and needs one.

**The load-bearing constraint — bundles are peer-exclusive.** Each `dist/*.css`
contains **only its own package's CSS**. After defect B6 makes reveal's import a
package specifier, a naive `--bundle` would inline the entire card engine into
reveal's dist, so a page loading both ships it twice — the same class of bug as
the already-deferred base/layout double-load. Consumers using `<link>` load one
tag per package in dependency order:

```html
<link rel="stylesheet" href="…/base/dist/base.min.css">
<link rel="stylesheet" href="…/carousel/dist/carousel.min.css">
<link rel="stylesheet" href="…/card/dist/card.min.css">
<link rel="stylesheet" href="…/reveal/dist/reveal.min.css">
```

Four requests, all **parallel** — versus 3-4 *sequential* round trips today. That
is the whole win; the byte savings are incidental.

Per package: emit `dist/<name>.css` + `dist/<name>.min.css`, point `style` and
`exports["."]` at the bundle, **keep every source subpath exported** so
cherry-picking and comments survive untouched, and add `dist/` to `files`.

### Sequencing

`B → C → E → F`. B fixes `files`/`exports` before F rewrites them; C moves files
before E moves them again; F must run last because it depends on the final
`@import` graph (B6's package specifier is precisely what must not be inlined).

---

## Explicitly NOT doing (decided — do not re-open without new information)

- **Recycling `<ui-content>` for the host.** ~6,470 edits, ~60 silent-failure
  sites, and `content=` → `text=` collides with `preset.text`.
- **Relocating to a root `content/` project.** The path is occupied by
  `@browser.style/content-card@1.0.1` — a *v1* library of 25 registered autonomous
  elements (`content/card/src/js/base/BaseCard.js` + 25 CSS files) that shares
  **zero code** with `ui/card`. Taking the name means migrating or deleting a
  published package for a cosmetic gain.
- **Grouping the CSS into `ui/card/media/` + `ui/card/content/`.** The `media.*` /
  `content.*` prefix already carries that grouping; nesting rewrites four public
  export subpaths to swap a separator. See work item E for what actually clutters
  the directory.
- **Splitting into `ui/media` + `ui/text` packages.** The files divide cleanly
  (media 75.7 KB / 7 CSS + 6 JS; text 51.1 KB / 2 CSS + zero JS; host 30.6 KB),
  but one 116 KB token manifest feeds all three DSLs, `content.typography.css`'s
  source order relative to `ui-card.css` is load-bearing (`ui-card.css:155-156`),
  `render.js` emits host+media+text in a single pass, and the `bs-card`
  container-query contract would become a cross-package promise nothing can
  enforce. It multiplies exactly the version-lockstep problem that already
  produced B7.

---

## Verification

1. **Tarball gate (the point of work item B).** `npm pack --dry-run` in
   `ui/card`, `ui/reveal`, `ui/carousel`; assert `media.lightbox.css` is present
   and that **every `@import` target in every shipped sheet resolves inside the
   tarball**. Then install the packed tarballs into a scratch directory outside
   the monorepo and load a page — that is the only test that catches B3/B4/B6,
   because all four defects work fine in-repo.
2. **Tokens:** `node ui/card/tokens.build.js` twice (second run must be a no-op)
   then `node ui/card/tokens.lint.js` — the `SHEETS` and NOT_SLIDE-mirror paths
   changed in C, so a clean run is meaningful here.
3. **SSR snapshot:** `node ui/card/render.snapshot.js . /tmp/before.txt` before,
   re-run after, `cmp`. Nothing in this plan touches the renderer — output must be
   **byte-identical**. Any diff is a bug.
4. **Browser, cascade order (work item C's real risk).** Serve the repo and drive
   Chromium via playwright-core with `executablePath: '/opt/pw-browsers/chromium'`
   (never `playwright install`). Load `ui/card/media.carousel.html`,
   `ui/card/media.lightbox.html`, `layout/dist/carousel.html`; compare computed
   styles on a carousel arrow and a dot against a pre-change capture. Console
   clean on each.
5. **Safari polyfill path:** `ui/card/media.lightbox.html` — confirm the popover
   carousel still builds its DOM controls after `lightbox.js`'s dynamic import
   path changed.
6. **Workspace health:** `npm install` from root, then confirm
   `node_modules/@browser.style/` contains live symlinks for every workspace
   package and no dead ones.
7. **Bundle exclusivity (work item F's real risk).** Grep each emitted
   `dist/*.css` for a selector that belongs to a *different* package —
   `dist/reveal.css` must contain no `ui-media` rule, `dist/card.css` no
   `::scroll-marker-group`, `dist/base.css` no `ui-card`. Any hit means a peer
   got inlined and pages loading both will double-ship it.
8. **Bundle equivalence.** For each package, load the source `@import` chain and
   the `dist` bundle in two tabs and diff computed styles on a representative
   element. `@layer` order is set by first appearance — bundling changes source
   order, so this is where a cascade regression would surface.
9. **Docs generation after the move (work item E).** Re-run
   `node ui/card/tokens.build.js` twice and confirm the 16 `<!-- tokens:… -->`
   marker tables still update at their new `docs/` paths — a stale `DOC_DIRS`
   fails silently, producing no error and no update.
