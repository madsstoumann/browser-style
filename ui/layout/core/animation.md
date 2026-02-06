# Layout Animation System

Scroll-driven animations for the `lay-out` component. Elements animate as they enter the viewport — no JavaScript required.

## Attributes

| Attribute | Target | Description |
|-----------|--------|-------------|
| `animate-self` | Container | Animates the entire `lay-out` element |
| `animate` | Children | Animates each direct child independently |
| `easing` | Container | Applies a custom easing from `easings.css` |
| `pace` | Container | Controls animation speed and entry/exit behavior (space-separated tokens) |

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
`reveal()` `reveal-circle()` `reveal-polygon()`

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

Animations without spatial properties (`fade-in`, `fade-out`, `opacity`, `reveal`, `reveal-circle`, `reveal-polygon`) are unaffected by the multiplier.

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

Children stagger automatically — each child's animation range is offset so they animate sequentially as the container scrolls into view.

All animations listed above work with `animate`.

### Clip Modifier

Add `clip` to contain child overflow during animation. Useful for animations with large translations (e.g., `slide-down`) that would otherwise leak outside the container before the animation range begins:

```html
<lay-out animate="slide-down() clip" lg="columns(3)">
```

This sets `overflow: clip` on the container. Omit it when you want slight overflow (most animations look fine without it).

### Item Exit Animations

Exit tokens from `pace` work with `animate` too. A second animation slot plays the same keyframe in reverse as the container scrolls out, with reversed stagger — the last child exits first:

```html
<!-- Items animate in on entry and out on exit -->
<lay-out animate="fade-up()" pace="exit" lg="columns(3)">

<!-- Slow entry, fast exit -->
<lay-out animate="zoom-in()" pace="slow exit-fast" lg="columns(3)">
```

Entry pace tokens (`fast`, `slow`, `slower`, `contain`, `cover`, `full`) also affect item animations.

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
- **Item offset** (`--_item-offset`) — based on which item (nth-child of the container)
- **Child offset** (`--_child-offset`) — based on element position within each item

The combined offset determines when each grandchild animates relative to the container's scroll position.

Deep can be combined with multipliers:

```html
<lay-out animate="fade-up(2) deep" lg="columns(3)">
```

## Custom Properties (Public API)

Override these on any `[animate-self]` or `[animate]` element:

| Property | Default | Description |
|----------|---------|-------------|
| `--layout-anim-ty` | `110px` | Vertical translation distance |
| `--layout-anim-tx` | `55px` | Horizontal translation distance |
| `--layout-anim-dg` | `100deg` | Rotation angle (flips) |
| `--layout-anim-txv` | `100vw` | Viewport-width translation (slides, bounces) |
| `--layout-anim-tyv` | `100vh` | Viewport-height translation (slides, bounces) |
| `--layout-anim-zi` | `0.6` | Zoom-in start scale |
| `--layout-anim-zo` | `1.2` | Zoom-out start scale |
| `--layout-anim-mult` | `1` | Multiplier (set automatically by `(1)`/`(2)`/`(3)`) |
| `--layout-anim-delay` | `0.005s` | Time factor per offset unit (scroll-triggered mode) |
| `--layout-item-timing` | `ease-out` | Timing function for item/deep animations |

Example — custom translation distance with multiplier:

```html
<lay-out animate-self="fade-up(2)" style="--layout-anim-ty: 200px">
<!-- Result: 200px * 2 = 400px translation -->
```

## Pace

Controls animation speed and when the animation plays relative to the viewport. Tokens are space-separated, so entry and exit can be combined.

### Entry Speed

| Token | Start | End | Description |
|-------|-------|-----|-------------|
| *(default)* | `entry 0%` | `entry 75%` | Normal speed — no attribute needed |
| `fast` | `entry 25%` | `entry 60%` | Narrow range, snappy |
| `slow` | `entry 0%` | `entry 100%` | Full entry phase |
| `slower` | `entry 0%` | `contain 25%` | Spills into contain |

### Entry Phase

| Token | Start | End | Description |
|-------|-------|-----|-------------|
| `contain` | `entry 0%` | `contain 50%` | Plays while element is fully visible |
| `cover` | `entry 25%` | `cover 50%` | Plays while element covers viewport |
| `full` | `entry 0%` | `exit 0%` | Entire visibility span |

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
<lay-out animate-self="fade-up()" pace="slow">

<!-- Entry + exit, default speeds -->
<lay-out animate-self="fade-up()" pace="exit">

<!-- Slow entry, fast exit -->
<lay-out animate-self="fade-up()" pace="slow exit-fast">

<!-- Fast entry, slow exit -->
<lay-out animate-self="zoom-in()" pace="fast exit-slow">

<!-- Phase + exit -->
<lay-out animate-self="flip-up()" pace="contain exit">

<!-- Item animations with exit -->
<lay-out animate="fade-up()" pace="exit" lg="columns(3)">

<!-- Item animations: slow entry + clip for slides -->
<lay-out animate="slide-down() clip" pace="slow exit" lg="columns(3)">
```

## Progressive Enhancement

The animation system uses layered feature detection:

### Layer 1: Scroll-driven animations
`@supports (view-transition-name: none)` — All modern browsers with scroll-driven animation support. Container and item animations use `animation-timeline: view()`.

### Layer 2: `sibling-index()`
`@supports (width: calc(sibling-index() * 1px))` — Replaces fixed nth-child stagger rules with dynamic calculation. Scales to any number of children without additional selectors.

### Layer 3: Scroll-triggered animations (Chrome 145+)
`@supports (timeline-trigger-name: --t)` — Enables time-based delays for deep animations, triggered by scroll position. Inner elements use `animation-delay` instead of scroll-range offsets, producing smoother stagger timing.

In this mode, `--layout-anim-delay` controls the time factor per offset unit. The existing `--_item-offset` and `--_child-offset` values are reused as delay multipliers.

## Architecture

```
Public API          --layout-anim-ty (110px)
                              |
