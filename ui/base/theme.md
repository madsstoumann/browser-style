# Theme — the shared `theme=` axis

`theme=` is one **generic, cross-component color axis**. The same vocabulary works
on `<ui-card>`, `<ui-reveal>`, `<ui-content>`, `<ui-chip>`, `<ui-sticker>`,
`<lay-out>`/`<lay-out-group>`, on **any native element** via `data-theme=`, and on any
other component that opts in — so a layout can be `gray` while the cards inside it are
`black`, `red pale`, etc. Each element resolves its own theme independently; a themed
ancestor never leaks its theme onto un-themed descendants.

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

### `theme=` or `data-theme=`

Both spellings resolve identically — every rule in `theme.css` is a pair. Pick by
element type:

| Spelling | Use on | Why |
|---|---|---|
| `theme=` | custom elements (`<ui-card>`, `<ui-chip>`, `<lay-out>`…) | shortest, and a bare attribute is valid on a custom element |
| `data-theme=` | **native** elements (`<div>`, `<section>`, `<li>`, `<blockquote>`…) | a bare `theme` attribute is **invalid HTML** on a built-in element |

```html
<section data-theme="slate glass">…</section>
<blockquote data-theme="blue pale">…</blockquote>
```

Mixing both on one element is pointless but harmless — they set the same properties,
so the later rule simply wins.

