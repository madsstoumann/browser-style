# `mrk(dyn)` — Instagram-style shrinking dots (investigation)

> Status: **prototype, verified working** — demo: `demo/media.carousel.dyn.html`
> (all CSS inline in that page, written in `ui/carousel/carousel.css` shape).
> CSS-only, zero JS. Verified in headless Chromium 141, no flags.

## The ask

With more than 5 slides, the dot strip should become a fixed window, Instagram-style:
**always 3 dots at normal size** — the leading 3 on the first slide, the current dot
and its neighbours mid-list, the trailing 3 on the last slide — with the dots nearer
the window edges gradually smaller. With 5 slides or fewer: the stock dot strip,
untouched. Direction-aware for free: swiping forward the current dot is the
rightmost of the full three, backward the leftmost — same as Instagram.

## Verdict

**Feasible today, CSS-only, in stable Chromium — no flags.** Two platform features
carry the whole thing, and both already underpin this codebase's markers:

1. **`animation-timeline: view(inline)` works on `::scroll-marker` pseudos.** Each
   dot gets a scroll-driven animation whose timeline is the dot's own position
   inside the `::scroll-marker-group` scroller. As the group scrolls, dots entering
   the edges shrink through keyframes — no per-dot selectors, no counting.
2. **The group is a scroll-target-group**: the UA scrolls the `:target-current`
   marker into view on its own (the mechanism `mrk(lbl)`/`mrk(tml)` already rely
   on), and it respects the group's `scroll-padding`.

The ">5 slides" condition is a pure-CSS quantity gate:
`:has(> :nth-child(6 of <slide selector>))` on the scroller.

## Mechanism

Pitch `P = --ui-carousel-marker-size + --ui-carousel-marker-gap` (defaults: 0.6rem +
0.5rem = 1.1rem). On the `::scroll-marker-group`, only when the gate matches:

| Property | Value | Why |
|---|---|---|
| `inline-size` | `7P − gap` (border-box) | 5 full slots + 1 fading slot each side |
| `overflow-x` | `auto` (+ `scrollbar-width: none`) | the window clips; scale never reflows |
| `padding-inline` | `2P` | the **hard-end offset** — at scroll 0 two empty slots lead, so dots 1–3 sit in the full-size zone and 4–5 taper; mirrored at max scroll |
| `scroll-padding-inline` | `2P` | the UA keeps the current marker ≥ 2 slots from either window edge |
| `overscroll-behavior-x` | `contain` | don't chain to the page |

On every slide's `::scroll-marker`:

```css
animation: ui-carousel-dyn-dot linear both;
animation-timeline: view(inline 0px);  /* 0px inset — see caveat 1 */
display: block;                        /* see caveat 2 */
flex: 0 0 auto;
```

Keyframes: full-size plateau over the middle 3 slots (32–68%), one step out ≈ 0.7
(22/78%), edges 0.4 + slight opacity drop. Offsets are slot boundaries for the
default geometry (window 7.2rem, timeline span window + dot = 7.8rem); keyframe
offsets can't `calc()`, so `mrk(sm|lg|xl)` shift them a little — visually subtle.
Knobs: `--ui-carousel-dyn-min-scale`, `--ui-carousel-dyn-mid-scale`,
`--ui-carousel-dyn-edge-opacity`.

## Verified states (headless Chromium 141, default geometry, 10 slides)

Computed `scale` per dot, read off `getComputedStyle(slide, '::scroll-marker')`:

| State | d1 | d2 | d3 | d4 | d5 | d6 | d7 | d8 | d9 | d10 |
|---|---|---|---|---|---|---|---|---|---|---|
| slide 1 | **1** | **1** | **1** | .70 | .51 | .40 | .40 | .40 | .40 | .40 |
| slide 6 | .40 | .50 | .69 | **1** | **1** | **1** | .70 | .51 | .40 | .40 |
| slide 10 | .40 | .40 | .40 | .40 | .40 | .54 | .77 | **1** | **1** | **1** |
| 4 slides | none | none | none | none | — | — | — | — | — | — |