Multiplier          --layout-anim-mult (1|2|3)
                              |
Computed            --_ty = calc(--layout-anim-ty * --layout-anim-mult)
                              |
Keyframe            translate: 0px var(--_ty)
```

Internal computed variables (`--_ty`, `--_tx`, `--_dg`, etc.) are consumed by keyframes and should not be overridden directly. Override the `--layout-anim-*` public properties instead.

### Two-Slot Animation Pattern

Both container and item animations use a two-slot pattern for entry + exit:

```
Slot 1 (entry):  animation-name: var(--_animn)          direction: normal
Slot 2 (exit):   animation-name: var(--_anim-exit, none) direction: reverse
```

The exit slot defaults to `none` (inactive). When a `pace` exit token is set, `--_anim-exit` resolves to the same keyframe as entry, played in reverse. For items, exit stagger is reversed — the last child exits first.

Easing values are sourced from `easings.css` (imported at the top of `animations.css`). The `[easing]` attribute maps the attribute value to `--animtm` (for container animations) and `--layout-item-timing` (for item animations).

---

## Proposal: Scroll-Triggered Item Animations

### Problem

Scroll-driven animations (`animation-timeline: view()`) tie animation progress directly to scroll position. This means animation speed depends entirely on how fast the user scrolls — fast scrolling produces fast animations, slow scrolling produces slow ones. The `pace` attribute helps by widening or narrowing the scroll range, but cannot guarantee consistent timing.

### Solution: `triggered` Token

A `triggered` token in the `animate` attribute opts into scroll-triggered animations (Chrome 145+), where scroll position *starts* the animation but doesn't control its progress. The animation plays at a fixed duration once triggered.

```html
<!-- Scroll-driven (current default) -->
<lay-out animate="fade-up()" lg="columns(3)">

<!-- Scroll-triggered (consistent timing) -->
<lay-out animate="fade-up() triggered" lg="columns(3)">
```

Browsers without `timeline-trigger-name` support ignore the `@supports` block and fall back to the current scroll-driven approach automatically.

### How It Works

```
┌─────────────────────────────────────────────────────┐
│  @supports (timeline-trigger-name: --t)             │
│                                                     │
│  [animate~="triggered"]                             │
│    → timeline-trigger: --layout-trigger view()      │
│       entry 25% exit 0%                             │
│    → trigger-scope: --layout-trigger                │
│                                                     │
│  [animate~="triggered"] > *                         │
│    → animation-timeline: auto  (time-based)         │
│    → animation-trigger: --layout-trigger            │
│       play-forwards play-backwards                  │
│    → animation-duration: var(--layout-anim-dur)     │
│    → animation-delay: sibling-index() * delay       │
│                                                     │
│  Fallback (no support):                             │
│    Scroll-driven via animation-timeline: --layout-tl│
│    (everything we have today)                       │
└─────────────────────────────────────────────────────┘
```

The container defines a `timeline-trigger` that fires when it enters the viewport. Children switch from scroll-driven to time-based animations, using `animation-trigger` to link to the container's trigger. Stagger uses `animation-delay` with `sibling-index()` instead of scroll-range offsets.

### Advantages Over Scroll-Driven

| Aspect | Scroll-driven | Scroll-triggered |
|--------|--------------|-----------------|
| Speed consistency | Varies with scroll speed | Fixed duration |
| Stagger mechanism | Scroll-range offsets | `animation-delay` (smoother) |
| Exit behavior | Second animation slot (reverse) | `play-backwards` on trigger |
| Easing fidelity | Limited by scroll granularity | Full CSS easing curves |

### Exit Handling

`play-backwards` on the `animation-trigger` reverses the animation when scrolling back past the trigger zone. This may replace the two-slot entry/exit pattern entirely in triggered mode — a single animation slot handles both directions.

### New Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--layout-anim-dur` | `0.5s` | Animation duration in triggered mode |
| `--layout-anim-delay` | `0.005s` | Time factor per stagger unit (already exists) |

### Pace Mapping

In scroll-driven mode, `pace` tokens set `animation-range` values. In triggered mode, the same tokens would map differently:

| Token | Scroll-driven effect | Triggered equivalent |
|-------|---------------------|---------------------|
| `fast` | Narrow scroll range | Shorter `--layout-anim-dur` |
| `slow` | Wide scroll range | Longer `--layout-anim-dur` |
| `exit` | Second animation slot | `play-backwards` (automatic) |

Whether `pace` should control the trigger's entry point, the duration, or both is an open question.

### Interaction With `deep`

Deep animations already use `timeline-trigger` in the `@supports` block. The `triggered` token would extend this pattern to regular item animations. When both `triggered` and `deep` are present, the existing deep stagger logic (item offset + child offset) applies to `animation-delay`.

### Usage

```html
<!-- Triggered with stagger -->
<lay-out animate="fade-up() triggered" lg="columns(3)">

<!-- Triggered + deep -->
<lay-out animate="fade-up() triggered deep" lg="columns(3)">

<!-- Triggered + clip for slides -->
<lay-out animate="slide-down() triggered clip" lg="columns(3)">

<!-- Custom duration -->
<lay-out animate="zoom-in() triggered" style="--layout-anim-dur: 0.8s" lg="columns(3)">
```
