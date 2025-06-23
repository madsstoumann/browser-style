# Layout System Technical Documentation

This document provides a technical overview of the `@browser.style/layout` system.

## Configuration

The layout system now uses a modular architecture for better flexibility and performance:

### Quick Start
```css
/* Basic configuration - import the main index.css */
@import url("path/to/layout/index.css");
```

### Custom Configuration
For more control, create your own configuration file:

```css
/* Only import the modules you need */
@layer layout.base, layout.reset, layout.sm, layout.md, layout.lg;

@import url("path/to/layout/modules/base.css");
@import url("path/to/layout/modules/sm.css") layer(layout.sm);
@import url("path/to/layout/modules/md.css") layer(layout.md);
@import url("path/to/layout/modules/lg.css") layer(layout.lg);

/* Add project-specific defaults */
:root {
  --layout-default-gap: 1.5rem;
  --layout-max-width: 1200px;
}
```

### Available Modules
- `base.css` - Core lay-out component (required)
- `xs.css`, `sm.css`, `md.css`, `lg.css`, `xl.css`, `xxl.css` - Breakpoint modules
- `animations.css` - Layout transition animations
- `overflow.css` - Overflow handling utilities

## Core Concept: Responsive Layouts via Attributes

The layout system is built around the `<lay-out>` custom element. Its primary function is to enable developers to define different visual layouts for various viewport sizes (breakpoints) using simple HTML attributes.

The system defines standard breakpoints: `xs`, `sm`, `md`, `lg`, `xl`, and `xxl`. You can apply a specific layout type to any of these breakpoints by adding an attribute to the `<lay-out>` element.

**Example:**

```html
<lay-out 
  sm="columns(2)" 
  md="bento(1lg:2sm-right)" 
  lg="columns(4)"
  theme="primary"
  space-top="2"
  space-bottom="3"
  pad-top="2"
  width="lg">
  <content-item>1</content-item>
  <content-item>2</content-item>
  <content-item>3</content-item>
  <content-item>4</content-item>
</lay-out>
```

In this example:
- On **small** screens (`sm`), the content will be arranged in 2 columns.
- On **medium** screens (`md`), the layout will switch to a 1-2 masonry configuration.
- On **large** screens (`lg`), the items will be arranged in 4 columns.
- The layout uses the `primary` theme for consistent branding colors.
- It has a top margin of 2 spacing units, bottom margin of 3 units, and top padding of 2 units.
- The maximum width is constrained to the `lg` breakpoint width (64rem by default).

If no specific layout is defined for a breakpoint, the layout from the next smallest breakpoint is inherited. If no attributes are specified, it defaults to a single column layout.

## Spacing and Layout Attributes

The layout system provides intuitive spacing controls that work well for both developers and designers:

### Spacing Attributes

```html
<lay-out space-top="4" space-bottom="4" pad-inline="3" pad-top="2" pad-bottom="1">
  <!-- Content with spacing applied -->
</lay-out>
```

**Available spacing attributes:**
- `space-top` - Sets top margin (multiplied by `--layout-spacing-unit`, default 1rem)
- `space-bottom` - Sets bottom margin (multiplied by `--layout-spacing-unit`)
- `pad-inline` - Sets horizontal padding (left and right internal spacing)
- `pad-top` - Sets top padding (padding-block-start)
- `pad-bottom` - Sets bottom padding (padding-block-end)

All spacing values are unitless numbers that get multiplied by the spacing unit. To customize the base spacing unit:

```css
:root {
  --layout-spacing-unit: 1.5rem; /* Default is 1rem */
}
```

**Gap Control:**
Set spacing between grid items using unitless gap values:

```html
<lay-out md="columns(3)" col-gap="2" row-gap="1">
```

- `col-gap` - Space between columns (multiplied by spacing unit)
- `row-gap` - Space between rows (multiplied by spacing unit)

### Width Control

Control the maximum width of layout containers with predefined breakpoint-based widths:

```html
<lay-out width="md">  <!-- 48rem max-width -->
<lay-out width="lg">  <!-- 64rem max-width -->
<lay-out width="xl">  <!-- 80rem max-width -->
```

**Available width values:**
- `xs` - 20rem (320px at default font size)
- `sm` - 30rem (480px)
- `md` - 48rem (768px)
- `lg` - 64rem (1024px)
- `xl` - 80rem (1280px)
- `xxl` - 96rem (1536px)

Customize width values using CSS custom properties:

```css
:root {
  --layout-width-lg: 1200px;
  --layout-width-xl: 1400px;
}
```

### Theme System

Apply semantic color themes to layout containers:

