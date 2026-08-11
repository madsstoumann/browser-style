# Session start — browser.style v4 layout / card / content / media system

> Orientation for a new working session on the v4 design-system line. The root
> CLAUDE.md auto-loads AGENTS.md + docs/design-system-agent.md, and
> ui/card/AGENTS.md loads when you touch ui/card — this file adds the operational
> knowledge on top: reading order, the load-bearing facts that are easy to get
> wrong, the verification gates, and the known sharp edges.

## Read first (in this order)

0. **Structure changed 2026-08-03** — `ui/card/` demos live in `demo/`, docs in
   `docs/` (readme/AGENTS stay at root); the carousel engine moved from
   `ui/base/carousel.css` + `/polyfill/` into a new `@browser.style/carousel`
   package at `ui/carousel/`; every package ships a peer-exclusive `dist/` bundle.
   Decisions + rationale: `docs/plans/2026-08-03-card-system-structure-decision.md`.
1. `ui/card/AGENTS.md` — the card system's architecture: the three attribute DSLs
   (variant= / media= / content=), their different scoping rules, the bs-card
   container-query model (host arm via cq-box/summary + self arm), presets/renderer,
   ui/reveal, layout integration, JS modules, pitfalls. This is the master map.
2. `docs/plans/open-items.md` — the short list of what is actually still open on this
   line, and why each one is waiting. Read it before picking up work; it is four items
   long by design.
