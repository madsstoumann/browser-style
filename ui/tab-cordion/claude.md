# Tab-Cordion Component

## Overview

Tab-Cordion is a **CSS-only** hybrid UI component that functions as an **accordion** when narrow and automatically transforms into **tabs** when its container width is >= 700px. It uses no JavaScript—the entire transformation and behavior is achieved through modern CSS features, specifically **Container Queries**.

Built with semantic `<details>` and `<summary>` HTML elements for native accessibility and keyboard navigation.

## Architecture

### HTML Structure

```html
<tab-cordion from="[accordion-tokens]" to="[tabs-tokens]">
  <cq-box>
    <details name="group-name" open>
      <summary>Tab Title<ui-icon type="icon-name"></ui-icon></summary>
      <div class="content">Panel content</div>
    </details>
    <!-- More details elements... -->
  </cq-box>
</tab-cordion>
```

### Key Elements

- **`<tab-cordion>`**: Root container with `container-type: inline-size` for responsive behavior
- **`<cq-box>`**: Grid container that manages layout transformation
- **`<details>`**: Each tab/accordion item (supports up to 8 items)
- **`<summary>`**: The clickable header/tab button
- **`<ui-icon>`**: Optional icon component (can be hidden with `noicons` token)

### Files

- **[index.css](index.css)**: Complete component styles (~600 lines)
- **[readme.md](readme.md)**: User-facing documentation
- **[demo.html](demo.html)**: Live examples demonstrating various configurations

## Core CSS Features Used

This component requires modern browser support for:

- **CSS Container Queries** (`@container`) - Responsive transformation trigger
- **CSS Anchor Positioning** (`anchor()`, `anchor-size()`) - Sliding tab indicator
- **CSS Scope** (`@scope`) - Encapsulated styles
- **CSS Nesting** - Nested selectors
- **`:has()` selector** - Parent-based styling
- **`:where()` selector** - Low-specificity styling
- **`interpolate-size: allow-keywords`** - Smooth height animations
- **`::details-content` pseudo-element** - Content visibility control

## Attributes System

The component uses **token-based attributes** with space-separated values for flexible styling.

### `from` Attribute (Accordion Mode)

Controls appearance in accordion state (default or when container width < 700px):

| Token | Effect | Notes |
|-------|--------|-------|
| `background` | Adds background color and padding to container | - |
| `breakout` | Open item "breaks out" by translating subsequent items down | Uses CSS custom property `--_y` for translation |
| `contain` | Wraps entire group in a border | Creates unified block appearance |
| `divided` | Adds separator lines between items | `border-block-end` on each item |
| `elevated` | Adds shadow instead of border (requires `breakout`) | Replaces border with `box-shadow` |
| `rounded` | Rounds corners of items | Dynamically applied based on open/closed state |
| `separate` | Separates items into distinct cards with gaps | Each item fully rounded |

### `to` Attribute (Tabs Mode)

Controls appearance when transformed to tabs (container width >= 700px):

| Token | Effect | Implementation |
|-------|--------|----------------|
| `background` | Adds background to tab header area | Via `cq-box::before` pseudo-element |
| `compact` | Tab headers compress to intrinsic width | Changes grid to `min-content auto` |
| `highlight` | Sliding "pill" background behind active tab | Via `cq-box::after` with anchor positioning |
| `line` | Sliding underline indicator instead of pill | `border-block-end` on `cq-box::after` |
| `noicons` | Hides `ui-icon` elements in tab headers | `display: none` on icons |
| `panel-bg` | Shared background for headers and content | Applied to `summary + *` |
| `rounded` | Rounds tab headers and pill/line | Applied to multiple elements |
| `shadow` | Drop shadow under content panel | Via `box-shadow` on `summary + *` |

### Hover Attributes

Separate hover effects for accordion and tabs modes:

#### `from-hover` (Accordion Hover)

Active when no `to` attribute exists OR when container width < 700px:

- `bg` - Applies `--tc-from-hover-bg` background on hover
- `accent` - Changes text color to `--tc-from-hover-accent` on hover

#### `to-hover` (Tabs Hover)

Active when `to` attribute exists AND container width >= 700px:

- `bg` - Applies `--tc-to-hover-bg` background to inactive tabs on hover
- `accent` - Changes text color to `--tc-to-hover-accent` on hover
- `line` - Shows underline on hover (uses opacity transition from 0 to 1)

## CSS Custom Properties

### Core Colors

```css
--tc-accent: light-dark(hsl(210, 100%, 45%), hsl(210, 100%, 75%))
--tc-bg: light-dark(#EEE, #222)
--tc-tabs-bg: light-dark(#EAEAEA, #222)
--tc-tabs-panel-bg: light-dark(#f7f7f7, #1c1c1c)
```

### Hover Colors

```css
/* Accordion hover */
--tc-from-hover-bg: var(--tc-hover-bg)
--tc-from-hover-accent: var(--tc-accent)

/* Tabs hover */
--tc-to-hover-bg: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.1))
--tc-to-hover-accent: var(--tc-accent)
--tc-to-hover-line: light-dark(#CCC, #888)
```

### Borders and Dimensions

```css
--tc-item-bdrs: 1em                    /* Accordion border radius */
--tc-item-bdrs-separate: 2em           /* Separate cards border radius */
--tc-item-bdw: 1px                     /* Accordion border width */
--tc-item-bdw-open: 2px                /* Open item border width */
--tc-tabs-bdrs: 3em                    /* Tabs border radius */
--tc-tabs-bdw: 4px                     /* Tabs highlight offset */
--tc-tabs-line-bdw: 3px                /* Tabs line indicator height */
```

