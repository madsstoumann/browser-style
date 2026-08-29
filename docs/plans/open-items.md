# Open items — v4 card / layout line

> What is **actually still open** on the v4 line. **This is the only file in
> `docs/plans/` by design** — implemented plans are deleted rather than archived, and
> their rationale lives in git history (`git log --diff-filter=D -- docs/plans`).
> Settled decisions of record are summarised in `ui/card/AGENTS.md`.
>
> Items 1–7 came from the 2026-07-26 architecture ledger; 8–12 and 30–36 were added as they
> surfaced. **Items 13–29 (2026-08-19) absorb what was still live from the deleted
> plan docs** — the 2026-08-15 consistency audit, the 2026-08-16 schema-card-sections
> note and the 2026-08-10 feature-gap ledger. Every absorbed finding was re-verified
> against the working tree on 2026-08-19. Most items wait on a decision or
> coordination; the audit residue in items 13–14 is plain typing.
>
> Everything else from that ledger is implemented and machine-verified: the v5 alias
> batch, R-13 (tokens manifest), R-14 (self arms + the partial style()-flag migration,
> minus the reverted `tnt`/`hov(tint)` — the guardrail lives in `ui/card/media.tint.css`),
> R-15 (generated doc tables), F-35/36/37, F-38 (`variant="sub"`) and F-40 (marquee
> furniture) are all done.

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
audited and repaired (the 2026-08-03 structure decision, work item B): the
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

**Severity, re-read against the 2026-08-19 decisions (items 28–29):** Chromium 151 is
inside the supported baseline (Chrome 150+), so this is a live bug in a supported engine,
not a fringe case. And because the failure mode is *content invisible at rest* in
right-to-left languages, it reads as a WCAG 2.1 AA problem (1.4.13 / content availability)
rather than a missing flourish. The `prefers-reduced-motion` arm required by the new a11y
policy also happens to be the cleanest workaround: if reduced-motion renders the end state
statically, the same escape hatch can serve RTL until Chromium fixes the timeline.

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

Work item C of the 2026-08-03 structure decision extracted the carousel
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
cannot be a declared peer of `ui/card` despite being emitted by `render.js` — see item 14.
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

From the [Google rich-results audit](../../ui/card/docs/google-rich-results.md). Coverage of
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

**Deliberately not on this list:** `MathSolver`, Vehicle listing, `Speakable`, IPTC image
metadata — new types chasing narrow coverage. (`VacationRental` was here too until 2026-08-18,
when it shipped as the `vacationrental` type; it still has no open rich result — Google's
vacation-rental feature is a partner-programme feed — so the markup is the deliverable.)

⚠️ **Verify before building.** The audit could not fetch the gallery — `developers.google.com`
is a policy denial at the egress proxy — so its Google column is largely model knowledge, marked
row by row. Walk the ⚠ rows before acting on any of this.

---

## 11. Closed — `<ui-content>` → `<ui-text>` rename (decided against, 2026-08-03)

Recorded so it is not rediscovered as an open question. The proposal was to rename
`<ui-content>` (the text area) to `<ui-text>`, recycle `<ui-content>` for the host, move
the system to a root `content/` project, and split the primitives into `ui/media` +
`ui/text`. **All four parts were rejected** (2026-08-03 structure decision; the full
reasoning and measurements are in git history — `git log --diff-filter=D -- docs/plans`).

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

The page is now eleven sections, each a bare `<h2>` followed by its own
`<lay-out md="columns(2) items(start)">`, grouped by what the thing *is*. Rationale and the
card-by-card allocation: the 2026-08-16 card-sections plan (deleted 2026-08-19 — git
history; its still-open measurements are inlined below).

Two of the three inconsistencies that document surfaced were fixed by the reorder: **podcast is
no longer ordered part-then-container**, and **the two `Person` cards now sit side by side**.

**Still open — one linking convention, one grid question:**

- **`TVEpisode` and `PodcastEpisode` link to their series differently from everyone else.**
  `ComicIssue` and `MusicAlbum` use a crawlable `<a itemprop="url">`; these two emit
  `partOfSeries` as a hidden, name-only scope with no url. Now that the sibling card is
  *directly adjacent*, the gap is starker. A `render.js` change, so it was out of scope for a
  reorder.
- **Three columns / page width stays parked.** The measurements, inlined here since the
  source document is deleted: `--layout-bleed-mw` is 1024px, `--layout-mi` (1rem) already
  equals the 16px column gap, and a third column would put cells at 504px → 331px —
  below the card engine's first container tier (`md:` = 25rem = 400px),
  viewport-independent above ~1080px because of the 1024 cap. Nothing breaks today — the
  page writes *zero* `md:`/`lg:` tokens — but any `md:` token added to a card later would
  silently never arm. Two more findings decide a revisit: the ProductGroup collage's
  nested `<lay-out xs="cg(3xs) rg(3xs)" md="columns(2)">` uses *viewport* breakpoints
  (md = 540px), so it would stay two columns inside a 331px cell — roughly 160px tiles;
  and `items(start)` is load-bearing — without it cards stretch to the tallest in their
  row (measured first six: 676·576·509·523·747·681 natural vs 676·676·523·523·747·747
  stretched).

**How the heading level was solved, since it will come up again:** no card hardcodes a heading
tag. `headingTag` defaults to `h3` in `card-preset.schema.json`, so the fifteen grid presets
dropped their redundant `"headingTag": "h2"` and inherit it, while `prose-article` and
`product-page` keep an explicit `h2` because they back standalone single-entity pages that have
no `<h1>` above the card.

