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
- Accepted tokens: `none`, `preview`, `dynamic` (also acts as boolean presence)
- Default: not present
- Description: Enables an overflow behavior; when present the layout switches to a horizontal scroller. Use tokens to select variants:
  - `overflow="none"` — hides overflow (no scroll)
  - `overflow="preview"` — shows a preview item size (reserve preview width)
  - `overflow="dynamic"` — dynamic variant that subtracts the preview size from item width
- Example: `overflow="preview"` or `overflow="none"`

### theme
- Type: specific id
- Accepted values: `primary`, `secondary`, `tertiary`
- Description: Applies theme-specific color variables (background and color) defined in CSS.
- Example: `theme="primary"`

### width
- Type: specific id
- Accepted values: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`
- Description: Convenience size tokens that map to configured max-width variables (e.g., `--layout-width-md`). When `width` is present and `bleed` is not set, `max-inline-size` is limited to the selected value.
- Example: `width="md"`

---

### Example usage (HTML)

```html
<lay-out
  columns="repeat(3, 1fr)"
  col-gap="2"
  pad-inline="1"
  gap
  overflow="preview"
  theme="primary"
  width="md"
  bleed="10"
>
  <!-- children -->
</lay-out>
```

### Notes and hints
- Numeric attributes documented here (e.g., `col-gap`, `pad-inline`, `row-gap`, `space-top`) are multiplied by the component's `--layout-space-unit` CSS variable. Provide numbers (unitless) not lengths.
- Attributes typed as `<length>` should include units (px, rem, vw, etc.) unless using percentage where allowed.
- `overflow` is parsed as a token list (space-separated). Use `~=` matching in CSS selectors (e.g., `[overflow~="none"]`).
- The implementation relies on `attr()` to copy attribute values into CSS custom properties. Keep attribute names and value syntax compatible with the types listed above.

If you'd like, I can add examples for each attribute in the `ui/` examples folder or generate a small cheatsheet image.
