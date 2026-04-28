# ui-accordion — internal architecture

Partner reference: [ui/tabs/AGENTS.md](../tabs/AGENTS.md). Changes to the mode-gate contract must stay in lock-step across both components.

## Contract

- Inner structure: `<ui-accordion> > <cq-box> > <details>…</details>`. Every rendering rule assumes a `<cq-box>` wrapper and is scoped to it.
- `<ui-accordion>` is the size container: `container-type: inline-size` + `display: block` on the host. `display: block` is *required* — custom elements default to `display: inline`, and `container-type` is a no-op on inline boxes.
- All tokens (`--ui-accordion-*`) and the derived locals (`--_bd`, `--_bb`, `--_render: accordion`) are declared on `:where(ui-accordion)` at zero specificity, so consumers can override with any class or inline style.

## The `--_render` gate

`--_render` is a plain inherited custom property (no `@property` registration). Two values:

- `accordion` — accordion renders.
- `tabs` — tabs render (provided by `@browser.style/tabs`).

Every non-setup rule sits inside one of two `@container` blocks:

```css
@container style(--_render: accordion) { /* accordion rendering */ }
@container (inline-size > 650px) and style(--_render: accordion) { /* horizontal + split */ }
```

Plus one asymmetric rule at `style(--_render: tabs)` that hides accordion-specific icons when the host is in tabs mode.

### Why no `@property` registration

String-equality `@container style(...)` queries work on plain unregistered custom properties — the comparison is against the computed (substituted) value as a string. Each component sets `--_render` to its own keyword on its host rule (`:where(ui-accordion) { --_render: accordion; }`, `:where(ui-tabs, [tabs]) { --_render: tabs; }`), and the gate matches by literal value. Loading either stylesheet alone is enough — the host always sets the property, so the query never falls back to the empty-string default.

A previous integer-based version of this gate (`--_tabs-mode: 0 | 1`) required `@property` registration in both files to ensure `style(--_tabs-mode: 0)` resolved correctly when only one stylesheet was loaded. The keyword version drops that coordination point entirely.

### Compound queries over nested

Where we need both size and style conditions (horizontal + split, and the render icon hider), we use a single compound query:

```css
@container (inline-size > 650px) and style(--_render: accordion) { … }
```

Not nested `@container` inside `@container` — nested queries have uneven support across browsers; compound queries resolve both conditions against the same ancestor container and work more reliably.

## `<auto-morph render="tabs">` wrapper

The responsive morph wrapper is its own package — [`@browser.style/auto-morph`](../auto-morph/readme.md). The accordion stays agnostic; it only reacts to `--_render` being flipped from above.

The package ships:

```css
auto-morph {
  container-type: inline-size;
  display: block;
}
@container (inline-size <= 650px) {
  auto-morph[render="tabs"] [tabs] { --_render: accordion; }
}
```

Design notes:

- `<auto-morph>` is a **generic unregistered element** — no JS, no customElement registration. Browsers treat it as `HTMLUnknownElement` and render inline by default; the stylesheet reclaims it as a block container.
- The **attribute *value*** (`render="tabs"`) names the morph target — the renderer that should engage above the breakpoint. Future modes (`render="nav"`, `render="menu"`, `render="density"`, …) plug in by adding paired rules.
- The **target selector is `[tabs]`**, not `ui-accordion`. Any host with the `tabs` attribute auto-morphs inside the wrapper — including a future `<ui-nav tabs>` or similar.
- The wrapper only needs **`container-type` one level above** `<ui-accordion>`. Any existing ancestor container (a grid cell, a `<main>`, a layout wrapper) works equally well; the auto-morph package is the convenience shorthand.

### Why a wrapper at all

`<ui-accordion>` has `container-type` set on itself so its own descendants (`cq-box`, `details`) can size-query it. But a container can't query its own size — that's a CSS spec rule, not a browser quirk. To flip `--_render` on `<ui-accordion>` based on `<ui-accordion>`'s own width, *some ancestor* must own the `@container` query. `<auto-morph>` is that ancestor.

