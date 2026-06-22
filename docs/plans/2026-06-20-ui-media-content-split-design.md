# ui-media / ui-content split — design

> Date: 2026-06-20 · Branch: `v4` · Author: Mads Stoumann (with Claude)
> Status: approved design, ready to implement

Splits the `ui-card` monolith into two reusable primitives — `<ui-media>` and
`<ui-content>` — that work **standalone or nested inside any host component**.
`<ui-card>` and `<ui-reveal>` become thin *composition* layers that orchestrate
the primitives via layout. The same pattern extends to future components.

---

## 1. The core mechanism — inherited custom properties

Today everything couples through **descendant selectors** keyed off one giant
`variant` string (`:where([variant]) ui-media { … }`, `:where([variant*="ar("])
ui-media { … }`). That is why `<ui-media>` cannot live standalone (it is inert
without a `[variant]` ancestor) and why the responsive tiers re-list every token
rule inside `@container` (~130 lines of duplication).

**Fix:** every primitive reads its *own* inherited custom-property namespace; a
parse layer maps attribute tokens onto those props; the layout host writes into
the same props. No descendant-selector coupling.

```css
/* media.css — primitive reads its own namespace */
:where(ui-media) { aspect-ratio: var(--ui-media-ar, auto); object-fit: var(--ui-media-fit, cover); }
/* parse layer — matches the element OR an ancestor */
:where([media*="asr(16/9)"]) { --ui-media-ar: 16/9; }
```

Because custom properties inherit, **one rule set serves both cases**:

- `<ui-media media="asr(16/9)">` → matches itself → reads its own prop.
- `<ui-card media="asr(16/9)"><ui-media>` → card matches → prop inherits down.

The "modifiers on the parent" requirement falls out for free: same attribute
name, same parse rules, inheritance does the wiring.

---

## 2. Naming convention — the token DSL

The attribute DSL (`media=`/`content=`/`variant=` token-strings) is a **separate
layer** from custom-property naming. `emmet.md` governs *custom-property* names
(the readable *Token* column) and is independent of how the DSL spells its
tokens. The DSL has one rule:

> **Every modifier is a 3-letter code, verified collision-free against
> `emmet.md`'s Abbr column. Slot/part names stay readable nouns** (`eyebrow`,
> `headline`, `summary`, …) — exactly as `emmet.md` already requires for
> sub-elements. (Media overlays are readable custom elements — `<ui-chip>` etc.)

Uniform 3-letter codes give the attribute strings a steady rhythm and one
trivial rule to remember. This trades away Emmet *muscle-memory* for `ar`/`op`/
`of`/`p` — but that only ever applied to custom-property names (still
`emmet.md`-governed), not this DSL. That answers "why `asr` but `badge`": `asr`
is a modifier (3-letter code); `badge` is a sub-element slot (readable noun).

### Token reference — grouped by attribute

Every modifier is a 3-letter code (collision audit below). Arguments and bare
flags per owning attribute:

#### `media=` — the media element + `img`/`video` → `--ui-media-*`

| Token | Args | Controls |
|-------|------|----------|
| `asr()` | `1/1 6/7 3/4 4/3 3/2 2/3 16/9 21/9` (or any via `style`) | aspect-ratio |
| `obp()` | `tl tc tr cl cc cr bl bc br` | object-position (9-grid) |
| `obf()` | `cover contain fill none` | object-fit |
| `flp()` | `h v hv` | flip / mirror image |
| `hov()` | `zoom pan track` | hover effect (image only) |
| `scm()` | *(bare, or `tl … br`)* | scrim — auto-matches `ovr()`, or explicit direction |
| `nav()` | *(bare, or `dots arrows none`)* | carousel — bare = dots+arrows; the token itself triggers the scroller |
| `chip()` `sticker()` `save()` | `ts … be` *(position)* / `red orange green blue accent dark light subtle` *(sub-theme)* | place + theme the overlay element |

