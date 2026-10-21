# Theme — the shared `theme=` axis

`theme=` is one **generic, cross-component color axis**. The same vocabulary works
on `<ui-card>`, `<ui-reveal>`, `<ui-content>`, `<ui-chip>`, `<ui-sticker>`,
`<lay-out>`/`<lay-out-group>`, on **any native element** via `data-theme=`, and on any
other component that opts in — so a layout can be `gray-200` while the cards inside it are
`gray-800`, `red-100`, etc. Each element resolves its own theme independently; a themed
ancestor never leaks its theme onto un-themed descendants.

That independence is what makes **two-sided** components work: a `<ui-reveal>` carries
the card's theme, and the back panel element carries its own — see
[Two sides, two themes](../reveal/readme.md#two-sides-two-themes).

The colours are the [palette](#palette), generated from `palette.json` into `tokens.css`;
the resolver and looks live in `theme.css`. `@browser.style/base` is a required peer
dependency, so both are always available.

## Syntax

`theme=` is a **space-separated token list**: exactly one **colour** token (`<hue>-<step>`,
`white` or `black`), plus any number of **look** tokens.

```html
<ui-card  theme="gray-800 dark">…</ui-card>
<ui-chip  theme="red-700">new</ui-chip>
<ui-chip  theme="red-200">soft</ui-chip>
<ui-chip  theme="red-700 outline">frame</ui-chip>
<lay-out  theme="gray-200" bleed>…</lay-out>
```

### `theme=` or `data-theme=`

Both spellings resolve identically — every rule in `theme.css` is a pair. Pick by
element type:

| Spelling | Use on | Why |
|---|---|---|
| `theme=` | custom elements (`<ui-card>`, `<ui-chip>`, `<lay-out>`…) | shortest, and a bare attribute is valid on a custom element |
| `data-theme=` | **native** elements (`<div>`, `<section>`, `<li>`, `<blockquote>`…) | a bare `theme` attribute is **invalid HTML** on a built-in element |

```html
<section data-theme="gray-700 glass">…</section>
<blockquote data-theme="blue-100">…</blockquote>
```

A native node that also needs padding and corners adds `data-box` — see [Box](#box).

Mixing both on one element is pointless but harmless — they set the same properties,
so the later rule simply wins.

> **Note on the wider `data-theme` convention.** Many sites (and Docusaurus) use
> `data-theme="light|dark"` on `<html>` for scheme switching. Those two words happen to
> line up with this axis' `light`/`dark` looks, so the effect is the same
> (`color-scheme`). Any other value from such a system (`data-theme="corporate"`) names
> no colour here and is simply inert.

## Palette

A colour is **`<hue>-<step>`** — Tailwind's names and steps. Ten hues, eleven steps each,
with Tailwind CSS v4.1.11's `oklch()` values (MIT). The values live in
[`palette.json`](palette.json).

| Hue | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `gray` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `red` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `orange` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `yellow` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `green` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `teal` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `cyan` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `blue` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `violet` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `pink` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `accent` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |

`theme="green-300"`, `theme="gray-950"`, `theme="accent-700"`. Two colours have no steps:

| Colour | Value | Text on it |
|---|---|---|
| `white` | `#fff` | `gray-950` |
| `black` | `#000` | `#fff` |

Both are the same on light and dark pages.

**`accent` is an alias hue.** It has the same eleven steps and points at `blue` by default
(`--color-accent-300: var(--color-blue-300)`), so a rebrand is one change: point the steps
at another hue.

**Hue names** are one lowercase word, letters only (`a`–`z`), never a step number — the
resolver splits `hue-step` at the dash. A hue you add follows the same rule.

### Variables

All in `tokens.css`, in one generated block.

| Variable | Value |
|---|---|
| `--color-<hue>-<step>` | the step, as a `light-dark()` pair: the step on a light page, its [mirror](#dark-pages) on a dark one |
| `--color-<hue>-<step>-text` | the [text colour](#text-colours) for that step, mirrored the same way |
| `--color-accent-<step>` · `--color-accent-<step>-text` | blue's, by `var()` |
| `--color-white` · `--color-white-text` | `#fff` · the value of `gray-950` |
| `--color-black` · `--color-black-text` | `#000` · `#fff` |

### Jobs

Components keep reading the job variables; each points at a step. Re-point one to restyle
every component that uses it:

| Variable | Points at |
|---|---|
| `--color-error` | `--color-red-700` |
| `--color-warning` | `--color-orange-400` |
| `--color-success` | `--color-green-800` |
| `--color-info` | `--color-blue-900` |
| `--color-accent` | `--color-accent-700` |
| `--color-accent-text` | `--color-accent-700-text` |

`--color-accent-dark` is `--color-accent-800`; `--color-accent-ink` (the accent as text) is derived
from `--color-accent` — see [`tokens.css`](tokens.css).

```css
:root { --color-error: var(--color-red-600); }
```

## Dark pages

On a dark page the steps **mirror**, so a pick still fits without Tailwind's `dark:`
variants. Each variable is a `light-dark()` pair of a step and its mirror:

| Light page shows | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Dark page shows | 950 | 900 | 800 | 700 | 600 | 500 | 400 | 300 | 200 | 100 | 50 |

`theme="green-100"` is a light green plate on a light page and a dark green one on a dark
page; its [text colour](#text-colours) mirrors with it. `white` and `black` stay.

The `light` / `dark` looks set `color-scheme` on the element, which picks the arm
the element's own colours resolve to **and** re-tones every `light-dark()` token below it.
So `theme="gray-200 light"` is the light plate on any page, with light-page content on it.

A plain colour in place of the `light-dark()` pair (when you [change a step](#change-or-add-a-hue))
is the same on both.

## Text colours

Every step has a text colour, `--color-<hue>-<step>-text`, picked for contrast:

1. the hue's own `950`, if its WCAG 2 contrast with the step is at least 4.5;
2. otherwise black or white, whichever has the higher contrast.

With the default palette every step of the ten hues reaches 4.5:1 (the lowest is
`pink-600`, 4.6). `node scripts/build-palette.js` prints the contrast report for the
current values, so a changed step shows what it did.

The text colour is what `ink` applies, and what chips, stickers, beacons, marquees and
the other [furniture](#furniture-and-tint) show on their plate.

## Change or add a hue

**Edit `palette.json`, run the build.** `palette.json` is the one source. From the repo root:

```bash
node scripts/build-palette.js
```

The build rewrites the generated blocks (between `/* palette:start */` and
`/* palette:end */`) in `tokens.css`, `theme.css`, `tint.css` and the furniture sheets, writes
[`palette.rules.json`](palette.rules.json), and prints the contrast report. Running it twice
changes nothing.

| `palette.json` key | What it holds |
|---|---|
| `hues` | per hue, each step (`50` … `950`) → an `oklch()` value. Add a hue here: one lowercase word, eleven steps |
| `accent` | the hue `accent` points at (`blue` by default) |
| `fixed` | `white` and `black`: their value and their text colour |
| `text` | the [text rule](#text-colours): `prefer` (the step used as text, `950`) and `min` (the contrast it must reach, `4.5`) |
| `targets` | the files the build rewrites |

**Or in CSS.** Change a step of an existing hue by setting its two variables — the rules for it
already exist:

```css
:root {
  --color-green-300: light-dark(oklch(85% 0.17 150), oklch(50% 0.15 150));  /* a light page, then its mirror */
  --color-green-300-text: light-dark(#000, #fff);
}
```

Re-point `accent` the same way, step by step: `--color-accent-300: var(--color-violet-300)` and
`--color-accent-300-text: var(--color-violet-300-text)`.

**Add a hue in CSS** by setting `--color-<hue>-<step>` and `--color-<hue>-<step>-text` for the
eleven steps, **and** the rules that make `brand-300` resolve in `theme=`, `tint=` and the
furniture tokens. `palette.rules.json` holds those rules as flat templates — `id`, `per`
(`hue`, `colour`, `step` or `word`), `layer`, `selector`, `declarations`, with `{name}` (and, in
the variables rule, `{value}`, `{mirror}`, `{text}`, `{mirror-text}`) as placeholders. The rules
marked `emitForAddedHue` are the ones a new hue needs: its variables, the `theme=` hue rule, the
`tint=` and `tint-end=` hue rules, and one furniture rule per colour for chip, sticker, beacon,
marquee, ai, save, lightbox, play and `tnt`. The step rules ship once with browser-style. A CMS
writes the same rules for a hue a designer adds.

```css
:root {
  --color-brand-50: light-dark(…, …);
  --color-brand-50-text: light-dark(…, …);
  /* …100 to 950 */
}
```

The hue name is one lowercase word: `brand`, not `brand-red` or `blue2`.

## Looks

Looks transform a colour. Add any number.

| Look | Effect |
|---|---|
| `ink` | Applies the colour's paired **text colour**. Off by default — see [Ink](#ink). |
| `glass` | Turns the surface into a **material**: a translucent fill plus a backdrop blur + saturation. With no colour token it is a neutral frost. See [Glass](#glass). |
| `border` | Draws a solid border and **keeps the fill**. See [Border and outline](#border-and-outline) for sides + width. |
| `outline` | Clears the fill; the border is on in the pure colour, and the ink is the colour itself. See [Border and outline](#border-and-outline). |
| `light` | Sets `color-scheme: light` on the element. |
| `dark` | Sets `color-scheme: dark` on the element. |

`light`/`dark` are the **scheme** looks. Because every colour is a `light-dark()` pair,
setting the scheme both picks which arm the theme's own colours resolve to **and**
re-tones descendant `light-dark()` tokens — ink ramps, eyebrows, tags, pills, form
controls, scrollbars. So a card that should carry a full dark treatment for its
content uses **`theme="gray-800 dark"`**; `theme="red-700 dark"` makes a red surface whose
inner content also renders dark. Without a scheme look, the theme follows the
page's `color-scheme`.

## Ink

A theme sets only the **background** by default — text keeps the component's own
colour. This is what you usually want: a tinted panel (`theme="green-100"`) should
have normal, readable body text. Add **`ink`** to apply the colour's paired text colour.

```html
<lay-out theme="green-100">…</lay-out>        <!-- light green bg, normal text -->
<lay-out theme="green-100 ink">…</lay-out>    <!-- light green bg, green-100's text colour -->
<ui-card theme="red-700 ink">…</ui-card>      <!-- red-700 bg, red-700's text colour -->
```

`ink` uniformly gates every text colour the theme would set — the paired text colour, the
[`outline`](#border-and-outline) ink and the [`glass`](#glass) ink.

- **Dark surfaces don't need `ink`** — pair them with `dark` (`theme="gray-800 dark"`),
  and `color-scheme` re-tones `--color-text` to light. A dark surface **without**
  `dark` **or** `ink` (e.g. `theme="gray-800"` on a card) would render dark text on a
  dark fill — add one of them.
- **Badges keep their ink.** `<ui-chip>` / `<ui-sticker>` (and `<ui-play>` /
  `<ui-save>`) are colored objects where the paired text colour is essential, so they show
  it regardless of `ink` — a `theme="red-700"` chip carries `red-700`'s text colour.

### Hue as ink

`outline` and `glass` put the **colour itself** on screen as text, and `border` frames its
fill with it. A raw step does not always clear WCAG AA on the page (or on its own light fill),
so all three read `--_theme-hue-ink`: the same colour with its **OKLCH lightness clamped** to
the readable side of the current `color-scheme` (`min(l, 0.45)` light, `max(l, 0.80)` dark), so
chroma and hue survive and only lightness moves.

The card system does the same thing one level up with `--color-accent-ink` — the
accent as text, clamped against the scheme — which is what a card eyebrow and the
`eb|tx|mt|hl(accent)` tones read.

## Border and outline

`border` draws a solid border and **keeps the fill**. A kept fill is framed in the colour's
ink (`--_theme-hue-ink`, see [Hue as ink](#hue-as-ink)), because the pure colour would vanish
into its own fill; under `glass` the frame is the glass edge. `outline` is the same border with
the fill **cleared**: the frame is the pure colour and the ink becomes the colour itself
(lightness-clamped for AA) — the chip/button outline look. Sides and width are spelled
`border(<arg>)` on both.

| Token | Meaning |
|---|---|
| `border` | all 4 sides, default width, fill kept |
| `outline` | all 4 sides, default width, fill cleared |
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
`border(bs) border(lg)` is a 3px block-start rule. `border(…)` with `outline` sets the same
width and sides and clears the fill.

```html
<div theme="red-700 outline">…</div>                         <!-- transparent fill, red-700 border, all sides -->
<div theme="red-100 border">…</div>                          <!-- red-100 fill, framed in the colour's ink -->
<div theme="red-700 outline border(bs) border(lg)">…</div>   <!-- red-700 block-start rule, lg (3px) -->
<div theme="gray-700 outline border(md)">…</div>             <!-- gray-700 outline, md (2px) all sides -->
```

The border is applied **universally** by `theme.css` (any element with a `border` or
`outline` token gets it — cards, `<lay-out>`, `<lay-out-group>`, plain elements), so there's
no per-component wiring.

**Caveats:**
- **Not with `bleed`.** `<lay-out [bleed]>` / `<lay-out-group [bleed]>` paint their
  band with a `border-image` trick that conflicts with a real border. Use `border`
  and `outline` on non-bleed boxes / rules.
- **Chip / button own their border.** They sit in the `bs-component` layer (which
  wins over the `bs-core` theme rule) and have their own `variant="outline"`; the
  theme `border` / `outline` target cards / layouts / groups / generic elements.
- **`<ui-reveal>` routes it.** The reveal's painted, rounded box is its inner
  `<details>`, not the host `theme.css` draws on — so `ui-reveal.css` gives the host
  the card radius grown by the border width (concentric curves) and drops the card
  shadow, which would otherwise hang under a cleared fill. Per-side
  `border(bs|be|is|ie|bk|in)` and the width/style words keep working unchanged. The arm
  matches `[theme*="border"]` and `[theme~="outline"]`.

## Glass

Every other look only transforms **colour**. `glass` is a **material**: it makes
the fill translucent and puts a `backdrop-filter` — blur plus a saturation boost —
behind it, so the surface picks up and softens whatever it sits over. It is the
frosted/liquid-glass look, and it works with any colour.

```html
<ui-card theme="green-300 glass">…</ui-card>       <!-- green glass -->
<ui-card theme="glass">…</ui-card>                 <!-- colourless: neutral frost -->
<lay-out theme="gray-700 glass dark">…</lay-out>   <!-- dark glass band -->
```

**With no colour token the fill is a neutral frost** — a barely-there `light-dark()`
white scrim (`--ui-theme-glass-bg`) that keeps text legible while the blur does the
work. Set that token to `#0000` for Apple's fully-clear material, where the panel's
only substance is the blur.

### Composition

| Spelling | Result |
|---|---|
| `green-300 glass` | The step at ~38% alpha over the blur |
| `green-100 glass` | A light step — a **soft** green glass, the gentlest form; its ink is a dark green |
| `green-300 glass border` | Glass fill **kept**, plus the specular rim (see below) |
| `gray-700 glass dark` | Glass plus `color-scheme: dark` for the descendants |

`glass` sets the ink to the **colour itself** (`--_theme-hue-ink`, see [Hue as ink](#hue-as-ink)),
not the step's paired text colour: a text colour chosen for an opaque fill is unreadable once the
fill is 38% transparent. As always the ink only applies if you add [`ink`](#ink).

**Reach for a light step when text is involved.** `green-300 glass` puts the colour's own ink on
a translucent version of that same colour, which over busy imagery has little contrast; a light
step (`green-100 glass`) lightens the fill first, so the ink reads. This matters most for
**badges** — `<ui-chip>` / `<ui-sticker>` / `<ui-beacon>` / `<ui-marquee>` always show their ink
(see [Ink](#ink)) — so a coloured glass badge is best spelled `theme="red-100 glass"`. Nothing
enforces this; glass cannot know what is behind it, so contrast stays the author's call.

**Tell the glass what it is over.** The page surface is the wrong reference for a
panel that sits on imagery: a bright hero photo under a dark-mode page gives a dark
tint over a light backdrop and the ink falls apart. Pin the region with the scheme
looks (`theme="blue-100 glass light"`, or `color-scheme` on the wrapper) so the theme
resolves against the backdrop the user actually sees.

### The specular rim

`glass` re-points the border colour at `--ui-theme-glass-edge` (a translucent white),
so the iOS-style bright hairline is just the existing [`border`](#border-and-outline) token —
with all its sides, widths and styles:

```html
<div theme="green-300 glass border">…</div>       <!-- glass + rim on all sides -->
<div theme="glass border(bs)">…</div>              <!-- frost + a bright top edge -->
<div theme="blue-900 glass border border(md)">…</div>
```

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
  opaque and the blur is dropped.

## Universal paint

The resolver **fills its own box by default**. Any element carrying the axis gets

```css
background-color: var(--_theme-bg, transparent);
color:            var(--_theme-c, var(--color-text));
```

so `<div data-theme="red-700">`, `<section data-theme="gray-700 glass">` or a brand-new
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
colours one entry's **dot**, not the entry, so it resets the fill and reads the colour from
`--_theme-base-bg` — no rule per colour:

```css
& > li {
  &[data-theme] { background-color: transparent; color: inherit; }   /* ui-timeline.css */
  &[data-theme] { --ui-timeline-dot: var(--_theme-base-bg, var(--ui-timeline-rail)); }
}
```

## Box

Universal paint gives a native node its **colour**; `data-box` gives it its **geometry** —
padding and rounded corners — so the two together make a plate out of any element:

```html
<div data-theme="gray-200 light" data-box>…</div>         <!-- light-gray plate, 16px inset, 6px corners -->
<div data-theme="gray-200 light" data-box="brd">…</div>   <!-- + a theme-matched hairline -->
<div data-theme="gray-700 dark ink" data-box style="--ui-box-p: var(--spacing-md)">…</div>
```

Two rules in `theme.css`, reading four tokens:

| Token | Default | Purpose |
|---|---|---|
| `--ui-box-p` | `var(--spacing-md)` (1rem) | Padding, all sides. `0` for a flush plate. |
| `--ui-box-radius` | `var(--radius-md)` (0.375rem) | Corner radius. `0` for square corners; any `--radius-*` token for more. |
| `--ui-box-border-width` | `var(--border-width)` (1px) | `brd` only — the hairline's width. |
| `--ui-box-border-color` | the theme's border colour, 25% toward its ink | `brd` only — see below. |

Set them on the element or on any ancestor — they inherit like every custom property.

The box also **publishes** one token for its children: `--ui-box-inner-radius`, the
concentric radius a nested plate needs — `max(0px, outer − padding)`. A rounded child that
sits flush with the padding reads it and its corners follow the box's curve instead of
wobbling against it; with the defaults (0.375rem corner, 1rem inset) it is `0` — a sharp
inner corner is the geometrically right answer once the inset exceeds the radius.

```html
<div data-theme="gray-200 light" data-box style="--ui-box-radius: var(--radius-2xl)">
  <img style="border-radius: var(--ui-box-inner-radius)" …>   <!-- 1rem − 1rem = 0 → grow the radius or shrink --ui-box-p -->
</div>
```

Why arithmetic and not `overflow-clip-margin: content-box` (the clip-margin trick): measured
in Chrome 152, a child filling the content box keeps square corners — the content-box clip
is not rounded — and Safari has no `overflow-clip-margin` at all. Two engines, zero wins.

**`brd` — the hairline.** `data-box="brd"` draws a 1px solid border. The theme axis already
resolves a matching border colour (`--_theme-border`, the pure theme colour), but on a *filled*
plate that colour **is** the fill: a `gray-200 light` plate and its `--_theme-border` are the
same colour, so used raw the line would vanish. `brd` therefore mixes it 25% toward the theme's
clamped ink (`--_theme-hue-ink`) — still in the hue, scheme-aware, and visible on solid,
light-step and glass fills alike. Set `--ui-box-border-color: var(--_theme-border)` for the pure colour when
the fill is transparent. An unthemed `data-box="brd"` falls back to the page
hairline, `--color-border`. Pick **`brd` or the theme's `border` / `outline`**, not both —
`outline` empties the fill by design. The line is decorative: the 3:1 boundary rule applies
to controls and meaningful edges, not to a plate's hairline.

**One spelling, on purpose.** Every `theme=` rule is a `theme=`/`data-theme=` pair because a
bare `theme` attribute is invalid on a built-in element. `data-*` is valid on *every*
element, so `data-box` needs no `[box]` twin — and custom elements that want a plate already
have their own geometry tokens (`content="pad() rds()"`, `variant="rds()"`).

**Inert on components that own their geometry.** `<ui-content>` sets its four padding
longhands and `--ui-content-radius`, `<ui-card>` its radius, `<lay-out>` both — all from
`@layer bs-component` / `layout.*`, declared after `bs-core`, so they win. Same layer
argument as [Universal paint](#universal-paint): `data-box` is for the native nodes
*inside* those components, not the components themselves.

**A box without a theme is invisible.** The padding still takes space, but nothing paints
it — pair `data-box` with `data-theme` (or any background of your own).

**Pin the plate's scheme.** Steps [mirror](#dark-pages) on a dark page, so a `gray-200`
plate turns dark there and its contents re-tone with the page — plate and contents agree.
To keep a plate light (or dark) whatever the page does, add `light` (or `dark`): the plate's
own colour and its descendants' `light-dark()` tokens then follow the same scheme, and the
`brd` hairline goes with it (its tint follows the same clamped ink).

Live example: the Organization card's offices in `ui/card/demo/schema.html` —
`<div data-part="office" data-theme="gray-200 light" data-box="brd">` — emitted by the renderer from
preset `parts.office: "box brd"` + `parts.officeTheme: "gray-200 light"`
([card.md § Preset model](../card/docs/card.md)).

## How a component opts in

Universal paint covers the common case; a component only needs its own wiring when the
surface is **not** the element carrying the attribute, or when it maps the theme onto a
token of its own.

The resolver turns `theme=` into private, **non-inheriting** vars — `--_theme-bg`,
`--_theme-c`, fed by the base pair `--_theme-base-bg` / `--_theme-base-c` that the
colour's rule sets. A component reads them as the fallback source for its own surface
tokens:

```css
:where(ui-widget[theme]) {
  --ui-widget-bg: var(--_theme-bg, /* default */);
  color:          var(--_theme-c, var(--color-text));
}
```

`color-scheme` is handled by the `light`/`dark` looks directly on the element —
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
to `var(--color-text)` so the `light`/`dark` looks re-tone them through
`color-scheme`; badges (chip, sticker, beacon, marquee) fall back to
`var(--_theme-ink)` so the step's text colour always shows. See [Ink](#ink).

## Furniture and tint

The same colour names work outside `theme=`:

| Where | Spelling |
|---|---|
| `theme=` / `data-theme=` | `theme="green-300"` |
| card furniture, in `media=` | `chip(green-300)` · `sticker(red-700)` · `beacon(…)` · `marquee(…)` · `ai(…)` · `save(…)` · `play(…)` · `lightbox(…)` |
| media tint, in `media=` | `tnt(blue-500)` |
| `tint=` / `tint-end=` | `tint="green-300"`, beside a literal colour such as `tint="#c00"` |

Furniture tokens share one `media=` attribute, so CSS cannot read hue and step apart: each
component carries one generated rule per colour — the ten hues and `accent` at eleven steps
(121), plus `white` and `black`. A hue you add gets its rules from `palette.rules.json` (see
[Change or add a hue](#change-or-add-a-hue)). There is no `chip(glass)`: `glass` is a look,
so a glass badge is spelled `<ui-chip theme="red-100 glass">`.

## Notes

- **Surfaces are colors; looks are transforms.** `light`/`dark` set the scheme,
  `border`/`outline` frame or clear, `glass` turns the colour into a material. No colour
  is named `light` or `dark`.
- **Semantic buttons are a separate axis.** Buttons use `.bg-red`, `.bg-accent`, …
  (see `utility.css`) with their own `light`/`outline`/`disabled` `data-variant`s.
  `theme=` is the surface axis; `.bg-*` is the semantic control axis.
- **Migrated from `thm()`:** the old card-only `variant="thm(dark|muted|subtle)"`
  spelling was **removed in v4** — use `theme=`: `thm(dark)`→`gray-800 dark`,
  `thm(muted)`→`gray-700 dark`, `thm(subtle)`→`gray-200`.

## From the nine names

The nine names `red orange green blue accent white gray slate black`, and the `pale` and
`muted` modifiers, were **removed**: a step replaces them, and see-through is `glass`. The
nearest step of the same hue:

| Was | Solid | `pale X` | `muted X` |
|---|---|---|---|
| `red` | `red-700` | `red-200` | `red-300` |
| `orange` | `orange-400` | `orange-100` | `orange-200` |
| `green` | `green-800` | `green-100` | `green-300` |
| `blue` | `blue-900` | `blue-100` | `blue-300` |
| `accent` | `accent-700` | `accent-200` | `accent-300` |
| `white` | `white` | `white` | `white` |
| `gray` | `gray-200` | `gray-50` | `gray-100` |
| `slate` | `gray-700` | `gray-300` | `gray-400` |
| `black` | `gray-800` | `gray-300` | `gray-400` |

`border` used to clear the fill unless `pale` or `glass` was on; now `border` keeps it and
`outline` clears it. `red border` → `red-700 outline` · `pale red border` → `red-200 border` ·
`red glass border` → `red-700 glass border`. The `--ui-theme-<name>-bg` / `-c` variables
are gone (`--ui-theme-glass-*` stays). The same table rewrites the furniture tokens
(`chip(red)` → `chip(red-700)`).
