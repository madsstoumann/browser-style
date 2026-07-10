# @browser.style/highlight

A CSS-only pen-marker highlight. Wrap any inline text in `<high-light>` and it gets a hand-drawn highlighter sweep — feathered, uneven ends, and a soft washed ghost. No JavaScript. Named marker presets or any CSS color, optional auto-contrast ink, and stroke variants.

```html
<high-light fill="green">highlighted text here</high-light>
```

## Features

- Pure CSS — no JavaScript, no build step
- Twin `linear-gradient` marker sweep with feathered, uneven ends
- Wraps cleanly across lines (`box-decoration-break: clone` re-rounds every line)
- Four classic marker presets: `green`, `yellow`, `orange`, `pink`
- Any CSS color via typed `attr(fill type(<color>))`
- Optional `ink` (text color); auto-contrasts against the fill when omitted
- Stroke variants: full block (default), `underline`, `strike`
- Per-element hand-drawn variation via CSS `random()` where supported
- RTL-safe (logical `padding-inline`/`padding-block`)

---

## Install

CSS-only — link the stylesheet. Requires `@browser.style/base` for the design token layer.

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="ui-highlight.css">
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import 'ui-highlight.css';
```

---

## Usage

```html
<p>
  Lorem ipsum <high-light fill="yellow">consectetur adipiscing elit</high-light>,
  sed do eiusmod <high-light fill="green">tempor incididunt</high-light> ut labore.
</p>
```

There is no custom element to register — `<high-light>` is an unknown element styled entirely with CSS, so it renders inline by default in every browser.

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `fill` | preset name \| `<color>` | Marker color. A preset (`green`, `yellow`, `orange`, `pink`) or **any** CSS color. Default: green. |
| `ink` | `<color>` | Text color. When omitted, falls back to `contrast-color(fill)`, then `currentColor`. |
| `variant` | string | Stroke style: `underline` or `strike`. Default is the full-block marker. |

---

## Fill color

`fill` accepts either a **named preset** (hand-tuned highlighter pastels) or any CSS color value:

```html
<!-- Presets -->
<high-light fill="green">green</high-light>
<high-light fill="yellow">yellow</high-light>
<high-light fill="orange">orange</high-light>
<high-light fill="pink">pink</high-light>

<!-- Any CSS color -->
<high-light fill="#c9b8ff">hex</high-light>
<high-light fill="oklch(0.9 0.15 200)">oklch()</high-light>
<high-light fill="rebeccapurple">named</high-light>
```

The whole gradient — including its faded, uneven edges — is derived from the single `fill` value with `color-mix(in oklab, …)`, so any color produces a coherent marker.

| Preset | Color |
|--------|-------|
| `green` | `#82ffad` |
| `yellow` | `#fdfa8c` |
| `orange` | `#ffbe7b` |
| `pink` | `#ff9dc9` |

> Presets are matched with a higher-specificity attribute selector, so a preset name always wins over the same name being read as a raw CSS color.

---

## Ink (text color)

Set `ink` to force a text color. If you leave it off, the text color is computed automatically with `contrast-color()` — black or white, whichever is more readable over the fill:

```html
<high-light fill="green">auto black ink</high-light>
<high-light fill="rebeccapurple">auto white ink</high-light>
<high-light fill="rebeccapurple" ink="gold">explicit gold ink</high-light>
```

In browsers without `contrast-color()`, the text keeps its inherited `currentColor`.

---

## Variants

```html
<high-light fill="yellow">full-block marker (default)</high-light>
<high-light fill="orange" variant="underline">underline marker</high-light>
<high-light fill="pink" variant="strike">strike-through</high-light>
```

| Variant | Description |
|---------|-------------|
| _(none)_ | Full-block highlighter sweep |
| `underline` | Marker stroke along the text baseline |
| `strike` | Marker stroke through the text center |

---

## Customization

Every knob is a `--_`-prefixed custom property you can override per instance or globally:

```css
high-light {
  --_angle: 100deg;        /* gradient sweep angle */
  --_radius: 0.6em;        /* corner rounding */
  --_shadow-x: -0.3ch;     /* washed-ghost offset */
  --_shadow-y: 0.25ch;
  --_shadow-blur: 0.4ch;
}
```

You can also override a preset by targeting the attribute:

```css
high-light[fill="green"] { --_fill: #b6ffcf; }
```

---

## Cutting-edge CSS & progressive enhancement

This component leans on recent CSS features, each with a graceful fallback:

- **`random()`** — where supported, every `<high-light>` gets its own random gradient angle and shadow offset, so no two markers look identically drawn. Applied behind `@supports`; everywhere else the static defaults render the same effect.
- **`contrast-color()`** — automatic readable `ink` when none is given, falling back to `currentColor`.
- **Typed `attr()`** — `attr(fill type(<color>), …)` reads the color straight from the attribute; the property is double-declared so older engines keep a solid default.

---

## Browser support

| Feature | Support | Fallback |
|---------|---------|----------|
| `box-decoration-break` | All modern browsers (with `-webkit-` prefix) | — |
| `color-mix()` | Baseline (Chrome 111, Firefox 113, Safari 16.2) | — |
| `contrast-color()` | Baseline 2026 (Chrome 147, Firefox 146, Safari 26) | `currentColor` ink |
| `attr()` with `type()` | Chrome 133+, Safari 26+ | plain default fill color |
| `random()` | Safari 26.2+ only (as of mid-2026) | static gradient angle & shadow |

The full marker effect — presets, custom colors, auto-contrast ink, and all variants — works today in Chromium. `random()` adds only subtle per-element variation on top, so its absence is invisible to most users.
