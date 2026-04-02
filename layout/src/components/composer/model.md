# Layout Model Documentation

This document describes the data model for the `lay-out` component.

## Properties

### bleed
- **Type:** `number`
- **Default:** `0`
- **Description:** Controls full-width bleed effect as a percentage (0-100). When non-zero, the layout extends beyond its container with adjusted padding.

### colGap
- **Type:** `number`
- **Default:** `1`
- **Description:** Horizontal gap between columns, multiplied by the space unit (default 1rem).

### columns
- **Type:** `string` (length | custom-ident)
- **Default:** `"1fr"`
- **Description:** Grid template columns definition (CSS grid-template-columns syntax).

### decorations
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enables visual decorations (lines/rules) between columns and rows.

### maxWidth
- **Type:** `string` (length | percentage)
- **Default:** `"100vw"`
- **Description:** Maximum inline size of the layout container.

### overflow
- **Type:** `string`
- **Default:** `""`
- **Possible values:**
  - `""` - No overflow behavior (default grid layout)
  - `"none"` - Hidden overflow
  - `"preview"` - Horizontal scroll with preview of next item
  - `"dynamic"` - Horizontal scroll with dynamic preview sizing
- **Description:** Controls overflow behavior and scroll snapping. When set, switches from grid to flex layout with horizontal scrolling.

### padBottom
- **Type:** `number`
- **Default:** `0`
- **Description:** Padding at the bottom (block-end), multiplied by the space unit.

### padInline
- **Type:** `number`
- **Default:** `0`
- **Description:** Horizontal (inline) padding, multiplied by the space unit.

### padTop
- **Type:** `number`
- **Default:** `0`
- **Description:** Padding at the top (block-start), multiplied by the space unit.

### rowGap
- **Type:** `number`
- **Default:** `1`
- **Description:** Vertical gap between rows, multiplied by the space unit (default 1rem).

### rows
- **Type:** `string` (length | custom-ident)
- **Default:** `"auto"`
- **Description:** Grid template rows definition (CSS grid-template-rows syntax).

### self
- **Type:** `string` (custom-ident)
- **Default:** `"auto"`
- **Description:** Controls the layout's placement within its parent grid (CSS place-self property).

### size
- **Type:** `string` (length | custom-ident)
- **Default:** `""`
- **Description:** Sets the contain-intrinsic-size for content-visibility optimization.

### spaceBottom
- **Type:** `number`
- **Default:** `0`
- **Description:** Margin at the bottom (block-end), multiplied by the space unit.

### spaceTop
- **Type:** `number`
- **Default:** `0`
- **Description:** Margin at the top (block-start), multiplied by the space unit.

### width
- **Type:** `string`
- **Default:** `""`
- **Possible values:**
  - `""` - No preset width (uses maxWidth)
  - `"xs"` - Extra small (default: 20rem)
  - `"sm"` - Small (default: 30rem)
  - `"md"` - Medium (default: 48rem)
  - `"lg"` - Large (default: 64rem)
  - `"xl"` - Extra large (default: 80rem)
  - `"xxl"` - Extra extra large (default: 96rem)
- **Description:** Preset width constraints. Sets max-inline-size to predefined breakpoint values.

## Responsive Breakpoints

### breakpoints
- **Type:** `object`
- **Default:** All empty strings
- **Properties:**
  - `xs` - Extra small breakpoint layout (240px+)
  - `sm` - Small breakpoint layout (380px+)
  - `md` - Medium breakpoint layout (540px+)
  - `lg` - Large breakpoint layout (720px+)
  - `xl` - Extra large breakpoint layout (920px+)
  - `xxl` - Extra extra large breakpoint layout (1140px+)
- **Description:** Define different layout patterns for different screen sizes. Each breakpoint accepts a layout pattern string (e.g., `"columns(2)"`, `"bento(4a)"`, `"grid(3c)"`).
- **Example:**
  ```json
  "breakpoints": {
    "md": "columns(2)",
    "lg": "bento(4a)"
  }
  ```
  Generates: `<lay-out md="columns(2)" lg="bento(4a)">`

## Animation

### animation
- **Type:** `object`
- **Default:** Both properties empty strings
- **Properties:**
  - `name` - Animation effect name
  - `range` - Animation scroll range

#### animation.name
- **Type:** `string`
- **Default:** `""`
- **Possible values:**
  - **Fade**: `fade-in`, `fade-up`, `fade-down`, `fade-left`, `fade-right`, `fade-in-scale`, `fade-out`, `fade-out-scale`
  - **Bounce**: `bounce`, `bounce-in-up`, `bounce-in-down`, `bounce-in-left`, `bounce-in-right`
  - **Zoom**: `zoom-in`, `zoom-out`, `zoom-in-rotate`, `zoom-out-rotate`
  - **Slide**: `slide-in`, `slide-out`, `slide-up`, `slide-down`
  - **Flip**: `flip-up`, `flip-down`, `flip-left`, `flip-right`, `flip-diagonal`
  - **Reveal**: `reveal`, `reveal-circle`, `reveal-polygon`
  - **Other**: `opacity`
- **Description:** The scroll-triggered animation effect to apply. Can combine multiple animations (space-separated).

#### animation.range
- **Type:** `string`
- **Default:** `""` (uses default: entry 0% to entry 75%)
- **Possible values:**
  - `""` - Default entry animation range
  - `"contain"` - Animates from entry to middle (entry 0% → contain 50%)
  - `"cover"` - Delayed start through cover (entry 25% → cover 50%)
  - `"exit"` - Animates on scroll exit (exit 0% → exit 100%)
  - Custom value - Any developer-defined range name
- **Description:** Controls when the animation plays during scroll. Developers can define custom ranges in CSS using `[range="custom-name"]` selectors to override animation timing and properties.
- **Example:**
  ```json
  "animation": {
    "name": "fade-in zoom-in",
    "range": "contain"
  }
  ```
  Generates: `<lay-out animation="fade-in zoom-in" range="contain">`

### Custom Animation Ranges

Developers can create custom animation ranges in CSS:

```css
[range="slow-dramatic"] {
  --_animrs: entry 0%;
  --_animre: cover 100%;
  --_zi: 0.3;
  --animtm: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Available CSS custom properties for animation customization:
- `--_animrs` - Animation range start
- `--_animre` - Animation range end
- `--_tx` - Translation X in pixels (default: 55px)
- `--_ty` - Translation Y in pixels (default: 110px)
- `--_txv` - Translation X in viewport units (default: 100vw)
- `--_tyv` - Translation Y in viewport units (default: 100vh)
- `--_zi` - Zoom-in scale factor (default: 0.6)
- `--_zo` - Zoom-out scale factor (default: 1.2)
- `--_dg` - Rotation degree for flip animations (default: 100deg)
- `--animtm` - Animation timing function (default: linear)
- `--animfm` - Animation fill mode (default: forwards)

## Notes

- All numeric spacing values (gaps, padding, margins) are multiplied by `--layout-space-unit` (default: 1rem)
- The `bleed` attribute interacts with `width` and `padInline` to create full-width sections with controlled content width
- When `overflow` is set, the layout switches from CSS Grid to Flexbox for horizontal scrolling behavior
- Breakpoint values should match available layout patterns from your layout.config.json
- Animations require browser support for scroll-driven animations (view-timeline)