Overlay furniture: `<ui-chip>` (reused `ui/chip` component), `<ui-sticker>`,
`<ui-save>` — configured **entirely from the parent** `media=`; the elements carry
only their text. Two per-element axes, atomic `el(value)` tokens (position and theme
vocabs are disjoint, so they don't clash):
- **Position** → `chip(ts)` … `sticker(cc)`. `<ui-media>` is a 3×3 positioning grid;
  the geometry is defined **once** and an element just picks an area (RTL-aware).
  Default area by role needs no token. See §4.
- **Theme** → `chip(red) sticker(green)`. Sub-theme keys: `red orange green blue ·
  accent dark light subtle` (hues + neutrals; decorative, not status). Routes into the
  element's own tokens (`--ui-chip-bg/-c`, …). The *same* sub-themes are also a
  self-service attribute on the elements — `<ui-chip theme="red">` — sharing one
  `:root --ui-theme-*` palette (see §4 "Sub-themes / the `theme=` axis").

#### `content=` — content column typography & spacing → `--ui-content-*`

| Token | Args | Controls |
|-------|------|----------|
| `scl()` | `sm md lg xl` | type-scale step (body + headline) |
| `pad()` | `none xs sm md lg xl 2xl` | content padding |
| `gap()` | `none xs sm md lg` | row gap |
| `scr` | *(flag)* | scrollable content + `ui-scroll-fade` mask |

#### `variant=` — composition + host cosmetics → `--ui-card-*`

| Token | Args | Controls |
|-------|------|----------|
| `col` `row` | *(flags)* | arrangement: stacked (default) / side-by-side |
| `col-r` `row-r` | *(flags)* | reversed (content first) |
| `spl()` | `1/1 1/2 2/1 1/3 3/1` | media : content split ratio (row layouts) |
| `ovr()` | `tl … br` | overlay content over media + place it |
| `vis()` | `media content` | show only one part |
| `rds()` | `none sm md lg xl 2xl full pill` (+ `-sq`) | corner radius (+ squircle) |
| `thm()` | `dark brand subtle` | theme |

`rds()` replaces the old `sq()`: it sets real `border-radius` from the global
scale; a `-sq` suffix on the finite sizes makes the corners superelliptical
(`rds(lg-sq)`). Size is a shared prefix, so one rule set serves both shapes:

```css
:where([variant*="rds(lg"]) { --ui-card-radius: var(--radius-lg); }   /* round AND squircle */
:where([variant*="-sq)"])   { corner-shape: superellipse(var(--ui-card-squircle-exp, 1.8)); }
```

### Slot/part names — readable (never abbreviated)

**Content** parts use readable `data-part` values: `eyebrow`, `headline`,
`subheadline`, `summary`, `meta`, `caption`, `byline`, `tags`, `actions`, `footer`
(they need real semantic tags — `h2`, `address`, … — so they stay `data-part`, not
custom elements).

**Media overlay** furniture is **custom elements** instead — `<ui-chip>` (the
reused `ui/chip` component), `<ui-sticker>`, `<ui-save>` — positioned and themed from
parent `media=` tokens (`chip(ts)`, `sticker(cc)`, `chip(dark)`) on a 3×3 grid
(RTL-aware, geometry defined once). They split into **markers** (non-interactive:
`<ui-chip>`, `<ui-sticker>`) and one **control** (interactive, card-only:
`<ui-save>`) — see §4. Argument vocabularies (`media`/`content`, `dots`/`arrows`)
stay readable too.

### Collision audit vs `emmet.md`

Each code verified absent from Emmet's Abbr column (the property it *would* have
collided with in parens):

`asr` · `obp` · `obf` · `pad` (`p`) · `gap` (= Emmet) · `flp` (`fl`=float) ·
`scl` (`sca`=scale) · `spl` (`sp`=scroll-padding) · `ovr` (`ov`=overflow /
`ovl`=overlay) · `scm` (`sc`=scrollbar-color) · `thm` · `hov` · `nav` ·
`vis` (`v`=visibility) · `rds` · `scr` · `col` · `row`.

### Examples

```html
<ui-card media="asr(16/9) obp(tl) obf(cover) flp(h) hov(zoom) scm"
         content="scl(lg) pad(md) gap(sm)"
         variant="row spl(1/2) ovr(bc) thm(dark) rds(lg-sq)">
```

`md:`/`lg:` breakpoint prefixes apply to **layout + spacing tokens for now**:
`variant=` arrangement (`col`/`row`/`col-r`/`row-r`, `spl()`, `vis()`) and
`content=` spacing (`gap()`, `pad()`). E.g. `variant="col md:row"`,
`content="gap(sm) md:gap(lg)"`. Making *every* token responsive is too costly (a
rule per token × breakpoint); the rest (`media=`, `content="scl()"`) get prefixes
later if needed.

---

## 3. Attribute taxonomy (the API)

Two tiers:

- **Host modifiers are token-strings**: `media=`, `content=`, `variant=` (full token
  lists in §2). `md:`/`lg:` prefixes apply to **`variant=` layout + `content=`
  spacing (`gap()`/`pad()`)** for now (cost); the rest (`media=`, `content="scl()"`)
  is deferred.