**Unrelated, still open:** `ui/card/demo.layout.css` sets
`--layout-space-unit: var(--spacing-lg, 1.5rem)` for page-level lay-outs, but that shim is
**not in the built demo bundle** (now the hashed `/dist/demo.fc1719a9.min.css` — verified
2026-08-19: the bundle carries only layout's 1rem default) and `demo/schema.html` links only
the bundle — so page gaps are 16px where the shim intends 24px. Either the shim belongs in
the bundle or the page should link it.

---

## 13. Four audit bugs — behaviour is wrong today

From the deleted 2026-08-15 consistency audit § A; each re-verified 2026-08-19. These are
typing, not decisions — recorded so the delete loses nothing.

- **`--_theme-bs` is the one theme variable that leaks.** `ui/base/theme.css:5-17`
  registers thirteen `--_theme-*` properties with `inherits: false`; `--_theme-bs` —
  written `:105-107`, read `:88` — is not among them, so it inherits:
  `theme="red border(dashed)"` on a container gives a dashed border to every descendant
  that reads it, the exact opposite of `ui/base/theme.md`'s "an un-themed child does not
  pick up an ancestor's theme". One line — register it beside its siblings.
- **`ui/rating` declares three unprefixed inheriting globals.** `ui/rating/ui-rating.css:9-11`
  (and again `:20-22`) declare `--min`, `--max`, `--value` — the three most obvious names
  in CSS, inheriting into every descendant. Rename to `--ui-rating-*` (or `--_*`).
- **Unnamespaced `@keyframes`.** `ui/progress/ui-progress.css:66-67` (`progress`,
  `progress-rtl`) and `ui/gradient-text/ui-gradient-text.css:16` (`move-bg`). `@keyframes`
  is document-global and last-declared wins — a page defining `@keyframes progress`
  silently takes over the indeterminate bar. `gradient-text` uses both conventions in one
  file (`ui-slide-bg`/`ui-breathe-bg` at `:68-69` are correct), the tell that this is
  drift, not a decision.
- **Two accordion variant words are unreachable from a preset.** `ui/accordion/ui-accordion.css`
  implements eight variant words; `ui/card/tokens.lint.js:218` allows six. `breakout` and
  `hide-summary` ship and are documented in `ui/accordion/readme.md`, yet a preset naming
  them fails lint as "dead in the browser". The durable fix: `PART_VARIANTS` is a
  hand-typed literal while its neighbours `lintSlideLists`/`lintSubtypes` *parse* their
  counterpart files — make it parse the component sheets and this class of drift cannot
  recur.

## 14. Packaging truth — highlight, badge, and a cross-package `@import` nothing gates

Audit § B, re-verified 2026-08-19. The gate half has since been fixed; the rest stands.

- **`ui/highlight` is not a package.** No `package.json` — yet it sits under a **Package**
  column in `ui/card/components.md` and `render.js` emits `<high-light>`. With no manifest
  it joins no workspace, is never versioned or published, and cannot be the declared peer
  every other emitted sub-component is. (Referenced from item 7; `ui/button-group`, the
  other half of the original finding, resolved at `4.1.0`.)
- **`<ui-badge>` is emitted, peer-declared, and styled nowhere a demo can see.**
  `render.js:841` emits it whenever `furniture.chip.badge` is set; `@browser.style/badge`
  is a declared peer of `ui/card`; but `badge` appears in neither `components.md` nor
  `demo/demo.css`, and **zero data instances set `chip.badge`** — a demo-coverage hole
  hiding a bundling one.
- **`ui/accordion/ui-accordion.css:15` does `@import '../icon/index.css';`** — a live
  violation of "no package may `@import` another package's CSS" (`ui/card/AGENTS.md`). The
  bundle gate in `scripts/css-bundle.js` has been fixed since the audit — it now rejects
  any esbuild input outside the package dir — but accordion has no bundle build, so
  nothing ever runs the gate over it. A `<link>` consumer of `@browser.style/accordion`
  silently pulls in the icon package, breaking the peer-exclusive promise.

## 15. The vocabulary pass — mode asymmetry and naming, one decision batch

Audit §§ C/D/E, re-verified 2026-08-19. Every entry needs a "which spelling wins" call, so
batch them into one deliberate pass rather than fixing piecemeal.

**Mode asymmetry** (standalone `theme=`/`variant=` vs furniture `media="chip(…)"`). The hue
matrix itself is clean — all nine hues in both modes in all seven furniture families — the
asymmetry is in the modifiers and the words:

- **`muted` computes a different ink per mode**: standalone is faded
  (`ui/base/theme.css:42-45`, 50 % toward transparent), furniture is opaque
  (`ui/chip/ui-chip.css:46`, likewise sticker/beacon/marquee). Same documented modifier,
  different label opacity.
- **`pale muted` composes standalone, drops `pale` as furniture**: the standalone chain is
  base → pale → tone → bg, but `chip(pale)` and `chip(muted)` both write `--_theme-bg` at
  identical zero specificity (`ui-chip.css:45-46`), so whichever is later in source —
  `muted` — wins and `pale` vanishes with no signal.
- **Variant words are spelled differently per mode; sizes and corners are not**:
  `light`/`lgt`, `outline`/`out`, beacon `none`/`non`, `pill`/`pll`, sticker
  `speech(l)`/`spl`. One divergence is deliberate and documented — marquee
  `variant="loop"` ↔ `marquee(rpt)` avoids colliding with the carousel's `loop`
  (`ui-marquee.css:92`) — the rest have no stated rule.
- **One word, several meanings**: `non` is a radius value (chip/sticker/marquee), "hide
  the disc" (save/lightbox), and "stop the animation" (beacon). `pll` on a beacon is the
  pill *face* as furniture (`ui-beacon.css:103`) and the pill *radius* standalone
  (`:255`) — four lines below the comment at `:251-253` saying `pll`/`non`/`crc` are
  deliberately *not* corner-axis members. Interlocks with item 4 (the `disc` merge class).
- **Size ladders diverge between families**: chip and beacon agree exactly
  (0.625/1/1.15/1.4 em); marquee is the same ladder shifted one rung
  (`ui-marquee.css:127-130` — 0.75/1.15/1.4/1.75), so `lg` on a marquee equals `xl` on a
  chip; save/lightbox run a third scale.

**Naming** (the stated rule: `--ui-{component}-{property}`, full readable names, no
PascalCase in new code):

- **Abbreviated public tokens** across sticker/play/save/lightbox/chip/beacon/marquee/
  progress/timeline. The sharp edge is `-sz` vs `-size` — spelled out in
  beacon/marquee/icon, abbreviated in sticker/play/save/lightbox;
  `ui/sticker/ui-sticker.css` has `-fs` one line from `-font-family`.
- **Two words for one property, both live**: `--ui-avatar-background` /
  `--ui-progress-bg`; `--ui-avatar-color` / `--ui-timeline-time-ink`.
- **`--_o` does two jobs in one sheet**: drop-shadow offset
  (`ui/sticker/ui-sticker.css:163-168`) and text-outline width (`:269-272`) — reachable
  together (`variant="text"` plus an `off()` shadow). Compare beacon's namespaced
  `--_bcn-*` privates, which nothing else follows.
- **PascalCase is still referenced in live code**: ~19 sites in `ui/base/utility.css`,
  3 in `webcomponents.css`. Worse, `ui/gradient-text/ui-gradient-text.css:27,:63` reads
  **`--GradientText`, defined nowhere in the repo** — the component's documented theming
  hook does not exist (the literal fallback keeps it painting).
- **`play` sizes are declared twice**: `ui/play/ui-play.css:88-90` (`sm lg xl`; `md` =
  the default) vs `ui/card/media.video.css:23-26` (`sm md lg xl`). Values agree today —
  two owners, kept equal by hand. The audit's mechanical cross-check found this the
  *only* furniture token declared in the card but not in its own package.

## 16. Card DSL vs layout DSL — one false equivalence, four traps

Audit § K, re-verified 2026-08-19. The first is a one-line doc fix; the rest want either
the vocabulary pass (item 15) or a documented decision.

- **`ui/card/docs/content.md:168` is factually wrong**: *"The stems match the layout
  package's spacing vocabulary **exactly** (`pb pbs pbe pi pis pie`)"*. Layout's real
  stems (`layout/src/builder.js`, `TOKEN_PROPS`) are `p pi pb pbs pbe mbs mbe cg rg` —
  **no `pis`, no `pie`**. Four of the six stems the sentence names as proof are shared;
  two do not exist on the layout side.
- **The two spacing ladders agree only at the default unit.** Layout's words are
  multipliers of `--layout-space-unit`; the card's are the fixed `--spacing-*` steps. Set
  the unit to anything but `1rem` and `lay-out lg="pi(md)"` and
  `ui-content content="pi(md)"` silently stop agreeing. Layout also defines `2xs` (0.125)
  and now `3xs` (0.0625) with no `--spacing-2xs`/`-3xs` in base and no card twin — and
  `layout/AGENTS.md:143` reinforces the false equivalence by calling layout's words "the
  content-DSL ladder".
- **Three spellings of zero, and `xxl` vs `2xl` inside one config**: `p(0)` (layout
  numeric), `pad(none)`/`gap(none)` (card, `content.css:10,:68`), `rds(non)` (card,
  `:98`) — `content="pad(non)"` and `content="rds(none)"` both silently no-op. And
  `layout/layout.config.json` spells "2× large" both ways in one file: breakpoint `xxl`
  (`:146`) vs spacing step `2xl` (`:52`).
- **Same spelling, different meaning across the two systems**: `md`/`lg` (viewport
  attribute names, 540/720px, vs container token prefixes, 400/704px), `media=`
  (overlapping but unequal token sets), `pages` (math paging vs wrapper dissolve),
  `stagger` (attribute vs token), `col` vs `columns(N)` (*one* column vs two) — plus
  `flp()` inside the card itself (`media="flp(h)"` image mirror vs `variant="flp(top)"`
  reveal flip). Nothing to fix mechanically; the call is what to document as permanent
  (as `ui/card/AGENTS.md` already does for `md`/`lg`) and what to respell.

## 17. Docs that are wrong about the code — one clause or one number each

Audit §§ F1–F3 / H / L, re-verified 2026-08-19. **Most of this batch was fixed the same
day** during the docs consolidation — `docs/design-system-agent.md` (the auto-loaded doc
that carried five of these errors) was deleted and its durable content absorbed into
`DESIGN.md` and the `convert-to-v4` skill, with the alias location corrected to
`ui/base/tokens.css`; the card doc counts, the reveal `@import` claim, the `<data>` price
shape and the registration wording were all corrected in place.

What is left:

| Doc says | Reality |
|---|---|
| `DESIGN.md` / `ui/base` docs — no inventory of what `index.css` actually pulls in | `ui/base/index.css` imports **14** files; `theme.css`, `tint.css`, `scroll.css`, `stagger.css` are undocumented as part of the entry point |
| `ui/card/AGENTS.md:156` — "see `demo/index.html`" | no such file (20 demo pages, none named index) — the one broken doc path the audit found |
| `layout/AGENTS.md:61`, `layout/readme.md:248`, `ui/card/AGENTS.md:151` — "`xs` — 240px" is a breakpoint | the `xs` config entry has no `min`, only `"srcsetMin": "240px"`; built CSS has media queries at 380/540/720/920/1140 — no 240. `layout/AGENTS.md:143` states it correctly, contradicting `:61` in the same file |
| `ui/card/components.md:44` — `ui/icon` in the furniture table | there is no `icon(…)` token and no `[media*="icon("]` selector anywhere; `ui-icon` is only ever a child of save/play/lightbox or the target of reveal's `ico()` |

Direction: fix each in place. `docs/schema.md`'s counts — each published with the `grep`
that reproduces it — are the house style every countable claim should copy; the recurring
lesson from this batch is that hand-maintained numbers rot, so generate or grep-document
them.

## 18. The manifest's `sources` line references have rotted

Audit § F4 + L8, re-verified 2026-08-19: `ui/card/data/tokens.json` cites
`media.css:219-255` in a **232-line file**, and the audit's mechanical sweep found 20+
references beyond end-of-file plus in-range ones pointing at the wrong lines
(`ui-card.css:80` for a rule actually at `:59`, `ui-beacon.css:130` for `:103`,
`ui-sticker.css:231` for `:200`). Because `tokens.build.js` copies `notes` verbatim into
`tokens.data.js` **and** `docs/tokens.md`, every wrong line is published three times, and
the manifest's claim to be anchored to source is not currently checkable.

**Direction:** drop line numbers from `sources` (file-level refs do not rot), or add a
range/content check to `tokens.lint.js` — it already parses these files. Extending the
generated `<sub>file:line</sub>` footers to the prose notes would end the class.

## 19. "v5" — rename the prose or cut the major. Decide once

Audit § G plus a 2026-08-19 finding; two halves of one decision.

**Interim (2026-08-19):** `docs/v4.md` now defines the term for readers — "v5" is the
**token-vocabulary generation**, not a branch or a release, and "removed in v5" marks a
breaking token rename already landed on this branch. That stops a new session mistaking it
for a future line; it does **not** settle the question below, which is whether the prose or
the package versions should move.

There is no released v5, yet **85 sites outside `docs/plans`** call the token-vocabulary
sweep "v5" — "removed in v5", "the v5 alias batch", "the system's v5 vocabulary" — across
`ui/card/readme.md`, `AGENTS.md`, `render.js`, nine `ui/card/docs/*` files and
`ui/card/data/tokens.json` (17 references there, copied verbatim into `tokens.data.js` and
`docs/tokens.md` by the build). Meanwhile `ui/card/package.json` and
`ui/reveal/package.json` both still say **4.0.0**, although that sweep shipped breaking
removals (reveal's `type`/`from`/`to`/`trigger`/`scroll`/`icon` attributes, the `scl()`
spellings, the alias batch) — major-version changes went out with no major bump.

**The call to make:** either (a) the sweep is v4 — rewrite the batch prose and system
prose to v4 and leave per-package semver (`ui/marquee@5.1.0`, `ui/accordion@5.0.0`)
untouched, or (b) it really was v5 — bump card and reveal to 5.0.0 and let the prose
stand. Either way the rewrite **must start at `tokens.json` and regenerate** — editing the
generated copies is reverted by the next `node ui/card/tokens.build.js`.

## 20. `@version` headers — 5 wrong, 22 missing. Generate or drop

Audit § I, re-verified 2026-08-19. Nine CSS files across `/layout` + `ui/card` + `ui/base`
carry a `@version` header; four match their package (4.0.0), five do not:
`ui/card/media.css`, `media.hover.css`, `media.shapes.css` say **1.0.0** and
`media.tint.css` **1.1.0** against a 4.0.0 package, and `ui/base/scroll.css` says
**2.0.0** — *ahead* of base's 1.0.11. Twenty-two files have no header at all (15 of 16 in
`ui/base`, all of `layout/core/`). `media.css` is the sheet it matters most on — the
largest in the package, holding the flag registry and host boundary. A convention followed
by 4 files of 31 misinforms: either generate the header at build time
(`tokens.build.js` already writes generated headers) or delete the convention.

