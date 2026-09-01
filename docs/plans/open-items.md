# Open items — v4 card / layout line

> What is **actually still open** on the v4 line. **This is the only file in
> `docs/plans/` by design** — implemented plans are deleted rather than archived, and
> their rationale lives in git history (`git log --diff-filter=D -- docs/plans`).
> Settled decisions of record are summarised in `ui/card/AGENTS.md`.
>
> Items 1–7 came from the 2026-07-26 architecture ledger; 8–12 and 30–36 were added as they
> surfaced; 13–29 (2026-08-19) absorbed what was still live from the deleted plan docs
> (the 2026-08-15 consistency audit, the 2026-08-16 schema-card-sections note, the
> 2026-08-10 feature-gap ledger); 37–44 were added as found.
>
> **Every item was re-verified against the working tree on 2026-09-01** (HEAD `b2121e59`).
> Rotted file:line references were corrected in place; counts were re-measured.
> **Fully-closed items are kept as short tombstones** — the number stays (code and docs
> cross-reference `open-items § N`), the body shrinks to outcome + date + commit; the
> full rationale lives in git history (`git log -S "<item title>" -- docs/plans`).
> A `[quick]` marker on a heading means the item (or the flagged part of it) is
> mechanical typing with no design decision attached.
>
> Everything else from the 2026-07-26 ledger is implemented and machine-verified: the
> v5 alias batch, R-13 (tokens manifest), R-14 (self arms + the partial style()-flag
> migration, minus the reverted `tnt`/`hov(tint)` — the guardrail lives in
> `ui/card/media.tint.css`), R-15 (generated doc tables), F-35/36/37, F-38
> (`variant="sub"`) and F-40 (marquee furniture) are all done.

---

## 1. F-32 — move the popup escape hatch into the layout package

**Where:** `ui/reveal/ui-reveal.css:478-483` (foot of the file)

```css
/* popup escape hatch — UNLAYERED: it must beat <lay-out>'s containment.
   backdrop-filter is here because theme="… glass" would re-establish the containing block */
lay-out:has(ui-reveal[variant~="exp"][variant~="pop"] > details[open]) {
	contain: inline-size;
	backdrop-filter: none;
}
```

A `variant="exp pop"` reveal opens as a `position: fixed` popup and needs its ancestor
`<lay-out>` to release block containment. The rule works, and it is unlayered for a real
reason (it has to beat `@layer layout.*` whatever the link order). The open question is
**ownership**: it selects `lay-out`, so it arguably belongs in layout's own sheet rather
than shipping from the reveal package.

**The call to make.** Moving it buys correct ownership and lets layout keep its own
containment story in one place; it costs a hard dependency in the other direction, and
the rule would still have to be unlayered inside layout's own file. The 2026-09-01
re-verification found the cost has grown: the rule now also neutralises
`backdrop-filter` (a `theme="… glass"` ancestor would re-establish the containing
block), so layout would carry knowledge of **two** foreign concerns — `ui-reveal` *and*
the theme `glass` modifier. That weighs against moving it. Decide which coupling is the
lesser one — do not move it silently.

