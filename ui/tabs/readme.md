# @browser.style/tabs

A CSS-only tab interface built on native `<details>` and `<summary>` elements. No JavaScript. Active-tab tracking, sliding indicator, and panel transitions all done with CSS — anchor positioning, subgrid, `@starting-style`, and `transition-behavior: allow-discrete`.

## Features

- Native `<details>` / `<summary>` — accessible, keyboard-navigable, works without JS.
- Exclusive-open via the HTML `name` attribute (native browser behavior).
- Sliding tab indicator via CSS Anchor Positioning.
- Subgrid-based layout so the panel aligns with the tab row across all children.
- Slide-down / slide-up panel transitions via `@starting-style` + `display: allow-discrete`.
- Opt-in staggered panel content via `data-stagger` — children cascade in and **replay on every tab activation**, no JS.
- Structural variants for shape and layout: `bleed`, `bordered`, `compact`, `ellipse`, `panel`, `pill`, `rounded`.
- Decoration driven entirely by CSS tokens — define your own classes, no `indicator=` attribute needed.
- RTL-safe (indicator uses logical `start` anchor edge, bleed uses symmetric `inset-inline`).
- Light/dark mode via design tokens.

---

## Install

```bash
npm install @browser.style/tabs
```

Peer dependency:

```bash
npm install @browser.style/base
```

> `@browser.style/base` provides the design token system (colors, spacing, radii, shadows, width scale). `ui-tabs` references tokens like `--color-accent`, `--shadow-md`, `--width-5xl`, etc.

---

## Usage

Import the stylesheet:

```css
@import '@browser.style/base';
@import '@browser.style/tabs/style';
```

Write native HTML — no JS. Wrap items in a `<ui-tabs>` custom element (which renders as a plain block), with a single `<cq-box>` child (a neutral grid wrapper, `display: grid`), then one `<details>` per tab:

```html
<ui-tabs no-collapse>
  <cq-box>
    <details name="faq" open>
      <summary>Shipping</summary>
      <div>Shipping content…</div>
    </details>
    <details name="faq">
      <summary>Payment</summary>
      <div>Payment content…</div>
    </details>
    <details name="faq">
      <summary>Returns</summary>
      <div>Returns content…</div>
    </details>
  </cq-box>
</ui-tabs>
```

### Required structure

- `<ui-tabs>` — component root. Block-level, grid-free.
- `<cq-box>` — direct child, the grid wrapper. Exactly one.
- `<details name="…">` — one per tab. Share a `name` so only one is open at a time.
- `<summary>` — the tab label (required by `<details>`).
- One non-summary element after `<summary>` — the panel content. Wrap multiple elements in a single `<div>` or `<article>` — panel styling targets `details > :not(summary)`.

---

## API

### Structural variants — `variant="…"`

Space-separated tokens. Combinable.

| Variant | Effect |
|---|---|
| `bleed` | Header background extends past `cq-box` to the viewport edges. |
| `bordered` | Border around the component + divider between header and panel. Uses `--ui-tabs-border-width` / `--ui-tabs-border-color`. |
| `compact` | Tabs use their natural min-content width, grouped at the start; remaining header area is filled by the header background. |
| `no-background` | Removes the header background. When combined with `compact`, also removes inline padding on summaries and panel content so edges flush to cq-box. |
| `panel` | Active panel gets `--ui-tabs-panel-bg` + `--ui-tabs-panel-shadow`, and slides in/out on tab switch. |
| `pill` | Fully rounded header bar and indicator (`--ui-tabs-pill-radius`). |
| `rounded` | Slightly rounded outer corners + rounded top of header bar (`--ui-tabs-rounded-radius`). |
| `ellipse` | Corners drawn via the CSS `corner` shorthand / `corner-shape` (Chrome Canary 151+). Default `--ui-tabs-squircle-exp: 2` is an iOS-style squircle; `1` = plain round, higher = squarer. |

