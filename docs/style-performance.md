# Style performance — selector matching & invalidation in the attribute-token DSLs

> Companion to `performance.md`, which covers the pixel pipeline (animation cost, the
> CPU/GPU split, `will-change` policy). This document covers the **Style phase**:
> what Recalculate Style costs on a page built from `variant=` / `media=` / `content=`
> and `<lay-out>` breakpoint attributes, how Blink actually matches these selectors,
> what invalidation costs when a token flips, and how the model compares to a
> compiled utility-class system (Tailwind v4). Measurement date: 2026-08 on the
> bundle `dist/demo.890c384c.min.css`; reference page `ui/card/demo/schema.html`.

## 1. The question, and the verdict

Given a Chrome trace with high Style cost and low Layout cost, the textbook suspects
are selector complexity, over-broad invalidation, and custom-property churn — the
exact patterns this system is made of. So: **rethink all, none, or some of the DSL?**

**Verdict: SOME — [PLACEHOLDER: final verdict table after measurements]**

| DSL feature | Measured risk | Action |
|---|---|---|
| [PLACEHOLDER] | | |

## 2. Method

All numbers were captured with a CDP tracing harness (source: § Appendix) driving
headless Chromium 141 (`/opt/pw-browsers` build) via playwright-core, on the local
repo served by `python3 -m http.server`. Viewport 1280×900. Median of 5 runs for
every wall-time number (house rule, `performance.md` § Method); SwiftShader backend,
so only main-thread style/layout timings are trusted — no paint or layer claims.

Two trace configurations, **never mixed in one number**:

- **Clean** — `devtools.timeline`, `disabled-by-default-devtools.timeline`,
  `blink.user_timing`. Source of every millisecond figure: the sum of
  `UpdateLayoutTree` event durations in a marked window, with `args.elementCount`
  as "elements affected".
- **Stats** — clean plus `disabled-by-default-devtools.timeline.invalidationTracking`
  and `disabled-by-default-blink.debug`. The latter emits `SelectorStats` events
  (per-selector `elapsed (us)`, `match_attempts`, `match_count`,
  `fast_reject_count`) — the same data as DevTools' *Enable CSS selector stats*
  checkbox. Instrumenting every match attempt inflates recalc wall time, so stats
  runs supply **ratios and rankings only**, never totals.

