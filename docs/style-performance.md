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

[PLACEHOLDER — scenarios a–f: initial pass ± content-visibility; per-DSL attribute
flips vs the classList control; lightbox media= string rewrite; hover rAF loop;
:has() probes; container-query resize; contrast pages.]

Initial pass, first data (as-shipped page, content-visibility active):
UpdateLayoutTree median **102.1 ms / 1,211 elements** to network-idle; author CSS
parse **6.4 ms**; defeating `content-visibility: auto` afterwards cost only
**+17.2 ms / 227 elements** more. Layout (for contrast) was ~180 ms.
[PLACEHOLDER — full tables]

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