### Spacing

```css
--tc-breakout-unit: 1rem               /* Breakout translation unit */
--tc-group-rg: 1em                     /* Gap between separate items */
--tc-item-p: 1.5ch                     /* Item padding */
--tc-item-p-separate: 1.5ch 2.5ch     /* Separate variant padding */
--tc-item-p-tabs: 1.5ch                /* Tabs padding */
--tc-tabs-gap: 2ch                     /* Gap in compact tabs */
```

### Timing

```css
--tc-item-trsdu: 300ms                 /* Global transition duration */
```

## Important Implementation Details

### Container Query Breakpoint

The transformation occurs when the component's **container width reaches 700px** (not viewport width):

```css
@container (width >= 700px) {
  /* Tabs mode styles */
}

@container (width <= 700px) {
  /* Accordion mode styles */
}
```

### Grid and Anchor Positioning

In tabs mode, the layout uses a complex grid system:

1. **Grid columns**: `repeat(var(--tab-cordion-tabs), 1fr)` - Equal width columns
2. **Grid rows**: `auto 1fr` - Header row and content row
3. **Subgrid**: Each `<details>` spans all columns and uses `subgrid`
4. **Anchor positioning**: Active tab's `<summary>` has `anchor-name: --tab-active`
5. **Sliding indicator**: `cq-box::after` tracks the active anchor

### State Management via Custom Properties

The component "counts" items and assigns indices using CSS:

```css
details:nth-child(1) { --tab-cordion-index: 1; }
/* ... up to 8 */

cq-box:has(> details:nth-child(3):last-child) { --tab-cordion-tabs: 3; }
```

This powers the grid layout and ensures proper column sizing.

### Pseudo-element Roles

- **`cq-box::before`**: Background layer for tabs (when `to~="background"`)
- **`cq-box::after`**: Sliding indicator (pill or line)
- **`summary::after`**: Hover line effect (when `to-hover~="line"`)
- **`::details-content`**: Native pseudo-element for content animation

### Transition Behavior

- **Accordion content**: Uses `block-size` and `content-visibility` transitions with `transition-behavior: allow-discrete`
- **Tabs indicator**: Smooth `inline-size` and `inset-inline-start` transitions
- **Hover effects**: Quick color and background transitions (200-300ms)

## Common Patterns and Usage

### Basic Accordion (No Transformation)

```html
<tab-cordion from="contain divided rounded">
  <cq-box><!-- details items --></cq-box>
</tab-cordion>
```

### Full-Featured Tabs

```html
<tab-cordion
  from="background contain divided rounded"
  from-hover="bg accent"
  to="background highlight rounded shadow"
  to-hover="bg">
  <cq-box><!-- details items --></cq-box>
</tab-cordion>
```

### Minimal Line Tabs

```html
<tab-cordion
  to="compact line noicons"
  to-hover="line">
  <cq-box><!-- details items --></cq-box>
</tab-cordion>
```

### Cards to Pills

```html
<tab-cordion
  from="separate rounded elevated"
  to="highlight rounded">
  <cq-box><!-- details items --></cq-box>
</tab-cordion>
```

## Known Limitations and Gotchas

### Maximum Items

The component supports **up to 8 items** (hardcoded in CSS at lines 566-582). To support more, add additional `:nth-child()` rules.

### Pseudo-element Transitions

**Issue**: The hover line effect (`to-hover~="line"`) originally used border transitions on `summary::after`, but transitions don't work when a pseudo-element is created on hover (lines 370-383).

**Solution**: The pseudo-element now exists always with `opacity: 0`, transitioning to `opacity: 1` on hover. This is the only way to achieve smooth transitions with dynamically created pseudo-elements.

### Anchor Positioning Placement

**Issue**: When using line indicators (`to~="line"`), if you place the indicator on `cq-box::after`, it appears after the entire component including the open panel content.

**Solution**: The indicator must be absolutely positioned or scoped to the grid row 1 to stay with the tab headers.

### Browser-Specific Workarounds

Lines 593-602 contain Safari-specific fixes for `::details-content` grid behavior:

```css
@supports (background: -webkit-named-image(i)) {
  details[open]::details-content { display: contents; }
  details > summary + * { grid-column: 1 / -1; grid-row: 2; }
}
```

### Accordion vs Tabs Context

When debugging or modifying:
- Styles without `to` attribute apply to **accordion-only** mode
- Styles within `@container (width >= 700px)` apply to **tabs** mode
- Hover attributes are scoped to their respective modes

## Theming and Customization

To customize colors, override the custom properties on the `tab-cordion` element:

```css
tab-cordion {
  --tc-accent: rebeccapurple;
  --tc-tabs-panel-bg: #f0f0f0;
  --tc-item-bdrs: 0.5rem;
}
```

The component uses `light-dark()` extensively for automatic dark mode support.

## Debugging Tips

1. **Tabs not appearing?** Check the component's container width is >= 700px (not viewport) and `to` attribute exists
2. **Indicator not sliding?** Verify anchor positioning support and check `details[open]` state
3. **Items not counting?** Check `:nth-child()` rules support your item count
4. **Hover not working?** Verify `@media (hover: hover)` and correct hover attribute tokens
5. **Content not animating?** Check `interpolate-size: allow-keywords` support

## Related Components

- **[ui-icon](../icon/)**: Icon component used in tab headers
