# Stagger — shared reveal engine

How the **stagger** cascade works: direct children of a marked group reveal one
after another. One engine, three trigger adapters, one effect vocabulary.

- **Source:** [`ui/base/stagger.css`](../base/stagger.css) (`@layer bs-component`).
- **Keyframe** (scroll-driven adapter): `ui-stagger-in` in
  [`ui/base/animations.css`](../base/animations.css) — see [animations.md](./animations.md).
- **Tokens:** `--stagger-*` in `ui/base/tokens.css`.
- **In the card carousel** the engine is reached through the `media="stagger …"`
  DSL — user-facing reference in [media.carousel.md](./media.carousel.md#staggered-content-reveal-stagger--pure-css).

---

## Marker & scope

Mark the reveal **group**; its **direct element children** cascade in.

- `stagger` — on custom elements (`<ui-media>`, `<lay-out>`, `<ui-tabs>`…).
- `data-stagger` — on native elements (a plain `<div>` inside `<details>`).

Only direct element children stagger; bare text nodes don't. A child can carry an
effect token too — it then also acts as a **nested** stagger host.

## Effect vocabulary

Tokens are attribute **values**, matched with `~=` (whole word). Bare `stagger`
(no value) = `rise`.

| token | from-state | feel |
|-------|-----------|------|
| `rise` | `translate: 0 <d>` | up (**default**) |
| `fall` | `translate: 0 -<d>` | down |
| `lft` | `translate: -<d> 0` | in from inline-start |
| `rgt` | `translate: <d> 0` | in from inline-end |
| `zom` | `scale: 0.65`, origin `0 50%` | zoom up (grows from the inline-start so left-aligned text stays put) |
| `blr` | `filter: blur(12px)` | blur + fade |
| `fde` | — (opacity only) | plain fade |

`<d>` = `var(--stagger-distance)`. Each token sets **inherited** private vectors —
`--_stg-tr` (translate) · `--_stg-sc` (scale) · `--_stg-fl` (filter) · `--_stg-origin`
(transform-origin). Because they inherit, a token may sit on the group **or any
ancestor**, and every adapter's from-state reads the same three vars — that's why one
vocabulary drives all three triggers.

## Tokens

Global, from `ui/base/tokens.css` (self-contained fallbacks at every use site, so the
engine survives the token-less `layout.css` bundle):

| Token | Default | Purpose |
|-------|---------|---------|
| `--stagger-begin` | `0s` | Lead-in before the first child (added to all) |
| `--stagger-distance` | `5rem` | Travel distance for the translate tokens |
| `--stagger-duration` | `0.75s` | Per-child duration |
| `--stagger-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Easing |
| `--stagger-step` | `0.07s` | Delay added per child |

**Per-child delay** = `--stagger-begin + (--_stg-base-i + sibling-index() - 1) * --stagger-step`.

`--_stg-base-i` (registered `<integer>`, non-inherited, initial `0`) lets a host offset
the cascade — the card carousel bridges its **card index** into it so a card's content
picks up where the card left off (see adapter 2).

---

## The three trigger adapters

All gated on `@media (prefers-reduced-motion: no-preference)` — reduce-motion users get
instant reveals. Each adapter supplies a **trigger**; the vocabulary supplies the
**from-state**.

### 1. `<details>` hosts — replay on every open

Covers `ui-tabs`, `ui-reveal`, `ui-accordion`, plain `<details>`. Children transition
from the vector to visible on `[open]`, staggered by delay.

- **Replay mechanism:** the panel is forced `content-visibility: visible` so it stays
  rendered while closed; children flip `display: none → block` on open, which re-fires a
  **standalone** `@starting-style` — every time. (A *nested* `@starting-style` does NOT
  re-fire; it must be a top-level at-rule.)
- **Specificity exception:** these rules use **real** specificity (not `:where()`) so the
  from-state opacity/translate beat host-card styles — a `0-0-0` version loses and nothing
  plays. They own only their animated properties, so nothing else competes.
- A host that must *collapse* its panel (accordion sets `content-visibility: hidden` at
  higher specificity) can't replay — its block-size expand is the reveal instead.
- **The `<cq-box>` hop.** Subjects are the stagger host's **direct children** — except when
  the host is a component whose only child is a `<cq-box>` wrapper (a nested
  `<ui-accordion stagger>`, a card), in which case a bare `> *` would stagger the *wrapper*:
  one subject, one delay, nothing visibly staggered. Every rule in this adapter is therefore
  written as a pair —

  ```css
  details[open] > :is([stagger], [data-stagger]) > :not(cq-box),
  details[open] > :is([stagger], [data-stagger]) > cq-box > * { … }
  ```

  — so the subject set hops one level down through a `cq-box` and is otherwise unchanged.
  The `:not(cq-box)` arm is what keeps the wrapper itself out of the set. Both arms must be
  kept in sync across the closed state, the open state **and** the `@starting-style` block;
  editing one and forgetting another leaves subjects stuck at the from-state.

### 2. `<ui-media>` snap carousel — reveal on snap (two-way)

Opt-in via `media="stagger"` (the only form — read from the `<ui-media>` itself or its
nearest `ui-card`/`ui-reveal` host; the standalone `stagger`/`data-stagger` attribute on
lay-out / native hosts is a different adapter and is unchanged). Each slide is a
`container-type: scroll-state` container; its children sit at the from-state until the
slide **snaps** into the inline viewport (`@container not scroll-state(snapped: inline)`),
then transition in. Because it's a **time-based transition** (clock, not scroll-linked),
the cascade plays identically on autoplay / arrow-click / swipe and can't be scrubbed.

**Two independent channels** (multi-card slides):

- **`crd(<type>)`** → the **card** reveal (`--_stg-crd-*`) — the cards in a `<ui-slide>`
  group cascade as units.
- **`ani(<type>)`** → the **content** reveal (`--_stg-*`) — each card's `<ui-content>`
  children cascade within it.

Card index is carried by a registered inherited `@property --_stg-crd-i`
(`sibling-index() - 1` per card), fed into each card's `--_stg-base-i` so content delays
continue from the card's position. Single-card (hero) slides have no `<ui-slide>`, so the
card channel stays `0` and only content runs. Full DSL reference:
[media.carousel.md](./media.carousel.md#staggered-content-reveal-stagger--pure-css).

`<lay-out overflow stagger>` does **not** use this adapter — `pages` makes only the
page-start a snap target, so a flat page of cards can't group under one snap. It uses
adapter 3.

### 3. `<lay-out stagger>` — scroll-DRIVEN (progress-linked, two-way)

For layout grids and overflow carousels. Cards animate via the `ui-stagger-in` keyframe on
a **`view()` timeline** (a transition can't bind to a scroll timeline). Progress is tied to
scroll position, so it **re-runs every time** (scroll back = reverse). Attached only inside
`@supports (animation-timeline: view())`; unsupported / reduced-motion → cards render at
natural `opacity: 1` (visible, no animation).

| Markup | Behaviour |
|--------|-----------|
| `<lay-out stagger>` (grid) | Container publishes `view-timeline: --stg-tl`; children stagger via a per-`sibling-index()` `animation-range` offset (mirrors the `[animate]` system). |
| `<lay-out overflow stagger>` (carousel) | **Two** reveals on different elements: the **container** reveals on vertical scroll-in (`view()` block); each **card** reveals on horizontal scroll (`view(inline)`) as it enters the inline viewport — later pages cascade in as you swipe. Split because one element can't cleanly run two scroll-axis animations. |

**`stagger="… trigger"`** (Chrome 145+, behind `@supports (timeline-trigger-name: --t)`)
switches the scrubbed reveal to a **one-shot** on entry — plays once at full duration and
stays, does not reverse on scroll-back. Mirrors the `[animate]` `trigger` token.

**`[animate-self]` co-op.** When an overflow carousel also has `animate-self` (a wilder
container entry — flip/reveal, see [animations.md](./animations.md)), adapter 3's
**container** rule is skipped (`:not([animate-self])`): `animate-self` owns the container
entry, stagger keeps the per-card swipe reveal. (Big-translate `animate-self` effects
deadlock — see [animations.md](./animations.md#animate-self-feedback-deadlock).)

---

## Keyframe correspondence

Every stagger token maps to a keyframe in the `[animate]` library, so the two systems share
one visual language:

`rise → fade-up` · `fall → fade-down` · `lft → fade-left` · `rgt → fade-right` ·
`zom → zoom-in` · `fde → fade-in` · `blr` = stagger-only. Reverse (bounce / flip / reveal /
slide) = keyframe-only — reach them via `[animate]` / `animate-self`, not stagger tokens.
See [animations.md](./animations.md).
