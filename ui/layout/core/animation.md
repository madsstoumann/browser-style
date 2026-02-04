# Layout Animation System

Scroll-driven animations for the `lay-out` component. Elements animate as they enter the viewport — no JavaScript required.

## Attributes

| Attribute | Target | Description |
|-----------|--------|-------------|
| `animation` | Container | Animates the entire `lay-out` element |
| `animation-items` | Children | Animates each direct child independently |
| `range` | Container | Controls the scroll range (`contain`, `cover`, `exit`) |

Both attributes can be combined on the same element.

## Available Animations

### Fade
`fade-in` `fade-out` `fade-up` `fade-down` `fade-left` `fade-right`
`fade-up-left` `fade-up-right` `fade-down-left` `fade-down-right`
`fade-in-scale` `fade-out-scale`

### Bounce
`bounce` `bounce-in-up` `bounce-in-down` `bounce-in-left` `bounce-in-right`

### Flip
`flip-up` `flip-down` `flip-left` `flip-right` `flip-diagonal`

### Slide
`slide-up` `slide-down` `slide-in` `slide-out`

### Zoom
`zoom-in` `zoom-in-rotate` `zoom-out` `zoom-out-rotate`

### Reveal
`reveal` `reveal-circle` `reveal-polygon`

### Other
`opacity`

## Multiplier

Append `(1)`, `(2)`, or `(3)` to control animation intensity. Omitting the multiplier defaults to `1`.

```html
<lay-out animation="fade-up">          <!-- default: 110px -->
<lay-out animation="fade-up(2)">       <!-- 2x: 220px -->
<lay-out animation="fade-up(3)">       <!-- 3x: 330px -->

<lay-out animation-items="zoom-in(2)"> <!-- 2x zoom on each child -->
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

## Item Animation

Animate each child of the container independently, staggered by scroll position:

```html
<lay-out animation-items="fade-up" lg="columns(3)">
  <div>...</div>
  <div>...</div>
  <div>...</div>
</lay-out>
```

Children stagger automatically — each child's animation range is offset so they animate sequentially as the container scrolls into view.

Supported item animations: `fade-up`, `fade-down`, `fade-left`, `fade-right`, `fade-in`, `zoom-in`, `flip-up`.

### Deep Animations

The `deep` modifier animates grandchildren (elements *inside* each item) with stagger relative to both item position and element order:

```html
<lay-out animation-items="fade-up deep" lg="columns(3)">
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
<lay-out animation-items="fade-up(2) deep" lg="columns(3)">
```

## Custom Properties (Public API)

Override these on any `[animation]` or `[animation-items]` element:

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
<lay-out animation="fade-up(2)" style="--layout-anim-ty: 200px">
<!-- Result: 200px * 2 = 400px translation -->
```

## Scroll Ranges

Control when the animation plays relative to the viewport:

```html
<lay-out animation="fade-up" range="contain">
<lay-out animation="fade-up" range="cover">
<lay-out animation="fade-up" range="exit">
```

| Range | Start | End |
|-------|-------|-----|
| *(default)* | `entry 0%` | `entry 75%` |
| `contain` | `entry 0%` | `contain 50%` |
| `cover` | `entry 25%` | `cover 50%` |
| `exit` | `exit 0%` | `exit 100%` |

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
