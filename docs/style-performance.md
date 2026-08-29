# Style performance — selector matching & invalidation in the attribute-token DSLs

> Companion to `performance.md`, which covers the pixel pipeline (animation cost, the
> CPU/GPU split, `will-change` policy). This document covers the **Style phase**:
> what Recalculate Style costs on a page built from `variant=` / `media=` / `content=`
> and `<lay-out>` breakpoint attributes, how Blink actually matches these selectors,
> what invalidation costs when a token flips, and how the model compares to a
> compiled utility-class system (Tailwind v4). Measurement date: 2026-08 on the
> bundle `dist/demo.890c384c.min.css`; reference page `ui/card/demo/schema.html`.
> The §8.1 rework has since shipped (bundle `demo.2bc02287.min.css`) — after-numbers
> inline in §8. Plain-language version: [`style-performance.summary.md`](style-performance.summary.md).

## 1. The question, and the verdict

Given a Chrome trace with high Style cost and low Layout cost, the textbook suspects
are selector complexity, over-broad invalidation, and custom-property churn — the
exact patterns this system is made of. So: **rethink all, none, or some of the DSL?**

**Verdict: SOME — keep the DSL architecture, fix the `:has()` coupling.** The
attribute-token model itself measures sound: Blink buckets attribute selectors by
name, so 3,150 rules cost a 3,081-element stress page ~102 ms once at load and
single-digit ms thereafter, and the DSL's most distinctive mechanism — `content=`
as custom-property inheritance — is the *cheapest* thing measured. The one real
cost is not a DSL-design cost: `:has()` rules whose arguments name DSL attributes
make every runtime `media=`/`variant=` mutation re-evaluate ~500 elements (~35 ms,
94% of the flip cost), even on pages where those rules can never match.

| DSL feature | measured risk | action |
|---|---|---|
| `media=`/`variant=` host tokens, substring matching | initial pass affordable; flips 36 ms — but 94% is `:has()`, residual 2.3 ms | **keep**; fix the `:has()` args (§8.1) |
| `content=` custom-property inheritance | cheapest path measured: 2 ms / 33 els per flip | **keep** — validated |
| `md:`/`lg:` container-query token arms | resize crossings 15–18 ms style, layout-bound | **keep** — not a recalc problem |
| layout `xs=`–`xxl=` attrs (incl. unconditional `xs` layer) | 98% fast-reject; flips 11 ms (intended section-scale restyle) | **keep** — §25 stays a correctness item |
| `:has()` args naming DSL attributes (`media` ×11, `variant` ×4, `data-part` ×4, `aria-pressed` ×1) | **the** cost: 35 ms tax on every such attribute mutation, page-wide | **reworked + lint-guarded** — DONE 2026-08-29, flip now 2.0 ms (§8.1) |
| lightbox open/close (full `media=` string swap + popover `:has()`) | 452 ms / 4,344 els per toggle | **candidates listed** (§8.3) — one-off UX moment, user judges |
| microdata `<meta>` payload | 2.3 ms of a 37.8 ms full-tree recalc | **keep** — free |
| bundle size (442 KB, one shared sheet) | 6.4 ms parse; no match-cost correlation | **keep** — delivery question only |

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

Predictions, and what the trace said (stats-run numbers are the full-tree forced
recalc of §6 B1 unless noted):

| pattern family | predicted mechanism | measured | verdict |
|---|---|---|---|
| `[media*=]` (1,067 rules) | bucketed by attr name; substring scan per candidate | 22% of instrumented selector time on load; flattening its top-level rules to classes removes 14 ms of a 37.8 ms full-tree recalc (§6 B2a) | **confirmed, affordable** — cost exists but only in full-tree passes, which are load + resize only |
| `[content~=]` (499) | same, token scan | 1.23M attempts → **120 matches**, 59% fast-reject, 8% of selector time | confirmed — wasteful *ratio*, trivial absolute cost; mutation side is the cheapest of all DSLs (2 ms) |
| layout `[bp*=]` (570, `xs` layer unconditional) | same + ancestor Bloom reject | 338k attempts, 74 matches, **98% fast-reject**, ~7% of selector time | confirmed — bucketing + Bloom filter absorb the unconditional `xs` layer; a runtime non-issue (open-items §25 stays a correctness item) |
| `~=` vs `*=` | both post-bucket string scans — correctness choice, not perf | per-attempt cost 0.06–0.14 µs for both families (instrumented); difference tracks selector complexity, not operator | confirmed — keep choosing the operator for collision-safety, not speed |
| `:has()` (86, 2 document-level) | no bucket help; ancestor/sibling invalidation walks | most expensive family per attempt (0.55 µs); **deleting all 73 `:has()` rules takes the `media=` flip from 37.5 ms → 2.3 ms** (§6); `showPopover()` alone recalcs 1,422 els / 186 ms | **confirmed as THE cost** — see §6 and §8 |
| 826 inert `<meta>` | display:none, skipped by recalc | removing them saves 2.3 ms of a 37.8 ms full-tree recalc, ~0.3 ms on load | confirmed — microdata is essentially free |
| rightmost-`*`/pseudo arms (`> *` ×204, `&::before`/`&::after`) | universal bucket — every element a candidate | `&::before`/`&::after` lead per-selector attempt counts on every page (~25k attempts each on load) | confirmed as the background hum inside the "other" family — diffuse, no single fix |
| 15 `inherits: true` registered props | write ⇒ whole-subtree recalc | hover.js rAF writes: **0.13 ms / 1 element** per recalc | confirmed *safe* when written on leaves — the `performance.md` §1.2 policy is load-bearing |

One mechanism deserves its own paragraph because it explains most of §5b:
**Blink tracks which attribute names appear inside `:has()` arguments, and a
mutation of such an attribute re-evaluates `:has()` state at page scale.** In this
bundle, `media` appears as a needle in 11 `:has()` arguments (the 10 lightbox
`asr()` placeholder-ratio rules plus the `nav` arm), `variant` in 4, `data-part`
in 4, `aria-pressed` in 1. Consequence:
flipping `media=` on one card re-evaluates ~500 elements for ~35 ms **even on a
page where none of those `:has()` rules can ever match** (schema.html has no
`ui-media[popover]`). The `flip-ab` experiment (§6) proves the attribution twice
over: deleting all `:has()` rules, or flattening only the `[media…]`-referencing
rules, both collapse the flip to ~2.3 ms with the other 1,000+ attribute rules
still in place.

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

All controls use a forced full-tree recalc probe (an injected
`html.__bench * { outline-color: transparent }` rule, class toggled on `<html>`,
first 5 of 20 recalcs discarded), median of 5 fresh page loads, schema.html.

**Stylesheet variants** (served via request interception):

| variant | forced recalc | delta vs B1 |
|---|---|---|
| **B1** — shipped bundle | **37.8 ms** | — |
| **B0** — author CSS removed (UA floor) | 5.3 ms | −32.5 ms: the total author-CSS style cost, all families |
| **B3** — B1 with all 826 `meta[itemprop]` removed | 35.5 ms | −2.3 ms: microdata's whole contribution |

**B2a — in-place utility flattening** (CSSOM: matching rules' `selectorText`
rewritten to a single class, that class sprayed onto the exact elements the
original selector matched — identical declarations, identical elements,
identical `@container`/`@media` nesting; only the *matching model* changes):

