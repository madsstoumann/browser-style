# ui-table — backlog

Feature gaps compared against Bootstrap, Tailwind UI, Material/MUI, Ant Design, Carbon, Primer, Shadcn. All CSS-only, all non-functional (no sort/search/pagination — those stay out of this component).

---

## 1. Sticky `<tfoot>`

Totals-row that stays pinned to the bottom of the overflow wrapper. Symmetric with the existing sticky `<thead>`. Staple of finance / admin tables in Ant, Carbon, MUI.

**Shape:** inside `:where(ui-table[frame])`, add

```css
& table tfoot {
  position: sticky;
  inset-block-end: 0;
  z-index: var(--z-index-1);
}
```

Watch: `<tfoot>` rows inherit the existing "thicker top border + semibold" tfoot styling — check it still reads cleanly when pinned against the last scrolled `<tbody>` row.

---

## 2. Sticky-end columns

Counterpart to the existing `sticky~="c0"`…`c8` (left-pinned). A new `sticky-end~="c0"`…`c8` counts from the right and pins via `inset-inline-end` instead of `inset-inline-start`. Classic "Actions" column use case — Carbon and MUI both offer this.

**Shape:** mirror the existing 9-way enumeration, with `inset-inline-end: var(--_iie)` and `--_iie: var(--ce0)`…`var(--ce8)`. Web component's `setStickyOffsets` needs a sibling method `setStickyEndOffsets` that walks from the last cell backwards.

Watch: tables with both `sticky` and `sticky-end` — z-index ordering between left and right stuck cells when they'd otherwise overlap on very narrow viewports.

---

## 3. Column-divider-only variant (`inline-border`)

Vertical dividers between columns, no horizontal row lines. Common in dense data / finance tables; Carbon and Polaris offer it. Complementary to the existing `block-border` (row-divider-only look).

**Shape:**

```css
&[data-variant~="inline-border"] :is(td, th) {
  border-block-width: 0;
  border-inline-width: 0 var(--ui-table-border-width);
}
&[data-variant~="inline-border"] :is(td, th):first-of-type {
  border-inline-start-width: 0;
}
```

Watch: interaction with `rounded` (no block borders means no rounded corners to speak of) and `th-divide-*` family (whose whole job is a horizontal divider).

---

## 4. Responsive stack-on-narrow

Below a breakpoint, the table stacks as label:value cards. Tailwind UI uses this heavily on mobile. Pure CSS via container queries + `<td>::before { content: attr(data-label) }`.

**Shape (sketch):**

```css
&[data-variant~="stack"] {
  container-type: inline-size;
}
@container (inline-size < 480px) {
  &[data-variant~="stack"] {
    & thead { display: none; }
    & tr { display: grid; grid-template-columns: max-content 1fr; gap: 0 1ch; }
    & td::before { content: attr(data-label); font-weight: var(--font-weight-semibold); }
  }
}
```

Watch: authors must set `data-label` on every `<td>` for the label to appear. Document it. Breakpoint should be customizable via a token (`--ui-table-stack-breakpoint`?).

---

## 5. Loading / empty states

Every DS does this well; ours doesn't touch it.

### 5a. Empty state

```css
& tbody:empty::before {
  content: attr(data-empty, 'No data');
  display: block;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-muted);
}
```

Or use a real `<tr data-row="empty">` pattern. Author chooses.

### 5b. Loading skeleton rows

Pure-CSS shimmer. `<tr data-row="loading">` gets an animated gradient background on each cell.

```css
& tr[data-row~="loading"] td {
  background: linear-gradient(90deg,
    var(--color-surface-alt) 0%,
    var(--color-surface) 50%,
    var(--color-surface-alt) 100%);
  background-size: 200% 100%;
  animation: ui-table-shimmer 1.4s linear infinite;
  color: transparent;
}
@keyframes ui-table-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

Watch: respect `prefers-reduced-motion` — disable the animation, keep a static tint.

---

## 6. `aria-sort` visual indicator

Interactive `<th>` with `aria-sort="ascending|descending|none"` gets a caret via `::after`. Pairs with the existing `th-outline` hover affordance to complete the "this column is sortable" story. Small, nice-to-have.

**Shape:**

```css
& th[aria-sort] {
  cursor: pointer;
  &::after {
    content: '';
    display: inline-block;
    margin-inline-start: .5ch;
    /* up/down caret via clip-path or background SVG */
  }
  &[aria-sort="ascending"]::after  { /* up caret */ }
  &[aria-sort="descending"]::after { /* down caret */ }
  &[aria-sort="none"]::after       { /* double-caret / muted */ }
}
```

Watch: caret asset — SVG data URL, Unicode ▲▼, or a CSS clip-path triangle. Pick the one that scales with font-size.

---

## Priority (subjective)

1. **Sticky `<tfoot>`** — small change, high utility, completes the sticky trio (thead + columns + tfoot).
2. **Empty / loading states** — every DS has them; ours is the outlier.
3. **Sticky-end columns** — completes the sticky-columns story.
4. **`aria-sort` indicator** — accessibility + visual polish in one small addition.
5. **`inline-border` variant** — easy, niche-but-recognizable look.
6. **Responsive stack-on-narrow** — highest visual impact, biggest implementation effort, most opinionated API (requires `data-label` on cells). Tackle last.
