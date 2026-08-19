# Performance — the single reference

> Policy, repo-specific knowledge, and the current open list for performance work in this
> repo. Referenced by `layout/AGENTS.md` and the card docs. The step-by-step *procedure*
> for running a pass lives in the `perf-pass` skill (`.claude/skills/perf-pass/`); this file
> is what a session needs to act correctly once it is running one.

---

## 1. Policy — the CPU/GPU split

An animation is cheap when the compositor can run it without the main thread: `opacity`,
`transform` (and the `scale` / `translate` / `rotate` longhands), and `filter`. Everything
else — `width`, `block-size`, `margin`, `padding`, `background-position`, `background-size`,
`box-shadow`, `border-radius`, `clip-path`, `color`, `mask`, `text-indent`, `flex-grow`,
`inline-size` — costs style, layout or paint work every frame. The problems ever found in
this repo were not the property list but four ways a composited property gets quietly
pulled back onto the main thread.

### The four de-optimisations

1. **Interpolating a custom property instead of the real one.** A registered custom property
   is *never* composited; if it also `inherits: true`, every tick invalidates the whole
   subtree. Transitioning `filter` itself instead of four `--_f-*` vars was pixel-identical
   and ~30% cheaper (`hov(blur)` 28.3 → 19.7 ms median).
2. **Writing an inherited custom property from JS on a container.** `hover.js` setting
   `--ui-media-mx/my` on `<ui-media>` per rAF invalidated every overlaid chip, sticker,
   beacon and play button; writing it on the media children cut `hov(track)` 52.2 → 41.5 ms.
3. **A `filter` / `mask` / `mix-blend-mode` on the box being animated.** The blend or filter
   re-evaluates per frame, so the "composited" transform isn't free (`ui/sticker` —
   `drop-shadow()` + `scale`; `ui/carousel` — masked glyph + `scale`; `media.tint.css` —
   `opacity` fade on a `mix-blend-mode: color` box).
4. **`transition: all`.** `ui/base/button.css` and `ui/icon/ui-icon.css` animate whatever
   happens to change — `clip-path`, `box-shadow`, `width`/`height` included.

The largest single win ever measured here was an accessibility gate, not a GPU trick:
`prefers-reduced-motion` gates (now in place across `layout/core/`, `ui/base/animations.css`
+ `animate.css` + `button.css`, `ui/card/media.video.css`, `ui/play`, `ui/avatar`,
`ui/gradient-text`) took a reduce-user's idle cost on `demo/media.furniture.html` from
133.9 ms to 0. Keep the gate when adding any always-running animation.

### `will-change` — the policy

Measured result first, because it is the counter-intuitive one: **adding `will-change:
transform, scale, translate` to the cursor-tracked hover effects changed nothing** —
`hov(track)` 52.2 ms before, 53.7 ms after (5 runs each, fully overlapping). The cost there
was 129 style recalcs from per-rAF property writes, and no GPU hint reduces style recalc.
`will-change` buys layer promotion; it does nothing for style, layout or paint. Before
adding one, find out which of those you are paying.

1. **Never on a selector that matches at rest.** Scope it to the state that *precedes* the
   animation (`:hover`/`:focus-within`, `[open]`, pointer-inside) so it is time-bounded.
2. **Don't hint an already-running composited animation** — infinite `translate`/`opacity`/
   `rotate` keyframes are auto-promoted; the hint adds GPU memory and nothing else.
3. **Don't hint to fix style-recalc cost.** Fix the invalidation instead — write the
   property lower down the tree, or stop animating a custom property.
4. **Do consider it** where a `filter`/`mask` sits on the box being transformed, or where a
   paint-bound animation can't be composited and you want the repaint isolated to a layer.
5. **Spell out the properties** — `will-change: transform` does not cover the independent
   `scale`/`translate`/`rotate` longhands.
6. **Verify layer count at rest does not grow** (`LayerTree.layerTreeDidChange`) — the
   failure mode of an over-broad hint.

