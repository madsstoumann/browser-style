# Open items — v4 card / layout line

> What is **actually still open**, extracted from the implementation ledger in
> [`2026-07-26-v4-card-system-architecture-analysis.md`](./2026-07-26-v4-card-system-architecture-analysis.md)
> (now an archive — read it for the *why* behind any F-xx/R-xx, not for what to do next).
> Four open items plus one closed decision on record. Each open one is waiting on a
> decision or on coordination, not on typing.
>
> Everything else from that report is implemented and machine-verified: the v5 alias
> batch, R-13 (tokens manifest), R-14 (self arms + the partial style()-flag migration,
> minus the reverted `tnt`/`hov(tint)` — see the archive), R-15 (generated doc tables),
> F-35/36/37, F-38 (`variant="sub"`) and F-40 (marquee furniture) are all done.

---

## 1. F-32 — move the popup escape hatch into the layout package

**Where:** `ui/reveal/ui-reveal.css` (foot of the file)

```css
/* === popup escape hatch — UNLAYERED on purpose: it must beat <lay-out>'s
   containment regardless of stylesheet order. Do not move it into a layer. === */
lay-out:has(ui-reveal[variant~="exp"][variant~="pop"] > details[open]) {
	contain: inline-size;
}
```

A `variant="exp pop"` reveal opens as a `position: fixed` popup and needs its ancestor
`<lay-out>` to release block containment. The rule works, and it is unlayered for a real
reason (it has to beat `@layer layout.*` whatever the link order). The open question is
**ownership**: it selects `lay-out`, so it arguably belongs in layout's own sheet rather
than shipping from the reveal package.

**The call to make.** Moving it buys correct ownership and lets layout keep its own
containment story in one place; it costs a hard dependency in the other direction (layout
would carry a selector naming `ui-reveal`, a component it otherwise knows nothing about),
and the rule would still have to be unlayered inside layout's own file. Decide which
coupling is the lesser one — do not move it silently.

**Related, unfixed by either choice:** `<lay-out-group>` is a query container in its own
right (`container-type: inline-size` implies `contain: layout`), so a popup opened from a
card inside a **group band** is still clipped. Documented as a limitation in
`ui/reveal/readme.md` § Known limitations.

## 2. Downstream: `layoutConfig` → `srcsetConfig` (published-API rename)

**Where:** `content/card/build-layouts-map.js:57` (the generator) and
`content/card/src/js/runtime.js:3` (the consumer)

The layout package renamed its exported flat config (F-35). It now publishes:

```js
// layout/layouts-map.js
export const srcsetConfig = { maxLayoutWidth, breakpoints }
```

`content/card` still generates and imports the **old** name:

```js
// content/card/src/js/runtime.js:3
import { srcsetMap, layoutConfig } from '@browser.style/layout/maps';
```

`@browser.style/layout/maps` resolves to `layout/layouts-map.js`, which no longer exports
`layoutConfig` — so that import is only working because `content/card` currently reads its
own generated copy (`content/card/public/static/js/layouts-map.js:61`, same flat shape,
old name). The moment it resolves against the real package it breaks.