```html
<lay-out theme="primary">   <!-- Blue theme -->
<lay-out theme="secondary"> <!-- Green theme -->
<lay-out theme="tertiary">  <!-- Orange theme -->
```

Define theme colors in your CSS:

```css
:root {
  --layout-primary-bg: hsl(220, 100%, 95%);
  --layout-primary-c: hsl(220, 100%, 20%);
  
  --layout-secondary-bg: hsl(120, 50%, 95%);
  --layout-secondary-c: hsl(120, 50%, 20%);
  
  --layout-tertiary-bg: hsl(30, 80%, 95%);
  --layout-tertiary-c: hsl(30, 80%, 20%);
}
```

**Theme vs Direct Colors:**
- Use `theme` for consistent semantic colors across your design system
- Use `background` and `color` attributes for one-off custom colors
- Direct color attributes override theme settings when both are present

## Layout Types

The system supports several layout types, each configurable via an attribute value:

*   **Columns:** `columns(<number_of_columns>)` - Arranges items in a specified number of equal-width columns.
    *   Example: `md="columns(3)"`
*   **Ratio:** `ratio(<aspect_ratio_definition>)` - Arranges items to maintain a specific aspect ratio.
    *   Example: `lg="ratio(1:1)"` (for square items, a common aspect ratio interpretation), `sm="ratio(50x4:100)"` (example from demo files, illustrating support for complex definitions).
*   **Masonry:** `bento(<pattern>)` - Creates a Pinterest-like masonry layout. The pattern defines the column spans of items in a repeating sequence.
    *   Example: `md="bento(1lg:2sm-right)"` means the first item spans 1 column, the second spans 2, and this pattern repeats.
*   **Asymmetrical:** `asym(<type>)` - Creates various asymmetrical layouts.
    *   Examples: `asym(left-right)`, `asym(top-bottom)`. These layouts do not typically repeat items beyond their defined structure.

## The `size` Attribute

The `size` attribute is used to optimize rendering performance of the `<lay-out>` element.
When the `size` attribute is present, `content-visibility: auto` is applied. This allows the browser to skip rendering the content of the `<lay-out>` element if it's currently off-screen.
To prevent layout shifts when the content is not rendered, `contain-intrinsic-size` is used. The value provided to the `size` attribute (e.g., `size="300px 200px"`) is used as the `contain-intrinsic-size`.

**Example:**

```html
<lay-out size="800px 600px">
  <!-- Content that might be off-screen -->
</lay-out>
```
This helps the browser allocate space for the element even before it's fully rendered, improving perceived performance.

## The `bleed` Attribute

The `bleed` attribute offers powerful control over how the layout container and its content interact with the viewport edges. It's primarily used for creating full-width sections while managing content width.

There are three main ways to use `bleed`:

1.  **`bleed` (no value): Full-width Background, Constrained Content**
    *   The `<lay-out>` container's background will extend to the full width of the viewport.
    *   The actual content *within* the `<lay-out>` element will remain constrained to a maximum width (defined by `--layout-mw`, which defaults to the container's own width if not set, effectively respecting padding).
    *   This is useful for full-width background colors or images where the text or other content should still be comfortably readable within a narrower column.
    *   CSS equivalent: The container uses negative margins (`margin-inline`) to achieve the bleed effect, while internal padding or a max-width on content elements keeps the content itself constrained.

2.  **`bleed="0"`: Full-width Background and Full-width Content (Symmetric)**
    *   Both the `<lay-out>` container and its direct child content will expand to the full width of the viewport.
    *   Symmetric padding is applied to the content to fill the available space if the content itself doesn't naturally fill it.
    *   This is for true full-bleed sections where everything, including the content, should span edge-to-edge.

3.  **`bleed="<value>"` (numeric value, e.g., `bleed="25"` or `bleed="-50"`): Full-width Background, Asymmetrical Content**
    *   The `<lay-out>` container's background extends to the full viewport width.
    *   The content is also allowed to use the full width but is distributed asymmetrically.
    *   The numeric value (ranging from -100 to 100) controls this asymmetry:
        *   **Positive values** (e.g., `bleed="25"`): Content favors the **start** side (left in LTR languages). A value of `25` might mean the start side padding is effectively `(100% + 25%)/2` of the available bleed space, and the end side is `(100% - 25%)/2`.
        *   **Negative values** (e.g., `bleed="-25"`): Content favors the **end** side (right in LTR languages).
        *   The higher the absolute value, the more pronounced the asymmetry. `bleed="50"` would create maximum start-side asymmetry (e.g., 150% of bleed space on start, 50% on end), and `bleed="-50"` maximum end-side asymmetry.
    *   This allows for creative layouts where a background bleeds fully, but the content within it is intentionally shifted to one side.

**Technical Details of `bleed`:**
The `bleed` effect is achieved using CSS Custom Properties and calculations based on container queries (`cqi`).
- `--layout-mw`: Defines the maximum width of the content when bleed is active (but not `bleed="0"`).
- `--layout-mi`: Controls `margin-inline`, often calculated as `min(-1 * var(--layout-mi, 0), var(--layout-mw, 100cqi) / 2 - 50cqi)` to pull the container outwards.
- For asymmetrical bleed, factors `--_S` (start factor) and `--_E` (end factor) are calculated based on the `bleed` attribute's numeric value to adjust `padding-inline`.

## Advanced: Grid Area Control (`--_ga` and `--layout-ga`)

The layout system uses CSS Custom Properties `--_ga` and `--layout-ga` to control how child elements are placed within the grid defined by `<lay-out>`. Understanding these properties is key for customizing or extending layout behaviors.

### Container-Level Control (`--_ga`)

*   **Purpose:** `--_ga` is a custom property set on the `<lay-out>` element itself. It determines a default `grid-area` for *all* direct children.
*   **Default Behavior:** By default, `--_ga` is `initial`. This means the `<lay-out>` container does *not* enforce a uniform `grid-area` on its children through this property. Instead, children rely on the `--layout-ga` property (see below) or their default grid flow.
*   **Usage:** Specific layout types (e.g., a simple column layout like `columns="2"`) might set `--_ga: auto;` on the `<lay-out>` element. This ensures all children flow naturally into the grid cells.
*   **Resetting is Crucial:** If a layout at a smaller breakpoint (e.g., `sm="columns(2)"` which sets `--_ga: auto`) is overridden by a more complex layout at a larger breakpoint (e.g., `md="bento(1lg:2sm-right)"` which requires child-specific `grid-area`s), the `md` layout rules *must* reset `--_ga` back to `initial` on the `<lay-out>` element. Otherwise, the `--_ga: auto` from the `sm` breakpoint would persist and override the child-specific `--layout-ga` rules needed for the masonry layout.

### Child-Specific Control (`--layout-ga`)

*   **Purpose:** `--layout-ga` is a custom property intended to be set on the *direct children* of a `<lay-out>` element, or used by the `<lay-out>` element's styles to target specific children (e.g., via `nth-of-type`). It defines the `grid-area` for an individual child.
*   **Default Behavior:** By default, each direct child of `<lay-out>` has its `--layout-ga` effectively resolve to `auto` (assuming `--_ga` on the parent is `initial`). This allows children to flow naturally in the grid.
*   **Usage:** Complex layouts like masonry or asymmetrical ratios use specific CSS rules (often in breakpoint-specific files like `md.css`) to set `--layout-ga` on children (e.g., `content-item:nth-of-type(1) { --layout-ga: span 2 / auto; }`).
*   **Contextual Resets:** When a breakpoint-specific layout (e.g., `md`) defines a new pattern for children using `--layout-ga` (often with `nth-of-type` selectors), it's important that these rules also include a general reset for all children within that breakpoint's scope (e.g., `lay-out[md] > * { --layout-ga: auto; }`) before applying specific `nth-of-type` overrides. This prevents `--layout-ga` rules from a smaller breakpoint's layout pattern from incorrectly affecting the current breakpoint's layout.

In summary, `--_ga` provides a container-level default for child grid areas, while `--layout-ga` allows for fine-grained control over individual children, often varying by layout type and breakpoint. Proper resetting of these properties across breakpoints is essential for the system's inheritance and override logic to work correctly.

## Animations Module (`animations.css`)

The `animations.css` file provides a comprehensive suite of scroll-driven animations that can be applied to elements, including the `<lay-out>` element itself or its children. The system uses CSS Scroll-Driven Animation API for performant, timeline-based effects.

**Basic Usage:**

Apply animations using the `animation` attribute:

```html
<lay-out animation="fade-in">
  <content-item animation="bounce-in-left">...</content-item>
  <content-item animation="bounce-in-right">...</content-item>
</lay-out>
```

**Available Animation Types:**

*   **Bounce Effects:** `bounce`, `bounce-in-left`, `bounce-in-right`, `bounce-in-up`, `bounce-in-down`
*   **Fade Effects:** `fade-in`, `fade-out`, `fade-down`, `fade-left`, `fade-right`, `fade-up`, `fade-down-left`, `fade-down-right`, `fade-up-left`, `fade-up-right`, `fade-in-scale`, `fade-out-scale`
*   **Flip Effects:** `flip-diagonal`, `flip-down`, `flip-left`, `flip-right`, `flip-up`
*   **Reveal Effects:** `reveal` (clip-path inset), `reveal-circle`, `reveal-polygon`
*   **Slide Effects:** `slide-down`, `slide-in`, `slide-out`, `slide-up`
*   **Zoom Effects:** `zoom-in`, `zoom-in-rotate`, `zoom-out`, `zoom-out-rotate`
*   **Opacity:** `opacity` (standalone opacity transition)

**Animation Range Control**

The animation system provides three levels of range control for maximum flexibility:

### 1. Simple Range Control (Recommended)
Use the `range` attribute for common presets:

```html
<!-- Animation runs from entry to 75% of entry (default) -->
<div animation="fade-in">Default range</div>

<!-- Animation runs from entry to 50% of contain -->
<div animation="fade-in" range="contain">Contain range</div>

<!-- Animation runs from 25% of entry to 50% of cover -->
<div animation="fade-in" range="cover">Cover range</div>

<!-- Animation runs through the entire exit phase -->
<div animation="fade-in" range="exit">Exit range</div>
```

### 2. Advanced Range Control
For precise control, use `range-start` and `range-end` attributes:

```html
<!-- Custom start and end points -->
<div animation="zoom-in" 
     range-start="entry 20%" 
     range-end="contain 80%">Custom range</div>

<!-- Only set start (end defaults to entry 75%) -->
<div animation="slide-in" range-start="entry 50%">Custom start</div>

<!-- Only set end (start defaults to entry 0%) -->
<div animation="fade-up" range-end="exit 25%">Custom end</div>
```

### 3. Complete Range Override
Use the full `range` syntax for maximum control:

```html
<!-- Complete custom range specification -->
<div animation="bounce" range="entry 10% contain 90%">Full custom</div>
```

**Range Reference:**

- `entry`: Element is entering the viewport
- `contain`: Element is fully contained within the viewport
- `cover`: Element covers the entire viewport
- `exit`: Element is exiting the viewport

Percentages specify the progress through each phase (0% = start of phase, 100% = end of phase).

**Customization Options:**

*   **Timing:** `--animtm` (animation-timing-function, defaults to `linear`)
*   **Fill Mode:** `--animfm` (animation-fill-mode, defaults to `forwards`)
*   **Transform Values:** Customize movement and scale:
    *   `degree`: Rotation amount for flip animations (default: 100deg)
    *   `trans-x`, `trans-y`: Translation distances (default: 55px, 110px)
    *   `trans-x-viewport`, `trans-y-viewport`: Viewport-relative translations (default: 100vw, 100vh)
    *   `zoom-in`, `zoom-out`: Scale factors (default: 0.6, 1.2)

**Custom Values Example:**

```html
<div animation="flip-left" degree="45deg">Smaller flip</div>
<div animation="fade-right" trans-x="200px">Longer fade distance</div>
<div animation="zoom-in" zoom-in="0.3">More dramatic zoom</div>
```

**CSS Override Example:**

```css
/* Global timing function override */
[animation] {
  --animtm: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Specific animation customization */
.my-element {
  --animtm: ease-out;
  --animfm: both;
}
```

**Browser Support:**

The animation system uses the CSS Scroll-Driven Animation API and requires browser support for `animation-timeline: view()`. A feature detection wrapper ensures animations only activate in supporting browsers:

```css
@supports (view-transition-name: none) {
  /* Animations activate here */
}
```

**Performance Notes:**

- All animations use modern CSS properties (`transform`, `opacity`, `scale`, `translate`) for optimal performance
- Scroll-driven animations leverage the browser's animation engine for smooth 60fps effects
- Animations are GPU-accelerated where possible for maximum smoothness

## Nested Layouts

Create complex layouts with headers and sections by nesting `<lay-out>` elements:

```html
<lay-out
  bleed
  space-bottom="4"
  pad-inline="1"
  pad-top="4"
  pad-bottom="2"
  theme="primary"
  space-top="4"
  width="xl">
  <h2>Section headline</h2>
  <lay-out
    md="bento(1lg-v:2sm)"
    xl="bento(fixed-6a)">
    <content-item></content-item>
    <content-item></content-item>
    <content-item></content-item>
  </lay-out>
</lay-out>
```

**Best Practices for Nested Layouts:**
- **Outer layout**: Use for theming, spacing (`space-top`, `space-bottom`, `pad-*`), bleed, and width constraints
- **Inner layout**: Use purely for content arrangement (columns, bento, etc.)
- **Avoid nested bleed**: Don't use `bleed` attributes on inner layouts to prevent conflicts
- **Headers**: Place headlines and introductory content directly in the outer layout before the inner layout

This pattern provides clean separation between layout semantics (outer) and content arrangement (inner).
