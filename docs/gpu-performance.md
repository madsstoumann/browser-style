# Rendering performance — the CPU/GPU split

> Where the frame time in `layout/`, `ui/card/` and the card-demo components actually
> goes, which properties are safe to animate, and when `will-change` earns its place.
> Every number here was measured in Chromium 1194 via CDP tracing; the method is at the
> foot of the file so you can re-run it.

## The rule

An animation is cheap when the compositor can run it without the main thread: `opacity`,
`transform` (and the `scale` / `translate` / `rotate` longhands), and `filter`. Everything
else — `width`, `block-size`, `margin`, `padding`, `background-position`,
`background-size`, `box-shadow`, `border-radius`, `clip-path`, `color`, `mask`,
`text-indent`, `flex-grow`, `inline-size` — costs style, layout or paint work every frame.

The card system was already on the right side of this: **`media.hover.css` animates
`scale`/`translate`/`rotate`/`transform` and nothing else.** There is no `background-size`
hover-zoom anywhere. The problems found were not the property list — they were four ways a
composited property gets quietly pulled back onto the main thread.

### The four de-optimisations

1. **Interpolating a custom property instead of the real one.** A registered custom
   property is *never* composited. If it also `inherits: true`, every tick invalidates the
   whole subtree. `media.hover.css` transitioned four `--_f-*` properties into `filter`;
   transitioning `filter` itself is pixel-identical and 30% cheaper.
2. **Writing an inherited custom property from JS on a container.** `hover.js` set
   `--ui-media-mx/my` on `<ui-media>` per rAF, invalidating every overlaid chip, sticker,
   beacon and play button as well as the images that actually read them.
3. **A `filter` / `mask` / `mix-blend-mode` on the box being animated.** The blend or
   filter has to be re-evaluated per frame, so the "composited" transform isn't free
   (`ui/sticker` — `drop-shadow()` + `scale`; `ui/carousel` — masked glyph + `scale`;
   `media.tint.css` — `opacity` fade on a `mix-blend-mode: color` box).
4. **`transition: all`.** `ui/base/button.css` and `ui/icon/ui-icon.css` both use it, so
   they animate whatever happens to change — `clip-path`, `box-shadow`, `width`/`height`
   included.

## `will-change` — the policy

Measured result first, because it is the counter-intuitive one:

> **Adding `will-change: transform, scale, translate` to the cursor-tracked hover effects
> changed nothing.** `hov(track)` measured 52.2 ms before and 53.7 ms after (5 runs each,
> fully overlapping ranges). The cost there is 129 style recalcs from the per-rAF property
> writes, and no GPU hint can reduce style recalc. The hint was reverted.

That is the whole lesson. `will-change` buys layer promotion; it does nothing for style,
layout or paint. Before adding one, find out which of those you are paying.

1. **Never on a selector that matches at rest.** `:where(ui-media) img { will-change:
   transform }` promotes every image on the page. Scope it to the state that *precedes*
   the animation — `:hover`/`:focus-within`, `[open]`, pointer-inside — so it is
   time-bounded and a handful of elements carry it at most.
2. **Don't hint an already-running composited animation.** Infinite `translate`/`opacity`/
   `rotate` keyframes (marquee, sticker spin, progress, beacon `breathe`) are auto-promoted
   by the engine. A hint adds GPU memory and nothing else.
3. **Don't hint to fix style-recalc cost.** See the measurement above. Fix the invalidation
   instead — write the property lower down the tree, or stop animating a custom property.
4. **Do consider it** where a `filter` or `mask` sits on the box being transformed, or
   where a paint-bound animation can't be composited at all and you want the repaint
   isolated to its own layer.
5. **Spell out the properties.** `will-change: transform` does not cover the independent
   `scale` / `translate` / `rotate` longhands.
6. **Verify layer count at rest does not grow.** That is the failure mode of an
   over-broad hint, and it is what `LayerTree.layerTreeDidChange` is for.

