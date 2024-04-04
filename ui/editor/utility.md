# Utility

`utility.json` is a configuration-file for the style-editor, and can be used to generate a visual editor for Tailwind, your own styles — or even a mix.

The file is a nested structure of objects with groups of objects:

```json
[
  {
    "key": "unique-key",
    "label": "LABEL",
    "groups": []
  }
]
```

The amount of nested levels are infinite, but more than three will look weird in the visual editor.

The deepest level of a group will contain the element that can change/affect a style:


```json
{
  "key": "aspect-ratio",
  "label": "Aspect Ratio",
  "ui": "button-group",
  "values": [
    { "name": "auto", "value": "aspect-auto" },
    { "name": "square", "value": "aspect-square" },
    { "name": "video", "value": "aspect-video" }
  ]
}
```

If all classes within a group starts with a `prefix`, you can use a simpler syntax, where `values` just contain the values that will be displayed:

```json
{
  "key": "aspect-ratio",
  "label": "Aspect Ratio",
  "prefix": "aspect",
  "ui": "button-group",
  "values": ["auto", "square", "video"]
},
```

> **NOTE:** `values` can either be an array of strings, or an array of `name/value`-objects.


## UI
The `ui`-property can be one of the following types:

- button-group¶ (default)
- color-grid†
- color-swatch
- fieldset
- font-list‡
- position§
- radio-list
- range
- switch

> ¶ Can be used with an additional `uix`-property:

- col-2
- col-3
- col-4

_Example:_

```json
{
  "ui": "button-group",
  "uix": "col-3"
}
```

If a `button-group` has a `values` -array with `name/value`-pairs, you can also add an `icon`:

```json
{
  "key": "aspect-ratio",
  "label": "Aspect Ratio",
  "ui": "button-group",
  "values": [
    {
      "icon": "asr-auto.svg",
      "name": "auto",
      "value": "aspect-auto"
    },
    {
      "icon": "asr-square.svg",
      "name": "square",
      "value": "aspect-square"
    },
    {
      "icon": "asr-video.svg",
      "name": "video",
      "value": "aspect-video"
    }
  ]
}
```

> † `color-grid` requires a specific structure for multiple colors, in `values`:
```json
{
  "name": "slate",
  "values": "#f1f5f9 #e2e8f0 #cbd5e1 #94a3b8 #64748b"
},
{
  "name": "red",
  "values": "#fee2e2 #fecccc #fca5a5 #f87171 #ef4444"
},
```
> ‡ Requires `name/value`-pairs, where `name` can be set as a `font-family` for previews.

> § Requires **nine** values

If ui is set to `fieldset`, all the sub-elements will be displayed in a single fieldset.

## Example:

```json
{
  "key": "typography",
  "label": "Typography",
  "groups": [
    {
      "key": "font-family",
      "label": "Font Family",
      "ui": "font-list",
      "values": [
        { "name": "sans-serif", "value": "font-sans" },
        { "name": "serif", "value": "font-serif" },
        { "name": "monospace", "value": "font-mono" }
      ]
    },
    {
      "key": "font-size",
      "label": "Font Size",
      "prefix": "text",
      "ui": "range",
      "values": ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"]
    },
  ]
}
```