- **Content parts** are `data-part` children (semantic tags). **Media overlays** are
  custom elements (`<ui-chip>` reused, `<ui-sticker>`, `<ui-save>`) carrying only
  their text — no positioning/styling attributes. Overlay **position and theme** are
  both set from the parent `media=` per-element tokens (`chip(cc)`, `chip(dark)`) so
  they work on `<ui-card>` and inherit down; the theme routes into the element's own
  tokens (chip → `--ui-chip-*`). No `color=` attribute, nothing on the element
  itself.

| Attribute | Owns | Namespace |
|-----------|------|-----------|
| `media=` | the media element + `img`/`video` | `--ui-media-*` |
| `content=` | content column typography/spacing | `--ui-content-*` |
| `variant=` | composition + host cosmetics | `--ui-card-*` |

`ovr()` (composition) writes *into* the primitive namespaces — content overlay
placement plus `--ui-media-scrim-dir-default` — so the primitives stay
self-contained. `scm()` is a `media=` token that paints the scrim and reads that
default direction (or its own `scm(tl…br)`), so it also works standalone with no
overlay.

Decisions baked in:
- `scl()` lives on `content=` (primary typography); media overlays read the
  inherited `--ui-content-fs` for chip/sticker sizing.
- **Card-level hovers (lift/shrink/tilt) are removed for now** — hover is
  media-only (`hov(zoom|pan|track)`).
- `()` tokens are *sugar*: every rule just writes a custom property, so
  `style="--ui-media-ar: 5/4"` is the automatic escape hatch for arbitrary
  values — no exhaustive token list required.
- **Media overlays split marker vs control.** Markers (`<ui-chip>`, `<ui-sticker>`)
  are non-interactive autonomous custom elements = valid **phrasing content**, so
  they parse in a card *and* inside a reveal `<summary>`. The one control
  (`<ui-save>`) is interactive → **card-only** (clicks inside `<summary>` toggle the
  `<details>`; interactive content is invalid there). See §4.

---

## 4. `media.css`

**Element base** (own namespace, no `[variant]` ancestor required):

```css
@layer bs-component {
  :where(ui-media) {
    aspect-ratio: var(--ui-media-ar, auto);
    background: var(--ui-media-bg, var(--color-overlay-light, transparent));
    display: grid;
    min-block-size: var(--ui-media-min, 12.5rem);
    overflow: hidden;
    position: relative;
    & :is(img, video) {
      block-size: 100%; inline-size: 100%; inset: 0; position: absolute;
      object-fit: var(--ui-media-fit, cover);
      object-position: var(--ui-media-op, center);
      transform: scale(var(--ui-media-fl-x, 1), var(--ui-media-fl-y, 1));
    }
  }
  :where([media*="asr("]) ui-media, :where(ui-media[media*="asr("]) { min-block-size: 0; }
}
```

**Parse layer** — bare attribute selectors hit element or ancestor:

```css
:where([media*="asr(16/9)"]) { --ui-media-ar: 16/9; }    /* + 1/1 6/7 3/4 4/3 3/2 2/3 21/9 */
:where([media*="obp(br)"])   { --ui-media-op: right bottom; }   /* 9-grid */
:where([media*="flp(h)"])    { --ui-media-fl-x: -1; }    /* + v, hv */
:where([media*="obf(contain)"]) { --ui-media-fit: contain; }
```

**Hover** (media-only): `hov(zoom|pan|track)` writes `--ui-media-hv-*`, under
`@media (hover:hover)` + `prefers-reduced-motion` guard. `track` keeps its
`--ui-media-mx/my` pointer hook (JS later; inert until then).

**Carousel** — the `nav()` token *is* the trigger (no separate `crs` flag): any
`nav` turns the media into a flex scroll-snap row. `nav` (bare) = dots + arrows;
`nav(dots)` / `nav(arrows)` / `nav(none)` pick the controls (`none` = swipe-only).
`::scroll-marker`/`::scroll-button` controls are `@supports`-gated and degrade to
a bare scroller.