### Standalone attributes

| Attribute | Effect |
|---|---|
| `no-collapse` | Clicking the active tab does nothing — one tab is always open. |

### Decoration via classes

All decoration is token-driven — no `indicator="…"` attribute. Add your own class and flip tokens:

```css
.my-tabs {
  --ui-tabs-indicator-bg: var(--color-surface);
  --ui-tabs-indicator-shadow: var(--shadow-md);
  --ui-tabs-indicator-offset: var(--spacing-sm);
  --ui-tabs-indicator-text: var(--color-accent);
}
```

```html
<ui-tabs variant="pill" class="my-tabs">…</ui-tabs>
```

Compose multiple classes for orthogonal effects — e.g., `class="tabs-line tabs-muted"` adds an underline and swaps the accent text color, each controlled by a different token.

---

## Tokens

All tokens are scoped to `:where(ui-tabs)` — low specificity, easy to override in consumer classes.

### Decoration (the ones you'll flip most often)

| Token | Default | Purpose |
|---|---|---|
| `--ui-tabs-indicator-bg` | `transparent` | Filled background behind the active tab. |
| `--ui-tabs-indicator-color` | `var(--color-accent)` | Underline color and default indicator accent. |
| `--ui-tabs-indicator-font-weight` | `inherit` | Font weight of the active tab's label. Set to `var(--font-weight-medium)` / `-semibold` / `-bold` for emphasis. |
| `--ui-tabs-indicator-offset` | `0px` | Inset distance of the indicator from the header edge. `<length>`. |
| `--ui-tabs-indicator-shadow` | `none` | Box-shadow on the indicator. |
| `--ui-tabs-indicator-text` | `var(--color-accent)` | Color of the active tab's label text. |
| `--ui-tabs-indicator-width` | `0px` | Bottom underline thickness. Set to `var(--border-width-heavy)` (or any `<length>`) to show the indicator line. |
| `--ui-tabs-indicator-width-start` | `0px` | Top underline thickness (line *above* the active tab). Independent of `-width`. |
| `--ui-tabs-outline-color` | `var(--color-text-muted)` | Color of the classic tab-outline stroke (see `.tabs-outline` recipe). |
| `--ui-tabs-outline-width` | `0px` | Width of the tab-outline stroke. Set to a length to enable the "tab sticking out of a baseline" look. |

### Structure

