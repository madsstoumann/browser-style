# @browser.style/analog-clock

A CSS-first analog clock component built entirely on native HTML elements (`<ol>`, `<ul>`, `<nav>`) and CSS trigonometric functions (`sin()`, `cos()`, `pow()`). It handles all placement mathematically — no JavaScript is needed for positioning. An optional Light DOM web component wrapper provides a declarative API for easier framework integration.

## Features

- **Pure CSS Layout**: Numerals and ticks are evenly distributed using `sibling-index()` / `sibling-count()` along with mathematical evaluation of polar formulas.
- **Dynamic Shapes**: Includes a `squircle` variant that perfectly calculates superellipse tick boundaries dynamically. 
- **Zero-JS Core**: The clock runs completely on CSS animations. JavaScript is only required for updating the UI with the *current time* (via short `animation-delay` assignments `var(--_ds)`, `var(--_dm)`, `var(--_dh)`).
- **Light/Dark Mode**: Fully supports native `color-scheme: light dark` and responds gracefully to `@browser.style/base` tokens.
- **Web Component Wrapper**: Simply add `<ui-analog-clock numerals="12" indices="60">` and the web component will automatically scaffold the inner `.innerHTML` requirements on its own.

---

## Install

```bash
npm install @browser.style/analog-clock
```

Peer dependencies:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system and core layout semantics.

---

## 1. Usage: CSS-only (Vanilla HTML)

For full control, write the internal structure and trigger the hand angles using inline CSS variables. A tiny helper file (`uiAnalogClock.js`) is standard practice to grab `new Date()` once on load.

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/analog-clock/index.css">

<ui-analog-clock style="--_dh: -25000s; --_dm: -1230s; --_ds: -45s;">
  <!-- Indices -> ticking markers -->
  <ul>
    <li data-hour>|</li>
    <li>|</li>
    <!-- ... repeat 60x ... -->
  </ul>
  
  <!-- Numerals (12 indices placed evenly mathematically) -->
  <ol>
    <li>12</li>
...
  </ol>
  
  <!-- The hands structure -->
  <nav>
    <b data-hand="seconds"></b>
    <b data-hand="minutes"></b>
    <b data-hand="hours"></b>
  </nav>
</ui-analog-clock>
```

## 2. Usage: Web Component Wrapper

When using a JS framework or handling complicated numeral mappings, the web component reduces markup.

```javascript
import '@browser.style/analog-clock';
```

```html
<ui-analog-clock numerals="12" indices="60" timezone="-5" label="New York"></ui-analog-clock>
```

### Web Component Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `indices` | —       | Automatically generates ticks. `"60"` or `"hours"` (12 ticks). |
| `numerals` | —      | Generates count of numbers (`1`-`12`). |
| `label` | —       | Appends text under the clock. |
| `marker` / `marker-hour` | `\|` | String for custom indices representation. |
| `type` | `"arab"` | Number type rendering: `"roman"`, `"roman-alt"`, `"arab"`. |
| `timezone` | System | Time zone integer offset (`9`, `-4`, `+12.5`). |
| `date` | — | Renders a `<time>` node. Set to `"short"` for `DD`. |

---

## Examples & Variants

### Sizes
Clock dimensions inherit the base sizes:

```html
<ui-analog-clock size="sm"></ui-analog-clock> <!-- 4rem -->
<ui-analog-clock size="md"></ui-analog-clock> <!-- 7.5rem -->
<ui-analog-clock size="lg"></ui-analog-clock> <!-- 15rem, default 100% -->
```

### "Quartz" Steps
Force the seconds hand mechanism to tick abruptly `steps(60)` rather than a linear sweeping transition.
```html
<ui-analog-clock steps></ui-analog-clock>
```

### Squircle and Trigonometry math
```html
<ui-analog-clock variant="squircle"></ui-analog-clock>
```

Applying the `squircle` variant turns the clock boundary into a superellipse using `corners: 50% superellipse(2)`. However, masking the clock visual shape isn't enough; the internal ticking boundary and numbers must respect the squircle walls perfectly.

**Math in CSS**:  
Normal clocks calculate polar positions exclusively using $r \cdot \cos(\theta)$ and $r \cdot \sin(\theta)$.  
When `squircle` is applied, we leverage the polar definition of a superellipse to scale $r$:
$$r(\theta) = \frac{1}{\left( |\cos\theta|^n + |\sin\theta|^n \right)^{1/n}}$$

This formula dictates how far from the origin ($0,0$) a tick or numeral should shift on its given angle $\theta$. The `n` variable is defined via `--_squircle-exponent`, which defaults to 4. 

```css
--_squircle-exponent: 4;
--_sq-val: calc(1 / pow(pow(abs(cos(var(--_d))), var(--_squircle-exponent)) + pow(abs(sin(var(--_d))), var(--_squircle-exponent)), calc(1 / var(--_squircle-exponent))));
```

Multiplying the standard circular $r$ value with `--_sq-val` allows the numerals and ticking layers (both `<ul>` and `<ol>`) to trace an exact squircle shape mathematically aligned perfectly out of the box — dynamically re-padding corners without an ounce of manual padding logic or JS dimension listening!

---

## Customization / Design Tokens

The clock is extensively tied to global tokens from `@browser.style/base`. Local overrides prefix `--ui-analog-clock`.

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-analog-clock-background` | `var(--color-surface-alt)` | The clock face |
| `--ui-analog-clock-color` | `var(--color-text)` | Default copy color |
| `--ui-analog-clock-font-family` | `var(--font-form)` | Default type |
| `--ui-analog-clock-second-color` | `#ff8c05` | Second hand brand color |
| `--ui-analog-clock-cap-color` | `currentColor` | Circle pin connecting hands |
| `--ui-analog-clock-squircle-numerals-scale` | `0.9` | Float scale value ensuring 1..12 padding is kept clear from the tick outline |

## Browser Support

- **Container Queries & Styles**: `<cq-box>` architecture supported across all modern browsers.
- **CSS Trigonometry**: Native math (`sin()`, `cos()`, `pow()`) is heavily relied upon and supported natively globally (since late 2023 / early 2024 across major versions).
- **Graceful degradation**: Browsers without `sibling-index()` default to non-separated content strings.
