---
sidebar_label: Layout Config
---

# 🟠 Layout Config

Layout configuration presets control the visual presentation of a [layout](./layout.md) — responsive breakpoints with integrated spacing, grid defaults, overflow behavior, and animations.

Schema: [`models/layout-config.schema.json`](../models/layout-config.schema.json)

---

## Responsive Breakpoints (the core concept)

The layout system uses **6 container-width breakpoints**. Each breakpoint value is a **space-separated string** containing a layout pattern and optional spacing tokens that apply at that breakpoint and above.

```
xs="columns(1) pi(1) pbs(1) pbe(1)"
md="columns(2) pi(2) pbs(1) pbe(1) cg(2) rg(2)"
lg="columns(3) pi(3) pbs(2) pbe(2) cg(2) rg(2)"
```

This means layout **and** spacing change together per breakpoint — no separate spacing fields. Mobile gets tight padding with a single column; desktop gets wider padding with a multi-column grid.

### Breakpoints

| Field | Min width | Typical use |
|-------|----------|-------------|
| `xs` | 240px | Extra small mobile |
| `sm` | 380px | Small mobile |
| `md` | 540px | Tablet |
| `lg` | 720px | Tablet / desktop |
| `xl` | 920px | Desktop |
| `xxl` | 1140px | 2K+ displays |

### Breakpoint Value Syntax

Each breakpoint value is a space-separated string with **one layout pattern** (required) and **zero or more spacing tokens** (optional):

```
"<layout-pattern> [<spacing-token>] [<spacing-token>] ..."
```

Example: `"columns(3) pi(2) pbs(1) cg(2)"` means:
- `columns(3)` — 3-column grid layout
- `pi(2)` — padding-inline: 2 units
- `pbs(1)` — padding-block-start: 1 unit
- `cg(2)` — column-gap: 2 units

### Spacing Tokens

All spacing values are **multipliers (0–4)** applied to `--layout-space-unit` (default `1rem`). A value of `0` means no spacing; `4` means `4rem`.

| Token | CSS Property | Description |
|-------|-------------|-------------|
| `cg(N)` | `column-gap` | Gap between columns |
| `mbe(N)` | `margin-block-end` | Bottom margin |
| `mbs(N)` | `margin-block-start` | Top margin |
| `pbe(N)` | `padding-block-end` | Bottom padding |
| `pbs(N)` | `padding-block-start` | Top padding |
| `pi(N)` | `padding-inline` | Left/right padding |
| `rg(N)` | `row-gap` | Gap between rows |

### How Values Cascade

Breakpoint values **persist upward** until overridden. If you set `pi(1)` at `xs` and don't set `pi()` again until `lg`, the padding-inline remains `1` through `sm` and `md`:

```
xs="columns(1) pi(1) pbs(1)"       ← applies at 240px+
md="columns(2) cg(2)"              ← layout changes, but pi and pbs persist from xs
lg="columns(3) pi(3) pbs(2) cg(2)" ← pi and pbs now increase
```

This means you only need to specify tokens that **change** at each breakpoint.

---

## Fields

### Core

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | yes | Preset name, e.g. "Hero Full Width", "Card Grid Narrow" |
| `aria_label` | string | | Accessibility label for the layout section |

### Grid Defaults

These are **fallback defaults** that apply when no breakpoint layout pattern overrides them.

| Field | Type | Description |
|-------|------|-------------|
| `col_gap` | number | Default column gap multiplier (0–4). Overridden by `cg()` token in breakpoints. |
| `columns` | string | Default CSS `grid-template-columns` (default: `"1fr"`). Overridden by breakpoint layout patterns. |
| `row_gap` | number | Default row gap multiplier (0–4). Overridden by `rg()` token in breakpoints. |
| `rows` | string | Default CSS `grid-template-rows` (default: `"auto"`) |

### Dimensions

