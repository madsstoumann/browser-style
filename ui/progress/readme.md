# @browser.style/progress

CSS-first styling for the **native `<progress>` element** — no custom element, no JavaScript, no markup changes. Same pattern as `@browser.style/base`'s `<meter>` styling: load the sheet and every `<progress>` on the page is styled.

Used by `@browser.style/card` for poll (`Question`) and comparison (`ItemList`) cards, which emit bare `<progress>` elements.

## Features

- Rounded track and fill driven by design tokens
- Determinate fill transition
- Indeterminate state: striped track + animated runner (rtl-aware)
- Respects `prefers-reduced-motion`
- Zero specificity (`:where(progress)`) — trivial to override

---

## Install

```bash
npm install @browser.style/progress
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, durations, etc.).

---

## Usage

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/progress/index.css">

<progress max="100" value="72"></progress>
<progress></progress> <!-- indeterminate -->
```

Or via CSS `@import`:

```css
@import '@browser.style/base';
@import '@browser.style/progress/style';
```

---

## Customization

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-progress-bs` | `.6em` | Track block-size (height); the radius derives from it |
| `--ui-progress-bg` | `var(--color-border)` | Track color |
| `--ui-progress-fill` | `var(--color-accent)` | Value / runner color |
| `--ui-progress-anim` | `progress 1.2s linear alternate infinite` | Indeterminate runner animation |

```css
progress {
  --ui-progress-bs: .4em;
  --ui-progress-fill: var(--color-success);
}
```

---

## Accessibility

- Native `<progress>` — announced with its value by screen readers
- Pair with a `<label>` or `aria-label` when the purpose isn't clear from context
- Indeterminate animation is disabled under `prefers-reduced-motion`

---

## Browser support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Vendor pseudo-elements (`::-webkit-progress-*`, `::-moz-progress-bar`) cover both engines
