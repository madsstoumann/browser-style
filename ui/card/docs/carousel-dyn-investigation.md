# `mrk(dyn)` — Instagram-style shrinking dots (investigation)

> Status: **prototype, verified working** — demo: `demo/media.carousel.dyn.html`
> (all CSS inline in that page, written in `ui/carousel/carousel.css` shape).
> CSS-only, zero JS. Verified in headless Chromium 141, no flags.
> Two models were built: the **continuous** one (`mrk(dyn)`, the recommendation —
> dots glide fractionally with the swipe, like Instagram) and the **discrete
> window** runner-up (`mrk(win)`, kept on the page for comparison).

## The ask

With more than 5 slides, the dot strip should become a fixed window, Instagram
style: **always 3 dots at normal size** — the leading 3 on the first slide, the
current dot and its neighbours mid-list, the trailing 3 on the last slide — with the
dots nearer the window edges gradually smaller. Follow-up: replicate Instagram's
*continuous* feel, where the strip scrolls/animates **with the finger**, not per
snap. With 5 slides or fewer: the stock dot strip, untouched.

## Verdict

**Both feasible today, CSS-only.** The continuous model is the better Instagram
replica *and* the simpler mechanism — it needs neither view-timelines nor a
scrolling marker group.

## Continuous coupling — `mrk(dyn)` (recommended)

One scroll-driven number, everything else is arithmetic:

1. **The media scroller animates a registered custom property.**
   `@property --_dyn-p { syntax: "<number>"; inherits: true }`, animated 0 → 1
   across the scroller's own range via `animation: … linear both;
   animation-timeline: scroll(self inline)`. Because it inherits, the value flows
   scroller → slides → into each slide's `::scroll-marker` pseudo, sampled every
   frame — fractional scroll positions included.
2. **Per-dot scale is derived, not keyframed.** On each marker:
   - `--_c: clamp(1, --_dyn-p · (sibling-count() − 1), sibling-count() − 2)` — the
     *clamped* center index. The clamp is the whole trick for the ends: at the
     first slide the center pins to dot 2, so dots 1–3 are full; mirrored at the
     last slide.
   - `--_d: max(x, −x)` with `x = sibling-index() − 1 − --_c` — |distance| without
     needing `abs()`.
   - `scale: clamp(0.4, 1.3 − 0.3·--_d, 1)` — the trapezoid: current ±1 full, one
     more slot 0.7, floor 0.4 (plus a matching opacity ramp). Knobs:
     `--ui-carousel-dyn-min-scale`, `--ui-carousel-dyn-step`,
     `--ui-carousel-dyn-edge-opacity`.
3. **The strip shift is ONE logical margin.** The first slide's marker gets
   `margin-inline-start: calc(−pitch · clamp(0, --_dyn-p·(N−1) − 2, N−5))` — the
   whole flex row slides with it. `margin-inline-start` is logical, so RTL mirrors
   for free (no `translate`, no `:dir()` arm).
4. **The group stops being a scroller**: fixed 5-slot `inline-size`,
   `overflow: clip` — the UA's scroll-into-view of the current marker has nothing
   to fight, and there is no scroll state to manage at all.

Gates: the same `:has(> :nth-child(6 of …))` quantity gate (clones excluded), and
`@supports (scroll-marker-group: after) and (animation-timeline: scroll()) and
(inline-size: calc(sibling-index() * 1px))`.

### Verified states (headless Chromium 141, 10 slides, default geometry)

| State | scales (d1…d10) | first-marker margin |
|---|---|---|
| slide 1 | **1 1 1** .70 .40 .40 .40 .40 .40 .40 | 0px |
| slide 6 | .40 .40 .40 .70 **1 1 1** .70 .40 .40 | −52.8px (3 slots) |
| slide 10 | .40 .40 .40 .40 .40 .40 .70 **1 1 1** | −88px (5 slots) |
| **p = 0.58, snap disabled (mid-drag)** | .40 .40 .40 **.63 .93 1 1 .77 .47** .40 | **−56.68px** |
| 4 slides | no animation at all (gate closed) | 0px |

The mid-drag row is the point: margin and scales are *fractional* — the strip
tracks the finger continuously, and settles as the scroller snaps. Autoplay rides
the same pipe (the scroller's smooth scroll **is** the progress), so ticks glide
too. No reduced-motion arm needed: everything is scroll-driven — dots move only
when the user (or autoplay) moves the carousel.

## Discrete window — `mrk(win)` (runner-up, kept for comparison)

The phase-1 model: the group is a real 7-slot scroller (5 full + 1 fade slot each
side) with 2 slots of inline `padding` (the hard-end offset) and matching
`scroll-padding`; the UA repositions it per snap change (`scroll-behavior: smooth`
makes that reposition glide); each dot scales through keyframes on its own
`animation-timeline: view(inline 0px)`. Steps per slide instead of tracking the
finger. Where it still wins: it is **positional, not index math**, so `loop`
clones don't disturb it (their markers are `content: none`), and it has no
dependency on `sibling-index()`/`sibling-count()`.

| | `mrk(dyn)` continuous | `mrk(win)` discrete |
|---|---|---|
| Feel | glides with the finger (Instagram) | steps per snap (smooth-scrolled) |
| Platform needs | scroll-timeline on the scroller, `@property`, `sibling-index()/count()` (Chromium 138+) | scroll markers + view-timelines (Chromium 135+) |
| `loop` clones | **incompatible** — prepended clones shift the index math | tolerated |
| Furniture in the scroller | shifts `sibling-*` counts — needs a clean slide list (or index offsets) | unaffected |
| Group | `overflow: clip`, no scroll state | real scroller + scroll-padding choreography |
| Perf | inherited-custom-property recalc per scroll frame over ~10 pseudos (main thread, tiny subtree) | compositor-friendly view-timeline `scale` |

## Caveats found (each cost a probe iteration — don't rediscover them)

1. **`view()`'s default inset is `auto`, which adopts the scroller's
   `scroll-padding`** (`mrk(win)`). With `scroll-padding-inline: 2P` on the group,
   a bare `view(inline)` timeline shrinks to the middle 3 slots and every keyframe
   offset lands wrong. The explicit `view(inline 0px)` is load-bearing.
2. **A `::scroll-marker` may compute `display: inline`** (observed in this build's
   UA styles). An inline box ignores `inline-size` and is **not transformable** —
   `scale` computes but paints nothing. Set `display: block` explicitly.
3. **`scale` doesn't change layout size** — by design: the taper is purely visual,
   dot pitch stays constant, the clip does the hiding. Don't "fix" it.
4. **Quantity gate must not count loop clones**: `initLoop()` prepends/appends
   `[data-clone]` slides, so the `:nth-child(6 of :not(…, [data-clone]))` selector
   excludes them — otherwise `loop` on a 3-slide carousel would open the window.
   For `mrk(dyn)` the clones are fatal anyway (caveat 6).
5. **Chromium 141 anchor regression (system-wide heads-up, not dyn-specific).** In
   the bundled Chromium 141 (canary-channel version as of 2026-08), the marker
   group's **implicit** anchor no longer binds: with the stock
   `position-anchor: auto`, `justify-self: anchor-center` and every `anchor()`
   calc fall back, and groups/scroll-buttons land at their static position. A
   **named** anchor works. Both prototype variants therefore set
   `anchor-name`/`anchor-scope` on the scroller and `position-anchor` on the group
   — the pattern the `mrk(bar|tmb|lbl|tml)` arms already use for `anchor-size()`.
   If this behavior ships in stable Chrome, **every** `position-anchor: auto`
   control in `ui/carousel/carousel.css` misplaces — verify against Chrome stable
   ≥ 141 and, if confirmed, migrate the base sheet to named anchors defensively.
6. **`sibling-index()`/`sibling-count()` count ALL siblings.** Furniture elements
   and `loop` clones shift the continuous model's math (the margin carrier is
   `:nth-child(1 of <slide sel>)`, but the indices themselves still include
   furniture/clones). The prototype demos use clean `<img>`-only slide lists;
   document `loop` as incompatible with `mrk(dyn)` (pair `loop` with `mrk(win)`),
   and expect furniture-in-scroller to need index offsets before promotion.
7. **Setting `scrollLeft` on a `scroll-behavior: smooth` scroller animates.**
   Bit the test harness: a "park at fractional offset" helper must force
   `scroll-behavior: auto` (and disable snap) or it reads the pre-animation value.
8. **The scroller's `animation` shorthand now carries the progress animation**
   (`mrk(dyn)`). Nothing else animates `ui-media` today; if that changes, compose
   the lists instead of stomping.

## Browser posture

Chromium-only today — identical to every other `::scroll-marker` control in the
system, and behind `@supports` gates:

- `mrk(dyn)`: scroll markers (135+) + scroll-timelines (115+) +
  `sibling-index()/count()` (138+) — all stable Chromium, comfortably inside the
  repo's Chrome 150 baseline.
- `mrk(win)`: scroll markers + view-timelines — stable Chromium.
- No scroll markers (Safari/Firefox) → plain swipe scroller, the system's existing
  posture. `sibling-*` missing → `mrk(dyn)`'s gate simply never opens → stock dots.

## Integration checklist (when promoting the prototype to a real token)

1. Move the `mrk(dyn)` `<style>` block from `demo/media.carousel.dyn.html` into
   `ui/carousel/carousel.css` (`@property` + keyframes at file scope; drop the
   `mrk(win)` comparison block unless it is wanted as a second arg).
2. Manifest: add the `dyn` arg to the `mrk` token in `data/tokens.data.js`
   (axis "markers"), `npm run build:tokens`, then `npm run lint:tokens` — every
   `[media*=…]` needle must resolve, no substring shadowing (`dyn` is safe: no
   other `mrk()` arg contains it).
3. Docs: row in `docs/media.carousel.md` § marker table + a subsection; note the
   `loop` incompatibility next to the `loop` token too.
4. Demo: fold a `mrk(dyn)` pair into `media.carousel.html` § Markers + TOC entry;
   retire the prototype page.
5. Rebuild: `npm run build` (package bundles) + `npm run build:demo`
   (hashed demo CSS + reference rewrite).
6. Decide on the caveat-5 question first: if the anchor regression is real in
   stable, land the named-anchor migration with (or before) the token.
7. `axis(y)` support means `scroll(self block)` + the block-axis margin — a
   follow-up arm, not attempted in the prototype.
