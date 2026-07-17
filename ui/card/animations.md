# Animations — keyframe library & scroll API

How scroll-driven and scroll-triggered animations work: one canonical keyframe library,
consumed by three front-ends — the `[animate]`/`[animate-self]` attribute API, the
`.an-*` utility classes, and the stagger engine. All in `@browser.style/base` now, so any
component can use them.

- **Keyframe library + params:** [`ui/base/animations.css`](../base/animations.css) (`@layer bs-core`).
- **Attribute API engine** (timelines, ranges, triggers, stagger, pace): [`ui/base/animate.css`](../base/animate.css) (`@layer bs-core`) — moved out of layout in v4; full reference in [`layout/core/animations.md`](../../layout/core/animations.md). Only `stack(reveal)` remains in `layout/core/animations.css`.
- **Easing tokens:** [`ui/base/easings.css`](../base/easings.css).
- **Stagger engine** (the state-triggered sibling of this system): [stagger.md](./stagger.md).

`ui/base/animations.css` is bundled into `dist/layout.css` via `layout.config.json`
`"include"`, so the keyframes are available wherever `layout.css` loads — even without
`@browser.style/base`.

---

## Ownership invariant

Two files, disjoint ownership, so cascade order never fights:

- **`ui/base/animations.css`** owns the `@keyframes` **names** and the keyframe **params**
  (`--animate-*` + computed `--_*`). Every rule that *sets* a param (multiplier, bounce
  squeeze) lives here, one layer, so source order resolves them.
- **`layout/core/animations.css`** owns `--_animn` (which keyframe), `--animtm` (timing),
  `animation-range`, and triggers.

## Keyframe params

Set on `:where([animate], [animate-self], [class*="an-"])`; public knobs × a multiplier →
internal computed values the keyframes read:

| Param | Default | Drives |
|-------|---------|--------|
| `--animate-dg` | `100deg` | flip rotation |
| `--animate-tx` / `--animate-ty` | `55px` / `110px` | fade translate (x / y) |
| `--animate-txv` / `--animate-tyv` | `100vw` / `100vh` | bounce / slide translate (viewport) |
| `--animate-zi` / `--animate-zo` | `0.6` / `1.2` | zoom-in / zoom-out scale |
| `--animate-mult` | `1` | global multiplier |

`fade-up(2)` / `fade-up(3)` set `--animate-mult` to 2 / 3 (bigger travel). `bounce()`
squeezes zoom start to `--animate-zi: 0.3`.

## Keyframe families

All in `ui/base/animations.css`. Directional ones read the params above, so they scale with
the multiplier.

| Family | Keyframes |
|--------|-----------|
| **Opacity** | `opacity` · `fade-in` · `fade-out` |
| **Bounce** | `bounce-in` · `bounce-in-{up,down,left,right}` (overshoot at 60% / 80%) |
| **Fade** | `fade-{up,down,left,right}` · `fade-{up,down}-{left,right}` · `fade-in-scale` · `fade-out-scale` |
| **Flip** | `flip-{up,down,left,right,diagonal}` (3D `rotateX/Y`, `perspective(2500px)`) |
| **Reveal** | `reveal-{circle,inset,polygon,superellipse}` (clip-path only, **opacity-free** — normal = appear, reverse = morph away) |
| **Slide** | `slide-{up,down,in,out}` (viewport-unit translate) |
| **Zoom** | `zoom-in` · `zoom-in-rotate` · `zoom-out` · `zoom-out-rotate` |
| **Stagger** | `ui-stagger-in` — reads the stagger vectors (`--_stg-tr/sc/fl`), one keyframe covers all 7 stagger tokens incl. `blr`; used by [stagger.md](./stagger.md) adapter 3 |

---

## Front-end 1 — `[animate]` / `[animate-self]` (layout)

The layout attribute API. Function-call syntax with an optional multiplier: `fade-up()`,
`fade-up(2)`. Full docs: [`layout/core/animations.md`](../../layout/core/animations.md);
summary:

- **`animate-self="fx()"`** — animates the `<lay-out>` element **itself** on its own
  `view()` timeline.
- **`animate="fx()"`** — the container publishes `view-timeline: --animate-tl`; its
  **children** animate against it, staggered by per-`sibling-index()` `animation-range`.

**Modifiers** (space-separated): `clip` (`overflow: clip`) · `deep` (two-level
grandchild stagger) · `pace="slow|fast|…"` (maps `animation-range`, or duration in
triggered mode) · `easing="…"`.

**Trigger tokens** (Chrome 145+, behind `@supports (timeline-trigger-name: --t)`) — swap the
scrubbed timeline for a fixed-duration play that *starts* on scroll but isn't scrubbed:

| Token | Direction | Re-runs on scroll back/forth? |
|-------|-----------|-------------------------------|
| *(none)* | scrubbed `view()` | yes — progress follows scroll |
| `trigger` | play-forwards on entry | **no** — one-shot, plays once and stays |
| `trigger-exit` | play-backwards on exit | — |
| `trigger-both` | forwards on entry + backwards on exit | **yes** — replays every entry |

So for a wild effect that **re-appears** on scroll back-and-forth, use `trigger-both`; for
one-shot, `trigger`; for scroll-scrubbed, no token.

`animate-self` supports the same trigger tokens (separate `--animate-self-trigger` scope, so
it composes with an item `[animate]` trigger on the same element).

### `animate-self` feedback deadlock

`animate-self` animates the element on its **own** `view()` timeline — so an effect that
**moves the element far** feeds back: the element translates out of its trigger's entry
range, the timeline never advances, and it stays stuck at the from-state. **Deadlocks
scrubbed AND triggered.**

- **Deadlocks:** `bounce-in-*`, `slide-*` (big translate); `zoom-in*` (scale→0 collapses
  the box). `zoom-out*` are *exit* effects (end at opacity 0) — also unusable as an entry.
- **Works** (transform-in-place — box keeps its position/size, so `view()` still sees it):
  **flips** (`flip-*`, rotate) and **reveals** (`reveal-*`, clip-path).

`[animate]` on **children** has no such problem — the parent (untranslated) hosts the
timeline while children translate — so bounce/slide are fine there. This is why the
overflow-carousel container entry uses `animate-self` with flip/reveal, while its per-card
reveal uses [stagger](./stagger.md).

## Front-end 2 — `.an-*` / `.ar-*` utility classes

Plain scroll-driven classes (see `ui/scroll-animations`). `.an-<name>` sets `--animn`;
`.ar-<range>` sets the range. Applied inside `@supports (view-transition-name: none)` on a
`view()` timeline with `animation-fill-mode: forwards`.

## Front-end 3 — stagger

The state-triggered sibling: `ui-stagger-in` is the keyframe its scroll-driven adapter
uses. Token ↔ keyframe map: `rise→fade-up · fall→fade-down · lft→fade-left · rgt→fade-right
· zom→zoom-in · fde→fade-in · blr` = stagger-only. Details: [stagger.md](./stagger.md).

---

## Progressive enhancement gates

| `@supports` test | Unlocks |
|------------------|---------|
| `(view-transition-name: none)` / `(animation-timeline: view())` | scroll-driven base (scrubbed) |
| `(width: calc(sibling-index() * 1px))` | dynamic per-child stagger (any child count) |
| `(timeline-trigger-name: --t)` | scroll-**triggered** mode (`trigger` / `trigger-exit` / `trigger-both`) |

Below each gate the animation simply doesn't attach → content renders visible. Everything is
additionally gated on `prefers-reduced-motion: no-preference`.