## 21. Cascade layers — the documented order is enforced by nothing

Audit § J, re-verified 2026-08-19. Three parts; the first is the cheap one.

- **No `@layer` order statement exists in `ui/base` or `ui/card`** — not in `index.css`,
  not in the dist bundles (both open directly with `@layer bs-core {` /
  `@layer bs-component {`). Layer order is therefore first-appearance, i.e. `<link>`
  order: a page linking `card.css` before `base.css` sorts `bs-component` first, and
  every `bs-core` rule in base then outranks the card engine. `ui/card/AGENTS.md`
  mandates the load order in prose only. A one-line `@layer bs-core, bs-component;` at
  the top of `ui/base/index.css` and the card bundle makes it order-independent — which
  is what layout already does. Highest value-per-character in the audit.
- **`layout.demo` is missing from layout's own order statement.**
  `layout/dist/layout.css:1` lists nine layers; `layout/demo.css:1` declares a tenth,
  `layout.demo`, which is therefore ordered by appearance and outranks every `layout.*`
  layer purely because demo pages link it last. Also worth a comment: `layout.reset`
  sorts *above* `layout.base` in the statement, inverting the usual reading of those two
  names.
- **The disjoint-layers claim needs a caveat.** `ui/card/AGENTS.md:154` says layout and
  card "don't collide … disjoint cascade layers (`layout.*` vs `bs-component`)" — true of
  the layered rules only. `ui/card` ships ten unlayered rules plus an unlayered
  `demo.layout.css`, and `media.carousel.css` has one *precisely because* it must beat
  `@layer layout.base` (its comment says so). Unlayered with no justifying comment:
  `ui/base/theme.css:5-17`, `ui/base/tint.css:36-46`, the `media.lightbox.css`
  `@keyframes`; and `media.lightbox.css:206`'s justification is truncated mid-sentence —
  `/* … UNLAYERED: the polyfill sheet is */`.

## 22. Card feature gaps — the remainder of the 2026-08-10 ledger

What was still open in the deleted feature-gap ledger, re-verified 2026-08-19. All
renderer-side, none urgent; the shipped and rejected entries stay in git history.

- **Per-breakpoint format + quality ladder.** The SSR image path applies one
  `quality: 80` to every width (`render.js:262`, `IMG_DEFAULTS`); `format=auto` lets
  Cloudflare negotiate avif/webp per request, which covers most of the ladder's win, but
  a per-width quality ramp remains unbuilt.
- **`width`/`height` on frame images.** The frame `<img>` emission (`render.js:964`)
  sets srcset/sizes/loading/priority but no `width`/`height`; it needs UCF model fields.
  CLS is already 0 via `asr()`, so this is a nicety, not a defect. (Avatars and
  comparison thumbs already get fixed-size 1x/2x pairs.)
- **Renderer i18n.** ~20 hardcoded English strings ("Director:", "Updated", "Requires",
  "Serves", …) block localized consumers. UCF already carries `meta.locale`; the fix is
  one exported `STRINGS` table overridable per `renderCard` call.
- **Smaller, same tier:** an `attr(col-gap)`-derived internal gap (layout coupling —
  wants its own design pass); legacy `timeline` item `location`/`endDate` are rendered
  but never demoed; `statistic` trend-direction styling hooks; a default aspect-ratio
  when the layout declares none; the provider-abstracted transform builder (obsolete
  unless multi-CDN becomes a goal).

## 23. `layout/polyfills/attr-fallback.min.js` does not exist — ~40 live pages 404 on it

2026-08-19 finding. `layout/polyfills/` contains `attr-fallback.js` and
`attr-fallback.css` — **no `attr-fallback.min.js`** — yet the v4 surface requests it from
41 pages: 22 in `layout/dist/`, 10 in `layout/src/pages/`, 2 in `layout/demo-assets/`,
`layout/index.html`, `ui/card/index.html`, 4 in `ui/card/demo/`, and `ui/reveal/index.html`
(a further 54 sit in the parked `content/card` build output). Every one 404s, so those
pages run with **no typed-`attr()` fallback in Safari** — missing values, and consuming
properties dying at computed-value time, not wrong values. The 27 pages pointing at
`/ui/base/polyfills/attr-fallback.min.js` are fine: that file exists and is built.

**Severity, re-read against the 2026-08-19 baseline decision (item 28):** Safari 26.5 is
**half the supported matrix** and does not implement typed `attr()`. This is not a
degraded-legacy-browser issue — it is `bleed`, `columns`, `rows`, `max-width`, `self`,
`size` and `lanes-min`/`lanes-max` silently not working for half of supported users on
~40 pages. Treat it as the highest-priority item in this file.

Compounding it: `layout/polyfills/attr-fallback.js` (2.9 kB, untouched since Jul 19) has
drifted from the actively maintained `ui/base/polyfills/attr-fallback.js` (8.5 kB, still
moving). **Direction:** add a minify step to layout's build (esbuild, as ui/base does) or
point the tags at the unminified file — or retire the layout copy and point everything at
the maintained `ui/base` build.

## 24. `mosaic(photo)` writes a dead property — DONE 2026-08-27

