# Open items — v4 card / layout line

> What is **actually still open**, extracted from the implementation ledger in
> [`2026-07-26-v4-card-system-architecture-analysis.md`](./2026-07-26-v4-card-system-architecture-analysis.md)
> (now an archive — read it for the *why* behind any F-xx/R-xx, not for what to do next).
> Seven open items plus one closed decision on record. Each open one is waiting on a
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

## 5. `stagger=` never fires in RTL — the view-timeline adapter only

**Where:** `ui/base/stagger.css`, the scroll-driven view-timeline adapter (third of the
three; see the file header). Repro: `ui/card/demo/media.carousel.html` § *Carousels in
`<lay-out>`* with `dir="rtl"` on `<html>`.

```html
<lay-out class="reveal-cards" md="columns(2)" lg="columns(3)"
         overflow media="nav(blw) arw(bare) pages" stagger="rise">
```

Under `dir="rtl"` every card stays at the keyframe start — `opacity: 0`,
`translate: 0 80px` — so the section renders as a blank band. The cards are **there**
and correct (326×434, right-to-left order, `scrollWidth` 3059 > `clientWidth` 1009, snap
and controls all fine); they simply never animate in.

**Cause: Chromium misreports view-progress on an RTL horizontal scroller.** Slides that
are *already in view at rest* are treated as "not yet entered" and sit at 0% progress
forever. Scroll the carousel and the slides arriving from the far side animate in
normally (measured 0.988) while the initially-visible ones stay at 0. Confirmed
Chromium 151.

**Not the axis keyword and not the range.** `view(inline)`, `view(x)` and an explicit
`animation-range: entry 0% cover 30%` all fail identically in RTL and all work in LTR.
The timeline is UA-computed, so there is no CSS lever left.

**Exactly one adapter is affected.** Sweeping all 13 stagger hosts on that page under
`dir="rtl"`:

| adapter | `animation-timeline` | RTL |
|---|---|---|
| `media="… stagger"` — snap-carousel scroll-state (6 carousels) | `auto` | works |
| `<lay-out>` block stagger (5 instances) | `auto` | works |
| **`stagger=` attribute — scroll-driven view timeline (1)** | `view(inline)` | **broken** |

**Pre-existing, not a regression.** Byte-identical at `94d7fa4f`, i.e. before the
2026-08-04 logical-position work — that round is what surfaced it, by adding the first
RTL demo. It is *not* a position-grid or carousel-control bug: those all mirror
correctly on the same page.

**The call to make.** Either (a) give this adapter an IntersectionObserver fallback that
marks in-view subjects done — reintroduces JS into a CSS-only engine, and stagger is
deliberately progressive-enhancement; (b) drop the view timeline for inline-axis
scrollers and route `stagger=` on a `<lay-out overflow>` through the same scroll-state
adapter the `media=` token already uses in RTL, which is the one that demonstrably
works; or (c) accept it, document `stagger=` as LTR-only on horizontal scrollers, and
wait for the engine. (b) looks cheapest and keeps the no-JS contract — it needs someone
to confirm the two adapters produce the same visual result.

## 6. `carousel.js` still lives in `ui/card` — work item C left half-done

**Where:** `ui/card/carousel.js` + `ui/card/shared.js` vs `ui/carousel/`

Work item C (`2026-08-03-card-system-structure-decision.md`) extracted the carousel
**controls** — `ui/base/carousel.css` plus the polyfill — into `@browser.style/carousel`.
The **engine** stayed behind: `carousel.js` (seamless-loop clones, autoplay,
`initCarousels`/`scanCarousels`, `CAROUSEL_SEL`) is still a card module, even though its
selectors treat `lay-out[overflow]` as a first-class host alongside `ui-media`. Three
consequences, all measured 2026-08-04:

**The dependency is inverted at runtime.** `ui/carousel/polyfill/carousel-controls.js:231-235`
does not create clones — it *waits* for card's idle scan to produce them:

```js
// loop carousels get [data-clone] slides from the core's idle scan; wait for them (bounded)
const needsClones = hasToken(mediaStr(scroller), 'loop') && !scroller.querySelector(':scope > [data-clone]');
if (needsClones && retries < 5) { deferred.push(scroller); continue; }
```

So `@browser.style/carousel` needs `@browser.style/card` at runtime while the declared
peer points the other way. The 5-retry deferral is a timing workaround for the split.