| flattened | rules swapped | forced recalc | delta |
|---|---|---|---|
| `[media*=]` top-level rules | 29 (+258 no-match rules neutralised) | 37.8 → 23.6 ms | −14.2 ms |
| all DSL families (`media`/`content`/`variant`/`theme`/bp/`animate`/`stagger`/`data-part`/`overflow`) | 84 (+1,181 neutralised) | 37.2 → 18.2 ms | −19.0 ms |

So compiling the *entire* DSL selector surface down to Tailwind-shaped flat
classes halves a full-tree recalc (37 → 18 ms against a 5.3 ms floor). That is
the honest size of the utility model's matching advantage — and §5c shows how
rarely full-tree recalcs happen outside load (resize crossings run 15–18 ms).

**flip-ab — mutation-cost attribution** (the `media=` real-token flip from §5b,
re-measured before/after an in-page CSS transform, 5 runs × 50 iterations):

| transform | flip before | flip after | elements before → after |
|---|---|---|---|
| delete all `:has()` rules (73) | 37.5 ms | **2.3 ms** | 534 → 39 |
| flatten `[media…]` rules incl. the `:has()` args that reference `media` | 37.1 ms | **2.4 ms** | 534 → 42 |

Two different transforms, same collapse: **~94% of the host-attribute mutation
cost is `:has()` re-evaluation**, not attribute-selector matching. The residual
2.3 ms vs the 0.65 ms class-toggle control is the true price of the attribute
invalidation sets (descendant arms like `[media*="…"] *` fan a host flip out to
~39 elements) — real, but 16× smaller than the `:has()` share.

B2b as planned (a hand-built utility twin of one section) was superseded by B2a's
all-DSL flatten: rewriting the real page's rules in place gives declaration parity
by construction, which a hand-derived twin can only approximate.

## 7. Tailwind v4 — could it do this, and would it be faster?