2026-08-19 finding. `layout/layouts/mosaic.json` set `--layout-spacing-unit: 0.25rem` on the
photo mosaic. That name is **not a typo — it is the pre-rename spelling.** It was the real
multiplier unit (`padding-inline: calc(var(--layout-pi) * var(--layout-spacing-unit))`,
`ui/layout/layout.css`, live 2025-06-23) and was renamed `--layout-space-unit` on 2025-07-25
(`0279569a`); the old layout system that still used it was deleted 2026-01-02 (`da4d2b4e`).
This one declaration outlived both, because a layout JSON's `properties` blob is written into
the generated CSS **verbatim** — the builder never validates property names. It had been inert
for ~13 months, so the intended 4px gutter was silently rendering at the 1rem default.

**Swept:** `--layout-spacing-unit` appeared in exactly one source file repo-wide. No other
layout JSON carried the old spelling.

**Shipped**, and rewritten to the collage pattern rather than patched one word:

```json
"--layout-bg": "var(--_theme-bg, light-dark(#333, #EEE))",
"--layout-colmg": "0.25",
"--layout-rg": "0.25",
"--layout-pbe": "var(--layout-colmg)",
"--layout-pbs": "var(--layout-colmg)",
"--layout-pi": "var(--layout-colmg)"
```

The gutter is expressed with the spacing **multipliers** the system actually reads (0.25 is the
`xs` step, so `cg(xs)`/`rg(xs)` produce the same 4px) instead of rewriting the unit for the
whole subtree — rewriting `--layout-space-unit` would have rescaled every other multiplier on
that element too. And the plate now defers to `theme=`: `--_theme-bg` is
`@property … inherits: false` with no initial value, so it is guaranteed-invalid on an unthemed
element and the `light-dark(#333, #EEE)` fallback fires, while `<lay-out sm="mosaic(photo)"
theme="gray">` takes the theme surface — the same lever the collage uses
(`ui/card/docs/media.md` § Gutter colour).

Measured after `cd layout && npm run build:all` (Chrome 150, `layout/dist/mosaic.html`):

| State | Plate | Gutters |
|---|---|---|
| default | `rgb(51, 51, 51)` | 4px (was 16px) |
| `theme="gray"` | `rgb(237, 237, 237)` | 4px |
| `theme="pale black"` | `color(srgb 0.824 0.832 0.844)` | 4px |

Note the breakpoint cascade this exposes: `mosaic(photo)` is declared at `sm`, so it sits in
`@layer layout.sm` and now beats an author's `xs="cg(…)"` while losing to `lg="cg(…)"`. That is
the layer ladder working as designed, not a regression — but it is the first layout variant to
set a spacing multiplier, so it is the first place the ordering is observable.

**Still open, and the reason this class of bug is invisible:** a layout JSON's `properties` keys
are never validated. A misspelled or retired custom property is emitted into `layout/dist/` and
does nothing. A lint over the known `--layout-*` vocabulary at build time would have caught this
in 2025 — see the same gap in item 20 (`@version` headers) and item 21 (cascade layers enforced
by nothing).

## 25. `lanes` at `xl`/`xxl` — config-gate the static selector, or accept the documented trap

2026-08-19 finding, documented as a caveat in `layout/AGENTS.md` ("Config gap").
`layout.config.json` generates `lanes` for `sm`/`md`/`lg` only, but the static
`@supports` rules in `core/base.css` (`:183` and `:198`) match **all six** breakpoint
attributes (`[xs*="lanes("] … [xxl*="lanes("]`) — so `xl="lanes(4)"` flips masonry on
with no generated track list.

**Measured 2026-08-19 in both engines, and they disagree: Safari renders 1 lane,
Chromium renders 4 columns.** The cause is a **dead fallback**: `core/base.css:67`
declares `--layout-gtc: attr(columns type(<length> | <custom-ident>), 1fr)`, so the
property always computes — `1fr` when the attribute is absent. The grid-lanes arm's
`grid-template-columns: var(--layout-gtc, repeat(var(--_ci, 4), 1fr))` therefore can
**never** reach its fallback, and Safari gets a one-track list. The
`@supports not` arm reads `column-count: var(--_ci, 4)`, where `--_ci` genuinely is
unset, so Chromium lands on 4. Two more measured cases: `lg="lanes(2)" xl="lanes(4)"`
→ 2 lanes at xl in both engines (the `lg` value persists, `min-width` being
cumulative); `lg="columns(3)" xl="lanes(4)"` → 3 lanes, inheriting `--_ci: 3` from
`columns(3)`.

**Why this one matters more than a silent no-op:** in Chrome the ungenerated token
*looks correct*, so it ships broken to Safari only.

**The call to make:** (a) generate the `@supports` selectors from the same config
allowlist (breakpoint-accurate, slightly more builder surface); and/or (b) drop the
dead `var(--layout-gtc, …)` fallback so both arms fail identically instead of
diverging. Either makes the failure consistent; (a) makes it disappear.

## 26. `layout/polyfills/attr-fallback.css` targets an attribute that no longer exists

2026-08-19 finding. The no-typed-`attr()` fallback sheet's animation block
(`attr-fallback.css:22-35`) selects **`[animation]`** — an attribute removed in v4; the
live spellings are `animate=`/`animate-self=`, and the engine those `--_dg`/`--_tx`/…
parameters feed now lives in `ui/base/animations.css`, not in this package. The block
styles nothing. Separately, `:9` declares `--layout-mw: 100vw` where `core/base.css:70`'s
own fallback is `100%` — under a space-taking scrollbar the two disagree by the scrollbar
width, the exact reference mismatch the Safari bleed workaround in `core/base.css` exists
for.

**Direction:** decide whether this sheet still has a job now that
`ui/base/polyfills/attr-fallback.js` writes per-element values back — then either update
it to the v4 vocabulary (`[animate]`/`[animate-self]`, `100%`) or delete it and its
references. Coordinates with item 23, which touches the same directory.

## 27. `layout/dist/layout.min.css` is stale relative to the installed minifier

2026-08-19 finding. `cd layout && npm run build` reproduces `dist/layout.css`
**byte-identically** but emits a `dist/layout.min.css` that differs from the committed
one — same length, one declaration reordered (`animation-timeline` moves ahead of
`animation-range` inside the scroll-fade rule; both sit after the `animation` shorthand,
so the two are semantically identical). Three consecutive builds agree with each other,
so the current toolchain is deterministic: the committed artifact was simply produced by
an older `cssnano-preset-advanced` (declared `^7.0.7`, installed 7.0.8).

Harmless today, but it means "is `dist/` up to date?" cannot be answered by rebuilding
and diffing — the check that would catch a genuinely stale bundle is exactly the one this
noise defeats. **Direction:** rebuild and commit the artifact once (deliberately, on a
branch where a Cloudflare Pages rebuild is acceptable), or pin the minifier exactly so a
rebuild is a true no-op. The regeneration was reverted on the 2026-08-19 docs branch to
keep that change docs-only.

## 28. Browser-support baseline — DECIDED 2026-08-19

**Chrome 150+ and Safari 26.5+; Firefox is not a support target.** Recorded in root
`AGENTS.md` § Browser support baseline, with the three engine divergences the baseline
implies (typed `attr()` absent in Safari, `::scroll-marker` absent in Safari, masonry
absent in Chromium). `layout/readme.md` and `layout/AGENTS.md` — which both claimed
"Chrome/Edge 89+, Firefox 88+, Safari 14.1+" — were corrected.

**Residual, not blocking:** ~40 per-package readmes carry "when did this land" feature
tables (`:has()` Chrome 105+, `color-mix()` Safari 16.2+, …). They are history rather than
a support claim and every entry sits below the baseline, so they were left alone. If they
ever start reading as a contract, delete them rather than maintain them.

## 29. Accessibility standard — DECIDED 2026-08-19

**WCAG 2.1 AA.** Recorded in root `AGENTS.md` § Accessibility (contrast ratios, the muted-
compounding trap, landmarks/heading order, `prefers-reduced-motion` on every always-running
animation, RTL via logical properties) and wired into the gates in `docs/v4.md` § 6, with
Lighthouse accessibility 100 as the demo-page floor in the `perf-pass` definition of done.

**Known non-conformance under it, in priority order:**

