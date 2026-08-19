---
name: convert-to-v4
description: Use when converting a legacy v3 component in ui/ into a v4 package — a component with PascalCase custom properties, Shadow DOM, class-based variants, or no package.json — or when the user asks to modernize, package, or v4-ify a component.
argument-hint: <component-name>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

# Convert to v4

Convert a legacy `ui/<component>` into a publishable v4 package: **CSS-only** for
vanilla/server-rendered use, plus an optional **light-DOM custom element** for framework
integration.

**Reference implementations — read one before you start:**

| Shape | Read | Why |
|---|---|---|
| Parent + item component | `ui/accordion/` | `<ui-accordion>`/`<ui-accordion-item>`, `<cq-box>`, attribute propagation, peer dep on `ui/icon` |
| Simple single-element, themed | `ui/chip/` | One `:where()` block, `theme=` wiring, `size=`/`radius=` axes, typed-`attr()` `@supports` guard |

**Authoritative context (do not duplicate it here — read it):**

- `DESIGN.md` — the global token reference. Every family, every value.
- `docs/v4.md` — verification gates and working discipline.
- `AGENTS.md` § v4 component conventions — the ten rules a v4 component obeys.
- `ui/base/theme.md` — the `theme=` axis in full.

**Design philosophy** — the visual language is neutral: no brand bias, no opinionated
aesthetic. Components feel like natural extensions of the browser's default UI, with
consistent spacing, typography and subtle depth. Light and dark are native via `light-dark()`
and `color-scheme: light dark`.

## Input

`$ARGUMENTS` is the component name (e.g. `tabs`, `tooltip`). Source lives at `ui/$ARGUMENTS/`.

## 1. Audit the existing component

Read every file in `ui/$ARGUMENTS/`:

- **CSS** — custom properties, class names, selectors, variants, hardcoded values
- **JS** — existing element (if any), Shadow DOM vs light DOM, `innerHTML` use
- **HTML** — demo markup patterns and which variants are actually exercised
- **package.json** — does one exist? Note the current version (bump the major on conversion)

Use `AskUserQuestion` to confirm:

- Which variants/modifiers survive the conversion, and which are dropped?
- Dependencies on other packages (`ui/icon`, `ui/base` engines)?
- Does it need JS at all? Many v4 components are CSS-only with no `index.js`.

## 2. Tokens

### 2a. Global tokens

All global tokens live in `ui/base/tokens.css` (`@layer bs-core`). `@browser.style/base` is a
required peer of everything, so they are **always available** — never write a hardcoded
fallback for one.

**`DESIGN.md` is the reference for names and values.** This table is only a map of what
exists, so you know what to reach for:

| Category | Pattern | Notes |
|---|---|---|
| Colors | `--color-{role}` | accent, surface, surface-alt, text, text-muted, border, button, field, link, mark, info/error/success/warning, overlay, overlay-light |
| Theme bundles | `--ui-theme-{hue}-bg` / `-c` | nine hues + glass knobs — see § 3 |
| Font family | `--font-{name}` | body, heading, form, mono, serif |
| Font size | `--font-size-{step}`, `--font-size-fluid-{step}` | 15 fixed steps (`3xs`…`9xl`), 8 fluid `clamp()` steps |
| Font weight / line height / tracking | `--font-weight-*`, `--line-height-*`, `--tracking-*` | |
| Spacing | `--spacing-{size}` | `xs`…`2xl` — gaps and padding |
| **Sizes** | `--size-1` … `--size-15` | **element dimensions** (icon boxes, avatars, rating stars, clock faces). Distinct from spacing and widths. Consumers: `ui/avatar`, `ui/rating`, `ui/badge`, `ui/analog-clock` |
| Content widths | `--width-{size}`, `--width-prose` | container max-widths |
| Border / radius | `--border-width{,-thick,-heavy,-xl,-2xl}`, `--radius-{size}`, `--radius-circle`, `--radius-pill` | |
| **Squircle** | `--radius-{sm,md,lg,xl}-sq` + `--squircle-{sm,md,lg,xl}` | consumed as a **pair**: bespoke radius + `corner-shape: superellipse()` exponent |
| Shadow / blur / opacity / z-index | `--shadow-*`, `--blur-*`, `--opacity-disabled`, `--z-index-1`…`-5` | |
| Duration / easing | `--duration-*`, `--ease-*` | |
| **Stagger** | `--stagger-{begin,step,duration,distance,easing}` + `--stagger-shimmer-*` | knobs for the shared `stagger=` engine (`ui/base/stagger.css`) |
| Focus ring | `--ring-{width,offset,color}` | |

