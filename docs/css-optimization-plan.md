# CSS Optimization — Analysis & Plan

> Scope: `layout/`, `ui/base/`, `ui/card/`, `ui/reveal/` only.
> Goal: optimize the CSS **itself** — simpler selectors, smarter authoring patterns,
> smaller generated output. Minification and per-project `layout.config.json`
> trimming are explicitly out of scope (already known/available).
>
> Status: every item marked ✅ is implemented on PR #27 (branch
> `claude/tokenize-layout-card-attrs-qfy28l`, targeting `v4`, unmerged).
> Items marked ✋ were analyzed and deliberately left alone, with the reason.

---

## 0. Precondition check — layout ↔ base decoupling

**Holds.** `dist/layout.css` bundles no ui/base payload (only `var()` *reads* of
`--spacing-*`/`--radius-*` etc. with inline fallbacks), the layout core files have
no `@import` of base, and all demo pages link `/ui/base/index.css` in the HTML.
No double-loading anywhere.

---

## 1. Generated layout CSS — grouped selectors for identical bodies ✅

**The problem.** The builder emitted one rule per (selector, body) pair, so the
same declaration body was re-serialized for every variant that used it:

```css
/* before — same body, 22 separate rules across the file */
lay-out[lg*="bento(6a)"] > *:nth-child(6n+1) { --layout-ga: span 2 / auto; }
lay-out[lg*="bento(7a)"] > *:nth-child(7n+3) { --layout-ga: span 2 / auto; }
lay-out[lg*="grid(3d)"]  > *:nth-child(3n+2) { --layout-ga: span 2 / auto; }
…
```

**The optimization.** Within one media-query bucket, coalesce identical bodies
into a single rule with a grouped selector list:

```css
/* after — one rule */
lay-out[lg*="bento(6a)"] > *:nth-child(6n+1),
lay-out[lg*="bento(7a)"] > *:nth-child(7n+3),
lay-out[lg*="grid(3d)"]  > *:nth-child(3n+2) {
  --layout-ga: span 2 / auto;
}
```

**Why it's safe (and when it isn't).** Grouping moves a later rule up to the
group's first occurrence, so a merge is only allowed when no rule *in between*
(a) sets one of the same properties with a different value AND (b) could match
the same element. The builder now proves disjointness from the system's own
contracts:

- different layout variants never co-match — an element has one layout token
  per breakpoint attribute (`lg="bento(6a)"`, not two layouts at once);
- same-variant `:nth-child(An+B)` vs `:nth-child(An+C)` with `B≠C` are
  different residues mod A — provably never the same child;
- everything else (reset rules on `[lg]`, `&>*` vs `:nth-child`, spacing vs
  layout tokens) is treated conservatively as "may co-match" and blocks the merge.

**Result.** `dist/layout.css` 56.6 → 52.8 KB raw (−6.8%); `layout.min.css`
39.0 → 36.1 KB (−7.4%). Verified behaviorally: 744 element snapshots
(6 viewports × 124 variant/spacing/items/subgrid combos) — identical.

**What selectors can NOT get shorter.** The `[lg*="token(value)"]`
attribute-substring matchers are the entry point of the packed-token DSL and
must stay one-per-token: style queries can't substring-match an attribute, and
typed `attr()` reads whole attribute values only. The win is *emitting each
body once*, not shortening individual selectors.

## 2. Subgrid — per-breakpoint bodies → one style-query body ✅

The 4-declaration subgrid child body was re-emitted for every breakpoint
(md/lg/xl/xxl × on/off = 16 rules). Now `core/base.css` carries the body once:

```css
@container style(--_subgrid: on) {
  & > :not(lay-out) { container-type: normal; display: grid;
    grid-row: span var(--_sg, 1); grid-template-rows: subgrid; }
}
```