1. **DONE 2026-08-19 for the light arms.** The six retuned values were ported from the
   `demo/schema.html` override into `ui/base/tokens.css`, and the override deleted.
   Verified in-browser on that page: link 7.05, error 6.84, info 6.91, accent 6.21,
   success 6.11, text-muted 5.33 — all against `--color-surface`, all clearing 4.5.
   **Only the light arms moved**, for the reason in 1a below.

   **1a. One token cannot serve both roles — the blocking design decision.** Each
   `--color-*` hue is simultaneously *text on the page* and *a theme-bundle plate under
   fixed ink* (`--ui-theme-*-bg` with `--ui-theme-*-c`). In dark mode those pull opposite
   ways, so porting the dark arms would have deepened an existing failure rather than
   fixing one. Measured on today's dark arms as plates under white ink: red **4.16**,
   green **3.17**, accent **3.74** — already under 4.5; the proposed lighter arms would
   have taken them to 3.40 / 2.41 / 1.87, and blue from a passing 4.80 to **2.80**.

   `--color-warning` proved it is structural, not a tuning miss: as pale-chip ink on white
   it needs L ≤ 34% (4.76:1), as an orange plate under `--color-text` it needs L ≥ 42%
   (4.61:1) — **no overlap at any lightness**, and a `theme="pale orange"` tag chip
   measured **1.76**. **DONE 2026-08-19 for the ink half.** The two roles no longer share a
   value: `pale` (and a transparent-fill `border`) read `--_theme-hue-ink` in
   `ui/base/theme.css` — the hue with its OKLCH *lightness* clamped to the readable side of
   the scheme, `min(l, 0.45)` light / `max(l, 0.80)` dark — so the hue token itself is free
   to stay tuned as a plate. Mirrored in `ui/chip/ui-chip.css` for the `media="chip(pale)"`
   path (marked KEEP IN SYNC). Measured after, both schemes, all five hues: **5.28–9.71**
   (was orange 1.76 light; red 4.24 / accent 4.18 / blue 3.74 dark).

   **What that leaves is the PLATE ink only** — `--ui-theme-*-c`, the fixed white/dark ink
   on a solid bundle chip. Measured on the dark arms: orange **1.63**, green **3.18**, accent
   **3.74**, red **4.15** (blue 4.82 passes). The decision below is now scoped to that.

   **Decide one of:** (a) derive bundle ink with `contrast-color(var(--ui-theme-*-bg))` —
   the pattern `ui/base/tint.css` already uses, and `contrast-color()` is inside the
   supported baseline — which frees every dark arm to be tuned for text; (b) split the
   roles into `--color-*` (text) and a separate plate token; or (c) accept dark-mode
   plates below AA and document it. (a) is the recommendation. Until then the ink warning
   sits at `--ui-theme-*-bg` in `tokens.css`.

   **DONE 2026-08-19 — accent as text on a dark plate.** A `theme="black dark"` card's
   eyebrow measured **2.40** (and **3.46** on an ordinary card in dark mode) because
   `--color-accent`'s dark arm is tuned as a *plate*, not as text. Rather than move it —
   it also fills accent buttons, checkboxes, the range track and `theme="accent"` — the
   roles were split: **`--color-accent-ink`** (`ui/base/tokens.css`) derives the same hue
   with its lightness clamped per scheme, and the card's seven accent-as-text sites read it
   (eyebrow default, `eb|tx|mt|hl(accent)`, price discount, link focus). Measured after:
   **4.97** on the black plate, **6.21** light / **7.17** dark on an ordinary card. Accent
   plates are byte-for-byte unchanged (button still 5.48).

   **DONE 2026-08-28 — dark-mode buttons.** Lighthouse flagged both buttons of the
   `theme="black dark"` subscribe wall on `demo/articles/news-paywall.html`: accent
   **3.74** (`#e6f2ff` on `hsl(211 60% 50%)`) and secondary **4.35** (inherited `#e0e0e0`
   on `hsl(0 0% 40%)`). Both are *plates under light ink*, so the fix is the direction the
   ink note allows — darker, not lighter: `--color-accent` dark arm L50 → **L44** (button
   4.62, white 5.25; the `theme="accent"` plate follows, so the accent row above now
   passes) and `--color-button` dark arm L40 → **L35** (5.31 on the black plate, ~5.0 on
   `--color-surface`; the tag / chip / avatar fallbacks that read it improve with it).
   Text never read either raw arm since the ink split above. Not touched: the hover mix
   (`color-mix` toward `--color-text` *lightens* a dark plate, so hover ink drops to ~3.2 —
   pre-existing, both schemes) and the remaining plate inks orange 1.63 / green 3.18 /
   red 4.15, still decision (a).

   **Also still open:** the *muted-compounding* fix — `--ui-content-muted` is 65% and
   `dateline` re-applies it inside an already-muted `byline` (0.65² ≈ 0.42).
   `demo/schema.html` still carries an 85% page override; the real fix is stopping the
   double application in `ui/card/content.css`.
2. **`prefers-reduced-motion` is policy, not verified.** The arms have never been audited
   across the animation engines (`ui/base/animate.css`, `stagger.css`, the beacon/marquee
   always-running set). Related: item 5's RTL stagger failure, where a reduced-motion
   static end state doubles as the workaround.
3. **Native `::scroll-marker` hit-target size has never been audited** — axe cannot see
   pseudo-elements, so nothing has ever checked it (item 8).

(2) and (3) are work, not decisions; (1) is a bug.

---

## 30. `schema.html` — the inline polyfill sits below the stylesheet, serialising CSS and parse

**Where:** `ui/card/demo/schema.html` — `<link rel="stylesheet" href="/dist/demo.<hash>.min.css">`
at line 13, the `<!-- polyfill:start/end -->` block at line 42.

A parser-inserted **classic** `<script>` is blocked by every stylesheet that precedes it, and
because such a script also blocks the parser, HTML parsing halts with it. The two phases that
should overlap therefore run in series: the ~62 kB bundle downloads, *then* the 2,482-element
body is parsed, *then* the page can paint — with the render-blocking
`<link rel="expect" href="#schema-product-variants">` queued behind that parse. The preload
scanner keeps scanning ahead the whole time, so subresource discovery is **not** affected;
this is a DOM-construction cost only.

**The fix is one move, not a rewrite:** relocate the `<!-- polyfill:start -->` … `<!-- polyfill:end -->`
block above the stylesheet `<link>`. `scripts/inline-polyfill.js` rewrites *between* the
markers and does not care where they sit, so nothing in the build changes. The polyfill's
"must run before first paint" guarantee is not weakened by moving it earlier — it is
strengthened. Its initial `u()` walk finds an empty body either way; the `MutationObserver`
does the real work.

**Why it is waiting: the magnitude is unknown.** Paint is gated on CSS regardless, so the
saving is whatever the body parse costs once it is allowed to overlap the download — plausibly
small, plausibly not on a document this size. Trace it before and after
(`performance_start_trace`, then `LCPBreakdown` and `RenderBlocking`) rather than shipping it
as an obvious win. If the delta is inside run-to-run noise, close this item and keep the rule
as documentation only.

The rule itself is recorded in `docs/performance.md` § JavaScript and the polyfill and in the
`perf-pass` skill. `ui/card/demo/media.html` has a body-level inline classic script (line 201)
that is technically subject to the same rule, but head CSS has resolved long before the parser
reaches it — not worth touching.

---

## 31. `columns(n)` grid children lack `min-inline-size: 0` — blow-out under large type

**Where:** `layout/core/base.css` — the `columns()` arm. The fix already exists for lanes at
lines 186–194 and was never generalised.

**Repro:** `ui/card/demo/media.furniture.html` at a 1185px viewport with the root font-size at
48px (300% OS text scaling, i.e. what `<meta name="text-scale" content="scale">` opts into):

```
<lay-out md="columns(2)" lg="columns(3)">
grid-template-columns: 368.297px 368.297px 368.312px   → 1201px
body width                                              → 1009px
document scrollWidth − clientWidth                      → +104px
```

The tracks are `1fr`, so they should divide the container. They do not, because grid items
default to `min-width: auto`: at 48px type the cards' min-content width exceeds the track and
pushes the whole grid past its parent. Identical in shape to the masonry-lane bug already
documented in `AGENTS.md` § Known sharp edges, and fixed there by:

```css
/* Lane items are grid items, so min-inline-size defaults to `auto` = the … */
& > *:not(lay-out) { min-inline-size: 0; }
```

**Scope of the symptom is narrow — 1 of 24 demo pages.** A sweep of the card and layout demos
at 1×/2×/3× root font-size found zero horizontal overflow everywhere else, including
`bleed`, `overflow`, `lanes` and every card demo. So this is one layout arm, not a systemic
sizing problem, and `text-scale` was shipped on that basis (`docs/html-head.md` § 4).

**Why it is waiting:** it is not caused by text scaling — it reproduces at any narrow
viewport with large enough type — but `min-inline-size: 0` on grid children is not a free
change. It disables min-content protection for *every* `columns()` child, so a long
unbreakable token (a code span, a URL) would start overflowing its own card instead of
widening the track. Decide whether that trade is right, and whether the same guard belongs on
the other grid arms (`grid`, `bento`, `mosaic`, `asym`) before touching one of them in
isolation. Verify against `docs/html-head.md` § 4 — the 3× sweep there is the regression test.

**Until it is fixed,** `media.furniture.html` carries a `text-scale` opt-in it does not fully
honour at the top of the scaling range.

