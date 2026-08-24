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

<ui-progress-circular style="--ui-progress-circular-value: 68">
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

`--ui-progress-circular-value` is a **percentage (0–100)** driving the drawn arc, set inline by the author. The `<progress>` element's `value`/`max` attributes carry the **raw pair** (`5400`/`8000`) — screen readers announce the real fraction, and the visible arc and the machine truth cannot contradict each other as long as both come from the same numbers.

> Deriving the arc from the attributes via typed `attr(value type(<number>))` is a possible future enhancement — Safari and Firefox currently have no working fallback for typed `attr()`, so the explicit custom property is the portable contract.

### Label

Any direct child other than the `<progress>` is stacked in the center of the ring (`grid-area: 1 / 1`). Use real text — `68%`, `7 / 12` — not a CSS counter; it participates in the accessibility tree and can say anything the design needs.

---

## Customization

| Token | Default | Description |
|---|---|---|
| `--ui-progress-circular-size` | `10em` | Ring diameter (`inline-size`; block size follows via `aspect-ratio: 1`) |
| `--ui-progress-circular-track-size` | `1em` | Ring thickness |
| `--ui-progress-circular-value` | `0` | Percent of the circle filled (0–100), set inline per instance |
| `--ui-progress-circular-fill` | `var(--color-accent)` | Arc color |
| `--ui-progress-circular-track` | `var(--color-border)` | Remaining-track color |
| `--ui-progress-circular-label-fs` | `200%` | Center label font size |
| `--ui-progress-circular-label-fw` | `var(--font-weight-bold)` | Center label font weight |

```html
<ui-progress-circular style="--ui-progress-circular-value: 40; --ui-progress-circular-size: 6em; --ui-progress-circular-fill: var(--color-success)">
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
