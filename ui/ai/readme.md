# ui-ai

`<ui-ai>` is the EU AI Act disclosure label. It works as media furniture on a card, and it also
works standalone. It uses the Commission's own AI icons, drawn as CSS masks, and it needs no
JavaScript.

[Card demo](../card/demo/media.ai.html) · [standalone demo](index.html)

```html
<ui-ai options="generated required voice footage"
  aria-description="The voice and footage are generated with AI. It shows or imitates real people, objects, places or events, and is not authentic.">AI-generated voice and footage</ui-ai>
```

One element, one text node. The icon is CSS. The details are in `aria-description`: screen readers
announce them and nothing paints them.

## Facts and look

`<ui-ai>` holds two kinds of token, the same way the rest of the card system separates content
from presentation:

- **`options=` holds the facts** about the media. It is content, and the renderer writes it.
- **`ai(…)` on the parent's `media=` holds the look.** It comes from the preset, exactly as
  `chip(…)` does.

| Option | Meaning |
|---|---|
| `edited` \| `generated` | Which kind of AI involvement. When there is none, there is no element. |
| `partial` | Real footage with synthetic parts. The pill face draws the "AI MODIFIED" artwork even when the involvement is `generated`. |
| `required` | The media is a deep fake, so a label is required by law (Art. 50(4)). |
| `artistic` | An artistic or fictional work. Only set together with `required`. |
| `voice` `music` `footage` `script` | Which parts are synthetic. Recordings only. |

| `media=` token | Values | Default |
|---|---|---|
| `ai(<cell>)` | `ts tc te cs cc ce bs bc be` | `bc` |
| `ai(<face>)` | `label` (icon + word) · `icon` (icon only) · `pill` (the EU "AI GENERATED" / "AI MODIFIED" artwork) | `label` |
| `ai(<hue>)` | the nine hues | `black` |
| `ai(<size>)` | `lg` (13px) · `xl` (16px) | 11px — the smallest readable size; sizes only grow |

The same axes work standalone as attributes on the element itself: `face=`, `size=` and `theme=`.

## When a label is required

Only a **deep fake** has to be labelled. A deep fake is AI content that resembles real people,
objects, places or events, and would pass as authentic.

- On an image, the whole image counts.
- On a recording, only a synthetic **voice** or **footage** counts.
- Music or a script alone never makes a deep fake.

`render.js` works this out in `aiOptions(ai, mediaType)` and `aiLabel(ai, mediaType)`. The truth
table is data, in [`data/cases.json`](data/cases.json). Any port of these functions, such as a
CMS's server-side renderer, must pass every case in it.

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

**The legal floor is CSS.** A label that is `required` and not `artistic` **ignores `ai(icon)`**,
so its word stays visible. A voluntary or artistic label may shrink to the icon alone. The word
stays in the markup at `font-size: 0`, so a screen reader still reads it.

`pill` applies under `:lang(en)` only. The EU artwork is English, so on a page in any other
language the label keeps the disc and its own word.

The disclosure never goes in the alt text. The alt text describes what is in the picture, not how
the picture was made.

## Icons

The Commission's originals live, untouched, in [`/assets/ai`](../../assets/ai): 12 SVGs, free to
use without attribution. `node icons.build.js` derives three mask files from them into `icons/`:

- `ai.svg`, `ai-generated.svg` and `ai-modified.svg` are **knockouts**: the shape is opaque and the
  letters are holes. Each is cropped to the shape, because the originals pad it inside the canvas.

How the faces paint:

- **`label`:** the knockout is painted in the ink colour, so the letters show the plate behind
  them.
- **`icon` and `pill`:** the knockout is painted in the plate colour over an ink backing inset 1px
  (`content-box`), which has the same effect with no plate around it and no rim at the edge.

The originals cannot be used as masks directly. Their letters are painted over the shape, so an
alpha mask loses the letters, and a luminance mask leaves them at 11%.

`node icons.build.js --check` (also run by `npm test`) fails when an output no longer matches its
original.

## Custom properties

| Property | Default |
|---|---|
| `--ui-ai-plate` / `--ui-ai-ink` | the hue's background / ink |
| `--ui-ai-font-size` | `0.6875rem` (11px). Measured in rem, so a small card's scale never shrinks it below readable |
| `--ui-ai-icon-size` | 1.15 × the font size for the label; at least 24px for the icon and the pill |
| `--ui-ai-padding`, `--ui-ai-radius` | pill-shaped label |
| `--ui-ai-lift` | `3rem` when the frame holds a `<video controls>`, so the label clears the native controls |