There are still **zero `will-change` declarations in `layout/`, `ui/card/` and the packages
in `ui/card/components.md`** — a measured conclusion, not an oversight (verified again
2026-08-19). Repo-wide the count is three, all pre-existing and outside that scope:
`ui/countdown/ui-countdown.css`, `ui/mega-menu/scroll.css`, `ui/number-spinner/index.css`.

### Measured animation costs (the price list)

`demo/media.furniture.html`, 2.5 s of idle, no interaction (Chromium via CDP tracing):

| animation | idle cost | property |
|---|---|---|
| `beacon-slide` | ~87 ms | `color` + `text-indent`, via two inheriting registered custom properties |
| `beacon-dots` | ~37 ms | `background-size`, 3 layers |
| `beacon-pulse` | ~24 ms | `box-shadow` |
| `beacon-breathe` | ~16 ms | `transform` + `opacity` |
| `beacon-blink` | ~10 ms | `opacity` |
| `beacon-bounce` | ~8 ms | `background-position`, 3 layers, 22 stops |

Everything off drops the page from ~260 ms to 0; `ui-beacon` alone is ~56%. The ladder to
internalise: custom-property clocks driving layout props ≫ paint props ≫ composited
`transform`/`opacity`. **Cost scales linearly with instance count**, and off-screen
instances still pay style+layout (only paint is skipped). One hero ticker (`tck`) per view;
for live badges across a feed use `bln` (composited `opacity`) or `non`, and put
`content-visibility: auto` on off-screen rows. `beacon(ldr)` is the ticker's cheap static
twin. PSI's "non-composited animations" diagnostic is the tell. `beacon-slide` was attacked
and the attempt failed — splitting it into host + composited-pseudo animations reproduced
the curve exactly but gained nothing while adding 6 layers and doubling paint records;
reverted, though the revert was measured under **software rasterisation** and should be
re-run on real hardware first (see § Method).

### Deliberately not changed (the *cannot* list)

**Scroll-edge fade** (`ui/base/scroll.css`, `layout/core/base.css`, `ui/reveal`,
`ui/timeline`) — registered `<length>`s animated into a `mask` on a scroll timeline,
main-thread by construction; an opacity-overlay rewrite would change what the fade *is*.
**Lightbox reveal** (`ui/card/media.lightbox.css`) — `clip-path: inset(… round …)` above a
fading `backdrop-filter`; `scale`+`opacity` would be a different effect. **`ui/reveal` +
`ui/accordion` disclosure** — `block-size` + `content-visibility` via `::details-content`
is the correct modern technique, no composited equivalent. **`media.tint.css`** — the blend
forces a backdrop read-back whatever the opacity does. **`ui/gradient-text`** — a
text-clipped gradient cannot be composited at all. **`ui/progress`** — `scaleX()` would
distort the bar's gradient and radius. **`ui/icon`'s `transition: all`** — the glyph morphs
genuinely animate ~13 layout properties; enumerating them risks silently dropping one for
no measured gain. **`ui-card.css` default `--shadow-xl`** — the largest always-on per-card
paint cost; a design decision.

### Backlog — main-thread animation that *could* be composited

Untried, not impossible: `ui-carousel-pill-fill` and `ui-carousel-thumb-timer`
(`ui/carousel/carousel.css` — `background-size` / registered length → `scaleX()` pseudo;
runs 5 s per slide on every autoplay carousel), `beacon-pulse` (`box-shadow` ring → scaling
pseudo, ~24 ms), `beacon-dots`+`beacon-bounce` (gradient layers → real boxes, ~45 ms),
`beacon-slide` (attempted, revert suspect — see above, ~87 ms), `mrk(hyb)` scroll-marker
fill (may not be expressible — `scaleX()` distorts the pill radius). **Precondition: a
real-GPU baseline.** Each trades main-thread paint for composited layers, and that trade
cannot be evaluated under software rasterisation.

### Method — how to measure

**First, know your renderer.** The numbers above were taken with Chromium on SwiftShader
(no GPU — check `chrome://gpu`). Main-thread timings (style/layout/paint) and compositing
*decisions* are backend-independent — trust those; distrust any verdict that turns on
**layer count versus paint** (every backlog item does).