---

## 32. Map cards cannot choose a basemap — DONE 2026-08-20

**Where:** `ui/card/render.js` (`osmEmbed`, `mapFrame`), `cms/baseline/models/card.schema.json`

```js
return `https://www.openstreetmap.org/export/embed.html?bbox=${box.join(',')}&layer=mapnik&marker=${lat},${lon}`;
```

**Shipped.** A media item takes `layer`, allowlisted to the six OSM can embed
(`OSM_LAYERS` in `render.js`); anything else renders `mapnik`, matching what the embed itself
does with an unknown id. `tracestracktopo` and `openmaptiles_osm` stay unspellable on purpose.

**No `bbox` field was needed** — it derives from `zoom`, and a test asserts all eight frames
on `demo/schema.place.html` are reproducible from `layer` + `zoom` + `details.geo`, so the
model has no remaining gap for that page. `ui/card/demo/schema.place.html` is the eight-card reference for
what the other five look like, and the vocabulary table is
[media.md § Basemap layer](../../ui/card/docs/media.md#basemap-layer--the-one-map-field-the-data-model-does-not-carry).

**What the field needs to be:**

- **Name it `layer`, not `type`.** A media item already carries `mediaType`, the card
  carries `schemaType` and `details.subtype`; a bare `type` on a map item would read as one
  of those. `layer` also matches the URL parameter it becomes, so the mapping is
  inspectable.
- **Allowlist the six embeddable values** — a `Set`, checked before interpolation, exactly
  as `SUBTYPES` is. OpenStreetMap resolves an unknown layer as
  `layers[layerId] || layers.mapnik`, so a typo is *silently* the default rather than a
  visible failure — the allowlist is what turns that into a caught error.
- **`tracestracktopo` and `openmaptiles_osm` must NOT be spellable.** They appear in the
  switcher on openstreetmap.org but carry no `canEmbed` flag in that project's
  `config/layers.yml`, so the embed drops them. Offering them in the DSL would ship a value
  that quietly does nothing.

**Zoom is already there, under a different name.** The item field is **`zoom`** (clamped
1–20), not `zoomLevel` — it needs no new capability, only the awareness that it is not a URL
parameter: the builder turns it into the `bbox` half-span. Renaming it is a breaking change
to every existing map item for no behavioural gain; if the longer spelling is wanted, decide
that separately from this item.

**Why it is waiting:** it is a change to `render.js` plus the CMS content model, so it
carries the full gate chain — `render.test.js`, the SSR snapshot, `schema.compare.js` and a
`card.schema.json` version bump. Worth doing in one pass with a decision on whether the
Google provider gets an equivalent (the Maps Embed API spells it `maptype`, and takes only
`roadmap` / `satellite`), so the two providers do not grow divergent vocabularies.

---

## 33. `schema.place.html` boots six third-party map applications before load finishes

**Where:** `ui/card/demo/schema.place.html`

Measured 2026-08-19, Chromium, `loading="lazy"` on all eight frames, page-scoped
`content-visibility: auto` applying to all eight cards:

| Page | Elements | Frames | Embeds requested **on load** | After full scroll |
|---|---|---|---|---|
| `schema.html` | 2,941 | 3 | **0** | — |
| `schema.place.html` | 386 | 8 | **6** at 1280, 3 at 412 | 8 |

**This is why the smaller page feels slower.** `schema.html` has ten times the DOM, but its
document is 36,032px tall and its three map frames sit far below the fold, so lazy loading
defers every one of them — it boots **zero** maps. `schema.place.html` is 3,284px tall and
*every card is a map*, so six of eight OSM embeds start before load completes. Each is a
whole document: HTML, a map library, CSS and tiles. Three of the eight (`transportmap`,
`shortbread` ×2) are vector styles, so they boot MapLibre GL and a WebGL context each.

**Confirmed on the deployed page** (Lighthouse, `browser-style-v4.pages.dev`, 2026-08-19).
"Reduce JavaScript execution time" 1.3 s, "Minimize main-thread work" 2.1 s:

| Source | Total CPU | Script evaluation | Script parse |
|---|---|---|---|
| `openstreetmap.org` | **1,526 ms** | 619 ms | 545 ms |
| — `assets/embed-1cd41c3….js` | 906 ms | 434 ms | 445 ms |
| — `assets/embed-3b3d336….js` | 620 ms | 185 ms | 101 ms |
| Unattributable (frame layout/compositing) | 376 ms | 166 ms | 0 ms |
| **the page itself** | **107 ms** | **2 ms** | 1 ms |

First-party script evaluation is **2 ms**; ~93% of the JS time is OSM's embed bundles.
Nothing in this repo can make that code faster — the only lever is not running it. Note the
**two** distinct bundles: consistent with OSM shipping separate raster and vector paths, so
the three vector-style cards (`transportmap`, `shortbread` ×2) are what pull the second one.

**What does not fix it, and was measured:**

- `loading="lazy"` is already on all eight frames — it is what keeps the count at six rather
  than eight, and it cannot go further.
- Correcting `contain-intrinsic-size` from 567px to the measured 700px (done, `87e03a3`)
  lengthens the placeholder document but moved the on-load count **not at all** — Chromium's
  lazy threshold is generous enough to reach those cards either way. Keep the fix for scroll
  stability; do not expect it to defer an embed.
- `content-visibility: auto` skips rendering for off-screen cards. It does **not** stop a
  frame inside them from loading.

**The lever that would work is a facade:** hold the embed URL in `data-src`, paint a cheap
placeholder, and swap it in on click or on `IntersectionObserver`. That takes the on-load
cost from six map applications to zero. That is ~1.5 s of third-party CPU deferred to a click. It needs page-scoped JavaScript, and it changes the
page from "eight maps you scroll past" to "eight maps you open" — a product decision, not a
mechanical one, which is why it is here and not done.

**Cheaper partial — TRIED AND REVERTED, do not retry.** Ordering the three vector-style
cards last halves the MapLibre boots inside the on-load set — measured 2 → 1 at 1280,
unchanged at 0 on 412 — and on the deployed page it made performance **worse**, not better.
Shipped as `2647630`, reverted. The local request-count proxy and the real page disagree
here, so the count of embeds inside the lazy threshold is **not** a usable stand-in for
Lighthouse on this page: measure the deployed host or do not claim an improvement. The
facade below remains the only lever with evidence behind it.

---

## 34. `jsonld` schema mode — DONE 2026-08-20

**Where:** `ui/card/render.js` (`setSchemaMode`), `ui/card/docs/google-rich-results.md` § 2.2

**Shipped.** `renderCard(…, { schema: 'jsonld' })` renders the same clean markup as `""`,
and [`ui/card/jsonld.js`](../../ui/card/jsonld.js) reads the structured data back out of the
**microdata** as a page-level `@graph`. There is one source of structured data, not two, so
the objection in § 2.2 of google-rich-results.md never applies — no mapping was
re-implemented, and no equivalence gate is needed because the graph is *derived*, not
authored. `demo/schema.jsonld.html` ships as the third twin (66 nodes, 56 distinct types as of 2026-08-28).

The extraction route made the "restructure the content models" question moot too: nothing in
`details` had to move, because the mapping is read from the emitted markup rather than from
the field names.

What was settled up front and held:

- **One page-level `@graph`**, not one script per card — fewer nodes, validates as a whole,
  and the shape Google's tooling reads most predictably.
- **Not render-blocking.** `<script type="application/ld+json">` is a *data block*: the HTML
  spec never executes a script with an unrecognised type, so `blocking="render"` has nothing
  to wait on. Google reads it anywhere in `<head>` or `<body>`, even injected later. Plain
  inline in `<head>`, no `blocking` attribute.

**Why it looked hard, and why it was not.** § 2.2 of google-rich-results.md records a
decision against a JSON-LD emitter, because a serializer built from `fields` would
re-implement the schema mapping for all 48 types and become a parallel source of truth. That
reasoning is sound — and it only applies to a serializer built from the *fields*. Reading the
*rendered microdata* instead sidesteps it completely: the renderer stays the single mapping,
and the extractor is ~90 lines of tokenising with no dependencies.

**Shipped with it:** `demo/schema.jsonld.html`, the third twin next to `schema.html` (micro)
and `schema.raw.html` (raw); all three are generated from `schema.html` by
`demo/schema.modes.build.js`.

### Would restructuring the content models make this easier? — Partly, and not the way it looks

Measured against the schema.org 30.0 vocabulary and against what the renderer actually emits,
over all 323 `details` keys:

| | share |
|---|---|
| key name is already a valid schema.org property, in domain | 44% |
| key name **equals the `itemprop` the renderer emits** | 35% |
| display twin (`*Display`) | 8% |
| renamed **or restructured** on the way to markup | **57%** |

**So aligning key names would not unlock JSON-LD.** The majority of the mapping is not a
rename — it is a structural transform, one key expanding into a nested typed node
(`salaryRange` → `baseSalary`/`MonetaryAmount`/`QuantitativeValue`, `property` →
`containsPlace`, `verdict` → `reviewRating`, `sections` → `hasMenuSection`). A rename cannot
express that, so the mapping table survives the restructure largely intact.

**Storing `details` in schema.org shape instead is rejected.** It would make JSON-LD close to
an identity function, but it breaks all 67 instances, `card.schema.json`, the editor and every
`DETAILS` reader at once — and it makes authoring worse, which is the reason `details` is
friendly in the first place. `card.model.md` exists to keep the friendly shape documented, not
to migrate away from it.

**The restructure that does pay: get non-schema data out of `details`.** 21% of the keys are
not schema data at all and are today indistinguishable from the keys that are:

| Bucket | Keys | Examples |
|---|---|---|
| display twins | 30 | `*Display` — a pre-formatted string beside a machine value |
| renderer control flags | 20 | `subtype`, `kind`, `order`, `ordered`, `list`, `slides`, `slide`, `format`, `map`, `mapMedia` |
| presentation-only text | 18 | `note`, `recommendation`, `viewings`, `pace`, `cadence`, `trialText`, `joinText`, `reviewedLabel`, `disclaimer` |

Move those 68 to siblings — `display: {}` and a renderer-config object — and `details` becomes
**by definition** the schema data. A serializer's input stops being ambiguous, and the
equivalence gate above gets something exact to check. That is the change that makes the JSON-LD
mode maintainable; name alignment is cosmetic next to it.

**And it is verifiable with a gate that already exists.** Moving a key changes only where the
renderer reads it, never what it emits — so the SSR snapshot must stay **byte-identical across
all 144 renders** through the whole migration. A restructure with a byte-exact regression gate
is a rare thing; it is the strongest argument for doing this one before the graph, not after.

**Cheap subset worth taking either way:** the renames where the key is a pure alias for the
property already emitted — `rating` → `aggregateRating`, `website` → `url`, `servings` →
`recipeYield`, `instructions` → `recipeInstructions`, `company` → `hiringOrganization`. Those
shrink the mapping table without costing authoring ergonomics.

### Moving the presentation keys out — MEASURED, then REJECTED

The paragraph above proposed moving the non-schema keys into a sibling object. Measuring it
properly killed it. Every key in a shipped instance was removed and the card re-rendered in
both modes; a key is schema-bearing if the asserted `(itemprop, value)` pairs change:

| | keys | share |
|---|---|---|
| schema-bearing | 215 | 73% |
| emit no microdata at all | 70 | 24% |
| removing them changes nothing | 9 | 3% |

Two things came out of that, and both argue against the move:

1. **The 70 split 24 / 46**, and only the 24 are presentation. The other 46 — `amenities`,
   `prerequisites`, `venue`, `capacity`, `note`, `disclaimer` — are real card **content** that
   simply has no schema.org mapping. Moving those into a `display` object would be a misnomer:
   they are not formatting, they are facts nobody has mapped.
2. **The 24 are all `*Display` twins, and the suffix already is the separator.** A serializer
   needs one line — `key.endsWith('Display')` → skip. Moving them buys nothing over that rule
   and costs real ergonomics: `duration` and `durationDisplay` would live in different objects,
   so one fact would be edited in two places.

The earlier bucket sketch was also simply wrong on names: `subtype`, `order`, `kind` and
`format` were filed as control flags, but all four are schema-bearing — they select the
emitted `@type` or an enumeration member.

**What actually helps a serializer** is therefore already true and only needs stating: `details`
holds schema data, `*Display` marks the pre-formatted twin of a machine value, and a key with
no schema.org mapping stays in `details` as ordinary content. Documented in
[card.model.md](../../ui/card/docs/card.model.md).

**One real find, fixed:** `membership.planName` and `social.hashtags` were in shipped instances
and in the model's prose, and `render.js` reads neither. Deleted; the SSR snapshot stayed
byte-identical, which is the proof they were dead. (`social`'s hashtags duplicate the envelope
`tags`, which is where they belong.)

---

## 35. `layout/polyfills/attr-fallback.min.js` — removed, not replaced

**Where:** the seven v4 pages that used to load it, and `content/card/` (legacy, 54 pages)

The tag pointed at a file that **has never existed** — no commit contains it, no build emits
it, and only the unminified `layout/polyfills/attr-fallback.js` is on disk. Every page
carrying it served a 404. Chrome never noticed (typed `attr()` is native there, so the
polyfill is a no-op); Safari and Firefox silently got nothing, which is the whole point of
that file.

Removed in `d30be98f` rather than repointed, on the expectation that the inline-script
mechanism `demo/schema.html` uses (`scripts/inline-polyfill.js`) will cover this too — so
shipping a working `<script src>` now would only be undone.

**What is still open:**

1. **Safari and Firefox currently have no layout `attr()` fallback on those pages.** That is
   not a regression — they never had one, because the file 404'd — but removing the tag means
   nothing will start working by accident either. The affected attributes are the ones
   `layout/polyfills/attr-fallback.js` covers: `bleed`, `columns`, `rows`, `max-width`,
   `self`, `size`.
2. **Decide the mechanism**: extend `scripts/inline-polyfill.js` to cover the layout polyfill
   (its `PAGES` allowlist is deliberately one page long today, and its header explains why),
   or add a minify step that actually produces the `.min.js` the pages asked for. Note the two
   polyfills cover **disjoint** attributes and both are needed on a page using `<lay-out>` and
   cards — `ui/base/polyfills/attr-fallback.min.js` does exist and is untouched.
3. **`content/card/` still references it** from 54 pages (`dist/` + `public/`, build output of
   a non-workspace legacy package). Left alone deliberately; it would be regenerated by that
   package's own build.

## 36. Google Rich Results counts 2 more Local businesses from JSON-LD — RESOLVED 2026-08-20

**Where:** `demo/schema.html` (microdata) vs `demo/schema.jsonld.html` (JSON-LD)

Google reported 71 valid items from the microdata page and 73 from the JSON-LD one. Diffing
the two reports, **the delta is one feature and nothing else**: Local businesses 12 → 14.
Every other category is identical.

**Our two documents assert the same graph.** Comparing all nodes, nested included:

| | microdata | JSON-LD |
|---|---|---|
| nodes | **471** | **471** |
| type histogram | — | **identical, zero differences** |

So the difference is inside Google's parsers, not in what we state — which also makes it a
second, independent confirmation that `jsonld.js` extracts the microdata losslessly.

**Microdata's 12 is the correct number.** The page holds exactly twelve LocalBusiness-family
nodes: eight reached via `item` (the offices ItemList), two via `department` (nested in an
Organization), and two top-level (`CafeOrCoffeeShop`, `VacationRental`). Google's microdata
run matches that exactly; its JSON-LD run **over-reports by two**.

The likely cause — unproven, and only Google's parser could confirm — is the two `department`
nodes being enumerated twice under `@graph`: once as a property value of the Organization and
once as an addressable node. That is a difference JSON-LD's flat graph creates and microdata's
tree nesting does not.

**No action.** The data is correct in both formats and 12 is the true count; a parser counting
one of them twice costs us nothing. Recorded so the 71-vs-73 discrepancy is not re-opened as a
suspected markup defect — the earlier guess in this item, that *microdata* might be losing two
items to a scoping quirk, was wrong and is retracted.

**One smaller divergence, same cause, also no action:** the JSON-LD run flags Breadcrumbs
"Non-critical issues detected" where the microdata run does not. Same single valid item in both.

## 37. `checked`/`crossed` mark colours are page tokens, not theme tokens

`--ui-content-list-checked-mark` defaults to `--color-success`, `--ui-content-list-crossed-mark`
to `--color-error`. Both are `:root` tokens in `ui/base/tokens.css` with a `light-dark()` pair,
and both are the *same* tokens that produce the `theme="green"` / `theme="red"` surfaces.

`theme=` swaps a card's surface. It does not swap these. Measured on the membership card,
`::marker` against the surface behind it (Chrome 150, `demo/schema.html`):

| Context | ✓ checked | ✗ crossed |
|---|---|---|
| light, card surface `#ededed` | 5.22:1 | 5.85:1 |
| dark (`prefers-color-scheme`) | 4.62:1 | 3.54:1 |
| `theme="black"` | 2.40:1 | 2.14:1 |
| `theme="green"` | **1.00:1 — invisible** | 1.12:1 |