**Overlays** — the media-area "furniture" is three elements: **`<ui-chip>`** (the
label — **reuses the existing `ui/chip` component**, not a new element; `<ui-badge>`
stays this project's cart-number badge, unrelated), **`<ui-sticker>`**, and
**`<ui-save>`**. All are autonomous custom elements = valid **phrasing content**, so
the markers parse inside a reveal `<summary>`; markers need **no JS** (pure CSS).
**All configuration is on the parent** `media=` (so it sits on `<ui-card>` and
inherits down); the elements carry only their text. Two per-element axes, atomic
`el(value)` tokens (`chip(cc)`, `chip(red)`):

- **Position** — `<ui-media>` is a **3×3 positioning grid** (`auto 1fr auto`
  tracks). Its 9 areas are logical codes — `ts tc te · cs cc ce · bs bc be` (rows
  top/center/bottom × columns start/center/end) — defined **once**; an element just
  picks an area, so the position geometry is never duplicated per type. Grid columns
  follow the inline axis, so **RTL mirrors automatically** (`ts` renders top-right
  in Arabic). Each element has a **default area by role** (no token needed):

  | Default | Element | |
  |---------|---------|--|
  | `ts` (top-start) | `<ui-chip>` | primary promo label |
  | `te` (top-end) | `<ui-sticker>`, `<ui-save>` | callout / favorite |

  Sticker uses the full grid (e.g. `sticker(cc)`); chip typically the corners.
  Override the default with `media="chip(be)"`.

- **Theme** — `media="chip(dark)"` maps the element to a named **sub-theme** that
  reuses the global color tokens: `accent`, `success`, `error`, `dark`, `light`,
  `subtle` (defined once, see below). For `<ui-chip>` the sub-theme writes chip's
  **own** tokens (`--ui-chip-bg` / `--ui-chip-c`) on the parent, which
  inherit down — so chip stays generic and the card themes it from above (no
  `color=` on the chip). Sticker/save get their own element tokens
  (`--ui-sticker-bg/-c`, `--ui-save-icon/-c`).

Position args (`ts…be`) and theme args (`accent…subtle`) are disjoint vocabularies,
so `chip(cc)` vs `chip(dark)` parse unambiguously. **Syntax: two atomic tokens** —
e.g. `media="chip(tl) chip(dark)"` — **decided, not combined `chip(tl dark)`.**
Why: the pure-CSS parse layer is attribute-substring matching. A combined token's
*second* arg cannot be scoped to its element — matching the theme would need
`[media*=" dark)"]`, which also fires for `sticker(cc dark)` etc., leaking the theme
across elements. Robust combined support would require either ~144 enumerated
position×theme×element combo rules or a JS/build parse step — both rejected to keep
the layer pure-CSS. In practice position defaults by role, so the common case is a
single token (`chip(dark)`); the second token appears only when you override *both*
position and theme on one element.

*Markers* (non-interactive — valid in a card **and** inside a reveal `<summary>`):

| Element | Shape | Typical use |
|---------|-------|-------------|
| `<ui-chip>` | pill label (reused `ui/chip`: pill default, `variant` light/outline/square/squircle, `size` sm/md/lg) | "New", "Bestseller", "Sale" |
| `<ui-sticker>` | round disc; opt-in starburst via `--ui-sticker-clip-path` (`clip-path`); **multi-line** (see below) | "Save 20%", "Best value" |

**`<ui-sticker>` is a centered grid of text-line segments.** Each direct child is a
line; `--ui-sticker-gap` controls line-spacing and `text-box: cap alphabetic` trims
each line's leading so the gap is exact; every line sets its own `font-size` /
`font-weight` (via element/class). So "SAVE / 20%" is two children at different
scales:

```html
<ui-sticker variant="burst"><span style="font-size:.7em">SAVE</span><b style="font-size:1.6em">20%</b></ui-sticker>
```

A single text node (`<ui-sticker>-20%</ui-sticker>`) still works — one line.

**Removed:** `ribbon`, `counter`. **Deferred:** a sold-out / `cover` state (later as a
full-bleed chip/`<ui-sticker>` variant or scrim + text).

*Control* (interactive → **card-only, never inside `<summary>`**: a click there
toggles the `<details>`, and interactive content is invalid in summary):

| Element | Markup | Use |
|---------|--------|-----|
| `<ui-save>` | `<ui-save><input type="checkbox" aria-label="Save"></ui-save>` | favorite ≈ wishlist ≈ bookmark toggle. State + a11y + keyboard from the checkbox, zero JS. Icon swappable via `--ui-save-icon` (heart default; bookmark/star). |

```css
/* ui-media is a 3×3 positioning grid; img/video sit underneath (out of grid flow) */
:where(ui-media) {
  display: grid;
  grid-template:
    "ts tc te" auto
    "cs cc ce" 1fr
    "bs bc be" auto / auto 1fr auto;
}
:where(ui-media) > :is(img, video) { position: absolute; inset: 0; }

/* every overlay element: placed in its area (centered in the auto-sized cell), inset by margin.
   --_area = default-by-role, overridable from the parent media= token */
:where(ui-media) :is(ui-chip, ui-sticker, ui-save) {
  grid-area: var(--_area, ts);
  margin: var(--ui-media-overlay-gap, 0.75rem);
  place-self: center;
  z-index: 2;
}
:where(ui-media) ui-chip    { --_area: var(--ui-media-chip-area, ts); }
:where(ui-media) ui-sticker { --_area: var(--ui-media-sticker-area, te); }
:where(ui-media) ui-save    { --_area: var(--ui-media-save-area, te); }

/* position override: parent token → the element's area name. Trivial per (element, area); generatable */
:where([media*="sticker(cc)"]) { --ui-media-sticker-area: cc; }
:where([media*="chip(be)"])    { --ui-media-chip-area:    be; }
/* …one line per (element, area) shipped */
```

**Sub-themes (the `theme=` axis)** — the theme arg is a named **sub-theme** from a
hue + neutral vocabulary (`red orange green blue` · `accent dark light subtle`),
chosen because media splashes are *decorative*, not status — so `chip(red)` reads
better than `chip(error)` for a "Sale" (status names stay on each element's own
`color=`). These sub-themes are a **library-wide axis**, not media-only: the same
bundles power both the parent `media=` routing here **and** a self-service
`theme=` attribute on the elements (`<ui-chip theme="red">`, see §5/components).

**Tier 1 — bundles at `:root`** (`ui/base/tokens.css`). Each is a `bg`/`c` pair,
defaulting to global tokens (themeable, dark-mode-aware, decoupled from status):

```css
:root {                                         /* project may override */
  --ui-theme-red-bg:    var(--color-error);       --ui-theme-red-c:    hsl(0 0% 100%);
  --ui-theme-orange-bg: var(--color-warning);     --ui-theme-orange-c: var(--color-text);
  --ui-theme-green-bg:  var(--color-success);     --ui-theme-green-c:  hsl(0 0% 100%);
  --ui-theme-blue-bg:   var(--color-info);        --ui-theme-blue-c:   hsl(0 0% 100%);
  --ui-theme-accent-bg: var(--color-accent);      --ui-theme-accent-c: var(--color-accent-text);
  --ui-theme-dark-bg:   var(--color-text);        --ui-theme-dark-c:   var(--color-surface);
  --ui-theme-light-bg:  var(--color-surface);     --ui-theme-light-c:  var(--color-text);
  --ui-theme-subtle-bg: var(--color-surface-alt); --ui-theme-subtle-c: var(--color-text-muted);
}
```

**Tier 2 — generic `[theme]` resolver** (`ui/base/webcomponents.css`, 8 lines,
written ONCE, reusable by any component). It funnels the chosen bundle into two
private vars that inherit down:

```css
:where([theme="red"])    { --_theme-bg: var(--ui-theme-red-bg);    --_theme-c: var(--ui-theme-red-c); }
:where([theme="dark"])   { --_theme-bg: var(--ui-theme-dark-bg);   --_theme-c: var(--ui-theme-dark-c); }
/* …orange green blue accent light subtle */
```

**Tier 3 — element mapping** (one rule per element; place AFTER its `color=` rules
so `theme=` wins). Self-service `theme=` reads the resolver's private vars:

```css
:where(ui-chip[theme])    { --ui-chip-bg: var(--_theme-bg); --ui-chip-c: var(--_theme-c); }
:where(ui-sticker[theme]) { --ui-sticker-bg: var(--_theme-bg); --ui-sticker-c: var(--_theme-c); }
:where(ui-save[theme])    { --ui-save-c: var(--_theme-c); }   /* icon color only */
```

**`media=` routing** uses the *same* `:root` bundles, but targets a *specific*
element's tokens (so a card can theme its chip and sticker differently). One line
per (element, key) — trivial, generatable:

```css
:where([media*="chip(red)"])      { --ui-chip-bg: var(--ui-theme-red-bg);    --ui-chip-c: var(--ui-theme-red-c); }
:where([media*="sticker(green)"]) { --ui-sticker-bg: var(--ui-theme-green-bg); --ui-sticker-c: var(--ui-theme-green-c); }
/* …chip × 8, sticker × 8 */
```

`<ui-chip theme="red">` and `media="chip(red)"` resolve to the **same** colors.
Difference: `theme=` is per-element & self-applied (no position); `media=` is
parent-set, inherits to all matching children, and also carries position. **If both
apply, the element's own `theme=` wins** (its rule sets the token directly on
itself, beating the inherited `media=` value). Pick one.