Token *naming* is already compared in `token-comparison.md` (browser.style
deliberately matches Tailwind's scale names where they overlap). This section is
about the two things that document doesn't cover: the **runtime style-phase cost**
of the two models, and whether Tailwind's compiled-utility model could **express**
these DSLs at all.

### 7a. Style-phase performance

The measurements let this be answered without hand-waving. Modelling Tailwind as
"flat single-class selectors on the styled element" (its compiled output shape),
the B2a flatten and the class-flip control give the utility model's ceiling on
this exact page:

- **Full-tree recalc**: 37.8 → 18.2 ms with every DSL family flattened (§6). The
  utility matching model *is* roughly 2× faster here — Blink's class buckets and
  one-element invalidation sets are its fastest path, as predicted. But full-tree
  recalcs occur at load (102 ms total on a 3,081-element stress page) and viewport
  resize (15–18 ms); neither is a user-perceivable problem today, so the 2× buys
  ~10–20 ms in scenarios that are already cheap.
- **Mutation**: class toggle 0.65 ms vs host-attribute flip 36 ms looks like a 50×
  utility win — but §6 shows 94% of that gap is `:has()` invalidation, which is a
  *browser* cost, not a DSL cost. A Tailwind page using `has-[...]` variants (the
  idiomatic spelling of the same UI) pays the identical tax. DSL vs utility per se
  is 2.3 ms vs 0.65 ms — 3.5×, at absolute levels (single-digit ms, and only when
  JS rewrites a token at runtime, which this system does rarely) that don't matter.
- **Bytes and parse**: JIT output would be far smaller than 442 KB, but the wire
  cost is 78.5 KB (brotli) shared across ~29 pages, and *parsing* the whole bundle
  costs 6.4 ms. There is no style-phase bundle-size problem to fix.
- **What the utility model gives back**: 842 `content=` occurrences would become
  per-leaf class lists; one host token today edits one attribute where the utility
  model edits N leaves (each cheap, but the coordination moves into JS/markup).
  And the DSL's cheapest measured path — `content=` custom-property inheritance,
  2 ms flips — has no utility equivalent at all (§7b).

**Answer: Tailwind's matching model is measurably faster, and it does not matter
on this page** — the one genuinely expensive number (the 36 ms token flip) is
caused by `:has()` argument coupling that would cost a utility page the same, and
is fixable inside the DSL (§8) without giving up anything.

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

The §1 table is the summary; these are the concrete follow-ups the measurements
justify, and — as important — the ones they rule out.

### 8.1 Rework the `:has()` rules that name DSL attributes (the one real win)

> **IMPLEMENTED 2026-08-29** (same branch; final bundle `demo.5819eaf5.min.css`).
> The 10 lightbox `asr()` mirrors are gone — replaced **zero-JS**: the renderer
> echoes a frame-placed `asr()` token onto the host at build time
> (`render.js` `lightboxHostMedia`), so the placeholder ratio rides ordinary
> custom-property inheritance; verified in-browser with JavaScript disabled.
> (A first iteration used a lightbox.js relay; it was replaced the same day to
> honour the system's CSS-first contract.) The cover `nav` rule is host-arm only
> (card.md § cover documents the constraint); the PiP rule keys on
> `ui-play[open]` alone.
> **Measured after: the `media=` token flip is 2.0 ms / 39 elements** (was
> 36.4 ms / 534) — deleting every remaining `:has()` rule shaves only 0.17 ms
> more, so the surviving (`variant`/`data-part`/`type`) arguments no longer tax
> `media=` writes at all. The lightbox toggle went 452 → 420 ms: its remaining
> cost is the `media-open=` full-string swap re-matching (§8.3), not `:has()`.
> The §8.2 lint guard ships in `tokens.lint.js` (11 errors on the pre-fix sheets,
> 0 after). All gates green: 318/318 renderer tests, 38/38 transcriptions,
> byte-identical SSR snapshot, browser-verified placeholder ratios in both
> placements.

The original analysis and design, kept for the record:

The 10 lightbox placeholder-ratio rules
(`:where(ui-card, ui-reveal):has(ui-media[media~="asr(…)"]:popover-open) …::before`
— nine canonical ratios plus the generic `asr(` arm) put `media` inside `:has()`
arguments, taxing every `media=` mutation on every page ~35 ms. Candidate shapes, in order of preference:

1. **Move the ratio out of the `:has()` argument.** The host already has rules
   matching `[media~="asr(1/1)"]` etc. directly (the `asr()` family) — those can
   set a custom property (`--ui-lightbox-placeholder-ar: 1/1`) unconditionally,
   and the `:has()` arm reduces to ONE rule keyed only on `:popover-open`
   (`:has(ui-media:popover-open)`) that consumes the property. `media` disappears
   from every `:has()` argument; the placeholder keeps working.
2. Same treatment for the `nav` arms (`:has(ui-media[media*=nav])` → a flag
   property set by the plain `[media*="nav"]` rule, consumed via a style query or
   inherited property).
3. `variant`, `data-part` and `aria-pressed` arguments reviewed the same way —
   `data-part` in particular taxes the cover-link family (36 ms / 502 els per
   toggle, §5c), and `aria-pressed` is written by `shared.js` on every video
   play/pause.

This is CSS-shape work inside existing files — no token vocabulary change, no
markup change. Expected effect, from the flip-ab numbers: runtime token flips drop
from ~36 ms to ~2 ms.

### 8.2 Lint guard: no DSL attribute needles inside `:has()` arguments

`tokens.lint.js` already audits needle↔manifest sync. Add one check: fail if
`media`/`content`/`variant` (or a lay-out breakpoint attribute) appears inside a
`:has(…)` argument in any card/layout sheet, pointing at this document. That makes
8.1 stick.

### 8.3 Lightbox toggle (452 ms) — candidates, not a prescription

The toggle stacks the media-string swap (full re-match), the popover `:has()`
promotion and ancestor `inert` stamping. 8.1 removes the largest share it can
remove; if more is wanted afterwards, the candidates are: swapping only the
control words that actually changed (lightbox.js already computes the union), and
narrowing the `:where(html):has(ui-media[popover]:popover-open)` document rule to
key on the frame's own state. It is a once-per-user-gesture cost on one demo
family — measured again after 8.1: **452 → 420 ms**, and the stats run shows the
remainder is the swap's re-match volume (4.8 M attempts against `[media*=]` rules
per toggle), so the swap-narrowing candidate is where any further work goes.

### 8.4 Explicit non-recommendations (measured, then rejected)

- **Do not migrate any DSL to utility classes for performance.** The whole-DSL
  flatten (§6 B2a) buys ~19 ms on a full-tree recalc that happens at load and
  resize only, and §7b shows the system's semantics don't survive the port.
- **Do not hoist `[media*=]` to `~=` for speed.** Per-attempt costs are
  indistinguishable (§4); the operator split stays a correctness tool.
- **Do not config-gate the unconditional `xs` layer for perf** (open-items §25
  remains a *correctness* item): 98% fast-reject means the runtime cost is noise.
- **Do not strip or restructure microdata** — 826 `<meta>` elements cost 2.3 ms in
  the worst case measured.
- **Do not add `contain: style`** anywhere on this evidence: the invalidation that
  hurts crosses card boundaries via `:has()`, which containment does not stop —
  8.1 removes the cause instead.
- **Bundle splitting for style-phase reasons stays rejected** (`performance.md`
  §2 reached the same conclusion from the delivery side): parse is 6.4 ms and
  matching cost tracks the DOM, not the sheet.

`hover.js`'s leaf-write policy and the `content=` inheritance design are validated
as-is — they are the patterns to copy, not to revisit.

## 9. Appendix

### 9a. Reproduction

```bash
cd <repo-root> && python3 -m http.server 8710 &
mkdir harness && cd harness            # any dir with playwright resolvable
# save the sources from 9c, then:
node census.mjs 8710                    # event census — verify SelectorStats first
node scenarios.mjs initial 8710         # scenario a; also: flips, lightbox, hover, has, resize
node scenarios.mjs flips 8710 /ui/card/demo/media.hover.html
node bench-variant.mjs 8710 /ui/card/demo/schema.html b1 -
node b2a.mjs 8710 /ui/card/demo/schema.html media '\[media\*='
node flip-ab.mjs 8710 /ui/card/demo/schema.html nohas delete-has
```

Chromium binary: pass an `executablePath` in `lib.mjs` (`/opt/pw-browsers/…` in the
original environment). Numbers in this doc: headless Chromium 141, SwiftShader,
1280×900, 2026-08.

### 9b. Load-time top selectors (schema.html, stats run — instrumented µs)

| selector | µs | attempts | matches | fast-reject |
|---|---|---|---|---|
| `&::before` | 4,654 | 24,825 | 94 | 3,472 |
| `&::after` | 3,831 | 24,771 | 193 | 3,582 |
| `&::scroll-marker-group` | 3,099 | 13,070 | 36 | 34 |
| `:where(ui-card):has([data-part~="cover"])` | 3,075 | 203 | 41 | 0 |
| `&::scroll-button(block-start)` | 2,989 | 16,677 | 86 | 0 |
| `:where(ui-media, lay-out[overflow]):where([media*="mrk(tmb)"]) > :not(ui-beacon, ui-chi…` | 2,842 | 1,853 | 0 | 391 |
| `& > :not(lay-out)` | 2,743 | 16,677 | 221 | 9,329 |
| `&::scroll-button(block-end)` | 2,361 | 16,677 | 86 | 0 |
| `& > :nth-child(1 of :not(ui-beacon, ui-chip, ui-lightbox, ui-marquee, ui-play, ui-save,…` | 1,796 | 1,853 | 0 | 0 |
| `& > :not(ui-beacon, ui-chip, ui-lightbox, ui-play, ui-save, ui-sticker)::scroll-marker` | 1,670 | 3,706 | 15 | 0 |
| `&::scroll-button(*)` | 1,633 | 5,696 | 148 | 137 |
| `ui-media :is(iframe, img, picture, video)` | 1,533 | 24,089 | 55 | 18,889 |
| `& > *` | 1,529 | 12,971 | 481 | 6,644 |
| `:where([media~="open:grid(2c)"], :is(ui-card, ui-reveal)[media~="open:grid(2c)"] *)` | 1,514 | 1,853 | 0 | 0 |
| `:where(ui-card, ui-reveal):has(ui-media:focus-visible:not(:where(ui-media *)))` | 1,495 | 1,853 | 0 | 0 |
| `lay-out:has(ui-reveal[variant~="exp"][variant~="pop"] > details[open])` | 1,378 | 99 | 0 | 0 |
| `&::scroll-button(inline-start)` | 1,295 | 5,658 | 77 | 34 |
| `&::scroll-button(*):focus-visible` | 1,114 | 5,559 | 18 | 0 |
| `&::scroll-button(*):disabled` | 1,095 | 5,559 | 52 | 0 |
| `ui-card:not(:has(ui-media))` | 1,007 | 203 | 3 | 0 |

The event census confirmed `SelectorStats` is emitted under
`disabled-by-default-blink.debug` with fields `elapsed (us)` / `match_attempts` /
`match_count` / `fast_reject_count`, and `UpdateLayoutTree` carries
`args.elementCount`. One Chromium-version note for reproducers: every
`CSSStyleRule` now exposes a (possibly empty) `.cssRules` list (CSS nesting), so
CSSOM walkers must branch on `instanceof CSSStyleRule`, not truthiness.

### 9c. Harness source

#### `lib.mjs`

```js
// Shared CDP tracing harness for the style-recalc study.
// Run: NODE_PATH=/opt/node22/lib/node_modules node <script>.mjs
import { chromium } from 'playwright';

export const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export const CATS_CLEAN = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'blink.user_timing',
];
export const CATS_STATS = [
  ...CATS_CLEAN,
  'disabled-by-default-devtools.timeline.invalidationTracking',
  'disabled-by-default-blink.debug',
];

export async function launch() {
  const browser = await chromium.launch({ executablePath: EXE });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const tracing = await browser.newBrowserCDPSession();
  const cdp = await context.newCDPSession(page);
  return { browser, context, page, tracing, cdp };
}

// Trace fn() under the given categories; returns raw trace events.
export async function trace(tracing, cats, fn) {
  const evts = [];
  const onData = (e) => evts.push(...e.value);
  tracing.on('Tracing.dataCollected', onData);
  await tracing.send('Tracing.start', {
    traceConfig: { includedCategories: cats, excludedCategories: ['*'] },
  });
  await fn();
  const done = new Promise((r) => tracing.once('Tracing.tracingComplete', r));
  await tracing.send('Tracing.end');
  await done;
  tracing.off('Tracing.dataCollected', onData);
  return evts;
}

// Sum `dur` (ms) of complete events with a given name inside [t0,t1] (trace ts, µs).
export const sumDur = (evts, name, [t0, t1] = [0, Infinity]) =>
  evts
    .filter((e) => e.name === name && e.dur && e.ts >= t0 && e.ts <= t1)
    .reduce((a, e) => a + e.dur, 0) / 1000;

export const sumField = (evts, name, getter, [t0, t1] = [0, Infinity]) =>
  evts
    .filter((e) => e.name === name && e.ts >= t0 && e.ts <= t1)
    .reduce((a, e) => a + (getter(e) || 0), 0);

// performance.mark() events land as blink.user_timing instant events named after the mark.
export function markTs(evts, markName) {
  const e = evts.find((x) => x.name === markName && x.cat?.includes('blink.user_timing'));
  return e?.ts;
}

export function windowBetween(evts, startMark, endMark) {
  const t0 = markTs(evts, startMark);
  const t1 = markTs(evts, endMark);
  if (t0 == null || t1 == null) throw new Error(`marks missing: ${startMark}..${endMark}`);
  return [t0, t1];
}

// Aggregate SelectorStats events (field keys verified by census.mjs).
export function selectorStats(evts, [t0, t1] = [0, Infinity]) {
  const agg = new Map();
  for (const e of evts) {
    if (e.name !== 'SelectorStats' || e.ts < t0 || e.ts > t1) continue;
    const timings =
      e.args?.selector_stats?.selector_timings ?? e.args?.data?.selector_stats?.selector_timings ?? [];
    for (const t of timings) {
      const key = t.selector;
      const a = agg.get(key) ?? { us: 0, attempts: 0, matches: 0, fastReject: 0, sheets: new Set() };
      a.us += t['elapsed (us)'] ?? t.elapsed_us ?? 0;
      a.attempts += t.match_attempts ?? 0;
      a.matches += t.match_count ?? 0;
      a.fastReject += t.fast_reject_count ?? 0;
      if (t.style_sheet_id) a.sheets.add(t.style_sheet_id);
      agg.set(key, a);
    }
  }
  return [...agg.entries()]
    .map(([selector, a]) => ({ selector, ...a, sheets: [...a.sheets] }))
    .sort((x, y) => y.us - x.us);
}

// Classify a selector string into a needle family for aggregation.
export function family(sel) {
  if (/\[(xs|sm|md|lg|xl|xxl)\*?=/.test(sel)) return 'layout[bp]';
  if (sel.includes(':has(')) return ':has()';
  if (sel.includes('[media*=')) return '[media*=]';
  if (sel.includes('[media~=') || sel.includes('[media=')) return '[media~=]';
  if (sel.includes('[content~=') || sel.includes('[content*=')) return '[content]';
  if (sel.includes('[variant~=') || sel.includes('[variant*=')) return '[variant]';
  if (sel.includes('[theme') || sel.includes('[data-theme')) return '[theme]';
  if (sel.includes('[animate') || sel.includes('[stagger') || sel.includes('[data-stagger')) return '[animate/stagger]';
  if (sel.includes('[itemprop') || sel.includes('[itemscope') || sel.includes('[itemtype')) return 'microdata';
  if (sel.includes('[data-part')) return '[data-part]';
  if (sel.includes(':nth-child')) return 'nth-child';
  if (/\[[a-z-]+[~*^|$]?=/.test(sel)) return 'other-attr';
  if (/^\s*[.:a-zA-Z#*]/.test(sel)) return 'element/class/other';
  return 'other';
}

export function familyRollup(stats) {
  const roll = new Map();
  for (const s of stats) {
    const f = family(s.selector);
    const a = roll.get(f) ?? { us: 0, attempts: 0, matches: 0, fastReject: 0, selectors: 0 };
    a.us += s.us; a.attempts += s.attempts; a.matches += s.matches; a.fastReject += s.fastReject; a.selectors++;
    roll.set(f, a);
  }
  return [...roll.entries()]
    .map(([fam, a]) => ({ family: fam, ...a }))
    .sort((x, y) => y.us - x.us);
}

export const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const p95 = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
};

// Settle: fonts loaded + double-rAF so pending style/layout has flushed.
export const SETTLE = `(async () => {
  await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
})()`;

// Wrap a mutation so the induced recalc lands between marks: mark, mutate,
// double-rAF (style pass for the frame runs after rAF callbacks), end mark.
export const FLIP = (body) => `(async () => {
  performance.mark('flip:start');
  ${body};
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  performance.mark('flip:end');
})()`;
```

#### `census.mjs`

```js
// Phase 0 census: verify trace categories & SelectorStats field names.
// Usage: NODE_PATH=/opt/node22/lib/node_modules node census.mjs <port>
import { writeFileSync } from 'node:fs';
import { launch, trace, CATS_STATS, SETTLE } from './lib.mjs';

const port = process.argv[2] ?? '8710';
const URL = `http://127.0.0.1:${port}/ui/card/demo/schema.html`;

const { browser, page, tracing } = await launch();

const evts = await trace(tracing, CATS_STATS, async () => {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(SETTLE);
});

// 1. Event-name census
const names = new Map();
for (const e of evts) names.set(e.name, (names.get(e.name) ?? 0) + 1);
const census = [...names.entries()].sort((a, b) => b[1] - a[1]);
console.log('--- event census (name: count) ---');
for (const [n, c] of census) console.log(`${c}\t${n}`);

// 2. Key events present?
const need = [
  'UpdateLayoutTree', 'ParseAuthorStyleSheet', 'SelectorStats',
  'ScheduleStyleInvalidationTracking', 'StyleInvalidatorInvalidationTracking',
  'StyleRecalcInvalidationTracking', 'Layout',
];
console.log('\n--- required events ---');
for (const n of need) console.log(`${names.has(n) ? 'OK  ' : 'MISS'} ${n}`);

// 3. Raw samples to pin field names
const sample = (n) => evts.find((e) => e.name === n && (e.args && Object.keys(e.args).length));
for (const n of ['SelectorStats', 'UpdateLayoutTree', 'StyleRecalcInvalidationTracking', 'ScheduleStyleInvalidationTracking']) {
  const s = sample(n);
  console.log(`\n--- sample ${n} ---`);
  console.log(s ? JSON.stringify(s, null, 1).slice(0, 2500) : '(none)');
}

writeFileSync(new URL('./out/census.json', import.meta.url),
  JSON.stringify({ census, sampleSelectorStats: sample('SelectorStats') }, null, 1));

await browser.close();
```

#### `scenarios.mjs`

```js
// Scenario runner. Usage:
//   node scenarios.mjs <initial|flips|lightbox|hover|has|resize> <port> [pagePath]
// Writes out/<scenario>[.<slug>].json. Clean-cats runs give timings; a separate
// stats run (fewer iterations) gives attribution. Never mix the two.
import { writeFileSync } from 'node:fs';
import {
  launch, trace, CATS_CLEAN, CATS_STATS, sumDur, sumField, markTs, windowBetween,
  selectorStats, familyRollup, median, p95, SETTLE,
} from './lib.mjs';

const [scenario, port = '8710', pagePath = '/ui/card/demo/schema.html'] = process.argv.slice(2);
const PAGE_URL = `http://127.0.0.1:${port}${pagePath}`;
const slug = pagePath.split('/').pop().replace(/\.html$/, '');
const OUT = (name, data) =>
  writeFileSync(new URL(`./out/${name}.${slug}.json`, import.meta.url), JSON.stringify(data, null, 1));

const REPEATS = 5;               // house rule: median of 5 for wall-time numbers
const FLIP_ITER = 100, WARMUP = 10, STATS_ITER = 20;

// Sum of UpdateLayoutTree in a window + elements affected (args.elementCount — asserted).
function recalcIn(evts, win) {
  const ms = sumDur(evts, 'UpdateLayoutTree', win);
  const els = sumField(evts, 'UpdateLayoutTree', (e) => e.args?.elementCount ?? e.args?.data?.elementCount, win);
  return { ms, els };
}
function assertElementCount(evts) {
  const e = evts.find((x) => x.name === 'UpdateLayoutTree' && x.dur);
  if (!e) return;
  const c = e.args?.elementCount ?? e.args?.data?.elementCount;
  if (c == null) throw new Error('UpdateLayoutTree.elementCount not found — inspect: ' + JSON.stringify(e).slice(0, 500));
}

async function freshPage() {
  const h = await launch();
  return h;
}

// ---------------------------------------------------------------- initial (a)
async function initial() {
  const runs = [];
  for (let i = 0; i < REPEATS; i++) {
    const { browser, page, tracing } = await freshPage();
    const evts = await trace(tracing, CATS_CLEAN, async () => {
      await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
      await page.evaluate(SETTLE);
      // reveal-all: defeat content-visibility to price the whole tree
      await page.evaluate(`(async () => {
        performance.mark('cv:start');
        const s = document.createElement('style');
        s.textContent = 'main > lay-out > :is(ui-card, ui-reveal) { content-visibility: visible !important; }';
        document.head.append(s);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        performance.mark('cv:end');
      })()`);
    });
    assertElementCount(evts);
    const nav = markTs(evts, 'navigationStart') ?? evts.find((e) => e.name === 'CommitLoad')?.ts ?? 0;
    const cvWin = windowBetween(evts, 'cv:start', 'cv:end');
    const loadWin = [nav, cvWin[0]];
    runs.push({
      parseCss: sumDur(evts, 'ParseAuthorStyleSheet', loadWin),
      load: recalcIn(evts, loadWin),
      loadLayout: sumDur(evts, 'Layout', loadWin),
      resolveCalls: evts.filter((e) => e.name === 'StyleResolver::ResolveStyle' && e.ts >= loadWin[0] && e.ts <= loadWin[1]).length,
      reveal: recalcIn(evts, cvWin),
      revealLayout: sumDur(evts, 'Layout', cvWin),
    });
    await browser.close();
  }
  // one stats run for attribution (not for timings)
  const { browser, page, tracing } = await freshPage();
  const evts = await trace(tracing, CATS_STATS, async () => {
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(SETTLE);
  });
  const stats = selectorStats(evts);
  await browser.close();
  OUT('initial', {
    page: pagePath, runs,
    median: {
      parseCss: median(runs.map((r) => r.parseCss)),
      loadMs: median(runs.map((r) => r.load.ms)),
      loadEls: median(runs.map((r) => r.load.els)),
      revealMs: median(runs.map((r) => r.reveal.ms)),
      revealEls: median(runs.map((r) => r.reveal.els)),
    },
    families: familyRollup(stats),
    top30: stats.slice(0, 30),
    totalSelectorUs: stats.reduce((a, s) => a + s.us, 0),
    totalAttempts: stats.reduce((a, s) => a + s.attempts, 0),
  });
}

// ------------------------------------------------------------------ flips (b)
// Each flip: { name, setup (returns JS locating the element as `window.__el`), on, off }
const FLIPS = [
  { name: 'media-real', find: `document.querySelector('ui-card[media]')`,
    on: `__el.setAttribute('media', __el.getAttribute('media') + ' hov(zoom)')`,
    off: `__el.setAttribute('media', __el.getAttribute('media').replace(' hov(zoom)', ''))` },
  { name: 'media-nonsense', find: `document.querySelector('ui-card[media]')`,
    on: `__el.setAttribute('media', __el.getAttribute('media') + ' zzz')`,
    off: `__el.setAttribute('media', __el.getAttribute('media').replace(' zzz', ''))` },
  { name: 'content-lg-hl', find: `document.querySelector('ui-card[content]')`,
    on: `__el.setAttribute('content', __el.getAttribute('content') + ' lg:hl(3xl)')`,
    off: `__el.setAttribute('content', __el.getAttribute('content').replace(' lg:hl(3xl)', ''))` },
  { name: 'variant', find: `document.querySelector('ui-card[variant]') ?? document.querySelector('ui-card')`,
    on: `__el.setAttribute('variant', ((__el.getAttribute('variant')||'') + ' md:row').trim())`,
    off: `__el.setAttribute('variant', (__el.getAttribute('variant')||'').replace(/ ?md:row/, ''))` },
  { name: 'layout-lg-real', find: `document.querySelector('lay-out[lg]') ?? document.querySelector('lay-out')`,
    on: `__el.setAttribute('lg', (__el.getAttribute('lg')||'') + ' cg(2)')`,
    off: `__el.setAttribute('lg', (__el.getAttribute('lg')||'').replace(' cg(2)', ''))` },
  { name: 'layout-lg-nonsense', find: `document.querySelector('lay-out[lg]') ?? document.querySelector('lay-out')`,
    on: `__el.setAttribute('lg', (__el.getAttribute('lg')||'') + ' zzz')`,
    off: `__el.setAttribute('lg', (__el.getAttribute('lg')||'').replace(' zzz', ''))` },
  { name: 'class-nonsense', find: `document.querySelector('ui-card[media]')`,
    on: `__el.classList.add('zzz-bench')`, off: `__el.classList.remove('zzz-bench')` },
  { name: 'class-real', find: `document.querySelector('ui-card[media]')`,
    prep: `{ const s = document.createElement('style'); s.textContent = '.bench-real { outline-color: red; }'; document.head.append(s); }`,
    on: `__el.classList.add('bench-real')`, off: `__el.classList.remove('bench-real')` },
];

async function flips() {
  const results = {};
  for (const f of FLIPS) {
    const { browser, page, tracing } = await freshPage();
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(SETTLE);
    const found = await page.evaluate(`(window.__el = ${f.find}) != null`);
    if (!found) { results[f.name] = { error: 'element not found' }; await browser.close(); continue; }
    if (f.prep) await page.evaluate(f.prep);

    // timing run
    const evts = await trace(tracing, CATS_CLEAN, async () => {
      await page.evaluate(`(async () => {
        const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        for (let i = 0; i < ${FLIP_ITER}; i++) {
          performance.mark('on:' + i + ':s');  ${f.on};  await raf2();  performance.mark('on:' + i + ':e');
          performance.mark('off:' + i + ':s'); ${f.off}; await raf2();  performance.mark('off:' + i + ':e');
        }
      })()`);
    });
    assertElementCount(evts);
    const per = { on: [], off: [], onEls: [], offEls: [] };
    for (let i = WARMUP; i < FLIP_ITER; i++) {
      for (const dir of ['on', 'off']) {
        const w = windowBetween(evts, `${dir}:${i}:s`, `${dir}:${i}:e`);
        const r = recalcIn(evts, w);
        per[dir].push(r.ms); per[dir + 'Els'].push(r.els);
      }
    }
    // attribution run (stats cats, fewer iterations)
    const sEvts = await trace(tracing, CATS_STATS, async () => {
      await page.evaluate(`(async () => {
        const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        performance.mark('stats:s');
        for (let i = 0; i < ${STATS_ITER}; i++) { ${f.on}; await raf2(); ${f.off}; await raf2(); }
        performance.mark('stats:e');
      })()`);
    });
    const sWin = windowBetween(sEvts, 'stats:s', 'stats:e');
    const stats = selectorStats(sEvts, sWin);
    const invalidations = sEvts.filter((e) =>
      ['ScheduleStyleInvalidationTracking', 'StyleInvalidatorInvalidationTracking', 'StyleRecalcInvalidationTracking']
        .includes(e.name) && e.ts >= sWin[0] && e.ts <= sWin[1]).length;
    results[f.name] = {
      onMedianMs: median(per.on), onP95Ms: p95(per.on), onMedianEls: median(per.onEls),
      offMedianMs: median(per.off), offP95Ms: p95(per.off), offMedianEls: median(per.offEls),
      invalidationEventsPerToggle: invalidations / (STATS_ITER * 2),
      topSelectors: stats.slice(0, 12),
      familyRollup: familyRollup(stats).slice(0, 8),
    };
    await browser.close();
  }
  OUT('flips', { page: pagePath, iterations: FLIP_ITER, warmupDropped: WARMUP, results });
}

// -------------------------------------------------------------- lightbox (c)
async function lightbox() {
  const { browser, page, tracing } = await freshPage();
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(SETTLE);
  const hasBox = await page.evaluate(`!!document.querySelector('ui-lightbox button, ui-lightbox')`);
  if (!hasBox) throw new Error('no ui-lightbox on ' + pagePath);
  const cycle = (n) => `(async () => {
    const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const btn = document.querySelector('ui-lightbox button') ?? document.querySelector('ui-lightbox');
    for (let i = 0; i < ${n}; i++) {
      performance.mark('open:' + i + ':s'); btn.click(); await raf2(); await new Promise(r => setTimeout(r, 120)); performance.mark('open:' + i + ':e');
      performance.mark('close:' + i + ':s'); btn.click(); await raf2(); await new Promise(r => setTimeout(r, 120)); performance.mark('close:' + i + ':e');
    }
  })()`;
  const N = 10;
  const evts = await trace(tracing, CATS_CLEAN, () => page.evaluate(cycle(N)));
  const agg = { open: [], close: [], openEls: [], closeEls: [] };
  for (let i = 1; i < N; i++)
    for (const d of ['open', 'close']) {
      const r = recalcIn(evts, windowBetween(evts, `${d}:${i}:s`, `${d}:${i}:e`));
      agg[d].push(r.ms); agg[d + 'Els'].push(r.els);
    }
  const sEvts = await trace(tracing, CATS_STATS, () => page.evaluate(cycle(3)));
  const stats = selectorStats(sEvts);
  await browser.close();
  OUT('lightbox', {
    page: pagePath,
    openMedianMs: median(agg.open), openMedianEls: median(agg.openEls),
    closeMedianMs: median(agg.close), closeMedianEls: median(agg.closeEls),
    topSelectors: stats.slice(0, 15), families: familyRollup(stats).slice(0, 8),
  });
}

// ----------------------------------------------------------------- hover (d)
async function hover() {
  const { browser, page, tracing, cdp } = await freshPage();
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(SETTLE);
  const box = await page.evaluate(`(() => {
    const el = document.querySelector('[media*="hov("]');
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  })()`);
  if (!box) throw new Error('no hov() element on ' + pagePath);
  const stream = async () => {
    await page.evaluate(`performance.mark('hov:s')`);
    for (let i = 0; i <= 60; i++) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: box.x + (box.w * i) / 60,
        y: box.y + box.h / 2 + Math.sin(i / 6) * box.h * 0.3,
      });
      await new Promise((r) => setTimeout(r, 33));
    }
    await page.evaluate(`performance.mark('hov:e')`);
  };
  const evts = await trace(tracing, CATS_CLEAN, stream);
  const win = windowBetween(evts, 'hov:s', 'hov:e');
  const frames = evts.filter((e) => e.name === 'UpdateLayoutTree' && e.dur && e.ts >= win[0] && e.ts <= win[1]);
  const sEvts = await trace(tracing, CATS_STATS, stream);
  const sWin = windowBetween(sEvts, 'hov:s', 'hov:e');
  const stats = selectorStats(sEvts, sWin);
  await browser.close();
  OUT('hover', {
    page: pagePath, durationMs: (win[1] - win[0]) / 1000,
    recalcTotalMs: sumDur(evts, 'UpdateLayoutTree', win),
    recalcCount: frames.length,
    perRecalcMedianMs: median(frames.map((e) => e.dur / 1000)),
    perRecalcMedianEls: median(frames.map((e) => e.args?.elementCount ?? e.args?.data?.elementCount ?? 0)),
    layoutTotalMs: sumDur(evts, 'Layout', win),
    topSelectors: stats.slice(0, 12), families: familyRollup(stats).slice(0, 8),
  });
}

