# Tab-Cordion CSS Custom Properties

This document lists all CSS custom properties available for customizing the Tab-Cordion component.

---

## Accent Color

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-accent` | `light-dark(hsl(210, 100%, 45%), hsl(210, 100%, 75%))` | Accent color used throughout the component |

---

## Borders and Shadows

### Item Borders

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-item-bdc` | `light-dark(hsl(0 0% 80%), hsl(0 0% 30%))` | Border color for accordion items |
| `--tc-item-bdc-open` | `light-dark(hsl(0 0% 60%), hsl(0 0% 40%))` | Border color for open accordion items |
| `--tc-item-bdrs` | `1em` | Border radius for accordion items |
| `--tc-item-bdrs-separate` | `2em` | Border radius for separated accordion items |
| `--tc-item-bdw` | `1px` | Border width for accordion items |
| `--tc-item-bdw-open` | `2px` | Border width for open accordion items |

### Item Shadows

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-item-bxsh` | `0 0 1px 0 rgba(0, 0, 0, .07), 0 1px 1px 0 rgba(0, 0, 0, .06), 0 1px 2px 0 rgba(0, 0, 0, .1)` | Box shadow for accordion items |
| `--tc-item-bxsh-open` | `0 0 2px 0 rgba(0, 0, 0, .14), 0 2px 2px 0 rgba(0, 0, 0, .12), 0 1px 3px 0 rgba(0, 0, 0, .2)` | Box shadow for open accordion items |

### Tabs Borders and Shadows

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-tabs-bdrs` | `3em` | Border radius for tab headers (pill/highlight) |
| `--tc-tabs-bdw` | `4px` | Border width for tabs highlight/pill |
| `--tc-tabs-container-bdrs` | `1em` | Border radius for tabs container when using `contain` + `rounded` |
| `--tc-tabs-item-bdc` | `light-dark(#FFF, rgba(255, 255, 255, .30))` | Border color for tab items |
| `--tc-tabs-item-bdw` | `1px` | Border width for tab items |
| `--tc-tabs-line-bdw` | `3px` | Border width for tab line indicator |
| `--tc-tabs-panel-bxsh` | `0 8px 18px -12px rgba(0, 0, 0, .35), 0 6px 12px -14px rgba(0, 0, 0, .2)` | Box shadow for tab panel (light mode) |
| `--tc-tabs-panel-bxsh-dark` | `0 8px 18px -12px rgba(255, 255, 255, .35), 0 6px 12px -14px rgba(255, 255, 255, .35)` | Box shadow for tab panel (dark mode) |

---

## Spacing and Transitions

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-breakout-unit` | `1rem` | Unit of vertical translation for breakout effect |
| `--tc-group-rg` | `1em` | Row gap between separated accordion items |
| `--tc-item-p` | `1.5ch` | Padding for accordion item headers (summary) |
| `--tc-item-p-separate` | `1.5ch 2.5ch` | Padding for separate+rounded accordion items |
| `--tc-item-p-tabs` | `1.5ch` | Padding for tab headers |
| `--tc-item-trsdu` | `300ms` | Transition duration for accordion animations |

---

## Panel/Content

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-panel-fs` | `inherit` | Font size for panel content |
| `--tc-panel-pb` | `0 2ch` | Block padding (top/bottom) for accordion panel content (animates from 0 when opening) |
| `--tc-panel-pi` | `1.5ch` | Inline padding (left/right) for accordion panel content |
| `--tc-tabs-panel-pb` | `2ch` | Block padding for tabs panel content |
| `--tc-tabs-panel-pi` | `1.5ch` | Inline padding for tabs panel content |

---

## Background Colors

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-bg` | `light-dark(#EEE, #222527)` | Background color for accordion container when using `background` token |
| `--tc-hover-bg` | `light-dark(hsl(210, 100%, 95%), hsl(210, 50%, 15%))` | Hover background color |
| `--tc-item-bg-active` | `light-dark(rgba(255, 255, 255, .5), rgba(255, 255, 255, .14))` | Background for active tab highlight |
| `--tc-tabs-bg` | `light-dark(#EAEAEA, #222527)` | Background color for tabs container |
| `--tc-tabs-panel-bg` | `light-dark(#f7f7f7, #1c1c1c)` | Background color for tab panel content |

---

## Accordion Hover States (from-hover)

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-from-hover-accent` | `var(--tc-accent)` | Text/accent color on accordion hover |
| `--tc-from-hover-bg` | `var(--tc-hover-bg)` | Background color on accordion hover |

---

## Tab Hover States (to-hover)

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-to-hover-accent` | `var(--tc-accent)` | Text/accent color on tab hover |
| `--tc-to-hover-bg` | `light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.1))` | Background color on tab hover |
| `--tc-to-hover-line` | `light-dark(#CCC, #888)` | Line indicator color on tab hover |

---

## Typography

| Property | Initial Value | Description |
|----------|---------------|-------------|
| `--tc-item-ff` | `inherit` | Font family for summary/header text |
| `--tc-item-fs` | `inherit` | Font size for summary/header text |

---

## Additional Customization Properties

These properties have fallback values in the CSS and can be overridden:

| Property | Fallback Value | Description |
|----------|----------------|-------------|
| `--tc-bg-p` | `1.5ch` | Padding for accordion background container |
| `--tc-icon-c` | `light-dark(#5a5a5a, #b0b0b0)` | Color for ui-icon elements |
| `--tc-item-bg` | `Canvas` | Background for details elements |
| `--tc-item-txw` | `nowrap` | Text wrap behavior for summary text |
| `--tabs-group-c` | `inherit` | Color for tab group text |
| `--tc-tabs-gap` | `1rem` | Gap between tabs (deprecated/unused) |

---

## Internal State Variables

These properties are set automatically by the component and should not be modified:

| Property | Description |
|----------|-------------|
| `--tab-cordion-index` | Internal: tracks the index of each details element (1-8) |
| `--tab-cordion-tabs` | Internal: tracks the total number of tabs (1-8) |
| `--_y` | Internal: controls vertical translation for breakout effect |

---

## Usage Example

```css
tab-cordion {
  /* Customize colors */
  --tc-accent: hsl(280, 100%, 50%);
  --tc-bg: #f5f5f5;

  /* Adjust spacing */
  --tc-item-p: 2ch;
  --tc-panel-pb: 0 3ch;
  --tc-panel-pi: 2ch;

  /* Typography */
  --tc-item-fs: 1.125rem;
  --tc-panel-fs: 0.95rem;

  /* Border radius */
  --tc-item-bdrs: 0.5em;
  --tc-tabs-container-bdrs: 0.75em;
}
```