(“none” = no animation at all — the quantity gate stayed closed, stock dots.)
Autoplay (`auto(3)`) drives the window with no extra wiring: the group follows the
current marker on every tick.

## Caveats found (each cost a probe iteration — don't rediscover them)

1. **`view()`'s default inset is `auto`, which adopts the scroller's
   `scroll-padding`.** With `scroll-padding-inline: 2P` on the group, a bare
   `view(inline)` timeline shrinks to the middle 3 slots and every keyframe offset
   lands wrong (only ONE dot at full size). The explicit `view(inline 0px)` is
   load-bearing.
2. **A `::scroll-marker` may compute `display: inline`** (observed in this build's
   UA styles). An inline box ignores `inline-size` and is **not transformable** —
   `scale` computes but paints nothing. Set `display: block` explicitly.
3. **`scale` doesn't change layout size** — by design: the taper is purely visual,
   dot pitch stays constant, the window clip does the hiding. Don't "fix" it.
4. **Quantity gate must not count loop clones**: `initLoop()` prepends/appends
   `[data-clone]` slides (their markers are already `content: none`), so the
   `:nth-child(6 of :not(…, [data-clone]))` selector excludes them — otherwise
   `loop` on a 3-slide carousel would open the window.
5. **Chromium 141 anchor regression (system-wide heads-up, not dyn-specific).** In
   the bundled Chromium 141 (canary-channel version as of 2026-08), the marker
   group's **implicit** anchor no longer binds: with the stock
   `position-anchor: auto`, `justify-self: anchor-center` and every `anchor()`
   calc fall back, and groups/scroll-buttons land at their static position (we saw
   them pile into a corner). A **named** anchor works. The prototype therefore sets
   `anchor-name: --ui-carousel-dyn` + `anchor-scope: --ui-carousel-dyn` on the
   scroller and `position-anchor: --ui-carousel-dyn` on the group — the same
   pattern the `mrk(bar|tmb|lbl|tml)` arms already use for `anchor-size()`. If this
   behavior ships in stable Chrome, **every** `position-anchor: auto` control in
   `ui/carousel/carousel.css` misplaces — worth verifying against Chrome stable ≥
   141 and, if confirmed, migrating the base sheet to named anchors defensively.

## Browser posture

Chromium-only today — identical to every other `::scroll-marker` control in the
system, and behind the same `@supports` gates:

- `@supports (scroll-marker-group: after) and (animation-timeline: view(inline))`
  → the full effect. Both ship in stable Chromium (scroll markers 135+,
  view timelines 115+).
- Markers but no view timelines (no such browser today) → same window, an edge
  `mask-image` fade stands in for the shrink (symmetric, so RTL-safe).
- No scroll markers (Safari/Firefox) → plain swipe scroller, the system's existing
  posture.
- No reduced-motion gate needed: the animation is scroll-driven, not time-driven —
  dots move only when the user (or autoplay) moves the carousel.

## Integration checklist (when promoting the prototype to a real token)

1. Move the `<style>` block from `demo/media.carousel.dyn.html` into
   `ui/carousel/carousel.css` (inside the existing
   `@supports (scroll-marker-group: after)` gate; keyframes at file scope).
2. Manifest: add the `dyn` arg to the `mrk` token in `data/tokens.data.js`
   (axis "markers"), `npm run build:tokens`, then `npm run lint:tokens` — every
   `[media*=…]` needle must resolve, no substring shadowing (`dyn` is safe: no
   other `mrk()` arg contains it).
3. Docs: row in `docs/media.carousel.md` § marker table + a subsection.
4. Demo: fold a `mrk(dyn)` pair into `media.carousel.html` § Markers + TOC entry;
   retire the prototype page.
5. Rebuild: `npm run build` (package bundles) + `npm run build:demo`
   (hashed demo CSS + reference rewrite).
6. Decide on the caveat-5 question first: if the anchor regression is real in
   stable, land the named-anchor migration with (or before) the token.
