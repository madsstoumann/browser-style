# ui-card — Unified Card Design

> Date: 2026-06-14
> Branch: `v4`
> Author: Mads Stoumann

A single CSS-first card engine in `ui/card/ui-card.css` that `ui-reveal` (and, later,
the content-card system) inherit from. Built on two structural custom elements —
`<ui-media>` and `<ui-content>` — so every card is some arrangement of "media" and
"content": media-only, content-only, media above/below content, or content over media.

---

## Source systems analysed

| System | Form | Key traits |
|--------|------|-----------|
| `content/card/dist` + `demo` | JS + JSON build | 25 card types, `.cc-*` classes, `media`+`content` model, token layout (`card="vertical ar(16/9)"`, `card-md/-xl`), 9-pos overlays, full Schema.org |
| `ui/reveal` | CSS-only on `<details>/<summary>` | `<ui-media>`/`<ui-content>`/`<ui-face>`/`<ui-icon>`, `variant="…"` tokens borrowed verbatim from content-card, `--ui-reveal-*` tokens, flip/slide/scale/expand |
| `ui/card_v1` | CSS-only `.ui-card` | legacy, being replaced |

---

## Decisions

1. **Sharing model:** `ui-reveal.css` `@import`s `ui-card.css`. `ui-card.css` is the base.
2. **Engine is host-agnostic:** layout/typography rules key off the `variant` attribute and
   the `<ui-media>`/`<ui-content>` elements — never off the `ui-card` tag — so the same rules
   light up inside `<ui-card>` and inside `<ui-reveal><summary>`.
3. **Modifier syntax:** `variant="…"` space-separated tokens (matches ui-reveal & content-card).
4. **Font scale:** 4 tiers `fs(sm|md|lg|xl)`, each a `clamp()` using container units (`cqi`),
   so cards grow/shrink with their own width, bounded. `fs(xl)` is a hero/display tier.
5. **Part-styling scope (v1):** structure + common content parts only. Defer the 25
   type-specific parts and all Schema.org.
6. **v1 is CSS-only.** No JS web component yet.
7. **Styling hook:** `data-part="…"` (not `part`, which is reserved for Shadow-DOM `::part()`).
   Style by `[data-part="…"]` regardless of tag, so consumers pick a semantically valid
   element per context (flow in a card body, phrasing inside a `<summary>`).

---

## File structure

```
ui/card/
├── ui-card.css        # base: surface + layout engine + fs() scale + common parts
├── index.html         # CSS-only demos (no JS)
├── package.json       # @browser.style/card
└── readme.md

ui/reveal/
└── ui-reveal.css      # @import '../card/ui-card.css'; then details/summary + flip/slide/scale/expand
```

Everything in `@layer bs-component`, `:where()` selectors (zero specificity).

---

## Parts taxonomy

`<ui-media>` — visual: `img` (bare default), video/youtube, `[data-part="caption"]` on a
phrasing element (no `<figcaption>` — `<ui-media>` is not a `<figure>`). Ribbon/sticker
deferred to `<ui-badge>`.

`<ui-content>` — text. Common parts styled in v1 via `[data-part]`:

| Part | Card body (flow OK) | Reveal `<summary>` (phrasing only) |
|------|--------------------|-----------------------------------|
| eyebrow / category | `<small data-part="eyebrow">` | same |
| headline | `<h2 data-part="headline">` | `<b data-part="headline">` |
| subheadline | `<p data-part="subheadline">` | `<span data-part="subheadline">` |
| summary | `<p data-part="summary">` | `<span data-part="summary">` |
| byline / author | `<address data-part="byline">` | n/a |
| meta (date, reading-time) | `<small data-part="meta">` | n/a |
| tags | `<ul data-part="tags">` | n/a |
| actions | `<nav data-part="actions">` | n/a |
| footer | `<footer data-part="footer">` | n/a |

Bare-element defaults only where always valid: `<ui-media> img`, and `h2–h6` inside
`<ui-content>` get the headline ramp.