// ------------------------------------------------------------------- has (e)
async function has() {
  const { browser, page, tracing } = await freshPage();
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(SETTLE);
  const probes = {
    popover: {
      find: `document.querySelector('ui-media[popover]')`,
      on: `__el.showPopover()`, off: `__el.hidePopover()`,
    },
    cover: {
      find: `document.querySelector('ui-content a, ui-content [data-part]')`,
      on: `__el.setAttribute('data-part', ((__el.getAttribute('data-part')||'') + ' cover').trim())`,
      off: `__el.setAttribute('data-part', (__el.getAttribute('data-part')||'').replace(/ ?cover/, ''))`,
    },
  };
  const out = {};
  for (const [name, p] of Object.entries(probes)) {
    const found = await page.evaluate(`(window.__el = ${p.find}) != null`);
    if (!found) { out[name] = { error: 'not found' }; continue; }
    const N = 30;
    const evts = await trace(tracing, CATS_CLEAN, () =>
      page.evaluate(`(async () => {
        const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        for (let i = 0; i < ${N}; i++) {
          performance.mark('on:' + i + ':s'); try { ${p.on} } catch {} await raf2(); performance.mark('on:' + i + ':e');
          performance.mark('off:' + i + ':s'); try { ${p.off} } catch {} await raf2(); performance.mark('off:' + i + ':e');
        }
      })()`));
    const ms = [], els = [];
    for (let i = 5; i < N; i++) {
      const r = recalcIn(evts, windowBetween(evts, `on:${i}:s`, `on:${i}:e`));
      ms.push(r.ms); els.push(r.els);
    }
    out[name] = { onMedianMs: median(ms), onMedianEls: median(els) };
  }
  await browser.close();
  OUT('has', { page: pagePath, probes: out });
}

