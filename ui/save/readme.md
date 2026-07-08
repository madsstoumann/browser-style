# @browser.style/save

A save / favorite / wishlist / bookmark toggle, designed to sit over a card or product image (top/bottom-right, Amazon / IMDb style). It composes an **invoker button** and a **`<ui-icon type="shape">`**: unsaved shows an outline glyph, saved shows a filled glyph.

## Features

- Three glyphs via `<ui-icon>`: `heart` (default), `bookmark`, `star`
- One shape per state — outline when unsaved, filled when saved — using `border-shape` + a `background` toggle (no second path, no attribute swap)
- State read from the button's `aria-pressed` (native, accessible)
- Toggle wired with the **Invoker Commands API** (`command` / `commandfor`) so a script can grab it
- Three sizes; token-driven idle and active ink colors
- Light/dark support via design tokens

---

## Install

```bash
npm install @browser.style/save
```

Peer dependencies:

```bash
npm install @browser.style/base @browser.style/icon
```

> `@browser.style/base` provides the design tokens; `@browser.style/icon` provides the shape catalog (`--ui-icon-shape-heart` / `-bookmark` / `-star`) and the `<ui-icon>` element.

---

## Usage

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/icon/ui-icon.css">
<link rel="stylesheet" href="@browser.style/save/index.css">
```

Markup — a `<ui-save>` wrapping an invoker `<button>` and a `<ui-icon>`. The icon stays `variant="outline"`; the button carries the state and the `aria-label`:

```html
<ui-save id="save-1">
  <button type="button" command="--save" commandfor="save-1" aria-label="Add to favorites">
    <ui-icon type="shape" shape="heart" variant="outline"></ui-icon>
  </button>
</ui-save>
```

Pre-mark a saved item with `aria-pressed="true"` on the button.

### Toggling (script)

`ui-save` ships no toggle logic — the paint is pure CSS, and flipping the state is one listener. The button fires a custom command on its target; handle it and flip `aria-pressed`:

```js
document.getElementById('save-1').addEventListener('command', (e) => {
  if (e.command !== '--save') return;
  const btn = e.source;
  const saved = btn.getAttribute('aria-pressed') !== 'true';
  btn.setAttribute('aria-pressed', saved);
  // persist / emit your own event here
});
```

> The `command` event does not bubble — listen on the `commandfor` target (the `<ui-save>`). Invoker Commands are Baseline (Dec 2025); polyfill older browsers with [invokers-polyfill](https://github.com/keithamus/invokers-polyfill) if needed.

---

## Shapes

Any `ui-icon` shape works. The three save-relevant ones:

| `shape` | Glyph | Typical use |
|---------|-------|-------------|
| `heart` | Heart | Favorite |
| `bookmark` | Bookmark | Save for later |
| `star` | Star | Wishlist / rate |

Add your own by registering a `--ui-icon-shape-{name}` token (a `shape()` / `polygon()`) in `@browser.style/icon` and using `shape="{name}"`.

## Sizes

`sm`, `lg`, `xl` — `md` is the default (no attribute):

```html
<ui-save size="sm">…</ui-save>
<ui-save>…</ui-save>            <!-- md (default) -->
<ui-save size="lg">…</ui-save>
<ui-save size="xl">…</ui-save>
```

---

## Circle backdrop

Add a solid disc behind the glyph for contrast over busy images with `variant="circle"`. The disc
colour is the `--ui-save-circle-bg` token (`Canvas` — the page background — by default), so it's
easy to retune:

```html
<ui-save variant="circle">
  <button type="button" command="--save" commandfor="c1" aria-label="Save">
    <ui-icon type="shape" shape="heart" variant="outline"></ui-icon>
  </button>
</ui-save>
```

It's a true circle by default; for an `rds(*-sq)`-style squircle set
`--ui-save-circle-corner: superellipse(var(--squircle-md))`.

## Customization

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-save-c` | `var(--color-text)` | Idle (unsaved) ink |
| `--ui-save-c-active` | `var(--color-error)` | Saved ink (also on hover) |
| `--ui-save-sz` | `1.6em` | Icon size |
| `--ui-save-circle-bg` | `Canvas`¹ | Disc colour (¹ `Canvas` once the circle is enabled) |
| `--ui-save-circle-radius` | `0` | Disc radius (`--radius-circle` when enabled) |
| `--ui-save-circle-pad` | `0` | Space between glyph and disc edge |
| `--ui-save-circle-corner` | `round` | `corner-shape` — `superellipse(...)` for a squircle |

```html
<ui-save style="--ui-save-c-active: gold;">
  <button type="button" command="--save" commandfor="w1" aria-label="Wishlist" aria-pressed="true">
    <ui-icon type="shape" shape="star" variant="outline"></ui-icon>
  </button>
</ui-save>
```

Outline thickness follows the icon's `stroke` attribute (it's a real `border`).

---

## In a card (`ui-media` furniture)

Inside `<ui-media>`, the parent `media=` token drives position, colour and the disc — the shape
stays on the `<ui-icon>`:

```html
<ui-card media="asr(4/3) save(be) save(crc) save(warning)">
  <ui-media>
    <img …>
    <ui-save>
      <button type="button" command="--save" commandfor="<card id>" aria-label="Save">
        <ui-icon type="shape" shape="star" variant="outline"></ui-icon>
      </button>
    </ui-save>
  </ui-media>
</ui-card>
```

| Token | Standalone equivalent | Effect |
|-------|----------------------|--------|
| `save(<pos>)` | — | Position — `ts tc te · cs cc ce · bs bc be` |
| `save(<hue>)` | `theme="<hue>"` | Ink from the 8 theme hues `red orange green blue accent dark light subtle` (+ semantic aliases `error warning success info`) |
| `save(<size>)` | `size="<size>"` | Scale — `sm lg xl` (`md` = default) |
| `save(<corner>)` | `radius="<corner>"` | Disc shape — `crc` circle (default) · `sqr` squircle · `rnd` rounded |
| `save(non)` | `variant="non"` | Hide the disc (bare glyph) |

The disc backdrop is **on by default** (`Canvas`). Standalone, use `theme=` (hue),
`ink="<css-color>"` (glyph) / `fill="<css-color>"` (the disc), `size=` and `radius=` — the same
model as `chip`/`sticker`/`play`.

`commandfor` points at the `<ui-card>` / `<ui-media>` so the handler has the card in context. Full
token reference: [`ui/card/card.md` → Save furniture](../card/card.md).

---

## Accessibility

- The `<button>` provides the control semantics, keyboard support, and focus handling.
- **Always** set `aria-label` on the button — the glyph is purely visual.
- Saved state is exposed via `aria-pressed`.

---

## Browser Support

The outline/fill relies on **`border-shape`**, which is still experimental (Chromium, behind active development) — no cross-browser support yet. Treat this component as forward-looking until `border-shape` ships more widely. `clip-path: shape()` (used for filled `<ui-icon>` glyphs) is Chrome 137+ / Safari 18.4+. Invoker Commands are Baseline since Dec 2025.