### 2b. Component tokens

Naming: `--ui-{component}-{property}`. Full readable names — `--ui-accordion-border-width`,
never `--ui-accordion-bdw`. Two tiers only:

```
Component token       Global semantic token
--ui-card-bg     -->  var(--color-surface)
```

**Inline vs. declared.** Declare a token at the top of the rule block only when it is
**referenced more than once** (by variants, pseudo-classes or child selectors); single-use
tokens go inline on their CSS property. **Fallbacks:** none when referencing a global token —
hardcode one only for a component-specific value with no global source.

```css
/* multi-use — declared at top, overridden by variants */
--ui-chip-border-color: transparent;

/* single-use — inline. Global source => no hardcoded fallback */
color: var(--ui-chip-c, var(--color-text));
/* component-specific value => hardcoded fallback is correct */
padding: var(--ui-chip-p, .5ch 2ch);
```

**Prefer shorthand** (`border`, `padding`, `margin`, `gap`) over separate longhands. When a
shorthand is assembled from several tokens, use a private property (`--_` prefix):

```css
--_border: var(--ui-accordion-border-width) var(--ui-accordion-border-style) var(--ui-accordion-border-color);
border: var(--_border);
```

Private `--_*` properties that must not leak into descendants get
`@property { syntax: "*"; inherits: false; }`.

### 2c. Rename PascalCase properties

The 20 legacy PascalCase aliases (plus five `--ff-*`) live at the **bottom of
`ui/base/tokens.css`** — not `core.css`. Replace every reference in the component; do **not**
remove the aliases from `tokens.css` (they stay until all components are migrated).

| Old | New | | Old | New |
|---|---|---|---|---|
| `--AccentColor` | `--color-accent` | | `--Field` | `--color-field` |
| `--AccentColorDark` | `--color-accent-dark` | | `--GrayText` | `--color-text-muted` |
| `--AccentColorText` | `--color-accent-text` | | `--Highlight` | `--color-highlight` |
| `--ButtonBorder` | `--color-border` | | `--LinkText` | `--color-link` |
| `--ButtonFace` | `--color-button` | | `--Mark` / `--MarkText` | `--color-mark` / `--color-mark-text` |
| `--ButtonText` | `--color-button-text` | | `--VisitedText` | `--color-link-visited` |
| `--Canvas` | `--color-surface` | | `--ColorInfo` / `--ColorError` | `--color-info` / `--color-error` |
| `--CanvasGray` | `--color-surface-alt` | | `--ColorSuccess` / `--ColorWarning` | `--color-success` / `--color-warning` |
| `--CanvasText` | `--color-text` | | `--ff-body` / `--ff-form` / `--ff-mono` | `--font-body` / `--font-form` / `--font-mono` |

### 2d. Common hardcoded → token replacements

| Hardcoded | Replace with |
|---|---|
| `rgba(0,0,0,.25)` / `color-mix(CanvasText, transparent)` | `--color-overlay` / `--color-overlay-light` |
| `backdrop-filter: blur(10px)` | `--blur-md` |
| `box-shadow: 0 0 0 2px` (focus ring) | `--ring-width` + `--ring-color` |
| `border: 1px solid` | `--border-width` |
| `font-weight: 700` | `--font-weight-bold` |
| `transition: .2s ease-in-out` | `--duration-normal` + `--ease-in-out` |
| `width: 24px` on an icon/avatar box | `--size-5` (see the `--size-*` ramp) |
| `z-index: 1` | `--z-index-1` |
| `max-inline-size: 300px` / `320px` (calendar, color-grid, range-*) | `--width-xs` (20rem) |
| `max-inline-size: 30em` (chat) | `--width-md` (28rem) / `--width-lg` (32rem) |
| `max-inline-size: 1200px` (menu, menu-details) | `--width-7xl` (80rem) |

### 2e. What not to tokenize

`ch` units, CSS keywords (`smaller`, `larger`), animation endpoints (`opacity: 0`/`1`), `cqi`
values, and domain-specific colors (planet colors, periodic-table element colors) all stay
as-is. See `DESIGN.md` § Do's and Don'ts.

