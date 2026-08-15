# @browser.style/button-group

A **segmented control**: a group of `.ui-button` labels inside a `<fieldset>`, driven by
radio inputs. No custom element, no JavaScript — the checked state is the radio's, so the
control works in a form, with the keyboard, and with assistive tech for free.

---

## Features

- **Zero JavaScript.** `:has(input:checked)` does the state; the browser does the rest.
- **A real fieldset.** Radios keep native form semantics, arrow-key navigation and
  `<legend>` labelling.
- **Four composable variants** — `border`, `inline`, `outline`, `rounded`.
- **The shared hue axis** — nine hues plus `pale` / `muted`, via `data-theme=`.
- **Zero specificity** (`:where(.ui-button-group)`) — trivial to override.

---

## Install

```bash
npm install @browser.style/button-group
```

`@browser.style/base` is a required peer — it supplies the design tokens *and* `.ui-button`
itself, which this package styles rather than redefines:

```bash
npm install @browser.style/base
```

---

## Usage

The markup is a `<fieldset>`, one `<label class="ui-button">` per segment, each wrapping a
visually-hidden radio (`data-sr`):

```html
<fieldset class="ui-button-group" data-variant="inline rounded border">
  <legend>Size</legend>
  <label class="ui-button">
    <input type="radio" name="size" value="s" data-sr checked>
    Small
  </label>
  <label class="ui-button">
    <input type="radio" name="size" value="m" data-sr>
    Medium
  </label>
  <label class="ui-button">
    <input type="radio" name="size" value="l" data-sr>
    Large
  </label>
</fieldset>
```

```html
<link rel="stylesheet" href="…/@browser.style/base/dist/base.min.css">
<link rel="stylesheet" href="…/@browser.style/button-group/index.css">
```

or from CSS:

```css
@import '@browser.style/base';
@import '@browser.style/button-group';
```

> **`data-variant`, not `variant`.** A bare custom attribute is invalid HTML on a built-in
> element, and the host here is a `<fieldset>`. The same rule gives `data-theme` below.
> Custom elements (`<ui-chip>`, `<ui-marquee>`) take the bare spellings.

---

## Variants

Space-separated on `data-variant`; they compose.

### `border`

Segments join into one continuous outline — no gap, shared borders, only the outer ends
rounded. This is the classic segmented control.

### `inline`

`display: inline-grid`, so the group shrinks to its content instead of filling its
container.

> Inside a flex column — `<ui-content>`, for instance — a flex item's `display` is
> **blockified**, so `inline-grid` computes to `grid` and the group stretches anyway. The
> shrink-to-fit there comes from `align-self: start` on the container side; `ui/card`
> ships exactly that rule.

### `outline`

The checked segment is outlined rather than filled — a lighter-weight selection for dense
UI.

### `rounded`

Pill-shaped segments (`--ui-button-group-radius`, default `3em`).

---

## Theming

```html
<fieldset class="ui-button-group" data-theme="red">…</fieldset>
<fieldset class="ui-button-group" data-theme="green pale">…</fieldset>
<fieldset class="ui-button-group" data-theme="blue muted">…</fieldset>
```

All nine hues — `red orange green blue accent black white gray slate` — plus the `pale`
and `muted` modifiers, resolved through
[`@browser.style/base`'s theme resolver](../base/theme.md).

**The hue paints the checked segment, not the group's own box.** The group therefore opts
out of the resolver's universal paint, the same way `ui/timeline` does for its dots. Because
it consumes the resolver's *output* rather than hand-mapping each hue, every modifier works
without per-hue code.

---

## Customization

| Token | Default | Description |
| --- | --- | --- |
| `--ui-button-group-bg` | `var(--color-accent)` | Fill of the checked segment |
| `--ui-button-group-c` | `var(--color-accent-text)` | Ink of the checked segment |
| `--ui-button-group-border-width` | `calc(1em / 8)` | Segment border in `border`/`outline`; scales with `font-size` |
| `--ui-button-group-radius` | `3em` | Segment radius in `rounded` |

```css
.ui-button-group {
  --ui-button-group-bg: var(--color-success);
  --ui-button-group-border-width: 2px;
}
```

Size the whole control with `font-size` — every metric is `em`-based. The `fs-sm` utility
from `@browser.style/base` gives the compact form used on product pages.

---

## Accessibility

- Radios carry the state, so the group is keyboard-navigable and announced as a radio group.
- `<legend>` names the group; keep it even when visually hidden.
- `data-sr` hides each radio visually while leaving it focusable and exposed.
- The hit target is the whole `<label>`, not just the text.

---

## Browser support

`:has()` is required for the checked-segment styling — Chrome/Edge 105+, Safari 15.4+,
Firefox 121+. Without it the segments render as plain buttons and the control still
functions, since the radios are real form controls.