// ---------------------------------------------------------------- resize (f)
async function resize() {
  const widths = [1280, 900, 700, 500, 700, 900, 1280];
  const runs = [];
  for (let i = 0; i < REPEATS; i++) {
    const { browser, page, tracing, cdp } = await freshPage();
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(SETTLE);
    const evts = await trace(tracing, CATS_CLEAN, async () => {
      for (let s = 1; s < widths.length; s++) {
        await page.evaluate(`performance.mark('rs:${s}:s')`);
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: widths[s], height: 900, deviceScaleFactor: 1, mobile: false,
        });
        await page.evaluate(`(async () => {
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          performance.mark('rs:${s}:e');
        })()`);
      }
    });
    const steps = [];
    for (let s = 1; s < widths.length; s++) {
      const w = windowBetween(evts, `rs:${s}:s`, `rs:${s}:e`);
      steps.push({ to: widths[s], ...recalcIn(evts, w), layout: sumDur(evts, 'Layout', w) });
    }
    runs.push(steps);
    await browser.close();
  }
  const medSteps = runs[0].map((_, s) => ({
    to: runs[0][s].to,
    recalcMs: median(runs.map((r) => r[s].ms)),
    els: median(runs.map((r) => r[s].els)),
    layoutMs: median(runs.map((r) => r[s].layout)),
  }));
  OUT('resize', { page: pagePath, widths, medianSteps: medSteps });
}

