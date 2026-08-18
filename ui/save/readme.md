# @browser.style/save

A save / favorite / wishlist / bookmark toggle, designed to sit over a card or product image (top/bottom-right, Amazon / IMDb style). It composes an **invoker button** and a **`<ui-icon type="shape">`**: unsaved shows an outline glyph, saved shows a filled glyph.

## Features

- Three glyphs via `<ui-icon>`: `heart` (default), `bookmark`, `star`
- One shape per state — outline when unsaved, filled when saved — using `border-shape` + a `background` toggle (no second path, no attribute swap)
- State read from the button's `aria-pressed` (native, accessible)
- Toggle wired with the **Invoker Commands API** (`command` / `commandfor`) so a script can grab it
- Three sizes; token-driven ink — the saved fill uses the **same** colour as the outline by default (black outline → black fill, red → red); opt into a two-colour toggle with `--ui-save-c-active`
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
<link rel="stylesheet" href="@browser.style/save/index.css">
```

`index.css` pulls in `@browser.style/icon` for the glyph, so you only link this one
file. If you bundle the icon set yourself, import the bare `save/ui-save.css` instead.

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
colour is the `--ui-save-circle-bg` token (a white 70% overlay by default — see
[below](#the-disc-follows-the-carousel-not-the-page)), so it's easy to retune:

```html
<ui-save variant="circle">
  <button type="button" command="--save" commandfor="c1" aria-label="Save">
    <ui-icon type="shape" shape="heart" variant="outline"></ui-icon>
  </button>
</ui-save>
```

It's a true circle by default; for an `rds(*-sq)`-style squircle set
`--ui-save-circle-corner: superellipse(var(--squircle-md))`.

### The disc follows the carousel, not the page

Defaults are **not** `Canvas` / `--color-text`, and deliberately do not track
`color-scheme`: `<ui-save>` sits on media, so a document-surface disc turned near-black at
OS-dark while the carousel controls beside it stayed white. It now reads the carousel's own
chrome (`--ui-carousel-arrow-plate` / `--ui-carousel-arrow-ink` and their `-hover` twins),
matching `<ui-lightbox>` in the same corner grid. Off a carousel the fallbacks apply: white
70% disc, dark glyph, soft shadow, hairline ring. Details:
[card docs — band ink](../card/docs/carousel.md#the-furniture-discs-follow-the-arrows).

## Customization

| Token | Default | Description |
|-------|---------|-------------|
| `--ui-save-c` | `var(--ui-carousel-arrow-ink, rgb(0 0 0 / 0.8))` | Idle (unsaved) ink — the carousel's glyph ink on media, else a dark overlay ink (`var(--color-accent)` for `bookmark`) |
| `--ui-save-c-active` | `var(--ui-save-c)` | Saved ink (also on hover) — tracks the idle ink, so filling the glyph *is* the state change |
| `--ui-save-c-idle` | `var(--color-text-muted)` | Idle ink in browsers without `border-shape` only — where the outline glyph paints solid, so hue is the only state cue |
| `--ui-save-sz` | `1.2em` | Icon size |
| `--ui-save-stroke` | `0.1em` | Outline thickness — em-based, so it tracks `--ui-save-sz` |
| `--ui-save-circle-bg` | `var(--ui-carousel-arrow-plate, rgb(255 255 255 / 0.7))` | Disc colour — the carousel's arrow disc on media, else a white overlay disc |
| `--ui-save-circle-bg-hover` | `var(--ui-carousel-arrow-plate-hover, rgb(255 255 255 / 0.9))` | Disc colour on hover |
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

### One ink or two

By default there is **one ink**: `--ui-save-c-active` resolves to `var(--ui-save-c)`, so the hue
survives the toggle and only the *fill* changes — outline heart → filled heart in the same colour.
Every `theme=` / `save(<hue>)` already behaved this way; `ink="<css-color>"` does too.

For the classic two-colour toggle (neutral outline → red fill), set the active ink yourself:

```html
<ui-save style="--ui-save-c-active: var(--color-error);">…</ui-save>
```

## Outline width

The outline is a real `border` on the glyph, and its thickness **follows the size**:
`--ui-save-stroke` is `0.1em`, not the absolute `2px` `ui-icon` defaults to (right at `md`, chunky
at `sm`, thin at `xl`). There is no separate stroke scale — one token, and it scales with `size=`
(`size="sm"` nudges it to `0.125em`, since `0.1em` of a `0.8em` glyph lands on a 1px hairline):

```html
<ui-save style="--ui-save-stroke: 0.05em;">…</ui-save>   <!-- hairline -->
<ui-save>…</ui-save>                                     <!-- 0.1em (default) -->
<ui-save style="--ui-save-stroke: 0.2em;">…</ui-save>    <!-- heavy -->
```

A `stroke=` on the **`<ui-icon>`** still wins, if you need an absolute px value.


---

## In a card (`ui-media` furniture)

Inside `<ui-media>`, the parent `media=` token drives position, colour and the disc — the shape
stays on the `<ui-icon>`:

```html
<ui-card media="asr(4/3) save(be) save(crc) save(orange)">
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
| `save(<hue>)` | `theme="<hue>"` | Ink from the nine theme hues `red orange green blue accent black white gray slate` (idle **and** saved) |
| `save(<size>)` | `size="<size>"` | Scale — `sm lg xl` (`md` = default) |
| `save(<corner>)` | `radius="<corner>"` | Disc shape — `crc` circle (default) · `sqr` squircle · `rnd` rounded |
| `save(non)` | `variant="non"` | Hide the disc (bare glyph) |

The disc backdrop is **on by default**. Standalone, use `theme=` (hue),
`ink="<css-color>"` (glyph) / `fill="<css-color>"` (the disc), `size=` and `radius=` — the same
model as `chip`/`sticker`/`play`.

`commandfor` points at the `<ui-card>` / `<ui-media>` so the handler has the card in context. Full
token reference: [`ui/card/docs/card.md` → Save furniture](../card/docs/card.md).

---

## Accessibility

- The `<button>` provides the control semantics, keyboard support, and focus handling.
- **Always** set `aria-label` on the button — the glyph is purely visual.
- Saved state is exposed via `aria-pressed`.

---

## Browser Support

The outline/fill relies on **`border-shape`**, which is still experimental (Chromium, behind active development) — no cross-browser support yet. Treat this component as forward-looking until `border-shape` ships more widely. `clip-path: shape()` (used for filled `<ui-icon>` glyphs) is Chrome 137+ / Safari 18.4+. Invoker Commands are Baseline since Dec 2025.