| Field | Type | Description |
|-------|------|-------------|
| `bleed` | number | Full-bleed layout (0 = contained, 1 = full bleed) |
| `max_width` | string | Maximum width (CSS value, e.g. `"1200px"`, `"80ch"`) |
| `overflow` | string | Overflow behavior — see [Overflow Patterns](#overflow-patterns) |
| `self` | string | CSS `place-self` alignment value |
| `size` | string | Content visibility intrinsic size hint |
| `width` | string | Width (CSS value, e.g. `"100%"`) |

### Animation

| Field | Type | Description |
|-------|------|-------------|
| `animation_name` | string | Animation name, e.g. `"fade-in"`, `"slide-up"` |
| `animation_range` | string | Animation range, e.g. `"entry 0% cover 50%"` |
| `decorations` | boolean | Enable decorative elements (gap rules) |

---

## Layout Patterns

The layout system provides 63+ predefined patterns organized by category. These are used as the first token in a breakpoint value.

### Columns (1–6)

Equal-width column layouts.

| Pattern | Items | Description |
|---------|:-----:|-------------|
| `columns(1)` | any | Single column, 100% width |
| `columns(2)` | 2+ | Two equal columns (50/50) |
| `columns(3)` | 3+ | Three equal columns (33/33/33) |
| `columns(4)` | 4+ | Four equal columns (25 each) |
| `columns(5)` | 5+ | Five equal columns (20 each) |
| `columns(6)` | 6+ | Six equal columns (16.67 each) |

### Ratios

Two or three columns with explicit width ratios.

| Pattern | Description |
|---------|-------------|
| `ratio(25:75)` | Narrow left, wide right |
| `ratio(33:66)` | One-third / two-thirds |
| `ratio(40:60)` | Slightly asymmetric |
| `ratio(60:40)` | Slightly asymmetric (reversed) |
| `ratio(66:33)` | Two-thirds / one-third |
| `ratio(75:25)` | Wide left, narrow right |
| `ratio(25:25:50)` | Two narrow, one wide |
| `ratio(25:50:25)` | Narrow, wide, narrow |
| `ratio(50:25:25)` | One wide, two narrow |

### Grid

Mixed-size grid layouts with specific item counts.

| Pattern | Items | Description |
|---------|:-----:|-------------|
| `grid(3a–3d)` | 3 | Four variants of 3-item mixed layouts |
| `grid(4a–4e)` | 4 | Five variants of 4-item mixed layouts |
| `grid(5a–5h)` | 5 | Eight variants of 5-item asymmetric layouts |
| `grid(6a–6b)` | 6 | Two variants of 6-item layouts |

### Bento

Fixed-item layouts with predetermined tile arrangements (inspired by Apple's bento grid).

| Pattern | Items | Description |
|---------|:-----:|-------------|
| `bento(4a)` | 4 | 4-item bento arrangement |
| `bento(6a–6b)` | 6 | Two 6-item arrangements |
| `bento(7a–7c)` | 7 | Three 7-item arrangements |
| `bento(8a–8b)` | 8 | Two 8-item arrangements |
| `bento(9a–9b)` | 9 | Two 9-item arrangements |

### Mosaic

Irregular, artistic layouts.

| Pattern | Description |
|---------|-------------|
| `mosaic(photo)` | Photo gallery style |
| `mosaic(scatter)` | Scattered arrangement |
| `mosaic(hex)` | Hexagonal pattern |
| `mosaic(pinwheel)` | Pinwheel rotation |
| `mosaic(cornerstone)` | Cornerstone emphasis |

### Asymmetrical

Two-column layouts with dramatic size differences.

| Pattern | Description |
|---------|-------------|
| `asym(l-r)` | Large left, small right |
| `asym(r-l)` | Small left, large right |
| `asym(t-b)` | Large top, small bottom |
| `asym(b-t)` | Small top, large bottom |
| `asym(tl-br)` | Top-left emphasis, bottom-right |
| `asym(bl-tr)` | Bottom-left emphasis, top-right |

### Lanes (Masonry)

Column-based masonry layouts.

| Pattern | Description |
|---------|-------------|
| `lanes(2)–lanes(6)` | Fixed column count masonry |
| `lanes(auto)` | Auto-fill with configurable min/max width |

For `lanes(auto)`, the item width range is configurable via `lanes-min` and `lanes-max` attributes.

### Stack

| Pattern | Description |
|---------|-------------|
| `stack` | Single column stacked layout |
| `stack(reveal)` | Scroll-triggered sticky reveal effect |

### Autofit

| Pattern | Description |
|---------|-------------|
| `auto(fit)` | Auto-fitting to available space |
| `auto(fill)` | Auto-filling available space |

---

## Overflow Patterns

The `overflow` field controls horizontal scrolling behavior with optional fade masks:

| Value | Description |
|-------|-------------|
| `fade` | Horizontal scroll with fade mask on both edges |
| `fade-end` | Fade mask on end edge only |
| `fade-start` | Fade mask on start edge only |
| `none` | No overflow (default) |
| `preview` | Horizontal scroll with next-item peek (100px) |
| `preview-lg` | Large peek (150px) |
| `preview-sm` | Small peek (60px) |
| `preview-xl` | Extra large peek (200px) |
| `preview-xs` | Smaller peek (40px) |

---

## CSS Custom Properties

Layout configs map to CSS custom properties on the rendered `<lay-out>` element:

### Spacing (set by breakpoint tokens)

| Property | Set by | Default |
|----------|--------|---------|
| `--layout-colmg` | `cg(N)` | `1` |
| `--layout-mbe` | `mbe(N)` | `0` |
| `--layout-mbs` | `mbs(N)` | `0` |
| `--layout-pbe` | `pbe(N)` | `0` |
| `--layout-pbs` | `pbs(N)` | `0` |
| `--layout-pi` | `pi(N)` | `0` |
| `--layout-rg` | `rg(N)` | `1` |

### Styling

| Property | Description | Default |
|----------|-------------|---------|
| `--layout-bdrs` | Border radius | `0` |
| `--layout-bg` | Background color | `transparent` |
| `--layout-c` | Text color | `inherit` |
| `--layout-mw` | Max width | `100%` |
| `--layout-space-unit` | Base spacing unit (all tokens multiply this) | `1rem` |
| `--layout-w` | Width | `100%` |

### Grid

| Property | Description | Default |
|----------|-------------|---------|
| `--layout-gtc` | `grid-template-columns` (set by layout pattern) | `1fr` |
| `--layout-gtr` | `grid-template-rows` | `auto` |

---

## Example Presets

### Hero Full Width

```json
{
  "name": "Hero Full Width",
  "bleed": 1,
  "xs": "columns(1) pi(2) pbs(4) pbe(4)",
  "lg": "columns(1) pi(4) pbs(4) pbe(4)",
  "animation_name": "fade-up"
}
```

Mobile: single column, moderate inline padding, generous vertical padding.
Desktop: same layout, wider inline padding.

### 3-Column Card Grid

```json
{
  "name": "Card Grid 3-Col",
  "max_width": "1200px",
  "xs": "columns(1) pi(1) pbs(2) pbe(2) cg(1) rg(1)",
  "md": "columns(2) pi(2) cg(2) rg(2)",
  "lg": "columns(3) pi(2) cg(2) rg(2)"
}
```

Mobile: single column, tight gaps. Tablet: 2 columns. Desktop: 3 columns with wider gaps.

### Horizontal Scroll Cards

```json
{
  "name": "Scroll Cards",
  "overflow": "preview",
  "xs": "columns(1) pi(1) cg(1)",
  "md": "columns(3) pi(2) cg(2)"
}
```

### Bento Grid

```json
{
  "name": "Bento 6-Item",
  "xs": "columns(1) pbs(2) pbe(2) cg(1) rg(1)",
  "md": "bento(6a) cg(1) rg(1)"
}
```

### Asymmetric Feature Section

```json
{
  "name": "Feature Left-Right",
  "xs": "columns(1) pi(1) pbs(2) pbe(2)",
  "lg": "ratio(60:40) pi(3) pbs(3) pbe(3) cg(3)"
}
```

Mobile: stacked. Desktop: 60/40 split with generous spacing.

---

## CMS Editor Organization

The schema uses `structure.layout` groups to organize fields in the CMS editor:

| Group | Fields | Description |
|-------|--------|-------------|
| **Breakpoints** | `xs`, `sm`, `md`, `lg`, `xl`, `xxl` | Layout pattern + spacing tokens per breakpoint (primary editing area) |
| **Layout** | `columns`, `rows`, `col_gap`, `row_gap`, `bleed`, `max_width`, `width`, `overflow`, `self`, `size` | Global defaults and dimension overrides |
| **Advanced** | `aria_label`, `animation_name`, `animation_range`, `decorations` | Accessibility, animation, and decoration settings |

The Breakpoints group is expanded by default since it's the primary way to configure a layout. Layout and Advanced groups are collapsed.

---

## Migration from v1 (Separate Spacing Fields)

The previous schema (v1) had standalone spacing fields (`space_top`, `space_bottom`, `pad_top`, `pad_bottom`, `pad_inline`). These have been replaced by breakpoint-embedded spacing tokens.

| Old field | New equivalent |
|-----------|---------------|
| `pad_top` | `pbs(N)` in breakpoint value |
| `pad_bottom` | `pbe(N)` in breakpoint value |
| `pad_inline` | `pi(N)` in breakpoint value |
| `space_top` | `mbs(N)` in breakpoint value |
| `space_bottom` | `mbe(N)` in breakpoint value |
| `col_gap` (standalone) | `cg(N)` in breakpoint value |
| `row_gap` (standalone) | `rg(N)` in breakpoint value |

The `col_gap` and `row_gap` fields still exist as global defaults, but are overridden by `cg()` / `rg()` tokens in breakpoints. The standalone spacing fields have been removed entirely — spacing now varies per breakpoint, which is the correct behavior for responsive design.
