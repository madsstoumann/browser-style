# @browser.style/progress-circular

CSS-first circular ring around the **native `<progress>` element** — no JavaScript, no Shadow DOM. A `<ui-progress-circular>` wrapper draws the ring with a `conic-gradient` and a radial mask; the native `<progress>` inside it keeps the raw numbers for assistive technology and machine readers.

Used by `@browser.style/card` demo pages for goal cards (steps rings, completed milestones).

## Features

- Pure CSS ring: `conic-gradient` fill over a `radial-gradient` mask
- Fill and track ride the design tokens (`--color-accent`, `--color-border`)
- Real, author-supplied center label — any text (`68%`, `7/12`), no `max="100"` assumption
- The native `<progress value max>` carries the true values for accessibility
- Logical sizing (`inline-size` + `aspect-ratio`), zero-specificity `:where()` — trivial to override
- Clockwise in both writing directions — progress rings do not mirror in RTL

---

## Install

```bash
npm install @browser.style/progress-circular
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, radii, font weights, etc.).

---

## Usage

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/progress-circular/index.css">

<ui-progress-circular>
	<progress value="5400" max="8000"></progress>
	<span>68%</span>
</ui-progress-circular>
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/progress-circular/style';
```

### The value contract

The `<progress>` element's own `value`/`max` attributes are the **single source of truth**: the arc percent is computed in CSS via typed `attr()` — `calc(100 * attr(value type(<number>), 0) / attr(max type(<number>), 100))` — so the raw pair (`5400`/`8000`) drives both what screen readers announce and what the ring draws. Nothing is duplicated, and the arc can never contradict the numbers.

> Typed `attr()` has no fallback in Safari/Firefox — the sheet ships the `@supports not` guard restoring the literals, and `ui/base/polyfills/attr-fallback.js` (its map carries `ui-progress-circular > progress`) upgrades from the attributes. Pages using the ring outside the demo bundle need that polyfill tag. `--ui-progress-circular-value` (a 0–100 percent) still works as a direct override of the computed arc.

### Value and label

Direct children other than the `<progress>` stack as centered rows inside the ring (the `<progress>` itself is absolutely positioned). The **value** is any child — use real text (`68%`, `7 / 12`), not a CSS counter; it participates in the accessibility tree. An optional **label** is a `<small>` placed before the value — a muted, uppercase caption line above the number, with its own tokens:

```html
<ui-progress-circular size="sm">
	<progress value="5400" max="8000"></progress>
	<small>Steps</small>
	<span>68%</span>
</ui-progress-circular>
```

Source order is reading order — put the `<small>` after the value to caption below the number instead. Both font sizes default to a ratio of the ring's *hole* (`size − 2·track`), so any `size=`/`track=` combination keeps the text inside the ring; override with the `-fs`/`-fw` tokens below.

---

## Sizes

The `size=` attribute steps the ring diameter, chip-style:

```html
<ui-progress-circular size="sm" …>  <!-- 6em -->
<ui-progress-circular …>            <!-- default, 10em -->
<ui-progress-circular size="lg" …>  <!-- 13em -->
<ui-progress-circular size="xl" …>  <!-- 16em -->
```

Any other diameter: set `--ui-progress-circular-size` directly.

---

## Track thickness

The `track=` attribute steps the ring's line thickness, using the same step names as `size=` (thin → `sm`, normal → default, heavy → `lg`/`xl`):

```html
<ui-progress-circular track="sm" …>  <!-- 0.5em — thin -->
<ui-progress-circular …>             <!-- default, 1em -->
<ui-progress-circular track="lg" …>  <!-- 1.5em — heavy -->
<ui-progress-circular track="xl" …>  <!-- 2em -->
```

`size=` and `track=` combine freely; any other thickness: set `--ui-progress-circular-track-size` directly.

---

## Theme

The shared `theme=` axis (nine hues + `pale`/`muted` modifiers, from `@browser.style/base`) colours the **arc**, not the box — the component opts out of the resolver's universal paint, so the wrapper stays transparent and the label keeps the page ink:

```html
<ui-progress-circular theme="green">
	<progress value="5" max="5"></progress>
	<span>100%</span>
</ui-progress-circular>

<ui-progress-circular theme="pale red" …>  <!-- washed-out arc via the pale modifier -->
```

A themed ring's track becomes the hue's **pale plate** (the same `color-mix` recipe as `theme="pale …"`), so arc and track read as one system — `theme="green"` gives a green arc on a pale-green track. Unthemed rings keep the `--color-border` track.

---

## Customization

| Token | Default | Description |
|---|---|---|
| `--ui-progress-circular-size` | `10em` | Ring diameter (`inline-size`; block size follows via `aspect-ratio: 1`) |
| `--ui-progress-circular-track-size` | `1em` | Ring thickness |
| `--ui-progress-circular-value` | computed from `<progress>` `value`/`max` | Percent of the circle filled (0–100) — set it only to override the computed arc |
| `--ui-progress-circular-fill` | `var(--color-accent)` | Arc color |
| `--ui-progress-circular-track` | `var(--color-border)` | Remaining-track color |
| `--ui-progress-circular-value-fs` | `calc((size − 2·track) / 4)` | Value font size — scales with the ring's hole, so it fits any `size=`/`track=` combination |
| `--ui-progress-circular-value-fw` | `var(--font-weight-bold)` | Value font weight |
| `--ui-progress-circular-label-fs` | `calc((size − 2·track) / 9)` | Label (`<small>`) font size — hole-scaled like the value |
| `--ui-progress-circular-label-fw` | `var(--font-weight-medium)` | Label font weight |
| `--ui-progress-circular-label-c` | `var(--color-text-muted)` | Label ink |

```html
<ui-progress-circular style="--ui-progress-circular-size: 6em; --ui-progress-circular-fill: var(--color-success)">
	<progress value="2" max="5"></progress>
	<span>2/5</span>
</ui-progress-circular>
```

---

## Accessibility

- The native `<progress>` exposes `role=progressbar` with its true `value`/`max` — no ARIA needed.
- The center label is real text; keep it consistent with the `<progress>` values.
- For a labelled control, wrap in a `<label>` or reference the element with `aria-labelledby` from surrounding text.

## Browser support

Requires `conic-gradient`, CSS `mask`, and `aspect-ratio` — all baseline. The ring intentionally does not flip in RTL (clockwise indicators read the same in both directions).