**The primitives are duplicated verbatim, under lint guard.** `carousel-controls.js`
re-implements `mediaStr`, `hasToken`, `NOT_SLIDE` and `slidesOf` as byte-copies of
`ui/card/shared.js`; `lintSlideLists` in `tokens.lint.js` polices both directions of
drift. The copy exists only because it cannot import across packages — but the repo
already has a working mechanism for exactly that: `ui/card/lightbox.js:44` imports
`../common/command.js` as a sibling package, documented as resolving both in-repo and
under npm's flat scoped install.

**`layout` pulls the whole card package for this one file.** `layout/package.json`
peer-depends on `@browser.style/card` and `layout/src/pages/carousel.html:15` loads
`/ui/card/carousel.js`. Layout's CSS mentions `ui-card` in **two comments only** (the
`bs-card` namespace note in `core/group.css:11`, `core/base.css:26`) — no selectors, no
JS imports. That peer exists solely for `carousel.js`. This is verbatim the complaint
that motivated work item C: "a consumer who only wanted `ui/button` pulls the whole card
carousel."

**Not a wholesale move — two parts are genuinely card-coupled:**

| stays in card | why |
|---|---|
| `initCarouselVideoPause` | IntersectionObserver pausing slide `<video>`s; uses `isDecoration`. Video is card's domain (`video.js`, `media.video.css`) |
| `initAuto`'s `<ui-play>` wiring (`reflectPlay`) | the sticky `--_play-*` positioning CSS lives in card's `media.carousel.css` |

`mediaStr`'s "inheritance stops at `ui-card`/`ui-reveal`" is a card concept, but that
boundary is already crossed: `carousel.css` selects `ui-card`/`ui-reveal` throughout and
the polyfill already carries its own copy of the rule.

**The call to make.** Proposed shape: `ui/carousel/carousel.js` takes `geom`, `initLoop`,
`initAuto`, `initCarousels`, `scanCarousels`, `CAROUSEL_SEL`, and becomes the single
source of `mediaStr`/`hasToken`/`slidesOf`/`NOT_SLIDE`/`reduce`/`onIdle`.
`carousel-controls.js` then imports them instead of copying — which deletes the polyfill
half of the lint mirror and lets clone-then-controls be a direct call instead of a retry
loop. Card keeps the video half, with `shared.js` re-exporting the carousel primitives so
nothing else churns.

Costs: `@browser.style/carousel` gains JS (needs `main`/`exports`/`files` and a `min.js`
build — it has a CSS-only build script today); card's published `./carousel.js` export
needs a re-export shim or it is a breaking change on a 4.0.0 package; `ui/card/build.js`
`ENTRIES` and the `lintSlideLists` mirror both change. Payoff: `layout` drops its
`@browser.style/card` peer entirely, the runtime inversion goes away, and there is one
copy of the slide vocabulary instead of two plus a linter to keep them equal.

## 7. Variant GRAMMAR — flat words vs. parameterised tokens

> **Corrected 2026-08-15.** An earlier version of this entry claimed `data-variant=` was
> "v3 syntax" and listed three version generations. **That was wrong**, and it named
> `ui/progress` as a `data-variant` user when it reads none. The attribute spelling is a
> conformance rule, not drift — see the box below. What is genuinely open is only the
> grammar.

### Not open: which attribute — the element kind decides

A bare `variant=` is **invalid HTML on a built-in element**; custom attributes on built-ins
must be `data-`prefixed. So:

| Element kind | Attribute | Examples in this repo |
|---|---|---|
| custom (`<ui-*>`) | `variant=` | `ui-card`, `ui-reveal`, `ui-marquee`, `ui-quote`, `ui-accordion`, `ui-chip`, `ui-sticker`, `ui-beacon`, `ui-save`, `ui-lightbox`, `ui-icon` |
| built-in | `data-variant=` | `<fieldset class="ui-button-group">`, `<ol data-part="timeline">`, `<ul data-part="list">`, `<blockquote>` |

**The repo already follows this everywhere, and already documents it twice.**
`ui/timeline/ui-timeline.css:3` says it outright — *"horizontal with `variant="horizontal"`
(**data-variant on native lists**)"* — and `ui/card/docs/schema.md` gives the same reason for
`data-theme`/`data-fill` on a `<li>`.

`ui/quote` is the proof case: one component that styles **both** element kinds, pairing the
two spellings in a single selector.

