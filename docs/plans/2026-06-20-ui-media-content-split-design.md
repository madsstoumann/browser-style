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
:where([media*="ar(16/9)"]) { --ui-media-ar: 16/9; }
```

Because custom properties inherit, **one rule set serves both cases**:

- `<ui-media media="ar(16/9)">` → matches itself → reads its own prop.
- `<ui-card media="ar(16/9)"><ui-media>` → card matches → prop inherits down.

The "modifiers on the parent" requirement falls out for free: same attribute
name, same parse rules, inheritance does the wiring.

---

## 2. Attribute taxonomy (the API)

Two tiers:

- **Host modifiers are token-strings**, all `md:`/`lg:`-prefixable:
  `media=`, `content=`, `variant=`.
- **Slotted children take plain attributes**: `data-part` (+ future per-child
  hooks). Overlay placement/color is driven from the *parent* token-string, not
  the child.

| Attribute | Owns | Tokens |
|-----------|------|--------|
| `media=` | the media element + img/video | `ar()` `op()` `fl()` `fit()` `hv(zoom\|pan\|track)` `carousel` `nav(dots\|arrows\|both\|none)` `ribbon(<pos>)` `badge(<pos>)` |
| `content=` | content column typography/spacing | `fs()` `p()` `gap()` `scroll` |
| `variant=` | composition + host cosmetics | arrangement (`vertical`/`horizontal`/`-r`), `sp()`, `ov()`, `sc()`, `media-only`/`content-only`, `sq()`, `th()` |

Token namespaces: `--ui-media-*` (media.css), `--ui-content-*` (content.css),
`--ui-card-*` (card composition/host). `ov()`/`sc()` write *into* the primitive
namespaces so the primitives stay self-contained.

Decisions baked in:
- `fs()` lives on `content=` (primary typography); media overlays read the
  inherited `--ui-content-fs` for ribbon/badge sizing.
- **Card-level hovers (`hv(lift|shrink|tilt)`) are removed for now** — hover is
  media-only (`zoom`/`pan`/`track`).
- `()` tokens are *sugar*: every rule just writes a custom property, so
  `style="--ui-media-ar: 5/4"` is the automatic escape hatch for arbitrary
  values — no exhaustive token list required.

---

## 3. `media.css`

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
  :where([media*="ar("]) ui-media, :where(ui-media[media*="ar("]) { min-block-size: 0; }
}
```

**Parse layer** — bare attribute selectors hit element or ancestor:

```css
:where([media*="ar(16/9)"]) { --ui-media-ar: 16/9; }    /* + 1/1 6/7 3/4 4/3 3/2 2/3 21/9 */
:where([media*="op(br)"])   { --ui-media-op: right bottom; }   /* 9-grid */
:where([media*="fl(h)"])    { --ui-media-fl-x: -1; }    /* + v, hv */
:where([media*="fit(contain)"]) { --ui-media-fit: contain; }
```

**Hover** (media-only): `hv(zoom|pan|track)` retargeted to `--ui-media-hv-*`,
under `@media (hover:hover)` + `prefers-reduced-motion` guard. `track` keeps its
`--ui-media-mx/my` pointer hook (JS later; inert until then).

**Carousel** — folded into `media=`: `carousel` + `nav(dots|arrows|both|none)`
(default = both). Flex scroll-snap row, `::scroll-marker`/`::scroll-button`
controls, `@supports`-gated, degrades to a bare scroller.

**Overlays** — spans with `data-part="ribbon"|"badge"` (text only). Placement
comes from parent tokens `ribbon(<pos>)` / `badge(<pos>)` (9-grid), written as
per-overlay inset props read by each span. Colors deferred (single
`--ui-media-overlay-accent` default for now).

**Smart simplifications adopted:**
1. Overlay accent collapsed to one token (was duplicated ribbon+badge).
2. Scrim = one gradient + a `--ui-media-scrim-dir` direction token (set by the
   host `ov()`/`sc()`), replacing nine fully-spelled gradient definitions; `cc`
   center stays a one-off override.
3. Arbitrary values via `style="--ui-media-*"` documented instead of chasing
   exhaustive token lists.

---

## 4. `content.css`

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

`--ui-content-ov-*` are written by the host `ov()`; standalone content gets the
`normal`/`inherit` defaults (overlay placement inert until a layout asks).

**`content=` parse layer** (all `md:`/`lg:`-prefixable):

```css
:where([content*="fs(lg)"])  { --ui-content-fs: var(--ui-content-fs-lg); --ui-content-headline: var(--ui-content-headline-lg); }
:where([content*="p(lg)"])   { --ui-content-p: var(--spacing-lg); }
:where([content*="gap(sm)"]) { --ui-content-gap: var(--spacing-sm); }
```

