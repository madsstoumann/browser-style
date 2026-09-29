# ui-ai

`<ui-ai>` is the EU AI Act disclosure label. It works as media furniture on a card, and it also
works standalone. It uses the Commission's own AI icon, drawn as a CSS mask, and it needs no
JavaScript.

[Card demo](../card/demo/media.ai.html) · [standalone demo](index.html) · [upgrading from 1.x](migration.md)

```html
<ui-ai aria-description="The voice and footage are generated with AI. It shows or imitates real people, objects, places or events, and is not authentic.">GENERATED</ui-ai>
<ui-ai aria-description="The voice is generated with AI.">Voice rendered with AI</ui-ai>
<ui-ai aria-description="This image was generated with AI."></ui-ai>
```

One element, at most one text node. The icon is CSS. The details are in `aria-description`:
screen readers announce them and nothing paints them.

## Word, phrase or icon

The content decides what shows:

- **With text** — the EU icon and the text next to it, as written: `AI` `GENERATED`. This is the
  Commission's basic icon with a text label, the pairing the draft Code's user testing favoured.
- **Empty** — the EU icon alone (`:empty`). Keep the element truly empty: a single space is text,
  and it renders the word face with nothing in it.

The text shows exactly as written — CSS changes no case. A single word may be written in capitals,
like the EU artwork (`GENERATED`); write a phrase in sentence case (`Voice rendered with AI`). The
icon carries alternative text (`content: "" / "AI"`), so the accessible name is "AI GENERATED", or
"AI" for an empty element.

| Word | When |
|---|---|
| `GENERATED` | The whole item is generated with AI. |
| `MODIFIED` | Human-made content edited with AI, or real footage with synthetic parts. |

The text can also be a short phrase that names the part — `Voice rendered with AI`,
`Sky replaced with AI` — and on another language it is that language's word. `render.js` takes
either from the media item's `label` field. Keep it short: it is one line, and the icon already
says "AI".

## Look

The look comes from the parent's `media=`, exactly as `chip(…)` does:

| `media=` token | Values | Default |
|---|---|---|
| `ai(<cell>)` | `ts tc te cs cc ce bs bc be` | `bc` |
| `ai(<hue>)` | the nine hues | `black` |
| `ai(<size>)` | `lg` (13px) · `xl` (16px) | 11px — the smallest readable size; sizes only grow |

The same axes work standalone as attributes on the element itself: `size=` and `theme=`.

## When a label is required

Only a **deep fake** has to be labelled. A deep fake is AI content that resembles real people,
objects, places or events, and would pass as authentic.

- On an image, the whole image counts.
- On a recording, only a synthetic **voice** or **footage** counts.
- Music or a script alone never makes a deep fake.

`render.js` works this out in `aiLabel(ai, mediaType)` (the word) and
`aiDescription(ai, mediaType)` (the `aria-description`). The truth table is data, in
[`data/cases.json`](data/cases.json). Any port of these functions, such as a CMS's server-side
renderer, must pass every case in it.

A media item's input looks like this:

```json
{ "ai": { "involvement": "generated", "depictsReal": true, "artistic": false, "elements": ["voice"] } }
```

- `involvement` is matched on its first word, so a CMS label such as "Generated with AI" works as
  it is.
- `label` overrides the English word. Pass it when the CMS has its own dictionary.
- `details` (a string or an array) overrides the `aria-description` sentences in the same way.

## What the law asks for, and what is shown

Art. 50(4) asks the deployer to disclose **that** the content has been artificially generated or
manipulated, clearly and at first exposure (Art. 50(5)). The icon and the word do exactly that, so
they are all that is shown. The details, such as which parts are synthetic or whether it shows
something real, go beyond the duty. They ride `aria-description` for assistive technology and are
never painted. The label is not a tab stop, because there is nothing to reveal.

**The legal floor is the renderer's.** `render.js` always writes a word, so a deep fake always
shows one. An empty, icon-only label is a choice made in the markup, and only for a voluntary
label. CSS cannot put back a word that is not there, so a port or a hand-written page that renders
a deep fake empty breaks the floor.

The disclosure never goes in the alt text. The alt text describes what is in the picture, not how
the picture was made.

## Icon

The Commission's originals live, untouched, in [`/assets/ai`](../../assets/ai): 12 SVGs, free to
use without attribution. `node icons.build.js` derives one mask file from the basic icon into
`icons/`:

- `ai.svg` is a **knockout**: the disc is opaque and the letters are holes. It is cropped to the
  disc, because the original pads it inside the canvas.

How it paints:

- **With a word:** the knockout is painted in the ink colour, so the letters show the plate behind
  them.
- **Empty:** the knockout is painted in the plate colour over an ink backing inset 1px
  (`content-box`), which has the same effect with no plate around it and no rim at the edge.

The originals cannot be used as masks directly. Their letters are painted over the shape, so an
alpha mask loses the letters, and a luminance mask leaves them at 11%.

`node icons.build.js --check` (also run by `npm test`) fails when the output no longer matches its
original.

## Custom properties

| Property | Default |
|---|---|
| `--ui-ai-plate` / `--ui-ai-ink` | the hue's background / ink |
| `--ui-ai-font-size` | `0.6875rem` (11px). Measured in rem, so a small card's scale never shrinks it below readable |
| `--ui-ai-font-weight`, `--ui-ai-letter-spacing` | semibold, `0.04em` |
| `--ui-ai-icon-size` | 1.8 × the font size with a word, so the disc fills the pill's end; at least 24px when empty |
| `--ui-ai-padding-block`, `--ui-ai-padding-inline`, `--ui-ai-radius` | pill-shaped label, logical padding |
| `--ui-ai-lift` | `3rem` when the frame holds a `<video controls>`, so the label clears the native controls |
