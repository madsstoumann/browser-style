# v4 Card System — Architecture Analysis & Recommendations

**Date:** 2026-07-26
**Scope:** `ui/card` (`<ui-card>`, `<ui-media>`, `<ui-content>`, overlay furniture), `ui/reveal`, `/layout` (`<lay-out>`, `<lay-out-group>`), the SSR renderer + preset machinery, and the token DSLs (`variant=`, `media=`, `content=`) that bind them.
**Method:** full read of the v4 sources, docs, and demos. Every claim is anchored as `path:line` against the v4 branch at the time of writing.
**Not covered:** the furniture component packages themselves (`ui/chip`, `ui/beacon`, `ui/sticker`, `ui/save`, `ui/play`, `ui/marquee` internals) and `ui/base` — only their card-side routing and contracts.

---

## Executive summary

The v4 architecture is **sound and unusually coherent**: three compact token DSLs writing inherited custom properties, a no-JS-first posture with genuinely optional enhancement modules, two standalone primitives (`<ui-media>`, `<ui-content>`) composed by thin hosts (`<ui-card>`, `<ui-reveal>`), and a layout system that deliberately stays out of the card's container-query space. The design decisions on record (split design doc, standalone `rds()` doc, card-integration doc) are implemented as described, and the parts fit together the way the docs say they do.

The debt that has accumulated is **consistency debt, not structural debt**. The same knowledge — token names, argument vocabularies, palette keys, slide-exclusion lists, custom-property names — lives in four or more hand-maintained places (CSS, two generations of JS, docs, renderer), and those copies have drifted. Almost every defect in this report is an instance of that one problem, and the single highest-leverage fix is therefore to make token knowledge **data**: a published tokens manifest that the CSS conventions, the renderer's merge logic, the docs tables, and the future preset editor all consume (R-13).

Three headline actions:

1. **Promote token metadata to a manifest** (`ui/card/data/tokens.json`). The axis classification the preset system needs already exists in code (`FURNITURE_AXIS`, `render.js:198`); publishing it kills the doc-drift class permanently and gives the preset editor validation for free. → R-13
2. **Declare `media=` on `<ui-media>` the canonical placement.** The renderer should always emit it there; the host arm remains supported for hand-authored HTML. This stops the growth of the "dual arm" selector duplication and is the precondition for retiring it in v5. → R-14
3. **Delete `ui-media.js` and fix the package entry.** The package `main`/`exports` currently point at a superseded 187-line monolith that drifts from the live modules and double-registers global state. → R-02

One shipped demo bug deserves immediate attention: `marquee(loop)` substring-matches the carousel's `[media*="loop"]` selector, so the marquee demos initialize the seamless-loop carousel on single-image frames (F-19).

## Priority table

| ID | Recommendation | Severity | Effort | Track |
|----|----------------|----------|--------|-------|
| R-01 | Fix `marquee(loop)` collision; unify the four slide-exclusion lists | Broken | S | Fix now |
| R-02 | Package entry → `index.js`; delete `ui-media.js`; load the hover handler where demos need it | Broken | S | Fix now |
| R-03 | Pick one `<ui-play>` contract (recommend `command`/`commandfor`) | Contract-mismatch | M | Fix now |
| R-04 | Mark the layout composer (`layout/src/components/composer`) as legacy precursor-system code | Polish | S | Design decision |
| R-05 | Fix the `--_g` private-var leak in `media.video.css` | Debt | S | Fix now |
| R-06 | JS hygiene: single `mediaStr`, single `scan()` path, remove dead `carouselTokens()`, publish or de-document `render.js`/`data/` | Debt | S | Fix now |
| R-07 | Doc sync pass (carousel namespace, `hov()` list, furniture count, stale `thm()`) | Debt | M | Fix now |
| R-08 | One position vocabulary: logical `ts…be` everywhere; RTL-correct scrims | Contract-mismatch | M | Design decision |
| R-09 | One 8-hue palette with declared aliases | Contract-mismatch | S | Design decision |
| R-10 | Single-source the `rds()` definition (multi-placement is by design); add standalone `ui-content` corners; retire alias arg duals | Debt | S | Design decision |
| R-11 | Resolve token homonyms: reveal `scl()`, `ply()`/`play()`; document the marquee band contract | Debt | M | Design decision |
| R-12 | Reveal/card sharing: factor `:is(cq-box, summary)`, fix `align-content` divergence, decide leak-undo vs scoping | Debt | M | Design decision |
| R-13 | **Tokens manifest** — single source of truth for token → axis → property knowledge | — | L | v5 / presets |
| R-14 | Dual-arm strategy: `:where()` factoring now; inherited-flag + `style()` queries in v5; renderer places `media=`/`content=` on the primitives | — | M | v5 / presets |
| R-15 | Sequencing: stop-the-bleeding → vocabulary unification → manifest + presets | — | — | v5 / presets |

Severity: **Broken** = user-visible or import-breaking today · **Contract-mismatch** = API/doc/implementation disagree · **Debt** = internal inconsistency · **Polish** = cosmetic.

---

# Part I — System-level assessment

## 1. Architecture overview (what is deliberately so)

This section records *intent*, so future changes don't accidentally break decisions that look arbitrary but aren't.

**The composition model.** `<ui-card>` is an unregistered element: `display: grid`, `container-type: inline-size`, `overflow: hidden` (`ui/card/ui-card.css:23-38`). Its children are wrapped in `<cq-box>`, the queryable descendant — necessary because the card itself is the (anonymous) container and a container cannot query itself. Every `@container` rule therefore targets `:is(cq-box, summary)`; the `summary` arm is how `<ui-reveal>` (a `<details>`-based host) reuses the entire card rule set with `<summary>` playing the `cq-box` role (`ui/card/ui-card.css:174` onward, `ui/reveal/ui-reveal.css:14-15`).

**Only `<ui-media>` is a registered custom element** (`ui/card/ui-media-srcset.js:131-133`), and registration only adds the responsive-image upgrade. Everything else — card, content, reveal, all furniture — is styled purely by attribute selectors. This is the load-bearing no-JS guarantee: the entire visual system works from two stylesheets.

**Three DSLs, one mechanism.** `variant=`, `media=`, `content=` are space-separated token strings; each token is sugar that writes a custom property (`--ui-card-*`, `--ui-media-*`, `--ui-content-*`), which is why every token has a `style="--ui-*"` escape hatch and why host-placed tokens configure nested primitives at all — custom properties inherit. Two scoping rules differ on purpose:

- `media=` inheritance **stops at the card**: a `<ui-media>` reads the attribute from itself or its nearest `ui-card`/`ui-reveal` host only (`ui/card/shared.js:9-12`), so a `media=` on `<lay-out overflow>` configures the layout's own scroller and never leaks into descendant media frames.
- `content=` **inherits freely** — which is exactly what lets `<lay-out-group>` style its intro header with the same DSL (`layout/core/group.css:37-57`).

**Layout stays out of the card's query space.** `<lay-out>` has `contain: layout inline-size` but deliberately **no** `container-type` (`layout/core/base.css:71`), so a card's `md:`/`lg:` container queries resolve against the card, not the section. The two-axis responsive model (viewport `@media` picks the section pattern; each card's own width picks its internal arrangement) is the system's best idea and is documented in `layout/docs/card-integration.md:23-38`. The only coupling from layout to children is `> *:not(lay-out) { grid-area: var(--_ga, var(--layout-ga, auto)) }` (`layout/core/base.css:96`) — safe because cards never set `grid-area`.

**The SSR path.** `render.js` is a Node-safe string renderer; presets (`data/card.presets.json`) are literally attribute bundles — `{ element, variant, media, content, theme, styles, reveal{} }`. The renderer already understands token *axes*: `mergeMediaTokens()` (`ui/card/render.js:217-231`) strips a preset token that collides with an override on the same `element:axis` before appending, because CSS resolves `media=` by source order, not token order. This is the seed of the preset system (see §Part III).

**Verdict:** all of the above should be preserved. In particular: do not register `ui-card`; do not make `lay-out` a query container; do not let `media=` inherit past the card.

## 2. The dual-arm patterns — analysis and simplification options

"Dual arm" shows up as three distinct patterns in the source. They have different causes and different fixes.

### 2a. Self arm / host arm (`media=` behavior rules)

**Root cause.** A token that writes only an inherited custom property needs **one** rule — inheritance carries the value from wherever the attribute sits down into the primitive:

```css
:where([media*="obp(tl)"]) { --ui-media-op: left top; }   /* works on host OR self */
```

But a token whose effect is a **real property** (`transform`, `scroll-snap-*`, `animation`, `filter`) must have a rule whose subject is *inside* the media frame — and since the attribute may sit on the host **or** on `<ui-media>` itself, the subject is reachable by two structurally different paths, so the rule is written twice:

```css
/* ui/card/media.hover.css:51-54 */
:where([media*="hov(zoom)"]:is(:hover, :focus-within)) ui-media :is(iframe, img, picture, video),
:where(ui-media[media*="hov(zoom)"]:is(:hover, :focus-within)) :is(iframe, img, picture, video) { … }
```

Roughly 60% of `media.hover.css` and `media.carousel.css` selector text is this duplication (the declaration blocks are shared via selector lists; the duplication is in selectors, maintenance, and reading effort). The pattern is named in the source itself — "the component's **own arms**" (`ui/card/media.css:154`), "the **host arm**" (`ui/card/media.carousel.md`).

**F-13 Dual-arm selector duplication** `[Debt]` `[M]` `[→ R-14]`
Evidence: `ui/card/media.hover.css:51-54`, `ui/card/media.carousel.css:10-11`, `ui/card/media.css:115-119`.

Four options, evaluated:

**Option 1 — `:where()` selector-list factoring. Do now; modest win.** Selectors Level 4 `:is()`/`:where()` accept complex selectors, so the two arms can collapse into one selector per rule:

```css
:where(
  [media*="hov(zoom)"]:is(:hover, :focus-within) ui-media,
  ui-media[media*="hov(zoom)"]:is(:hover, :focus-within)
) :is(iframe, img, picture, video) { … }
```

Honest assessment: this saves bytes and reading effort, not behavior — the structural difference (descendant vs self) is hidden, not removed. Use `:where()` (not `:is()`) to preserve the zero-specificity posture. Zero behavior change; safe in every browser the project targets.

**Option 2 — inherited flag + `@container style()`. The v5 pattern.** The token rule becomes state-carrying and single-armed:

```css
:where([media*="hov(zoom)"]:is(:hover, :focus-within)) { --_hov-zoom: 1; }

@container style(--_hov-zoom: 1) {
  ui-media :is(img, picture, video, iframe) { transform: scale(var(--ui-media-hv-zoom, 1.08)); }
}
```

Whether the attribute is on the card or on the frame, inheritance delivers the flag — the dual arm disappears *because the flag inherits*, which is precisely the ability real declarations lack. Style queries on custom properties evaluate against the parent and need no `container-name` plumbing. Three caveats to weigh:

1. **Support.** Style queries are solid in Chromium and Safari 18+, recent in Firefox. The project already ships `style()` queries (`ui/reveal/ui-reveal.css:59-62`, `layout/core/base.css:349-356`) and Chromium-only `::scroll-marker`, so the pattern matches the posture — but hover/zoom currently works in older Firefox and would newly degrade there. That is a real regression class: gate the migration to v5, or start with carousel tokens that are Chromium-leaning already.
2. **Scoping.** Inherited flags pierce the "stops at the card" boundary into nested cards/reveals; a boundary reset is needed (`ui-card, ui-reveal { --_hov-zoom: initial }`) — the same counter-reset pattern reveal already uses (see F-28), so it's a known cost, not a new one.
3. **Transitions** must live outside the query (they do already — the property changes when the query flips, and the standing `transition` picks it up).

A side dividend for presets: an editor can *introspect* live state by reading computed `--_*` flags.

**Option 3 — client-JS attribute forwarding. Reject.** Registering `ui-card` (or observing it) just to copy `media=` onto the child would make styling JS-dependent for host-placed attributes and inverts the system's core bet. `ui-card` being unregistered is a feature.

**Option 4 — SSR canonical placement. Adopt.** The renderer emits attributes anyway; changing `render.js` to always place `media=` directly on `<ui-media>` costs nothing at runtime and makes the host arm serve only hand-authored HTML. Package this as: (1) the `render.js` change, (2) docs declare child placement canonical and host placement "supported, may be reduced in v5", (3) **new** tokens that set real properties get no new dual-arm rules — they use the Option-2 flag pattern from day one, (4) `mediaStr` in `shared.js` stays the single place host-scoping semantics live for JS. One subtlety: a `ui-reveal` hosting `media=` for the summary's frame must still resolve to the `<ui-media>` inside `<summary>` — the renderer handles this, since it builds both.

### 2b. Dual-declared / triple-armed type tokens (`content=` sizes)

Every content size token is declared on the token host **and** on the host's own queryable descendant — three selectors per token (`ui/card/content.typography.css:30-38`, `:372-383`):

```css
:where([content~="tx(lg)"]),
:where(ui-card[content~="tx(lg)"]) > cq-box,
:where(ui-reveal[content~="tx(lg)"] > details) > summary { --ui-content-body-fs: …; }
```

This is a different beast from 2a: `var()` substitution happens where a property is *declared*, so the descendant declaration is what lets a responsive `md:scl()` ladder remap on `cq-box` re-resolve a size declared on the host. **Keep the mechanism** — it is the price of the relational ladder. But:

**F-14 The triple arm is already silently diverging** `[Contract-mismatch]` `[S]` `[→ R-12]`
Evidence: `ui/card/ui-card.css:113-119`.
The arrangement's `align-content` rules are scoped to `> cq-box` **only** — not `:is(cq-box, summary)` like every neighbouring rule — so a `<ui-reveal>`'s summary never receives `align-content: start` (col), `space-between` (col-r), or `stretch` (row/ovr/vis). Same `variant=` value, different result on the two hosts. This is the proof case for factoring one shared `:is(cq-box, summary)` alias (or a shared attribute/class stamped on both) so the arm count is maintained in one place.

**F-15 `scl()` mode tokens break the zero-specificity convention** `[Debt]` `[S]` `[→ R-12]`
Evidence: `ui/card/content.typography.css:103-128`.
`scl(fix)`/`scl(fluid)` deliberately use `:is()` at (0,1,0) so the nearest mode wins, and create a stated one-way door ("an explicit `scl(fluid)` cannot be re-fixed further down"). Acceptable, but it is the only place the cascade posture bends; the manifest (R-13) should record it as a special case.

### 2c. Light arm / dark arm

`--ui-card-bg: light-dark(var(--color-surface), var(--ui-card-dark-bg, #1f2937))` (`ui/card/ui-card.css:24-27`). Already the right pattern; the remaining paired light/dark rule blocks elsewhere should migrate to `light-dark()` wherever both arms set only color-valued properties. One paragraph of work, low priority.

## 3. Vocabulary & namespace audit

These findings are grouped because the durable fix is one mechanism (the manifest, R-13), not eleven patches.

**F-01 Two 3×3 position vocabularies for the same geometry** `[Contract-mismatch]` `[M]` `[→ R-08]`
Evidence: `ui/card/media.css:69-77` vs `:141-149`; `ui/card/ui-card.css:135-143`.
Logical `ts tc te · cs cc ce · bs bc be` is used by furniture placement, `scm()`, `mrk()`, and reveal's `ico()`. Physical `tl tc tr · cl cc cr · bl bc br` is used by `obp()` and `ovr()`. Worse, `ovr()`'s *names* are physical but its *implementation* is logical (`justify-content`/`align-items`/`text-align: start|center|end`) — so `ovr(tl)` renders top-**right** under `dir="rtl"` despite the "l". One vocabulary should win; logical is the correct one (it matches the implementation and the RTL story). `obp()` is the only genuinely physical case (object-position has no logical keywords), and even it can be expressed logically with an RTL flip.

**F-02 `scm()` is logical in name, physical in gradient** `[Contract-mismatch]` `[S]` `[→ R-08]`
Evidence: `ui/card/media.md:379` (self-documented).
Scrim positions use the furniture's `ts…be` spelling, but the gradients are physical (`to bottom right`), so under RTL a `chip(ts)` mirrors and its matching `scm(ts)` does not. `linear-gradient()` has no logical directions; fix with a `[dir="rtl"]` (or `:dir(rtl)`) override swapping the six left/right gradient pairs — six lines, already sketched in the doc.

**F-03 The hue palette is forked three ways** `[Contract-mismatch]` `[S]` `[→ R-09]`
Evidence: `ui/card/media.md:246-249` vs `ui/card/media.tint.css:44-51` vs `ui/card/render.js:200`.
Docs say `red orange green blue accent dark light subtle`; `media.tint.css` implements `red orange green blue accent black white gray`; `render.js` accepts the union plus `slate`. Recommend the implemented set (`…black white gray`) as truth — it ships — with the doc names (`dark/light/subtle`) and `slate` declared as aliases in the manifest, then removed in v5.

**F-04 `rds()`'s multi-placement is by design — but the definition is transcribed twice, and `<ui-content>` lacks it** `[Debt]` `[S]` `[→ R-10]`
Evidence: `ui/card/ui-card.css:53-69` vs `ui/card/media.css:81-95`; no `rds()` in `ui/card/content.css`.
The two placements are deliberate, not duplication: on the card, `rds()` rounds the host and the host's `overflow: hidden` clips the inner areas (`ui-card.css:32-36`), so media/content corners follow their position within the arrangement — media gets the top corners in `col`, one side in `row`, and so on. `rds()` on `media=` serves the standalone frame (per the 2026-06-22 design doc). Keep both. The narrower findings: (a) the token's scale table is *transcribed* twice — parallel `--ui-card-*`/`--ui-media-*` rule blocks with duplicated squircle plumbing that must be kept in lock-step by hand; (b) asymmetry, confirmed by the maintainer as a gap to close: a standalone `<ui-content>` has **no** corner token at all — only the `style="--ui-*"` escape hatch — and no host background token either, so the moment a standalone column gets a surface (via `theme=` or author CSS) there is no token-level way to round it the way a bare media frame can.

**F-05 Token homonyms** `[Debt]` `[M]` `[→ R-11]`
`scl()` means *type scale* on `content=` but *scale animation* on reveal's `variant=` (`ui/card/ui-card-tokens.md:117`). `lgt`/`drk` mean five different things across arms: border shade (`variant="bdr(lgt)"`), scrim intensity (`scm(lgt)`), arrow theme (`arw(lgt)`), chip variant (`chip(lgt)`), and content tone (`tx(lgt)`). The vocabularies are technically disjoint per attribute, so nothing breaks — but a preset editor (and a human) must learn five meanings for one spelling. Rename reveal's `scl()` (content's has the larger usage surface); enumerate the `lgt`/`drk` contexts in the manifest either way.

**F-06 Alias arg duals shipped as permanent** `[Polish]` `[S]` `[→ R-10]`
Evidence: `ui/card/media.css:81, 231, 235`; `ui/card/ui-card.css:53`.
`rds(non)`/`rds(none)`, `scm(shr)`/`scm(sheer)`, `scm(sld)`/`scm(solid)`. Pick the canonical 3-letter forms, mark the long forms deprecated in the manifest, drop in v5.

**F-07 Custom-property naming is uneven** `[Polish]` `[S]` `[→ R-13]`
`--ui-media-hv-zoom` vs `--ui-media-hover-duration` in the same file (`ui/card/media.hover.css:26-32`); `--ui-play-sz` vs `--ui-media-tool-size` (`ui/card/media.video.css:27-39`); the one-off abbreviation `--ui-media-tool-trsdu` (`:66`); `--ui-shape-morph` missing its namespace segment (its partner is `--ui-media-shape`, `ui/card/media.css:118,134`). None of these break anything; all of them make the namespace harder to guess, which matters once presets expose it to editors. The manifest should be the naming linter.

**F-08 `--_g` private var leaks cross-file and never resolves** `[Debt]` `[S]` `[→ R-05]`
Evidence: `ui/card/media.css:127-131` (declared only on chip/beacon/play/save/sticker), `ui/card/media.video.css:49-50` (read on `.ui-media-tools`, which is not in that list — so both reads fall to their fallbacks, and the two fallbacks *differ* in the same rule: `0.5rem` vs `0.75rem`). Declare the gap on the tools menu (or read `--ui-media-overlay-gap` directly) and keep private `--_*` vars single-file, per the system's own convention.

**F-09 `-color` → `-ink` legacy aliases double the surface** `[Debt]` `[S]` `[→ R-13]`
Evidence: `ui/card/content.css:123-322` (every part reads `var(--…-ink, var(--…-color, …))`).
Documented as intentional back-compat (`ui/card/content.md:435`). Fine for v4; the manifest should record `-color` as deprecated so v5 can drop the fallback chain mechanically.

**F-10 The only two classes in an attribute-driven system** `[Polish]` `[S]` `[→ R-03]`
Evidence: `ui/card/media.video.css:46-128`, injected by `video.js:213-214`.
`.ui-media-tools` and `.ui-media-cc` are JS-injected, so they never appear in authored HTML — but they are still the sole deviation from the attribute convention. If they stay, note them as internal; if the `vid()` cluster is revisited (R-03 touches the same file), consider `<menu data-part="tools">`.

**F-11 Two carousel namespaces coexist** `[Debt]` `[M]` `[→ R-07, R-13]`
`media.carousel.css` reads both `--ui-media-*` and `--ui-carousel-*` — sometimes for the same concept (`--ui-media-overlay-gap` vs `--ui-carousel-overlay-gap`, both "control inset"). The docs only know the old namespace (F-24). Whichever way the namespace decision goes, it must land before the manifest freezes names.

**F-12 Nine scrim gradients are declared on every host** `[Polish]` `[S]`
Evidence: `ui/card/media.css:188`.
The nine directional `linear-gradient()` custom properties are declared on `:where(ui-media), :where([media]), :where([variant])` — the `[variant]` arm makes every card carry them whether or not a scrim is used. Custom-property declarations are cheap, but this is the kind of blanket declaration that shows up in style-recalc profiles on large card grids; scoping to `[media*="scm"]` hosts plus `ui-media` would be strictly tighter.

## 4. The JavaScript layer

The CSS layer is disciplined; the JS layer is where v4's history shows.

**F-16 `ui-media.js` is a dead monolith — and the package entry point** `[Broken]` `[S]` `[→ R-02]`
Evidence: `ui/card/package.json:6-11` (`"main": "ui-media.js"`, `exports["."]`), `ui/card/AGENTS.md:129` ("superseded by `hover.js`").
The 187-line legacy file duplicates `hover.js` (older, non-delegated, **no `hov(tilt)`** — `ui-media.js:19` vs `hover.js:44`) and `carousel.js` (fixed 1-clone loop, `scrollLeft` geometry instead of the snap-aware `geom()`), carries its own drifted `NOT_SLIDE` list (F-20), and assigns `globalThis.uiMedia.scan` (`ui-media.js:187`), fighting `index.js:26` when both load. It is not in `build.js:8` `ENTRIES`, so it has no minified twin — yet `import '@browser.style/card'` resolves to it, and `media.render.html:110` still loads it. Delete the file; point `main`/`exports` at `index.js`; sweep the demos/docs that reference it (F-25, F-17).

**F-17 Reveal's `hov(track)`/`hov(drift)` demos are silently static** `[Broken]` `[S]` `[→ R-02]`
Evidence: `ui/reveal/index.html:424-471` (demos), same file contains no script; `ui/reveal/plan.md:787-809` (a fully stale TODO describing an inline handler that no longer exists, under the pre-v4 token name `hv(track)` and prop names `--ui-card-mx/my`).
The live handler is delegated and cheap (`hover.js`); the demo page just never loads `index.js`. One `<script type="module">` line fixes the page; the stale plan.md section should be deleted or marked historical.

**F-18 Three (four counting docs) incompatible `<ui-play>` contracts** `[Contract-mismatch]` `[M]` `[→ R-03]`
Evidence: `ui/card/render.js:293` emits `<button command="--toggle-play">` with **no `commandfor`**; `ui/card/video.js:22,38` handles only `play-pause|play|pause|toggle-muted` and bails on unknown commands — so the rendered button is a no-op twice over. `ui/card/shared.js:23-28` mirrors state via `[open]`+`aria-pressed`; `ui-media.js:151-163` expects a `ui-play-toggle` event; `ui/card/media.md:263` documents a fourth shape (`for="videoId"`, `<ui-icon type="play">` swap). Recommendation: standardize on the invoker-commands path — `command="play-pause"` + `commandfor` targeting the frame's `<video>` (or the frame, with `video.js` resolving) — emitted by `render.js`, handled solely by `video.js`; the event contract dies with the monolith; `media.md` is corrected to the one shape.

**F-19 `marquee(loop)` collides with the carousel `loop` token — shipped bug** `[Broken]` `[S]` `[→ R-01]`
Evidence: `ui/card/carousel.js:160` (`'ui-media[media*="loop"]', ':is(ui-card[media*="loop"], ui-reveal[media*="loop"]) ui-media'`), `ui/card/media.furniture.html:149,158` (`media="asr(4/3) marquee(loop) marquee(red) marquee(sm)"`).
The substring match fires `initLoop` on a single-image frame; and because `<ui-marquee>` is missing from `NOT_SLIDE` (F-20), the marquee itself counts as a second slide — the frame becomes a cloning scroll container. `marquee(seam)` doesn't collide today but sits one token-rename away from the same class of bug. Fix: (a) rename the marquee arg (e.g. `marquee(rpt)`) *or* make `CAROUSEL_SEL` full-token robust — match `(^|\s)loop(\s|$)` semantics via `[media~="loop"]` for the bare token and explicit `auto(`-style prefixes for the parameterized ones; (b) add the manifest lint that fails any `[media*=…]` selector whose needle is a substring of another token (R-13).

**F-20 Four slide-exclusion lists, all different, none complete** `[Broken]` `[S]` `[→ R-01]`
Evidence: `ui/card/shared.js:15` (`UI-BEACON UI-CHIP UI-PLAY UI-SAVE UI-STICKER UI-CAROUSEL-CONTROLS LAY-OUT`), `ui/card/ui-media.js:90` (drops `UI-BEACON`, `LAY-OUT`), `ui/card/media.carousel.css:22-23` (CSS `:not()` list), `ui/card/media.carousel.md:165` (claims the lists match). None includes `UI-MARQUEE`, so under any `nav` token the marquee becomes a 100%-wide slide. Fix: one exported constant in `shared.js` consumed by all JS; the CSS list cross-referenced by comment (or generated); marquee added.

**F-21 Helper and lifecycle duplication** `[Debt]` `[S]` `[→ R-06]`
`mediaStr`/`mediaHost` implemented three times with identical logic (`shared.js:9-12`, `ui-media-srcset.js:31-34`, `ui-media.js:83-86`). `scan()` self-registers in each chunk (`hover.js:50`, `carousel.js:175`, `video.js:289`) *and* in `index.js:26`, and `initVideoPlay` runs from both `carousel.js:172` and `video.js:284` (idempotent, but redundant). After the monolith dies, keep one helper in `shared.js` and one registration path in `index.js`.

**F-22 `carouselTokens()` is unreachable** `[Debt]` `[S]` `[→ R-06]`
Evidence: `ui/card/render.js:237-252` folds legacy `preset.nav/arrow/mrk` fields that no preset file contains and no doc admits (`AGENTS.md:80`, `card.md:194`). Delete.

**F-23 The published package omits its documented API** `[Contract-mismatch]` `[S]` `[→ R-06]`
Evidence: `ui/card/package.json:30-50` `files` excludes `render.js`, `data/`, `demo.layout.css` — but `card.md:268-293` and `AGENTS.md:132` document `render.js` + presets as public API. Either add them to `files` (recommended — the preset system will need them published) or mark them repo-internal.

## 5. Documentation drift — the pattern

Individual instances (fix in R-07, prevent in R-13):

**F-24** `media.md:414-458` and `carousel.md:400-430` document a `--ui-media-marker-*` / `--ui-media-pill-*` / `--ui-media-band` namespace; the code writes/reads `--ui-carousel-*` (`carousel.js:105,120-121`, `media.carousel.css:87-118`). Only `media.carousel.md` is current.
**F-25** `hov()` is documented as 4 values (`media.md:118`), implemented as 17 (`media.hover.css` + `media.tint.css:56`); `media.md:174` says tilt is "gone in v4" while `hover.js:44` and `media.hover.css:87-98` ship it. Docs also still name `ui-media.js` as the live JS in six files.
**F-26** Furniture is counted as four (`readme.md:235`), five (`media.md:190`), and the code has six.
**F-27** Minor: demo preset count 121 vs 126 (`card.md:264`); commented-out CSS in shipped source (`media.video.css:116`); `--ui-content-fs-2xl` intentionally token-less (fine, but manifest-worthy).

The pattern, not the instances, is the finding: **the docs are hand-maintained parallel truth**, and this system's token tables are exactly the kind of content that should be generated. The layout package already proves the approach in-house — `build.js` generates `dist/layout.css` from `layouts/*.json`. R-13 applies the same move to token reference tables.

---

# Part II — Per-component notes

## 6. `ui-card` / `cq-box` / `ui-content`

**Role.** Thin composition host + queryable wrapper + text primitive. The `content=` system is the most polished DSL in the codebase: four part groups with disjoint tone/size/weight vocabularies, the relational `scl()` ladder with saturation, `fix`/`fluid` as modes, deep fallback chains (part → legacy alias → group → global → literal, e.g. `content.css:154`).

**Local findings.** F-14 (`align-content` never reaches `summary`), F-15 (`scl()` mode specificity bend), F-09 (`-color`/`-ink` aliases). One more:

**F-28a `ovr()` writes into the content namespace by design — keep.** The host's `ovr()` sets `--ui-content-ov-*` placement/ink and the matching scrim default; standalone content gets inert `normal`/`inherit` defaults. This is the correct primitive boundary and a model for how the preset system should think about cross-primitive effects (host token → two namespaces).

**Preset-readiness:** high. `content=` tokens are whole-token matched (`~=`), single-vocabulary, and all write custom props — the arm problem barely exists here (only the type-token triple arm, which is structural).

## 7. `ui-media`

**Role.** The media frame: ratio/fit/position/flip, hover effects, scrims, shapes, tint, carousel, video layer, and the furniture grid. The scrim's three orthogonal axes (`scm(bc) scm(lg) scm(drk)` — direction × size × intensity, `media.css:179-186`) are the cleanest expression of the system's compose-atomic-tokens grammar and should be the template for future multi-axis tokens.

**Local findings.** F-01/F-02 (position vocab, RTL scrims), F-07 (naming), F-08 (`--_g`), F-11 (carousel namespaces), F-12 (blanket gradient declarations), F-10 (injected classes). The nested-frame rule (`media.css:628` note: plain `ui-media ui-media` at (0,0,2) out-specifies carousel descendant rules) is clever and documented — fine.

**Preset-readiness:** medium. The DSL is rich but three things bite an editor: substring-matched selectors (F-19's root enabler), the forked hue palette (F-03), and behavior tokens whose JS requirements are invisible in the grammar (`hov(track)` needs a module; `nav` needs none). The manifest should carry a `requiresJs` field per token.

## 8. Furniture

Shared contract: absolutely positioned children of `<ui-media>`, configured **only** from the parent `media=` string, placed on the logical 3×3 grid via five identical selector groups (`media.css:141-149`), themed via sub-theme keys routed to each element's own tokens, RTL-safe via logical insets. Markers (`ui-chip`, `ui-beacon`, `ui-sticker`) are phrasing content and summary-safe; controls (`ui-save`, `ui-play`) are card-only. The "position and theme are two atomic tokens, never `chip(tl dark)`" rule (`media.md:253`) is consistently enforced, including in the renderer (`render.js:279-280`).

Per element:

- **`ui-chip`** — conformant. Default `ts`, hue/variant/size args, reuses `ui/chip`.
- **`ui-beacon`** — conformant, largest arg surface (face/animation/size/corner axes all as atomic tokens). Reduced-motion gating done right.
- **`ui-sticker`** — conformant; multi-line children model and `sh:*` shape args are manifest-friendly.
- **`ui-save`** — conformant; checkbox-based state with zero JS is exemplary.
- **`ui-play`** — two deviations: **F-41** `[Debt]` `[S]` `[→ R-11]` it is the only element whose two axes use different stems (`play(<pos>)` positions, `ply(<size>)` sizes — everything else sizes via `el(<size>)`); and its carousel `position: sticky` variant covers only 6 of the 9 cells (`media.carousel.css:77-82` — `tc`, `cc`, `bc` missing). Plus the contract chaos of F-18.
- **`ui-marquee`** — **F-40 a band, not furniture — by design; its citizenship is the debt** `[Debt]` `[M]` `[→ R-11]`. Maintainer-confirmed: unlike the small furniture elements (placeable anywhere on the 3×3 grid), the marquee is a **full-width band** within its parent — the "BREAKING NEWS" banner case — valid only at the top or bottom. Its bespoke `top/bot` vocabulary and its exclusion from the shared furniture rule (own rule at `z-index: 1`, `media.css:155-157`) are therefore *distinctions*, not defects. It also has **two placement models by design**: inside `ui-media` it is an overlay, so placement is token-controlled (`marquee(top|bot)`); inside `ui-content` it is simply placed in the markup — flow order gives top/bottom, no tokens involved. The remaining, real debt: absent from every furniture/band table in the docs, from `render.js`'s `buildFurniture`, and from every slide-exclusion list (F-20); and its `loop` arg collides with the carousel token (F-19).

## 9. `ui-reveal`

**Role.** `<details>`-based disclosure that imports the entire card system and folds its own config into `variant=` tokens. The `--_rvl` animation-dispatch flag (`ui-reveal.css:25,59-62`) — geometry enumerated once per animation behind `@container style(--_rvl: …)`, with `lg:scl` just re-flipping the flag — is the in-house proof that the Option-2 flag pattern (§2a) works.

**The leak-undo pattern (F-28)** `[Debt]` `[M]` `[→ R-12]`. Card rules written as host-scoped descendant selectors leak into the revealed panel, and reveal counter-resets them one by one: `ovr()`'s ink/placement/z (`ui-reveal.css:92-101`), `vis(media)`'s `display: none` (`:95`), the `ovr()` grid-area (`:97`), double padding (`:103`). This works but is O(number of leaky card rules) and each new card feature is a potential new leak. The alternative — scoping card rules to the front face (`:is(cq-box, summary)` subjects rather than bare descendants) — is a v5-scale change; for now the report's recommendation is to **inventory the undo list as a checklist in `ui-reveal.css`'s header** so new card tokens get audited against it, and let the manifest's `needsArm`/`leaks` metadata carry it long-term.

**Local findings.**
**F-29** `[Contract-mismatch]` `[S]` `[→ R-07]` Stale `thm()`: removed from the card in v4 (`ui-card-tokens.md:104-106`) but still documented as live in `ui/reveal/readme.md:106,210` and shipped in the demo (`ui/reveal/index.html:180` — a no-op `variant="thm(dark)"`). Worse, `ui-reveal.css:107`'s comment says the panel's scale-decoupling reset is skipped "when the back has no **variant**" while the selector tests `:not([content])` — two different attributes, and the demo markup sets both, so the intended self-theming silently doesn't happen.
**F-30** `[Polish]` `[S]` Stale pre-v4 token names in comments (`ui-reveal.css:157-158` "vertical-r / media-only"; `plan.md`'s selector section); the `ovr()` token vs `--ui-content-ov-*` prop-stem mismatch makes grepping unreliable (pick one spelling in v5).
**F-31** `[Debt]` `[S]` `[→ R-06]` Renderer divergence: `render.js:793-801` always emits `<ui-face>` (readme says only `flp/scl/sld` need it), `:831` always emits the icon even under `trg(card)`, and `:830` hard-codes `<details name="render-reveal">` — every rendered reveal on a page joins one exclusive-accordion group whether intended or not. The preset `reveal{}` schema needs a `name` field with no default.
**F-32** `[Debt]` `[S]` The popup escape hatch ships an **unlayered** selector reaching into the layout element (`ui-reveal.css:508-510`: `lay-out:has(ui-reveal[variant~="exp"][variant~="pop"] > details[open]) { contain: inline-size }`). It works, but it is the card package patching the layout package's containment at a distance; note it in both packages' docs, and consider moving it into layout's own sheet where its `contain` contract lives.
**F-33** `[Polish]` `[S]` `--ui-reveal-icon-bg: #000; /* TODO! */` (`ui-reveal.css:186`) — the only hard-coded colour outside the theme system.

## 10. `lay-out` / `lay-out-group`

**Role.** Viewport-breakpoint grid generated from `layouts/*.json` by `build.js`/`src/builder.js` (layered output, cascade-safe rule grouping, mobile-first unqueried base), plus the section wrapper whose intro header is a card-system `<ui-content>` — the cleanest demonstration that `content=`'s free inheritance was the right call. The `ui-content`-not-`header` choice (avoids a stray `banner` landmark) is documented and correct.

**Local findings.**
**F-34** `[Polish]` `[S]` `[→ R-04]` `layout/src/components/composer/` is **legacy precursor-system code** — a schema-driven configurator (`model.json`, `model.proposal.md`) from the component generation that preceded `ui/card`; the docs already flag it as pre-v4 (`AGENTS.md:770-771`). The barrel export at `layout/src/components/index.js:10` (re-exporting a `LayOutConfigurator` from a nonexistent `./configurator/` path) is a symptom of that legacy status, not live debt — though it does mean the documented entry `@browser.style/layout/components` (`package.json:27`) currently throws, which also blocks importing the still-live `LayOut` srcset component from it. Treat as legacy: see R-04.
**F-35** `[Contract-mismatch]` `[S]` Two config shapes share one name: `layout.config.json` uses `layoutContainer.maxWidth`, while `src/components/layout/index.js:41` and `src/srcsets.js:3` read a flat `maxLayoutWidth` shape (produced by `layouts-map.js:67-77`). Passing the wrong one silently yields `@1024` defaults. Rename one (e.g. `srcsetConfig`).
**F-36** `[Debt]` `[S]` `[→ R-07]` `layout/index.html` is thoroughly stale: loads a non-existent `dist/content.min.css`, uses the removed `animation=` attribute, references layouts absent from every `layouts/*.json` (`bento(1lg:2sm-right)`, `stack(b-r)`, …). `dist/section.html`'s comments likewise lag its own markup. The composer is flagged pre-v4 by the docs themselves (`AGENTS.md:770-771`).
**F-37** `[Debt]` `[S]` The builder appends the `body:has(lay-out)` container CSS **outside all layers** (`src/builder.js:488-527`) — already on record as Phase-6 debt in `docs/card-integration.md`; still outstanding.
**F-38** `[Debt]` `[L]` Subgrid can't reach card parts: `subgrid(on)` affects direct children only, and a card's parts sit two wrappers deep (`ui-card > cq-box > …`), so aligning media/content rows across a deck currently needs demo-local `display: contents` hacks (`layout/demo-assets/wpp.css:86-90`). The planned card `sub` variant (`ui/card AGENTS.md:160-178`) is the right fix and pairs naturally with the preset system (a deck preset would set it).

**Roadmap notes found in-repo** (context for prioritization, not defects): `card-integration.md` Phases 2–6 are specified and unbuilt — including the srcset bridge (`calculateSizes` injected into `ui-media-srcset.js`, never a hard dependency) and the `renderSection()` section-preset renderer, which is effectively the layout half of the user's preset plan. `.tmp/todo.md` is a full unstarted v2 restructuring plan whose Phase 1 landed differently; `.tmp/readme.md` documents a superseded srcsets API — both should be pruned or re-dated to stop misleading future sessions.

## 11. Renderer & presets (the existing seed)

`render.js` (941 lines, Node-safe, everything escaped) + `card.presets.json` (17 presets) + `card.presets.demo.json` (126) already embody the preset model: **a preset is a named bundle of the three attribute strings plus structured furniture/reveal objects.** The critical asset is `mergeMediaTokens` + `FURNITURE_AXIS` (`render.js:190-231`): overrides are merged by `element:axis` (pos/hue/size/variant/shape/anim/face/disc), because source order — not token order — decides in CSS. That axis table *is* the manifest's first draft.

Local defects: F-22 (dead `carouselTokens`), F-23 (`files` omits the renderer), F-31 (reveal emission divergences), and `buildFurniture` not knowing `ui-marquee` (F-40).

---

# Part III — Recommendations

## R-01 — Kill the `loop` collision; one exclusion list `[Fix now]`
(a) Rename the marquee arg (`marquee(rpt)` or similar) — it's demo-only surface today, cheap to change; (b) harden `CAROUSEL_SEL` to whole-token semantics (`[media~="loop"]` for bare flags; keep `[media*="auto("]`-style needles only where the token is parameterized and unambiguous); (c) export one `NOT_SLIDE` from `shared.js`, consume it in all JS, add `UI-MARQUEE`, and cross-reference the CSS `:not()` list to it; (d) fix `media.carousel.md:165`'s false claim that the lists match. Files: `carousel.js`, `shared.js`, `ui-media.js` (deleted by R-02 anyway), `media.carousel.css`, `media.furniture.html`.

## R-02 — Package entry + dead code `[Fix now]`
Point `package.json` `main`/`exports["."].import` at `index.js`; delete `ui-media.js`; update `media.render.html` to load `index.js`; add one module script to `ui/reveal/index.html` so the `hov(track)`/`hov(drift)` demos work; delete or mark historical `plan.md`'s stale handler TODO; sweep the six docs naming `ui-media.js` as live (part of R-07). Risk: consumers importing the package root today get the monolith's side effects — the changelog should call out that the root export now wires `hover/carousel/video` scanning instead.

## R-03 — One `<ui-play>` contract `[Fix now]`
Standardize on invoker commands: `render.js` emits `command="play-pause" commandfor="<video id>"`; `video.js` remains the only handler; `shared.js`'s `[open]`/`aria-pressed` reflection stays; the `ui-play-toggle` event contract dies with the monolith; `media.md:263` rewritten to the one shape. Presets then describe play buttons declaratively with confidence.

## R-04 — Mark the layout composer as legacy `[Design decision]`
`layout/src/components/composer/` is precursor-system code (schema-driven, pre-`ui/card`) and should be ignored, not fixed. Minimal action: drop the stale `LayOutConfigurator` line from the barrel (`layout/src/components/index.js:10`) so `import { LayOut } from '@browser.style/layout/components'` works again for the still-live srcset component, and add a "legacy — superseded by ui/card" note to `src/components/README.md` (or move `composer/` to an archive folder). F-35's config-shape collision remains a small live item (it affects `src/components/layout` + `src/srcsets.js`, which are current).

## R-05 — `--_g` leak `[Fix now]`
Declare the gap on `.ui-media-tools` (or read `--ui-media-overlay-gap` with one consistent fallback). Re-assert the convention in `AGENTS.md`: `--_*` vars are single-file.

## R-06 — JS + publishing hygiene `[Fix now]`
Single `mediaStr` (in `shared.js`), single `scan()` registration (in `index.js`; chunks stop self-registering), drop the duplicate `initVideoPlay` call, delete `carouselTokens()`, add `render.js` + `data/` to `files` (they are documented public API and the preset system's substrate), fix render.js reveal emission (F-31: `ui-face` only when needed, no icon under `trg(card)`, `name` from the preset, never defaulted).

## R-07 — Doc sync pass `[Fix now]`
One pass, mechanical: carousel token tables re-pointed at `--ui-carousel-*` (or the namespace unified first — see F-11; do that decision first), `hov()` table listing all 17 values with their JS requirements, furniture tables listing all six elements with the marker/control/band distinction, stale `thm()` removed from reveal docs + demo, `ui-reveal.css:107` comment/selector reconciled (decide which was intended — the selector's `:not([content])` or the comment's variant test — and make both say it), preset count corrected. This pass is worth doing even though R-13 later generates these tables: it establishes the correct content to generate.

## R-08 — One position vocabulary `[Design decision]`
Adopt logical `ts…be` everywhere. Concretely: `ovr()` accepts `ts…be` (its implementation is already logical — this is a *rename of the args to match reality*); old physical spellings kept one minor version as deprecated aliases with a console-free CSS-only mapping (both selectors present, manifest marks the alias). `obp()` stays physical-valued internally (object-position has no logical keywords) but accepts the logical spellings and adds a `[dir="rtl"]` flip, so authors learn exactly one grid. Scrims get the six-pair `[dir="rtl"]` gradient swap sketched in `media.md:379`. Migration table ships in the manifest so the preset editor can offer auto-upgrade.

## R-09 — One hue palette `[Design decision]`
Truth = implemented set `red orange green blue accent black white gray` (matches the `--ui-theme-*` bundles and the neutral ramp `white < gray < slate < black` used by `theme=`). `dark/light/subtle` and `slate` become declared aliases (manifest), removed v5. `render.js:200` then validates against the manifest instead of its own union set.

## R-10 — Single-source the `rds()` definition; content-corner symmetry; retire arg duals `[Design decision]`
The multi-placement model is by design and stays as-is: the card's `rds()` rounds the host and clips the inner areas through `overflow: hidden`, so media/content corners follow the arrangement's axis/order; `rds()` on `media=` serves the standalone frame. What should change: (a) single-source the *definition* — one scale table generating both the `--ui-card-*` and `--ui-media-*` rule blocks (a natural early consumer of the R-13 manifest), or at minimum colocated rules with a shared comment contract and the squircle exponent map defined once; (b) **add `rds()` to `content=`** (same scale, writing `--ui-content-radius`; guarded standalone-only like media's, since inside a card the host clips) — confirmed direction: a standalone `<ui-content>` with a background set (via `theme=` or author CSS) currently has no token-level corners, and presets can emit it as a bare primitive; (c) retire the `rds(none)`, `scm(sheer)`, `scm(solid)` long forms per F-06.

## R-11 — Token homonyms and the marquee decision `[Design decision]`
Rename reveal's `scl()` animation token (suggestion: `grw()` or `zom()`); content's `scl()` keeps the name. Fold `ply()` into the furniture-standard `play(<size>)` — position/hue/size args are already disjoint vocabularies, so the single stem parses unambiguously, and it removes the system's only two-stem element. Marquee (confirmed direction): document the **furniture-vs-band** distinction in `media.md` — marquee is a full-width band, token-positioned `top`/`bot` when overlaid in `ui-media`, markup-positioned (flow order) inside `ui-content` — give it exclusion-list and renderer citizenship, and de-collide its args (R-01).

## R-12 — Card/reveal sharing hardening `[Design decision]`
Factor the queryable-descendant pair into one place: a shared selector alias used by every rule that today hand-writes `> cq-box` or `:is(cq-box, summary)` — the `align-content` divergence (F-14) is the existence proof that hand-maintenance fails. This same pass should add the responsive `ui-content[content~="md:…"]` self arms required by R-14 step 3 (canonical `content=` placement) — it edits the identical rule set. Cheapest robust form: stamp a common attribute on both wrappers at authoring time is *not* available (no JS), so the discipline is textual — a single `/* CQ-DESCENDANT */`-marked `:is(cq-box, summary)` pattern, plus a checklist in `ui-reveal.css`'s header enumerating the card rules that leak into the panel (the undo list, F-28), auditable on every new card token. Long-term (v5): move card rules to front-face-scoped subjects so the undo list shrinks toward zero.

## R-13 — The tokens manifest `[v5 / presets — headline]`
Create `ui/card/data/tokens.json` (sibling of `card.presets.json`), one entry per token:

```jsonc
{
  "hov": {
    "attribute": "media",
    "axis": "hover",
    "args": ["zoom","pan","track","drift","tilt", "…"],
    "aliases": {},
    "writes": ["--ui-media-hv-*"],
    "realProperties": true,        // needs an arm strategy (§2a)
    "cqPrefixes": false,           // md:/lg: support
    "hosts": ["ui-media","ui-card","ui-reveal"],
    "requiresJs": ["track","drift"]
  }
}
```

Consumers, in order of payoff:
1. **`render.js`** — `FURNITURE_AXIS` and the hue/arg validation tables become manifest lookups; `mergeMediaTokens` semantics become data-driven and therefore identical for the future preset editor.
2. **Docs** — the token reference tables in `media.md`/`content.md`/`card.md`/`carousel.md` are generated (layout's `build.js` already proves the JSON→artifact pipeline in-house). Doc-drift class F-24…F-27 becomes structurally impossible.
3. **Lint/test** — a small script asserts: every `[media*=…]` needle in the CSS corresponds to a manifest token and is not a substring of any other token or arg (catches the next `loop`); every doc-listed arg exists; every alias maps to a canonical form.
4. **Preset editor** — validation, autocomplete, and axis-aware merging come free; `requiresJs` tells the editor which tokens need a module loaded.

Invariants the preset system needs, stated as manifest-enforced rules: whole-token uniqueness (no substring shadowing), one vocabulary per axis (R-08/R-09 land first), single-owner tokens (R-10/R-11), canonical `media=` placement (R-14), and every token declared with its merge axis.

## R-14 — Dual-arm strategy `[v5 / presets]`
Adopt in four steps (full analysis in §2):
1. **Now:** `:where()` selector-list factoring in `media.hover.css`/`media.carousel.css` — zero behavior change, halves selector maintenance.
2. **Now:** `render.js` always emits `media=` on `<ui-media>`; docs declare child placement canonical. New real-property tokens get no new dual arms — they use the flag pattern.
3. **Symmetric `content=` placement** (maintainer-confirmed direction): the renderer emits `content=` on the `<ui-content>` it configures — which also unifies an existing renderer inconsistency (standalone `element: "ui-content"` presets already place it on the element, `render.js:902-903`, while cards/reveals place it on the host, `:825`/`:916`). **Prerequisite:** the responsive `md:`/`lg:` content rules currently have *no self arm* — they declare on the host's queryable descendant only (`:where([content~="md:gap(sm)"]) :is(cq-box, summary)`, `ui-card.css:199-201`; same shape for `md:scl()`/`md:hl()`, `content.typography.css:219,502`), so `content="md:…"` on `<ui-content>` silently no-ops today. Add self arms first: `@container` rules targeting `ui-content[content~="md:…"]` work as-is (the card remains ui-content's nearest query container) and nearest-wins precedence holds (a declaration on `ui-content` beats one on `cq-box`). Do this in the same pass as R-12's `:is(cq-box, summary)` factoring — it touches the identical rules. **Unlike `media=`, ancestor placement of `content=` is not legacy**: free inheritance is a live feature (`lay-out-group` headers, deck/section-level bulk configuration) and stays the documented author mechanism; `variant=` stays on the host by nature (it arranges the two children). Side benefit: child placement stops a host `content=` from leaking into *nested* cards' content — the leak the type ladder currently counters with its nearest-host-wins dual declarations (`content.typography.css:36-38`).
4. **v5:** migrate existing real-property tokens to inherited `--_*` flags + `@container style()` (the pattern reveal's `--_rvl` already proves), with boundary resets on `ui-card, ui-reveal` to preserve the stops-at-card contract, accepting the older-Firefox degradation as a v5 support-posture decision.

## R-15 — Sequencing
1. **Stop the bleeding** (R-01…R-03, R-05…R-07): all S/M, no design input needed, immediately shippable.
2. **Vocabulary unification** (R-04, R-08…R-12): needs the maintainer's calls; must land **before** the manifest freezes names. (R-04 is just a legacy-marking note — zero urgency.)
3. **Manifest + presets** (R-13, R-14): the manifest is the preset system's foundation — build it from the unified vocabulary, port `render.js` onto it, then the preset editor and generated docs follow.

---

*Report generated from a full-source review of the v4 branch. Line references are valid as of the commit this file is introduced on.*