> **Note on the wider `data-theme` convention.** Many sites (and Docusaurus) use
> `data-theme="light|dark"` on `<html>` for scheme switching. Those two words happen to
> line up with this axis' `light`/`dark` modifiers, so the effect is the same
> (`color-scheme`). Any other value from such a system (`data-theme="corporate"`) names
> no bundle here and is simply inert.

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
| `pale` | Tinted surface (`color-mix` of the color with the page surface, 80%), ink = the color **lightness-clamped for AA** (see [Hue as ink](#hue-as-ink)). Mirrors the light button variant — a pale/pastel version. |
| `muted` | Fades the theme colors via `color-mix(… transparent 50%)`. Reduces the **theme's** alpha only — it does **not** use element `opacity`, so descendant content is not dimmed. |
| `ink` | Applies the theme's paired **text colour**. Off by default — see [Ink](#ink). |
| `light` | Sets `color-scheme: light` on the element. |
| `dark` | Sets `color-scheme: dark` on the element. |
| `border` | Draws a solid border in the theme's **solid base colour** and makes the fill **transparent** (unless `pale` or `glass`). See [Border](#border) for sides + width. |
| `glass` | Turns the surface into a **material**: a translucent fill plus a backdrop blur + saturation. With no color token it is a neutral frost. See [Glass](#glass). |

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

### Hue as ink

`pale` and a transparent-fill `border` both put the **hue itself** on screen as text.
The raw hue does not clear WCAG AA that way — `theme="orange pale"` measured **1.76**
on its own pale plate in light mode, and `pale red` / `pale blue` / `pale accent` all
failed in dark mode. Both therefore read `--_theme-hue-ink`: the same hue with its
**OKLCH lightness clamped** to the readable side of the current `color-scheme`
(`min(l, 0.45)` light, `max(l, 0.80)` dark), so chroma and hue survive and only
lightness moves. Every bundle now measures 5.3–9.7 in both schemes.

The card system does the same thing one level up with `--color-accent-ink` — the
accent hue as text, clamped against the scheme — which is what a card eyebrow and the
`eb|tx|mt|hl(accent)` tones read. Without it, an eyebrow on a `theme="black dark"`
card measured **2.40**. The paired **plate** inks (`--ui-theme-*-c`, e.g. white on a
solid red chip) are a separate, still-open case — see `docs/plans/open-items.md` § 29.

## Border

`border` draws a solid border in the theme's **solid base colour** — always the pure
color, unaffected by `pale`/`muted` — and makes the **fill transparent** unless
`pale` re-establishes it. With a transparent fill the **ink also becomes the base
colour** (like the border, matching the chip/button outline look) — lightness-clamped
for AA, see [Hue as ink](#hue-as-ink). Sides and width are both spelled `border(<arg>)`.

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

## Glass

Every other modifier only transforms **colour**. `glass` is a **material**: it makes
the fill translucent and puts a `backdrop-filter` — blur plus a saturation boost —
behind it, so the surface picks up and softens whatever it sits over. It is the
frosted/liquid-glass look, and it works with any theme colour.

```html
<ui-card theme="green glass">…</ui-card>       <!-- pale-green glass -->
<ui-card theme="glass">…</ui-card>             <!-- colourless: neutral frost -->
<lay-out theme="slate glass dark">…</lay-out>  <!-- dark glass band -->
```

**With no colour token the fill is a neutral frost** — a barely-there `light-dark()`
white scrim (`--ui-theme-glass-bg`) that keeps text legible while the blur does the
work. Set that token to `#0000` for Apple's fully-clear material, where the panel's
only substance is the blur.

### Composition

| Spelling | Result |
|---|---|
| `green glass` | The colour at ~38% alpha over the blur |
| `green pale glass` | `pale` first, so a **soft** green glass — the gentlest form |
| `green muted glass` | `muted`'s 50% fade feeds the glass fade — a fainter pane |
| `green glass border` | Glass fill **kept**, plus the specular rim (see below) |
| `green pale glass ink` | Text in the **base colour**, like `pale` — never the paired ink |
| `slate glass dark` | Glass plus `color-scheme: dark` for the descendants |

`glass` sets the ink to the theme's **base colour**, not the bundle's paired ink: a
white-on-green pair is unreadable once the green is 38% transparent. As always the
ink only applies if you add [`ink`](#ink).

**Reach for `pale glass` whenever text is involved.** A bare `green glass` puts the
hue's own colour on a translucent version of that same hue, which over busy imagery
has almost no contrast; `pale` lightens the fill first, so the ink reads. This matters
most for **badges** — `<ui-chip>` / `<ui-sticker>` / `<ui-beacon>` / `<ui-marquee>`
always show their ink (see [Ink](#ink)) — so a coloured glass badge should be spelled
`theme="red pale glass"`, not `theme="red glass"`. Nothing enforces this; glass cannot
know what is behind it, so contrast stays the author's call.

**Tell the glass what it is over.** `pale` mixes toward `--color-surface`, the *page*
surface — but a glass panel usually sits on imagery, which is exactly where the page
surface is the wrong reference. A bright hero photo under a dark-mode page gives a
dark tint over a light backdrop and the ink falls apart. Pin the region with the
scheme modifiers (`theme="blue pale glass light"`, or `color-scheme` on the wrapper)
so the theme resolves against the backdrop the user actually sees.

### The specular rim

`glass` re-points the border colour at `--ui-theme-glass-edge` (a translucent white),
so the iOS-style bright hairline is just the existing [`border`](#border) token —
with all its sides, widths and styles:

```html
<div theme="green glass border">…</div>       <!-- glass + rim on all sides -->
<div theme="glass border(bs)">…</div>          <!-- frost + a bright top edge -->
<div theme="blue glass border border(md)">…</div>
```

Unlike a plain `border`, `glass border` **keeps its fill** — the rim is an addition,
not a swap to a transparent box.

### Tokens

| Token | Default | Purpose |
|---|---|---|
| `--ui-theme-glass-bg` | `light-dark(hsl(0 0% 100% / .18), hsl(0 0% 100% / .08))` | The **colourless** fill. `#0000` = fully clear. |
| `--ui-theme-glass-edge` | `light-dark(hsl(0 0% 100% / .55), hsl(0 0% 100% / .22))` | Border colour under `glass border`. |
| `--ui-theme-glass-fade` | `62%` | How much transparency a **coloured** glass gets. |
| `--ui-theme-glass-blur` | `var(--blur-md)` (12px) | Backdrop blur radius. |
| `--ui-theme-glass-saturate` | `180%` | Backdrop saturation boost. |

**Caveats:**
- **It needs something behind it.** Over a flat page surface a glass panel is just a
  tint — the blur has nothing to show. Put it over imagery, a gradient, or content.
- **The excluded elements get the material without the fill.** `theme.css` applies the
  *material* (the `backdrop-filter` and the edge colour) to everything, and the
  translucent **fill** to everything except the elements listed under
  [Universal paint](#universal-paint). On one of those — `<ui-play theme="glass">` — you
  get a blur with no scrim, which is usually not what you want; theme the frame or a
  wrapper instead.
- **Not with `bleed`.** `<lay-out [bleed]>` / `<lay-out-group [bleed]>` paint their
  band with a `border-image` conic-gradient, while `backdrop-filter` only filters the
  element's own box — so the bled edges will not be glass. Same caveat as `border`.
- **It creates a containing block.** A `backdrop-filter` makes the element a
  containing block for `position: fixed` descendants (and a stacking context). The
  `<ui-reveal>` `variant="exp pop"` popup escape hatch already nulls it on the
  ancestor `<lay-out>`, but any other fixed-positioned descendant of a glass box will
  resolve against that box instead of the viewport.
- **`<ui-reveal>` routes it.** Its painted, rounded box is the inner `<details>`, so
  the host re-publishes the material as `--ui-reveal-bdf` and blurs nothing itself —
  otherwise a square blur would show behind the rounded panel.
- **It costs.** Backdrop blur is per-element GPU work; a grid of glass cards is
  meaningfully more expensive than a grid of painted ones.
- **`prefers-reduced-transparency: reduce`** collapses the material — the fill goes
  opaque and the blur is dropped. An explicit `muted` is left alone: that is an
  author's colour choice, not the glass effect.

## Universal paint

The resolver **fills its own box by default**. Any element carrying the axis gets

```css
background-color: var(--_theme-bg, transparent);
color:            var(--_theme-c, var(--color-text));
```

so `<div data-theme="red">`, `<section data-theme="slate glass">` or a brand-new
component works with no wiring at all. This is why `glass` on an arbitrary element is
a real frosted pane and not just a bare backdrop blur.

Two things keep that from trampling existing components:

- **Components that paint themselves win.** The rule sits in `@layer bs-core`, and
  component CSS is `@layer bs-component`, declared later — so `<ui-card>`, `<ui-chip>`,
  `<ui-content>`, `<ui-sticker>`, `<ui-marquee>` and `<lay-out>` keep painting through
  their own tokens exactly as before. Nothing to change when a component opts in.
- **Elements whose host is not the surface are excluded**, by name, in `theme.css`:

  | Excluded | Why |
  |---|---|
  | `ui-save` · `ui-play` · `ui-lightbox` | icon-only controls — transparent by design |
  | `ui-beacon` | draws its dot in `::before`; only `variant="pill\|solid"` fills the host |
  | `ui-reveal` | routes its surface to the inner `<details>` (a square fill would show behind the rounded panel) |

  Add a component to that list **only** if it must not fill. A component that paints
  its own box needs no entry — the layer order already covers it.

A component with its own per-element meaning for the attribute opts out in **its own**
sheet, which also wins on layer order. `ui/timeline` does this: there `data-theme=`
colours one entry's **dot**, not the entry, so it resets the fill:

```css
& > li {
  &[data-theme] { background-color: transparent; color: inherit; }   /* ui-timeline.css */
  &[data-theme~="accent"] { --ui-timeline-dot: var(--ui-theme-accent-bg); }
}
```

## How a component opts in

Universal paint covers the common case; a component only needs its own wiring when the
surface is **not** the element carrying the attribute, or when it maps the theme onto a
token of its own.

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
The modifiers (`pale`, `muted`, `glass`, `light`, `dark`) and every opted-in component
then work with it for free — no per-component wiring.

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

Now `theme="brand"`, `theme="brand pale"`, `theme="brand muted"`, `theme="brand glass"`
and `theme="brand dark"` all work on cards, chips, stickers, layouts — anywhere the
axis is consumed.

> Set the base pair on `--_theme-base-bg` / `--_theme-base-c` (not `--_theme-bg` /
> `--_theme-c`) so the `pale`, `muted` and `glass` modifiers can derive from it. The
> resolver runs **base → pale → tone → final**: `pale` rewrites the pale stage,
> `muted` the tone stage, `glass` the final one — which is why they stack instead of
> overwriting each other.

## Notes

- **Surfaces are colors; modifiers are transforms.** `light`/`dark` set the scheme,
  `pale`/`muted` transform the colors, `glass` turns them into a material. No surface
  is named `light` or `dark`.
- **Semantic buttons are a separate axis.** Buttons use `.bg-red`, `.bg-accent`, …
  (see `utility.css`) with their own `light`/`outline`/`disabled` `data-variant`s.
  `theme=` is the surface axis; `.bg-*` is the semantic control axis.
- **Migrated from `thm()`:** the old card-only `variant="thm(dark|muted|subtle)"`
  spelling was **removed in v4** — use `theme=`: `thm(dark)`→`black dark`,
  `thm(muted)`→`slate dark`, `thm(subtle)`→`gray`.
- **Furniture routing:** inside a card, `media="chip(red)"` / `sticker(green)` /
  `tnt(blue)` etc. color the overlay furniture using the same bundles. There is no
  `chip(glass)` — `glass` is a `theme=` modifier only, so a glass badge is spelled
  `<ui-chip theme="red glass">`.
