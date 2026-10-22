# ui-energy

The EU energy label's **nested display** as a visual indicator: the arrow in the class colour, the class letter in white, a black border and the scale range in black. It works as card furniture or inline next to a price. It has no JavaScript and is not interactive.

```html
<ui-energy type="phone" grade="B" role="img" aria-label="Energiklasse B på en skala fra A til G">B</ui-energy>
```

## Attributes

| Attribute | What it does |
|---|---|
| `grade` | The product's class (`A`, `B` … `A+++`). It picks the colour. |
| `type` | The product group. It picks the scale the regulation sets for that group, so a phone gets A–G without saying so. |
| `scale` | Overrides the scale `type` implies (for example `scale="A-G"`). Without `type` or `scale` the scale is A–G. |

The text content is the class as written. Keep it, together with `role="img"` and an `aria-label` that names the class and the range, because the range is painted by CSS and is not in the accessible name.

## Scales and product groups

The colour is the class's **place on its scale**, not its letter: on A–G a `D` is yellow, and on A+++–D a `D` is red. Scales and product groups live in `data/scales.json`, and `node scales.build.js` regenerates the marked block in `ui-energy.css` (run it twice; the second run is a no-op).

| Scale | `type=` |
|---|---|
| A–G | `phone`, `tablet`, `fridge`, `dishwasher`, `washer`, `washer-dryer`, `dryer`, `display`, `light`, `commercial-fridge` |
| A–E | `tyre` |
| A+++–D | `oven`, `hood`, `space-heater`, `air-con`, `boiler` |
| A+–F | `water-heater` |
| A+–G | `ventilation` |
| A++–G | `local-heater` |
| A+++–G | `pro-fridge` |

Seven-class scales use the seven regulated arrow colours as they are. Other scale lengths mix the two neighbouring colours in oklab. That is an approximation, so check those against the product group's own regulation before relying on them. The product-group-to-scale table is also worth checking against EPREL when a group is rescaled.

## What the regulation asks for (phones and tablets)

Regulation (EU) 2023/1669, Annex VIII, applies from 20 June 2025. For a nested display it asks for:

- an arrow pointing left, in the class colour;
- the class letter in 100% white, in Calibri Bold, at a font size equal to the price's;
- a visible 100% black border around the arrow;
- the range of classes in 100% black.

The arrow is em-based, so inside the price element it takes the price's font size. The rule also wants it close to the price, which makes the price row the compliant default. Furniture on the image suits listings where the price sits right under it.

The online rules also make the nested display a link that opens the full label, with a separate "product information sheet" link to EPREL. This component deliberately covers only the visual part. The interactive parts are a later step.

The font falls back from Calibri to Carlito (metric-compatible) to the form font. White on the yellow D class is low contrast by regulation, which is why the `aria-label` carries the meaning.

## As card furniture

On a card, `energy(<cell>)` places it on the nine-cell grid (default `bs`), and `energy(sm|lg)` sizes it (1.125rem, 2rem; the default is 1.5rem). The colour has no token, because it is product data and not styling.

```html
<ui-card media="energy(ts) sticker(te) save(be)">
  <cq-box>
    <ui-media>
      <img src="…" alt="…">
      <ui-energy type="phone" grade="A" role="img" aria-label="Energiklasse A på en skala fra A til G">A</ui-energy>
    </ui-media>
  </cq-box>
</ui-card>
```

## Custom properties

| Property | Default |
|---|---|
| `--ui-energy-font-size` | `1em` (`1.5rem` as furniture) |
| `--ui-energy-font-family` | `Calibri, Carlito, var(--font-form)` |
| `--ui-energy-border` | `2px` |
| `--ui-energy-a` … `--ui-energy-g` | sRGB of the regulation's CMYK arrow colours |

Demo: [index.html](index.html) shows every scale, and [ui/card/demo/phone.html](../card/demo/phone.html) shows both placements.
