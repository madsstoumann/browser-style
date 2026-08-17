# Styling `::details-content`

One element, four components: `ui/accordion`, `ui/tabs`, `ui/reveal`, `ui/color-deck`.

`<details>` is the only element that holds open/closed state without JavaScript. `name=` makes it exclusive — a radio group. `::details-content` gives us a box to style around the content.

Everything after this is CSS.

---

## The height problem

`::details-content` wraps everything except `<summary>`. Animating it needs three things at once:

```css
details::details-content {
  block-size: 0;
  content-visibility: hidden;
  overflow: hidden;
  transition: block-size var(--dur), content-visibility var(--dur);
  transition-behavior: allow-discrete;
}
details[open]::details-content {
  block-size: auto;
  content-visibility: visible;
}
```

- `interpolate-size: allow-keywords` on an ancestor → `0` → `auto` interpolates
- `content-visibility` is discrete → needs `allow-discrete` to hold the content rendered while closing
- Put `transition-behavior` **after** the `transition` shorthand — the shorthand resets it

---

## Height is only one option

Same pseudo-element, different property. `ui/reveal` ships four families:

| Family | Property animated |
|---|---|
| `exp` | `block-size` 0 → auto |
| `sld` | `translate: 100% 0` → `0 0` |
| `flp` | `transform: perspective() rotateY(-180deg)` → `0deg` |
| `grw` | `inline/block-size` + `border-radius` + `inset` — icon morphs into panel |

`flp`/`sld`/`grw` put `::details-content` in `grid-area: 1 / -1` so it stacks on the summary instead of pushing it. `grw` goes `position: absolute` and grows from the icon corner.

---

## Style queries as a render switch

Accordion and tabs are the **same markup**: `<host><cq-box><details>…`. What differs is one inherited custom property.

```css
:where(ui-accordion)      { --_render: accordion; }
:where(ui-tabs, [tabs])   { --_render: tabs; }

@container style(--_render: accordion) { /* accordion rules */ }
@container style(--_render: tabs)      { /* tabs rules */ }
```

So `<ui-accordion tabs="pill panel">` renders as tabs. No `@property` needed — style queries compare the computed value as a string.

A wrapper flips it responsively (`auto-morph`), because a container cannot query its own size:

```css
@container (inline-size <= 650px) {
  auto-morph[render="tabs"] [tabs] { --_render: accordion; }
}
```

---

## Dispatch flags

`ui/reveal` uses the same trick internally — one flag picks the animation family:

```css
@property --_rvl { syntax: "*"; inherits: false; }

ui-reveal > details { container-name: bs-rvl; }
ui-reveal[variant~="flp"] > details { --_rvl: flp; }

@container bs-rvl style(--_rvl: flp) { /* the whole flip block */ }
```

`inherits: false` on purpose — a nested reveal must not inherit its parent's family.

Bonus: re-set the flag inside a **size** query and the animation swaps at a breakpoint.

```css
@container bs-card (inline-size >= 44rem) {
  ui-reveal[variant~="lg:grw"] > details { --_rvl: grw; }
}
```

---

## The neutral sentinel

Both rule sets are gated. Set the flag to a third value nobody queries and **both** switch off:

```css
@container tabs-expanded style(--_render: tabs) {
  ui-accordion[tabs~="expanded"] cq-box ui-accordion { --_render: none; }
}
```

That is mega-menu mode: outer renders as tabs, nested accordions inside the panel go inert and render fully expanded. `none` — not `tabs` — because tabs selectors would otherwise still match the nested `<details>` as descendants.

The query is **named** (`container-name: tabs-expanded`) so it skips past the nested containers, which each re-declare `--_render: accordion`.

---

## Opting out entirely

`ui/color-deck` wants the state, not the collapse:

```css
details::details-content {
  content-visibility: visible;
  display: contents;
}
```

The panel never collapses. `<details name="deck">` is now a pure state machine, read back out with selectors:

```css
section:has(details[open]) > * { --has-active: 1; }
section > :has(~ details[open]) { --is-before: 1; }
details[open]           { --is-active: 1; }
details[open] ~ *       { --is-after: 1; }
```

Those flags feed one `calc()` on `rotate` with `sibling-index()`/`sibling-count()` — cards fan out around a rivet, and the open one straightens up.

---

## Takeaways & traps

- `::details-content` is a real box: height, transform, position, `display: contents` — all fair game
- `transition-behavior: allow-discrete` **after** the shorthand, or it is reset
- Real elements do **not** match through `::details-content` — target `details[open] > :not(summary)` instead
- A container cannot query itself; you need an ancestor to flip the flag
- One inherited custom property + `@container style()` = two components, one markup
- `:has()` turns open-state into arbitrary sibling/ancestor styling — no JS anywhere