The eight sub-theme keys: **`red` `orange` `green` `blue` · `accent` `dark` `light`
`subtle`**. They are a separate axis from the semantic `color=` (`info/success/
warning/error`) each component also supports — decorative bundle vs status accent;
if both set, `theme=` wins.

**Overlay element packages** — the three overlay elements are standalone components
(`ui/chip` reused; `ui/sticker` + `ui/save` added, scaffolded from chip's template,
peer-dep `@browser.style/base`). Each defines its own appearance; the media layer
only *positions* them (grid-area) and *themes* them by writing the element's own
tokens. The tokens the media `media=` mapping targets (same tokens the self-service
`theme=` writes):

| Element | Pkg | Theme target tokens | Other element tokens & attrs |
|---------|-----|---------------------|----------------------|
| `<ui-chip>` | `ui/chip` | `--ui-chip-bg`, `--ui-chip-c` | `-border-*`, `-font-*`, `-padding-*`; `variant` light/outline/square/squircle, `size`, `theme`, `color` |
| `<ui-sticker>` | `ui/sticker` | `--ui-sticker-bg`, `--ui-sticker-c` | `--ui-sticker-font-size`, `-font-weight`, `-sz`, `-radius`, `-gap` (line-spacing), `--ui-sticker-clip-path`; `variant="burst"`, `size`, `theme`, `color`; multi-line segments |
| `<ui-save>` | `ui/save` | `--ui-save-c`, `--ui-save-c-active` | `--ui-save-icon` (`icon="heart\|bookmark\|star"`), `--ui-save-sz`, `--ui-save-opacity`; `size`, `theme` |