```css
:where(ui-quote, ui-blockquote, blockquote[data-variant]) {          /* :8  */
    &:is([variant~="bigquote"], [data-variant~="bigquote"]) { … }    /* :30 */
```

`render.js` writing `variant=` for `parts.quote`/`parts.accordion` and `data-variant=` for
`parts.buttonGroup` is therefore **correct by construction**, not hard-coded knowledge it
should be freed from. The renderer knows the element kind because it emits the element.

### Open: the grammar, which is orthogonal to the spelling

Two grammars are live, and they cut across both attribute spellings:

| Grammar | Shape | Who |
|---|---|---|
| **flat words** | `variant="loop seam fade"` · `data-variant="inline rounded border"` | `ui/marquee`, `ui/quote`, `ui/accordion`, `ui/button-group`, `ui/timeline` |
| **parameterised tokens** | `variant="col lg:row lg:spl(1/1)"` | `ui/card`, `ui/reveal` |

The difference is real: tokens take arguments and carry container-query prefixes
(`lg:spl(1/2)`); flat words do neither. Nothing about `data-variant` prevents a built-in
from carrying tokens — verified, no component currently does, but the two axes vary
independently.

**The call to make:** whether the satellite packages should move to the parameterised
grammar, or whether flat words are the right altitude for a component with four looks and
no responsive behaviour. Decide it for the whole set rather than one package at a time —
`tokens.lint.js`'s `PART_VARIANTS` and `card-preset.schema.json`'s `parts` description
would both need to follow.

**Not urgent, and not a bug:** every picker and sub-component renders correctly today.
What it costs is one line of teachability — a reader of `card-preset.schema.json` cannot
tell from `parts` alone which grammar a given part expects.

**Related, and separately logged:** `ui/highlight` has no `package.json` at all, so it
cannot be a declared peer of `ui/card` despite being emitted by `render.js` — see the
audit's § B1 ([`2026-08-15-v4-consistency-audit.md`](./2026-08-15-v4-consistency-audit.md)).
`ui/button-group` was the other half of that item and is now resolved: it ships a manifest
at `4.1.0` and is a declared optional peer.

---

## 8. `ui/base/button.css` spells its hover tokens two ways

`button.css` exposes four hover-related custom properties, under **two conventions**:

| Convention | Tokens |
|---|---|
| `--button-{prop}--hover` | `--button-bg--hover`, `--button-bxsh--hover`, `--button-c--hover` |
| `--button-hover-{prop}` | `--button-hover-mix` |

**This has already cost one bug.** `ui/button-group` set `--button-hover-bxsh: none` — a
plausible reading of the second convention, and a token that does not exist — so the accent
glow ring stayed live on every unchecked segment. Measured before the fix:
`color(srgb 0 0.483334 1 / 0.25) 0 0 0 2.56px` where `none` was intended. Fixed at the call
site in `ui/button-group@4.1.0`; the naming split that produced it is untouched.

**The call to make:** settle on one convention — most likely `--button-{prop}--hover`, since
three of the four already use it — and alias `--button-hover-mix`. It is a `bs-core` change
with seven in-repo consumers that write these tokens: `ui/button-group`, `ui/reaction`,
`ui/select`, `ui/notification`, `ui/toolbar`, `ui/play`, `ui/price-card`, `ui/video-embed`.
Deliberately left out of the button-group pass, which fixed only the call site.

---

## 9. The card's button-group size seam still rides `fs-*`

`render.js` sizes the product-page variant picker with a **class** —
`class="ui-button-group fs-sm"`, from the `BUTTON_GROUP_SIZES` allowlist, mirrored in
`tokens.lint.js`'s `PART_VARIANTS.buttonGroupSize` and reached from a preset via
`parts.buttonGroupSize`. Since `4.1.0` the component has its own `size=` / `data-size=`
ladder, on the same em rungs as `ui/chip` and `ui/beacon`.

**Why the seam should move.** `fs-*` are CSS *absolute-size keywords*
(`.fs-sm { font-size: small }`), so they do not compose: an `fs-sm` group measures 13px
inside a 16px, a 24px and a 32px container alike. On the product page the ambient text is
17.6px and the picker is pinned to 13px regardless. `size=` is `em`, so it tracks.

