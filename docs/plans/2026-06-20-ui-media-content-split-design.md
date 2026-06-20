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
> `emmet.md`'s Abbr column. Slot/part names stay readable nouns** (`badge`,
> `ribbon`, `eyebrow`, `headline`, …) — exactly as `emmet.md` already requires
> for sub-elements.

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
| `ribbon()` | `tl … br` | place the `ribbon` overlay slot |
| `badge()` | `tl … br` | place the `badge` overlay slot |

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

`data-part` values: `ribbon`, `badge`, `eyebrow`, `headline`, `subheadline`,
`summary`, `meta`, `caption`, `byline`, `tags`, `actions`, `footer`. Parent
placement tokens reference the slot by its readable name (`ribbon(tl)`,
`badge(bc)`); argument vocabularies (`media`/`content`, `dots`/`arrows`) stay
readable too.

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

`md:`/`lg:` breakpoint prefixes apply to any token:
`media="asr(4/3) md:asr(16/9)"`, `variant="col md:row"`.

---

## 3. Attribute taxonomy (the API)

Two tiers:

- **Host modifiers are token-strings**, all `md:`/`lg:`-prefixable:
  `media=`, `content=`, `variant=` (full token lists in §2).
- **Slotted children take plain attributes**: `data-part`. Overlay
  placement/color is driven from the *parent* token-string, not the child.

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
  inherited `--ui-content-fs` for ribbon/badge sizing.
- **Card-level hovers (lift/shrink/tilt) are removed for now** — hover is
  media-only (`hov(zoom|pan|track)`).
- `()` tokens are *sugar*: every rule just writes a custom property, so
  `style="--ui-media-ar: 5/4"` is the automatic escape hatch for arbitrary
  values — no exhaustive token list required.

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

**Overlays** — spans with `data-part="ribbon"|"badge"` (text only). Placement
comes from parent tokens `ribbon(<pos>)` / `badge(<pos>)` (9-grid), written as
per-overlay inset props read by each span. Colors deferred (single
`--ui-media-overlay-accent` default for now).

**Scrim** (`scm`) — a `media=` token (scrim is painted on the media, so it lives
with the media). `ui-media::after` paints `linear-gradient(var(--ui-media-scrim-dir,
…), var(--ui-media-scrim-c), #0000 60%)`. Bare `scm` reads
`--ui-media-scrim-dir-default` (set by the host `ovr()` to match the overlay
position); `scm(tl…br)` sets an explicit direction. Works standalone (darkened
image, no overlay).

**Smart simplifications adopted:**
1. Overlay accent collapsed to one token (was duplicated ribbon+badge).
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

**`content=` parse layer** (all `md:`/`lg:`-prefixable):

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
`--ui-content-{part}-*` token (future per-part typography knobs), already
`md:`/`lg:`-overridable through the same parse layer.

**Scroll** — `content="scr"` (was `[scroll]`): scrollable column with the shared
`ui-scroll-fade` mask.

**Extensibility** (flagged for later): `gap()`, `pad()`, `scl()`, and every
per-part token flow through one prefixable parse layer — adding `md:gap(lg)`
needs only the generated rule, no structural change.

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
must target a descendant). `md:`/`lg:` tokens on any of the three attributes,
parsed inside `@container` against the queryable descendant (`cq-box` for card,
`summary` for reveal); props inherit down:

```css
@container (inline-size >= 25rem) {            /* md */
  :where([variant*="md:row"])    :is(cq-box, summary) { --ui-card-cols: var(--ui-card-split, 1fr 1fr); }
  :where([media*="md:asr(16/9)"]) :is(cq-box, summary) { --ui-media-ar: 16/9; }
  :where([content*="md:scl(lg)"]) :is(cq-box, summary) { --ui-content-fs: var(--ui-content-fs-lg); }
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
| `--ui-card-ribbon-*/badge-*` | `--ui-media-ribbon-*/badge-*` | media |
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
| overlay `pos=` on spans | parent `ribbon(tl)` / `badge(bc)` | `media=` |
| `fs()` | `scl()` | `content=` |
| `p()` | `pad()` | `content=` |
| `[scroll]` | `scr` | `content=` |
| `vertical`/`horizontal`/`-r` | `col`/`row`/`col-r`/`row-r` | `variant=` |
| `sp()` | `spl()` | `variant=` |
| `ov()` | `ovr()` | `variant=` |
| `th()` | `thm()` | `variant=` |
| `sq(sm\|md\|lg\|xl)` (radius+squircle coupled) | `rds(<size>)` / `rds(<size>-sq)` (radius decoupled, real scale) | `variant=` |
| `media-only`/`content-only` | `vis(media)`/`vis(content)` | `variant=` |
| `variant-md`/`variant-lg` | `md:`/`lg:` prefixes | on each attribute |

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