There are, as a result, still **zero `will-change` declarations in `layout/`, `ui/card/` and
the twenty packages in `ui/card/components.md`** — a measured conclusion, not an oversight.
(Repo-wide the count is three, all pre-existing and all outside that scope:
`ui/countdown/ui-countdown.css:35`, `ui/mega-menu/scroll.css:50`,
`ui/number-spinner/index.css:21`.)

## What was changed, and what it bought

| Change | Measured |
|---|---|
| `media.hover.css` — transition `filter`, not the four `--_f-*` vars | `hov(blur)` 28.3 → **19.7 ms** median (5 runs, non-overlapping) |
| `hover.js` — write `--ui-media-mx/my` on the media children, not the frame | `hov(track)` 52.2 → **41.5 ms** median |
| `media.css` — gate the scrim `::after` on `scm` | 347 → **91** scrim pseudo-elements across five demo pages; all 91 that paint are kept |
| `prefers-reduced-motion` gates (below) | `demo/media.furniture.html` idle under `reduce`: 133.9 → **0 ms**, 300 paints → 0 |

That last row is the largest single win in this pass, and it came from an accessibility
gate rather than a GPU trick. The 133.9 ms that reduce users were paying was
`ui/gradient-text` — the one infinite animation in the set with no motion gate.

Reduced-motion gaps closed: `layout/core/animations.css` (`stack(reveal)`),
`layout/core/base.css` (`scroll-behavior: smooth` on every `lay-out`),
`ui/base/animations.css` (the `.an-*` engine), `ui/base/animate.css` (the whole
`[animate]` engine), `ui/base/button.css`, `ui/card/media.video.css`, `ui/play`,
`ui/avatar`, `ui/gradient-text` (which also gains the `[paused]` hook that marquee and
beacon already had).

## Where the time actually goes

Measured on `demo/media.furniture.html`, 2.5 s of **idle** — no interaction at all:

| animation | idle cost | property |
|---|---|---|
| `beacon-slide` | ~87 ms | `color` + `text-indent` on text, via two inheriting registered custom properties |
| `beacon-dots` | ~37 ms | `background-size`, 3 layers |
| `beacon-pulse` | ~24 ms | `box-shadow` |
| `beacon-breathe` | ~16 ms | `transform` + `opacity` |
| `beacon-blink` | ~10 ms | `opacity` |
| `beacon-bounce` | ~8 ms | `background-position`, 3 layers, 22 stops |

Turning every animation off drops the page from ~260 ms to **0 ms**. `ui-beacon` alone is
~56% of it; marquee, sticker and gradient-text were not measurable on this page.

**`beacon-slide` was attacked and the attempt failed.** Splitting it into a host animation
(`color` + `text-indent`) plus a composited `translate`/`opacity` animation on the two
pseudos reproduced the curve exactly, but measured 370 ms vs 378 ms — no gain — while
adding **6 composited layers and doubling the paint records**. It was reverted. The cost is
the text repaint, which is inherent to a ticker that slides and fades text; there is no
element to translate without changing the component's markup. `beacon-bounce`, the
22-stop `background-position` animation that looks like the obvious villain, is the
*cheapest* of the six.

## Deliberately not changed

- **Scroll-edge fade** (`ui/base/scroll.css` → `content.css`, `layout/core/base.css`,
  `ui/reveal`, `ui/timeline`) — registered `<length>`s animated into a `mask` gradient on a
  scroll timeline. Main-thread by construction. An opacity-overlay rewrite would change
  what the fade *is*: true alpha versus a painted scrim over a known background.
- **Lightbox reveal** (`media.lightbox.css`) — `clip-path: inset(… round …)` on a
  `100dvi × 100dvb` element above a fading `backdrop-filter: blur(8px)`. The heaviest single
  frame in the set; `scale`+`opacity` would be a different effect.
- **`ui/reveal` + `ui/accordion` disclosure** — `block-size` + `content-visibility` via
  `::details-content` is the correct modern technique and has no composited equivalent.
  `ui/reveal:409` (`block-size` + `inline-size` + `margin` + `border-radius` + `opacity`)
  and `ui/accordion:402` (`flex-grow`, re-running row layout per frame) are the priciest.
- **`media.tint.css`** — `opacity` on a `mix-blend-mode: color` box; the blend forces a
  backdrop read-back whatever the opacity does.
