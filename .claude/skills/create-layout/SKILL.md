---
name: create-layout
description: Use when a page needs a grid arrangement no existing layout variant provides — adding a new variant id to a layouts/*.json file, or creating a whole new layout family with its own prefix, icon and demo page in the layout build system.
argument-hint: <the arrangement, e.g. "hero: 2fr 1fr, third item full-width">
allowed-tools: Read, Edit, Write, Bash, Glob, Grep, AskUserQuestion
---

# Creating a new layout

## 0. Check it does not already exist

64 variants ship across 9 files. Read `layout/AGENTS.md` § *Available Layouts (Complete)*
before authoring anything — `ratio()`, `asym()` and `grid()` between them already cover most
two- and three-column asks. A new variant is justified by a genuinely new **arrangement**,
not by a breakpoint or gap difference (those are config and spacing tokens).

## 1. Choose a home

- New arrangement in an existing family → add an entry to that file's `layouts[]` array.
- New family → new `layout/layouts/<name>.json` with `name`, `prefix`, `desc`, `layouts[]`.
  The `prefix` becomes the token stem; the **filename** is what `layout.config.json`
  references. Keeping them equal avoids the `asymmetrical`/`asym` confusion already in the
  repo.

## 2. Author the variant

```jsonc
{
  "id": "1",                        // token becomes hero(1); "*" = wildcard (stack only)
  "description": "Wide main, narrow aside",
  "columns": "2fr minmax(0, 1fr)",  // --layout-gtc
  "rows": "auto",                   // --layout-gtr (optional)
  "items": 2,                       // demo item count; ALSO --_ci for columns/lanes prefixes
  "srcset": "66.67%,33.33%",        // per-item widths, feeds layouts-map.js
  "repeatable": true,               // demo appends greyed repeat items
  "icon": [                         // 0-100 viewBox rects, one per item
    { "w": 66.67, "h": 100, "x": 0,     "y": 0 },
    { "w": 33.33, "h": 100, "x": 66.67, "y": 0 }
  ],
  "breakpoints": { "md": "columns(1)", "lg": "hero(1)" },   // DEMO PAGE HINT ONLY
  "rules": [
    { "selector": "*:nth-child(3)", "properties": { "--layout-ga": "1 / -1" } }
  ]
}
```

`rules[].selector` resolution: `&` / `root` / `lay-out` → the base selector itself; `&>*` →
`<base> > *`; any other `&…` → appended to the base; anything else → `<base> > <selector>`.
The house convention is `*:nth-child(An+B)` writing `--layout-ga` (139 of the 160 shipped
rules do exactly that).

Icons are generated from the rect array by `src/icons.js` — there is no hand-drawn SVG.
`gap: 2` and `rx: 4` are applied for you; add `"class": "light"` for greyed placeholder
tiles.

## 3. Register it in the config — without this, no CSS is generated

```jsonc
"breakpoints": { "lg": { "layouts": [ …, { "hero": ["hero(1)"] } ] } }
```

The object key is the **JSON filename**. A layout absent from the config produces no rule at
all, and markup using it is a silent no-op.

## 4. Build

```bash
cd layout && npm run build:all      # maps -> CSS -> demos -> icons
```

## 5. Wire up the demo index

Add the family to `INDEX_GROUPS` in `layout/src/demo.js` or the generated page lands in an
"Other — not yet grouped" bucket on `dist/index.html`.

## 6. Verify

```bash
grep -c '\[lg\*="hero(1)"\]' layout/dist/layout.css   # the rule exists
ls layout/dist/icons/'hero(1).svg'                    # icon generated
open layout/dist/hero.html                            # demo page renders
```

## Sharp edges

- **`equalTracks()` only runs for the `columns` prefix.** It rewrites standalone `1fr` to
  `minmax(0, 1fr)` so one wide item cannot blow out a track. Any other prefix gets your
  track list verbatim — **write `minmax(0, 1fr)` yourself**, or a long word / wide image in
  one cell steals width from its siblings.
- **Selectors are substring matches** (`[lg*="hero(1)"]`). The closing paren keeps `hero(1)`
  from matching `hero(1a)`, but a new id must never be a full substring of another id in the
  same family. Grep the built CSS for the new needle to confirm it matches only what you
  intend.
- **`breakpoints` inside a layout JSON is demo-only.** It writes the demo page's markup and
  its `srcsets`; it has zero effect on which CSS is generated. Only `layout.config.json`
  decides that.
- **`srcset` must have one width per item** or the generated `sizes` attributes drift out of
  step with the real grid.
- **New lanes-family variants must keep both `@supports` arms agreeing** — the
  `column-count` fallback mirrors `floor((W + gap) / (min + gap))` including the `10rem`
  `--layout-lanes-min` default. Safari has `display: grid-lanes`; Chromium has no masonry at
  all, so both paths are live in the wild.
- Registering a family at the base breakpoint means it also needs `srcsetMin` there for
  `build:maps` (see the `build-layout` skill).