| Token | Default | Purpose |
|---|---|---|
| `--ui-tabs-border-color` | `var(--color-border)` | `variant="bordered"` frame color. |
| `--ui-tabs-border-width` | `var(--border-width)` | `variant="bordered"` frame width. |
| `--ui-tabs-compact-gap` | `2ch` | Space between tabs in `variant="compact"`. |
| `--ui-tabs-duration` | `var(--duration-normal)` | Transition duration for indicator slide and panel animation. |
| `--ui-tabs-header-bg` | `var(--color-surface-alt)` | Tinted header bar. |
| `--ui-tabs-header-height` | `3em` | Fallback height for the indicator when no tab is open. |
| `--ui-tabs-max-width` | `var(--width-5xl)` | Max width of the centered cq-box. |
| `--ui-tabs-padding-block` | `1.25ch` | Tab vertical padding. |
| `--ui-tabs-padding-inline` | `1.5ch` | Tab horizontal padding. |
| `--ui-tabs-panel-bg` | `var(--color-surface)` | Panel surface color (with `variant="panel"`). |
| `--ui-tabs-panel-padding-block` | `2ch` | Panel vertical padding. |
| `--ui-tabs-panel-padding-inline` | `1.5ch` | Panel horizontal padding. |
| `--ui-tabs-panel-shadow` | `var(--shadow-md)` | Panel surface shadow. |
| `--ui-tabs-pill-radius` | `var(--radius-pill)` | Radius used by `variant="pill"`. |
| `--ui-tabs-rounded-radius` | `var(--radius-lg)` | Radius used by `variant="rounded"`. |
| `--ui-tabs-squircle-exp` | `2` | Superellipse curvature (log2 scale) for `variant="ellipse"`. `1` = round; `2` = squircle; higher = squarer corners. |
| `--ui-tabs-squircle-radius` | `1em` | Corner radius for `variant="ellipse"`. |
| `--ui-tabs-stagger-distance` | `2rem` | How far staggered children rise from on entry (`translate`). |
| `--ui-tabs-stagger-duration` | `0.5s` | Per-child enter transition duration. |
| `--ui-tabs-stagger-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Per-child enter easing. |
| `--ui-tabs-stagger-step` | `0.07s` | Delay added per child (child *n* starts at `(n − 1) × step`). |
| `--ui-tabs-tab-gap` | `1ch` | Gap between tab label and any inline icon. |

---

## Recipes

### Default — accent-colored active label

With no classes or variants, the active tab's label picks up `--color-accent`. Nothing else.
```html
<ui-tabs>…</ui-tabs>
```

### Underline indicator

Opt into the sliding underline:
```css
.tabs-line { --ui-tabs-indicator-width: var(--border-width-heavy); }
```
```html
<ui-tabs class="tabs-line">…</ui-tabs>
```

### Line above the active tab

Same pattern, different edge:
```css
.tabs-line-above { --ui-tabs-indicator-width-start: var(--border-width-heavy); }
```

### Muted label color

Swap the accent for any other color via `--ui-tabs-indicator-text`:
```css
.tabs-muted { --ui-tabs-indicator-text: var(--color-text); }
```

### Weight + muted label

Emphasize via font-weight instead of (or alongside) color:
```css
.tabs-subtle {
  --ui-tabs-indicator-font-weight: var(--font-weight-semibold);
  --ui-tabs-indicator-text: var(--color-text);
}
```

### Filled pill / ellipse indicator

```css
.tabs-filled {
  --ui-tabs-indicator-bg: var(--color-surface);
  --ui-tabs-indicator-offset: var(--spacing-sm);
  --ui-tabs-indicator-shadow: var(--shadow-md);
  --ui-tabs-indicator-text: var(--color-text);
}
```
```html
<ui-tabs variant="pill" class="tabs-filled">…</ui-tabs>
<ui-tabs variant="ellipse" class="tabs-filled">…</ui-tabs>
```
Same class on either shape — decoration is orthogonal to structure.

### Classic desktop-tab outline

Inactive tabs share a baseline; the active tab gets a frame open at the bottom, "sticking out" of the row:
```css
.tabs-outline { --ui-tabs-outline-width: var(--border-width-thick); }
```
```html
<ui-tabs variant="no-background" class="tabs-outline">…</ui-tabs>
```
`no-background` typically reads cleaner — the outlines become the only horizontal structure.

### Rounder ellipse corners

Bump the superellipse exponent:
```css
.tabs-rounded { --ui-tabs-squircle-exp: 3; }
```
```html
<ui-tabs variant="ellipse" class="tabs-rounded">…</ui-tabs>
```
The value is a log2 curvature scale: `1` = round (same shape as border-radius), `2` (default) = iOS-style squircle, higher = progressively squarer corners.

### Minimal compact strip

```html
<ui-tabs variant="compact no-background" class="tabs-line" no-collapse>…</ui-tabs>
```

### Full-bleed header with contained panel

```html
<ui-tabs variant="bleed panel">…</ui-tabs>
```

---

## Staggered panel content — `data-stagger`

Opt in by adding `data-stagger` to the panel wrapper (the element after `<summary>`). Its **direct children** fade and rise into place one after another, and the animation **replays every time the tab is (re)activated** — not just the first time.

```html
<ui-tabs class="tabs-line" no-collapse>
  <cq-box>
    <details name="cat" open>
      <summary>Games</summary>
      <div class="grid" data-stagger>
        <article>…</article>
        <article>…</article>
        <article>…</article>
      </div>
    </details>
    <details name="cat">
      <summary>Movies</summary>
      <div class="grid" data-stagger>
        <article>…</article>
        <article>…</article>
      </div>
    </details>
  </cq-box>