**Font scale** — the two `cqi` `clamp()` scales (body + headline) move here as
`--ui-content-fs-{sm..xl}` / `--ui-content-headline-{sm..xl}`; `fs()` swaps the
active stop.

**Parts** (`data-part`, auto-styled): eyebrow, headline (+ bare `h2–h6`),
subheadline, summary, meta/caption, byline, tags, actions, footer. Each keeps a
`--ui-content-{part}-*` token (future per-part typography knobs), already
`md:`/`lg:`-overridable through the same parse layer.

**Scroll** — `content="scroll"` (was `[scroll]`): scrollable column with the
shared `ui-scroll-fade` mask.

**Extensibility** (flagged for later): `gap()`, `p()`, `fs()`, and every
per-part token flow through one prefixable parse layer — adding `md:gap(lg)`
needs only the generated rule, no structural change.

---

## 5. Layout & responsive (`ui-card.css` / `ui-reveal.css`)

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

`variant=` owns arrangement (`--ui-card-cols` + `order`), `sp()`,
`media-only`/`content-only`, `sq()`, `th()`.

`ov()`/`sc()` are the bridge — they couple both primitives and write into their
namespaces:

```css
:where([variant*="ov(bc)"]) {
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
  :where([variant*="md:horizontal"]) :is(cq-box, summary) { --ui-card-cols: var(--ui-card-split, 1fr 1fr); }
  :where([media*="md:ar(16/9)"])     :is(cq-box, summary) { --ui-media-ar: 16/9; }
  :where([content*="md:fs(lg)"])     :is(cq-box, summary) { --ui-content-fs: var(--ui-content-fs-lg); }
}
@container (inline-size >= 44rem) { /* lg — same shape */ }
```

Breakpoints unchanged: md = 25rem, lg = 44rem. The repetition (every responsive
token re-listed per breakpoint) is a candidate to *generate* later; hand-written
to start.

`ui-reveal.css` changes little: still `@import '../card/ui-card.css'`, reuses
`--ui-card-cols` / `--ui-media-*` / `--ui-content-*` by inheritance through
`summary`/`ui-face`. `type=`/`icon=`/`from=`/`trigger=` stay reveal-specific.

---

## 6. Token rename map (clean v4 break — no alias shim)

| Old | New | Namespace |
|-----|-----|-----------|
| `--ui-card-fs*`, `--ui-card-headline*` | `--ui-content-fs*`, `--ui-content-headline*` | content |
| `--ui-card-p`, `--ui-card-row-gap`, `--ui-card-muted` | `--ui-content-p`, `--ui-content-gap`, `--ui-content-muted` | content |
| `--ui-card-{eyebrow,subheadline,summary,meta,byline,tags,tag,actions,footer}-*` | `--ui-content-…` | content |
| `--ui-card-ov-*` | `--ui-content-ov-*` (written by host `ov()`) | content |
| `--ui-card-ar/op/fl-*/object-fit/media-bg/media-min` | `--ui-media-ar/op/fl-*/fit/bg/min` | media |
| `--ui-card-hv-*`, `--ui-card-hover-*`, `--ui-card-mx/my` | `--ui-media-hv-*`, `--ui-media-hover-*`, `--ui-media-mx/my` | media |
| `--ui-card-{dot,arrow}-*`, `--ui-card-overlay-gap` | `--ui-media-…` | media |
| `--ui-card-ribbon-*/badge-*` | `--ui-media-ribbon-*/badge-*` | media |
| `--ui-card-scrim-*` | `--ui-media-scrim-*` (direction-based) | media |
| `--ui-card-bg/radius/shadow/cols/split/squircle-exp`, `th()` tokens, `--ui-card-overlay-ink`, `--ui-card-stack` | unchanged | card |

**Deleted:** `hv(lift|shrink|tilt)` + `--ui-card-hv-{lift,shrink,tilt}`.

**Attribute migration (demos):** `ar/op/fl/hv/carousel/controls` → `media=`;
`fs/p` → `content=`; `[scroll]` → `content="scroll"`; `carousel`+`controls=` →
`media="carousel nav(…)"`; overlay `pos=` on spans → parent `media="ribbon(tl)
badge(bc)"`; `variant-md/-lg` → `md:`/`lg:` prefixes. Layout/`sp`/`ov`/`sc`/`sq`/
`th` stay on `variant=`.

---

## 7. Rollout phases

1. **Extract** `media.css` + `content.css` (rename + 3 smart simplifications).
   `ui-card.css` slims to host + composition + responsive, `@import`ing both.
2. ~~Compat shim~~ — **skipped** (clean v4 break).
3. **Demos** — update `ui/card/{index,media,content}.html` to the new attribute
   split; verify `ui-reveal` + its demos.
4. **Docs** — split `ui-card-tokens.md` into media / content / card-composition
   sections; refresh both `readme.md`s.
5. **Verify** — open each demo in the browser, confirm visual parity against a
   `git stash` baseline.