and the builder emits only 2-declaration flag flips per breakpoint
(`--_subgrid: on|off` + the container's physical rows). `--_subgrid` is a
registered **non-inheriting** property, so a nested `<lay-out>` can't inherit a
wrapper's subgrid state.

Side effect (intentional fix): `subgrid(off)` now truly reverts — the old
cumulative-`@media` emission left `display: grid` dangling on children forever
and force-set `container-type: inline-size` on every child. Card children are
byte-identical before/after; only plain non-card children revert differently
(correctly).

## 3. ui/base/carousel.css — nesting collapse ✅

The host prefix `:where(ui-card, ui-reveal, ui-media, lay-out[overflow])` was
repeated verbatim on 32 token-setter rules. Collapsed under parent blocks:

```css
:where(ui-card, ui-reveal, ui-media, lay-out[overflow]) {
  &:where([media*="mrk(sm)"]) { --ui-carousel-marker-size: 0.45rem; … }
  &:where([media*="mrk(md)"]) { … }
}
```

The leading `&` compounds onto the parent (identical matching to the old flat
prefix); the inner `:where()` keeps every rule at 0-0-0, preserving the file's
documented source-order override invariant. Dual ancestor/self arms stay
top-level; source order unchanged. Verified byte-identical computed styles for
48 `media=` combos × 6 host shapes.

## 4. ui/reveal — style-query animation dispatch ✅

Every geometry/icon/scroll/clearance rule repeated the 5-token enumeration of
its animation family (and `lg:scl` shipped a byte-identical ~800 B copy of the
scale-morph geometry). Now each family writes ONE flag onto `> details`
(a named style container, `bs-rvl`; `--_rvl` registered non-inheriting):

```css
&:where([variant~="flp"], [variant~="flp(top)"], …) > details { --_rvl: flp; }

@container bs-rvl style(--_rvl: flp) { /* the ONLY flip geometry block */ }

@container (inline-size >= 44rem) {
  :where(ui-reveal:is([variant~="lg:scl"], …)) > details { --_rvl: scl; }
}
```

- each family's tokens enumerated exactly once (~40 selector-list instances removed)
- the `lg:` tier swap is a flag re-flip — no duplicated geometry to keep in sync
- `scr` now works with base `scl` too (previously only `lg:scl` had the rule)

Verified: 37 variant combos × 2 container widths × closed/open — equivalent
except one visually inert case (closed zero-height hidden panel no longer
paints an invisible background).

## 5. ui/card — dead `rds()` spellings ✅

`rds(crc)`, `rds(pll)`, `rds(*-sqr)` had zero usage in any markup, preset, or
doc (documented API: `full`/`pill`/`*-sq`) — dropped from both the `variant=`
and `media=` mappings. `scm(sld)`/`scm(solid)` were kept at the time as canonical +
alias; the `scm(solid)`/`scm(sheer)` aliases were **removed in the v5 sweep** — see the
v5 alias batch in `docs/plans/2026-07-26-v4-card-system-architecture-analysis.md`.

## 6. ui/base/shapes.css — split the glyph catalog ✅

`shapes.css` keeps only the `--shp-*` clip-reveal pairs that base features use
(media `shp()` clips, `animate-self="reveal()"`). The `--shape-*` glyph/badge
catalog moved to `shapes-glyphs.css`, imported by its consumers (`ui/icon`,
`ui/sticker`) — pages without icon/sticker drop ~5.4 KB, no page changes needed.

---

## Sizes (raw / gzip, bytes)

| File | Before | After |
|---|---|---|
| ui/base/carousel.css | 49 522 / 8 180 | 48 467 / 8 315 |
| ui/base/shapes.css (default chain) | 7 750 / 2 965 | 1 862 / 824 |
| ui/card/ui-card.css | 18 673 / 4 471 | 18 526 / 4 441 |
| ui/card/media.css | 16 008 / 4 051 | 15 784 / 3 996 |
| ui/reveal/ui-reveal.css | 24 824 / 6 379 | 24 902 / 7 188 |
| layout/dist/layout.css | 56 610 / 9 151 | 52 780 / 9 560 |
| layout/dist/layout.min.css | 38 966 / 5 906 | 36 084 / 5 831 |

Honest gzip note: repetition compresses extremely well, so dedup-heavy items
are roughly gzip-neutral (carousel/reveal slightly up from added documentation
comments). The durable wins are raw size, the shapes-chain cut, and structure —
one source of truth instead of byte-identical copies.

---

## ✋ Already optimal — analyzed, leave alone

- **Whole-token `~=` enumerations** (variant/content ladders): substring `*=`
  is provably unsafe with `lg:` prefixes (`[variant*="scl"]` matches `lg:scl`).
  The enumerations are the correct defensive form; the reveal dispatch reduced
  *how often* they're written, not their form.
- **The typography ladder** (`content.typography.css`): a saturating lookup
  table of hand-tuned `clamp()` stops — not arithmetic, not indexable; per-tier
  `@container` wrappers are structurally required. Gzips 8.6 KB → 0.9 KB anyway.
- **Furniture 9-cell / `asr()` / corner grids**: per-token setters are the
  minimal form given tokens live in packed attribute strings.
- **Theme bundles**: already `light-dark()`-based. **Keyframe library**: broadly
  used, not dead weight.
- **Cumulative config listings** (`bento(6a)` at xl AND xxl): *not* duplicates —
  they target different attributes (`[xl*=…]` vs `[xxl*=…]`); removing one
  removes API surface (that's config trimming, out of scope).
- **base.css + group.css each opening `@layer layout.base`**: re-opening a layer
  is semantically identical and costs ~24 bytes; merging would hurt modularity.

## ✋ Structurally impossible or deferred

- **Typed `attr()` for packed tokens**: `attr()` reads whole attribute values —
  no substring extraction. This is the accepted trade of the packed-token DSL.
- **Style-query dedup of the `content=` typography tiers**: style queries
  resolve against an *ancestor* container, which breaks the documented
  standalone `<ui-content content="…">` use (an element's own properties are
  invisible to its own style queries). Attribute selectors stay.
- **`attr(easing type(<easing-function>))`** for the 81-rule easing map: only
  possible by changing the public API to raw curves (loses the named catalog) —
  there is no CSS token-pasting (`var(--ease-{name})`). Dead end.
- **`if(style())`**: Chromium-only today; the `@container style()` dispatch
  achieves the same collapse with Chrome + Safari 18+ (the agreed target).
- **`@function`**: could name the `calc(var(--x) * var(--layout-space-unit))`
  idiom; experimental support only. Revisit later.

---

## Verification method (all on PR #27)

- Chromium smoke suite — 17/17 green (layout overflow carousels, card/media
  carousels, media= scoping leak checks, reveal flip/exp/pop/icons, animate).
- Before/after computed-style equivalence harnesses: carousel (48 combos × 6
  host shapes, byte-identical), layout (744 snapshots across 6 viewports),
  reveal (37 combos × 2 widths × closed/open).
- Demo screenshots (reveal grid, open pop popup) render correctly.