Setting `container-type` on `body` technically works but applies size containment to the page root, changing how block-size resolves there — fragile across browsers, can strand sticky/fixed children. Don't.

## Nested accordions

Two concerns sit inside the accordion gate at the bottom of the `@container style(--_render: accordion)` block:

### Auto-adjust (unconditional)

When a `<ui-accordion>` is a descendant of another, three rule sets engage automatically:

```css
/* Strip border-radius on inner accordions via inherited token override */
ui-accordion cq-box ui-accordion {
  --ui-accordion-border-radius: 0;
}

/* Strip ALL borders on inner cq-boxes — outer's bordered frame paints onto every
   descendant cq-box (including nested non-bordered ones), so unconditionally drop them. */
ui-accordion[variant] cq-box ui-accordion cq-box { border: 0; }

/* Parent details containing a nested accordion: zero its inline padding,
   restore equivalent padding on its summary, and zero open-state block padding so the
   nested accordion butts against the parent's summary with no gap */
ui-accordion[variant] cq-box details:has(> ui-accordion) { padding-inline: 0; }
ui-accordion[variant] cq-box details:has(> ui-accordion) > summary {
  padding-inline: var(--ui-accordion-padding-inline);
}
:where(ui-accordion) cq-box details:has(> ui-accordion)[open]::details-content {
  padding-block: 0;
}

/* Nested divided accordion: when the parent is [open], draw the top divider on its summary.
   The [open] gate prevents doubling with the parent details' own border-block-end
   (from divided/bordered) which sits at the same Y position when the panel is closed. */
ui-accordion[variant] cq-box details:has(> ui-accordion[variant~="divided"])[open] > summary {
  border-block-end: var(--_bd);
}
```

Specificity notes:
- Border-radius reset is a **token override via inheritance**. The inner accordion's `:where(ui-accordion) { --ui-accordion-border-radius: 1ch }` has spec `(0,0,0)` (zeroed by `:where()`); the descendant override has `(0,0,3)` and wins for that element.
- Border-block-end resets use the inner accordion's own variant attribute selector to match the variant rule's specificity and beat it via source order. The inner-cq-box-bordered selector is `(0,1,4)` vs bordered variant's `(0,1,2)` — wins.
- Padding-inline reset uses `details:has(> ui-accordion)` and gates on the outer `[variant]` selector to match the variant rules' specificity. `:has()` is the structural detector — if a parent details has a `<ui-accordion>` as a direct child, the parent strips its own inline padding and the summary picks it up.

### `[indent]` (opt-in)

```css
@property --_indent-depth {
  syntax: "<integer>";
  inherits: true;
  initial-value: 0;
}

/* Set depth per nesting level via specificity-rising selectors.
   Each additional `cq-box ui-accordion` step bumps specificity, so deeper rules win for deeper elements. */
ui-accordion[indent] cq-box ui-accordion { --_indent-depth: 1; }
ui-accordion[indent] cq-box ui-accordion cq-box ui-accordion { --_indent-depth: 2; }
ui-accordion[indent] cq-box ui-accordion cq-box ui-accordion cq-box ui-accordion { --_indent-depth: 3; }
ui-accordion[indent] cq-box ui-accordion cq-box ui-accordion cq-box ui-accordion cq-box ui-accordion { --_indent-depth: 4; }

/* Zero details' inline-start padding in nested levels — let the summary control offset directly */
ui-accordion[indent] cq-box ui-accordion details {
  padding-inline-start: 0;
}

/* Indent: applied to summary, and to leaf details' non-summary content
   (parent-of-nested details' non-summary is the next ui-accordion, which must stay flush). */
ui-accordion[indent] cq-box ui-accordion details > summary,
ui-accordion[indent] cq-box ui-accordion details:not(:has(> ui-accordion)) > :not(summary) {
  padding-inline-start: calc((var(--_indent-depth) + 1) * var(--ui-accordion-padding-inline));
}
```