**Deferred:** price, rating, recipe steps, event date-range, job salary, statistic trend,
poll, comparison, gallery grid, ribbon/sticker → additive per-type CSS later. Schema.org →
markup/JS layer, orthogonal to this stylesheet.

---

## Layout engine (variants)

Arrangement: *(none)*=`vertical`, `vertical-r`, `horizontal`, `horizontal-r`, `media-only`,
`content-only`, `overlay(pos)` with 9 positions `tl tc tr · cl cc cr · bl bc br`.

Modifiers: `ar(…)` → `--ui-card-ar`; `op(tl…br)` → `--ui-card-op`; `fs(sm|md|lg|xl)` →
`--ui-card-fs`; `split(…)` → horizontal column ratio; `sq(sm|md|lg|xl)` → superellipse corners.

Grid-root indirection makes import work: shared rules target the *items*
`:where([variant]) :is(ui-media, ui-content)`; each host owns the one rule that makes its
container `display:grid` (the host inner box for `<ui-card>`; `<summary>`/`<ui-face>` for reveal).

Responsive: `variant-md` / `variant-lg` apply tokens above container widths (needs `<cq-box>`).

---

## Font scale

One root `--ui-card-fs`; parts derive by ratio. Container-query units so a wide card grows.

```css
:where([variant]) {
  --ui-card-fs: var(--ui-card-fs-md);
  --ui-card-fs-sm: clamp(0.80rem, 0.72rem + 0.8cqi, 0.95rem);
  --ui-card-fs-md: clamp(0.90rem, 0.80rem + 1.2cqi, 1.10rem);
  --ui-card-fs-lg: clamp(1.00rem, 0.84rem + 2.0cqi, 1.35rem);
  --ui-card-fs-xl: clamp(1.15rem, 0.90rem + 4.0cqi, 2.25rem);
}
:where([variant~="fs(sm)"]) { --ui-card-fs: var(--ui-card-fs-sm); }
:where([variant~="fs(lg)"]) { --ui-card-fs: var(--ui-card-fs-lg); }
:where([variant~="fs(xl)"]) { --ui-card-fs: var(--ui-card-fs-xl); --ui-card-headline-ratio: 2.2; }

[data-part="eyebrow"]     { font-size: calc(var(--ui-card-fs) * 0.78); }
[data-part="subheadline"] { font-size: calc(var(--ui-card-fs) * 0.88); }
[data-part="headline"], ui-content :is(h2,h3,h4,h5,h6) {
  font-size: calc(var(--ui-card-fs) * var(--ui-card-headline-ratio, 1.6));
}
[data-part="summary"] { font-size: var(--ui-card-fs); }
[data-part="caption"], [data-part="meta"] { font-size: calc(var(--ui-card-fs) * 0.75); }
```

`fs(xl)` on a ~1200px hero → headline ~4.5–5rem; same markup in a 3-up grid → ~2.5rem.

---

## Tokens & ui-reveal aliasing

`ui-card` owns `--ui-card-*` (bg, radius, shadow, p, row-gap, ar, op, overlay-gradient,
overlay-ink). After `@import`, reveal aliases its names to keep existing markup working:

```css
:where(ui-reveal) {
  --ui-reveal-bg: var(--ui-card-bg);
  --ui-reveal-radius: var(--ui-card-radius);
  --ui-reveal-p: var(--ui-card-p);
  /* reveal-only stay: --ui-reveal-icon-*, --ui-reveal-duration, etc. */
}
```

Reveal keeps only `<details>/<summary>` wiring, `<ui-icon>`, `<ui-face>`, and `type`
animations. The overlay/ar/op blocks currently in `ui-reveal.css` are deleted and inherited.

---

## Implementation sequence

1. Write `ui/card/ui-card.css` — surface → engine → fs() scale → common parts.
2. Build `ui/card/index.html` demo; verify every variant CSS-only.
3. Refactor `ui-reveal.css` → `@import` + aliases, delete shared blocks.
4. Verify `ui/reveal/index.html` parity (flip/slide/scale/expand).
5. `package.json` + `readme.md`.