</ui-tabs>
```

- **Any number of children** — each child is offset from the previous by `--ui-tabs-stagger-step`, computed with `sibling-index()`.
- **`data-stagger` is the wrapper, not the items** — it goes on the single element after `<summary>`; the things that animate are that element's direct children.
- **Layout is yours** — `data-stagger` only drives the entry animation. Make the wrapper a grid/flex container yourself (e.g. a `.grid` class). The stagger doesn't impose layout.

### Tuning

```css
.my-tabs {
  --ui-tabs-stagger-step: 0.05s;     /* tighter cascade            */
  --ui-tabs-stagger-duration: 0.6s;  /* slower per-child move       */
  --ui-tabs-stagger-distance: 1rem;  /* shorter rise                */
  --ui-tabs-stagger-easing: ease-out;
}
```

### How it works (and why)

The entry is a **transition + `@starting-style`**, not a `@keyframes` animation. `<ui-tabs>` overlaps all panels in one grid cell and hides the inactive ones with `content-visibility`, which **caches a panel's rendered state** — a `@keyframes` run would freeze on close and never replay. For staggered panels the component instead keeps the panel `content-visibility: visible` and hides the inactive children with `display: none`, so each reopen is a genuine render that re-fires `@starting-style`. The override is scoped with `:has(> [data-stagger])`, so plain tabs keep their content-visibility optimization untouched.

### Reduced motion

Honoured automatically: under `prefers-reduced-motion: reduce` the children appear instantly (no fade, no movement). Nothing to configure.

> **Specificity note:** the inactive-child `display: none` lives in `@layer bs-component`, so it loses to *unlayered* author rules. If you set `display` on the **children** themselves with an unlayered rule, the cache-bust breaks and the replay stops. Style the **wrapper's** layout instead (or put your child rule in a cascade layer).

---

## Pairing with `<ui-accordion>` — the `--_render` gate

`@browser.style/tabs` and `@browser.style/accordion` share the same inner structure (`cq-box > details`) and cooperate through a single inherited custom property: `--_render`. No `@property` registration needed — it's a plain string-keyword property and string-equality style queries work without it.

- `--_render: accordion` → accordion renders
- `--_render: tabs` → tabs renders

Both components wrap every rendering rule in `@container style(--_render: …)`. Flip the value and the same markup re-renders in the other mode — no JS, no DOM swap.

### How the `[tabs]` attribute works

`ui-tabs.css` owns the flip. Its host rule is `:where(ui-tabs, [tabs])`, which means **any** element with a `tabs` attribute becomes a tabs host — including an `<ui-accordion tabs="pill">`. The host selector sets `--_render: tabs`, `container-type: inline-size`, and `display: block`, so the tabs rendering kicks in and (because accordion's gate is `style(--_render: accordion)`) accordion rendering drops out.

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/accordion/index.css">
<link rel="stylesheet" href="@browser.style/tabs/index.css">

<ui-accordion tabs="pill" variant="bordered rounded" name="faq">
  <cq-box>
    <details name="faq" open><summary>Shipping</summary><div>…</div></details>
    <details name="faq"><summary>Returns</summary><div>…</div></details>
  </cq-box>
</ui-accordion>
```

The value assigned to `tabs="…"` is the variant list — `pill`, `rounded`, `bordered`, `compact`, `ellipse`, `panel`, `bleed`, in any combination, same rules as the `variant` attribute on `<ui-tabs>` itself.

### Responsive morph — `<auto-morph render="tabs">`