## 3. The `theme=` axis

The shared cross-component color axis: nine hues (`red orange green blue accent black white
gray slate`) plus modifiers (`pale muted ink light dark border glass`). Resolver:
`ui/base/theme.css`. Full docs: `ui/base/theme.md`.

### Does this component get it?

| Give it `theme=` | Skip it |
|---|---|
| Surface/plate components — cards, panels, content columns, anything that paints a box | Structural wrappers with no surface |
| Furniture/badges — chip, sticker, beacon, marquee, save, play | Form controls — buttons use the separate semantic `.bg-*` / `color=` axis |
| Anything a page author would want re-skinned per instance | Icon-only controls that are transparent by design |

### How it wires up

**Often: not at all.** `theme.css` ships *universal paint* — any element carrying the axis gets
`background-color: var(--_theme-bg, transparent)` + `color: var(--_theme-c, …)` from
`@layer bs-core`, which `@layer bs-component` outranks. Wire explicitly only when the surface
is **not** the element carrying the attribute, or when the theme maps onto a token of the
component's own. The resolver publishes private, **non-inheriting** `--_theme-bg` /
`--_theme-c` / `--_theme-ink`:

```css
/* leaf plate — paint yourself (ui/chip, ui/sticker) */
&[theme] { --ui-chip-bg: var(--_theme-bg); --ui-chip-c: var(--_theme-c, var(--_theme-ink)); }
/* container — RE-publish into your own inheriting token (ui/reveal paints its <details>) */
:where(ui-reveal[theme]) { --ui-reveal-bg: var(--_theme-bg, var(--color-surface)); }
```

A descendant rule cannot read `--_theme-*` off an ancestor (`inherits: false`) — that is why
containers must re-publish. **Pick the ink fallback by role:** surfaces (card, reveal, content,
layout) fall back to `var(--color-text)` so `light`/`dark` re-tone them through `color-scheme`;
badges (chip, sticker, beacon, marquee) fall back to `var(--_theme-ink)` so the curated pair
always shows.

