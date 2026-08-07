# Typed `attr()` fallback

```html
<script type="module" src="/ui/base/polyfills/attr-fallback.js"></script>
```

Load it on any page that uses a component reading author values from attributes —
`ui-sticker fill=`, `ui-chip ink=`, `ui-avatar ring=`, `high-light fill=`,
`ui-rating value=`, `mega-menu menubar-height=`, `ui-gradient-text gradient=`,
`[data-view]`, and the stagger per-child overrides `stagger-index=` /
`stagger-step=` (+ their `data-` forms). It is a **no-op** where typed `attr()`
is supported, so it is safe to load unconditionally.

---

## There are TWO of these, and a page may need both

`<lay-out>` ships its own (`layout/polyfills/attr-fallback.js`). It is **not** a
duplicate and neither replaces the other — they cover **disjoint** attribute sets:

| | `ui/base/polyfills/attr-fallback.js` | `layout/polyfills/attr-fallback.js` |
|---|---|---|
| Covers | component attributes — `ui-sticker fill=`, `ui-chip ink=`, `ui-avatar ring=`, `high-light fill=`, `ui-rating value=`, `mega-menu menubar-height=`, `ui-gradient-text gradient=`, `[data-view]`, `stagger-index=`/`stagger-step=` (+ `data-` forms) | `<lay-out>` attributes — exactly `bleed=`, `columns=`, `rows=`, `max-width=`, `self=`, `size=` |
| Shape | ES module (documented `ATTR_MAP`, exports nothing) | IIFE body, still loaded as `type="module"` (it resolves its stylesheet via `import.meta.url`) |
| Companion CSS | none | yes — injects `attr-fallback.css` |
| Maps to | one CSS custom property **per selector** | one custom property **per attribute name** |

A page that uses `<lay-out>` *and* card components — which is most demo pages, and
every page built on the section/card integration — needs **both** tags:

```html
<script type="module" src="/layout/polyfills/attr-fallback.js"></script>
<!-- …page… -->
<script type="module" src="/ui/base/polyfills/attr-fallback.js"></script>
```

Both are no-ops where typed `attr()` is supported and both are safe to load
unconditionally, so "load both" is the default answer — loading only the layout one
leaves stickers and chips unfilled, and loading only this one leaves `bleed`/`columns`
inert. Spacing does **not** need either: it is token-only in v4 (`p()`/`cg()`/… inside
the breakpoint attributes) and generated as literal values, with no `attr()` involved.

---

## The trap this exists for

Components read values straight from attributes:

```css
:where(ui-chip) {
  &[fill] { --ui-chip-accent: attr(fill type(<color>), var(--color-button)); }
}
```

Typed `attr()` is Chromium-only today. **In Safari and Firefox this does not fall
back to `var(--color-button)`** — and that is the part that surprises everyone:

- A custom property parses **any** token stream, so the declaration is perfectly
  valid and `--ui-chip-accent` literally holds the text `attr(fill type(<color>), …)`.
- Because it holds *something*, it is **not** guaranteed-invalid — so a defensive
  `var(--ui-chip-accent, hotpink)` never reaches its fallback either.
- The failure surfaces one level down: the property that *consumes* it becomes
  invalid at computed-value time and resets to its initial value.

The result is not a wrong colour, it's a missing one: no background, no ring, an
empty rating, a collapsed menubar. Confirmed in Safari 26.5 — a filled
`<ui-sticker>` computed `background-color: rgba(0, 0, 0, 0)`.

Two corollaries worth knowing:

- **Declaring a real value first does not help.** `--_fill: red; --_fill: attr(…);`
  still ends up holding the `attr()` text — the second declaration is valid, so it
  wins. Verified identical in WebKit to having no fallback at all.
- **Detect on a real property.** `CSS.supports('--x', 'attr(…)')` returns `true`
  in Safari for exactly the reason above. Use a real property in CSS
  (`@supports not (background-color: attr(x type(<color>), red))`) and, in JS,
  set the property and read the computed value back — which is what this polyfill
  does.

## Two layers, both required

| | Layer | Gives you |
|---|---|---|
| 1 | `@supports not (…)` block **in each component's CSS** | The component always renders something sane, with **no JavaScript**. This is the real fallback. |
| 2 | This polyfill | Each element's **own** attribute value on top, so `fill="#c9b8ff"` is that colour and not the component default. |

Layer 1 is not optional: a component installed on its own must not depend on an
app-level script to be usable.

The stagger overrides degrade CSS-only along exactly these two layers:

- `stagger-index=` — `--_stg-i` is a **registered** `<integer>`, so in Safari/Firefox
  both the `sibling-index()` default and the un-substituted `attr()` text fail the
  syntax check and fall to `initial-value: 1`: a uniform cascade (`delay =
  --stagger-begin`), which is what those browsers already get today without
  `sibling-index()`. No `@supports` block needed — registration is the layer 1.
- `stagger-step=` — `--_stg-step` is unregistered (registering would kill the
  `--stagger-step` theming fallback), so its layer 1 is an explicit `@supports not
  (transition-delay: attr(x type(<time>), 0s))` guard in `stagger.css` that resets
  it to the default `--stagger-step`. The child cascades at the default pace, and
  this polyfill restores the exact authored values on top — an enhancement, not
  load-bearing.

## Adding a component to the registry

`ATTR_MAP` maps `selector → { CSS property: [attribute, default, presets?] }`:

```js
'ui-chip[fill]': { '--ui-chip-accent': ['fill', 'var(--color-button)'] },
```

- `default` — used when the attribute is present but **empty**.
- `presets` — *optional*. Values the component resolves **itself** in CSS, which
  the polyfill must leave alone. Two components need this, because one attribute
  accepts either a keyword the stylesheet maps or any CSS colour:
  - `high-light fill="green|yellow|orange|pink"` — highlighter colours, **not** the
    CSS keywords (`green` is `#82ffad`, not `#008000`).
  - `ui-avatar ring="error|info|success|warning"` — not colours at all; writing the
    raw value would be invalid and the ring would disappear.

  This list duplicates knowledge that lives in the component's CSS. If you add a
  preset there, add it here too.

Keep the map in sync with the `attr(… type(…))` declarations in each component's
CSS, and add the matching `@supports` block on the CSS side at the same time.

A `MutationObserver` covers elements added or re-attributed after load, so
SSR'd/rendered content and carousel clones are handled.
