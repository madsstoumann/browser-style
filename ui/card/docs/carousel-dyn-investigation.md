# `mrk(dyn)` — Instagram-style shrinking dots (investigation notes)

> Status: **shipped** as the `mrk(dyn)` marker token — `ui/carousel/carousel.css`
> § mrk(dyn), documented in `media.carousel.md` § Dynamic dots, demoed in
> `demo/media.carousel.html` § Markers. This file keeps the probe history and the
> caveats that cost an iteration each, so nobody rediscovers them.

## The ask

With more than 5 slides, the dot strip should become a fixed window, Instagram
style: **always 3 dots at normal size** — the leading 3 on the first slide, the
current dot and its neighbours mid-list, the trailing 3 on the last slide — with the
dots nearer the window edges gradually smaller, and the strip **gliding with the
finger** rather than stepping per snap. With 5 slides or fewer: the stock dot strip.

## What shipped — continuous coupling

One scroll-driven number, everything else is arithmetic (mechanism in
`media.carousel.md` § Dynamic dots). Verified in headless Chromium 141, no flags, on
a 10-slide frame with the default geometry:

| State | scales (d1…d10) | first-marker margin |
|---|---|---|
| slide 1 | **1 1 1** .70 .40 .40 .40 .40 .40 .40 | 0px |
| slide 6 | .40 .40 .40 .70 **1 1 1** .70 .40 .40 | −52.8px (3 slots) |
| slide 10 | .40 .40 .40 .40 .40 .40 .70 **1 1 1** | −88px (5 slots) |
| **p = 0.58, snap disabled (mid-drag)** | .40 .40 .40 **.63 .93 1 1 .77 .47** .40 | **−56.68px** |
| 4 slides | no animation at all (gate closed) | 0px |

The mid-drag row is the point: margin and scales are *fractional* — the strip tracks
the finger continuously and settles as the scroller snaps.

## The rejected runner-up — a discrete window

The first prototype made the `::scroll-marker-group` a real 7-slot scroller (5 full +
1 fade slot each side) with 2 slots of inline `padding` (the hard-end offset that kept
3 dots full at the extremes) and matching `scroll-padding`; the UA repositioned it per
snap change via its scroll-target-group behavior, and each dot scaled through keyframes
on its own `animation-timeline: view(inline 0px)`. It worked, but stepped per slide
instead of gliding, and needed scroll-padding choreography plus keyframe offsets tuned
to one geometry. Its one advantage: positional rather than index math, so `loop`
clones did not disturb it. Superseded; recoverable from git history
(`git log -- ui/card/demo/media.carousel.dyn.html`).

## Caveats (each cost a probe iteration)

1. **A `::scroll-marker` may compute `display: inline`.** An inline box ignores
   `inline-size` and is **not transformable** — `scale` computes but paints nothing.
   `display: block` on the marker is load-bearing.
2. **`scale` doesn't change layout size** — by design: the taper is purely visual,
   dot pitch stays constant, the clip does the hiding. Don't "fix" it.
3. **`sibling-index()`/`sibling-count()` count ALL siblings.** `loop`'s prepended
   `[data-clone]`s shift every index, so `loop` is incompatible with `mrk(dyn)`;
   furniture inside the scroller shifts the math the same way (the margin carrier is
   `:nth-child(1 of <slide sel>)`, but the indices still include furniture). The
   quantity gate excludes clones from its count so it cannot open a 3-slide loop.
4. **Chromium 141 anchor regression (system-wide heads-up).** In the bundled
   Chromium 141 (canary-channel as of 2026-08) the marker group's **implicit** anchor
   no longer binds: with `position-anchor: auto`, `justify-self: anchor-center` and
   every `anchor()` calc fall back and groups/scroll-buttons land at their static
   position. A **named** anchor works — `mrk(dyn)` sets `anchor-name`/`anchor-scope`
   on the scroller and `position-anchor` on the group, the pattern the
   `mrk(bar|tmb|lbl|tml)` arms already use for `anchor-size()`. If this ships in
   stable, **every** `position-anchor: auto` control in `carousel.css` misplaces —
   verify against Chrome stable ≥ 141 and migrate the base sheet defensively.
5. **`view()`'s default inset is `auto` and adopts the scroller's `scroll-padding`**
   (bit the discrete runner-up: the timeline shrank to the middle 3 slots). Any
   future view-timeline work on a group with scroll-padding needs an explicit inset.
6. **Setting `scrollLeft` on a `scroll-behavior: smooth` scroller animates.** A
   test harness that parks a frame at a fractional offset must force
   `scroll-behavior: auto` (and disable snap) or it reads the pre-animation value.
7. **The scroller's `animation` shorthand now carries the progress animation.**
   Nothing else animates `ui-media` today; if that changes, compose the lists.
8. **Timelines sample per frame** — a synchronous read after a scroll change sees
   the old value; wait two `requestAnimationFrame`s before asserting.

## Browser posture

Chromium-only, like every `::scroll-marker` control in the system, behind
`@supports (scroll-marker-group: after)` + `(animation-timeline: scroll())` +
`(inline-size: calc(sibling-index() * 1px))` — scroll markers 135+, scroll-timelines
115+, `sibling-*` 138+, all inside the repo's Chrome 150 baseline. Without any of
them the gate never opens → stock dots; without scroll markers at all (Safari/Firefox)
→ plain swipe scroller, the existing posture. `axis(y)` is a follow-up arm
(`scroll(self block)` + the block-axis margin), not attempted.