**Why it did not move yet.** Repointing it touches `render.js`, `tokens.lint.js`,
`card-preset.schema.json`, `render.test.js` and the four generated product pages — **and it
visibly changes shipped output**: `sm` would render 11px (0.625 × 17.6) where it renders
13px today. Which rung the preset should name is a design call, not a mechanical rename, so
it wants its own sign-off. `fs-*` keeps working either way.

**The seam stays `parts`, not `media=`.** When it moves, `parts.buttonGroupSize` should emit
`data-size="sm"` in place of `class="fs-sm"` — nothing more. `ui/button-group` is a
text-area sub-component inside `<ui-content>`, not media furniture overlaid on `<ui-media>`,
so it takes no `media=` token: there is no `buttonGroup()` stem to mint, and the second
`:where([media*="chip(sm)"]) &` arm that chip and beacon carry has no analogue here.

---

## 10. Three Google features with no card type — and one is cheap

From the [Google rich-results audit](./2026-08-15-google-rich-results-audit.md). Coverage of
the live gallery is already high; these are the only gaps worth recording, and **none of them
is a new card type** — all three are page-level furniture.

- **`BreadcrumbList` — the clear win.** Still live, and it applies to *every* page rather than
  one type. `ui/breadcrumbs` emits **zero microdata** today: the markup is already
  `<nav aria-label="Breadcrumb"><ol data-breadcrumbs><li><a>`, so it needs `BreadcrumbList` /
  `ListItem` / `position` / `item` attributes and nothing else. The six single-entity demo
  pages (`demo/articles/*.html`, `demo/products/*.html`) carry no breadcrumb at all.
- **`ProfilePage`.** Google's profile result wants a `ProfilePage` host around the `Person`;
  `profile` and `artist` emit a bare `Person` — correct as a component, insufficient as a page.
- **`ItemList` as a carousel host.** The surviving half of the Course feature (*Course list*,
  ≥3 items) and the shape behind Movie/Recipe carousels. `<lay-out>` already produces the right
  markup shape and carries no microdata, which makes this the most interesting of the three.

**Deliberately not on this list:** `VacationRental`, `MathSolver`, Vehicle listing, `Speakable`,
IPTC image metadata — new types chasing narrow coverage. The 2026-08-05 coverage audit already
deferred the lodging family for the same reason.

⚠️ **Verify before building.** The audit could not fetch the gallery — `developers.google.com`
is a policy denial at the egress proxy — so its Google column is largely model knowledge, marked
row by row. Walk the ⚠ rows before acting on any of this.

---

## 11. Closed — `<ui-content>` → `<ui-text>` rename (decided against, 2026-08-03)

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

---

## 12. Closed — `demo/schema.html` sections (shipped 2026-08-16)

The page is now eleven sections, each an `<h2 id="sec-…">` followed by its own
`<lay-out md="columns(2) items(start)">`, grouped by what the thing *is*. Rationale and the
card-by-card allocation: [card-sections](./2026-08-16-schema-card-sections.md).

Two of the three inconsistencies that document surfaced were fixed by the reorder: **podcast is
no longer ordered part-then-container**, and **the two `Person` cards now sit side by side**.

**Still open — one linking convention, one grid question:**

- **`TVEpisode` and `PodcastEpisode` link to their series differently from everyone else.**
  `ComicIssue` and `MusicAlbum` use a crawlable `<a itemprop="url">`; these two emit
  `partOfSeries` as a hidden, name-only scope with no url. Now that the sibling card is
  *directly adjacent*, the gap is starker. A `render.js` change, so it was out of scope for a
  reorder.
- **Three columns / page width stays parked.** The measurements are recorded in the same
  document: `--layout-bleed-mw` is 1024px, `--layout-mi` (1rem) already equals the 16px column
  gap, and a third column would put cells at 331px — below the card engine's own 400px `md:`
  tier.

**How the heading level was solved, since it will come up again:** no card hardcodes a heading
tag. `headingTag` defaults to `h3` in `card-preset.schema.json`, so the fifteen grid presets
dropped their redundant `"headingTag": "h2"` and inherit it, while `prose-article` and
`product-page` keep an explicit `h2` because they back standalone single-entity pages that have
no `<h1>` above the card.

**Unrelated, still open:** `ui/card/demo.layout.css` sets
`--layout-space-unit: var(--spacing-lg, 1.5rem)` for page-level lay-outs, but that shim is **not
in `dist/demo.min.css`** and `demo/schema.html` links only the bundle — so page gaps are 16px
where the shim intends 24px. Either the shim belongs in the bundle or the page should link it.