**Related, unfixed by either choice:** `<lay-out-group>` is a query container in its own
right (`container-type: inline-size` implies `contain: layout`), so a popup opened from a
card inside a **group band** is still clipped. Documented as a limitation in
`ui/reveal/readme.md:361-371` § Known limitations.

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
just not done yet. (Re-verified 2026-09-01: no gate exists anywhere — there is no
`.github/workflows/`, `scripts/publish.js:47` goes straight to `npm publish`, and the only
two `npm pack --dry-run` strings in the repo are documentation: `npm.md:9` and the
`convert-to-v4` skill's manual step.)

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

**Narrowed 2026-09-01 — the collision is renderer-side only, and the notes half is
already done.** In the manifest, `mrk` does **not** file `pll`/`non` under `disc`: it has
its own `"axis": "markers"` (`tokens.json:1213`) with `pll`/`non` inside `args.variant`.
The shared class lives in `render.js:958`'s flat
`MERGE_CLASSES = ['pos','hue','size','variant','shape','anim','face','disc','mode','flag']`,
and the manifest `notes` already name the mismatch in prose (`tokens.json:686` "render.js
classifies `non` under axis 'disc'"; `:847` "`pll` is a FACE here … though render.js files
it under 'disc'"). That is the cheaper option below substantially implemented.

**The call to make:** ratify the shared-class-plus-notes state as the resolution and
close this, or give the affected stems per-element axis maps in the renderer (accurate,
more surface). This was one of three design calls surfaced by the R-13 extraction; the
other two — `bdr` on `<ui-reveal>` painting on `> details`, and group-header base sizes
riding the responsive `scl()` ladder — were both resolved in the 2026-07-27 closeout
round. This one was not.

## 5. `stagger=` never fires in RTL — the view-timeline adapter only

**Where:** `ui/base/stagger.css`, the scroll-driven view-timeline adapter — labeled
inline at `:243` (`=== adapter 3: scroll-DRIVEN reveal ===`; the file header now lists
only the two *trigger* adapters). The timelines: `view()` on the container at `:264`,
`view(inline)` on the cards at `:270`, both inside the `@supports` gate at `:251`.
Repro: `ui/card/demo/media.carousel.html` § *Carousels in `<lay-out>`* with `dir="rtl"`
on `<html>`.

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

**New lead (2026-09-01) — test the `trigger` arm in RTL first.** Since this was filed,
`stagger.css:288-322` gained a `stagger="… trigger"` one-shot arm, gated on
`@supports (timeline-trigger-name: --t)`: it sets `animation-timeline: auto` on both the
container (`:297`) and card (`:307`) rules and drives them from
`timeline-trigger: --stg-card view(inline) entry 25% exit 0%`. Mechanically that is
option (b) below — the `auto`-timeline path that demonstrably works in RTL — already
built, but opt-in and never checked under `dir="rtl"`. If it passes, the fix may be a
routing decision rather than new code.

**The call to make.** Either (a) give this adapter an IntersectionObserver fallback that
marks in-view subjects done — reintroduces JS into a CSS-only engine, and stagger is
deliberately progressive-enhancement; (b) drop the view timeline for inline-axis
scrollers and route `stagger=` on a `<lay-out overflow>` through an `auto`-timeline
adapter (the scroll-state adapter the `media=` token uses, or the new `trigger` arm
above), which is the class that demonstrably works in RTL; or (c) accept it, document
`stagger=` as LTR-only on horizontal scrollers, and wait for the engine. (b) looks
cheapest and keeps the no-JS contract — it needs someone to confirm the adapters produce
the same visual result.

## 6. `carousel.js` still lives in `ui/card` — work item C left half-done

**Where:** `ui/card/carousel.js` + `ui/card/shared.js` vs `ui/carousel/`

Work item C of the 2026-08-03 structure decision extracted the carousel
**controls** — `ui/base/carousel.css` plus the polyfill — into `@browser.style/carousel`.
The **engine** stayed behind: `carousel.js` (seamless-loop clones, autoplay,
`initCarousels`/`scanCarousels`, `CAROUSEL_SEL`) is still a card module, even though its
selectors treat `lay-out[overflow]` as a first-class host alongside `ui-media`. Three
consequences, all measured 2026-08-04:

**The dependency is inverted at runtime.** `ui/carousel/polyfill/carousel-controls.js:246-251`
does not create clones — it *waits* for card's idle scan to produce them:

```js
// loop carousels get [data-clone] slides from the core's idle scan; wait for them (bounded)
const needsClones = hasToken(mediaStr(scroller), 'loop') && !scroller.querySelector(':scope > [data-clone]');
if (needsClones && retries < 5) { deferred.push(scroller); continue; }
```

So `@browser.style/carousel` needs `@browser.style/card` at runtime while the declared
peer points the other way. The 5-retry deferral is a timing workaround for the split.

**The primitives are duplicated — and have now forked.** `carousel-controls.js`
re-implements `mediaStr`, `hasToken`, `NOT_SLIDE` and `slidesOf` from
`ui/card/shared.js`. When this was filed they were byte-copies; re-verified 2026-09-01,
**`slidesOf` has diverged**: the polyfill's copy (`carousel-controls.js:75`) adds
`&& !c.hasAttribute('data-clone')` where `shared.js:21` does not. `lintSlideLists`
(`tokens.lint.js:92-103`) mirrors only the `NOT_SLIDE` literal — nothing guards the
other three, which is exactly how the fork went undetected. The copy exists only because
it cannot import across packages — but the repo already has a working mechanism for
exactly that: `ui/card/lightbox.js:44` imports `../common/command.js` as a sibling
package, documented as resolving both in-repo and under npm's flat scoped install.

**`layout` pulls the whole card package for this one file.** `layout/package.json:81`
peer-depends on `@browser.style/card` — now marked `optional: true` in
`peerDependenciesMeta` (`:87-89`), a partial mitigation — and
`layout/src/pages/carousel.html:18` loads `/ui/card/carousel.js`. Layout's CSS mentions
`ui-card` in **two comments only** (the `bs-card` namespace note in `core/group.css:11`,
`core/base.css:26`) — no selectors, no JS imports. That peer exists solely for
`carousel.js`. This is verbatim the complaint that motivated work item C: "a consumer
who only wanted `ui/button` pulls the whole card carousel." (Also stale in that file:
the carousel peer is pinned `^1.0.0` while `@browser.style/carousel` is `1.1.0`.)

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
site in `ui/button-group@4.1.0`; the naming split that produced it is untouched —
`ui/button-group/ui-button-group.css:98-101` now carries a guard comment warning about
exactly this trap, which is a symptom of the split, not a fix for it.

**The call to make:** settle on one convention — most likely `--button-{prop}--hover`, since
three of the four already use it — and alias `--button-hover-mix`. It is a `bs-core` change
with seven in-repo consumers that actually **write** these tokens (re-verified 2026-09-01):
`ui/button-group`, `ui/reaction`, `ui/select`, `ui/play`, `ui/price-card`,
`ui/card/media.video.css` and `ui/table-expand`. (`ui/notification`, `ui/toolbar` and
`ui/video-embed`, named in the earlier version of this entry, write only `--button-bg`/
`--button-p` — never a hover token.) Deliberately left out of the button-group pass, which
fixed only the call site.

---

## 9. The card's button-group size seam still rides `fs-*`

`render.js:1507` defines the `BUTTON_GROUP_SIZES` allowlist and `:1529` sizes the
product-page variant picker with a **class** — `class="ui-button-group fs-sm"` — mirrored
in `tokens.lint.js`'s `PART_VARIANTS.buttonGroupSize` and reached from a preset via
`parts.buttonGroupSize`. Since `4.1.0` the component has its own `size=` / `data-size=`
ladder (`ui-button-group.css:47-52`, six rungs — `xs` 0.5 / `sm` 0.625 / `md` 0.875 /
`lg` 1 / `xl` 1.15 / `2xl` 1.4 em), on the same em scale as `ui/chip` and `ui/beacon`.

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

## 10. Two Google features with no card type — plus a duplication the fix left behind

From the [Google rich-results audit](../../ui/card/docs/google-rich-results.md). Coverage of
the live gallery is already high; these are the only gaps worth recording, and **neither
is a new card type** — both are page-level furniture.

- **`BreadcrumbList` — DONE** (`db9637fb`, 2026-08-17 — it had already shipped when this
  item was re-verified on 08-19). `ui/breadcrumbs/index.js` now emits the full microdata:
  `BreadcrumbList` on the `<ol>` (`:26-28`), per-item `ListItem` scope (`:32-34`),
  `itemprop="name"`/`"item"` and a `<meta itemprop="position">` from sibling index.
  **Follow-up it created:** `breadcrumb()` in `ui/card/demo/build.shared.js:83-90` still
  hand-authors the same microdata — no longer a workaround for a missing component but
  duplicated logic. Decide whether the detail pages should use the component instead.
- **`ProfilePage`.** Google's profile result wants a `ProfilePage` host around the `Person`;
  `profile` and `artist` emit a bare `Person` (`render.js:48`, `:96`; renderers `:2230`,
  `:3136`) — correct as a component, insufficient as a page.
- **`ItemList` as a carousel host.** The surviving half of the Course feature (*Course list*,
  ≥3 items) and the shape behind Movie/Recipe carousels. `<lay-out>` already produces the right
  markup shape and carries no microdata, which makes this the most interesting of the two.
  (`ItemList` exists only as a card *root* type today: `render.js:58`, `:61`, `:62`.)

**Deliberately not on this list:** `MathSolver`, Vehicle listing, `Speakable`, IPTC image
metadata — new types chasing narrow coverage. (`VacationRental` was here too until 2026-08-18,
when it shipped as the `vacationrental` type; it still has no open rich result — Google's
vacation-rental feature is a partner-programme feed — so the markup is the deliverable.)

⚠️ **Verify before building.** The audit could not fetch the gallery — `developers.google.com`
is a policy denial at the egress proxy — so its Google column is largely model knowledge, marked
row by row. Walk the ⚠ rows before acting on any of this.

---

## 11. Closed — `<ui-content>` → `<ui-text>` rename (decided against, 2026-08-03)

All four parts rejected (2026-08-03 structure decision): recycling a name is the
highest-risk rename class (~6,470 edits, ~60 silent failures), `content=` → `text=` is
blocked by the existing `preset.text`, root `content/` is occupied, and the standalone
rename is ~3,900 edits for a nicer word. Full numbers in git history
(`git log --diff-filter=D -- docs/plans`). **What would reopen it:** a second host that
composes media + text but is not a card (`<ui-reveal>` is not one).

---

## 12. `demo/schema.html` sections — core shipped 2026-08-16; three residuals open

**Shipped:** the page is eleven sections, each a bare `<h2>` + its own
`<lay-out md="columns(2) items(start)">`; podcast ordering and the two `Person` cards
were fixed by the reorder; heading levels are solved by `headingTag` defaulting to `h3`
in `card-preset.schema.json` (only `prose-article` / `product-page` keep an explicit
`h2`). Full rationale: the 2026-08-16 card-sections plan, in git history.

**Still open — one linking convention, one grid question, one bundle gap:**

- **`TVEpisode` and `PodcastEpisode` link to their series differently from everyone else.**
  `MusicAlbum` (`render.js:3016-3017`) and the comic (`:3109-3111`) use a crawlable
  `<a itemprop="url"><span itemprop="name">`; these two emit the series as a hidden,
  name-only scope with no url (`render.js:2626` podcast, `:2923` tvepisode). A second
  divergence, found 2026-09-01: the comic spells the property **`isPartOf`**, not
  `partOfSeries` — so the families differ in property name as well as crawlability. A
  `render.js` change, so it was out of scope for a reorder.
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
- **The `demo.layout.css` shim is not in the bundle.** `ui/card/demo.layout.css:16` sets
  `--layout-space-unit: var(--spacing-lg, 1.5rem)` for page-level lay-outs, but the built
  demo bundle (now `/dist/demo.24b9298d.min.css` — re-verified 2026-09-01: it carries only
  layout's 1rem default) never includes it, because `demo/demo.css` imports 26 sheets and
  the shim is not among them. `demo/schema.html:15` links only the bundle, so its page
  gaps are 16px where the shim intends 24px — while **six pages link the shim directly**
  (`ui/card/index.html`, `demo/cards.html`, `demo/_parked.quick-info.html`,
  `demo/media.lightbox.html`, `demo/media.collage.html`, `ui/reveal/index.html`), so page
  rhythm is currently inconsistent *between* demo pages, not merely wrong on one. Either
  the shim belongs in the bundle or the pages should agree.

---

## 13. Four audit bugs — behaviour is wrong today `[quick]`

From the deleted 2026-08-15 consistency audit § A; re-verified 2026-08-19 and again
2026-09-01. These are typing, not decisions — recorded so the delete loses nothing.
(The fourth bullet's durable fix is the only non-quick part.)

- **DONE 2026-09-01 — `--_theme-bs` no longer leaks.** Registered beside its fifteen
  siblings (`ui/base/theme.css:18`, `syntax: "*"; inherits: false`). Verified in-browser
  both ways: pre-fix, a `data-theme="green border"` descendant of
  `theme="red border(dashed)"` rendered **dashed** (inherited); post-fix it renders
  `solid` via the `var(--_theme-bs, solid)` fallback while the host keeps `dashed`.
- **`ui/rating` declares three unprefixed inheriting globals.** `ui/rating/ui-rating.css:9-11`
  (and again `:20-22`) declare `--min`, `--max`, `--value` — the three most obvious names
  in CSS, inheriting into every descendant. Rename to `--ui-rating-*` (or `--_*`).
- **DONE 2026-09-01 — unnamespaced `@keyframes` renamed.** `progress`/`progress-rtl` →
  `ui-progress`/`ui-progress-rtl` (`ui/progress/ui-progress.css:66-67` + the
  `--ui-progress-anim` defaults at `:12`/`:63` and the readme's documented default);
  verified running in-browser. The `move-bg` half was a false positive: it sits inside a
  commented-out legacy block at the top of `ui-gradient-text.css` — the live keyframes
  (`ui-slide-bg`/`ui-breathe-bg`) were already namespaced. Renamed inside the comment
  anyway for consistency if the block is ever revived.
- **Accordion variant words unreachable from a preset — `breakout` fixed 2026-09-01;
  the rest turned out to be renderer gaps, not lint drift.** `breakout` is pure CSS and
  is now in `PART_VARIANTS` (allowlisted, gates green). `hide-summary` and the five
  `spl()` spellings (`ui-accordion.css:602-606`) are **deliberately excluded, and now
  documented as such in the lint**: `hide-summary` requires `no-collapse` + a group and
  `spl()` requires `type="split"` — attributes `render.js`'s `accordion()` (`:866`)
  never emits, so allowlisting them would let a preset spell a half-functional state.
  Allowing them means extending the renderer's accordion emission first. The durable
  lint fix still stands: `PART_VARIANTS` is a hand-typed literal while its neighbours
  `lintSlideLists`/`lintSubtypes` *parse* their counterpart files — make it parse the
  component sheets (minus a documented exclusion list) and this class of drift cannot
  recur.

## 14. Packaging truth — highlight, badge, and a cross-package `@import` nothing gates

Audit § B, re-verified 2026-08-19. The gate half has since been fixed; the rest stands.

- **`ui/highlight` is not a package.** No `package.json` — the directory holds only
  `index.html`, `readme.md`, `ui-highlight.css`, yet `render.js` emits `<high-light>`.
  With no manifest it joins no workspace, is never versioned or published, and cannot be
  the declared peer every other emitted sub-component is. The *doc* half was fixed:
  `ui/card/components.md:46` now says outright "No `package.json` yet — repo-only".
  (Referenced from item 7; `ui/button-group`, the other half of the original finding,
  resolved at `4.1.0`.)
- **`<ui-badge>` is emitted, peer-declared, and styled nowhere a demo can see.**
  `render.js:1087` emits it whenever `furniture.chip.badge` is set; `@browser.style/badge`
  is a declared peer of `ui/card`; `components.md:27` now carries a badge row (fixed
  since filing) — but `badge` is still absent from `demo/demo.css`, and **zero data
  instances set `chip.badge`** (the only `badge` strings in `ui/card/data/` are prose,
  including a carousel summary describing a badge the instance never sets) — a
  demo-coverage hole hiding a bundling one.
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

- **`muted` computes a different *ink* per mode — the plate half was fixed.** Re-verified
  2026-09-01: all four furniture families now fade the plate identically to standalone
  (`--_theme-bg: color-mix(… transparent 50%)` — `ui-chip.css:64`, `ui-beacon.css:73`,
  `ui-marquee.css:113`, `ui-sticker.css:82`). The residual asymmetry is ink only:
  standalone (`ui/base/theme.css:46-49`) fades both plate *and* ink, furniture pins
  `--_theme-c: var(--_theme-base-c)` opaque. Same documented modifier, different label
  opacity.
- **`pale muted` composes standalone, drops `pale` as furniture**: the standalone chain is
  base → pale → tone → bg, but `chip(pale)` (now a five-line block, `ui-chip.css:57-63`)
  and `chip(muted)` (`:64`) both write `--_theme-bg` at identical zero specificity, so
  whichever is later in source — `muted` — wins and `pale` vanishes with no signal; it
  now also clobbers pale's `--_theme-hue-ink` / `--_theme-c`.
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
- **Size ladders diverge between families**: chip (`ui-chip.css:89-92`,
  0.625/1/1.15/1.4 em) and beacon share those four rungs, but beacon has since grown to
  **six** (`ui-beacon.css:92-97`, adding `xs` 0.5 and `md` 0.875 — the button-group
  ladder); marquee is the chip ladder shifted one rung (`ui-marquee.css:127-130` —
  0.75/1.15/1.4/1.75), so `lg` on a marquee equals `xl` on a chip; save/lightbox run a
  third scale.

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
- **PascalCase is still referenced in live code**: 19 sites in `ui/base/utility.css`,
  3 in `webcomponents.css`. And `ui/gradient-text/ui-gradient-text.css:27,:63` reads
  **`--GradientText`, declared in no stylesheet or token file** — it works only as an
  author-set hook (`demo/hero.html:51` sets it inline; the literal fallback keeps it
  painting elsewhere), a PascalCase name the convention says should not exist.
- **`play` sizes are declared twice**: `ui/play/ui-play.css:88-90` (`sm lg xl`; `md` =
  the default) vs `ui/card/media.video.css:38-41` (`sm md lg xl`). Values agree today —
  two owners, kept equal by hand. The audit's mechanical cross-check found this the
  *only* furniture token declared in the card but not in its own package.

## 16. Card DSL vs layout DSL — one false equivalence, four traps

Audit § K, re-verified 2026-08-19 and 2026-09-01. The false-equivalence sentence in
`content.md` was **fixed in place** (`content.md:170` now states the overlap correctly —
`p pi pb pbs pbe` shared, no `pis`/`pie` on the layout side); the rest want either the
vocabulary pass (item 15) or a documented decision.

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

## 17. Docs that are wrong about the code — one clause or one number each `[quick]`

Audit §§ F1–F3 / H / L, re-verified 2026-08-19 and 2026-09-01. **Most of this batch was
fixed** during the docs consolidation — `docs/design-system-agent.md` was deleted and its
durable content absorbed into `DESIGN.md` and the `convert-to-v4` skill; the card doc
counts, the reveal `@import` claim, the `<data>` price shape and the registration wording
were corrected in place. The `ui/icon`-in-the-furniture-table row was also fixed since:
`components.md:47` now files it under text-area sub-components with an accurate
description.

What is left:

| Doc says | Reality |
|---|---|
| `DESIGN.md` / `ui/base` docs — no inventory of what `index.css` actually pulls in | `ui/base/index.css` imports **14** files; `theme.css`, `tint.css`, `scroll.css`, `stagger.css` are undocumented as part of the entry point. (`index.css:9-10` also carry unresolved `/* REWORK ? */` / `/* NEEDED ? */` markers) |
| `ui/card/AGENTS.md:158` — "see `demo/index.html`" | no such file (the demo pages carry no index) — the one broken doc path the audit found |
| `layout/AGENTS.md:63`, `layout/readme.md:248`, `ui/card/AGENTS.md:153` — "`xs` — 240px" is a breakpoint | the `xs` config entry has no `min`, only `"srcsetMin": "240px"` (`layout.config.json:73-75`); built CSS has media queries at 380/540/720/920/1140 — no 240. `layout/AGENTS.md:143` states it correctly, contradicting `:63` in the same file |

Direction: fix each in place. `docs/schema.md`'s counts — each published with the `grep`
that reproduces it — are the house style every countable claim should copy; the recurring
lesson from this batch is that hand-maintained numbers rot, so generate or grep-document
them.

## 18. The manifest's `sources` line references have rotted

Audit § F4 + L8, re-swept mechanically 2026-09-01: of the manifest's **259** `sources`
entries, 257 carry line numbers and **23 point past end-of-file** across five sheets —
`media.css` (232 lines; cited `:238 :257 :267 :281 :219-255`), `ui-reveal.css` (483; 8
refs beyond), `content.typography.css` (433; 5 beyond), `media.tint.css` (56; `:58 :66
:70`), `ui-card.css` (382; 2 beyond). In-range-but-wrong refs (`ui-card.css:80` for a
rule at `:59`, `ui-beacon.css:130` for `:103`, `ui-sticker.css:231` for `:200`) are a
separate, uncounted class. `tokens.lint.js` never reads the `sources` key. Because
`tokens.build.js` copies `notes` verbatim into `tokens.data.js` **and** `docs/tokens.md`,
every wrong line is published three times, and the manifest's claim to be anchored to
source is not currently checkable.

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

There is no released v5, yet **105 sites outside `docs/plans`** (recounted 2026-09-01;
was 85 — the number grows as docs are written) call the token-vocabulary sweep "v5" —
"removed in v5", "the v5 alias batch", "the system's v5 vocabulary" — across
`ui/card/readme.md`, `AGENTS.md`, `render.js`, ten `ui/card/docs/*` files and
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

## 20. `@version` headers — 5 wrong, 29 missing. Generate or drop

Audit § I, re-verified 2026-08-19 and 2026-09-01. Nine CSS files across `/layout` +
`ui/card` + `ui/base` carry a `@version` header; four match their package (4.0.0), five do
not: `ui/card/media.css`, `media.hover.css`, `media.shapes.css` say **1.0.0** and
`media.tint.css` **1.1.0** against a 4.0.0 package, and `ui/base/scroll.css` says
**2.0.0** — *ahead* of base's 1.0.11. Twenty-nine files have no header at all (the
denominator has grown to 38 sheets outside `dist/`). `media.css` is the sheet it matters
most on — the largest in the package, holding the flag registry and host boundary. A
convention followed correctly by 4 files of 38 misinforms: either generate the header at
build time (`tokens.build.js` already writes generated headers) or delete the convention.

## 21. Cascade layers — the documented order is enforced by nothing `[quick]`

Audit § J, re-verified 2026-08-19 and 2026-09-01. Three parts; the first is the cheap one.

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
  `ui/base/theme.css:5-18`, `ui/base/tint.css:36-56`, the `media.lightbox.css`
  `@keyframes`; and the justification now at `media.lightbox.css:197` is truncated
  mid-sentence — `/* … UNLAYERED: the polyfill sheet is */`.

## 22. Card feature gaps — the remainder of the 2026-08-10 ledger

What was still open in the deleted feature-gap ledger, re-verified 2026-08-19. All
renderer-side, none urgent; the shipped and rejected entries stay in git history.

- **Per-breakpoint format + quality ladder.** The SSR image path applies one
  `quality: 80` to every width (`render.js:293`, `IMG_DEFAULTS` — the ladder is now
  240/320/480/560/720/1200); `format=auto` lets Cloudflare negotiate avif/webp per
  request, which covers most of the ladder's win, but a per-width quality ramp remains
  unbuilt.
- **`width`/`height` on frame images.** The frame `<img>` emission (`render.js:1215-1225`)
  sets srcset/sizes/loading/priority but no `width`/`height`; it needs UCF model fields.
  CLS is already 0 via `asr()`, so this is a nicety, not a defect. (Icons, avatars and
  comparison thumbs already get fixed sizes — `:592`, `:820`, `:2373`.)
- **Renderer i18n.** ~17+ hardcoded English strings — the `keyed()` label helper at
  `render.js:834` alone carries nine ("Cook", "Expires", "Instructor", "Serves", …), plus
  inline literals ("Updated" `:1388`, "Director" `:841`, "Rating" `:520`) — block
  localized consumers. UCF already carries `meta.locale`; the fix is one exported
  `STRINGS` table overridable per `renderCard` call.
- **Smaller, same tier:** an `attr(col-gap)`-derived internal gap (layout coupling —
  wants its own design pass); legacy `timeline` item `location`/`endDate` are rendered
  but never demoed; `statistic` trend-direction styling hooks; a default aspect-ratio
  when the layout declares none; the provider-abstracted transform builder (obsolete
  unless multi-CDN becomes a goal).

## 23. `layout/polyfills/attr-fallback.min.js` does not exist — 35 live pages 404 on it

**Absorbs item 35 (2026-09-01)** — the two entries described the same defect and had
drifted into contradicting each other. Merged state, re-verified against the tree:

The file **has never existed** — no commit contains it, no build emits it.
`layout/polyfills/` holds `attr-fallback.js`, `attr-fallback.css` and `overflow-drag.js`.
Yet **35 v4 files still request it**: `layout/index.html:14`, 22 pages in `layout/dist/`,
10 in `layout/src/pages/` — and the *generator*, `layout/src/demo.js` (template sites
`:23`, `:158`, `:347`), so rebuilding the layout demos **regenerates the 404**. (A
further 54 references sit in the parked `content/card` build output — left alone
deliberately; that package's own build would regenerate them.) Every one 404s, so those
pages run with **no typed-`attr()` fallback in Safari** — missing values, and consuming
properties dying at computed-value time, not wrong values. Chrome never notices (typed
`attr()` is native there); that is the whole trap.

What has been cleaned since the finding: the `ui/card` surface dropped the tag in
`d30be98f` (rather than repointing it, on the expectation that the
`scripts/inline-polyfill.js` mechanism would cover it — its `PAGES` allowlist is still
one page, `:37`, so that coverage never arrived), and `ui/reveal/index.html:22` carries
the tag commented out. The ~28 pages pointing at
`/ui/base/polyfills/attr-fallback.min.js` are fine: that file exists and is rebuilt.
Note the two polyfills cover **disjoint** attribute sets — a page using both `<lay-out>`
and cards needs both (`ui/base/polyfills/readme.md`).

**Severity, unchanged:** Safari 26.5 is **half the supported matrix** (item 28) and does
not implement typed `attr()` — `bleed`, `columns`, `rows`, `max-width`, `self`, `size`
silently not working for half of supported users on 35 pages. Still the
highest-priority item in this file.

Compounding it: `layout/polyfills/attr-fallback.js` (2.9 kB, untouched since Jul 19) has
drifted from the actively maintained `ui/base/polyfills/attr-fallback.js` (8.5 kB, still
moving). **Direction — pick one:** `[quick]` add a minify step to layout's build
(esbuild, as ui/base does) or point the tags + `demo.js` templates at the unminified
file; or the structural fix — retire the layout copy and point everything at the
maintained `ui/base` build, or extend `scripts/inline-polyfill.js` to cover the layout
polyfill (its header explains why the allowlist is deliberately short).

## 24. `mosaic(photo)` writes a dead property — DONE 2026-08-27

Fixed by rewriting the photo mosaic to the collage pattern (spacing multipliers +
theme-deferring plate) rather than patching the pre-rename `--layout-spacing-unit`
spelling; measured 4px gutters in both engines. Full mechanism, measurements and the
breakpoint-cascade note it exposed: git history of this file.

**Still open, and the reason this class of bug is invisible:** a layout JSON's `properties`
keys are never validated. A misspelled or retired custom property is emitted into
`layout/dist/` **verbatim** and does nothing — this one was inert for ~13 months. A lint
over the known `--layout-*` vocabulary at build time would have caught it in 2025 — same
enforced-by-nothing gap as items 20 and 21.

## 25. `lanes` at `xl`/`xxl` — config-gate the static selector, or accept the documented trap

2026-08-19 finding, documented as a caveat in `layout/AGENTS.md` ("Config gap").
`layout.config.json` generates `lanes` for `sm`/`md`/`lg` only, but the static
`@supports` rules in `core/base.css` (`:183` and `:198`) match **all six** breakpoint
attributes (`[xs*="lanes("] … [xxl*="lanes("]`) — so `xl="lanes(4)"` flips masonry on
with no generated track list.

**Measured 2026-08-19 in both engines, and they disagree: Safari renders 1 lane,
Chromium renders 4 columns.** The cause is a **dead fallback**: `core/base.css:68`
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

2026-08-19 finding, re-verified 2026-09-01 (refs exact). The no-typed-`attr()` fallback sheet's animation block
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

## 27. `layout/dist/layout.min.css` drifts with the unpinned minifier — DONE 2026-09-01

`cssnano` and `cssnano-preset-advanced` are pinned exactly (7.1.3 / 7.0.11 in
`layout/package.json`). Verified: `npm run build` reproduces the committed
`dist/layout.min.css` byte-identically, twice — "is `dist/` up to date?" is answerable
by rebuild-and-diff again. History (the `^7.0.7` float, the reorder noise it caused) in
git history of this file.

## 28. Browser-support baseline — DECIDED 2026-08-19

**Chrome 150+ and Safari 26.5+; Firefox is not a support target.** Recorded in root
`AGENTS.md` § Browser support baseline with the three engine divergences it implies.
Residual, not blocking: ~40 per-package "when did this land" readme tables are history,
not a support claim — if they ever start reading as a contract, delete them rather than
maintain them.

## 29. Accessibility standard — DECIDED 2026-08-19

**WCAG 2.1 AA.** Recorded in root `AGENTS.md` § Accessibility (contrast ratios, the muted-
compounding trap, landmarks/heading order, `prefers-reduced-motion` on every always-running
animation, RTL via logical properties) and wired into the gates in `docs/v4.md` § 6, with
Lighthouse accessibility 100 as the demo-page floor in the `perf-pass` definition of done.

**Known non-conformance under it, in priority order:**

1. **Colour contrast — worked down to one design decision plus one CSS fix.**
   Shipped so far (measurements in git history; `open-items § 29` markers sit at the
   retuned tokens in `ui/base/tokens.css`): the light-arm retune of all six text tokens
   (2026-08-19, all clear 4.5); the pale/border ink split — `--_theme-hue-ink`, the hue
   with OKLCH lightness clamped per scheme, mirrored in `ui/chip` (2026-08-19, measured
   5.28–9.71 across both schemes); the `--color-accent-ink` split for the card's seven
   accent-as-text sites (2026-08-19); and the dark-mode accent/button plate retune
   (2026-08-28, both paywall buttons now ≥4.62). The structural proof that one token
   cannot serve text and plate at once (`--color-warning`: no overlapping lightness;
   `theme="pale orange"` measured 1.76 before the split) is in git history.

   **1a. What is left is the PLATE ink** (this sub-label is cross-referenced as
   `§ 29.1a` from `build.shared.js` and `docs/performance.md` — keep it) —
   `--ui-theme-*-c`, the fixed white/dark ink on a solid bundle chip. Measured on the dark arms: orange **1.63**, green **3.18**, accent
   **3.74**, red **4.15** (blue 4.82 passes). **Decide one of:** (a) derive bundle ink
   with `contrast-color(var(--ui-theme-*-bg))` — the pattern `ui/base/tint.css` already
   uses, inside the supported baseline — which frees every dark arm to be tuned for
   text; (b) split the roles into `--color-*` (text) and a separate plate token; or
   (c) accept dark-mode plates below AA and document it. (a) is the recommendation.
   Until then the ink warning sits at `--ui-theme-*-bg` in `tokens.css`. Related,
   pre-existing, both schemes: the hover mix (`color-mix` toward `--color-text`
   *lightens* a dark plate, so hover ink drops to ~3.2).

   **Also still open:** the *muted-compounding* fix — `--ui-content-muted` is 65% and
   `dateline` re-applies it inside an already-muted `byline` (0.65² ≈ 0.42).
   `demo/schema.html` still carries an 85% page override; the real fix is stopping the
   double application in `ui/card/content.css`.
2. **`prefers-reduced-motion` is policy, not verified.** The arms have never been audited
   across the animation engines (`ui/base/animate.css`, `stagger.css`, the beacon/marquee
   always-running set). Related: item 5's RTL stagger failure, where a reduced-motion
   static end state doubles as the workaround.
3. **Native `::scroll-marker` hit-target size has never been audited** — axe cannot see
   pseudo-elements, so nothing has ever checked it.

(2) and (3) are work, not decisions; (1) is one decision (the plate ink) and one bug
(the muted compounding).

---

## 30. `schema.html` — the inline polyfill sits below the stylesheet, serialising CSS and parse

**Where:** `ui/card/demo/schema.html` — `<link rel="stylesheet" href="/dist/demo.24b9298d.min.css">`
at line 15, the `<!-- polyfill:start/end -->` block at lines 42–47 (with an inline
`<style>` and the render-blocking `<link rel="expect">` between them).

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

Shipped: a media item takes `layer`, allowlisted to the six layers OSM can embed
(`OSM_LAYERS` in `render.js`; unknown values render `mapnik`; `tracestracktopo` /
`openmaptiles_osm` unspellable on purpose — no `canEmbed` upstream). `bbox` derives from
the existing `zoom` field; a test asserts all eight `demo/schema.place.html` frames are
reproducible from `layer` + `zoom` + `details.geo`. Vocabulary:
[media.md § Basemap layer](../../ui/card/docs/media.md#basemap-layer--the-one-map-field-the-data-model-does-not-carry).
Full design notes (naming, allowlist rationale, the Google `maptype` question) in git
history.

---

## 33. `schema.place.html` boots six third-party map applications before load finishes

**Where:** `ui/card/demo/schema.place.html` (re-verified 2026-09-01: still eight direct
`<iframe src loading="lazy">` embeds at `:52`–`:283`, no facade of any kind)

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

Shipped: `renderCard(…, { schema: 'jsonld' })` + [`ui/card/jsonld.js`](../../ui/card/jsonld.js),
which reads the structured data back out of the **microdata** as one page-level `@graph` —
one source of truth, no parallel mapping, no equivalence gate needed because the graph is
*derived*. `demo/schema.jsonld.html` is the third twin, generated by
`demo/schema.modes.build.js`. Decisions of record, measured then settled (full numbers in
git history): storing `details` in schema.org shape **rejected** (breaks 67 instances and
authoring ergonomics); moving presentation keys out of `details` **rejected** (the 24
non-schema keys are all `*Display` twins — the suffix already is the separator, documented
in [card.model.md](../../ui/card/docs/card.model.md)); dead `membership.planName` /
`social.hashtags` deleted with a byte-identical snapshot as proof. **One cheap lead left
open:** the pure-alias key renames (`rating` → `aggregateRating`, `website` → `url`,
`servings` → `recipeYield`, `instructions` → `recipeInstructions`, `company` →
`hiringOrganization`) would shrink the mapping table without costing authoring ergonomics.

---

## 35. Folded into item 23 (2026-09-01)

This entry and item 23 described the same defect and had drifted into contradicting each
other ("removed" was true only for the `ui/card` surface; the `layout/` pages and their
generator never lost the tag). The merged, re-verified state — 35 live 404s, what was
cleaned, and the decision options — lives in **item 23**.

## 36. Google Rich Results counts 2 more Local businesses from JSON-LD — RESOLVED 2026-08-20

**No action; do not re-open as a markup defect.** Both documents assert an identical
471-node graph; microdata's 12 LocalBusiness items is the true count and Google's JSON-LD
parser over-reports by two (likely the `department` nodes enumerated twice under
`@graph`). The earlier guess that *microdata* was losing two items is retracted. Same
cause, also no action: the JSON-LD run's "non-critical" Breadcrumbs flag. Full node
accounting in git history.

## 37. `checked`/`crossed` mark colours are page tokens, not theme tokens

`--ui-content-list-checked-mark` defaults to `--color-success`, `--ui-content-list-crossed-mark`
to `--color-error` — the mark tokens themselves are undeclared consumer hooks read in
`ui/card/content.css:566` and `:570` (their trailing `currentColor` fallback fires only
when `tokens.css` is missing, never as a `theme=` arm). The colour tokens they resolve to
are `:root` `light-dark()` pairs in `ui/base/tokens.css:31-32` — the *same* tokens that
produce the `theme="green"` / `theme="red"` surfaces. (`contrast-color()` already has a
precedent a few rules up, `content.css:408-410`, for chip/tag focus ink.)

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

## 39. `schema.compare.js` — ~20 cards on `schema.html` still diverge from their data

2026-08-28 sweep, updated 2026-09-01: `PAIRS` is now **42 entries**
(`schema.compare.js:58-139`). Since the sweep, the two hardest rows were closed —
**ProductGroup** (the 146-line collage, paired in `cecd0ba4`) and **SoftwareApplication**
(sharpened to `VideoGame#schema-videogame`, `71a98908`). The rest still diverge — page
and renderer spell the same card differently, which is exactly the drift the comparator
exists to catch:

| lines | cards |
|---|---|
| 2–4 | Recipe 3 · Event 4 · Dataset 2 · ImageGallery 2 · EducationalOccupationalCredential 3 · SpecialAnnouncement 2 · EventSeries 4 · Review 2 |
| 5–8 | VideoObject 5 · Question 6 · Offer 6 · Quotation 6 · ItemList (comparison) 6 · FAQPage 8 · CreativeWork 8 · PodcastEpisode 8 |
| 12–14 | NewsArticle 12 · Person (profile) 12 · CafeOrCoffeeShop 14 |
| large | DiscussionForumPosting 54 (`social.json` is the plain post, not the forum card — needs its own instance) |

Per card the fix is the usual one: decide which side is the spec (the page, per the
markup-first rule), move the other, add the pair. `[quick]` first step: `Review`
(`schema.html:375`, `:401`) and `EventSeries` (`:1347`, `:1393`) each have two id-less
cards, so the bare selector cannot pick one — give them an `id=`, then work the 2–4-line
rows (~2 min each). Re-run the sweep with a scratch copy of `schema.compare.js` whose
`PAIRS` is the candidate list.


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
`style-performance.md` §8.3. The full mechanism, measurements and original finding live
in `docs/style-performance.md` (§4, §6, §8) and this file's git history.

## 41. Strict-CSP readiness — remove the renderer's `style=` emission (PLANNED, not started)

**The question that prompted this (2026-08-29):** can the layout/card system run under a
strict `Content-Security-Policy: style-src` with no `'unsafe-inline'`? **Audited answer:
runtime style *updates* are already safe — every JS write in `layout/`, `ui/base`,
`ui/card`, `ui/carousel`, `ui/map`, `ui/play`, `ui/dark-mode`, `ui/gui` is CSSOM
(`el.style.setProperty` / `adoptedStyleSheets`), which `style-src` does not govern, and
`setAttribute('style', …)` appears nowhere in the repo.** What blocks strict CSP is
markup-side:

- **(a) `render.js` emits `style="--…"` at six sites** — `styleAttr(preset.styles)`
  (defined `:483`) on hosts at render.js:3336, 3414, 3464, 3476, 3491 (4 published + 31
  demo presets carry `"styles"`) and the per-slide `--ui-carousel-thumb-url` for
  `mrk(tmb)` (render.js:1218).
- **(b)** `ui/carousel/polyfill/carousel.js:22-25` creates a `<style>` element (the
  native-support suppression branch).
- **(c)** other directives the packages need regardless: `font-src data:` (the opt-in
  icon font, `ui/icon/icon-font.css`) and `img-src data:` (dist bundles inline SVGs —
  `scripts/css-bundle.js` `--loader:.svg=dataurl`; the unbundled sources use file URLs).
- **(d)** two documented escape hatches teach `style=` spellings
  (`--ui-lightbox-placeholder-ar`; the `container: bs-card / inline-size` opt-in).
- Demo pages are separately non-strict (38/39 card demo pages have inline `<style>`,
  ~20 carry hand-authored `style=`, three schema pages inline the typed-attr polyfill as
  a classic script, five carry `speculationrules`) — demo-only, hashable, out of scope.

**The plan (execution-ready, CSS-first throughout):**

1. **Preset `styles` → generated stylesheet.** Emit `data-preset="<name>"` on the host
   instead of `style=`; generate `ui/card/presets.css` from the preset JSONs
   (`:where([data-preset="…"]) { --…: …; }`, zero-specificity, `@layer bs-component`,
   imported by `ui-card.css`); drop the five `styleAttr` call sites; regenerate SSR
   pages; update the `schema.html` testimonial reference card (`--ui-rating-c`) so
   `schema.compare.js` stays green.
2. **Carousel thumbs → build-emitted per-page CSS.** Typed `attr()` CANNOT carry this —
   verified in Chromium 141: `type(<url>)` does not parse (`CSS.supports` false), and
   every laundering route (`type(*)`/`type(<string>)` through a custom property into
   `background-image`, or `src()`) computes to `none` under the spec's attr-tainting
   rule (deliberate anti-exfiltration design — do not re-litigate). Instead: render.js
   ensures a frame id when `mrk(tmb)` + `options.images` are active and pushes one rule
   per slide (`#<frameId> > :nth-child(…) { --ui-carousel-thumb-url: url("…") }`,
   slide index computed against the NOT_SLIDE exclusions) into a caller-supplied
   `options.images.thumbRules` sink; the SSR builders write the collected rules as a
   per-page external stylesheet (`style-src 'self'`; a hashed inline `<style>` is the
   documented alternative); `ui/carousel/polyfill/carousel-controls.js:157` reads via
   `getComputedStyle(slide)` so the polyfill sees stylesheet-delivered values; native
   `::scroll-marker` thumbs then work with JS disabled. Update the `_headers` comment
   documenting the old style=-attribute coupling; check render.test for slide-`style=`
   assertions. Without a sink the renderer emits nothing (never the old `style=`); the
   polyfill's `img.currentSrc` derivation remains the last resort.
3. **Polyfill `<style>` → constructed sheet.** `new CSSStyleSheet()` +
   `document.adoptedStyleSheets` (precedent: `ui/map/engine.js:39-41`).
4. **`docs/csp.md`** — the CSP contract: minimum directives after the fixes
   (`style-src 'self'`; `font-src data:` only with the icon font; `img-src data:` for
   dist bundles, or link the unbundled sheets to avoid it), the CSP-safe spellings for
   both escape hatches (host `asr()` token instead of `--ui-lightbox-placeholder-ar`
   inline; `data-preset` instead of `preset.styles` inline), and the demo-page
   exceptions.
5. **Gates when implemented:** SSR snapshot (expected diff: `style=` → `data-preset`,
   thumb `style=` gone), `render.test.js`, `schema.compare.js`, tokens build ×2 + lint,
   bundle rebuilds + page regeneration — and the acceptance test: a product page served
   under an enforced `style-src 'self'` CSP shows **zero** violations from package code
   and renders thumb markers with JavaScript disabled.
---

## 42. Eager `sizes` over-declares on 18 demo pages — the LCP image over-fetches

Found while fixing `schema.html`'s mobile LCP (`docs/performance.md` § Images carries the
mechanism). A lazy image's `sizes="auto"` self-corrects to the real rendered width; the
**eager** image cannot use `auto` (spec: it requires `loading=lazy`), so its written list is
load-bearing. Most demo pages declare a final `100vw` while `body:has(lay-out)` insets the
column, so the browser budgets more than the slot needs and jumps a rung.

Measured at Lighthouse-mobile emulation (412 CSS px, DPR 1.75) on 2026-08-29 — slot,
inset, chosen rung vs the rung that would actually serve it:

| Page | slot | inset | chosen | ideal |
|---|---|---|---|---|
| `articles/article.html`, `news.html`, `news-paywall.html` | 328 | 84 | 1200 | 720 |
| `cards.html` | 348 | 64 | 1200 | 720 |
| `media.collage.html` | 370 | 42 | 1200 | 720 |
| `article.render.html`, `hero.html`, `media.carousel.builder.html` | 376 | 36 | 1200 | 720 |
| `content.html`, `media.carousel.html`, `media.html`, `media.hover.html`, `media.lightbox.html`, `media.shape.html`, `schema.quiz.html`, `schema.recipe.html` | 380 | 32 | 1200 | 720 |
| `media.furniture.html` | 400 | 12 | 1200 | 720 |
| `media.rtl.html` | 116 | 296 | 1200 | **240** |

**The inset is page-specific — there is no blanket subtraction.** `media.rtl.html` is the
extreme: a two-column direction comparison, so the frame is a quarter of the viewport and
it fetches 1200w for a 116 px slot. The nine `32 px` pages share one `sizes` string and one
inset, so they are one batch; the rest want measuring individually.

Three ways to close it, in preference order:
1. **Declare the truth per page** — `calc(100vw - <inset>)`. Correct, and what `schema.html`
   now does. Drifts silently when a layout changes; nothing gates it.
2. **Gate it.** The audit above is ~30 lines of Playwright; as a check it would catch drift
   and every future page. This is the durable answer and it does not exist yet.
3. **A rung near 768.** Mitigation, not a fix — it would make the miss cheaper without making
   the declaration honest, and it costs another pass over the hand-authored srcsets.

Not urgent: the pages still render sharp, and only the LCP image is affected on each.
(Re-verified 2026-09-01: all spot-checked pages still end their eager `sizes` in a bare
`100vw`; no gate script exists under `scripts/`.)

## 43. `lay-out[bleed]` lands one gutter short of the end edge

**Where:** `layout/core/base.css` § bleed (and the generated `layout/dist/layout.css`)

```css
&[bleed] {
	--layout-w: calc(100dvi - var(--layout-mi, 0px));
	margin-inline: min(-1 * var(--layout-mi, 0px), var(--layout-bleed-mw, 100dvi) / 2 - 50dvi);
}
```

The negative margin is applied on **both** inline sides, but the width subtracts **one**
`--layout-mi`. So a bleed band starts flush at the inline-start edge and stops one gutter
short at the inline-end. Measured in Chromium on a page with the layout shell intact,
`--layout-mi: 1rem`, overlay scrollbars, `documentElement.clientWidth` as the reference:

| viewport | band box | short by |
|---|---|---|
| 390 px | `[0, 374]` | 16 px |
| 800 px | `[0, 784]` | 16 px |
| 1400 px | `[0, 1384]` | 16 px |

The subtraction reads like a scrollbar allowance — `100dvi` includes a space-taking
scrollbar while the band's containing block does not — and under a ~16 px space-taking
scrollbar the two happen to cancel. Under **overlay** scrollbars (Chrome on macOS, every
phone) there is nothing to cancel and the gap is visible. That is the same
viewport-vs-container units confusion as the Safari `bleed` note in `docs/v4.md`
§ Known sharp edges, from the other side.

**Consequence today:** the schema detail pages cannot use `<lay-out bleed>` for their
full-bleed phone hero. They use `margin-inline: calc(-1 * var(--layout-mi))` on
`.detail-plate` instead (`ui/card/demo/build.shared.js:54`, § PAGE_STYLE) — exact below 540 px,
where `body:has(lay-out)`'s `max()` always resolves to `--layout-mi`.

Not fixed here because `bleed` is shipped layout API: the change is one declaration but it
moves every bleed band on every page that uses one, so it wants its own verification pass
(`layout/src/pages/bleed.html`, the reveal-stack cage, the Safari `overflow-x: clip` gate)
and a `layout/dist` rebuild.

## 44. Grid-native overlays (`grid-area: 1/1` + `place-self`) — audit done; one candidate family in `ui/reveal`

2026-09-01 audit, prompted by the no-JS `<audio controls>` work: could the absolute+inset
overlay rules across layout / ui-card / furniture move to grid-item stacking
(`grid-area: 1/1` + `place-self`, optionally `contain: size`)? Every `position:` rule in
scope was catalogued (13 in layout+base+reveal+carousel, ~12 in the card sheets, plus the
furniture packages' internals). Verdict: **the pattern is already the house style wherever
it fits; the remaining absolute positioning is load-bearing — except one family.**

**Already implemented** (the precedents any future work should copy):
`stack()` (`layout/core/base.css:126` — `--layout-ga: 1/1` per child, the canonical form);
the card's `ovr()` (`ui/card/ui-card.css:129-148` — `--ui-card-stack: 1/1` + logical
keyword pairs, zero RTL arms); `ui-avatar` (`grid-area: 1/-1` + `place-self: center`);
`ui-icon`; `lay-out-group`'s header link (`core/group.css:71-79`); reveal's `flp`/`sld`
panels (`::details-content { grid-area: 1/-1 }`, `ui-reveal.css:325`, `:396`).
`contain: size` appears **nowhere** in the repo; `ovr()` solves the shared-cell sizing
hazard with `inline-size: 100%; min-inline-size: 0` instead (`ui-card.css:156`).

**Structurally impossible:** `::scroll-marker-group` / `::scroll-button()`
(`ui/carousel/carousel.css:244`, `:635` — UA pseudos of a scroll container, no in-flow box
exists; `anchor()` is the mechanism), reveal `pop` and the open lightbox
(`position: fixed` to the viewport), `[data-sr]`.

**Blocked by the container switching display modes — this covers ALL media-frame
furniture.** `ui-media` is grid by default but **flex** in `nav` mode
(`media.carousel.css:12`), where grid placement does not exist and an in-flow child becomes
a snap slide and shifts `sibling-index()` (which `pages` paging and `mrk(dyn)` read). The
furniture rule is also a *descendant* selector (`media.css:132`), reaching furniture inside
nested collage tiles — grid placement only reaches direct children. Migrating
chip/sticker/beacon/save/play/lightbox for the plain frame would still need the absolute
path kept for carousel mode plus a nested-frame story: **two mechanisms instead of one.**
The prize — deleting the single `:dir(rtl)` arm at `media.css:140` (`--_fx`, the physical
`translate` sign) — is not worth that fork. Same verdict for the scrim/tint pseudos, the
`.ui-media-tools` row, the polyfill's sticky host, and the no-JS audio bar
(whose `inline-size: 100%` is load-bearing: the UA sheet pins `audio` to `width: 300px`,
so inset-stretching alone does not fill the frame — measured 2026-09-01).

**The candidate family — `ui/reveal`.** `details`/`summary` are grids that never
mode-switch, and the panel is already grid-stacked in two of the four animation families:

- **`ico()`/`icc()`** (`ui-reveal.css:173-190`): the default icon is already an in-flow
  grid item (`justify-self: end`, `:125`); the tokens only yank it absolute to pick a
  corner. `grid-area: 1/-1` + `place-self: start start | start end | end start | end end`
  replaces `position: absolute` + the four inset-pair rules and makes the default and the
  positioned icon **one mechanism** — the real win.
- **`scr`** (`:347-353`): in `flp`/`sld` the pseudo is *already* `grid-area: 1/-1`; the
  rule converts it back to absolute purely for `inset: 0` fill — `place-self: stretch`
  should do the same. Verify the inner scroll panel survives.
- **`grw`** (`:409-452`): the `--_scale-*` inset quadruple maps onto the same four
  `place-self` corners, but the corner-anchored `block-size`/`inline-size` transition is
  the load-bearing part — possible, riskiest, least gain. Fine to leave.
- Marginal: the polyfill `mrk(tml)` dot pseudos (`polyfill/carousel.css:265-287`) could
  grid-stack, but the rail must bleed past the label box — skip.

**Recommendation:** leave layout and the media-frame furniture alone; if the pattern is to
be cashed in, do the `ui/reveal` `ico()`/`icc()` (+ optionally `scr`) conversion as one
CSS-only change — light gates (browser-verify both open/closed states at both container
tiers, RTL spot-check, rebuild the reveal `dist/` bundle + demo bundle).