Only the light row clears 4.5:1 on both. Dark passes on ✓ and sits at 3.54:1 on ✗ — over the
3:1 UI floor, under the body-text one. `theme="green"` paints the success green on a
success-green surface.

This is not decoration: the mark is the ONLY carrier of the included/excluded distinction. The
row text never says "included", so an invisible mark is lost meaning.

No live demo hits the failing cases — no themed card currently carries either variant — which
is why it shipped. A consumer theming a pricing card does hit it immediately.

**Options.** (a) Fall the marks back to `currentColor` whenever `theme=` is present — one
rule, always legible, loses the red/green signal on themed cards. (b) Resolve them through
`contrast-color()` against the theme surface — in both baseline engines, keeps a tinted
signal, needs a per-theme decision about what "success" means on a green card. (c) Add
`--ui-theme-*-success` / `-error` to the nine-hue bundles in `ui/base/theme.css` — most
control, most surface area.

Same question applies to any other semantic colour used as ink inside a themed card
(`ui-chip theme="pale green"` is unaffected — it carries its own paired ink).

Docs: `ui/card/docs/content.md` § Mark colour.

---

## 38. `theme=` on a `<lay-out>` paints the plate but not the ink

**Where:** `layout/core/base.css:97`, `layout/core/group.css:9`

