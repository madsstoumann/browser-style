# ui-tabs — internal architecture

Partner reference: [ui/accordion/AGENTS.md](../accordion/AGENTS.md). Changes to the mode-gate contract must stay in lock-step across both components.

## Contract

- Inner structure: `<ui-tabs> > <cq-box> > <details>…</details>`. Every rendering rule assumes a `<cq-box>` wrapper and is scoped to it.
- Host selector is `:where(ui-tabs, [tabs])` — matches both the dedicated element *and* any element carrying a `tabs` attribute. That's how `<ui-accordion tabs="pill">` turns into tabs: same host contract, different element name.
- The host sets `container-type: inline-size`, `display: block`, and `--_render: tabs`. `display: block` is *required* — custom (and unknown) elements default to `display: inline`, and `container-type` is a no-op on inline boxes.
- All tokens (`--ui-tabs-*`) sit on `:where(ui-tabs, [tabs])` at zero specificity, overridable by any class or inline style.

## The `--_render` gate

`--_render` is a plain inherited custom property (no `@property` registration). Two values:

- `accordion` — accordion renders (`@browser.style/accordion`).
- `tabs` — tabs render (this file).

Every rendering rule in `ui-tabs.css` sits inside one of two `@container` blocks:

```css
@container style(--_render: tabs) { /* core tabs rendering + variants + attributes */ }
@container (inline-size < 400px) and style(--_render: tabs) { /* compact narrow fallback */ }
```

### Why no `@property` registration

`@container style(...)` queries on plain unregistered custom properties work via string-equality on the computed value. Each component sets `--_render` to its own keyword on its host rule (`:where(ui-tabs, [tabs]) { --_render: tabs; }`, `:where(ui-accordion) { --_render: accordion; }`), and the gate matches by literal value — no type coercion, no fallback math.

A previous integer-based version (`--_tabs-mode: 0 | 1`) required `@property` registration in both files so the integer query resolved correctly when only one stylesheet was loaded. The keyword version drops that coordination point entirely: each stylesheet is fully self-contained.

### Compound queries over nested

The narrow-compact fallback used to be `@container (inline-size < 400px) { … }` nested inside the outer `@container style(--_render: tabs) { … }`. Nested container queries have uneven browser support and can resolve against different ancestors in unexpected ways. We flattened to a single compound query at the top level:

```css
@container (inline-size < 400px) and style(--_render: tabs) { … }
```

Both conditions resolve against the same ancestor container — more reliable and mirrors the pattern in ui-accordion.css for its `(inline-size > 650px) and style(--_render: accordion)` horizontal/split block.

## Selector paired-pattern

Variants and attributes appear twice in each selector:

```css
:is(ui-tabs[variant~="bordered"], [tabs~="bordered"]) cq-box { border: …; }
```

The first arm matches dedicated `<ui-tabs variant="bordered">`. The second matches `<ui-accordion tabs="bordered">` — here the variant list is packed into the `tabs` attribute's value, so `~="bordered"` does a whitespace-separated-word match on that attribute. Unavoidable duplication: the two hosts use different attributes to carry their variant lists.

## `<auto-morph>` wrapper

The morph pattern lives in the consumer stylesheet, not in ui-tabs.css. The tabs component is agnostic — it only reacts to `--_render: tabs` being set on (or above) the host.

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

- `<auto-morph>` is a **generic unregistered element** — no JS, no customElement registration. Any element the browser treats as `HTMLUnknownElement` works; `<auto-morph>` is chosen for semantic self-documentation.
- The **attribute `render` names the property** being controlled, not the component type. A future density morph could be `<auto-morph density-mode>`.
- The **target selector is `[tabs]`**, matching any host with the `tabs` attribute — `<ui-accordion tabs>`, `<ui-tabs tabs>` (redundant but valid), or a future `<ui-nav tabs>`.
- Any existing ancestor container works — a grid cell, `<main>`, a layout wrapper. `<auto-morph>` is a convenience shorthand.

### Why a wrapper at all

`<ui-tabs>` (or `<ui-accordion tabs>`) has `container-type` set on itself so its own descendants can size-query it. But a container can't query its own size — that's a CSS spec rule. To flip `--_render` on the host based on the host's own width, *some ancestor* must own the `@container` query. `<auto-morph>` is that ancestor.

`container-type` on `body` works in theory but applies size containment to the page root, which changes how block-size resolves there — fragile across browsers, can strand sticky/fixed children. Don't.

## File layout

```
ui/tabs/
  ui-tabs.css       Core styles — the gate, variants, attributes
  index.html        Demo page
  tabs-demo.css     Page-specific demo recipes (classes like .tabs-filled)
  readme.md         Consumer-facing docs
  AGENTS.md         This file
```

This package has no JS entry point. The component is pure CSS; `<ui-tabs>` is an unregistered custom element that the stylesheet gives block layout to.

## Gotchas to preserve

- `display: block` on `:where(ui-tabs, [tabs])` — removing it silently breaks container queries. See header note.
- `--_render: tabs` is set unconditionally on any `[tabs]` element — this is the **automatic** mode switch. A consumer *can* manually override to `accordion` (e.g., inside an `@container` rule) to revert to accordion rendering when both stylesheets are loaded; that's what `<auto-morph render>` relies on.
- `@property --ui-tabs-indicator-offset` is registered as `<length>` so the indicator offset can animate smoothly through `calc()` / `transition`. Keep the registration.
- The `cq-box` rule inside `@container style(--_render: tabs)` targets the `cq-box` child specifically — all structural positioning (`display: grid`, `isolation`, `max-width`, `position: relative`) lives there, not on the host. The host stays a neutral block so the wrapper-morph pattern works.
