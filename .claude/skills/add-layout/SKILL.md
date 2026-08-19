---
name: add-layout
description: Use when placing or editing <lay-out> or <lay-out-group> markup — choosing a grid pattern (columns, grid, bento, mosaic, asym, ratio, lanes, auto, stack), breakpoint attributes, spacing tokens, bleed, subgrid, or overflow/carousel controls — and whenever a layout or spacing token appears to have no effect at some breakpoint.
argument-hint: <what you want, e.g. "3-col grid at lg on ui/card/index.html">
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, AskUserQuestion
---

# Adding a layout to a page

`<lay-out>` CSS is **generated**, not hand-written. `layout/dist/layout.css` contains only
the layout/spacing tokens that `layout/layout.config.json` told the builder to emit, at the
breakpoints it named. Markup only *selects* from what exists.

**A token the config never generated is a silent no-op** — no console error, no warning,
just an element that ignores the attribute. That is why step 2 below is not optional.

Reference for the vocabulary (do not duplicate it here): `layout/AGENTS.md` — the complete
variant catalog, spacing table, subgrid, `items()`, overflow + `media=` carousel tokens,
animations, browser quirks. Attribute-level reference: `layout/core/base.md`.

## 1. Resolve the request to tokens

Pick `prefix(id)` from `layout/AGENTS.md` § *Available Layouts (Complete)*: `columns(1..6)`,
`grid(3a…6b)` (19), `bento(4a…9b)` (10), `mosaic(photo|scatter|hex|pinwheel|cornerstone)`,
`asym(l-r|r-l|t-b|b-t|tl-br|bl-tr)`, `ratio(25:75|33:66|40:60|60:40|66:33|75:25|25:25:50|25:50:25|50:25:25)`,
`auto(fit|fill)`, `lanes(2..6|auto)`, `stack(<any-name>)`.

Check the child count against the variant's `items` in `layout/layouts/<file>.json` — a
`grid(3a)` with five children repeats the pattern rather than failing.

Breakpoint attributes: `xs` (240, the un-media-queried mobile-first base), `sm` 380,
`md` 540, `lg` 720, `xl` 920, `xxl` 1140 — **viewport** media queries. (Card `md:`/`lg:`
prefixes are *container* queries. Different axis; never mix them up.)

## 2. Config-coverage check — MANDATORY, before writing any markup

Resolve the effective config: an explicit `--config` path → `layout.config.json` in the
project directory → the package default `layout/layout.config.json`.

For **each** token at **each** breakpoint you intend to write:

| Token kind | Generated when |
|---|---|
| Layout `prefix(id)` | `breakpoints.<bp>.layouts` lists the family as a string (all variants) **or** an object entry names it: `{ "grid": ["grid(3a)"] }` |
| Spacing `p/pi/pb/pbs/pbe/mbs/mbe/cg/rg(N)` | `<bp>` is in `spacing.breakpoints` (**shipped: `["xs","lg"]` only**) and `N` is in `spacing.steps` |
| `items(start\|center\|end\|stretch)` | always — generated for every breakpoint |
| bare `subgrid` | `md` and larger only |

**The object key is the JSON *filename*, not the prefix.** `asymmetrical` → `asym(…)`,
`autofit` → `auto(…)`, `ratios` → `ratio(…)`. Writing `{"asym": [...]}` silently generates
nothing.

Quick verification against the built CSS — the ground truth:

```bash
grep -c 'lay-out\[lg\*="grid(3a)"\]' layout/dist/layout.css     # layout token at a breakpoint
grep -c 'lay-out.*\[md\*="cg(' layout/dist/layout.css           # spacing tokens at md
```

## 3. On a miss — STOP and ask

Do **not** write the token and hope. Use `AskUserQuestion` with these options:

- **Add it to the config and rebuild** — add the family/variant under that breakpoint (or
  the breakpoint to `spacing.breakpoints`), then `cd layout && npm run build`. Costs bundle
  size for every consumer. Hand off to the `build-layout` skill for the build and for
  pruning decisions.
- **Use a token that is already generated** at that breakpoint.
- **Author the spacing at a generated breakpoint** — values persist upward through the
  cascade, so `xs="cg(sm)"` already governs `md` unless a larger generated breakpoint
  overrides it.

## 4. Write the markup

```html
<body data-layout-root data-page-gap="3">
  <lay-out-group bleed xs="pbs(3) pbe(3)" style="--layout-bg:#eaf6e9">
    <ui-content>
      <small data-part="eyebrow">Our work</small>
      <h2 data-part="headline">World-class ideas</h2>
      <a data-part="link" href="/work">View all →</a>
    </ui-content>
    <lay-out md="columns(2)" lg="grid(3a) items(start)"> …cards… </lay-out>
  </lay-out-group>
</body>
```

- Multiple tokens live in one attribute, space-separated; selectors are substring matches,
  made collision-safe by the closing paren (`cg(2)` never matches `cg(2xs)`).
- `data-layout-root` goes on the element that **directly contains** the top-level
  `<lay-out>`s (`<body>`, or `<main>` if the sections live inside one) — `row-gap` only
  reaches direct children.
- `bleed` and `--layout-bg` belong on the `<lay-out-group>`; the inner `<lay-out>` must
  **not** repeat them.
- Header typography inside `<lay-out-group>` comes from the card package — the page must
  load `ui/card/ui-card.css` too.

## 5. Verify

Rebuild only if the config changed (`cd layout && npm run build`). Then serve the repo on a
**fresh port** and check both sides of every breakpoint you touched. If the page links the
demo bundle rather than `layout/dist/layout.css`, see the `demo-css` skill.

## Sharp edges

- **`xl="lanes(4)"` is the canonical trap, and it diverges by engine.** The config generates
  `lanes` for `sm`/`md`/`lg` only, but the `@supports` selectors in `core/base.css` match all
  six breakpoint attributes — so at `xl` masonry switches on with no track list. Measured:
  **Safari renders 1 lane, Chromium renders 4 columns.** (`--layout-gtc` is always set by its
  typed-`attr()` default, so the `var(--layout-gtc, repeat(var(--_ci,4),1fr))` fallback is
  dead code and Safari gets a one-track list; the Chromium arm reads `column-count:
  var(--_ci, 4)`, and `--_ci` genuinely is unset.) Developing in Chrome, the ungenerated
  token looks like it works and ships broken to Safari. Config-check first.
  Related: a preceding token leaks into it — `lg="columns(3)" xl="lanes(4)"` yields 3 lanes,
  because `columns(3)` set `--_ci: 3`.
- **`media=` on a `<lay-out>` configures only that layout's own scroller.** It never
  inherits into `<ui-media>` inside cards (`media=` stops at the nearest card host).
  `content=` is plain custom-property inheritance and does flow down.
- **`subgrid` is one-way.** There is no off token: `@media (min-width)` is cumulative, so
  once a breakpoint commits to shared rows, every larger one keeps them. Cards inside want
  `variant="sub"` (see the `add-card` skill) — and that suspends the card's own container
  tiers while active.
- **`<lay-out>` is not a container query container.** It sets `contain: layout inline-size`,
  which is containment, not `container-type`. `<lay-out-group>` *is* one, named `bs-card`.
- Typed `attr()` (`bleed`, `columns`, `rows`, `max-width`, `self`, `size`, `lanes-min/max`)
  has no fallback in Safari/Firefox without `layout/polyfills/attr-fallback.js`. A page
  using both `<lay-out>` and cards needs **both** polyfill scripts.