Each element supports the **`theme=`** attribute (the 8 sub-theme keys, self-applied)
and a standalone **`color=`** semantic convenience (`info/success/warning/error` —
chip + sticker), both independent of `media=` parent theming; `theme=` wins if combined.

**Example** — everything (aspect, position, sub-theme) on the parent `media=`; the
(often generated) overlay elements carry only their text:

```html
<ui-card media="asr(4/3) sticker(cc) chip(red) sticker(green)">
  <img src="https://picsum.photos/600/450" alt="Product name">

  <ui-chip>Sale</ui-chip>           <!-- ts (default), red sub-theme -->
  <ui-sticker>-20%</ui-sticker>     <!-- cc (override), green sub-theme -->
  <ui-save>                         <!-- te (default); card-only -->
    <input type="checkbox" aria-label="Save to wishlist">
  </ui-save>
</ui-card>
```

In a reveal `<summary>`, drop the `<ui-save>` block (interactive → card-only);
`<ui-chip>` / `<ui-sticker>` stay valid. RTL: everything mirrors automatically.

**Scrim** (`scm`) — a `media=` token (scrim is painted on the media, so it lives
with the media). It covers the **whole frame**, layered between the image and the
overlays. Because `<ui-media>` is now a grid, the scrim `::after` must stay out of
grid flow — `position: absolute; inset: 0; z-index: 1` (same approach as
`img`/`video`; overlays sit at `z-index: 2`, image at `0`). `ui-media::after` paints
`linear-gradient(var(--ui-media-scrim-dir, …), var(--ui-media-scrim-c), #0000 60%)`.
Bare `scm` reads
`--ui-media-scrim-dir-default` (set by the host `ovr()` to match the overlay
position); `scm(tl…br)` sets an explicit direction. Works standalone (darkened
image, no overlay).

**Smart simplifications adopted:**
1. Overlay accent collapsed to one shared default token across the overlay elements.
2. Scrim = one gradient + a `--ui-media-scrim-dir` direction token, replacing nine
   fully-spelled gradient definitions; `cc` center stays a one-off override.
3. Arbitrary values via `style="--ui-media-*"` documented instead of chasing
   exhaustive token lists.

---

## 5. `content.css`

**Element base** (own `--ui-content-*` namespace; standalone or nested):

```css
:where(ui-content) {
  align-items: var(--ui-content-ov-align, normal);
  color: var(--ui-content-ov-ink, inherit);
  display: flex;
  flex-direction: column;
  font-size: var(--ui-content-fs, var(--ui-content-fs-md));
  gap: var(--ui-content-gap, 1em);
  justify-content: var(--ui-content-ov-justify, normal);
  padding: var(--ui-content-p, var(--spacing-md));
  text-align: var(--ui-content-ov-text, start);
  z-index: var(--ui-content-ov-z, auto);
  & > * { margin: 0; text-box: cap alphabetic; }
}
```

`--ui-content-ov-*` are written by the host `ovr()`; standalone content gets the
`normal`/`inherit` defaults (overlay placement inert until a layout asks).

**`content=` parse layer** (`gap()`/`pad()` are `md:`/`lg:`-prefixable; `scl()` is
not, this round):

```css
:where([content*="scl(lg)"]) { --ui-content-fs: var(--ui-content-fs-lg); --ui-content-headline: var(--ui-content-headline-lg); }
:where([content*="pad(lg)"]) { --ui-content-p: var(--spacing-lg); }
:where([content*="gap(sm)"]) { --ui-content-gap: var(--spacing-sm); }
```