3. `ui/card/data/tokens.json` — THE source of truth for every token in the three
   DSLs. Generated FROM it: `tokens.data.js` (the renderer's import), `tokens.md`,
   and marker-injected tables (`<!-- tokens:… -->`) inside the hand-written docs.
   Never edit generated tables by hand; edit the manifest, then
   `node ui/card/tokens.build.js`.
4. `layout/AGENTS.md` — the `<lay-out>` system: viewport breakpoints (xs 240 base /
   sm 380 / md 540 / lg 720 / xl 920 / xxl 1140), builder-generated CSS from
   layouts/*.json, spacing tokens, one-way bare `subgrid`, overflow scrollers. The
   spacing ladder has **two spellings of one vocabulary**: numeric steps `0`–`4` and
   word sizes `2xs` (0.125) `xs` (0.25) `sm` (0.5) `md` (1) `lg` (1.5) `xl` (2)
   `2xl` (3), all multipliers of `--layout-space-unit`, all generated from the same
   `steps` array in `layout.config.json`. They mix in one attribute.
5. Per-topic docs when relevant: ui/card/{carousel,media,content,card,stagger}.md,
   media.carousel.md (internals), ui-card-tokens.md, ui/reveal/readme.md,
   layout/docs/card-integration.md, polyfill/readme.md (Safari carousel controls).
6. `docs/gpu-performance.md` — the CPU/GPU split: which properties composite, the four
   ways this codebase de-optimises one, the `will-change` policy (and why there are still
   zero of them), and the measured cost of every always-running animation. Read it before
   adding a transition, a keyframe, or a `will-change`.
7. `docs/plans/2026-07-26-v4-card-system-architecture-analysis.md` — **archive.**
   History and rationale for every F-xx/R-xx; read it for *why*, not for *what's
   next*. Parts are superseded (marked inline).

## Load-bearing facts that are easy to get wrong

- **DSL scoping differs**: media= inheritance STOPS at the card host (ui-media reads
  itself or nearest ui-card/ui-reveal only); content= is pure custom-property
  inheritance and flows through anything (lay-out-group included); variant= sits on
  hosts only. Carousel controls are media= tokens ONLY — never reintroduce
  standalone attributes (nav=/arrow=/dot= were removed deliberately).
- **Two responsive axes, never confuse them**: lay-out md=/lg= are VIEWPORT @media
  breakpoints; card md:/lg: token prefixes are CONTAINER queries against the named
  bs-card container (md: 25rem, lg: 44rem of the card's own width). lay-out is
  deliberately NOT a container.
- **Cascade layers**: card CSS lives in @layer bs-component, layout CSS in
  @layer layout.* — and layout.* OUTRANKS bs-component by declaration order. A
  card-side rule that must beat a layout-side declaration ships UNLAYERED (existing
  precedent: the reveal popup escape hatch, the media="pages" dissolve). Check
  computed styles before assuming a layered rule applies.
- **Selector discipline**: zero-specificity :where() everywhere; substring
  [media*="…"] vs whole-token [media~="…"] matching is deliberate per token (bare
  `loop`/`auto`/`pages` are whole-token so they can't cross-fire with parameterized
  or substring cousins). The manifest records each token's matching mode.
- **One position grid** (ts tc te / cs cc ce / bs bc be) across furniture, ovr(),
  scm(), mrk(), arw(), plc(), obp(), reveal ico() — no physical (tl…br) vocabulary
  remains; obp() was the last and lost it in v5. Where the property has no logical
  form (object-position, linear-gradient directions) the inline letter resolves
  through ONE shared pair,
  `--_dir-s`/`--_dir-e` in ui/base/core.css — never a per-family :dir(rtl) arm.
  Adding one is the regression. Escape hatch for a non-mirroring focal point:
  set --ui-media-op directly. Still on invented direction words, not yet migrated:
  marquee(top|bot), flp/sld(top|btm|lft|rgt). One hue palette of nine (red orange
  green blue accent black white gray slate); dark/light/subtle were removed in v5,
  slate was promoted to canonical.
  `pages` means "paged carousel" in both contexts: math paging on
  `<lay-out overflow>`, wrapper-dissolve-below-md on a `<ui-media>` scroller.
- **Renderer**: render.js is Node-safe string SSR; everything escapes via esc();
  never innerHTML with data. cq-box is hand-authored, never auto-inserted.
  slidesOf()/NOT_SLIDE in shared.js is mirrored in /ui/carousel/polyfill/carousel.js by design —
  drift is a lint error.
- **The lightbox — popover promotion of the SAME frame.** `<ui-media popover>` +
  a `<ui-lightbox>` invoker (`command="toggle-popover"`, interactive furniture,
  default bs) opens the existing gallery fullscreen in the top layer
  (media.lightbox.css) — no DOM change, no attribute churn, immune to every
  containment trap reveal's `exp pop` fights. Closed state works because author
  origin beats the UA popover sheet — never "restore" `display` in the reset.
  Open-state tokens are the `open:` family (`open:grid(2c|3c|4c)`, bare
  `open:furniture`): WHOLE-matched, manifest names include the prefix, and an
  `open:` spelling must never contain a substring-matched stem (no `open:nav`).
  UI-LIGHTBOX is in every NOT_SLIDE transcription; in a `nav` scroller the
  element is sticky-pinned and must sit BEFORE the slides (first child, start
  corners only — same contract as sticky ui-play). Native scroll-control
  pseudos do NOT follow a popover into the top layer (Chromium) — popover
  carousels get real-DOM controls from /ui/carousel/polyfill/carousel-controls.js (the
  split-out core the Safari entry also uses) via ui/card/lightbox.js, with
  native pseudos suppressed on those frames only; the grid-mode hide for them
  is UNLAYERED (the polyfill sheet is unlayered). The open state switches into
  ANY existing nav style via the companion `media-open=` ATTRIBUTE (never an
  open: token — control stems are substring-matched); lightbox.js swaps only
  the control words of the resolved media string on toggle, restores on close,
  keeps slide continuity (close-side re-assert after the overlay retention),
  builds controls as the union of both states. lightbox.js also owns modality
  (inert), back-button close, grid-tile→slide jump and pause-on-close — all
  optional. Docs: media.md § Lightbox; demo media.lightbox.html.
- **The collage — a `<lay-out>` INSIDE a `<ui-media>`.** Besides arranging cards,
  `<lay-out>` can be the direct child of a media frame, making it a grid of nested
  `<ui-media>` tiles. **No new tokens exist for it**: lay-out breakpoint attributes
  (with the word-size spacing steps for tight gutters) plus ordinary `media=` on the
  tiles. Two properties carry it — `:where(ui-media:has(> lay-out)) {
  min-block-size: 0 }` drops the frame's 12.5rem floor so it sizes to the grid, and
  `--layout-w` is `@property`-registered non-inheriting so a nested lay-out never
  picks up a `bleed` ancestor's 100dvi width. With `nav` on the outer frame each
  `<lay-out>` child is a slide — a **CSS-only** carousel (see sharp edges).
  Docs: ui/card/docs/media.md § Collage; demo ui/card/demo/media.collage.html.

## Working discipline (the gates — run them, don't skip)

1. `node ui/card/tokens.build.js && node ui/card/tokens.lint.js` after ANY token
   work — the lint checks CSS-needle↔manifest sync both ways, substring shadowing,
   the polyfill NOT_SLIDE mirror, AND validates every preset JSON token string
   (unknown tokens are "dead in the browser" errors). Run build twice: the second
   run must be a no-op (generation is idempotent).
2. SSR snapshot gate: `node ui/card/render.snapshot.js . /tmp/before.txt` BEFORE a
   change, re-run after, `cmp` — byte-identical unless renderer output was the
   point, then justify each differing block.
3. Verify rendering claims in a real browser, not by reading CSS: serve the repo
   (`python3 -m http.server`) and drive Chromium via playwright-core with
   `executablePath: '/opt/pw-browsers/chromium'` (never `playwright install`).
   Check computed styles at BOTH sides of any breakpoint you touch, and check the
   demo pages for console errors after changes.
4. Docs are part of the change: manifest `notes` feed generated docs; hand-written
   prose near a changed token must be updated in the same commit. New/renamed
   tokens get demo coverage in the relevant ui/card/*.html page.
5. **NEVER write long comments in CSS — prose belongs in the markdown docs.**
   A CSS comment is a one-line marker, and it points at the doc that carries the
   reasoning (`docs/media.md`, `docs/media.carousel.md`, `readme.md`, …). Rules:
   - one line, two only when the invariant genuinely needs it; never a paragraph
   - file headers are ~4 lines: what the sheet is, `Docs:` pointer, version/author
   - keep the terse *marker* for load-bearing invariants — "KEEP IN SYNC with
     NOT_SLIDE", "UNLAYERED on purpose", "Do NOT re-migrate", "Keep last" — and
     move the *explanation* behind them into the doc
   - measurements, browser-bug write-ups, rationale and history go to the doc,
     never inline. If it can't be said in one line, it isn't a CSS comment.
   The tokens lint strips comments before its needle audit, so trimming a comment
   can never break it — there is no reason to keep prose in the sheet.
6. All work on the v4 line; commit per logical change with descriptive messages.

## Known sharp edges

- **Direction is a two-column demo, not a guess.** `ui/card/demo/media.rtl.html` is the
  regression target for every logical position family (obp/scm/furniture/mrk/arw) — it puts
  `dir="ltr"` and `dir="rtl"` side by side, and an `s` cell must swap edges between them.
  Before it existed, `mrk()`/`arw()` shipped physical `left`/`right` + `anchor(left|right)` +
  `::scroll-button(left|right)` for months: in Arabic the back-button was labelled "Next".
  The `::scroll-button()` keyword names the **scroll action, not a location** — `inline-end`
  is "advance" in both directions, which is why the labels are now correct by construction.
  Note `/ui/carousel/polyfill/carousel.css` was already logical throughout; the native path
  was the outlier, so Safari rendered RTL carousels correctly and Chrome did not. They agree
  now — keep them agreeing. In `anchor()`, always use `self-start`/`self-end`: plain
  `start`/`end` resolve against the CONTAINING BLOCK's writing mode, so paired with a
  logical `inset-inline-*` on an LTR page they compute for one edge and apply to the
  other, throwing the control outside the frame. Nothing catches this but the RTL demo.
- **Browser-verifying a CSS edit? Use a fresh port.** `python3 -m http.server` sends
  `Last-Modified` with no `Cache-Control`, and Chromium will serve a stale `@import`ed sheet
  even after a query-string reload of the HTML (the query busts the page, not its imports).
  A CSS change appearing to have no effect is this, not a broken selector. Restart on a new
  port to get a new cache partition — and confirm with `curl` what the server actually serves.


- Regenerating `layout/layouts-map.js` requires the `srcsetMin` mechanism in
  layout.config.json (min-less base breakpoints); `srcsetConfig` (flat) vs
  `layoutConfig` (nested) are different shapes — don't conflate.
- content/card (downstream) still emits the old `layoutConfig` name from its own
  generator — coordinate before touching.
- ui/card_v1 and layout/src/components/composer are legacy precursors — never
  pattern-match from them.
- The stagger engine has three adapters (details / snap-carousel scroll-state /
  scroll-driven view-timeline) — see ui/base/stagger.css header before touching;
  a scroll-state container can't restyle itself from its own query. The **view-timeline**
  adapter (the `stagger=` ATTRIBUTE on a `<lay-out overflow>`) does not fire under
  `dir="rtl"`: Chromium reports 0% progress forever for slides already in view, so the
  section renders blank. The `media="… stagger"` token adapter is unaffected. Pre-existing,
  NOT a position-grid bug — repro and the three rejected CSS levers in open-items.md §5.
- **Typed `attr()` has no fallback in Safari/Firefox** — not a wrong value, a
  *missing* one. A custom property parses any token stream, so `--x: attr(fill
  type(<color>), red)` holds the literal `attr(…)` text: it is never
  guaranteed-invalid, so `var(--x, …)` never fires either, and the *consuming*
  property dies at computed-value time. Feature-detect on a REAL property —
  `CSS.supports('--x', 'attr(…)')` is `true` in Safari. There are **two** polyfill
  files and they cover disjoint attributes: `layout/polyfills/attr-fallback.js`
  (`bleed`/`columns`/`rows`/`max-width`/`self`/`size`, ships a companion sheet) and
  `ui/base/polyfills/attr-fallback.js` (component attributes). A page using both
  `<lay-out>` and cards needs **both** tags. See ui/base/polyfills/readme.md.
- **WebKit does not evaluate a pseudo-element's style query against its originating
  element at first paint.** `tnt`'s paint and `hov(tint)`'s fade were migrated to the
  R-14 flag + `@container style()` form and had to be **reverted** — the tinted frame
  rendered untinted until the first hover. Both are back on two arms in
  media.tint.css, which carries the guardrail comment. **Do not re-migrate them.**
  This is the technique's second boundary, next to "a container cannot restyle
  itself".
- **`<lay-out>` slides are CSS-only.** The CSS `:not()` slide list does NOT exclude
  `LAY-OUT` (so a collage `<lay-out>` snaps and gets a `::scroll-marker`), but JS
  `NOT_SLIDE` does. Consequence: on a collage carousel `loop`, `auto()`, per-slide
  `<ui-play>` and the Safari controls polyfill find zero slides and silently no-op.
  Do not "fix" this by adding `lay-out` to the CSS list — that deletes the feature.
  Use `<ui-slide>`/`<div>` wrappers when JS features are needed.
- **`bleed` vs the scrollbar (Safari).** The page column centres on `50cqw`
  (container units — exclude a space-taking scrollbar) while every bleed calculation
  uses `100dvi`/`50dvi` (viewport units — include it). They agree under overlay
  scrollbars, so Chrome/macOS never shows it; under space-taking ones (Safari with
  *Show scroll bars: Always*, or a mouse attached) they diverge by the scrollbar
  width and a stray horizontal scrollbar appears. Worked around with a WebKit-gated
  `overflow-x: clip` — **`clip`, not `hidden`**, so no scroll container is created
  and `position: sticky` + scroll-driven timelines survive. Symptom fix; the cause
  (two units for one quantity) is still there. layout/AGENTS.md § Browser quirks.
- **Masonry ships in Safari only, and it exposed a grid bug.** Safari 26 has
  `display: grid-lanes`; Chromium 145 has no masonry syntax at all (`item-flow`,
  `grid-template-rows: masonry` — neither engine). Both `@supports` arms are
  therefore live and must agree on lane count. Lane children need
  `min-inline-size: 0` or anything with an `aspect-ratio`/`min-block-size`
  transfers it into a min *width* and overflows the lane — plain `display: grid`
  does the same, so don't file it as a grid-lanes quirk.
- **Headless Playwright can't reproduce scrollbar bugs** — both bundled engines use
  overlay scrollbars, and neither `::-webkit-scrollbar` styling nor
  `scrollbar-gutter: stable` forces the space-taking kind. Also: check horizontal
  overflow against `documentElement.clientWidth`, never `window.innerWidth` — the
  latter *includes* the scrollbar, so it cannot detect this class of bug at all.
- **Stagger's `<cq-box>` hop.** Stagger subjects are the host's direct children, so
  every rule in the `<details>` adapter is written as a PAIR — `> :not(cq-box)` and
  `> cq-box > *` — or a card/nested-accordion wrapper becomes the single subject and
  nothing visibly staggers. Closed state, open state and `@starting-style` all carry
  both arms; edit them together.