const table = { initial, flips, lightbox, hover, has, resize };
if (!table[scenario]) throw new Error('unknown scenario: ' + scenario);
await table[scenario]();
console.log('done:', scenario, slug);
```

#### `bench-variant.mjs`

```js
// Phase 2 variant bench: forced full-document recalc under a served CSS variant.
//   node bench-variant.mjs <port> <pagePath> <label> [variantCssFile|-] [prepJsInline]
// variantCssFile '-' or absent = original bundle. prepJsInline runs once after load
// (e.g. removing microdata metas for B3). Output: out/variant.<label>.json
// Forced-recalc probe: a `html.__bench * { outline-color: transparent }` rule is
// injected at setup in BOTH arms; toggling the class on <html> invalidates every
// element, so the recalc prices full-tree matching against the active sheet.
import { writeFileSync } from 'node:fs';
import {
  launch, trace, CATS_CLEAN, CATS_STATS, windowBetween, selectorStats, familyRollup,
  median, p95, SETTLE, sumDur, sumField,
} from './lib.mjs';

const [port = '8710', pagePath = '/ui/card/demo/schema.html', label = 'b1', variantFile = '-', prepJs = ''] =
  process.argv.slice(2);
const PAGE_URL = `http://127.0.0.1:${port}${pagePath}`;

