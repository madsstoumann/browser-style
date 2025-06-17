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
<lay-out sm="columns(2)" md="bento(1lg:2sm-right)" lg="columns(4)">
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

If no specific layout is defined for a breakpoint, the layout from the next smallest breakpoint is inherited. If no attributes are specified, it defaults to a single column layout.

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

The `animations.css` file provides a suite of scroll-driven animations that can be applied to elements, including the `<lay-out>` element itself or its children.

**Usage:**

Animations are typically applied using the `animation` attribute on an HTML element.

```html
<lay-out animation="fade-in">
  <content-item animation="bounce-in-left">...</content-item>
  <content-item animation="bounce-in-right">...</content-item>
</lay-out>
```

**Key Features:**

*   **Scroll-Driven:** Animations are triggered and progress based on the element's visibility within the viewport as the user scrolls. This is achieved using `animation-timeline: view();`.
*   **Variety of Effects:** The module includes a wide range of pre-defined animations:
    *   **Bounce:** `bounce-in`, `bounce-in-down`, `bounce-in-left`, `bounce-in-up`, `bounce-in-right`
    *   **Fade:** `fade-in`, `fade-down`, `fade-left`, `fade-right`, `fade-up`, and combinations like `fade-down-left`, `fade-in-scale`, `fade-out`, `fade-out-scale`.
    *   **Flip:** `flip-diagonal`, `flip-down`, `flip-left`, `flip-right`, `flip-up`
    *   **Reveal:** `reveal` (clip-path inset), `reveal-circle`, `reveal-polygon`
    *   **Slide:** `slide-down`, `slide-in` (from left), `slide-out` (to right), `slide-up`
    *   **Zoom:** `zoom-in`, `zoom-in-rotate`, `zoom-out`, `zoom-out-rotate`
*   **Customizable Behavior:**
    *   `--animn`: CSS custom property set by the `animation` attribute to select the `@keyframes` name.
    *   `--animtm`: `animation-timing-function` (defaults to `linear`).
    *   `--animfm`: `animation-fill-mode` (defaults to `forwards`).
    *   `--animtl`: `animation-timeline` (defaults to `view()`).
    *   `--animrs`: `animation-range-start` (defaults to `entry 0%`).
    *   `--animre`: `animation-range-end` (defaults to `entry 90%`).
*   **Animation Range Control:** Classes like `.ar-contain`, `.ar-cover`, and `.ar-exit` can be added to modify the `animation-range-start` and `animation-range-end` values, controlling when the animation begins and ends relative to the element's position in the scrollport.
    *   `.ar-contain`: `entry 0%` to `contain 50%`
    *   `.ar-cover`: `entry 25%` to `cover 50%`
    *   `.ar-exit`: `exit 0%` to `exit 100%`
*   **CSS Variables for Fine-Tuning:** Some animation groups use CSS variables for their effects, like `--_dg` (degrees for flips), `--_tx`, `--_ty` (translate X/Y for fades), `--_zi`, `--_zo` (zoom in/out scale factors). These are defined in `:root` but could potentially be overridden for more specific control if needed.

**Implementation:**
Each animation type (e.g., `[animation="fade-in"]`) sets the `--animn` variable. A general rule `:where([animation])` then applies the actual CSS animation properties using these variables. This provides a clean and extensible way to manage many animation types.
The `@supports (view-transition-name: none)` query is likely a feature detection or progressive enhancement check, though its direct relation to scroll animations here might be for ensuring compatibility or specific browser behavior.

This documentation provides a foundational understanding of the layout system and its animation capabilities. For specific layout values and detailed behavior of each animation, refer to the respective CSS files (`xs.css`, `sm.css`, etc., and `animations.css`).
