# Animation System

> **Moved to base (v4).** The `[animate]`/`[animate-self]` engine now lives in `@browser.style/base` (`ui/base/animate.css` + `@keyframes` in `ui/base/animations.css`), so it works on **any** component, not just `<lay-out>` — load base alongside `layout.css`. Easing tokens moved to `ui/base/easings.css`. Custom-property idents were renamed `--layout-*` → `--animate-*` (`--animate-tl`, `--animate-trigger`, `--animate-self-trigger`, `--animate-item-timing`). The only rule still in the layout package is `stack(reveal)` (`core/animations.css`). Shape reveals (`reveal(NAME)` — `circ` plus every media `shp()` name except `circle`/`inset`) draw from the shared `--shp-*` catalog in `ui/base/shapes.css`.

Scroll-driven animations, applied via `animate-self` (container) and `animate` (children) — elements animate as they enter the viewport, no JavaScript required.

## Attributes

| Attribute | Target | Description |
|-----------|--------|-------------|
| `animate-self` | Container | Animates the entire `lay-out` element |
| `animate` | Children | Animates each direct child independently |
| `easing` | Container | Applies a custom easing from `easings.css` |

> **No `pace` attribute (removed in v4, system-wide).** Pace words — `very-slow`, `slow`, `fast`, `very-fast`, `exit`, `exit-fast`, `exit-slow` — are plain tokens **inside** the `animate` / `animate-self` value, e.g. `animate="fade-up() slow exit-fast"`. See [Pace](#pace).

## Syntax

Animations use a function-call syntax with an optional multiplier:

```html
<lay-out animate-self="fade-up()">           <!-- default intensity -->
<lay-out animate-self="fade-up(2)">          <!-- 2x intensity -->
<lay-out animate="zoom-in(3)">              <!-- 3x intensity per child -->
```

## Available Animations

### Bounce
`bounce()` `bounce-in-up()` `bounce-in-down()` `bounce-in-left()` `bounce-in-right()`

### Fade
`fade-in()` `fade-out()` `fade-up()` `fade-down()` `fade-left()` `fade-right()`
`fade-up-left()` `fade-up-right()` `fade-down-left()` `fade-down-right()`

### Flip
`flip-up()` `flip-down()` `flip-left()` `flip-right()` `flip-diagonal()`

### Reveal
`reveal(circle)` `reveal(inset)` `reveal(polygon)` `reveal(superellipse)` — **container only**
(`[animate-self]` arm, no child arm).

`reveal(NAME)` — 31 shape reveals, **both arms**: `hex` `star` `rhomb` `plus` `circ` `pt-d` `pt-u` `pt-l` `pt-r` `cut-r` `cut-l` `skew-r` `skew-l` `para` `chev-l` `chev-r` `arr-l` `arr-r` `minus` `close` `bolt` `msg` `frame` `frame-in` `blinds-h` `blinds-v` `curve-d` `curve-u` `curve-r` `curve-l` `circ-45`.
Clip-path endpoints come from the shared `--shp-*` catalog (`ui/base/shapes.css`) — the same
pairs `media="shp(NAME)"` reads, so every media shape is also a reveal. The two exceptions stay
media-only: `shp(circle)` (`reveal(circ)` is the reveal-tuned 0%→100% circle) and `shp(inset)`
(`reveal(circle)` and `reveal(inset)` name the container-only keyframes above).

### Slide
`slide-up()` `slide-down()` `slide-in()` `slide-out()`

### Zoom
`zoom-in()` `zoom-in-rotate()` `zoom-out()` `zoom-out-rotate()`

### Other
`opacity()`

## Multiplier

Append `(1)`, `(2)`, or `(3)` to control animation intensity. Omitting the multiplier or using `(1)` gives the default.

```html
<lay-out animate-self="fade-up()">           <!-- default: 110px -->
<lay-out animate-self="fade-up(2)">          <!-- 2x: 220px -->
<lay-out animate-self="fade-up(3)">          <!-- 3x: 330px -->

<lay-out animate="zoom-in(2)">              <!-- 2x zoom on each child -->
```

The multiplier scales each animation's spatial properties:

| Property | Default | 2x | 3x |
|----------|---------|----|----|
| Translation (ty) | 110px | 220px | 330px |
| Translation (tx) | 55px | 110px | 165px |
| Rotation (dg) | 100deg | 200deg | 300deg |
| Zoom-in (zi) | 0.6 | 0.3 | 0.2 |
| Zoom-out (zo) | 1.2 | 1.4 | 1.6 |

Animations without spatial properties (`fade-in`, `fade-out`, `opacity` and every `reveal(…)`) are unaffected by the multiplier.

## Custom Easings

Apply a custom easing with the `easing` attribute. Values map to custom properties defined in `easings.css` (based on [Open Props](https://github.com/argyleink/open-props)).

```html
<lay-out animate-self="slide-in()" easing="ease-spring-1">
<lay-out animate="fade-up()" easing="ease-bounce-3">
```

### Available Easings

| Category | Values |
|----------|--------|
| **Ease** | `ease-1` … `ease-5` |
| **Ease In** | `ease-in-1` … `ease-in-5` |
| **Ease Out** | `ease-out-1` … `ease-out-5` |
| **Ease In-Out** | `ease-in-out-1` … `ease-in-out-5` |
| **Spring** | `ease-spring-1` … `ease-spring-5` |
| **Bounce** | `ease-bounce-1` … `ease-bounce-5` |
| **Elastic** | `ease-elastic-1` … `ease-elastic-5` |
| **Elastic Out** | `ease-elastic-out-1` … `ease-elastic-out-5` |
| **Elastic In** | `ease-elastic-in-1` … `ease-elastic-in-5` |
| **Elastic In-Out** | `ease-elastic-in-out-1` … `ease-elastic-in-out-5` |
| **Squish** | `ease-squish-1` … `ease-squish-5` |
| **Step** | `ease-step-1` … `ease-step-5` |
| **Named curves** | `ease-circ-in`, `ease-circ-out`, `ease-circ-in-out` |
|  | `ease-cubic-in`, `ease-cubic-out`, `ease-cubic-in-out` |
|  | `ease-expo-in`, `ease-expo-out`, `ease-expo-in-out` |
|  | `ease-quad-in`, `ease-quad-out`, `ease-quad-in-out` |
|  | `ease-quart-in`, `ease-quart-out`, `ease-quart-in-out` |
|  | `ease-quint-in`, `ease-quint-out`, `ease-quint-in-out` |
|  | `ease-sine-in`, `ease-sine-out`, `ease-sine-in-out` |

## Item Animation

Animate each child of the container independently, staggered by scroll position:

```html
<lay-out animate="fade-up()" lg="columns(3)">
  <div>...</div>
  <div>...</div>
  <div>...</div>
</lay-out>
```

Each child plays on its **own** `view()` timeline, so it animates when it reaches the viewport: a card on the fifth row plays when the fifth row arrives, not when the container does. The cascade is an inset on that timeline (`view(block <o> <o>)`): the second child starts one `--animate-step` (6% of the viewport) later, the third and every later child two steps later. One row cascades left to right, and the cascade never grows down the page.

Inside an `overflow` carousel the children sit in the layout's own horizontal scroller, where a block-axis `view()` has nothing to track. There the container keeps one `view-timeline: --animate-tl` and the children offset their ranges on it (20% per step, capped at the third child).

Keep an `overflow` carousel to vertical effects (`fade-up()`, `fade-down()`, `fade-in()`). A sideways effect (`fade-left()`, `fade-right()`, `fade-up-left()` and the other diagonals, `slide-in()`, `bounce-in-left()`) moves each slide's snap area with it: before the entry the scroller rests as far past the first slide as the effect travels (110px for `fade-right(2)`), and it can stay there, cutting the first slide off, also after scrolling forward and back (Chrome 150). Nothing in CSS guards this. `fade-up(2)` and `fade-in()` were checked; zooms and flips change a slide's box too and were not.

All animations listed above work with `animate`.

### Clip Modifier

Add `clip` to contain child overflow during animation. Useful for animations with large translations (e.g., `slide-down`) that would otherwise leak outside the container before the animation range begins:

```html
<lay-out animate="slide-down() clip" lg="columns(3)">
```

This sets `overflow: clip` on the container. Omit it when you want slight overflow (most animations look fine without it).

### Item Exit Animations

Exit pace tokens work with `animate` too. A second animation slot plays the same keyframe in reverse as each child scrolls out at the top. The same inset shifts the exit, so within a row the last child exits first:

```html
<!-- Items animate in on entry and out on exit -->
<lay-out animate="fade-up() exit" lg="columns(3)">

<!-- Slow entry, fast exit -->
<lay-out animate="zoom-in() slow exit-fast" lg="columns(3)">
```

Entry pace tokens (`very-slow`, `slow`, `fast`, `very-fast`) also affect item animations: the pace sets each child's range, the cascade lives in the timeline inset, so the two compose.

### Deep Animations

The `deep` modifier animates grandchildren (elements *inside* each item) with stagger relative to both item position and element order:

```html
<lay-out animate="fade-up() deep" lg="columns(3)">
  <article>
    <img src="...">
    <h4>Title</h4>
    <p>Description</p>
  </article>
  <article>
    <img src="...">
    <h4>Title</h4>
    <p>Description</p>
  </article>
</lay-out>
```

Deep stagger uses two offset levels:
- **Item offset** — each item publishes `view-timeline: --animate-item` with the same inset as its own animation, so its grandchildren start where the item does. In an `overflow` carousel and in trigger mode the item offset is `--_item-offset` (the capped item index × 20).
- **Child offset** (`--_child-offset`) — based on element position within each item: 10% of the item's entry range per child (`sibling-index()`, or `nth-child` up to the fourth).

The combined offset determines when each grandchild animates relative to its item's scroll position.

Deep can be combined with multipliers:

```html
<lay-out animate="fade-up(2) deep" lg="columns(3)">
```

## Custom Properties (Public API)

Override these on any `[animate-self]` or `[animate]` element:

| Property | Default | Description |
|----------|---------|-------------|
| `--animate-ty` | `110px` | Vertical translation distance |
| `--animate-tx` | `55px` | Horizontal translation distance |
| `--animate-dg` | `100deg` | Rotation angle (flips) |
| `--animate-txv` | `100vw` | Viewport-width translation (slides, bounces) |
| `--animate-tyv` | `100vh` | Viewport-height translation (slides, bounces) |
| `--animate-zi` | `0.6` | Zoom-in start scale |
| `--animate-zo` | `1.2` | Zoom-out start scale |
| `--animate-mult` | `1` | Multiplier (set automatically by `(1)`/`(2)`/`(3)`) |
| `--animate-delay` | `0.005s` | Time factor per offset unit (triggered mode) |
| `--animate-stagger` | `10` | Stagger multiplier for item trigger delay |
| `--animate-step` | `6%` | Timeline inset per cascade step for scroll-driven items (2nd child 1×, 3rd and later 2×; a share of the viewport) |
| `--animate-dur` | `0.5s` | Animation duration in triggered mode |
| `--animate-dur-very-slow` | `1.5s` | Duration for `very-slow` pace (triggered mode) |
| `--animate-dur-slow` | `1s` | Duration for `slow` pace (triggered mode) |
| `--animate-dur-fast` | `0.3s` | Duration for `fast` pace (triggered mode) |
| `--animate-dur-very-fast` | `0.15s` | Duration for `very-fast` pace (triggered mode) |
| `--animate-item-timing` | `ease-out` | Timing function for item/deep animations |
| `--layout-morph-bg` | `var(--layout-bg, black)` | Overlay color for `morph` attribute |

Example — custom translation distance with multiplier:

```html
<lay-out animate-self="fade-up(2)" style="--animate-ty: 200px">
<!-- Result: 200px * 2 = 400px translation -->
```

## Pace

Pace tokens control animation speed and when the animation plays relative to the viewport. They are part of the `animate` / `animate-self` token vocabulary — **there is no separate `pace` attribute** (removed in v4). Tokens are space-separated within the attribute value, so entry and exit can be combined.

### Entry Speed

| Token | Start | End | Description |
|-------|-------|-----|-------------|
| `very-slow` | `entry 0%` | `contain 50%` | Widest range, very gradual |
| `slow` | `entry 0%` | `entry 100%` | Full entry phase |
| *(default)* | `entry 0%` | `entry 75%` | Normal speed — no attribute needed |
| `fast` | `entry 25%` | `entry 60%` | Narrow range, snappy |
| `very-fast` | `entry 35%` | `entry 55%` | Narrowest range, instant feel |

### Exit

Exit tokens activate a second animation slot that plays the same keyframe in reverse as the element scrolls out.

| Token | Start | End | Description |
|-------|-------|-----|-------------|
| `exit` | `exit 0%` | `exit 100%` | Default exit speed |
| `exit-fast` | `exit 40%` | `exit 100%` | Narrow range, snappy |
| `exit-slow` | `contain 50%` | `exit 100%` | Starts before exit phase |

### Combining Tokens

```html
<!-- Entry only, slow -->
<lay-out animate-self="fade-up() slow">

<!-- Entry + exit, default speeds -->
<lay-out animate-self="fade-up() exit">

<!-- Slow entry, fast exit -->
<lay-out animate-self="fade-up() slow exit-fast">

<!-- Fast entry, slow exit -->
<lay-out animate-self="zoom-in() fast exit-slow">

<!-- Very slow entry + exit -->
<lay-out animate-self="flip-up() very-slow exit">

<!-- Item animations with exit -->
<lay-out animate="fade-up() exit" lg="columns(3)">

<!-- Item animations: slow entry + clip for slides -->
<lay-out animate="slide-down() clip slow exit" lg="columns(3)">
```

## Progressive Enhancement

The animation system uses layered feature detection:

### Layer 1: Scroll-driven animations
`@supports (view-transition-name: none)` — All modern browsers with scroll-driven animation support. Container and item animations use `animation-timeline: view()`.

### Layer 2: `sibling-index()`
`@supports (width: calc(sibling-index() * 1px))` — Computes the deep child offset for any number of grandchildren. The item cascade needs no `sibling-index()`: it is capped at the third child, so two `nth-child` rules carry it.

### Layer 3: Scroll-triggered animations (Chrome 145+)
`@supports (timeline-trigger-name: --t)` — Enables time-based delays for item and deep animations via the `trigger` token, triggered by scroll position. Inner elements use `animation-delay` instead of scroll-range offsets, producing smoother stagger timing. Pace tokens map to `--animate-dur` in this mode.

In this mode, `--animate-delay` controls the time factor per offset unit. The existing `--_item-offset` and `--_child-offset` values are reused as delay multipliers.

## Architecture

```
Public API          --animate-ty (110px)
                              |
Multiplier          --animate-mult (1|2|3)
                              |
Computed            --_ty = calc(--animate-ty * --animate-mult)
                              |
Keyframe            translate: 0px var(--_ty)
```

Internal computed variables (`--_ty`, `--_tx`, `--_dg`, etc.) are consumed by keyframes and should not be overridden directly. Override the `--animate-*` public properties instead.

### Two-Slot Animation Pattern

Both container and item animations use a two-slot pattern for entry + exit:

```
Slot 1 (entry):  animation-name: var(--_animn)          direction: normal
Slot 2 (exit):   animation-name: var(--_anim-exit, none) direction: reverse
```

The exit slot defaults to `none` (inactive). When an exit pace token is set (in the `animate`/`animate-self` value), `--_anim-exit` resolves to the same keyframe as entry, played in reverse. For items, the timeline inset shifts the exit too, so within a row the last child exits first.

Easing values are sourced from `ui/base/easings.css` (the `--ease-*` tokens, loaded by `@browser.style/base`). The `[easing]` attribute maps the attribute value to `--animtm` (for container animations) and `--animate-item-timing` (for item animations).

---

## Scroll-Triggered Item Animations

### Problem

Scroll-driven animations (`animation-timeline: view()`) tie animation progress directly to scroll position. This means animation speed depends entirely on how fast the user scrolls — fast scrolling produces fast animations, slow scrolling produces slow ones. Pace tokens help by widening or narrowing the scroll range, but cannot guarantee consistent timing.

### Solution: Trigger Tokens

Trigger tokens in the `animate` attribute opt into scroll-triggered animations (Chrome 145+), where scroll position *starts* the animation but doesn't control its progress. The animation plays at a fixed duration once triggered.

| Token | Direction | Description |
|-------|-----------|-------------|
| `trigger` | Entry only | Animates in the first time it enters, then stays (`play-forwards`) |
| `trigger-exit` | Exit only | There from the start; animates out as it leaves, back in as it returns (`reverse`, `play-backwards play-forwards`) |
| `trigger-both` | Both | Animates in each time it enters, out each time it leaves (`play-forwards play-backwards`) |
| `trigger-down` | Scrolling down | Animates in each time you scroll down to it; stays as you scroll back up |
| `trigger-up` | Scrolling up | Animates in each time you scroll back up to it; stays as you scroll down |

`trigger-down` and `trigger-up` play like `trigger-both`, but their active range reaches 1,000,000px past one edge (`timeline-trigger-active-range: entry 0% exit 1000000px` for down, `entry -1000000px exit 100%` for up). Leaving on that side never deactivates the trigger, so the item stays shown; leaving on the other side does, and it rewinds there, out of view, ready to play again. Every one of them plays the first time an item appears, whichever way the page is scrolled. Measured in Chrome 155: `exit 100%` or `normal` is not enough as the far edge, as the trigger then deactivates once the item has scrolled out of view and replays on its return.

```html
<!-- Scroll-driven (default — no trigger token) -->
<lay-out animate="fade-up()" lg="columns(3)">

<!-- Scroll-triggered: entry only (most common) -->
<lay-out animate="fade-up() trigger" lg="columns(3)">

<!-- Scroll-triggered: exit only -->
<lay-out animate="fade-up() trigger-exit" lg="columns(3)">

<!-- Scroll-triggered: both directions -->
<lay-out animate="fade-up() trigger-both" lg="columns(3)">

<!-- Scroll-triggered: every time, but only scrolling down -->
<lay-out animate="fade-up() trigger-down" lg="columns(3)">
```

Browsers without `timeline-trigger-name` support ignore the `@supports` block and fall back to the current scroll-driven approach automatically.

### How It Works

```
┌──────────────────────────────────────────────────────────┐
│  @supports (timeline-trigger-name: --t)                  │
│                                                          │
│  Each child > * (trigger / trigger-exit / trigger-both / │
│                  trigger-down / trigger-up)              │
│    → timeline-trigger: --animate-trigger view()           │
│       entry 25% exit 0%                                  │
│    → trigger-scope: --animate-trigger                     │
│    (overflow carousel: one trigger on the container)     │
│                                                          │
│  Children > *                                            │
│    → animation-timeline: auto  (time-based)              │
│    → animation-duration: var(--animate-dur)          │
│    → animation-delay:                                    │
│         min(index, 2) * stagger * delay                  │
│                                                          │
│  Direction (set per variant — literal keywords):         │
│    trigger       → play-forwards                         │
│    trigger-exit  → reverse; play-backwards play-forwards │
│    trigger-both  → play-forwards play-backwards          │
│    trigger-down  → as both; active range to 1e6px above  │
│    trigger-up    → as both; active range to 1e6px below  │
│                                                          │
│  Fallback (no support):                                  │
│    Scroll-driven, each child on its own view()           │
└──────────────────────────────────────────────────────────┘
```

Each child defines its own `timeline-trigger`, so it fires when that child enters the viewport, and switches from scroll-driven to a time-based animation linked to it by `animation-trigger`. An `overflow` carousel keeps one trigger on the container, as its children sit in the layout's own scroller. Stagger uses `animation-delay` by the child's index, capped at the third child (0, 1, 2), instead of scroll-range offsets. The `--animate-stagger` property (default `10`) multiplies the delay factor to produce visible stagger between items.

**Important:** The `animation-trigger` property requires literal keywords (`play-forwards`, `play-backwards`) — CSS custom properties cannot be used for play direction.

### Advantages Over Scroll-Driven

| Aspect | Scroll-driven | Scroll-triggered |
|--------|--------------|-----------------|
| Speed consistency | Varies with scroll speed | Fixed duration |
| Stagger mechanism | Timeline inset per child | `animation-delay` (smoother) |
| Direction control | Two-slot pattern (entry + exit) | `play-forwards` / `play-backwards` keywords |
| Easing fidelity | Limited by scroll granularity | Full CSS easing curves |

### Pace Mapping

In scroll-driven mode, pace tokens set `animation-range` values. In triggered mode, the same entry speed tokens map to `--animate-dur`:

| Token | Scroll-driven effect | Triggered effect |
|-------|---------------------|---------------------|
| `very-slow` | Widest scroll range | `--animate-dur: 1.5s` |
| `slow` | Wide scroll range | `--animate-dur: 1s` |
| *(default)* | Normal range | `--animate-dur: 0.5s` |
| `fast` | Narrow scroll range | `--animate-dur: 0.3s` |
| `very-fast` | Narrowest scroll range | `--animate-dur: 0.15s` |

Exit direction in triggered mode is controlled by the trigger token (`trigger-exit`, `trigger-both`, `trigger-down`, `trigger-up`), not by exit pace tokens. The exit pace tokens (`exit`, `exit-fast`, `exit-slow`) only apply in scroll-driven mode.

### Interaction With `deep`

When a trigger token and `deep` are combined, the existing deep stagger logic (item offset + child offset) applies to `animation-delay` instead of scroll-range offsets.

```html
<lay-out animate="fade-up() trigger deep" lg="columns(3)">
```

### Usage

```html
<!-- Entry only (most common) -->
<lay-out animate="fade-up() trigger" lg="columns(3)">

<!-- Exit only -->
<lay-out animate="fade-up() trigger-exit" lg="columns(3)">

<!-- Both directions -->
<lay-out animate="fade-up() trigger-both" lg="columns(3)">

<!-- Every time you scroll down to it, never on the way back up -->
<lay-out animate="fade-up() trigger-down" lg="columns(3)">

<!-- With deep stagger -->
<lay-out animate="fade-up() trigger deep" lg="columns(3)">

<!-- With clip for slides -->
<lay-out animate="slide-down() trigger clip" lg="columns(3)">

<!-- Custom duration -->
<lay-out animate="zoom-in() trigger" style="--animate-dur: 0.8s" lg="columns(3)">

<!-- Custom stagger -->
<lay-out animate="fade-up() trigger" style="--animate-stagger: 20" lg="columns(3)">
```

---

## Morph Overlay

A solid-color `::after` pseudo-element covers the `lay-out` and morphs away via `clip-path` as the element scrolls into view, revealing the content underneath.

### How It Differs From `reveal-*`

The existing `reveal(…)` animations animate the element itself — the element starts invisible and clips open. Morph overlays work the opposite way: the element and its content are always present, but a solid overlay sits on top and morphs away. This creates seamless section-to-section transitions when the overlay color matches the previous section's background.

| | `reveal-*` animations | `morph` overlay |
|---|---|---|
| Target | The element itself | `::after` pseudo-element |
| Start state | Element clipped / invisible | Overlay covers content |
| End state | Element fully visible | Overlay clipped away |
| Keyframes | `clip-path` + `opacity` | `clip-path` only (no opacity) |

### Syntax

Morph uses the same function-call syntax as other animations, specified via `animate-self` or `animate`:

```html
<lay-out animate-self="morph(circle)">
<lay-out animate-self="morph(inset)">
<lay-out animate-self="morph(polygon)">
```

### Morph Types

| Value | Shape | Description |
|-------|-------|-------------|
| `morph(circle)` | Circle | Overlay shrinks from full coverage to a point |
| `morph(inset)` | Rectangle | Overlay contracts from all edges |
| `morph(polygon)` | Diamond | Overlay morphs from rectangle to diamond |

### Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--layout-morph-bg` | `var(--layout-bg, black)` | Overlay color — set to match the previous section |

### Integration With Existing System

Morph reuses the animation system's custom properties via inheritance on `::after`:

- **Pace entry tokens** (in the same `animate-self`/`animate` value) control `animation-range` (via `--_animrs` / `--_animre`)
- **Pace exit tokens** activate a second animation slot that reverses the morph
- **`easing`** sets `animation-timing-function` (via `--animtm`)
- **Other animations** can be combined in the same attribute — e.g. `animate-self="fade-up() morph(circle)"`

### Usage

```html
<!-- Circle morph — overlay matches previous section -->
<lay-out bleed="0" animate-self="morph(circle)"
         style="--layout-bg: #e2e8f0; --layout-morph-bg: #0f172a;">

<!-- Inset morph with slow pace -->
<lay-out bleed="0" animate-self="morph(inset) slow"
         style="--layout-bg: #1e293b; --layout-morph-bg: #e2e8f0;">

<!-- Polygon morph with exit (overlay returns on scroll-back) -->
<lay-out bleed="0" animate-self="morph(polygon) exit"
         style="--layout-bg: #7c3aed; --layout-morph-bg: #0d9488;">

<!-- Combined: content fades up while overlay morphs away -->
<lay-out bleed="0" animate-self="fade-up() morph(polygon)"
         style="--layout-bg: #0f172a; --layout-morph-bg: #ea580c;">

<!-- Custom easing -->
<lay-out bleed="0" animate-self="morph(circle)" easing="ease-spring-3"
         style="--layout-bg: #ea580c; --layout-morph-bg: #7c3aed;">
```

### Section Transition Pattern

For seamless transitions between full-screen sections, set `--layout-morph-bg` on each section to match the `--layout-bg` of the section above:

```html
<lay-out bleed="0" style="--layout-bg: navy; min-height: 100vh;">
  <!-- Section 1 -->
</lay-out>

<lay-out bleed="0" animate-self="morph(circle)"
         style="--layout-bg: white; --layout-morph-bg: navy; min-height: 100vh;">
  <!-- Section 2: navy overlay morphs away to reveal white -->
</lay-out>

<lay-out bleed="0" animate-self="morph(inset)"
         style="--layout-bg: darkgreen; --layout-morph-bg: white; min-height: 100vh;">
  <!-- Section 3: white overlay morphs away to reveal green -->
</lay-out>
```