- **Cost**: `Tracing.start` with `disabled-by-default-devtools.timeline`, run a scripted
  interaction, sum `dur` over `UpdateLayoutTree` / `Layout` / `PrePaint` / `Paint` /
  `UpdateLayerTree` / `CompositeLayers` / `Commit`.
- **Layers**: `LayerTree.enable` + `layerTreeDidChange`, at rest and at peak.
- **Attribution**: cancel one animation by name —
  `document.getAnimations().filter(a => a.animationName === n).forEach(a => a.cancel())` —
  and re-measure. This is how the beacon table was built.
- **Medians of 5.** Single runs vary ±40% on this workload.
- **Visual gate**: full-page pixel diff vs an unmodified checkout at 1280 and 420. Three
  phantom-regression traps: force `loading = 'eager'` + await `decode()` before shooting
  (OS-cache warmth biases systematically toward the second shot); diff the baseline against
  itself for a noise floor (`media.collage.html` at 420 is bistable; `media.carousel.html`
  differs from an identical tree by up to 537 k px — neither can be pixel-compared); and
  repeat — one run cannot distinguish bistable from broken.

---

## 2. Repo specifics

### Hosts and the CDN

`v4` auto-deploys to Cloudflare Pages ~1 min after push: **v4.browser.style** (the zone)
and **browser-style-v4.pages.dev**. Same files, different behavior. `/cdn-cgi/image/`
transforms work on the zone only (404 on pages.dev and localhost) — hence absolute
`https://v4.browser.style/cdn-cgi/image/…` srcset URLs in markup, and **a failed srcset
candidate never falls back to `src`**. The zone injects bot-defense into HTML (AI-Labyrinth
link + `challenge-platform/jsd`): ~90–130 ms TBT, ~5 pts — **pages.dev is the page's clean
score**; don't chase the zone delta in page code. `_headers` is honored on both; GitHub
Pages (main branch) ignores it.

Two referrer rules, both load-bearing against the zone's Hotlink Protection (403 on any
cross-origin Referer): `<meta name="referrer" content="no-referrer">` in the page head
covers document-initiated fetches, but a **CSS-initiated fetch uses the *stylesheet's*
referrer policy, not the document's** — carousel thumb backgrounds
(`--ui-carousel-thumb-url`) broke on pages.dev until `_headers` gave `/dist/*`
`Referrer-Policy: no-referrer` (`5ac81cea`). A failed `background-image` is silent.

### Images

Contract (full detail: `ui/card/docs/media.md` § Responsive images): five-width srcset
`240/320/480/720/1200`, `format=auto,quality=80`, `fit=cover` + height only when the frame
has `asr()` (no asr = width-only, Cloudflare keeps the natural ratio). Rungs above the
original's intrinsic width are dropped (`buildSrcset` in `ui/card/srcset.js`, `intrinsic`
option). The `srcset` must be **in the markup**: the preload scanner sees markup, never a
JS-injected attribute, so an upgraded-at-runtime image is discovered late and loads
sequentially — that is the standing reason to finish the SSR migration and stop shipping
`ui/card/ui-media-srcset.js` (its own header already says "transitional"). **Root-relative
src required** — `render.js` `cdnEligible` and
`ui-media-srcset.js` `#eligible` both enforce it; a page-relative src becomes the wrong
zone path (404, no fallback). Exactly **one** `loading="eager" fetchpriority="high"` per
page (the LCP candidate; never lazy a view-transition morph hero); all else
`loading="lazy" decoding="async"`. Lazy images get `auto, `-prefixed `sizes`; **`auto` is
spec-invalid on eager** — eager gets the list alone. The fallback list is computed per
enclosing `<lay-out>` from `layout/src/srcsets.js` (`generateSrcsets`/`calculateSizes`,
whose final entry must stay `100vw`). Fixed-size images (48 px thumbs, 64 px avatars) use
square `1x/2x` pairs, not a width ladder. CSS-background thumbs need their own transform
URLs — CSS fetches ignore `loading="lazy"` (a 48 px dot once fetched a 1.9 MB PNG).