Use `theme=` on custom elements and `data-theme=` on native elements — every resolver rule in
`theme.css` is a pair, so both resolve identically. A component with a *different* per-element
meaning for the attribute (`ui/timeline` colors one entry's dot) opts out of universal paint in
its own sheet. **If the component is card furniture**, add the matching `media="<name>(<hue>)"`
resolver arm alongside the `theme=` one — `ui/chip/ui-chip.css` § B is the canonical block.

### Gotcha: bundles resolve at `:root`

The hue bundles reference `--color-*` **and are declared at `:root`**, so substitution happens
there and descendants inherit the already-resolved color. A page skin setting a brand
`--color-accent` on `body` will **not** change `theme="accent"` surfaces. Set the brand color
on `:root`, or re-declare the bundle alongside the skin:

```css
body {
	--color-accent: light-dark(#4f46e5, #6366f1);
	--ui-theme-accent-bg: var(--color-accent); /* re-resolve against body's value */
}
```

## 4. Refactor the CSS

### 4a. File header

Every v4 sheet opens with a ~4-line header: what the sheet is, a `Docs:` pointer, version,
author. Match `ui/chip/ui-chip.css` / `ui/card/ui-card.css` / `ui/reveal/ui-reveal.css`:

```css
/**
 * ui-$ARGUMENTS — one line on what this sheet is. Docs: readme.md
 * @version 4.0.0 · @author Mads Stoumann
 */
```

### 4b. Comment policy

**Never write long comments in CSS — prose belongs in the markdown docs.** A CSS comment is a
one-line marker pointing at the doc that carries the reasoning. Two lines only when the
invariant genuinely needs it; never a paragraph. Measurements, browser-bug write-ups,
rationale and history go to `readme.md` / `AGENTS.md`. (`docs/v4.md` § Working discipline.)

### 4c. Layer and selectors

Wrap everything in `@layer bs-component` and use `:where()` for zero specificity, targeting the
custom element directly:

```css
@layer bs-component {
	:where(ui-$ARGUMENTS) {
		--ui-$ARGUMENTS-border-color: transparent;   /* multi-use — declared */
		background: var(--ui-$ARGUMENTS-bg, var(--color-surface));
		border: var(--ui-$ARGUMENTS-border-width, var(--border-width)) solid var(--ui-$ARGUMENTS-border-color);
		display: block;
	}
}
```

The custom element name doubles as a plain HTML wrapper in CSS-only mode — it hosts the
attributes and needs no JS to be styled.

### 4d. Attribute axes

Behaviour is selected by **attributes, not classes**: `variant=` (space-separated tokens),
plus `color=` for status semantics, `size=`, `radius=`, `theme=`. Short comment above each
group; nest with `&`:

```css
:where(ui-badge) {
	/* colors */
	&[color="info"]    { --ui-badge-bg: var(--color-info); }
	&[color="success"] { --ui-badge-bg: var(--color-success); }
	/* variants */
	&[variant~="inline"] { position: static; translate: 0; }
}
```

Use `:is()` to combine variant selectors that share rules, and **never define the same token
in two selectors**. For complex components, variant blocks may live outside the base
`:where()` at full specificity (see `ui/accordion/ui-accordion.css`).

**`data-variant` / `data-theme` for native elements.** When the component styles a native
element (`<blockquote>`, `<fieldset>`, `<table>`), a bare `variant`/`theme` attribute is
invalid HTML — target both spellings:

```css
:where(ui-quote):is([variant~="bordered"], [data-variant~="bordered"]) { /* … */ }
```

### 4e. `index.css`

```css
@import './ui-$ARGUMENTS.css';
```

Add sibling package imports only when the component genuinely requires them (accordion imports
`../icon/index.css`). Leaf packages ship `index.css` + `ui-<name>.css` and **no `dist/`
bundle** — only `ui/base`, `ui/card`, `ui/carousel` and `ui/reveal` ship bundles.

## 5. Container queries (`<cq-box>`)

A container cannot query its own size. If the component sets `container-type` on its wrapper
**and** has `@container` rules, the rules must target a descendant — `<cq-box>`, the generic
`display: contents` wrapper.

```css
@container (inline-size > 650px) {
	:where(ui-$ARGUMENTS[variant~="responsive"]) > cq-box { /* responsive layout */ }
}
```

In CSS-only mode the author writes `<cq-box>` by hand — document it in the readme. A JS
component may auto-insert it (`ui/accordion/index.js` `ensureCqBox()`), but note the card
system's `<cq-box>` is **hand-authored and never auto-inserted**. When propagating attributes
to children, hop the box first:

```js
const container = this.querySelector(':scope > cq-box') || this;
for (const child of container.children) { /* … */ }
```

## 6. Web component (light DOM) — only if JS is needed

Many v4 components are CSS-only. Add JS only for real behaviour: attribute propagation,
rendering native markup from a terse authoring form, event wiring.

```js
/**
 * <ui-$ARGUMENTS> — light DOM wrapper for the CSS-first $ARGUMENTS.
 * Renders native HTML — no Shadow DOM. Docs: readme.md
 * @version 4.0.0 · @author Mads Stoumann
 */
class Ui$ARGUMENTS extends HTMLElement {
	static observedAttributes = ['group'];
	connectedCallback() { this.propagate(); }
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		this.propagate();
	}
	propagate() {
		// createElement + textContent only — NEVER innerHTML with attribute/user data
		// iterate this.children, or querySelector with ':scope >'
	}
}
customElements.define('ui-$ARGUMENTS', Ui$ARGUMENTS);
export { Ui$ARGUMENTS };
```

Rules: **no Shadow DOM**; never `innerHTML` with attribute or user data (XSS); scope every
query with `:scope >` or iterate `this.children`; custom events use
`{ bubbles: true, composed: true }`. A parent/item pair (`ui/accordion/index.js`) styles the
item as `display: contents`.

## 7. `package.json`

Copy `ui/chip/package.json` (or `ui/accordion/package.json` when there is a peer dep) and
change: `name`, `description`, `files`, `keywords`, `repository.directory`, `homepage`. The
shape is dual exports —

```json
"exports": {
  ".": { "import": "./index.js", "style": "./index.css" },
  "./style": "./index.css",
  "./index.css": "./index.css"
},
"files": ["index.js", "index.css", "ui-$ARGUMENTS.css"],
"peerDependencies": { "@browser.style/base": "^1.0.11" }
```

Converting an existing v3 package? **Bump the major.** Drop `index.js` from `module`/`exports`/
`files` if the component is CSS-only. Add peers only for packages the CSS or JS actually needs.

## 8. `readme.md`

Lowercase `readme.md` for the public API; `AGENTS.md` (uppercase) for internal architecture if
the component is complex enough to need it. Structure — see `ui/chip/readme.md`:

1. Title & one-line description · 2. Features · 3. Install (+ peer deps)
4. Usage: CSS-only · 5. Usage: web component · 6–9. React / Vue / Svelte / Astro-SSR
10. Attributes & variants (each with markup) · 11. `theme=` support, if any
12. Customization — component token table · 13. Accessibility · 14. Browser support

## 9. Demo HTML

Update `ui/$ARGUMENTS/index.html` to cover CSS-only markup, the web-component form (if any),
every variant, `theme=` if supported, and one token-customization example.

## 10. Register with the card system — only if the card system uses it

If the converted component is used inside `<ui-card>` / `<ui-media>` / `<ui-content>`, three
registrations must happen together. **Only real packages (with a `package.json`) belong here.**

1. **`ui/card/components.md`** — add a row to the right group (Media furniture / Text-area
   sub-components / Host), with element name and stylesheet path relative to `ui/`.
2. **`ui/card/package.json`** — add to `peerDependencies` **and** mark it
   `"optional": true` in `peerDependenciesMeta`. Both, or npm treats it as required.
3. **`ui/card/demo/demo.css`** — if it should appear on demo pages, `@import` it in page
   `<link>` order, then rebuild:

```bash
npm run build:demo-css   # -> /dist/demo.<hash>.min.css
```

The card demo pages load the **bundle**, so a raw sheet edit changes nothing on screen until
it is rebundled. Use `npm run dev:demo` while iterating. See the `demo-css` skill.

## 11. Verify

```bash
grep -nE '\-\-[A-Z]' ui/$ARGUMENTS/*.css        # no PascalCase — must be empty
grep -n 'innerHTML' ui/$ARGUMENTS/*.js          # none with attribute/user data
grep -n 'attachShadow' ui/$ARGUMENTS/*.js       # must be empty
cd ui/$ARGUMENTS && npm pack --dry-run          # lists exactly the `files` entries
```

Then check by reading:

1. **Tokens** — every color/spacing/radius goes through a component token that resolves to a
   global token. No hardcoded fallback for a global token.
2. **Dark mode** — `light-dark()` on any color that should adapt; check the pairs in `DESIGN.md`.
3. **No duplicated variant tokens** across selectors.
4. **Consistent corners** — don't mix rounded and sharp within one variant.
5. **Body text** at `--line-height-normal` unless there is a reason not to.
6. **Typed `attr()`** — if the component uses it, it ships an
   `@supports not (background-color: attr(x type(<color>), red))` block restoring defaults
   (`ui/chip/ui-chip.css` is the model). Safari/Firefox have no working fallback, and
   `CSS.supports('--x', 'attr(…)')` lies. See `ui/base/polyfills/readme.md`.

**Verify rendering in a real browser, not by reading CSS** — serve the repo and check computed
styles at both sides of any breakpoint. Use a fresh port: `python3 -m http.server` lets
Chromium serve stale `@import`ed sheets. `docs/v4.md` § Working discipline.

## 12. Final checklist

- [ ] CSS file header: what it is, `Docs:` pointer, `@version`, `@author`
- [ ] CSS comments are one-line markers; prose lives in `readme.md`
- [ ] `@layer bs-component`, `:where()` for zero specificity
- [ ] Tokens named `--ui-$ARGUMENTS-{property}`, full words, no abbreviations
- [ ] Single-use tokens inline; multi-use declared at the top of the block
- [ ] No hardcoded fallbacks for global tokens; shorthand properties preferred
- [ ] No PascalCase references left (aliases stay in `tokens.css`)
- [ ] Attributes, not classes — `variant=` / `color=` / `size=` / `theme=`
- [ ] `data-variant=` / `data-theme=` pairs where the host is a native element
- [ ] `theme=` wired (or deliberately skipped), ink fallback picked by role
- [ ] Light DOM only, safe DOM construction, scoped queries
- [ ] `package.json` with dual exports; major version bumped
- [ ] `readme.md` with CSS-only + framework examples; demo HTML updated
- [ ] Registered in `ui/card/components.md` + card peers + `demo.css`, if card-facing
