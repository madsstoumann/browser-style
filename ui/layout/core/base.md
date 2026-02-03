## lay-out attributes (core)

This file documents the HTML attributes consumed by the `lay-out` component in `base.css` (same folder).

Each entry lists the attribute name, accepted type(s), default (where applicable), short description and examples.

### Summary checklist

- Extracted from `attr()` usages and attribute selectors in `base.css`.
- Includes types, defaults and short usage examples.

---

### bleed
- Type: <number> (interpreted as percent in calculations)
- Default: 0
- Description: Controls horizontal "bleed" expansion beyond the normal max width. Used to calculate padding and scaling when `bleed` is present.
- Examples:
  - `bleed` (boolean presence) — enable bleed with default value 0
  - `bleed="10"` — set bleed to 10 (used as 10%)

### col-gap
- Type: <number>
- Default: 1
- Description: Multiplier for column gap using the `--layout-space-unit` (used to compute `column-gap`).
- Example: `col-gap="2"` (doubles the gap)

### columns
- Type: <length> | <custom-ident>
- Default: `1fr`
- Description: Passed to `grid-template-columns`. Accepts any valid grid-template-columns value such as `1fr 1fr`, `repeat(3, 1fr)`, `minmax(200px, 1fr)`, or a single custom-ident like `auto`.
- Examples: `columns="1fr 2fr"`, `columns="repeat(3, 1fr)"`

### rows
- Type: <length> | <custom-ident>
- Default: `auto`
- Description: Passed to `grid-template-rows`.
- Examples: `rows="auto 200px"`, `rows="repeat(2, auto)"`

### space-bottom (space-top)
- Type: <number>
- Default: 0
- Description: Top / bottom spacing multipliers applied to `margin-block-start` / `margin-block-end` respectively, multiplied by `--layout-space-unit`.
- Examples: `space-top="2"`, `space-bottom="1.5"`

### max-width
- Type: <length> | <percentage>
- Default: `100vw`
- Description: Sets the layout's maximum inline size (mapped to `--layout-mw`).
- Examples: `max-width="80rem"`, `max-width="90%"`

### pad-bottom (pad-top, pad-inline)
- Type: <number>
- Default: 0
- Description: Padding multipliers applied to block/inline padding using `--layout-space-unit` as base.
- Examples: `pad-top="1"`, `pad-bottom="0.5"`, `pad-inline="2"`

### self
- Type: <custom-ident>
- Default: `auto`
- Description: Maps to `place-self` / `--layout-ps` to control alignment of the layout itself.
- Examples: `self="center"`, `self="start"`, `self="stretch"`

### row-gap
- Type: <number>
- Default: 1
- Description: Multiplier for `row-gap`, multiplied by `--layout-space-unit`.
- Example: `row-gap="2"`

### size
- Type: <length> | <custom-ident>
- Default: `auto`
- Description: Used with `contain-intrinsic-size` / `content-visibility`. Accepts CSS lengths (e.g., `300px`, `20rem`) or identifiers like `auto`.
- Example: `size="300px"` or `size="auto"`

### gap
- Type: boolean/presence
- Default: false (when absent)
- Description: When present, enables column/row rules (visual separators) controlled by supporting CSS variables.
- Example: `gap` (just include the attribute)

### overflow
- Type: token list (space-separated tokens)
- Accepted tokens: `none`, `preview`, `preview-xs`, `preview-sm`, `preview-lg`, `preview-xl`, `fade`, `fade-start`, `fade-end`
- Default: not present
- Description: Enables an overflow behavior; when present the layout switches to a horizontal scroller. Use tokens to select variants:
  - `overflow="none"` — hides overflow (no scroll)
  - `overflow="preview"` — shows a partial preview of the next item (reserves 100px preview width)
  - `overflow="preview-xs"` — extra small preview (25px)
  - `overflow="preview-sm"` — small preview (50px)
  - `overflow="preview-lg"` — large preview (150px)
  - `overflow="preview-xl"` — extra large preview (200px)
  - `overflow="preview fade"` — adds fade masks to both edges (animated on scroll)
  - `overflow="preview fade-start"` — adds fade mask to start edge only
  - `overflow="preview fade-end"` — adds fade mask to end edge only
- Examples: `overflow="preview"`, `overflow="preview-lg fade"`, `overflow="preview fade-end"`

### width
- Type: specific id
- Accepted values: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`
- Description: Convenience size tokens that map to configured max-width variables (e.g., `--layout-width-md`). When `width` is present and `bleed` is not set, `max-inline-size` is limited to the selected value.
- Example: `width="md"`

### lanes-min
- Type: <length> | <custom-ident>
- Default: `10rem`
- Description: Minimum column width for `lanes(auto)` layouts. Used with CSS `display: grid-lanes` (masonry) to create responsive auto-fill columns. Sets `--layout-lanes-min`.
- Examples: `lanes-min="12rem"`, `lanes-min="200px"`

### lanes-max
- Type: <length> | <custom-ident>
- Default: `1fr`
- Description: Maximum column width for `lanes(auto)` layouts. Used with CSS `display: grid-lanes` (masonry). Sets `--layout-lanes-max`.
- Examples: `lanes-max="1fr"`, `lanes-max="300px"`

---

### Example usage (HTML)

```html
<lay-out
  columns="repeat(3, 1fr)"
  col-gap="2"
  pad-inline="1"
  gap
  overflow="preview"
  width="md"
  bleed="10"
>
  <!-- children -->
