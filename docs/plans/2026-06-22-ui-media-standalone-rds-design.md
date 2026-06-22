# `rds()` for standalone `<ui-media>` — design

> Branch: `v4` · Status: **planned** (investigation only; not implemented)
> Extends the ui-media/ui-content split (`docs/plans/2026-06-20-ui-media-content-split-design.md`).

## Goal

Let a **standalone `<ui-media>`** (used without a `<ui-card>`/`<ui-reveal>` wrapper)
take a corner radius via `rds()` in its `media=` string — including the bespoke
`-sq` squircle modifiers — **without duplicating** the `rds()` value map that
already exists for the card, and **without** changing how `rds()` behaves on the
card today.

## Context / findings

- `rds()` currently lives only in `ui-card.css`, matches `variant~="rds(…)"`, and
  writes `--ui-card-radius`. The card host applies `border-radius` + already has
  `overflow:hidden`, so it rounds the **card** regardless of whether `<ui-media>`
  is shown (`vis(content)`, no media at all, etc.). **This must stay unchanged.**
- `<ui-media>` **already has `overflow: hidden`** (media.css frame base). The image
  is `position:absolute; inset:0`, so a `border-radius` on the frame clips for free
  — standalone radius needs only a `border-radius` line + a token.
- The parse layer (asr/obp/obf/flp/scm/themes) already works standalone because it
  sets **inheriting custom properties**. `rds()` is different: it must NOT inherit
  into a nested `<ui-media>` (that would round the media's corners inside a `col`
  card — a visual regression).

## Two independent radius paths

| Case | What rounds | Token |
|--|--|--|
| `<ui-card variant="rds(lg)">` (with media) | the card | `--ui-card-radius` |
| `<ui-card variant="rds(lg) vis(content)">` (no media shown) | the card | `--ui-card-radius` |
| `<ui-card variant="rds(lg)">` (no `<ui-media>` at all) | the card | `--ui-card-radius` |
| `<ui-media media="rds(lg)">` standalone | the media | `--ui-media-radius` |

The card path is untouched. The media path is new and isolated via a
**non-inheriting** `--ui-media-radius`.

## Plan (the gotcha + the fix)

Custom props inherit. If `rds()` on a card also writes `--ui-media-radius`, that
would inherit into a nested `<ui-media>` and round it. Fix: register
`--ui-media-radius` with `inherits: false` so a card's `rds()` stays on the card
and never reaches the inner media; a standalone `<ui-media media="rds(…)">` lands
the token on itself.

One shared `rds()` rule-set matches **both** `variant=` (card) and `media=`
(standalone media) and writes **both** tokens. Squircle adds `corner-shape` via a
selector that matches whichever element owns the `-sq` radius.

## Changes

### 1. `ui/card/media.css` — register the media radius token (non-inheriting)
```css
@property --ui-media-radius {
	syntax: "<length-percentage>";
	inherits: false;
	initial-value: 0;
}
```

### 2. `ui/card/media.css` — one line in the frame base (`0` = today's square look)
```css
:where(ui-media) {
	aspect-ratio: var(--ui-media-ar, auto);
	background: var(--ui-media-bg, var(--color-overlay-light, transparent));
	border-radius: var(--ui-media-radius, 0);   /* NEW */
	display: grid;
	min-block-size: var(--ui-media-min, 12.5rem);
	overflow: hidden;                            /* already present → clips the radius */
	position: relative;
	/* … img/video unchanged … */
}
```

