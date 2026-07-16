# Theme — the shared `theme=` axis

`theme=` is one **generic, cross-component color axis**. The same vocabulary works
on `<ui-card>`, `<ui-chip>`, `<ui-sticker>`, `<lay-out>`/`<lay-out-group>` and any
other component that opts in — so a layout can be `gray` while the cards inside it
are `black`, `red pale`, etc. Each element resolves its own `theme=` independently;
a themed ancestor never leaks its theme onto un-themed descendants.

Resolver + modifiers live in `theme.css`; the named bundles live in `tokens.css`.
`@browser.style/base` is a required peer dependency, so both are always available.

## Syntax

`theme=` is a **space-separated token list**: exactly one **color** token, plus any
number of **modifier** tokens.

```html
<ui-card  theme="black dark">…</ui-card>
<ui-chip  theme="red">new</ui-chip>
<ui-chip  theme="red pale">soft</ui-chip>
<ui-chip  theme="red pale muted">quiet</ui-chip>
<lay-out  theme="gray" bleed>…</lay-out>
```

### Color tokens (pick one)

Every bundle's surface **and** ink is a `light-dark()` pair, so the colors adapt to
`color-scheme` automatically — the same approach as button's `.bg-*` classes, which
read the `light-dark()` `--color-*` tokens.

| Token | Surface |
|---|---|
| `red` | `--color-error` |
| `orange` | `--color-warning` |
| `green` | `--color-success` |
| `blue` | `--color-info` |
| `accent` | `--color-accent` |
| `white` | lightest neutral |
| `gray` | light-gray neutral |
| `slate` | dark-slate neutral |
| `black` | near-black neutral |

The neutrals form a light→dark ramp: **`white` < `gray` < `slate` < `black`**. Each
stays true to its name in both schemes (a `white` theme is still a light surface in
dark mode); the `light-dark()` pair only softens the shade for the opposite scheme.

### Modifier tokens (add any)

| Token | Effect |
|---|---|
| `pale` | Tinted surface (`color-mix` of the color with the page surface, 80%), ink = the color. Mirrors the light button variant — a pale/pastel version. |
| `muted` | Fades the theme colors via `color-mix(… transparent 50%)`. Reduces the **theme's** alpha only — it does **not** use element `opacity`, so descendant content is not dimmed. |
| `light` | Sets `color-scheme: light` on the element. |
| `dark` | Sets `color-scheme: dark` on the element. |

`pale` and `muted` compose: `theme="green pale muted"` is a faded soft-green.

`light`/`dark` are the **scheme** modifiers. Because every bundle is `light-dark()`,
setting the scheme both picks which arm the theme's own colors resolve to **and**
re-tones descendant `light-dark()` tokens — ink ramps, eyebrows, tags, pills, form
controls, scrollbars. So a card that should carry a full dark treatment for its
content uses **`theme="black dark"`**; `theme="red dark"` makes a red surface whose
inner content also renders dark. Without a scheme modifier, the theme follows the
page's `color-scheme`.

## How a component opts in

The resolver turns `theme=` into private, **non-inheriting** vars — `--_theme-bg`,
`--_theme-c`. A component reads them as the fallback source for its own surface
tokens:

```css
:where(ui-widget[theme]) {
  --ui-widget-bg: var(--_theme-bg, /* default */);
  color:          var(--_theme-c, var(--color-text));
}
```

`color-scheme` is handled by the `light`/`dark` modifiers directly on the element —
the component does not need to touch it. Because `--_theme-*` are registered with
`inherits: false`, an un-themed child does not pick up an ancestor's theme.

## Create your own theme

Add a bundle to `tokens.css` (or any `:root` in your own CSS) and one resolver rule.
The modifiers (`pale`, `muted`, `light`, `dark`) and every opted-in component then
work with it for free — no per-component wiring.

```css
:root {
  --ui-theme-brand-bg: light-dark(#4f46e5, #6366f1);
  --ui-theme-brand-c:  light-dark(#ffffff, #eef2ff);
}

:where([theme~="brand"]) {
  --_theme-base-bg: var(--ui-theme-brand-bg);
  --_theme-base-c:  var(--ui-theme-brand-c);
}
```

Now `theme="brand"`, `theme="brand pale"`, `theme="brand muted"` and
`theme="brand dark"` all work on cards, chips, stickers, layouts — anywhere the axis
is consumed.

> Set the base pair on `--_theme-base-bg` / `--_theme-base-c` (not `--_theme-bg` /
> `--_theme-c`) so the `pale` and `muted` modifiers can derive from it. The resolver
> copies base → final and the modifiers transform final.

## Notes

- **Surfaces are colors; modifiers are transforms.** `light`/`dark` set the scheme,
  `pale`/`muted` transform the colors. No surface is named `light` or `dark`.
- **Semantic buttons are a separate axis.** Buttons use `.bg-red`, `.bg-accent`, …
  (see `utility.css`) with their own `light`/`outline`/`disabled` `data-variant`s.
  `theme=` is the surface axis; `.bg-*` is the semantic control axis.
- **Card sugar:** `<ui-card>` also accepts the legacy `variant="thm(dark|muted|
  subtle)"` spelling as a **deprecated** alias (`thm(dark)`→`black dark`,
  `thm(muted)`→`slate dark`, `thm(subtle)`→`gray`); prefer `theme=`.
- **Furniture routing:** inside a card, `media="chip(red)"` / `sticker(green)` /
  `tnt(blue)` etc. color the overlay furniture using the same bundles.
