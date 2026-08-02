# `/polyfill/` — DOM carousel controls where the native pseudos can't go

```html
<script type="module">
  if (!CSS.supports('scroll-marker-group: after')) import('/polyfill/carousel.js');
</script>
```

The CSS-only carousel draws its dots with `::scroll-marker` and its arrows with
`::scroll-button()`, behind `@supports (scroll-marker-group: after)`
(`ui/card/media.carousel.css` + `ui/base/carousel.css`). Those are Chromium-only
today. Everywhere else the carousel still works — it stays a native, swipeable
scroll-snap row — it just has no visible controls.

This module puts the controls back as **real elements**. It injects exactly one
`<ui-carousel-controls>` per top-level scroller, holding `<button>` dots
(`[data-dot]`, active = `[aria-current]`) and prev/next arrows (`[data-nav]`), and
`carousel.css` styles them from the **same `--ui-media-*` / `--ui-carousel-*`
tokens** the native path uses — those setters live *outside* the `@supports` gate,
so a themed demo looks identical either way.

The machinery is split in two since the lightbox round:

- **`carousel-controls.js`** — the CORE: `initControls(scroller)`, `scan()`, the
  token readers (`mediaStr`/`wanted`/`hasToken`) and the companion-stylesheet
  loader. Imports nothing from `/ui/card/`, idempotent via
  `[data-ui-carousel-polyfill]`.
- **`carousel.js`** — the Safari fallback ENTRY (the file pages load, unchanged
  contract): imports the core, auto-`scan()`s on idle, and — if the native
  features *are* available (force-loaded in development with `?polyfill`) —
  neutralises the native pseudos globally so a page never shows two sets of
  controls.

**The second consumer is the lightbox.** `ui/card/lightbox.js` calls
`initControls()` on `ui-media[popover]` frames in **every** browser: the native
`::scroll-marker-group`/`::scroll-button()` boxes do not follow an element into
the **top layer** (verified in Chromium — they keep painting in the document
layer, behind `::backdrop`), so DOM controls are the only carousel controls a
fullscreen popover lightbox can have. `ui/card/media.lightbox.css` suppresses
the native pseudos on those `[data-ui-carousel-polyfill]` popover frames only —
scoped, unlike this entry's global kill.

---

## The `data-media` contract

This is the one thing to understand before editing either file.

Every other sheet in the system writes each carousel token **twice** — a host arm
and a self arm — because `media=` may sit on the `<ui-media>` or on its
`<ui-card>`/`<ui-reveal>` host:

```css
:where(ui-card, ui-reveal):where([media*="mrk(bc)"]) ui-media … ,
ui-media:where([media*="mrk(bc)"]) > …                       { … }
```

The polyfill does not have to. `mediaStr()` in `carousel-controls.js` has **already applied
the DSL's scoping rule** in JS — own attribute, else the nearest
`ui-card`/`ui-reveal`, never a further ancestor — so `init()` stamps the *resolved*
string onto the injected element:

```js
controls.setAttribute('data-media', m);
```

Everything downstream of that is one selector per token:

```css
ui-carousel-controls[data-media*="arw(set)"] [data-nav="prev"] { … }
```

`carousel.css` keys ~54 selectors off `[data-media]` this way, under its
`TOKEN SURFACE` banner. Three consequences worth keeping in mind:

- **Never re-derive the media string in CSS.** Reading `media=` off an ancestor
  from inside the polyfill sheet would re-introduce the two-arm problem *and* get
  the scoping wrong (it would cross a nested card host).
- **A `<lay-out overflow>` scroller is covered for free.** It carries the same
  `media=` vocabulary but is not a `<ui-media>` and has no card host; because the
  stamp is resolved in JS, every `[data-media]` rule applies to it unchanged.
- **Ink / size / shape tokens are deliberately absent** from that block
  (`arw(lgt|drk|sm|lg|xl|sqr|sft|arr|hid)`, `mrk(lgt|drk|sm|md|lg|xl)`). Their
  setters sit outside the native `@supports` gate, so the injected elements already
  inherit them. Adding them here would be duplication, not coverage.

The sheet is **deliberately unlayered** — it has to beat `@layer bs-component`,
notably the generic slide rule that would otherwise turn the injected element into
a 100%-wide snap slide.

## What it matches — including `<lay-out overflow>`

```js
const SEL = `ui-media${NAV}, :is(ui-card${NAV}, ui-reveal${NAV}) ui-media, lay-out[overflow]${NAV}`;
```