const N = 20, DROP = 5;
const PROBE_SETUP = `{
  const s = document.createElement('style');
  s.textContent = 'html.__bench * { outline-color: transparent; }';
  document.head.append(s);
}`;
const PROBE_LOOP = `(async () => {
  const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  for (let i = 0; i < ${N}; i++) {
    performance.mark('fr:' + i + ':s');
    document.documentElement.classList.toggle('__bench');
    await raf2();
    performance.mark('fr:' + i + ':e');
  }
})()`;

async function arm(cats) {
  const { browser, page, tracing } = await launch();
  if (variantFile !== '-') {
    await page.route('**/dist/demo.*.min.css', (r) =>
      r.fulfill({ path: variantFile, contentType: 'text/css' }));
  }
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(SETTLE);
  if (prepJs) await page.evaluate(`(async () => { ${prepJs}; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); })()`);
  await page.evaluate(PROBE_SETUP);
  const evts = await trace(tracing, cats, () => page.evaluate(PROBE_LOOP));
  await browser.close();
  return evts;
}

// timing runs (median of 5 page loads, each with N-DROP probe recalcs)
const perLoad = [];
for (let run = 0; run < 5; run++) {
  const evts = await arm(CATS_CLEAN);
  const ms = [], els = [];
  for (let i = DROP; i < N; i++) {
    const w = windowBetween(evts, `fr:${i}:s`, `fr:${i}:e`);
    ms.push(sumDur(evts, 'UpdateLayoutTree', w));
    els.push(sumField(evts, 'UpdateLayoutTree', (e) => e.args?.elementCount ?? 0, w));
  }
  perLoad.push({ medianMs: median(ms), p95Ms: p95(ms), medianEls: median(els) });
}
// one stats run for attribution
const sEvts = await arm(CATS_STATS);
const sWin = windowBetween(sEvts, `fr:${DROP}:s`, `fr:${N - 1}:e`);
const stats = selectorStats(sEvts, sWin);

writeFileSync(new URL(`./out/variant.${label}.json`, import.meta.url), JSON.stringify({
  page: pagePath, label, variantFile, prepJs: !!prepJs,
  forcedRecalc: {
    medianMs: median(perLoad.map((r) => r.medianMs)),
    p95Ms: median(perLoad.map((r) => r.p95Ms)),
    medianEls: median(perLoad.map((r) => r.medianEls)),
    perLoad,
  },
  families: familyRollup(stats).slice(0, 12),
  top15: stats.slice(0, 15),
  totalSelectorUs: stats.reduce((a, s) => a + s.us, 0),
  totalAttempts: stats.reduce((a, s) => a + s.attempts, 0),
}, null, 1));
console.log('done: variant', label);
```

#### `b2a.mjs`

```js
// B2a: rule-level A/B — flatten a selector family to single classes IN PLACE via
// CSSOM (rule.selectorText = '.u-N'), after spraying those classes onto the exact
// elements the originals matched. Same declarations, same conditional (@container/
// @media) nesting, same elements — isolates the matching-model delta.
//   node b2a.mjs <port> <pagePath> <label> <familyRegex>
// e.g. node b2a.mjs 8710 /ui/card/demo/schema.html chipgrid '\[media\*="(chip|sticker|save|play|beacon|lightbox)\('
// Output: out/b2a.<label>.json  (before/after forced-recalc medians + swap census)
import { writeFileSync } from 'node:fs';
import {
  launch, trace, CATS_CLEAN, windowBetween, median, p95, SETTLE, sumDur, sumField,
} from './lib.mjs';

const [port = '8710', pagePath = '/ui/card/demo/schema.html', label = 'b2a', familyRegex] = process.argv.slice(2);
if (!familyRegex) throw new Error('familyRegex required');
const PAGE_URL = `http://127.0.0.1:${port}${pagePath}`;

const N = 20, DROP = 5;
const PROBE_SETUP = `{
  const s = document.createElement('style');
  s.textContent = 'html.__bench * { outline-color: transparent; }';
  document.head.append(s);
}`;
const probeLoop = (tag) => `(async () => {
  const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  for (let i = 0; i < ${N}; i++) {
    performance.mark('${tag}:' + i + ':s');
    document.documentElement.classList.toggle('__bench');
    await raf2();
    performance.mark('${tag}:' + i + ':e');
  }
})()`;

// Walk all CSS rules; for style rules whose selectorText matches the family regex
// and contains no '&' (nested) part we can't resolve: qsa the selector (pseudo-
// elements stripped), add .u-N to matches, then rewrite selectorText to .u-N
// (+ preserved pseudo-element suffix).
const SWAP = `((reSrc) => {
  const re = new RegExp(reSrc);
  let idx = 0, swapped = 0, skippedNested = 0, skippedNoMatch = 0, sprayed = 0, unmatchedKept = 0;
  const walk = (rules) => {
    for (const r of rules) {
      if (r.cssRules && !(r instanceof CSSStyleRule)) { walk(r.cssRules); continue; }
      if (!(r instanceof CSSStyleRule)) continue;
      const sel = r.selectorText;
      if (!re.test(sel)) continue;
      if (sel.includes('&')) { skippedNested++; continue; }
      // split grouped selector lists conservatively: only handle single-selector rules
      // and simple groups where every part shares the same pseudo-element suffix
      const pseudoMatch = sel.match(/::[a-z-]+(\\([^)]*\\))?$/);
      const pseudo = pseudoMatch ? pseudoMatch[0] : '';
      const query = sel.replaceAll(/::[a-z-]+(\\([^)]*\\))?/g, '');
      let els;
      try { els = document.querySelectorAll(query); } catch { skippedNoMatch++; continue; }
      if (!els.length) {
        // keep rule but flatten to a class nothing carries — still removes the
        // attribute machinery from the bucket while preserving rule count
        try { r.selectorText = '.u-none-' + (idx++); unmatchedKept++; } catch { skippedNoMatch++; }
        continue;
      }
      const cls = 'u-' + (idx++);
      for (const el of els) { el.classList.add(cls); sprayed++; }
      try { r.selectorText = '.' + cls + pseudo; swapped++; } catch { skippedNoMatch++; }
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules); } catch {}
  }
  return { swapped, skippedNested, skippedNoMatch, sprayed, unmatchedKept };
})(${JSON.stringify(familyRegex)})`;