### CSS bundle and caching

Card demo pages load one `<link href="/dist/demo.<hash>.min.css">` built from the
`ui/card/components.md` inventory (`npm run build:demo-css` → `scripts/css-bundle.js` +
`scripts/hash-asset.js`). **Rebuild after any component CSS change** or the page keeps old
styles; pages outside the inventory keep per-package links. The content hash is what makes
the `_headers` one-year `immutable` TTL safe — at the old fixed name that TTL made a
shipped CSS change invisible for up to 8 days at browser *and* edge. Never point a page at
an unhashed name in `/dist/`. Package bundles (`/ui/*/dist/`) are deliberately unhashed
(stable consumer names) and not matched by that rule; keep them regenerated — source-only
commits leave `dist/` consumers on old CSS.

**CSS splitting was evaluated and rejected**: schema.html provably skips 12 of the bundle's
48 sections (~16 KB br win), but the shared immutable bundle across ~29 demo pages is worth
more. And the old note "base + layout double-ship animations/stagger (~13 KB)" is
**wrong** — the engine moved to `ui/base` in `9e142765` and esbuild dedupes shared imports;
the real redundancy on any page is *unused* CSS, not duplicated CSS.

### JavaScript and the polyfill

Load `.min.js` bundles, not source modules (`video.js` imports `shared.js` — a sequential
discovery chain; the bundle is one request). **Never probe features via DOM +
`getComputedStyle` in a render-blocking script** — it forces a full-document style pass
(measured 618 ms). Feature-detect with `CSS.supports('background-color',
'attr(x type(<color>), red)')` on a REAL property — the custom-property form is `true` even
where unsupported.

The typed-`attr()` polyfill is **inlined** into schema.html (`8752cd66`): it must run
before first paint (cross-document view transitions snapshot the incoming page there), and
in Chrome it is a feature-detected no-op — the old render-blocking request bought nothing.
`scripts/inline-polyfill.js` rewrites between `<!-- polyfill:start/end -->` markers from
`ui/base/polyfills/attr-fallback.iife.min.js`, running inside `npm run build:demo` after
the IIFE rebuild so the copy cannot drift (`--check` for CI). The emitted tag must stay a
**classic** `<script>` — an inline `type="module"` is deferred by spec, runs after first
paint, and silently restores the bug. The standalone `attr-fallback.min.js` stays as the
documented consumer entry.

**Placement is the other half of that rule.** A parser-inserted classic `<script>` is blocked
by every stylesheet that *precedes* it, and since it blocks the parser in turn, HTML parsing
stops with it — `CSS ∥ parse` becomes `CSS → parse`. An inline classic script therefore
belongs **above** the stylesheet `<link>`, not below. schema.html has it below (bundle line
13, polyfill line 42), so DOM construction of a 2,482-element body waits on the ~62 kB
bundle, with the render-blocking `<link rel="expect">` queued behind that parse. The preload
scanner runs on regardless, so the *network* is not gated — and the cost is **unmeasured**;
trace before moving it (`docs/plans/open-items.md` § 30).