**Type scale** — the two `cqi` `clamp()` scales (body + headline) move here as
`--ui-content-fs-{sm..xl}` / `--ui-content-headline-{sm..xl}`; `scl()` swaps the
active stop.

**Parts** (`data-part`, auto-styled): eyebrow, headline (+ bare `h2–h6`),
subheadline, summary, meta/caption, byline, tags, actions, footer. Each keeps a
`--ui-content-{part}-*` token (future per-part typography knobs).

**Scroll** — `content="scr"` (was `[scroll]`): scrollable column with the shared
`ui-scroll-fade` mask.

**Extensibility** (flagged for later): `scl()` and per-part tokens flow through the
same parse layer, so making them responsive later is purely additive — generate the
breakpoint rule, no structural change. This round, `md:`/`lg:` covers `variant=`
layout + `content=` `gap()`/`pad()`.

---

## 6. Layout & responsive (`ui-card.css` / `ui-reveal.css`)

`ui-card.css` becomes the **composition layer**: `@import`s both primitives,
adds host + the media↔content relationship.

```css
@import './media.css';
@import './content.css';
@layer bs-component {
  :where(ui-card) {
    --ui-card-bg: var(--color-surface); --ui-card-radius: var(--radius-2xl);
    --ui-card-shadow: var(--shadow-xl);
    background: var(--ui-card-bg); border-radius: var(--ui-card-radius);
    box-shadow: var(--ui-card-shadow); container-type: inline-size;
    display: grid; overflow: hidden;
  }
  :where(ui-card) > cq-box { display: grid; grid-template-columns: var(--ui-card-cols, 1fr); }
}
```

`variant=` owns arrangement (`--ui-card-cols` + `order`), `spl()`,
`vis(media|content)`, `rds()` (radius + optional squircle), `thm()`.

`ovr()` is the bridge — it couples both primitives and writes into their
namespaces (content overlay placement + the default scrim direction the media's
`scm` reads):

```css
:where([variant*="ovr(bc)"]) {
  --ui-content-ov-justify: end; --ui-content-ov-align: center; --ui-content-ov-text: center;
  --ui-content-ov-ink: var(--ui-card-overlay-ink, #fff); --ui-content-ov-z: 1;
  --ui-media-scrim-dir-default: to top;
  --ui-card-stack: 1 / 1;
}
```

**Responsive** — `cq-box` stays (a container cannot query itself; `@container`
must target a descendant). For now `md:`/`lg:` apply to **`variant=` layout**
(arrangement + split/visibility) and **`content=` spacing** (`gap()`/`pad()`),
parsed inside `@container` against the queryable descendant (`cq-box` for card,
`summary` for reveal); props inherit down. (`media=` and `content="scl()"`
breakpoints are deferred — too many rules per token × breakpoint to be worth it
yet.)

```css
@container (inline-size >= 25rem) {            /* md */
  :where([variant*="md:row"])      :is(cq-box, summary) { --ui-card-cols: var(--ui-card-split, 1fr 1fr); }
  :where([variant*="md:col"])      :is(cq-box, summary) { --ui-card-cols: 1fr; }
  :where([variant*="md:spl(1/2)"]) :is(cq-box, summary) { --ui-card-split: 1fr 2fr; }
  :where([content*="md:gap(lg)"])  :is(cq-box, summary) { --ui-content-gap: var(--spacing-lg); }
  :where([content*="md:pad(lg)"])  :is(cq-box, summary) { --ui-content-p:   var(--spacing-lg); }
}
@container (inline-size >= 44rem) { /* lg — same shape */ }
```

Breakpoints unchanged: md = 25rem, lg = 44rem. The repetition (every responsive
token re-listed per breakpoint) is a candidate to *generate* later; hand-written
to start.

`ui-reveal.css` changes little: still `@import '../card/ui-card.css'`, reuses
`--ui-card-cols` / `--ui-media-*` / `--ui-content-*` by inheritance through
`summary`/`ui-face`. `type=`/`icon=`/`from=`/`trigger=` stay reveal-specific.

**Reveal chrome spacing is decoupled from content `pad()`.** The `ui-icon` lives
in `<summary>`, outside `<ui-content>`, so its edge gap gets its own chrome token
rather than tracking the content padding:

```css
:where(ui-reveal) { --ui-reveal-icon-m: var(--spacing-md); }
… > summary > ui-icon { margin: var(--ui-reveal-icon-m); }
```

This fixes a latent bug in the old coupling (`--ui-reveal-icon-m` → `--ui-reveal-p`
→ `--ui-card-p`): `p(none)` on a media-only reveal used to slam the overlaid icon
into the corner. Now `content="pad(none)"` zeroes only the content padding; the icon
keeps its inset unless `--ui-reveal-icon-m` is set explicitly.