```css
color: var(--layout-c, var(--_theme-c, inherit));                          /* base.css */
color: var(--layout-group-c, var(--layout-c, var(--_theme-c, inherit)));   /* group.css */
```

`--_theme-c` is set by exactly **one** rule in `ui/base/theme.css` (line 45,
`:where([theme~="ink"], [data-theme~="ink"])`). The resolver's general output is
`--_theme-ink`, which is why every other consumer in the repo reads the pair:

| Consumer | Chain |
|---|---|
| `ui/card/ui-card.css:162` | `var(--_theme-c, var(--_theme-ink, var(--color-text)))` |
| `ui/reveal/ui-reveal.css:78, 146` | `var(--_theme-c, var(--_theme-ink, var(--color-text)))` |
| `ui/chip`, `ui/sticker`, `ui/marquee` | `var(--_theme-c, var(--_theme-ink))` |
| **`layout/core/*.css`** | `var(--_theme-c, inherit)` — **`--_theme-ink` skipped** |

So a themed `<lay-out>` takes the theme's surface and leaves its text at whatever the page
inherits. Measured (Chrome 150, light scheme, a bare `<lay-out theme="…"><p>` probe — the
inherited ink is `rgb(38, 38, 38)`):

| `theme=` | Plate | Text | Contrast |
|---|---|---|---|
| `black` | `rgb(31, 41, 55)` | `rgb(38, 38, 38)` | **1.03:1** |
| `slate` | `rgb(56, 67, 82)` | `rgb(38, 38, 38)` | **1.51:1** |
| `red` | `rgb(173, 37, 37)` | `rgb(38, 38, 38)` | **2.21:1** |
| `accent` | `rgb(0, 94, 194)` | `rgb(38, 38, 38)` | **2.44:1** |
| `green` | `rgb(42, 111, 60)` | `rgb(38, 38, 38)` | **2.48:1** |
| `gray` | `rgb(237, 237, 237)` | `rgb(38, 38, 38)` | 12.93:1 |

Five of the nine hues fail 4.5:1, and `black` is effectively invisible. Only the light end of
the neutral ramp passes, and only because the *inherited* ink happens to suit it.

**No live page is broken.** The one themed layout in the demos is
`ui/card/demo/media.collage.html` (`<lay-out bleed theme="muted gray">`), whose plate is light,
and the collage layouts themed in the same file (`gray` / `black` / `pale gray`) contain only
`<ui-media>` tiles — no text. A consumer theming a section with a headline in it hits this on
the first try.

**The fix is one fallback level** — `var(--layout-c, var(--_theme-c, var(--_theme-ink, inherit)))`
in both files, then `cd layout && npm run build:all`. It is **not** a pure win, and that is the
open part: under `muted`, `--_theme-ink` is
`color-mix(in srgb, light-dark(hsl(0 0% 15%), hsl(0 0% 10%)), transparent 50%)`, so
`theme="muted gray"` would go from solid inherited ink to a 50%-transparent one — the *muted
compounding* trap in `AGENTS.md` § Accessibility, landing on the one live instance. Decide
whether `muted` should modify the fill only, or whether the layout arm should read
`--_theme-base-c` instead.

Docs to correct in the same change: `layout/core/base.md:304` currently states "theme ink wins
when no explicit value is set", which is what the chain *fails* to do.

---

## 39. `schema.compare.js` — 23 cards on `schema.html` still diverge from their data

2026-08-28 sweep: every id-less card on the page with a data file was dry-run through the
comparator. **4 matched byte-exact and were paired** (Movie, ClaimReview, Reservation, QAPage).
The rest diverge — page and renderer spell the same card differently, which is exactly the
drift the comparator exists to catch:

| lines | cards |
|---|---|
| 2–4 | Recipe 3 · Event 4 · Dataset 2 · ImageGallery 2 · EducationalOccupationalCredential 3 · SpecialAnnouncement 2 · EventSeries 4 · Review 2 |
| 5–8 | VideoObject 5 · Question 6 · Offer 6 · Quotation 6 · ItemList (comparison) 6 · FAQPage 8 · CreativeWork 8 · PodcastEpisode 8 |
| 12–14 | NewsArticle 12 · SoftwareApplication 12 · Person (profile) 12 · CafeOrCoffeeShop 14 |
| large | DiscussionForumPosting 54 (`social.json` is the plain post, not the forum card — needs its own instance) · ProductGroup#schema-product-variants 146 (the collage) |

Per card the fix is the usual one: decide which side is the spec (the page, per the
markup-first rule), move the other, add the pair. Two ambiguities need an `id=` first:
`Review` and `EventSeries` each have two id-less cards, so the bare selector cannot pick one.
Re-run the sweep with a scratch copy of `schema.compare.js` whose `PAIRS` is the candidate
list — ~2 min per card for the small rows.


## 40. `:has()` arguments that name DSL attributes — DONE 2026-08-29

**Implemented as proposed, same branch — zero-JS.** The 10 lightbox `asr()` mirrors are
deleted; the renderer echoes a frame-placed `asr()` token onto the host at build time
(`render.js` `lightboxHostMedia`), so the placeholder ratio rides plain inheritance —
verified with JavaScript disabled (a first-iteration lightbox.js relay was replaced the
same day; hand-authored frame placement falls back to `3 / 2` unless the author follows
the documented host-token rule). The cover `nav` rule in `content.css` is host-arm only
(constraint documented in `card.md` § cover), the PiP rule keys on `ui-play[open]` alone,
and `tokens.lint.js` now fails on any `media=`/`content=` needle inside a `:has()`
argument (11 errors against the pre-fix sheets, 0 after). **Measured after: the `media=`
token flip is 2.0 ms / 39 elements (was 36.4 ms / 534); the lightbox toggle is
452 → 420 ms** — its remainder is the `media-open=` swap's re-match volume, tracked as
`style-performance.md` §8.3. Original finding below, kept for the record.

**Measured 2026-08, full data in `docs/style-performance.md` (§4, §6, §8).** Blink tracks
the attribute names that appear inside `:has()` arguments; mutating such an attribute
anywhere re-evaluates `:has()` state at page scale. The bundle currently names `media` in
11 `:has()` needles (the 10 lightbox `asr()` placeholder-ratio rules in
`ui/card/media.lightbox.css` plus the `nav` arm in `ui/card/content.css`), `variant` in 4,
`data-part` in 4 and `aria-pressed` in 1. Consequence, measured on `schema.html`: one
`media=` or `variant=` token flipped on one card costs **~36 ms / ~534 elements**, and a
nonsense token costs the same — pure invalidation. Deleting the 73 `:has()` rules (or
flattening only the `media`-referencing ones) collapses the flip to **~2.3 ms / 39
elements**, with all 1,067 `[media*=]` rules still active. The same mechanism is why the
lightbox toggle recalcs 4,344 elements (452 ms) and `shared.js`'s `aria-pressed` writes
pay it on every play/pause.

Proposed fix (`style-performance.md` §8.1): move the attribute needle out of the `:has()`
argument — the plain `[media~="asr(…)"]` host rules set a custom property
(`--ui-lightbox-placeholder-ar`) unconditionally, and one `:has(ui-media:popover-open)`
rule consumes it; same treatment for `nav`, `variant`, `data-part`, `aria-pressed` arms.
Then guard it: extend `tokens.lint.js` to fail on any DSL-attribute needle inside a
`:has()` argument (§8.2). No token vocabulary change, no markup change. Verify with the
flip-ab harness inlined in `style-performance.md` §9c (expect ~36 → ~2 ms).
