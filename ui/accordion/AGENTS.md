# ui-accordion — internal architecture

Partner reference: [ui/tabs/AGENTS.md](../tabs/AGENTS.md). Changes to the mode-gate contract must stay in lock-step across both components.

## Contract

- Inner structure: `<ui-accordion> > <cq-box> > <details>…</details>`. Every rendering rule assumes a `<cq-box>` wrapper and is scoped to it.
- `<ui-accordion>` is the size container: `container-type: inline-size` + `display: block` on the host. `display: block` is *required* — custom elements default to `display: inline`, and `container-type` is a no-op on inline boxes.
- All tokens (`--ui-accordion-*`) and the derived locals (`--_bd`, `--_bb`, `--_tabs-mode: 0`) are declared on `:where(ui-accordion)` at zero specificity, so consumers can override with any class or inline style.

## The `--_tabs-mode` gate

`@property --_tabs-mode` is registered as a `<integer>`, `inherits: true`, `initial-value: 0`. Two values:

- `0` — accordion renders.
- `1` — tabs render (provided by `@browser.style/tabs`).

Every non-setup rule sits inside one of two `@container` blocks:

```css
@container style(--_tabs-mode: 0) { /* accordion rendering */ }
@container (inline-size > 650px) and style(--_tabs-mode: 0) { /* horizontal + split */ }
```

Plus one asymmetric rule at `style(--_tabs-mode: 1)` that hides accordion-specific icons when the host is in tabs mode.

### Why registered, why here

The property is registered in *both* `ui-accordion.css` and `ui-tabs.css` with identical descriptors. Both are legal — the CSS Properties and Values spec allows multiple `@property` declarations with the same name; the last one wins, and both carry the same value. The duplication exists so accordion works standalone without ui-tabs.css: an unregistered custom property has an empty-string computed value, which causes `style(--_tabs-mode: 0)` to fail silently and the accordion to render as nothing.

### Compound queries over nested

Where we need both size and style conditions (horizontal + split, and the tabs-mode icon hider), we use a single compound query:

```css
@container (inline-size > 650px) and style(--_tabs-mode: 0) { … }
```

Not nested `@container` inside `@container` — nested queries have uneven support across browsers; compound queries resolve both conditions against the same ancestor container and work more reliably.

## `<auto-morph>` wrapper

Pattern lives in the page stylesheet, not in the component. The accordion is agnostic — it only reacts to `--_tabs-mode` being flipped.

```css
auto-morph {
  container-type: inline-size;
  display: block;
}
@container (inline-size <= 650px) {
  auto-morph[tabs-mode] [tabs] { --_tabs-mode: 0; }
}
```

Design notes:

- `<auto-morph>` is a **generic unregistered element** — no JS, no customElement registration. Browsers treat it as `HTMLUnknownElement` and render inline by default; the stylesheet reclaims it as a block container.
- The **attribute `tabs-mode` names the property being controlled**, not the component type. A future density morph could be `<auto-morph density-mode>`, driving `--_density-mode`. Keeps the wrapper reusable.
- The **target selector is `[tabs]`**, not `ui-accordion`. Any host with the `tabs` attribute auto-morphs inside the wrapper — including a future `<ui-nav tabs>` or similar.
- The wrapper only needs **`container-type` one level above** `<ui-accordion>`. Any existing ancestor container (a grid cell, a `<main>`, a layout wrapper) works equally well; `<auto-morph>` is a convenience shorthand.

### Why a wrapper at all

`<ui-accordion>` has `container-type` set on itself so its own descendants (`cq-box`, `details`) can size-query it. But a container can't query its own size — that's a CSS spec rule, not a browser quirk. To flip `--_tabs-mode` on `<ui-accordion>` based on `<ui-accordion>`'s own width, *some ancestor* must own the `@container` query. `<auto-morph>` is that ancestor.

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
- `--_tabs-mode: 0` explicit default on `:where(ui-accordion)` — belt-and-braces; if an older engine skips `@property` registration, the explicit value still makes the style query work.
- Every variant/type rule targets `cq-box` (for layout properties that used to live on the host: `border`, `border-radius`, `gap`, `overflow`, `position`). This is because `display: grid`/`flex`/`position: relative` have moved off the host onto `cq-box` — the host is a neutral block container, `cq-box` is the rendering box.
- `<ui-accordion-item>` (JS path) renders `:where(ui-accordion-item) { display: contents; }` — outside the gate, because it applies regardless of rendering mode.
- The JS component auto-inserts `<cq-box>` when responsive/media variants require it. The CSS-only demo relies on authors writing `<cq-box>` explicitly; the CSS assumes it's there.