</lay-out>
```

### Example usage (Lanes/Masonry)

```html
<!-- Fixed 4-column masonry layout -->
<lay-out sm="lanes(2)" lg="lanes(4)">
  <img src="photo1.jpg" alt="Photo">
  <img src="photo2.jpg" alt="Photo">
  <!-- ... more items -->
</lay-out>

<!-- Auto-fill masonry with custom min-width -->
<lay-out sm="lanes(2)" lg="lanes(auto)" lanes-min="12rem" lanes-max="1fr">
  <img src="photo1.jpg" alt="Photo">
  <img src="photo2.jpg" alt="Photo">
  <!-- ... more items -->
</lay-out>
```

### Example usage (Overflow with Fade Masks)

```html
<!-- Horizontal scroller with large preview and fade on both edges -->
<lay-out md="columns(3)" overflow="preview-lg fade">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <!-- ... more items -->
</lay-out>

<!-- Scroller with fade only at the end -->
<lay-out md="columns(4)" overflow="preview fade-end">
  <div>Item 1</div>
  <div>Item 2</div>
  <!-- ... more items -->
</lay-out>
```

### Notes and hints
- Numeric attributes documented here (e.g., `col-gap`, `pad-inline`, `row-gap`, `space-top`) are multiplied by the component's `--layout-space-unit` CSS variable. Provide numbers (unitless) not lengths.
- Attributes typed as `<length>` should include units (px, rem, vw, etc.) unless using percentage where allowed.
- `overflow` is parsed as a token list (space-separated). Use `~=` matching in CSS selectors (e.g., `[overflow~="none"]`).
- The implementation relies on `attr()` to copy attribute values into CSS custom properties. Keep attribute names and value syntax compatible with the types listed above.
- **Lanes/Masonry**: Uses CSS `display: grid-lanes` when supported. For browsers without support, falls back to CSS multi-column layout (`column-count`). The `lanes-min` and `lanes-max` attributes only affect `lanes(auto)` - numbered lanes (`lanes(2)` through `lanes(6)`) use fixed column counts.

---

## Breakpoint Spacing Tokens

Spacing tokens can be embedded in breakpoint attributes alongside layout tokens. They use a **multiplier** (0–4) applied to `--layout-space-unit`, overriding the same CSS custom properties that the global attributes set.

### Available tokens

| Token | CSS Custom Property | CSS Property | Default |
|-------|-------------------|--------------|---------|
| `pbe(N)` | `--layout-pbe` | `padding-block-end` | 0 |
| `pbs(N)` | `--layout-pbs` | `padding-block-start` | 0 |
| `pi(N)` | `--layout-pi` | `padding-inline` | 0 |
| `mbe(N)` | `--layout-mbe` | `margin-block-end` | 0 |
| `mbs(N)` | `--layout-mbs` | `margin-block-start` | 0 |
| `cg(N)` | `--layout-colmg` | `column-gap` | 1 |
| `rg(N)` | `--layout-rg` | `row-gap` | 1 |

**N** = 0, 1, 2, 3, or 4.

### Coexistence with global attributes

Global HTML attributes (`pad-inline`, `col-gap`, etc.) set the default multiplier via `attr()` at all breakpoints. Breakpoint tokens override the same CSS custom property at specific breakpoints. Values persist through larger breakpoints until explicitly overridden.

### Example usage (Breakpoint Spacing)

```html
<!-- Responsive padding and gaps -->
<lay-out md="columns(2) pi(1) pbs(1) pbe(1)" lg="columns(4) pi(4) pbs(2) pbe(2)">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</lay-out>

<!-- Global attribute with breakpoint override -->
<lay-out pad-inline="1" lg="columns(3) pi(3)">
  <!-- pad-inline=1 is the default; at lg, pi overrides to 3 -->
</lay-out>

<!-- Gap control -->
<lay-out md="columns(2) cg(1) rg(2)" lg="columns(4) cg(2) rg(1)">
  ...
</lay-out>
```

---

## CSS Custom Properties (Styling Hooks)

These properties allow styling layouts without writing custom selectors. Set them on `lay-out` or a parent element.

### --layout-bg
- Default: `transparent`
- Description: Background color of the layout.
- Example: `--layout-bg: hsl(220 100% 95%);`

### --layout-bdrs
- Default: `0`
- Description: Border radius of the layout.
- Example: `--layout-bdrs: 8px;`

### --layout-c
- Default: `inherit`
- Description: Text color within the layout.
- Example: `--layout-c: #333;`

### --layout-space-unit
- Default: `1rem`
- Description: Base unit for all spacing calculations (gaps, padding, margins).
- Example: `--layout-space-unit: 0.5rem;`

### --layout-preview-size
- Default: `100px`
- Description: Width of the preview area when `overflow="preview"` is set.
- Example: `--layout-preview-size: 80px;`

### --layout-preview-xs-size
- Default: `25px`
- Description: Extra small preview size (used with `overflow="preview-xs"`).

### --layout-preview-sm-size
- Default: `50px`
- Description: Small preview size (used with `overflow="preview-sm"`).

### --layout-preview-lg-size
- Default: `150px`
- Description: Large preview size (used with `overflow="preview-lg"`).

### --layout-preview-xl-size
- Default: `200px`
- Description: Extra large preview size (used with `overflow="preview-xl"`).

### Example (custom styling)

```css
/* Style all layouts */
lay-out {
  --layout-bg: #f5f5f5;
  --layout-bdrs: 8px;
  --layout-c: #333;
}

/* Style specific layouts */
lay-out[lg="bento(6a)"] {
  --layout-bg: hsl(220 100% 95%);
}
```
