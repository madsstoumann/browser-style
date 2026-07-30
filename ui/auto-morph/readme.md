# @browser.style/auto-morph

A pure-CSS container-query wrapper that morphs a descendant component between renderer modes when the wrapper's inline-size crosses a breakpoint. No JS, no element registration — `<auto-morph>` is an unregistered HTML element the browser treats as `HTMLUnknownElement`, and the stylesheet gives it block layout and a container context.

## Why

A CSS container can't query its own size. `@browser.style/accordion` and `@browser.style/tabs` both make their host the container, so neither can react to its own width. To switch between the two renderers based on space, *some ancestor* must own the `@container` query — `<auto-morph>` is that ancestor, packaged as a one-line wrapper you drop into markup.

## Install

```bash
npm install @browser.style/auto-morph
```

```css
@import '@browser.style/auto-morph';
```

## Usage

Wrap any component that opts into the `--_render` gate (currently `<ui-accordion tabs>`, `<ui-tabs>`):

```html
<auto-morph render="tabs">
  <ui-accordion tabs="pill" variant="bordered rounded" name="faq">
    <cq-box>
      <details name="faq" open>
        <summary>Shipping</summary>
        <div>…</div>
      </details>
      <details name="faq">
        <summary>Returns</summary>
        <div>…</div>
      </details>
    </cq-box>
  </ui-accordion>
</auto-morph>
```

Above 650px wrapper width → tabs render. Below → the renderer flips back to `accordion`.

## How it works

`<auto-morph>` is set up like this:

```css
auto-morph {
  container-type: inline-size;
  display: block;
}

@container (inline-size <= 650px) {
  auto-morph[render="tabs"] [tabs] { --_render: accordion; }
}
```

- `container-type` makes the wrapper a queryable size container.
- `display: block` is required because unknown elements default to `display: inline` (and `container-type` is a no-op on inline boxes).
- The size-gated rule overrides `--_render` on any `[tabs]` descendant, flipping the active renderer below the breakpoint. The `tabs` package's host rule (`:where(ui-tabs, [tabs]) { --_render: tabs; }`) still applies above the breakpoint — the override only fires inside the size query.

## API

### `render="<mode>"`

Names the morph target. Today the only built-in mode is `tabs` — paired with the `[tabs]` host attribute on a participating component. Future modes (`nav`, `menu`, `density`, …) plug in by adding paired rules in your own stylesheet:

```css
@container (inline-size <= 650px) {
  auto-morph[render="nav"] [nav] { --_render: <fallback>; }
}
```

The attribute value (`tabs`, `nav`, …) and the descendant attribute selector (`[tabs]`, `[nav]`, …) are conventionally the same word, but the convention is up to you.

### Breakpoint

Hardcoded at `650px` in this package. To use a different breakpoint, drop the import and write the same rule with your own value:

```css
auto-morph[render="tabs"] {
  container-type: inline-size;
  display: block;
}
@container (inline-size <= 800px) {
  auto-morph[render="tabs"] [tabs] { --_render: accordion; }
}
```

The auto-morph package is a convenience for the common case.

## Slide-in panel — `slide-from="right|left"`

Below 650px viewport width, the wrapper becomes a fixed, full-viewport (100vw × 100dvh) panel, slid offscreen toward the given edge — the classic mobile menu drawer. CSS-only open contract: a **preceding sibling** checked input (bare, or wrapped in a label) opens it:

```html
<label aria-label="Toggle menu">
  <input type="checkbox" id="menu-toggle">
  <ui-icon type="burger-menu"></ui-icon>
</label>
<auto-morph render="tabs" slide-from="right">
  <ui-accordion tabs="bleed compact expanded panel">…</ui-accordion>
</auto-morph>
```

- Closed = `display: none` + translated offscreen + `visibility: hidden` — no layout box (a transformed ancestor would otherwise pull the fixed panel into layout as horizontal overflow), content unfocusable while hidden.
- Slide in/out both animate (`allow-discrete` display transition + a standalone `@starting-style` that re-fires on every open).
- The offscreen shift overshoots by 2rem — with `scrollbar-gutter` the panel is narrower than `100vw`, and a plain `100%` shift would leave a gutter-wide sliver.
- The toggle input must live **outside** the panel to stay keyboard-reachable.
- Tokens: `--auto-morph-bg` (default `--color-surface`), `--auto-morph-duration` (default `--duration-slow`).
- Full demo: [`ui/accordion/menu.html`](../accordion/menu.html) — sticky header, scroll-direction hide/reveal, click-outside dismiss.

## Composition with cascade layers

Rules sit inside `@layer bs-component`, matching the rest of `@browser.style/*`. Authored overrides outside any layer (or in a later layer) win without specificity gymnastics.

## See also

- [@browser.style/accordion](../accordion/readme.md) — accordion renderer (default mode for the gate)
- [@browser.style/tabs](../tabs/readme.md) — tabs renderer (`render="tabs"` target)
- The `--_render` gate is a plain inherited custom property — no `@property` registration. Style-equality container queries work on plain custom properties.
