---
name: add-card
description: Use when authoring or editing <ui-card>, <ui-media>, <ui-content> or <ui-reveal> markup, or card JSON instances — choosing variant=/media=/content=/theme= tokens, overlay furniture (chip, sticker, beacon, save, play, lightbox, marquee), data-part content, presets — and whenever a card token appears to have no effect.
argument-hint: <what you want, e.g. "horizontal product card, save top-right">
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, AskUserQuestion
---

# Authoring a card

A card is one act of composition: a host, a frame, a column. Three token DSLs configure it.

```html
<ui-card variant="col lg:row lg:spl(1/1)" media="asr(16/9) chip(ts)" content="pad(md) hl(lg)" theme="slate">
  <cq-box>
    <ui-media>
      <img src="…" alt="">
      <ui-chip>Live</ui-chip>
    </ui-media>
    <ui-content>
      <small data-part="eyebrow">Section</small>
      <h3 data-part="headline">Headline</h3>
      <p data-part="summary">Summary text.</p>
    </ui-content>
  </cq-box>
</ui-card>
```

`<cq-box>` is **hand-authored and never auto-inserted** — a container cannot query its own
size, so it is the measurable descendant the `md:`/`lg:` rules target. Omit it and every
responsive token silently stops working.

Architecture and pitfalls: `ui/card/AGENTS.md` (the master map — its doc-map table routes
you to the right reference). Do not reconstruct any of that here.

## Token discipline — never invent a token

The vocabulary is a manifest: `ui/card/data/tokens.json`, rendered to
**`ui/card/docs/tokens.md`** (generated — read it, never edit it). Hand-written markup is
**not linted**, so a misspelled token is silently dead CSS. Grep before writing:

```bash
grep -n '"asr"\|"chip"\|"hl"' ui/card/data/tokens.json     # does this stem exist?
grep -n 'scl(' ui/card/docs/tokens.md                      # what args does it take?
```

| Attribute | Sits on | Reference |
|---|---|---|
| `variant=` | the **host** only (`ui-card` / `ui-reveal`) — arrangement, split, overlay, radius, border, shadow | `ui/card/docs/ui-card-tokens.md` |
| `media=` | the frame, or a host (inheritance **stops at the card host**) — aspect, fit, hover, tint, scrim, furniture placement, carousel | `ui/card/docs/media.md` |
| `content=` | the column, or any ancestor (plain custom-property inheritance, flows freely) — padding, gap, typography, width, alignment | `ui/card/docs/content.md`, `typography.md` |
| `theme=` | any element — the nine-hue axis | `DESIGN.md` § Theme bundles |

## Responsive: containers, not the viewport

`md:` = `@container bs-card (inline-size >= 25rem)`, `lg:` = `>= 44rem` — measured on the
**card's own width**, not the window. A card in a narrow grid column never reaches `lg:` on
any monitor. This is the number one "why doesn't my token apply" report.

`<ui-reveal>` joins the same `bs-card` namespace and uses `<summary>` as its queryable
descendant instead of `<cq-box>`. A standalone `<ui-media>`/`<ui-content>` opts in with
`<div style="container: bs-card / inline-size">`.

## Furniture — the 3×3 logical grid

Placement is a `media=` token on the frame or its host, spelled `element(cell)` with cells
`ts tc te / cs cc ce / bs bc be` (top/center/bottom × start/center/end — they mirror in
RTL). One value per token: `chip(ts)`, never `chip(ts red)`.

| Element | Package | Default cell | Kind |
|---|---|---|---|
| `<ui-chip>` | `ui/chip` | `ts` | marker |
| `<ui-beacon>` | `ui/beacon` | `ts` | marker |
| `<ui-sticker>` | `ui/sticker` | `te` | marker |
| `<ui-save>` | `ui/save` | `te` | **control** |
| `<ui-play>` | `ui/play` | `cc` | **control** |
| `<ui-lightbox>` | `ui/lightbox` | `bs` | **control** |
| `<ui-marquee>` | `ui/marquee` | band, `marquee(top\|bot)` | band (z-index below furniture) |

Markers are valid inside a reveal `<summary>`; **controls are card-only** (interactive
content cannot nest in `<summary>`). Each furniture element needs its **package CSS loaded**
— they are optional peers, not part of `ui-card.css`. On demo pages that comes from the
demo bundle; on a standalone page add the `<link>`.

## Content parts

Style keys off `[data-part]`, never the tag — so the same part renders identically as `<b>`
in a `<summary>` and `<h2>` in a panel. Parts in use: `eyebrow headline subheadline summary
meta caption byline byline-who dateline jobTitle tags actions footer cover price rating list
links address hours office stat timeline quote options`. Padding precedence is the `var()`
chain, not the cascade: **side > axis > all** (`pbs()` beats `pb()` beats `pad()`).

## Markup or JSON?

- **Hand-written markup** — demos, pages, one-offs. No gates, no lint; verify in a browser.
- **UCF JSON + `render.js`** — anything data-driven. Instances live in `ui/card/data/*.json`
  validating `cms/baseline/models/card.schema.json`, with looks in a preset
  (`data/card.presets.json`). Adding one means registering it in `data/index.json` and the
  SSR snapshot gate applies (`node ui/card/render.snapshot.js`). For a **new schemaType**,
  use the `add-schema` skill instead.

## Verify

Serve on a fresh port, then check both sides of the 25rem/44rem tiers by resizing the card's
**container** (not just the window), and check the console. If the page links the demo
bundle, a raw-sheet edit needs the `demo-css` dev loop first.

## Sharp edges

- **`variant="sub"` inside a subgridded `<lay-out>`** dissolves `<cq-box>` and
  `<ui-content>` with `display: contents`: their padding and gap disappear (rhythm comes
  from the layout's `rg()`), and the card's own `md:`/`lg:` container tiers are suspended
  while the flag is on. `<ui-reveal>` does not support it.
- **Adding a token to `media=` on the host does not reach nested frames** — `media=`
  inheritance stops at the nearest `ui-card`/`ui-reveal`. Per-slide overrides go on the
  nested `<ui-media>`.
- **`<ui-marquee>`'s position token needs an ancestor holder** — put `marquee(bot)` on the
  `<ui-card>`, not on the `<ui-media>`.
- **In a `nav` scroller, `<ui-lightbox>` must be the first child**, before the slides — it
  is sticky-pinned, same contract as a sticky `<ui-play>`.
- Only `<ui-media>` is registered by the card package itself; the furniture packages ship
  optional registering scripts, and no card demo loads one. CSS alone is enough.
