# Stagger — shared reveal engine

How the **stagger** cascade works: direct children of a marked group reveal one
after another. One engine, three trigger adapters, one effect vocabulary.

- **Source:** [`ui/base/stagger.css`](../../base/stagger.css) (`@layer bs-component`).
- **Keyframe** (scroll-driven adapter): `ui-stagger-in` in
  [`ui/base/animations.css`](../../base/animations.css) — see [animations.md](./animations.md).
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
| `shimmer` (+ `sweep`) | *(text effect, `<details>` hosts only — see [Shimmer](#shimmer))* | the text lights up, line by line |
| `semi` | *(modifier — from `opacity: 0.5`)* | start semi-opaque; composes with any effect |
| `full` | *(modifier — from `opacity: 0`)* | the explicit spelling of the default |

`<d>` = `var(--stagger-distance)`. Each token sets **inherited** private vectors —
`--_stg-tr` (translate) · `--_stg-sc` (scale) · `--_stg-fl` (filter) · `--_stg-origin`
(transform-origin). Because they inherit, a token may sit on the group **or any
ancestor**, and every adapter's from-state reads the same three vars — that's why one
vocabulary drives all three triggers.

### Fade-in opacity (`semi` / `full`)

`semi` and `full` are **modifiers, not effects**: they set only the from-opacity of the
reveal — `semi` starts children at `opacity: 0.5`, `full` at `0` (the explicit spelling of
the default). They compose with any effect word; the canonical pairing is the
element-by-element fade:

```html
<div data-stagger="fde semi">
  <p>…</p>
  <p>…</p>
</div>
```

In the media DSL they mirror 1:1 as `ani(semi)` / `ani(full)` (content channel) and
`crd(semi)` / `crd(full)` (card channel) — `media="… stagger ani(fde) ani(semi)"`. Under
the hood the modifiers write per-channel private forms (`--_stg-op` content,
`--_stg-crd-op` card) over the shared public token `--stagger-opacity`, which every
adapter's from-state (and the `ui-stagger-in` keyframe) reads — so an arbitrary
from-opacity can also be themed directly: `--stagger-opacity: 0.25`. Shimmer is
unaffected (its from-states keep `opacity: 1` — it paints, it doesn't fade).

## Tokens

Global, from `ui/base/tokens.css` (self-contained fallbacks at every use site, so the
engine survives the token-less `layout.css` bundle):

| Token | Default | Purpose |
|-------|---------|---------|
| `--stagger-begin` | `0s` | Lead-in before the first child (added to all) |
| `--stagger-distance` | `5rem` | Travel distance for the translate tokens |
| `--stagger-duration` | `0.75s` | Per-child duration |
| `--stagger-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Easing |
| `--stagger-opacity` | `0` | From-opacity of the reveal (`semi`/`full` write the per-channel private forms) |
| `--stagger-step` | `0.07s` | Delay added per child |

**Per-child delay** = `--stagger-begin + (--_stg-base-i + --_stg-i - 1) * --_stg-step`.

- `--_stg-base-i` (registered `<integer>`, non-inherited, initial `0`) lets a host offset
  the cascade — the card carousel bridges its **card index** into it so a card's content
  picks up where the card left off (see adapter 2).
- `--_stg-i` (registered `<integer>`, non-inherited, initial `1`) is the child's cascade
  index — `sibling-index()` unless overridden by attribute.
- `--_stg-step` (unregistered) is the child's step — `--stagger-step` unless overridden
  by attribute.

## Per-child overrides

Two attributes on a **child** override its slot in the cascade, read in CSS via typed
`attr()` (same mechanism as `tint=` — bare spelling on custom elements, `data-` on
native ones):

| Attribute | Type | Overrides | Effect |
|---|---|---|---|
| `stagger-index` / `data-stagger-index` | `<integer>` | `sibling-index()` | reorder — delay slot only, DOM/paint order unchanged |
| `stagger-step` / `data-stagger-step` | `<time>` | `--stagger-step` | pace — `delay = begin + (index - 1) × own step` |

```html
<!-- cascade order 2, 1, 3 -->
<div data-stagger>
  <p data-stagger-index="2">appears second</p>
  <p data-stagger-index="1">appears first</p>
  <p data-stagger-index="3">appears third</p>
</div>

<!-- mixed pace: quick · default · extremely slow -->
<div data-stagger>
  <p data-stagger-step="0.02s">…</p>
  <p>…</p>
  <p data-stagger-step="0.6s">…</p>
</div>
```

A child's step scales its **own** whole delay, so a big step on a late child lands it
after everyone (extremely slow), and a child with a large index but tiny step can still
arrive early — the two compose, they don't fight.

**Adapter coverage.** The index override applies everywhere a sibling term exists; the
step override only where the delay is a real `<time>`:

| Site | `stagger-index` | `stagger-step` |
|---|---|---|
| adapter 1 (`<details>`) transition delay | ✓ | ✓ |
| adapter 2 (snap carousel) — cards **and** content | ✓ | ✓ |
| adapter 3 (`<lay-out stagger>`) scrubbed `animation-range` | ✓ | — (percent-based, no time term) |
| adapter 3 `stagger="… trigger"` one-shot delay | ✓ | — (paced by `--animate-stagger`/`--animate-delay`) |
| shimmer delay | ✓ | — (shimmer keeps `--stagger-shimmer-step`) |

Details that matter:

- **`--_stg-i` does not inherit** (registered, `inherits: false`) — a nested stagger
  host's children compute their own indices; a parent's override never leaks in. On an
  adapter-2 **card**, `stagger-index` reorders the card *and* re-bases its content
  (`--_stg-crd-i` derives from it).
- **`--_stg-step` does inherit** (unregistered by necessity — registering would kill the
  `--stagger-step` theming fallback). A step attribute on a group therefore also paces
  nested subjects, consistent with the engine's "a token may sit on any ancestor" design.
- **Safari/Firefox** (no typed `attr()`, no `sibling-index()`): the index degrades to a
  uniform cascade (`--_stg-i` self-heals to its initial `1` — same as those browsers get
  today), the step falls back to the default `--stagger-step` via a CSS-only `@supports`
  guard, and `ui/base/polyfills/attr-fallback.js` restores the exact authored values on
  top. See [`ui/base/polyfills/readme.md`](../../base/polyfills/readme.md).

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
`zom → zoom-in` · `fde → fade-in` · `blr` and `shimmer` = stagger-only, and `shimmer` has no
keyframe at all — it runs on a transition, so it exists only on the `<details>` adapter.
Reverse (bounce / flip / reveal / slide) = keyframe-only — reach them via `[animate]` /
`animate-self`, not stagger tokens. See [animations.md](./animations.md).

---

## Shimmer

`stagger="shimmer"` is the one token that is **not** a box vector. Nothing moves: the text
itself lights up as a coloured band sweeps it. It has two forms, and the difference is
**per-line timing**:

| | reveal | layout | children |
|---|---|---|---|
| `shimmer` | reads **down the block, one line at a time** | sets `display: inline` | **one** text child |
| `shimmer sweep` | one tilted band crosses **every line at once** | untouched | any number |

```html
<!-- default: line by line, the way an eye moves — single text child -->
<div data-stagger="shimmer">
  <p>…</p>
</div>

<!-- sweep: all lines together, layout untouched — safe for several children -->
<div data-stagger="shimmer sweep">
  <p>…</p>
  <p>…</p>
</div>
```

### How it works

Three `background-clip: text` layers on the subject, all swept by one
`background-position` transition. Bottom to top:

| layer | size | closed → open | role |
|-------|------|---------------|------|
| ghost | `100% 100%` | `0 0` (static) | faint wash — the text not yet reached |
| ink | `200% 100%` | `200% 0` → `100% 0` | solid text colour, fills in behind the band |
| band | `200% 100%` | `200% 0` → `100% 0` | hard-stop coloured leading edge, `--stagger-shimmer-spread` wide |

There is **no per-word markup and no text splitting** — the repo has no splitter and needs
none. The line-by-line reveal falls out of inline fragmentation: under the default
`box-decoration-break: slice`, an inline box paints its background across the box it
*would* have been if unbroken, then slices that painting per line. So a single horizontal
gradient walks the first line to its end, continues onto the second, and so on. That is all
the default does — set `display: inline`.

`sweep` opts out of that. Children stay blocks, and the band — tilted by
`--stagger-shimmer-sweep-angle` — crosses every line of a child at once, the tilt being the
only thing that separates the lines in time. It changes no layout, which is why it is the
form to use when a panel has more than one child: `display: inline` on several children
collapses them into one run-on line box.

Two things are easy to get backwards when writing demos:

- **On a one-line child the two are indistinguishable**, because sweeping a single line
  left-to-right *is* reading it. Only multi-line copy shows the difference.
- **`sweep` spans the child's box width, not its text width**, so a short line finishes
  early. The default has no such problem: an inline box hugs its text.

The default also needs a **flow** host. A flex or grid container blockifies its children,
so `display: inline` computes to `block` and the slice silently never happens — you get
`sweep` behaviour without asking for it.

**Geometry.** Band and ink are sized to exactly `200%`. This is not arbitrary: a
`background-position` percentage resolves against *(positioning area − image size)*, so
`200%` is the one width at which 1% of position equals 1% of the subject's own width.
`200%` parks the image entirely before the subject (ghost only); `100%` lands its trailing
edge on the subject's inline-end. Travel is therefore exactly one subject-width and the
whole duration reveals — sweeping on to `0`, as the original technique does, leaves the
back half of the transition idle. Oversizing the image and anchoring to `right` looks like
an improvement and is not: once the image outgrows the box that reference goes negative,
`right 100%` normalises to `left 0%`, and the subject starts fully revealed.

**Colour.** The resting state declares no `color` at all, so the subject keeps its natural
inherited colour and its opaque glyphs paint over the clipped background — an untriggered
host, or a browser without `background-clip: text`, just shows plain text. Only the
from-states set `color: #0000`. The transition then gives `color` a short duration delayed
to the *end* of the sweep, so it holds transparent throughout and settles once the band
reaches the inline-end. That settle is also what resolves the band still sitting on the
last `--stagger-shimmer-spread` of text at `100%`. It is why `--stagger-shimmer-ink` only
has to *approximate* the text colour: it is never the resting value, so there is nothing
to keep in sync.

### Tokens

| Token | Default | Purpose |
|-------|---------|---------|
| `--stagger-shimmer-angle` | `90deg` | Band angle, default (line-by-line) form |
| `--stagger-shimmer-sweep-angle` | `110deg` | Band angle under `sweep` — the tilt is what separates its lines in time |
| `--stagger-shimmer-color` | `var(--color-accent)` | The leading band |
| `--stagger-shimmer-duration` | `1s` | One child's sweep, start to finish |
| `--stagger-shimmer-ink` | `CanvasText` | Text behind the band |
| `--stagger-shimmer-ghost` | 15% of the ink | Unrevealed text |
| `--stagger-shimmer-spread` | `12ch` | Band width |
| `--stagger-shimmer-step` | `calc(--stagger-shimmer-duration * 0.6)` | Delay added per child |

Shimmer uses its **own step**, not `--stagger-step` (`0.07s`): second-long sweeps starting
0.07s apart would all run at once. At `0.6 ×` duration each child starts as the previous one
finishes reading. Both are ordinary inherited custom properties, so they can sit on the host,
any ancestor, or `:root`:

```html
<div data-stagger="shimmer" style="--stagger-shimmer-duration: 3s">…</div>
```

**Duration is fixed, not length-proportional.** A short paragraph and a long one both take
`--stagger-shimmer-duration`, so the short one reads faster per word. The original technique
paced it as `--char-count / --cps`, which needs a per-element character count written from
JS; this engine is CSS-only by design, so the trade is a fixed clock. Set the duration per
panel where the copy lengths differ a lot.

`--stagger-shimmer-ghost` is deliberately **not** declared in `tokens.css`. It defaults to
15% of the ink, and that derivation only holds at the *use site*: declared on `:root` it
would resolve `var(--stagger-shimmer-ink)` against `:root` and inherit that one frozen
colour, so a card overriding the ink would keep a black ghost over white text. Set it
explicitly only to break the 15% relationship — otherwise just set the ink and the ghost
follows.

### Choosing where to use it

Two things decide whether the effect is *perceptible*, and both are easy to get wrong:

- **Contrast for the ghost.** Unrevealed text is only 15% of the ink. Over a photo — a
  scrimmed `ovr(bs)` card, say — that contrast disappears and the copy just looks solid.
  Prefer a flat background.
- **Copy that fills its box** — under `sweep`. It spans the child's **box** width, not its
  text, so a three-word headline in a wide box is revealed almost before the sweep starts.
  Real sentences read far better than labels. (The default form is immune: an inline box
  hugs its text.)

### Constraints

- **It never combines with a box move.** The `shimmer` setter zeroes `--_stg-tr` the way
  `fde` does, so the subject only ever paints — writing `stagger="shimmer rise"` gives you
  the sweep, not a sweep plus a rise.
- **Text-level leaves only.** `color: #0000` inherits. Inline descendants (`<b>`, `<a>`
  with no colour of their own) are fine — they sit inside the parent's text clip. Block
  descendants with their own background or image paint over the effect, so do not put
  `shimmer` on a host whose children are cards. Inline elements that set their own colour
  or background (`<code>`) opt themselves out and stay visible from the start.
- **Bare `shimmer` needs a single text child in a flow host**, for the two reasons above.
  Use `sweep` for a panel with several children.
- **Set `--stagger-shimmer-ink` on themed text.** It is the colour that fills in behind the
  band, and it cannot be derived: `currentColor` in a custom property (even a registered
  `<color>` one) stays a keyword and resolves against the subject, which is transparent
  mid-sweep. The `CanvasText` default assumes dark-on-light. The ghost follows the ink.
- Everything is inside `@supports (background-clip: text) or (-webkit-background-clip: text)`
  and inside the `prefers-reduced-motion: no-preference` gate, so neither an unsupporting
  browser nor a reduce-motion user can be left with invisible text.

### Adapter 1 only

Shimmer is wired to the **`<details>` adapter only** — accordion, tabs, `ui-reveal`, plain
`<details>`. It uses that adapter's `@starting-style` + transition, with one difference: its
`transition` shorthand carries per-property delays (the sweep, then the colour settle), so it
must *replace* the base `transition-delay` longhand rather than merge with it. The arms are
therefore duplicated after the base rules at equal specificity.

Two invariants in `stagger.css` are load-bearing and look like tidy-ups:

- **Band and ink must stay sized `200%`** — see *Geometry* above. Any other size silently
  inverts the reveal.
- **The resting rule must not declare `color`** — see *Colour* above. Declaring it is what
  would leave an unsupported browser showing invisible text.

The repeated token reads (duration, ink, spread) are resolved once into private
`--_stg-shim-*` properties at the top of the paint rule, so each fallback is written in
exactly one place; the transition and the gradients then read the private form.

It is deliberately **not** wired to the other two adapters:

- **Snap carousel.** The from-state is itself reached by a transition, so a quick swipe out
  and back rewinds only part way and the return plays a *fragment* of a sweep. The box
  effects get away with this (0.75s at 0.07s steps is over before you look away); a 1.5s
  sweep at 0.9s steps does not.
- **Scroll-driven `<lay-out stagger>`.** A scrubbed sweep is tied to scroll position rather
  than to a clock, so it advances and rewinds with every flick of the wheel — legible as
  motion on a card, incoherent on text you are trying to read.

On either host the copy still *paints* (the shared paint rule) but never sweeps: it renders
at its resting state, indistinguishable from plain text.
