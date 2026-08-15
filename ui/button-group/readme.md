# @browser.style/button-group

A **segmented control**: a group of `.ui-button` labels inside a `<fieldset>`, driven by
radio inputs. No custom element required, no JavaScript — the checked state is the radio's,
so the control works in a form, with the keyboard, and with assistive tech for free.

---

## Features

- **Zero JavaScript.** `:has(input:checked)` does the state; the browser does the rest.
- **A real fieldset.** Radios keep native form semantics, arrow-key navigation,
  `<legend>` labelling and `fieldset[disabled]` propagation.
- **Two host spellings** — `<ui-button-group>` for the bare attributes, or the class on the
  fieldset itself.
- **Four composable variants** — `border`, `inline`, `outline`, `rounded`.
- **A six-rung size ladder** — `xs` … `2xl`, shared with `ui/chip` and `ui/beacon`.
- **The shared hue axis** — nine hues plus `pale` / `muted`.
- **Zero specificity** (`:where()`) — trivial to override.

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

```html
<link rel="stylesheet" href="…/@browser.style/base/dist/base.min.css">
<link rel="stylesheet" href="…/@browser.style/button-group/index.css">
```

or from CSS:

```css
@import '@browser.style/base';
@import '@browser.style/button-group';
```

---

## Usage

The control is a `<fieldset>`, one `<label class="ui-button">` per segment, each wrapping a
visually-hidden radio (`data-sr`). There are two ways to host it, and they render
identically.

### On the fieldset — canonical

This is the form the card renderer emits and the shortest markup:

```html
<fieldset class="ui-button-group" data-variant="inline rounded border" data-size="sm">
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

> **`data-variant`, not `variant`.** A bare custom attribute is invalid HTML on a built-in
> element, and the host here is a `<fieldset>`. The same rule gives `data-theme` and
> `data-size`.

### On `<ui-button-group>` — for the bare attributes

If you would rather write `variant=` / `theme=` / `size=` the way every other component in
the set does, wrap the fieldset in the custom element and put the attributes there:

```html
<ui-button-group variant="inline rounded border" theme="red" size="sm">
  <fieldset>
    <legend>Size</legend>
    <label class="ui-button"><input type="radio" name="size" data-sr checked>Small</label>
    <label class="ui-button"><input type="radio" name="size" data-sr>Medium</label>
    <label class="ui-button"><input type="radio" name="size" data-sr>Large</label>
  </fieldset>
</ui-button-group>
```

The element **wraps** the fieldset, it does not replace it — the same shape as
`<ui-accordion>` around its `<details>`. That is deliberate: the fieldset is what gives you
native radio grouping, `<legend>` labelling and `fieldset[disabled]` propagation, and none
of that is worth trading for nicer attribute names. The element is `display: contents`, so
it contributes **no box of its own** and adding it cannot change your layout.

A `<fieldset>` child is required. Both attribute spellings are accepted on both hosts, so
`data-variant` on the element works too if you prefer one spelling everywhere.

---

## Variants

Space-separated on `variant=` / `data-variant=`; they compose.

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

Pill-shaped segments. Resolves to `--radius-pill`, the same token base's own
`.ui-button[data-variant~="rounded"]` uses, so "rounded" means one thing across the system.

---

## Sizes

One attribute sets one em value, and every other metric derives from it — the same ladder
as [`ui/chip`](../chip/readme.md) and [`ui/beacon`](../beacon/readme.md):

| `size=` | font-size |
| --- | --- |
| *(none)* | `1em` |
| `xs` | `0.5em` |
| `sm` | `0.625em` |
| `md` | `0.875em` |
| `lg` | `1em` |
| `xl` | `1.15em` |
| `2xl` | `1.4em` |

```html
<ui-button-group size="sm">…</ui-button-group>
<fieldset class="ui-button-group" data-size="sm">…</fieldset>
```

The default is `1em` rather than chip's `0.875em`: a control is a hit target sized to its
context, where a chip is a label that sits smaller than its surroundings.

Because the value is `em`, the ladder **composes** — a `size="sm"` group is 0.625× whatever
text surrounds it, in a 16px context and a 32px one alike.

> **The attribute is the only entry point.** Chip's and beacon's ladders carry a second arm
> (`media="chip(sm)"`) because those are *media furniture*, overlaid on `<ui-media>` and
> driven by the `media=` DSL. This is a **text-area sub-component** — it lives inside
> `<ui-content>`, and `ui/card` reaches it through the preset `parts` seam
> (`parts.buttonGroup`, `parts.buttonGroupSize`, `parts.buttonGroupTheme`), which writes
> plain attributes. There is no `buttonGroup()` media token.

> **`size=` or `fs-*`, not both.** Base's `fs-*` utilities still work and still win, but
> they are CSS *absolute-size keywords* (`.fs-sm { font-size: small }`), so an `fs-sm` group
> measures 13px no matter what it sits inside. Reach for them only when you specifically
> want that context-independent behaviour.

---

## Theming

```html
<ui-button-group theme="red">…</ui-button-group>
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

The resolver's `--_theme-*` outputs are registered `inherits: false`, so they can only be
read on the element carrying the attribute. That is why the group republishes them into
`--ui-button-group-bg` / `-c`, which *do* inherit — and it is what lets `theme=` on the
element host reach the fieldset inside it.

---

## Customization

| Token | Default | Description |
| --- | --- | --- |
| `--ui-button-group-bg` | `var(--color-accent)` | Fill of the checked segment |
| `--ui-button-group-c` | `var(--color-accent-text)` | Ink of the checked segment |
| `--ui-button-group-border-width` | `0.125em` | Segment border in `border`/`outline` |
| `--ui-button-group-font-size` | `1em` | What `size=` sets; the whole control derives from it |
| `--ui-button-group-gap` | `0.25em` | Space between segments (zero under `border`) |
| `--ui-button-group-legend-gap` | `var(--spacing-xs)` | Space below `<legend>` |
| `--ui-button-group-padding-block` | `0.65em` | Segment padding, block axis |
| `--ui-button-group-padding-inline` | `1.6em` | Segment padding, inline axis |
| `--ui-button-group-radius` | `var(--radius-sm)` | Segment radius (`--radius-pill` under `rounded`) |

```css
.ui-button-group {
  --ui-button-group-bg: var(--color-success);
  --ui-button-group-border-width: 2px;
}
```

**Every metric is `em`.** Padding, gap and border width are deliberately *not* the absolute
`--spacing-*` / `--border-width-*` tokens, so that one `size=` — or one `font-size` — sizes
the whole control. `0.125em` is `--border-width-thick` at the root font size. Padding is `em`
rather than base's `1ch 2.5ch` for the same reason `ui/chip` and `ui/beacon` are: `ch` is the
advance width of "0" in the current face, so retuning `--font-form` would silently
re-proportion the segments.

---

## Accessibility

- Radios carry the state, so the group is keyboard-navigable and announced as a radio group.
- `<legend>` names the group; keep it even when visually hidden.
- `data-sr` hides each radio visually while leaving it focusable and exposed.
- The hit target is the whole `<label>`, not just the text.
- `<fieldset disabled>` disables every segment, through either host.

---

## Browser support

`:has()` is required for the checked-segment styling — Chrome/Edge 105+, Safari 15.4+,
Firefox 121+. Without it the segments render as plain buttons and the control still
functions, since the radios are real form controls.