async function run() {
  const perLoad = [];
  let census = null;
  for (let runI = 0; runI < 5; runI++) {
    const { browser, page, tracing } = await launch();
    await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(SETTLE);
    await page.evaluate(PROBE_SETUP);
    const before = await trace(tracing, CATS_CLEAN, () => page.evaluate(probeLoop('a')));
    census = await page.evaluate(SWAP);
    await page.evaluate(`(async () => { await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); })()`);
    const after = await trace(tracing, CATS_CLEAN, () => page.evaluate(probeLoop('b')));
    const collect = (evts, tag) => {
      const ms = [];
      for (let i = DROP; i < N; i++) {
        const w = windowBetween(evts, `${tag}:${i}:s`, `${tag}:${i}:e`);
        ms.push(sumDur(evts, 'UpdateLayoutTree', w));
      }
      return ms;
    };
    perLoad.push({ beforeMs: median(collect(before, 'a')), afterMs: median(collect(after, 'b')) });
    await browser.close();
  }
  writeFileSync(new URL(`./out/b2a.${label}.json`, import.meta.url), JSON.stringify({
    page: pagePath, label, familyRegex, census, perLoad,
    beforeMedianMs: median(perLoad.map((r) => r.beforeMs)),
    afterMedianMs: median(perLoad.map((r) => r.afterMs)),
  }, null, 1));
  console.log('done: b2a', label, census);
}
await run();
```

#### `flip-ab.mjs`

```js
// Flip-cost A/B under an in-page CSSOM transform: measure the media-real flip
// median before and after a transform, same session.
//   node flip-ab.mjs <port> <pagePath> <label> <transform>
// transforms: delete-has (remove every rule whose selector contains :has()
//             — nested rules included), flatten-media (b2a-style flatten of all
//             [media*=]/[media~=] top-level rules to sprayed classes)
// Output: out/flipab.<label>.json
import { writeFileSync } from 'node:fs';
import {
  launch, trace, CATS_CLEAN, windowBetween, median, p95, SETTLE, sumDur, sumField,
} from './lib.mjs';

const [port = '8710', pagePath = '/ui/card/demo/schema.html', label, transform] = process.argv.slice(2);
if (!label || !transform) throw new Error('usage: flip-ab <port> <page> <label> <delete-has|flatten-media>');
const PAGE_URL = `http://127.0.0.1:${port}${pagePath}`;

const N = 60, DROP = 10;

const FLIP_LOOP = (tag) => `(async () => {
  const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const el = window.__el;
  for (let i = 0; i < ${N}; i++) {
    performance.mark('${tag}:' + i + ':s');
    el.setAttribute('media', el.getAttribute('media') + ' hov(zoom)');
    await raf2();
    performance.mark('${tag}:' + i + ':e');
    el.setAttribute('media', el.getAttribute('media').replace(' hov(zoom)', ''));
    await raf2();
  }
})()`;

const TRANSFORMS = {
  'delete-has': `(() => {
    let deleted = 0;
    const sweep = (group) => {
      for (let i = group.cssRules.length - 1; i >= 0; i--) {
        const r = group.cssRules[i];
        if (r.cssRules && !(r instanceof CSSStyleRule)) { sweep(r); continue; }
        const sel = r.selectorText ?? '';
        if (sel.includes(':has(')) { group.deleteRule(i); deleted++; continue; }
        if (r.cssRules) sweep(r); // nested rules under a style rule
      }
    };
    for (const sheet of document.styleSheets) { try { sweep(sheet); } catch {} }
    return { deleted };
  })()`,
  'flatten-media': `(() => {
    let idx = 0, swapped = 0, skippedNested = 0, skipped = 0, sprayed = 0, unmatchedKept = 0;
    const walk = (rules) => {
      for (const r of rules) {
        if (r.cssRules && !(r instanceof CSSStyleRule)) { walk(r.cssRules); continue; }
        if (!(r instanceof CSSStyleRule)) continue;
        const sel = r.selectorText;
        if (!/\\[media[*~]?=/.test(sel)) { if (r.cssRules) walk(r.cssRules); continue; }
        if (sel.includes('&')) { skippedNested++; continue; }
        const pseudoMatch = sel.match(/::[a-z-]+(\\([^)]*\\))?$/);
        const pseudo = pseudoMatch ? pseudoMatch[0] : '';
        const query = sel.replaceAll(/::[a-z-]+(\\([^)]*\\))?/g, '');
        let els;
        try { els = document.querySelectorAll(query); } catch { skipped++; continue; }
        if (!els.length) { try { r.selectorText = '.u-none-' + (idx++); unmatchedKept++; } catch { skipped++; } continue; }
        const cls = 'u-' + (idx++);
        for (const el of els) { el.classList.add(cls); sprayed++; }
        try { r.selectorText = '.' + cls + pseudo; swapped++; } catch { skipped++; }
      }
    };
    for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch {} }
    return { swapped, skippedNested, skipped, sprayed, unmatchedKept };
  })()`,
};
if (!TRANSFORMS[transform]) throw new Error('unknown transform ' + transform);

const perRun = [];
let census = null;
for (let run = 0; run < 5; run++) {
  const { browser, page, tracing } = await launch();
  await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(SETTLE);
  const found = await page.evaluate(`(window.__el = document.querySelector('ui-card[media]')) != null`);
  if (!found) throw new Error('no ui-card[media] on ' + pagePath);
  const before = await trace(tracing, CATS_CLEAN, () => page.evaluate(FLIP_LOOP('a')));
  census = await page.evaluate(TRANSFORMS[transform]);
  await page.evaluate(`(async () => { await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); })()`);
  const after = await trace(tracing, CATS_CLEAN, () => page.evaluate(FLIP_LOOP('b')));
  const collect = (evts, tag) => {
    const ms = [], els = [];
    for (let i = DROP; i < N; i++) {
      const w = windowBetween(evts, `${tag}:${i}:s`, `${tag}:${i}:e`);
      ms.push(sumDur(evts, 'UpdateLayoutTree', w));
      els.push(sumField(evts, 'UpdateLayoutTree', (e) => e.args?.elementCount ?? 0, w));
    }
    return { ms: median(ms), p95: p95(ms), els: median(els) };
  };
  perRun.push({ before: collect(before, 'a'), after: collect(after, 'b') });
  await browser.close();
}
writeFileSync(new URL(`./out/flipab.${label}.json`, import.meta.url), JSON.stringify({
  page: pagePath, label, transform, census, perRun,
  beforeMedianMs: median(perRun.map((r) => r.before.ms)),
  afterMedianMs: median(perRun.map((r) => r.after.ms)),
  beforeMedianEls: median(perRun.map((r) => r.before.els)),
  afterMedianEls: median(perRun.map((r) => r.after.els)),
}, null, 1));
console.log('done: flipab', label, census);
```