### 3. `ui/card/media.css` — move `rds()` here, match BOTH attributes, write BOTH tokens
```css
/* CORNERS — rds(): round (global scale) or -sq (bespoke squircle).
   Matches variant= (card host) AND media= (standalone <ui-media>); writes both
   radius tokens. --ui-media-radius is inherits:false, so a card's rds() never
   rounds a nested <ui-media>. */
:where([variant~="rds(none)"], [media~="rds(none)"]) { --ui-card-radius: 0;                        --ui-media-radius: 0; }
:where([variant~="rds(sm)"],   [media~="rds(sm)"])   { --ui-card-radius: var(--radius-sm);         --ui-media-radius: var(--radius-sm); }
:where([variant~="rds(md)"],   [media~="rds(md)"])   { --ui-card-radius: var(--radius-md);         --ui-media-radius: var(--radius-md); }
:where([variant~="rds(lg)"],   [media~="rds(lg)"])   { --ui-card-radius: var(--radius-lg);         --ui-media-radius: var(--radius-lg); }
:where([variant~="rds(xl)"],   [media~="rds(xl)"])   { --ui-card-radius: var(--radius-xl);         --ui-media-radius: var(--radius-xl); }
:where([variant~="rds(2xl)"],  [media~="rds(2xl)"])  { --ui-card-radius: var(--radius-2xl);        --ui-media-radius: var(--radius-2xl); }
:where([variant~="rds(full)"], [media~="rds(full)"]) { --ui-card-radius: var(--radius-circle, 50%);--ui-media-radius: var(--radius-circle, 50%); }
:where([variant~="rds(pill)"], [media~="rds(pill)"]) { --ui-card-radius: var(--radius-pill, 100px);--ui-media-radius: var(--radius-pill, 100px); }
/* squircle — bespoke radius + per-size exponent (drives corner-shape below;
   --ui-card-squircle-exp is also read by ui-reveal for its <details>) */
:where([variant~="rds(sm-sq)"], [media~="rds(sm-sq)"]) { --ui-card-radius: 1.25rem; --ui-media-radius: 1.25rem; --ui-card-squircle-exp: 1.5; }
:where([variant~="rds(md-sq)"], [media~="rds(md-sq)"]) { --ui-card-radius: 2rem;    --ui-media-radius: 2rem;    --ui-card-squircle-exp: 1.7; }
:where([variant~="rds(lg-sq)"], [media~="rds(lg-sq)"]) { --ui-card-radius: 2.8rem;  --ui-media-radius: 2.8rem;  --ui-card-squircle-exp: 1.8; }
:where([variant~="rds(xl-sq)"], [media~="rds(xl-sq)"]) { --ui-card-radius: 3.5rem;  --ui-media-radius: 3.5rem;  --ui-card-squircle-exp: 2; }
/* superellipse on whichever element owns the -sq radius (card host or standalone media) */
:where(ui-card[variant*="-sq)"], ui-media[media*="-sq)"]) { corner-shape: superellipse(var(--ui-card-squircle-exp, 1.8)); }
```

### 4. `ui/card/ui-card.css` — delete its current `rds()` block (~lines 42–57)
Now lives in media.css (which ui-card.css `@import`s). The card host rule is
unchanged — still `border-radius: var(--ui-card-radius)` + `overflow:hidden`.

## Why squircle is correct in both holders
- **Card** `variant="rds(md-sq)"` → `--ui-card-radius:2rem` + `--ui-card-squircle-exp:1.7` on the card; `ui-card[variant*="-sq)"]` applies `corner-shape`. Same as today.
- **Standalone** `media="rds(md-sq)"` → `--ui-media-radius:2rem` + `--ui-card-squircle-exp:1.7` on the media; `ui-media[media*="-sq)"]` applies `corner-shape`; frame reads `--ui-media-radius`.
- **Nested media in a card with `rds(md-sq)`**: card sets `--ui-media-radius` on itself but `inherits:false` keeps it off the inner media, and the inner media lacks `media*="-sq)"` → no `corner-shape`. No leak.

## Caveats (cosmetic, not blockers)
- **Carousel**: a `nav` `ui-media` is `overflow-x:auto` (scroller). With a radius it
  rounds vertically and clips the scroll edges — looks fine, just note it.
- **Default** `--ui-media-radius: 0` ⇒ zero visual change to anything existing;
  radius only appears when `rds()` is added / the token is set.

## Verification (when implemented)
1. `<ui-media media="rds(lg)">` standalone → rounded corners; `rds(md-sq)` →
   squircle (`corner-shape` applied; check computed `border-radius` + `corner-shape`).
2. `<ui-card variant="rds(lg)">` with media, with `vis(content)`, and with no
   `<ui-media>` → card rounds in all three; inner media stays square.
3. Grep demos: no regression in existing `rds()`/squircle cards.
4. Playwright screenshot of a standalone rounded + squircle `<ui-media>`.

## Effort
~15 lines moved + 1 `border-radius` line + 1 `@property`. Small, no duplicated
value map.
