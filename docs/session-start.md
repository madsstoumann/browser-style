# Session start — browser.style v4 layout / card / content / media system

> Orientation for a new working session on the v4 design-system line. The root
> CLAUDE.md auto-loads AGENTS.md + docs/design-system-agent.md, and
> ui/card/AGENTS.md loads when you touch ui/card — this file adds the operational
> knowledge on top: reading order, the load-bearing facts that are easy to get
> wrong, the verification gates, and the known sharp edges.

## Read first (in this order)

1. `ui/card/AGENTS.md` — the card system's architecture: the three attribute DSLs
   (variant= / media= / content=), their different scoping rules, the bs-card
   container-query model (host arm via cq-box/summary + self arm), presets/renderer,
   ui/reveal, layout integration, JS modules, pitfalls. This is the master map.
2. `docs/plans/2026-07-26-v4-card-system-architecture-analysis.md` — the full-system
   analysis, every finding (F-xx), every decision (R-xx), the implementation-status
   ledger, and a **TODO section at the end** listing what is consciously deferred
   (v5 batch, F-38 card `sub` variant, F-32) — do not re-litigate or re-fix those.
3. `ui/card/data/tokens.json` — THE source of truth for every token in the three
   DSLs. Generated FROM it: `tokens.data.js` (the renderer's import), `tokens.md`,
   and marker-injected tables (`<!-- tokens:… -->`) inside the hand-written docs.
   Never edit generated tables by hand; edit the manifest, then
   `node ui/card/tokens.build.js`.
4. `layout/AGENTS.md` — the `<lay-out>` system: viewport breakpoints (xs 240 base /
   sm 380 / md 540 / lg 720 / xl 920 / xxl 1140), builder-generated CSS from
   layouts/*.json, spacing tokens, one-way bare `subgrid`, overflow scrollers.
5. Per-topic docs when relevant: ui/card/{carousel,media,content,card,stagger}.md,
   media.carousel.md (internals), ui-card-tokens.md, ui/reveal/readme.md,
   layout/docs/card-integration.md.

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
  scm(), mrk(), arw(), plc(), reveal ico() — obp() is the ONLY physical (tl…br)
  vocabulary left, by design. One hue palette of nine (red orange green blue
  accent black white gray slate); dark/light/subtle were removed in v5, slate was
  promoted to canonical.
  `pages` means "paged carousel" in both contexts: math paging on
  `<lay-out overflow>`, wrapper-dissolve-below-md on a `<ui-media>` scroller.
- **Renderer**: render.js is Node-safe string SSR; everything escapes via esc();
  never innerHTML with data. cq-box is hand-authored, never auto-inserted.
  slidesOf()/NOT_SLIDE in shared.js is mirrored in /polyfill/carousel.js by design —
  drift is a lint error.

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
5. All work on the v4 line; commit per logical change with descriptive messages.

## Known sharp edges

- Regenerating `layout/layouts-map.js` requires the `srcsetMin` mechanism in
  layout.config.json (min-less base breakpoints); `srcsetConfig` (flat) vs
  `layoutConfig` (nested) are different shapes — don't conflate.
- content/card (downstream) still emits the old `layoutConfig` name from its own
  generator — coordinate before touching.
- ui/card_v1 and layout/src/components/composer are legacy precursors — never
  pattern-match from them.
- The stagger engine has three adapters (details / snap-carousel scroll-state /
  scroll-driven view-timeline) — see ui/base/stagger.css header before touching;
  a scroll-state container can't restyle itself from its own query.