---

## 7. Token rename map (clean v4 break — no alias shim)

CSS custom properties keep `emmet.md`'s readable *Token* form; only the DSL
*attribute* tokens use the abbreviation scheme from §2.

| Old | New | Namespace |
|-----|-----|-----------|
| `--ui-card-fs*`, `--ui-card-headline*` | `--ui-content-fs*`, `--ui-content-headline*` | content |
| `--ui-card-p`, `--ui-card-row-gap`, `--ui-card-muted` | `--ui-content-p`, `--ui-content-gap`, `--ui-content-muted` | content |
| `--ui-card-{eyebrow,subheadline,summary,meta,byline,tags,tag,actions,footer}-*` | `--ui-content-…` | content |
| `--ui-card-ov-*` | `--ui-content-ov-*` (written by host `ovr()`) | content |
| `--ui-card-ar/op/fl-*/object-fit/media-bg/media-min` | `--ui-media-ar/op/fl-*/fit/bg/min` | media |
| `--ui-card-hv-*`, `--ui-card-hover-*`, `--ui-card-mx/my` | `--ui-media-hv-*`, `--ui-media-hover-*`, `--ui-media-mx/my` | media |
| `--ui-card-{dot,arrow}-*`, `--ui-card-overlay-gap` | `--ui-media-…` | media |
| `--ui-card-ribbon-*/badge-*` | reuse `--ui-chip-*` + new `--ui-sticker-*` (element ns); placement via `--ui-media-{el}-area`; ribbon/counter dropped | media |
| `--ui-card-scrim-*` | `--ui-media-scrim-*` (direction-based) | media |
| `--ui-card-bg/radius/shadow/cols/split/squircle-exp`, theme tokens, `--ui-card-overlay-ink`, `--ui-card-stack` | unchanged | card |

**Deleted:** card-level hovers (lift/shrink/tilt) + `--ui-card-hv-{lift,shrink,tilt}`.

**Attribute (DSL) migration in demos:**

| Old (today, all on `variant`/bare attrs) | New | Moves to |
|------|-----|----------|
| `ar()` | `asr()` | `media=` |
| `op()` | `obp()` | `media=` |
| `fl()` | `flp()` | `media=` |
| `hv(zoom\|pan\|track)` | `hov()` | `media=` |
| `object-fit` knob | `obf()` | `media=` |
| `carousel` + `controls=` | `nav()` (bare = both; `nav(dots\|arrows\|none)`) — token *is* the trigger | `media=` |
| `sc()` | `scm()` (scrim is a media paint) | `media=` |
| overlay `pos=` on `data-part` spans (9-grid) | overlay elements `<ui-chip>` (reused `ui/chip`) / `<ui-sticker>` / `<ui-save>`, configured via parent `media=` tokens: position `chip(ts…be)` on a 3×3 grid (sticker = full 9; default by role) + sub-theme `chip(red…subtle)`; `ribbon`+`counter` removed, `cover` deferred; old media `badge`→`<ui-chip>` (`<ui-badge>` = cart-number, untouched) | `media=` |
| `fs()` | `scl()` | `content=` |
| `p()` | `pad()` | `content=` |
| `[scroll]` | `scr` | `content=` |
| `vertical`/`horizontal`/`-r` | `col`/`row`/`col-r`/`row-r` | `variant=` |
| `sp()` | `spl()` | `variant=` |
| `ov()` | `ovr()` | `variant=` |
| `th()` | `thm()` | `variant=` |
| `sq(sm\|md\|lg\|xl)` (radius+squircle coupled) | `rds(<size>)` / `rds(<size>-sq)` (radius decoupled, real scale) | `variant=` |
| `media-only`/`content-only` | `vis(media)`/`vis(content)` | `variant=` |
| `variant-md`/`variant-lg` | `md:`/`lg:` prefixes on `variant=` **layout** + `content=` **spacing** (`gap()`/`pad()`) for now (`media=`, `content="scl()"` deferred) | `variant=` / `content=` |

---

## 8. Rollout phases

1. **Extract** `media.css` + `content.css` (rename + 3 smart simplifications).
   `ui-card.css` slims to host + composition + responsive, `@import`ing both.
2. ~~Compat shim~~ — **skipped** (clean v4 break).
3. **Demos** — update `ui/card/{index,media,content}.html` to the new attribute
   split; verify `ui-reveal` + its demos.
4. **Docs** — split `ui-card-tokens.md` into media / content / card-composition
   sections; refresh both `readme.md`s.
5. **Verify** — open each demo in the browser, confirm visual parity against a
   `git stash` baseline.
