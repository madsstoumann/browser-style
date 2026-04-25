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

## `<auto-morph>` wrapper

Pattern lives in the page stylesheet, not in the component. The accordion is agnostic — it only reacts to `--_render` being flipped.

```css
auto-morph {
  container-type: inline-size;
  display: block;
}
@container (inline-size <= 650px) {
  auto-morph[render] [tabs] { --_render: accordion; }
}
```

Design notes:

- `<auto-morph>` is a **generic unregistered element** — no JS, no customElement registration. Browsers treat it as `HTMLUnknownElement` and render inline by default; the stylesheet reclaims it as a block container.
- The **attribute `render` names the property being controlled**, not the component type. A future density morph could be `<auto-morph density-mode>`, driving `--_density-mode`. Keeps the wrapper reusable.
- The **target selector is `[tabs]`**, not `ui-accordion`. Any host with the `tabs` attribute auto-morphs inside the wrapper — including a future `<ui-nav tabs>` or similar.
- The wrapper only needs **`container-type` one level above** `<ui-accordion>`. Any existing ancestor container (a grid cell, a `<main>`, a layout wrapper) works equally well; `<auto-morph>` is a convenience shorthand.

### Why a wrapper at all

`<ui-accordion>` has `container-type` set on itself so its own descendants (`cq-box`, `details`) can size-query it. But a container can't query its own size — that's a CSS spec rule, not a browser quirk. To flip `--_render` on `<ui-accordion>` based on `<ui-accordion>`'s own width, *some ancestor* must own the `@container` query. `<auto-morph>` is that ancestor.

Setting `container-type` on `body` technically works but applies size containment to the page root, changing how block-size resolves there — fragile across browsers, can strand sticky/fixed children. Don't.

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