`<link rel="expect" blocking="render">` is spec-valid (whatwg/html #9970); the W3C
validator's complaint is a stale rule. Morph-target anchors are load-bearing — schema.html's
`#schema-product-variants` is the *deepest* cross-document morph target, not a regression.

### Resource hints — measure first; most preloads are 0 ms here

Do: `preconnect` to `https://v4.browser.style` on pages with absolute CDN srcsets
(handshake parallel to CSS on off-zone hosts); speculation rules (`prerender`,
`eagerness: moderate`) for morph-target pages (Chromium-only, inert elsewhere) — but
`moderate` caps at **two** concurrent prerenders, FIFO, so a third URL silently evicts the
oldest; schema.html already declares exactly two. Do NOT:
preload head CSS/scripts (already the first requests — RenderBlocking shows 0 ms), preload
a `fetchpriority=high` LCP image, `modulepreload` end-of-body scripts.

### Big DOMs

The page-scoped pattern (schema.html `<style>`): `content-visibility: auto` +
`contain-intrinsic-size: auto <px>` on below-fold sections — took a 550 ms whole-page
layout to 132 ms on a 2,482-element document. Needs care around `rel=expect` morph targets
and container queries. The microdata itself (a quarter of schema.html's elements are
`<meta itemprop>`) *is* the demo — DOM size is not a lever there.

### Measuring and gates

- Scoring: Lighthouse CLI (`npx -y lighthouse … --only-categories=performance`), mobile
  default, **median of 3** (single runs swing ±3–5 pts) on **pages.dev**. Local M-series
  runs ~10–20 pts above PSI on the same URL. Interactive loop: the chrome-devtools MCP
  (`performance_start_trace` → `performance_analyze_insight`, `list_network_requests`,
  `list_console_messages`, `evaluate_script`).
- **Ground truth beats scores**: check `[...document.images].filter(i => !i.naturalWidth)`
  is empty and the network log has zero 4xx — `currentSrc` is set even when the candidate
  403s, and a page of broken images scores *higher* (a 97 was once measured against 403
  stubs). `curl -sI` the markup's URLs: `cf-resized` proves the transform ran,
  `cache-control` proves `_headers` deployed; test with/without `Referer` when hunting 403s.
- Localhost caveat: `python3 -m http.server` serves `/dist` uncompressed (~392 kB raw vs
  62 kB gzip) — local FCP carries a ~3 s penalty; deployed numbers are the real ones. Fresh
  port per CSS change (Chromium serves stale `@import`ed sheets even after reload —
  `docs/v4.md`). `playwright-core` is not installed on this machine — use the MCP tools.
- Repo gates when touching `render.js`/presets/data: snapshot
  (`node ui/card/render.snapshot.js . /tmp/after.txt` + `cmp` — diffs must be exactly the
  intended blocks), tokens (`node ui/card/tokens.build.js && node ui/card/tokens.lint.js`,
  build twice = idempotent), `npm test`. Generated pages (`ui/card/demo/articles/*` via
  `articles/build.js`, `layout/dist/*`) are **regenerated from their builder, never
  hand-patched**. JSON edits are surgical `Edit`s, not full-file rewrites.

---

## 3. Current state & open items

Status verified against the working tree and git log, 2026-08-19.

**Done** (dropped from the open lists): typed-`attr()` polyfill inlined (`8752cd66`);
`content-visibility` block on schema.html; demo bundle content-hashed + `/dist/*` immutable
+ no-referrer in `_headers`; srcset ladder capped at intrinsic size (`854125db`);
`render.js`/`ui-media-srcset.js` root-relative eligibility fix; carousel thumb transforms.

**Rejected — do not retry: brotli q11 precompression** (`50483ba7`, reverted `4c9bd070`,
rationale `8311a475`). Cloudflare **normalises `Accept-Encoding` to `[br, gzip]` before a
Pages Function sees it**, so a Function can never safely decide to serve a precompressed
`.br` body: br-capable browsers work, everyone else receives brotli bytes labelled
`text/css` (verified live) and renders unstyled. Pages does not auto-serve `.br` siblings
either. The ~14 kB (edge q4 vs local q11 on the render-blocking CSS) is real but
unreachable this way. Testing traps: `curl -I` sends HEAD, which `onRequestGet` never
handled — every header check silently measured the static asset; `curl --raw` leaves
chunked framing in the body and fakes corruption.

**Rejected — Early Hints (HTTP 103).** Cloudflare only emits a 103 from `Link:` headers when
the **zone**'s Early Hints feature is on, so it is dead on `browser-style-v4.pages.dev` —
which this doc establishes as the page's clean scoring host. And a 103 buys server
think-time, of which a static Pages asset has almost none. Both reasons would have to change
before it is worth an `_headers` `Link:` line.

**Open**, roughly by leverage:

1. **Per-width image quality ladder** — the biggest remaining lever. Verified unshipped:
   `IMG_DEFAULTS.quality` is still scalar `80` (`ui/card/render.js:262`); 321 `quality=80`
   URLs in schema.html alone. Wide rungs are only chosen by high-DPR devices where
   artefacts shrink, so quality can fall as width rises: `240→80 320→80 480→76 720→68
   1200→60` (measured: 1200w LCP rung 64,217 → 44,788 B at q60, −30%, same cut on all 69
   srcset images). Choke point: `buildSrcset()` in `ui/card/srcset.js` — widen `quality` to
   `number | Record | (width)=>number`; thread through `render.js`, `ui-media-srcset.js`
   (a scalar attribute must keep overriding) and `render.test.js`; sweep hand-authored
   markup, regenerate builder output; leave 1x/2x pairs at q80. Verify with before/after
   screenshots on *photos* (`quantum.png`, `summer.jpg`), not the abstract LCP art.
   Tracked in `docs/plans/open-items.md`.
2. **`/ui/*` cache TTL** — verified: `_headers` still has no `/ui/*` rule, and schema.html
   loads unhashed `/ui/card/video.min.js` + `/ui/save/save.min.js`. Unhashed names, so
   `immutable` is unsafe; add `Cache-Control: public, max-age=600,
   stale-while-revalidate=86400`. Repeat-visit only — won't move a cold run.
3. **Contrast — light arms DONE 2026-08-19, dark arms blocked on a design decision.** The
   six retuned values now live in `ui/base/tokens.css` and the `demo/schema.html` override
   is gone; verified in-browser at 5.33–7.05 against `--color-surface`. The dark arms were
   deliberately not ported: each hue doubles as a theme-bundle plate under fixed ink, and
   in dark mode the two roles pull opposite ways (`--color-warning` has *no* lightness
   satisfying both). Full measurements and the three options: `docs/plans/open-items.md`
   § 29.1a.

   Still open under it: **muted compounding** — `--ui-content-muted` is
   `color-mix(in oklab, currentColor 65%, transparent)`
   (`ui/card/content.typography.css:41`) and `dateline` re-applies it inside the
   already-muted `byline` (0.65² ≈ 0.42, the worst failures on the page). The 85% page
   override on `demo/schema.html` survives one step; the real fix is stopping the double
   application in `ui/card/content.css`.
4. **`ovr()` legibility shadow half-applied** — verified: `ui/card/ui-card.css:136-137`
   sets heading + eyebrow shadows only, while `content.css` also reads
   `--ui-content-body-text-shadow` and `--ui-content-meta-text-shadow`. Overlay summary,
   byline, footer and meta text is unshadowed.
5. **Forced reflow, ~55 ms, `[unattributed]`** — trace, don't guess (prime suspect:
   `video.min.js` custom-element upgrades at end-of-body). Re-trace post-polyfill-inline;
   if it is unavoidable upgrade cost, record that and stop.