**Three components:**

1. **Depth counter** — set via specificity-rising selectors rather than an inheritance trick. The natural pattern (`--_indent-depth: calc(var(--_indent-parent) + 1); --_indent-parent: var(--_indent-depth)`) looks like it should work but creates a CSS custom-property cycle on the same element: both declarations reference each other, so both invalidate. Hardcoded depth values via increasingly specific selectors avoid the cycle entirely. The `@property` registration as `<integer>` keeps `calc()` math numeric. Initial value `0` covers the outermost accordion case (where no selector matches and the variable resolves to its initial).

2. **Zero details inline-start in nested levels** — the variant rules cascade `padding-inline: var(--ui-accordion-padding-inline)` onto every descendant `<details>`, which would stack with the new summary padding and put the text at the wrong offset. Zeroing `padding-inline-start` on nested details lets the summary's own padding own the offset directly.

3. **Indent rule** — targets two things:
   - **Summary** in any nested ui-accordion (always padded).
   - **Non-summary content** in *leaf* details only (`:not(:has(> ui-accordion))`). For parent-of-nested details, the non-summary content is the next ui-accordion's host element; padding it would shift the inner cq-box and its borders inline — exactly what we don't want. Excluding parent-of-nested keeps the nested accordion flush against the outermost edges.

**Multiplier formula:** `(depth + 1) × --ui-accordion-padding-inline`. With `--ui-accordion-padding-inline: 1.5ch` (default), the levels read:

- L1 summary: `1 × 1.5ch` (set by the variant rules themselves at outer level — depth-counter not used here).
- L2 summary: `2 × 1.5ch = 3ch`.
- L3 summary: `3 × 1.5ch = 4.5ch`.

Each level adds one full padding step over the previous, which reads cleanly as a hierarchy.

**Borders stay full-width** because the indent never lands on `cq-box`, on `<details>` itself, or on the nested accordion's host — only on summary text and leaf content. The `border-block-end` divider on `details:not(:last-of-type)` (from `divided`/`bordered`/`breakout`) spans the outermost accordion's full inline axis throughout.

To stop the staircase at a particular level: override `--ui-accordion-padding-inline: 0` on that accordion (inline style or class).

## File layout

```
ui/accordion/
  ui-accordion.css          Core styles — the gate, variants, types
  index.css                 Entry point (re-exports ui-accordion.css)
  index.js                  Web component (<ui-accordion>, <ui-accordion-item>)
  index.html                CSS-only demo page
  wc-demo.html              Web component demo page
  package.json              @browser.style/accordion
  readme.md                 Consumer-facing docs
  AGENTS.md                 This file
```

## Gotchas to preserve

- `display: block` on `:where(ui-accordion)` — removing it silently breaks container queries. See header note.
- `--_render: accordion` explicit declaration on `:where(ui-accordion)` — required; without it, the style query has no value to match against and the gate fails silently.
- Every variant/type rule targets `cq-box` (for layout properties that used to live on the host: `border`, `border-radius`, `gap`, `overflow`, `position`). This is because `display: grid`/`flex`/`position: relative` have moved off the host onto `cq-box` — the host is a neutral block container, `cq-box` is the rendering box.
- `<ui-accordion-item>` (JS path) renders `:where(ui-accordion-item) { display: contents; }` — outside the gate, because it applies regardless of rendering mode.
- The JS component auto-inserts `<cq-box>` when responsive/media variants require it. The CSS-only demo relies on authors writing `<cq-box>` explicitly; the CSS assumes it's there.
- The nested-accordion auto-adjust rules use `:has(> ui-accordion)` to detect parent details holding a direct-child accordion. If you change the demo structure to wrap the nested accordion in a `<div>`, the `> ui-accordion` direct-child selector won't match. Keep `<ui-accordion>` as the immediate child of the parent `<details>`.
