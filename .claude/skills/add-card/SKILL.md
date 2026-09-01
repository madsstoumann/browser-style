---
name: add-card
description: Use when authoring or editing <ui-card>, <ui-media>, <ui-content> or <ui-reveal> markup, or card JSON instances — choosing variant=/media=/content=/theme= tokens, overlay furniture (chip, sticker, beacon, save, play, lightbox, marquee), data-part content, icon markers on lists and rows, presets — and whenever a card token or an icon appears to have no effect.
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
meta caption byline byline-who dateline reading-time verified key count jobTitle tags actions
footer cover price rating list links address hours office stat timeline quote options`. Padding
precedence is the `var()` chain, not the cascade: **side > axis > all** (`pbs()` beats `pb()`
beats `pad()`).

## Icons — two placements, one closed vocabulary

Icons are glyphs from a **generated webfont** (`@browser.style/icon`), not SVGs and not
per-icon CSS. One catalog, two ways to place a glyph:

| Placement | Where | How |
|---|---|---|
| `::marker` | list rows and whole lists | `data-icon` → `list-style-type` |
| `::before` | inline text (contact links, counters, dateline, verified mark) | `content: var(--icon) / ""` |
| `::before` / `::after` | a `.ui-button` CTA — `data-icon`, `data-icon-at="end"` for a chevron | `content: var(--icon) / ""` (base/button.css) |

```html
<ul data-part="list" data-icon="album">          <!-- one glyph for the whole list -->
  <li>Slow Weather <small>EP · 2026</small></li>
</ul>

<ul data-part="list">                             <!-- a glyph per row -->
  <li data-icon="king-bed">2 × Queen</li>
  <li data-icon="bathtub">2 bathrooms</li>
</ul>

<ul data-part="list" data-variant="checked">…</ul>   <!-- ✓ mark, included items -->
<ul data-part="list" data-variant="crossed">…</ul>   <!-- ✗ mark, excluded, muted rows -->
```

A row-level `data-icon` beats a list-level one, so a list default can be overridden per row.

**Which one to reach for:**

- rows **differ in kind** (amenities, bed types, contact methods, a service catalog) → per-row `data-icon`
- rows are **uniform assertions** (features, outcomes, qualifications) → list-level `data-variant="checked"` / `"crossed"`
- rows are uniform but not assertions (episodes, a discography) → list-level `data-icon`
- rows are **ordered and the number means something** (tracks, seasons, how-to steps) → no icon

**All-or-nothing per list.** `li[data-icon]` sets `list-style-type` while a sibling without
one falls through to the list's `disc`, so partial coverage renders mixed markers. If only
one row has an honest glyph, the list gets none — or gets a list-level mark instead.

## Icons — the rules that bite

- **The name is a closed vocabulary.** Kebab-case in markup, underscore in the manifest:
  `square_foot` → `square-foot`. **An unknown name is silently inert** — the row just falls
  back to a bullet, no error. Grep the manifest before writing one:
  `grep '"square_foot"' ui/icon/icons.json`.
- **The sheet is opt-in.** `ui/icon/index.css` does not import `icon-font.css`; a page adds
  its own `<link>`. The card demo bundle already has it. Without it, rows fall back cleanly.
- **Generated content lands in the accessible name.** A `::before` icon **must** carry the
  alt-text arm `content: var(--icon) / ""`, or the private-use codepoint is announced. A
  `::marker` never does — which is why two contact methods are a `<ul>`, not a `<br>`-split
  `<p>`. Prefer the marker whenever the thing is a list.
- **Never fix icon alignment in CSS.** `::marker` drops `vertical-align`, `transform`,
  `mask` and `background` (measured, Chrome 150). The ~0.17em optical correction is baked
  into the glyph outlines by `icons.build.py`. There is no CSS lever.
- **`checked` / `crossed` ink is a page token, not a theme token.** `--color-success` /
  `--color-error` do not follow `theme=`; on `theme="green"` the ✓ is invisible. Set
  `--ui-content-list-checked-mark` / `--ui-content-list-crossed-mark` on a themed card.
  Open-items #37.

**Adding a glyph** (needs `python3 -m pip install fonttools brotli`):

```bash
# 1. add the Material Symbols name to ui/icon/icons.json  (underscore spelling)
cd ui/icon && npm run build:icons        # regenerates icon-font.css + icons.data.js
cd - && npm run build:demo-css           # the demo bundle inlines the font
node --test ui/card/render.test.js       # § icon markers is the sync gate
```

The build is deterministic — run it twice and `git status` stays clean. Both artifacts are
committed; `icons.data.js` (`export const ICON_NAMES`) is what feeds a CMS dropdown, so an
editor can never offer a name the font lacks.

In JSON, a list row is a string **or** `{text, icon, href, itemprop}` — see
`ui/card/docs/card.model.md` § list item. Details: `ui/card/docs/content.md` § Icon markers,
`ui/icon/readme.md` § Icon font.

## Markup or JSON?

- **Hand-written markup** — demos, pages, one-offs. No gates, no lint; verify in a browser.
- **UCF JSON + `render.js`** — anything data-driven. Instances live in `ui/card/data/*.json`
  validating `cms/baseline/models/card.schema.json`, with looks in a preset
  (`data/card.presets.json`). Adding one means registering it in `data/index.json` and the
  SSR snapshot gate applies (`node ui/card/render.snapshot.js`). For a **new schemaType**,
  use the `add-schema` skill instead.
- **Shared detail rows** — in a ref-enabled `details` array (faq items, product variants,
  podcast episodes, places rows — the generated table in `docs/card.model.md` § Referenced
  rows), don't restate another card's facts by hand: write `{ "$ref": "card/<id>" }` with
  per-context keys inline, and register a referenced-only card under `data/index.json`
  `shared`. `node ui/card/details.lint.js` holds every ref.

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