6. **Demo-page leftovers** — `cards.html` still pulls 24 images from `https://browser.style`
   (v1 host, ~2 MB, cross-origin untransformable): swap to local `/assets` copies if the
   weight matters. `media.video.html`: 14 autoplay `<video>` are the page's *content*
   (accept the score); its 35 page-relative `youtube-data/`/`vimeo-data/` preview paths are
   correctly untransformed — root-relativize them to put them on the CDN.
7. **Card CSS design calls, deliberately left** — nested scrim stacking
   (`--ui-media-scrim-paint` inherits, so nested frames paint stacked pairs;
   `media.tint.css:25,27` suppresses exactly this for tint, scrim has no equivalent) and
   `hov(sat)`, which no element on `demo/media.hover.html` carries (verified: zero).
8. **Minor / parked**: mobile picks 1200w rungs at DPR 2.625 (~123 kB over the DPR-2
   convention) — cap via `sizes` if it ever matters; zone decision (exempt the demo host
   from bot detections or accept ~5 pts); native `::scroll-marker` hit-size on the Chromium
   path (axe cannot see pseudos — never audited); `width`/`height` on frame images needs
   UCF model fields (tracked in `docs/plans/open-items.md`); the
   composited-animation backlog in § 1 (blocked on a real-GPU baseline).

---

The pass *procedure* — order of operations, checklists, definition of done — lives in the
`perf-pass` skill: `.claude/skills/perf-pass/`.
