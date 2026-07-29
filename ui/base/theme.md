# Theme — the shared `theme=` axis

`theme=` is one **generic, cross-component color axis**. The same vocabulary works
on `<ui-card>`, `<ui-reveal>`, `<ui-content>`, `<ui-chip>`, `<ui-sticker>`,
`<lay-out>`/`<lay-out-group>` and any other component that opts in — so a layout can
be `gray` while the cards inside it are `black`, `red pale`, etc. Each element
resolves its own `theme=` independently; a themed ancestor never leaks its theme onto
un-themed descendants.

That independence is what makes **two-sided** components work: a `<ui-reveal>` carries
the card's theme, and the back panel element carries its own — see
[Two sides, two themes](../reveal/readme.md#two-sides-two-themes).

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
| `ink` | Applies the theme's paired **text colour**. Off by default — see [Ink](#ink). |
| `light` | Sets `color-scheme: light` on the element. |
| `dark` | Sets `color-scheme: dark` on the element. |
| `border` | Draws a solid border in the theme's **solid base colour** and makes the fill **transparent** (unless `pale`). See [Border](#border) for sides + width. |

`pale` and `muted` compose: `theme="green pale muted"` is a faded soft-green.

`light`/`dark` are the **scheme** modifiers. Because every bundle is `light-dark()`,
setting the scheme both picks which arm the theme's own colors resolve to **and**
re-tones descendant `light-dark()` tokens — ink ramps, eyebrows, tags, pills, form
controls, scrollbars. So a card that should carry a full dark treatment for its
content uses **`theme="black dark"`**; `theme="red dark"` makes a red surface whose
inner content also renders dark. Without a scheme modifier, the theme follows the
page's `color-scheme`.

## Ink

A theme sets only the **background** by default — text keeps the component's own
colour. This is what you usually want: a tinted panel (`theme="green pale"`) should
have normal, readable body text, not dark-green text. Add **`ink`** to apply the
theme's paired text colour.

```html
<lay-out theme="green pale">…</lay-out>       <!-- pale-green bg, normal text -->
<lay-out theme="green pale ink">…</lay-out>   <!-- pale-green bg, dark-green text -->
<ui-card theme="red ink">…</ui-card>          <!-- red bg, white text -->
```

`ink` uniformly gates every text colour the theme would set — the paired ink, the
`muted`-faded ink, and the `border` outline's base-colour ink.

- **Dark surfaces don't need `ink`** — pair them with `dark` (`theme="black dark"`),
  and `color-scheme` re-tones `--color-text` to light. A dark surface **without**
  `dark` **or** `ink` (e.g. `theme="black"` on a card) would render dark text on a
  dark fill — add one of them.
- **Badges keep their ink.** `<ui-chip>` / `<ui-sticker>` (and `<ui-play>` /
  `<ui-save>`) are colored objects where the paired ink is essential, so they show it
  regardless of `ink` — a `theme="red"` chip is still white-on-red.

## Border

`border` draws a solid border in the theme's **solid base colour** — always the pure
color, unaffected by `pale`/`muted` — and makes the **fill transparent** unless
`pale` re-establishes it. With a transparent fill the **ink also becomes the base
colour** (like the border, matching the chip/button outline look). Sides and width
are both spelled `border(<arg>)`.

| Token | Meaning |
|---|---|
| `border` | all 4 sides, default width |
| `border(bs)` | block-start only |
| `border(be)` | block-end only |
| `border(is)` / `border(ie)` | inline-start / inline-end |
| `border(bk)` | block (top + bottom) |
| `border(in)` | inline (left + right) |
| `border(sm)` … `border(2xl)` | width — `sm`=`--border-width` (1px), `md`=`--border-width-thick` (2px), `lg`=`--border-width-heavy` (3px), `xl` (4px), `2xl` (6px). Default `--border-width`. |
| `border(dashed)` / `border(dotted)` / `border(double)` | style (default `solid`) |

**Any** `border` token turns the border on. Sides default to **all 4** unless a
specific side is named (then only those). Width and style tokens apply to whatever
sides are active — so `border(dashed)` alone is a dashed border on all sides, and
`border(bs) border(lg)` is a 3px block-start rule.

```html
<div theme="red border">…</div>                 <!-- transparent fill, red border, all sides -->
<div theme="red pale border">…</div>             <!-- pale-red fill, solid red border -->
<div theme="red border(bs) border(lg)">…</div>   <!-- red block-start rule, lg (3px) -->
<div theme="slate border border(md)">…</div>     <!-- slate box, md (2px) all sides -->
```

The border is applied **universally** by `theme.css` (any element with a `border`
token gets it — cards, `<lay-out>`, `<lay-out-group>`, plain elements), so there's
no per-component wiring.

**Caveats:**
- **Not with `bleed`.** `<lay-out [bleed]>` / `<lay-out-group [bleed]>` paint their
  band with a `border-image` trick that conflicts with a real border. Use `border`
  on non-bleed boxes / rules.
- **Chip / button own their border.** They sit in the `bs-component` layer (which
  wins over the `bs-core` theme rule) and have their own `outline`/`variant`; the
  theme `border` targets cards / layouts / groups / generic elements.
- **`<ui-reveal>` routes it.** The reveal's painted, rounded box is its inner
  `<details>`, not the host `theme.css` draws on — so `ui-reveal.css` gives the host
  the card radius grown by the border width (concentric curves) and drops the card
  shadow, which would otherwise hang under a now-transparent fill. Per-side
  `border(bs|be|is|ie|bk|in)` and the width/style words keep working unchanged.

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

**Containers publish, plates paint.** A component whose visible surface is an inner
element (`<ui-reveal>` paints its `<details>`; `<lay-out>` paints itself but feeds a
`--layout-bg` knob) must **re-publish** into its own *inheriting* token, because a
descendant rule cannot read the non-inheriting `--_theme-*` off an ancestor. A leaf
plate (`<ui-content>`, `<ui-chip>`) simply paints `background: var(--_theme-bg)` on
itself. Both shapes are in the repo:

```css
:where(ui-reveal[theme]) { --ui-reveal-bg: var(--_theme-bg, var(--color-surface)); }  /* publish */
:where(ui-content)[theme] { background: var(--_theme-bg, transparent); }              /* paint */
```

**Pick the ink fallback by role.** Surfaces (card, reveal, content, layout) fall back
to `var(--color-text)` so the `light`/`dark` modifiers re-tone them through
`color-scheme`; badges (chip, sticker, beacon, marquee) fall back to
`var(--_theme-ink)` so their curated pair always shows. See [Ink](#ink).

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
- **Migrated from `thm()`:** the old card-only `variant="thm(dark|muted|subtle)"`
  spelling was **removed in v4** — use `theme=`: `thm(dark)`→`black dark`,
  `thm(muted)`→`slate dark`, `thm(subtle)`→`gray`.
- **Furniture routing:** inside a card, `media="chip(red)"` / `sticker(green)` /
  `tnt(blue)` etc. color the overlay furniture using the same bundles.