**Coordinate before touching either side.** The fix is small (rename in the generator, in
`runtime.js`'s import and its two `applySrcsets(...)` call sites, then regenerate), but it
changes a *published* API surface.

**Update (2026-08-03) — out of scope, and deliberately kept latent.** `content/card` is
**not** part of this project. It was briefly pulled in as a workspace member by a
`content/*` glob in the root `workspaces` array; that glob has been **removed**, so
`content/card` no longer symlinks into `node_modules/@browser.style`, no longer joins
`npm run build --workspaces`, and no longer drags puppeteer/express/compression into the
root install. It stays on disk, untouched and buildable on its own.

Consequence for this item: the bare specifier `@browser.style/layout/maps` still cannot
resolve from `content/card`, so the missing `layoutConfig` export stays latent — exactly
as before. **The item is not fixed, only quarantined.** Anyone who re-adds `content/*` to
the workspaces array, or installs `@browser.style/layout` into `content/card` directly,
makes it live immediately.

**Do not conflate the two `layoutConfig`s.** The name is also used, for a completely
different and **nested** shape, by `layout/src/components/composer/index.js:2`, which
imports `layout.config.json` wholesale. That one is legacy precursor code — leave it alone.

## 3. Publish dry-run (`npm pack`)

`layout/package.json` has had a real entry point since F-35 (`layout/index.js`: Node-safe
srcset/map API plus a browser-only `registerLayOut()`), but **no package on this branch has
been through a publish dry-run**. Nothing has verified that the `files` / `exports` maps
actually ship what consumers import — the card package in particular publishes `render.js`
together with `data/`, and the layout package's `./maps` subpath export is exactly what
item 2 above depends on.

Run `npm pack --dry-run` per package and read the file list before any v4 publish. Cheap;
just not done yet.

**Update (2026-08-03) — partly addressed.** The card/reveal/base/carousel packages were
audited and repaired (`2026-08-03-card-system-structure-decision.md`, work item B): the
card tarball was missing `media.lightbox.css` while `ui-card.css` `@import`ed it, so the
published CSS chain 404'd; `lightbox.js` shipped but was blocked by `exports`; `ui/reveal`
peer-depended on an unsatisfiable `icon ^1.0.11`. A dry-run gate is still worth running
across **every** package — only the card orbit has been checked.

## 4. Design call — per-element axis maps for `pll` / `non`

**Where:** `ui/card/data/tokens.json` (the `disc` merge class), surfaced by R-13's manifest
extraction

One merge class, several element meanings. `pll` and `non` are both filed under the
furniture `disc` axis, but they do not mean the same thing everywhere:

| Spelling | Where | Means |
|---|---|---|
| `chip(pll)` `sticker(pll)` `beacon(pll)` `play(pll)` `marquee(pll)` | furniture `disc` axis | pill-shaped (a corner/shape value) |
| `mrk(pll)` | carousel markers | the **pill timer bar** — a different widget, not a shape |
| `chip(non)` … | furniture `disc` axis | no disc |
| `mrk(non)` / `nav(non)` | carousel | no markers / no controls |
| `rds(non)` | `variant=` / `media=` / `content=` | zero radius |

Because they share one merge class, the renderer's same-axis merge treats them as
interchangeable when they are not. Nothing is broken today — the CSS selectors are
substring matches per stem, so each spelling hits the right rule — but the manifest is
describing the vocabulary less precisely than it describes everything else.

**The call to make:** either give the affected stems per-element axis maps (accurate,
more manifest surface), or accept one shared class and document the collision in the
manifest `notes` (cheaper, keeps the merge table small). This was one of three design
calls surfaced by the R-13 extraction; the other two — `bdr` on `<ui-reveal>` painting on
`> details`, and group-header base sizes riding the responsive `scl()` ladder — were both
resolved in the 2026-07-27 closeout round. This one was not.

## 5. Closed — `<ui-content>` → `<ui-text>` rename (decided against, 2026-08-03)

Recorded so it is not rediscovered as an open question. The proposal was to rename
`<ui-content>` (the text area) to `<ui-text>`, recycle `<ui-content>` for the host, move
the system to a root `content/` project, and split the primitives into `ui/media` +
`ui/text`. **All four parts were rejected.** Full reasoning and the measurements:
`docs/plans/2026-08-03-card-system-structure-decision.md`.

The short version, with the numbers that decided it:

- **Recycling the name** is the highest-risk rename class: old markup stays *valid* but
  means something else. ~6,470 edits across 122 files, ~60 of which fail **silently** —
  6 `matches('ui-card, ui-reveal')` selectors, 3 `preset.element ===` branches, 41
  `render.js` tag literals, 4 schema enum values plus `"default": "ui-card"`.
- **`content=` → `text=` is blocked outright.** `preset.text` already exists
  (`card-preset.schema.json`, title "Text mode", `summary|body|both`, read at two sites
  in `render.js`). Renaming would require migrating every stored preset first.
- **Root `content/` is occupied** by `@browser.style/content-card@1.0.1` — a v1 library
  of 25 registered autonomous elements sharing *zero* code with `ui/card`.
- **The standalone rename** (`<ui-content>` → `<ui-text>`, keeping `<ui-card>`) is
  coherent and one-directional, but ~3,900 edits and a major version to buy a nicer word
  while nothing else in the system wants the name.

**What would reopen it:** a second host that composes media + text but is not a card.
`<ui-reveal>` is not one — it *is* a card plus a flipside, which is why it builds on the
card engine rather than competing with it.

Taken instead: the documentation pass (one vocabulary — *text area / text column*; the
altitude stated once in `ui/card/AGENTS.md`; the editor-facing label in
`card-preset.schema.json`), and the packaging repair that the investigation surfaced as
the actual defect — see the same plan, work items B-F.