Install [`@browser.style/auto-morph`](../auto-morph/readme.md) for the responsive wrapper. It owns the `container-type` and a single size-gated rule that flips `--_render: accordion` below 650px:

```bash
npm install @browser.style/auto-morph
```

```css
@import '@browser.style/auto-morph';
```

```html
<auto-morph render="tabs">
  <ui-accordion tabs="pill" variant="bordered rounded" name="faq">
    <cq-box>…</cq-box>
  </ui-accordion>
</auto-morph>
```

Above 650px wrapper width → tabs. Below → accordion. Because the query is container-based, a narrow sidebar and a wide main column can render the same element as accordion and tabs respectively — no viewport media queries involved.

The attribute *value* (`tabs`) names the morph target. Future modes (`render="nav"`, `render="menu"`, …) plug in by adding paired rules in the auto-morph package or your own stylesheet.

### Why a wrapper?

A CSS container can't query its own size — `@container` resolves against the *nearest ancestor* container. Since `<ui-tabs>` / `<ui-accordion tabs>` sets its own `container-type`, it can't react to its own width. The `<auto-morph>` wrapper is that ancestor. Any ancestor with `container-type` works (grid cell, `<main>`, a layout wrapper); `@browser.style/auto-morph` is the packaged shorthand.

Setting `container-type` on `body` technically works but applies size containment to the page root — fragile, can strand sticky/fixed children. Don't.

---

## Notes

### Scrollbar + `variant="bleed"`

`100vw` historically includes scrollbar width, so `inset-inline: calc(50% - 50vw)` can overshoot the viewport by ~scrollbar-thickness pixels on pages with a vertical scrollbar, producing a horizontal scrollbar. To prevent it, add this to your page's global styles:

```css
html { scrollbar-gutter: stable; }
```

Chrome 145+ excludes scrollbar width from `100vw` whenever `scrollbar-gutter: stable` or `overflow-y: scroll` is set on `html`. For older browsers, also add:

```css
html { overflow-x: clip; }
```

### Accent indicator in RTL

The indicator anchors to `anchor(--tab-active start, 0)` — `start` is the logical inline-start edge, so the indicator tracks the active tab correctly regardless of text direction.

### Compact tab count limit

`variant="compact"` uses `grid-template-columns: repeat(12, min-content) 1fr` — up to 12 tabs fit before the trailing `1fr` absorbs extras. There's no token for the `12` — if you need more, edit the value in `ui-tabs.css` or override the `grid-template-columns` rule in a scoped stylesheet.

---

## Browser support

Required features and their minimum browser versions:

| Feature | Where | Required |
|---|---|---|
| `::details-content` | base | Chrome 131+, Safari 18.1+, Firefox 131+ |
| CSS Anchor Positioning (`anchor()`, `anchor-size()`) | indicator geometry | Chrome 125+, Safari 26+, Firefox (flagged) |
| Subgrid | details row/column alignment | Chrome 117+, Safari 16+, Firefox 71+ |
| `@starting-style` | panel enter animation | Chrome 117+, Safari 17.4+, Firefox 129+ |
| `transition-behavior: allow-discrete` | panel enter/exit animation | Chrome 117+, Safari 17.4+, Firefox 129+ |
| `@property` with `<integer>` in `repeat()` | compact + panel animations | Chrome 126+, Safari 16.4+, Firefox 128+ |
| `corner` / `corner-shape: superellipse(…)` | `variant="ellipse"` only | Chrome Canary 151+ |
| `sibling-index()` | per-child `data-stagger` delay | Chrome 138+, Safari 26.2+ (no Firefox) |

Without `corner` / `corner-shape` support, `variant="ellipse"` falls back to no rounding. Without `::details-content` support, the component is not usable. Without `sibling-index()`, `data-stagger` children still animate in — they just all start together (no cascade) instead of one-by-one.

---

## HTML demo

See `index.html` in this package for live examples of every variant and combination, including RTL.