- **`ui/gradient-text`** — a text-clipped gradient cannot be composited at all.
- **`ui/progress:29`** — `inline-size`; `scaleX()` would distort the bar's gradient and radius.
- **`ui/icon`'s `transition: all`** — unlike the button, the properties that flip on
  `[open]`/`:checked` genuinely include `width`, `height`, `gap`, `border-width` and
  `clip-path` as part of the glyph morph. Enumerating ~13 properties risks silently
  dropping one for no measured gain.
- **`ui-card.css:26`** — `--shadow-xl` on every card by default, while nearly all other
  paint in the system is off-by-default. The largest always-on per-card paint cost.

## Backlog — main-thread animation that *could* be composited

The section above is the **cannot** list. This is the **could** list: animations that are on
the main thread today, are not inherently so, and were simply never attempted.

It matters more than its length suggests. Of ~260 ms of idle main-thread work on
`demo/media.furniture.html`, `ui-beacon` is ~56% — and only `blink` + `breathe` (~26 ms of
~148 ms) are on composited properties. **Roughly 85% of the heaviest always-running
component in the system is still main-thread paint**, and nearly all of it is listed here.

| Item | Animates today | Composited form | Cost |
|---|---|---|---|
| `ui-carousel-pill-fill` — `ui/carousel/carousel.css:964` | `background-size` 0→100% | `scaleX()` on a pseudo with `transform-origin: inline-start` | untested; runs 5 s per slide on **every** autoplay carousel |
| `ui-carousel-thumb-timer` — `carousel.css:971` | a registered `<length-percentage>` fed into a background layer | same | untested. The `@property` was chosen because the layer count varies (2 plain, 3 with a play badge) — that is a *correctness* reason, not a perf one, so a pseudo may be free to take over |
| `beacon-pulse` — `ui/beacon/ui-beacon.css:243` | `box-shadow` ring, **infinite** | a pseudo scaling `1 → 1 + 2·spread/size` while `opacity` goes 1→0 | **~24 ms** |
| `beacon-dots` + `beacon-bounce` | `background-size` / `background-position` across three radial-gradient layers, **infinite** | three real boxes animating `translate`/`scale` | **~45 ms combined** |
| `beacon-slide` | `color` + `text-indent`, driven by two inheriting registered custom properties | attempted and reverted — see § Where the time actually goes | **~87 ms**, the single largest item. The revert was measured under software rasterisation and should be re-run first |
| `mrk(hyb)` — `carousel.css:279` | `inline-size` + `border-radius` on `::scroll-marker` | `scaleX()` — but note it would distort the pill's radius, so this one may not be expressible | untested |
| `ui/icon` `transition: all` — `ui-icon.css:31`, `:48` | catches `clip-path`, `width`, `height`, `box-shadow` on every icon **and both pseudos** | an explicit property list | deliberately skipped — the glyph morphs genuinely animate layout properties; see § Deliberately not changed |

**Precondition: do not start any of these without a real-GPU baseline.** Each one trades
main-thread paint for composited layers, and that trade cannot be evaluated under software
rasterisation — see § Method. Take the before/after with the recipe there, on hardware.

## Open — found while measuring, needs a decision

None of these were changed; each is a judgement call that belongs to the author.

- **Nested frames stack a second scrim.** `--ui-media-scrim-paint` inherits, so inside an
  `scm` host both the scroller frame and each slide frame paint one — 35 stacked pairs on
  `demo/media.carousel.html`. `media.tint.css` suppresses exactly this case for its own
  overlay (`ui-media ui-media::before { content: none }` plus a nested-host boundary rule);
  scrim has no equivalent. Whether per-slide scrims are wanted is a design call, so the
  gating commit deliberately left the behaviour as it was.
- ~~**`node ui/card/build.js` fails**: the peer-exclusivity gate in `scripts/css-bundle.js`
  rejects two cross-package assets pulled in by `content.css`'s contact-icon mask.~~
  **Resolved in `174c14e5`** — both SVGs are inline data URIs now; the build is green and
  a second run is a no-op.
