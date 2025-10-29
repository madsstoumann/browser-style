# Layout Model Documentation

This document describes the data model for the `lay-out` component.

## Properties

### ariaLabel
- **Type:** `string`
- **Default:** `""`
- **Description:** Accessible label for the layout. When set, displays as a header before the content.

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

### theme
- **Type:** `string`
- **Default:** `""`
- **Possible values:**
  - `""` - No theme (default)
  - `"primary"` - Primary theme colors
  - `"secondary"` - Secondary theme colors
  - `"tertiary"` - Tertiary theme colors
- **Description:** Applies predefined color theme to background and text color.

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

## Notes

- All numeric spacing values (gaps, padding, margins) are multiplied by `--layout-space-unit` (default: 1rem)
- The `bleed` attribute interacts with `width` and `padInline` to create full-width sections with controlled content width
- When `overflow` is set, the layout switches from CSS Grid to Flexbox for horizontal scrolling behavior
