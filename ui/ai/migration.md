# Upgrading `@browser.style/ai` from 1.x to 2.0

**In short:** the element's content now decides what shows. `options=` and the face tokens are
gone. The text inside `<ui-ai>` is the word next to the EU icon; an empty `<ui-ai>` shows the
icon alone.

```html
<!-- 1.x -->
<ui-ai options="generated required voice footage" aria-description="…">AI-generated voice and footage</ui-ai>

<!-- 2.0 — icon + word -->
<ui-ai aria-description="…">GENERATED</ui-ai>

<!-- 2.0 — icon + phrase -->
<ui-ai aria-description="…">Voice rendered with AI</ui-ai>

<!-- 2.0 — icon only (voluntary labels only) -->
<ui-ai aria-description="…"></ui-ai>
```

## What changed

| 1.x | 2.0 |
|---|---|
| `options="edited"` / `options="generated"` | Removed. The word says it: `MODIFIED` or `GENERATED` |
| `options="partial"` | Removed. Real footage with synthetic parts reads `MODIFIED` |
| `options="required"` / `options="artistic"` | Removed. A deep fake must always carry a word — your renderer enforces it (see below). The artistic context stays in `aria-description` |
| `options="voice music footage script"` | Removed. Which parts are synthetic stays in `aria-description` only |
| Text `AI-generated`, `Edited with AI`, `AI-generated voice and script` … | Default word `GENERATED` or `MODIFIED`, or any short phrase via `label` (`Voice rendered with AI`). Shown as written — CSS changes no case |
| `media="ai(label)"` | Removed — a word is the default |
| `media="ai(icon)"`, `face="icon"` | Removed — render the element **empty** instead |
| `media="ai(pill)"`, `face="pill"` | Removed — the word face is the EU icon plus the word, and it works in any language (the English-only `:lang(en)` rule is gone) |
| `icons/ai-generated.svg`, `icons/ai-modified.svg` | Deleted. `icons/ai.svg` is the only icon |
| `--ui-ai-padding` | Replaced by `--ui-ai-padding-block` and `--ui-ai-padding-inline` (logical, so right-to-left pages now pad the correct side) |
| — | New: `--ui-ai-letter-spacing` (`0.04em`) |
| Default `--ui-ai-icon-size` 1.15 × font size | 1.8 × font size, so the disc fills the end of the pill |
| Default weight medium | semibold |

**Unchanged:** `ai(<cell>)`, `ai(<hue>)`, `ai(lg|xl)`, the standalone `size=` and `theme=`
attributes, `aria-description`, `--ui-ai-plate`, `--ui-ai-ink`, `--ui-ai-font-size`,
`--ui-ai-radius` and `--ui-ai-lift`.

## The legal floor has moved to your renderer

In 1.x the CSS refused to hide the word on a deep fake (`options="required"` ignored `ai(icon)`).
CSS cannot add back a word that is not in the markup, so in 2.0 **the renderer is responsible**:
never render an empty `<ui-ai>` for content that shows or imitates something real. `render.js`
always writes a word; a port must do the same.

## Renderer and ports

- **Input is unchanged:** `involvement`, `depictsReal`, `artistic`, `elements`, `label`, `details`.
- **`label` is now the word or phrase shown next to the icon.** Update CMS dictionaries:
  `AI-generated` → `GENERATED`, `Edited with AI` → `MODIFIED`. For Danish, for example:
  `GENERERET` / `REDIGERET`. A phrase such as `Voice rendered with AI` works too.
- **`aiOptions()` is removed.** `aiLabel()` now returns `GENERATED` or `MODIFIED`. The new
  `aiDescription()` returns the `aria-description` text.
- **`data/cases.json`:** the `options` column is gone and a `description` column is added. Run
  your port's tests against the new file.

## Accessibility

The icon now carries alternative text (`content: "" / "AI"`), so the accessible name is
"AI GENERATED", or "AI" for an empty element (verified in Chromium's accessibility tree; Safari
renders both faces correctly — confirm the name there with VoiceOver).

Two things to watch:
- Text shows as written. Capitals are fine for a single word (`GENERATED`); write a phrase in
  sentence case.
- Keep an icon-only element **truly empty**. A single space counts as text and renders an empty
  word face.

## Checklist

1. Remove `options=` from every `<ui-ai>`.
2. Replace the text with `GENERATED` / `MODIFIED`, your dictionary's word, or a short phrase.
3. Remove `ai(label)`, `ai(icon)` and `ai(pill)` from presets and `media=` strings, and `face=` from
   standalone labels. For icon only, render the element empty — voluntary labels only.
4. Replace any `--ui-ai-padding` override with `--ui-ai-padding-block` / `--ui-ai-padding-inline`.
5. Remove references to `icons/ai-generated.svg` and `icons/ai-modified.svg`.
6. Ports: drop `aiOptions`, add `aiDescription`, and pass the new `data/cases.json`.

Details: [readme.md](readme.md) · demos: [standalone](index.html), [card](../card/demo/media.ai.html).
