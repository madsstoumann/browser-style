# Base

Base CSS for browser.style components.

## Palette

Colours are `<hue>-<step>` (`green-300`, `gray-800`), plus `white` and `black`: ten hues
(gray red orange yellow green teal cyan blue violet pink) × eleven steps, and an `accent`
alias that points at one hue. They are `--color-<hue>-<step>` variables in `tokens.css` and
the `theme=` / `data-theme=` values in `theme.css`. The source is
[`palette.json`](palette.json); `node scripts/build-palette.js` regenerates the marked
blocks. Names, text colours, dark pages, looks and adding a hue: [theme.md](theme.md).

## Checkbox / radio modifiers

Classes on the `<input>` itself (`form.css`). The glyph is `--input-check-icon`
(`check.svg` by default), painted by `::after` as a mask — a radio's dot look just
hides it behind `clip-path` + an inset ring.

| Class | Effect |
|---|---|
| `--cross` | swaps the glyph to `cross.svg` |
| `--round` | circular box |
| `--square` | square box (no radius) |
| `--check` | **radio only** — show the glyph instead of the dot |

`:indeterminate` (a checkbox set from script, or a radio whose group has no checked
member) renders a grey minus. On a `--check` radio it renders that radio's own glyph
in the same grey instead, so an unvoted poll previews the checkmark rather than a
minus. Demo: [`ui/check-radio/index.html`](../check-radio/index.html).

## Polyfills

- [`polyfills/attr-fallback.js`](polyfills/readme.md) — typed `attr()` for
  Safari/Firefox. Components that read `fill=` / `ink=` / `ring=` / `value=` etc.
  lose the value entirely there (it does **not** degrade to the `attr()` fallback);
  each component ships an `@supports` block for the no-JS case, and this restores
  per-element values on top. No-op in Chromium.