- ~~**Every `dist/` bundle is stale.**~~ **Resolved in `174c14e5`** — regenerated in one
  deliberate release commit, which also flushed the backlog of unpublished source changes
  (a `[data-theme~=…]` selector batch in base's theme, a summary line-clamp block and a
  price-gap change in card). Keep them regenerated: source-only commits leave consumers of
  `dist/` on the old CSS.
- **`ovr()`'s legibility shadow is half-applied.** `ui-card.css:127-128` sets
  `--ui-content-heading-text-shadow` and `--ui-content-eyebrow-text-shadow`, but
  `content.css` also reads `--ui-content-body-text-shadow` (summary) and
  `--ui-content-meta-text-shadow` (byline, footer, meta), which `ovr()` never sets. Overlay
  text is shadowed for the headline and eyebrow and unshadowed everywhere else.
- **`hov(sat)` has no demo coverage** — the rule exists in `media.hover.css`, no element on
  `demo/media.hover.html` carries the token.

## Method — how to re-run this

### First: know what your renderer is

Every number in this file was taken in a container with **no GPU** — Chromium fell back to
SwiftShader (software rasterisation; check with `WEBGL_debug_renderer_info`, or read
`chrome://gpu`). That bounds the conclusions unevenly:

| | Affected by software rasterisation? |
|---|---|
| Main-thread timings — style recalc, layout, paint-record | **No.** That work is on the CPU either way. |
| Composited-layer counts | **No.** Compositing *decisions* are backend-independent. |
| `will-change` was a no-op on `hov(track)` | **No.** The cost was 129 style recalcs; no GPU hint touches style recalc. |
| The `beacon-slide` split wasn't worth it (+6 layers, no gain) | **Yes — re-test on real hardware.** Extra composited layers cost real time in software and are close to free on a GPU, so this revert may be wrong. |

The rule of thumb: trust the main-thread numbers, distrust anything whose verdict turns on
**layer count versus paint**. Every item in the backlog above turns on exactly that, which
is why none of them were attempted.


Serve on a **fresh port each round** (`python3 -m http.server 89xx`): the dev server sends
`Last-Modified` with no `Cache-Control`, and a query-string reload busts the page but not
its `@import`ed sheets. Drive Chromium with playwright-core and
`executablePath: '/opt/pw-browsers/chromium'` — never `playwright install`.

- **Cost**: `Tracing.start` with `disabled-by-default-devtools.timeline`, run a scripted
  interaction, sum `dur` over `UpdateLayoutTree` / `Layout` / `PrePaint` / `Paint` /
  `UpdateLayerTree` / `CompositeLayers` / `Commit`.
- **Layers**: `LayerTree.enable` + `layerTreeDidChange`, recorded at rest and at peak.
- **Attribution**: cancel one animation by name via
  `document.getAnimations().filter(a => a.animationName === n).forEach(a => a.cancel())`
  and re-measure. This is how the beacon table above was built.
- **Take medians of 5.** Single runs vary by ±40% on this workload; two of the four
  conclusions in this document only became visible once the ranges stopped overlapping.
  With medians of 5 the surviving change set is 40/46 pages pixel-identical, and all six
  remaining diffs reproduce in a same-tree control.
- **Visual gate**: full-page pixel diff against an unmodified checkout at 1280 and 420.
  Three things will otherwise sell you a phantom regression:
  - **Force lazy images.** Set `loading = 'eager'` on every `img` and await `decode()`
    before shooting. Comparing two checkouts means two sets of files on disk with
    different OS-cache warmth, so load races bias systematically toward the second shot,
    not randomly. This alone produced a reproducible-looking 181 203 px "regression" on
    `cards.html` that vanished once the images were awaited.
  - **Establish a noise floor by diffing the baseline against itself.** `media.collage.html`
    at 420 is bistable (differs from itself in ~2 of 3 runs); `media.carousel.html` has
    thirteen JS-driven autoplay carousels and differs *from an identical tree* by anywhere
    between 245 px and 537 k px. Neither page can be pixel-compared at all.
  - **Repeat.** A single diff run cannot distinguish a bistable page from a regression.