Mutation scenarios bracket each flip with `performance.mark()` and a double
`requestAnimationFrame` (rAF callbacks run *before* the frame's style pass; the
second rAF guarantees the recalc lands inside the marks). The first 10 of 100
iterations are discarded (MatchedPropertiesCache warm-up). Scenario windows start
after `document.fonts.ready` + network idle, keeping the end-of-body custom-element
upgrades (and open-items §30's polyfill placement question) out of the windows.

## 3. The page and the bundle in numbers

`schema.html` is the stress case: one 442 KB stylesheet (78.5 KB over the wire),
~3,150 style rules, against a ~3,081-element DOM.

| | count |
|---|---|
| DOM elements (open tags) | ~3,081 |
| `ui-card` / `ui-media` / `ui-content` / `cq-box` | 73 / 73 / 75 / 81 |
| `lay-out` | 13 |
| `ui-chip` | 172 |
| microdata `<meta>` in body | 826 |
| elements carrying `media=` / `variant=` / `content=` | 74 / 84 / 842 attr occurrences |
| `itemprop=` occurrences | 1,862 |

Bundle selector inventory (`dist/demo.css`, unminified twin of the shipped bundle):

| pattern | count | pattern | count |
|---|---|---|---|
| `:where(` | 2,153 | `[media*=` | 1,067 |
| `:is(` | 722 | `[content~=` | 499 |
| `:not(` | 308 | `[variant~=` | 308 |
| `:has(` | 86 | layout `[bp*=` | 570 |
| `@container` | 45 (26 style-queries) | `[media~=` | 100 |
| `@property` | 45 (15 `inherits: true`) | `@media` | 64 |

The three DSLs deliberately use different matching operators (the manifest records
each token's mode): `media=` is ~82% substring `*=`, `content=`/`variant=` are ~97%
whole-token `~=`, layout breakpoint attributes are ~100% substring with the needle
including `(` so token names cannot cross-fire. The layout `xs` layer
(131 rules) has **no media query** — it is live at every viewport.

## 4. How Blink matches these selectors — predictions vs. measurements

Blink indexes every rule by its **rightmost compound**: rules whose rightmost
compound names a class, id, tag, or attribute go into buckets keyed on that name,
and an element only tests rules from the buckets its own features select. Ancestor
context (everything left of the last combinator) is checked only after the
rightmost compound matches, with a Bloom-filter fast-reject on the ancestor chain.
Attribute selectors bucket by attribute **name** — so all 1,067 `[media*=…]` rules
are candidates only for the ~74 elements that carry `media=` at all. `:where()`
affects specificity only; it has no matching cost of its own.

Predictions, and what the trace said:

| pattern family | predicted mechanism | measured | verdict |
|---|---|---|---|
| `[media*=]` (1,067 rules) | bucketed by attr name; substring scan per candidate | [PLACEHOLDER] | |
| `[content~=]` (499) | same, token scan | [PLACEHOLDER] | |
| layout `[bp*=]` (570) | same + ancestor Bloom reject | [PLACEHOLDER] | |
| `~=` vs `*=` | both post-bucket string scans — correctness choice, not perf | [PLACEHOLDER] | |
| `:has()` (86, 2 document-level) | no bucket help; ancestor/sibling invalidation walks | [PLACEHOLDER] | |
| 826 inert `<meta>` | display:none, skipped by style recalc | [PLACEHOLDER] | |
| rightmost-`*` arms (`…[media*="nav"] *`, `> *` ×204) | universal bucket — every element a candidate | [PLACEHOLDER] | |
| 15 `inherits: true` registered props | write ⇒ whole-subtree recalc | [PLACEHOLDER] | |

## 5. Measurements

### 5a. Initial style pass (page load to network-idle + settle)

| page | DOM els | CSS parse | recalc ms / els | reveal-all¹ ms / els | selector µs² | match attempts² |
|---|---|---|---|---|---|---|
| `schema.html` | ~3,081 | 6.4 ms | **102.1 / 1,211** | +17.2 / 227 | 193,249 | 1,921,108 |
| `cards.html` | ~545³ | 6.7 ms | 38.5 / 326 | +85.1 / 653 | 165,101 | 1,448,063 |
| `media.hover.html` | ~198³ | 6.5 ms | 19.7 / 123 | +20.8 / 230 | 57,113 | 484,287 |

¹ cost of then defeating `content-visibility: auto` (`visible !important` override).
² stats-run numbers — rankings/ratios only, not comparable to the clean-run ms.
³ smaller demo pages; both load the same 442 KB bundle as schema.html.

Parsing 442 KB of CSS costs **6.4 ms** — bundle size is a bandwidth question, not a
style-phase question. Initial recalc scales with DOM size (102 → 38 → 20 ms), not
with rule count (identical bundle on all three). The `[media*=]` family leads
selector time on every page, but the totals put it in perspective: on schema.html
all 538 `[media*=]` selectors together account for ~42 ms of *instrumented* time
(≈22% of selector time) across 346k attempts, and the whole selector-matching
budget sits inside a ~102 ms real recalc. The layout `[bp*=]` family (325 selectors,
337k attempts) shows a **98% fast-reject rate** — the ancestor Bloom filter and
attribute bucketing do their job. The 826 microdata `<meta>` elements cost ~0.3 ms
(§6 B3 confirms). The most expensive *per-attempt* family is `:has()`.

### 5b. Attribute-mutation cost — the core result

One token flipped on **one element** (median of 90 iterations, schema.html):

| flip | recalc ms | elements recalced | invalidations/toggle |
|---|---|---|---|
| `media=` + real token (`hov(zoom)`) | **36.4** | **534** | 29 |
| `media=` + nonsense token (`zzz`) | 36.6 | 534 | 29 |
| `variant=` + `md:row` | 37.6 | 537 | 29 |
| `lay-out` `lg=` + real token (`cg(2)`) | 10.9 | 203 | 8 |
| `lay-out` `lg=` + nonsense token | 10.9 | 200 | 7 |
| `content=` + `lg:hl(3xl)` | **2.0** | **33** | 7 |
| `classList` toggle, matched class | **0.65** | **7** | 10 |
| `classList` toggle, unmatched class | 0.73 | 7 | 7 |

Three facts fall out:

1. **The nonsense token costs the same as the real one.** The ~36 ms is pure
   invalidation-set fan-out plus re-matching — not the cost of applying new styles.
   The invalidation set Blink precomputes for "the `media` attribute changed on a
   card host" covers the host's whole subtree (descendant arms like
   `:is(ui-card, ui-reveal)[media*="…"] *` force this) *plus* `:has()`-driven
   re-evaluation (§6 attributes the split).
2. **`content=` is ~18× cheaper to flip than `media=`/`variant=`** despite having
   the most rules (499) and the most on-page occurrences (842). Its
   custom-property-only setter rules invalidate narrowly: 33 elements, 2 ms.
   The inheritance model the DSL leans on is the *cheap* part, not the expensive one.
3. **The class toggle is ~50× cheaper than the host-attribute flip** (0.65 ms/7 els
   vs 36 ms/534). This is Blink's class fast path plus a minimal invalidation set —
   the number the Tailwind comparison (§7) has to reckon with.

On the small contrast page the same ordering holds at smaller scale (media flip
14.4 ms/230 els, layout flip 9.3 ms/146, class 0.39 ms/1 el) — mutation cost scales
with the *invalidated subtree*, not the page.

### 5c. Runtime scenarios

- **Lightbox toggle** (`media.lightbox.html`): **452 ms / 4,344 elements** per open,
  the same per close. This stacks the three most expensive mechanisms at once: the
  whole `media=` string rewrite (full re-match of every `[media*=]` rule against the
  frame), the popover pseudo-class flip driving 14 `:has(ui-media:popover-open)`
  rules including a document-level `:where(html):has(…)`, and `inert` stamping along
  the ancestor chain. The isolated popover probe (below) shows the `:has()` share.
- **`:has()` probes**: `showPopover()` alone (no lightbox JS, no attribute rewrite)
  costs **186 ms / 1,422 elements**; toggling `data-part="cover"` on one element
  costs 36 ms / 502 (schema.html) — `:where(ui-card):has([data-part~="cover"])` is
  the single hottest selector in nearly every stats run.
- **hover.js rAF loop**: **0.13 ms / 1 element per recalc**, 12 ms total over a 3 s
  pointer stream, zero layout. The leaf-scoped write policy (`performance.md` §1.2)
  fully contains the two inheriting registered properties — the pattern the docs
  prescribe is confirmed at trace level.
- **Container-query resize** (schema.html, 1280→500→1280 sweep): style recalc is
  **15–18 ms per crossing** (140–190 elements) while Layout pays 80–117 ms — the
  container-query token arms are layout-bound, not style-bound. The md:/lg: token
  model is not a recalc problem.

## 6. Controls

[PLACEHOLDER — B0 stripped floor; B2a flat-class rule swap; B2b utility section
twin; B3 microdata removal.]

## 7. Tailwind v4 — could it do this, and would it be faster?

Token *naming* is already compared in `token-comparison.md` (browser.style
deliberately matches Tailwind's scale names where they overlap). This section is
about the two things that document doesn't cover: the **runtime style-phase cost**
of the two models, and whether Tailwind's compiled-utility model could **express**
these DSLs at all.

### 7a. Style-phase performance

[PLACEHOLDER — grounded in B2a/B2b and the class-flip control. The honest framing:
Blink's class buckets are its fastest path; a compiled utility sheet is small
(JIT output is typically 10–50 KB) and its selectors are flat single classes. The
counterweights: a token on a host replaces N leaf class edits at mutation time, and
the measured numbers decide whether any of this is material at real page scale.]

### 7b. Expressiveness — what survives translation

The v4 baseline is Chrome 150 / Safari 26.5 with typed `attr()`, container style
queries, `sibling-index()`, anchor positioning, `::scroll-marker` and popover
promotion load-bearing. Tailwind v4 (knowledge as of early 2026 — flag: verify
against current Tailwind before acting on this table) compiles class names to a
static sheet at build time; its variant system covers a lot of modern CSS, but the
DSLs here lean on mechanisms a per-element class model cannot reach:

| DSL feature | closest Tailwind v4 construct | parity |
|---|---|---|
| `md:`/`lg:` **container** token prefixes (`content="lg:hl(3xl)"` against the named `bs-card` container) | `@md:`/`@lg:` container-query variants, `@container/name` | **PARTIAL** — Tailwind's variants exist and support named containers, but they sit on the styled element itself; the DSL token sits on the *host* and styles descendants (`:is(cq-box, summary)` arm). Every affected leaf would need its own `@lg:` class |
| `content=` as **pure custom-property inheritance** — host sets `--ui-content-*`, consumers 5 `var()` levels deep, flowing through `lay-out-group` and arbitrary wrappers, with a 16-flag reset at nested-card boundaries | arbitrary properties `[--x:_y]` + `(--x)` consumption | **NONE — this is the crux.** Tailwind can *set* a custom property on an element, but the pattern here is set-on-ancestor / consume-in-component-CSS: the component sheet (the thing Tailwind replaces) is what reads the properties. Reproducing it means writing component CSS anyway — at which point Tailwind is no longer the styling system, just a token source |
| `media=` **scope boundary** — inheritance stops at the nearest card host; a nested card never inherits the outer card's media tokens | — | **NONE** — utilities have no scoping construct; a class means the same thing wherever it lands. The boundary would move into markup discipline (remember to re-specify everything on every nested card) |
| Typed `attr()` values (`bleed`, `columns`, `rows`, `max-width`, `subgrid` count) | — | **NONE** — no Tailwind mechanism reads a value out of another attribute; each value becomes another class (`columns-3`), which is exactly the enumeration the DSL avoids |
| `:has()` relational rules (86 in bundle: popover promotion, cover-link fallout, collage sizing) | `has-[...]` variants | **PARTIAL** — expressible per element, but the deep forms (`:has()` inside `:not()` inside `:has()`, document-level `html:has(...)`) become unreadable arbitrary variants, and the *invalidation cost is identical* — `:has()` is a browser cost, not a DSL cost |
| Container **style()** queries (`@container style(--_subgrid: on)`, hover-effect dispatch, `if(style(--_pg: 0))`) | — | **NONE** — no variant targets style queries; the flag-relay pattern (ancestor sets a flag, children restyle via style query) is inherently component-CSS |
| `sibling-index()` paging math, anchor positioning (`self-start`/`self-end`), `::scroll-marker` / `::scroll-button()` carousels | — | **NONE** — pseudo-elements and functions Tailwind has no utilities for; would ship as custom CSS alongside |
| lay-out breakpoint attributes (`lg="grid(3a) cg(2)"` → generated `@media` rules with `nth-child` area maps) | responsive variants `lg:grid-cols-3` + arbitrary `nth-child` variants | **PARTIAL** — plain column counts translate; the named grid *patterns* (bento, mosaic, asym with per-child `nth-child` placement) would need one class per child per breakpoint, hoisting layout knowledge out of the layout system into every page |
| `theme=` surface/ink bundles (nine hues × pale/muted, paired `--ui-theme-*-bg/-c`) | color utilities per element | **PARTIAL** — colors translate; the bundled surface+ink+border semantics with `contrast-color()` do not |

The user-facing summary: **the leaf declarations translate; the system does not.**
What the DSLs actually sell — one attribute on a host driving a coordinated set of
descendants through container queries, inherited custom properties and style-query
relays, with scope boundaries at component hosts — has no utility-class spelling.
A Tailwind port would keep the component stylesheets for everything structural and
use utilities only for per-element overrides, i.e. it would not replace the DSL; it
would sit beside it. The performance question (§7a) is therefore not "switch?" but
"is the DSL's matching model paying a tax the utility model wouldn't?" — answered
by the measurements above.

## 8. Verdict & candidates

[PLACEHOLDER — all/none/some with per-feature risk ratings, candidate optimisations
only where measurements justify: config-gated six-way lane selectors (open-items
§25), hot [media*=] hoists, contain: style, microdata cost, polyfill placement
(§30), plus explicit non-recommendations.]

## 9. Appendix

[PLACEHOLDER — raw result tables, harness source (lib.mjs, scenarios.mjs,
census.mjs, variant benches), event-name census, repro commands.]