The third arm is the one that is easy to miss: a `<lay-out overflow media="nav …">`
is a scroller in its own right and runs the same control vocabulary (see
`layout/AGENTS.md` § *Carousel controls — `overflow` + `media=` tokens`*). The native
sheet has always matched `:where(ui-media, lay-out[overflow])`; this arm is the
polyfill catching up.

`NAV` is `:is([media~="nav"], [media*="nav("])` — whole-token, mirroring the core, so
a future token merely *containing* "nav" cannot fire it. `scan()` then skips any
scroller nested inside another `<ui-media>`, matching the native path, which disables
controls on nested frames too. (`initControls()` itself takes any single scroller —
the lightbox path calls it directly on popover frames without going through `SEL`.)

## Slide pitch — why it measures instead of using `clientWidth`

The obvious scroll step is "one scrollport". That is right for `<ui-media>`, where
each slide is 100% wide, and wrong everywhere else:

```js
const size = () => {
  const s = slidesOf(scroller);
  if (s.length > 1) {
    const a = s[0].getBoundingClientRect(), b = s[1].getBoundingClientRect();
    const d = axisY ? b.top - a.top : Math.abs(b.left - a.left);
    if (d > 1) return d;
  }
  return axisY ? scroller.clientHeight : scroller.clientWidth;
};
```

A `<lay-out overflow>` card row shows **N cards per view**, and a gapped carousel
adds `--ui-media-gap` between them. Using `clientWidth` there made every dot past
the second scroll past the end and clamp — so only the first two markers appeared to
work. Measuring the real distance between slide 0 and slide 1 covers all three cases
(one-up, N-up, gapped) with no configuration. `clientWidth`/`clientHeight` remains
the fallback for a single-slide scroller.

## Resize: re-**sync**, not just re-measure

A shared `ResizeObserver` calls both halves:

```js
const ro = new ResizeObserver((entries) => entries.forEach(({ target }) => {
  measure(target);
  syncs.get(target)?.();
}));
```

`measure()` writes two px values onto the controls element: `--_h` (the scroller's
`clientHeight`, which the `[data-layer]` box spans — including the `nav(blw)`/`nav(abv)`
band padding) and `--_ch` (the content-box height, needed by the `axis(y)` sticky box
whose negative margin would otherwise resolve a percentage against the *inline* size).
They have to come from JS because `[data-layer]` is an absolute box inside a
**zero-width sticky** pin — percentages and `anchor()` have nothing to resolve against
there. (The file header still mentions a `--_w`; only `--_h` and `--_ch` are set —
horizontal sizing comes from the sticky box itself.)

Re-running `sync()` is the less obvious half. At `init()` the scroller has not been
laid out yet, so `scrollWidth === clientWidth` and the `next` arrow would latch
**disabled** — a dead next arrow on load until the first scroll. The first
ResizeObserver callback lands after layout, which is the first moment the real
dead-end state is knowable. `init()` also calls `measure()` synchronously so there is
no unsized first paint.

## Interop with the core JS

- **Loop clones.** `ui/card/carousel.js` prepends/appends `[data-clone]` slides.
  `slidesOf()` here filters them out so they get no dot, and the lead offset is read
  **live** (`lead()`), so ordering between the two scans does not matter. `scan()`
  additionally waits (bounded, 5 idle retries) for clones to exist before initialising
  a `loop` carousel, so the controls end up as the *first* child and the sticky pin
  sits at the scroll start.
- **`NOT_SLIDE` is a local copy, by design.** The core imports nothing, so it can
  be loaded standalone behind a `@supports` gate. Drift is not a risk because it is a
  **build error**: `ui/card/tokens.lint.js` parses the literal in
  `carousel-controls.js` and requires it to equal `ui/card/shared.js`'s exactly (and
  the `:not()` list in `media.carousel.css` to be a subset). If you change one,
  change both.
- **`LAY-OUT` is in that list**, so a collage carousel — `<lay-out>` children of a
  `<ui-media nav>` — has zero JS slides and therefore gets **no polyfill dots**. It
  keeps native swipe + snap. That is the documented CSS-only boundary, not a gap to
  patch here (see [`ui/card/carousel.md`](../ui/card/carousel.md#multiple-items-per-slide--group-wrappers)).

## Files

| File | Role |
|---|---|
| `carousel-controls.js` | the core — injection, slide math, scroll/resize sync; exports `initControls(scroller)`, `scan()`, `wanted()`, `mediaStr()`, `hasToken()` |
| `carousel.js` | the Safari fallback entry — imports the core, idle auto-`scan()`, global native-pseudo kill when force-loaded; exports `scan()` (also `globalThis.uiMediaPolyfill.scan`) |
| `carousel.css` | real-element port of the native `@supports` block; unlayered; `[data-media]` token surface |

Related: [`ui/base/polyfills/readme.md`](../ui/base/polyfills/readme.md) (typed `attr()` —
a different polyfill for a different gap; a page may well need both).
