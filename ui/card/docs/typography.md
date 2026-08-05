# Typography — a user guide

> **Guide, not reference.** This walks through *using* the `<ui-content>` type system by use-case. The full token reference lives in [content.md](content.md), the live playground is [content.typography.html](../demo/content.typography.html), and card-level tokens (`variant=`, `theme=`, `rds()`) are in [ui-card-tokens.md](ui-card-tokens.md). Everything here is pure CSS — no JavaScript.

---

## The mental model

Three ideas carry the whole system:

1. **Two fluid ramps.** Body text and headlines each have a scale of hand-tuned `clamp()` stops (`sm`–`2xl` for body, `sm`–`3xl` for headlines) that grow with the **container**, not the viewport (`cqi` units). A card in a sidebar and the same card as a hero already render different sizes before you write a single token. Fluidity is a *mode*, not a law — `scl(fix)` switches every stop to the global static scale (use-case 16).

2. **One master step — `scl()`.** `scl(sm|md|lg|xl)` moves the *whole text column* through the scale: body, headline, and every derived part (eyebrow ×0.78, meta ×0.75, tags ×0.72, …) in one go.

3. **Sizes are relative, not absolute.** `hl(2xl)`, `tx(xl)`, `eb(lg)`, `mt(sm)` name a **step on a ladder**, and `scl()` moves the ladder: without `scl()` a size is exactly the named clamp; with `scl(sm)` everything you named renders one stop smaller, with `scl(lg)` one stop bigger — same tokens, shifted output. This is what makes a card's type spec portable between a hero slot and a grid cell.

Every token just writes a `--ui-content-*` custom property, and `content=` works on `<ui-content>` itself **or any ancestor** (inheritance does the wiring). When a token doesn't exist for what you need, set the property directly via `style=` — the DSL is sugar, never a wall.

**The four styling groups** — every text part belongs to one, and each group family token styles all of its parts at once:

| Family | Group | Parts |
|--------|-------|-------|
| `eb()` | Eyebrow | eyebrow |
| `hl()` | Headings | headline (+ bare `h2`–`h6`), subheadline |
| `tx()` | Body | summary, quote, list, address, timeline, price, stat |
| `mt()` | Meta | meta, caption, byline, footer, tags, rating, options |

Each family takes **size** (`sm`–`xl`, plus `2xl`/`3xl` on `hl()`), **tone** (`shr` 30% → `lgt` 45% → `med` 65% → `drk` 85% → `sld` 100% · `accent` · `inv`), **weight** (`300`–`900`) and flags (`shd` text-shadow; `eb(flat)` drops uppercase; `hl(grad)` gradient; `hl(serif)` etc. heading font). The vocabularies are disjoint, so `hl(3xl) hl(accent) hl(900)` compose freely on one attribute.

### The ladder at a glance

| you write | `scl(sm)` −1 | *(no scl / `scl(md)`)* | `scl(lg)` +1 | `scl(xl)` +2 |
|-----------|--------------|------------------------|--------------|--------------|
| `hl(sm)` | sm | sm | md | lg |
| `hl(md)` | sm | md | lg | xl |
| `hl(lg)` | md | lg | xl | 2xl |
| `hl(xl)` | lg | xl | 2xl | 3xl |
| `hl(2xl)` | xl | 2xl | 3xl | 3xl |
| `hl(3xl)` | 2xl | 3xl | 3xl | 3xl |

`tx()`/`eb()`/`mt()` sizes shift the same way over the body ramp (`sm`–`xl`, with a `2xl` headroom stop above `xl`). The ends **saturate** — under `scl(xl)`, `hl(xl)`, `hl(2xl)` and `hl(3xl)` all land on 3xl.

---

## Quick start

No tokens at all is a valid type spec — `md` body, `md` headline, every part in proportion:

```html
<ui-card variant="col" media="asr(16/9)">
  <cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content>
      <small data-part="eyebrow">Science</small>
      <h2 data-part="headline">Webb finds water ice</h2>
      <p data-part="summary">A short standfirst that reads at the default body size.</p>
      <p data-part="meta">4 min read · Jul 2026</p>
    </ui-content>
  </cq-box>
</ui-card>
```

Want the whole card bigger or smaller? One token, on the card:

```html
<ui-card content="scl(lg)">…</ui-card>   <!-- everything up one step -->
<ui-card content="scl(sm)">…</ui-card>   <!-- everything down one step -->
```

Want one part out of proportion? Name its step:

```html
<ui-card content="hl(2xl)">…</ui-card>          <!-- display headline, body untouched -->
<ui-card content="tx(xl)">…</ui-card>            <!-- bigger summary, headline untouched -->
<ui-card content="scl(sm) hl(2xl) tx(xl)">…</ui-card>  <!-- both, and the whole spec rides the small master step -->
```

---

## Use cases

Each recipe shows the `content=` spec and why it renders the way it does. Markup is abbreviated — any parts you omit simply don't render.

### 1 · The standard article card

The workhorse. Defaults do almost everything; you typically only touch tone:

```html
<ui-card variant="col" media="asr(16/9)" content="eb(accent) mt(med)">
  <cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content>
      <small data-part="eyebrow">Analysis</small>
      <h2 data-part="headline">The quiet rise of container queries</h2>
      <p data-part="summary">Why component-driven sizing finally beats viewport breakpoints.</p>
      <p data-part="meta">Jane Smith · 6 min</p>
    </ui-content>
  </cq-box>
</ui-card>
```

`eb(accent)` is actually the default eyebrow ink — write it when a theme has overridden it and you want it back. `mt(med)` keeps meta at the muted 65% ink.

### 2 · Dense sidebar / "more stories" card

Small master step, tighter rhythm, quieter meta:

```html
<ui-card variant="row spl(1/2)" media="asr(1/1)"
         content="scl(sm) mt(sm) gap(xs) pad(sm)">
  …
</ui-card>
```

`scl(sm)` takes the whole column down one stop; `mt(sm)` additionally puts the meta group on the small body step — and because sizes are relational, that `sm` itself rides the `scl(sm)` ladder (it saturates at the bottom stop, so the meta lands as small as the scale goes).

### 3 · Editorial long-form teaser (serif split)

The classic serif-headline-over-sans-body:

```html
<ui-card content="scl(lg) hl(serif) hl(600)">
  <cq-box>
    <ui-content>
      <small data-part="eyebrow">Essay</small>
      <h2 data-part="headline">On the shape of reading</h2>
      <p data-part="subheadline">Twelve hundred words on line length.</p>
      <p data-part="summary">…</p>
      <address data-part="byline"><img src="…" alt=""> Jane Smith · Jul 14</address>
    </ui-content>
  </cq-box>
</ui-card>
```

`hl(serif)` swaps **only** the heading font (`--font-serif`); the body keeps the container font. Reverse the split with `fnt(serif) hl(body)`. `hl(600)` softens the default bold — serifs rarely want 700.

### 4 · Display hero over media

Content stacked on the image, scrim for contrast, display-size title:

```html
<ui-card variant="ovr(bs)" media="asr(21/9) scm"
         content="scl(lg) hl(3xl) eb(inv) mt(lgt)">
  <cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content>
      <small data-part="eyebrow">Feature</small>
      <h2 data-part="headline">Into the deep field</h2>
      <p data-part="summary">The longest exposure ever taken.</p>
    </ui-content>
  </cq-box>
</ui-card>
```

`hl(3xl)` is the display step (formerly `poster`) — `clamp(2.5rem, 1rem + 11cqi, 8rem)`, so it tracks the card width hard. The host `ovr()` automatically adds a legibility text-shadow to headline + eyebrow over the scrim; disable per instance with `style="--ui-content-heading-text-shadow: none"`, or add it to other groups with `tx(shd)` / `mt(shd)`. `eb(inv)`/`mt(lgt)` re-ink the small print for the dark scrim.

### 5 · The mobile-first hero (the flagship relational case)

One spec that is a *poster* on wide slots and a *card* on narrow ones:

```html
<ui-card variant="ovr(bs)" media="asr(3/4) lg:asr(21/9) scm"
         content="scl(sm) lg:scl(md) hl(2xl) tx(xl)">
  <cq-box>…</cq-box>
</ui-card>
```

Read it as: *"headline two steps above the scale, summary one step above — whatever the scale is here."* In a narrow container the master step is `sm`, so `hl(2xl)` renders the **xl** stop and `tx(xl)` the **lg** stop; past the `lg` breakpoint (container ≥ 44rem) the master step becomes `md` and the same tokens render **2xl**/**xl**. You never write a `md:hl()` — the ladder does the responsive work.

> Breakpoints are **container** widths measured on the card's `cq-box` (or a reveal's `summary`): `md:` ≥ 25rem, `lg:` ≥ 44rem. `md:`/`lg:` tokens are inert on a bare `<ui-content>` with no such descendant.

### 6 · Headline-only responsive jump

When only the title should change gear:

```html
<ui-card content="hl(md) lg:hl(3xl)">…</ui-card>
```

Body copy holds its reading size at every width; the headline leaps to display size once the card is genuinely wide. Combine with a base `scl()` freely — both `hl()` forms read the same ladder.

### 7 · Bigger summary, untouched headline

The case that used to be impossible: the summary had no size of its own.

```html
<ui-card content="tx(xl)">…</ui-card>
```

`tx(<size>)` sets the **Body group base**, so summary, list, quote, address, timeline render from that step — and the prominent parts keep their ratios on top of it (price ×1.35, stat ×2). Per-part override still wins: `style="--ui-content-summary-fs: 1.4rem"`.

### 8 · Product card

Price and rating are Body/Meta group members — they ride the same system:

```html
<ui-card variant="col" media="asr(1/1)" content="scl(sm) tx(md) mt(med)">
  <cq-box>
    <ui-media><img src="…" alt=""></ui-media>
    <ui-content>
      <small data-part="eyebrow">New</small>
      <h3 data-part="headline">Field jacket</h3>
      <p data-part="price"><data value="129">€129</data> <del>€189</del> <small>−32%</small></p>
      <div data-part="rating" role="img" aria-label="4.5 of 5 stars">★★★★½ <small>(212)</small></div>
      <ul data-part="tags"><li><a href="#">Outdoor</a></li><li><a href="#">Recycled</a></li></ul>
    </ui-content>
  </cq-box>
</ui-card>
```

`scl(sm)` keeps the card compact; `tx(md)` lifts the Body group (which the ×1.35 price multiplies) back up one relative step so the price stays the hero. The `<del>`/`<small>` inside price auto-style (muted original, accent discount).

### 9 · Stat / dashboard card

The stat part renders its `<data>` at ×2 of the Body base:

```html
<ui-card variant="col" content="pad(lg) mt(sm)">
  <cq-box>
    <ui-content>
      <small data-part="eyebrow">This week</small>
      <p data-part="stat"><data value="12480">12,480</data> <small>sessions</small> <span>▲ 8%</span></p>
      <p data-part="meta">vs. previous 7 days</p>
    </ui-content>
  </cq-box>
</ui-card>
```

Make the number bigger without touching anything else: `tx(lg)` (the ×2 rides the Body base) — or surgically, `style="--ui-content-stat-fs: 4rem"`.

### 10 · Quote / testimonial

```html
<ui-card content="scl(lg) hl(accent) tx(500)">
  <cq-box>
    <ui-content>
      <blockquote data-part="quote">
        <q>The type system finally reads like the design intended.</q>
        <cite>Alex Chen — Design Systems Lead</cite>
      </blockquote>
    </ui-content>
  </cq-box>
</ui-card>
```

The quote part sits in the Body group at ×1.1 with a border-inline-start; `<cite>` auto-mutes. For the big pull-quote treatment, compose with `@browser.style/quote` (`<ui-quote variant="bigquote">`) — the card hook is for card-scoped overrides only.

### 11 · Gradient billboard

```html
<ui-card variant="vis(content)" theme="black dark" content="hl(3xl) hl(grad) hl(900) ctr">
  <cq-box>
    <ui-content>
      <small data-part="eyebrow">Launch</small>
      <strong data-part="headline">Ship the scale</strong>
    </ui-content>
  </cq-box>
</ui-card>
```

`hl(grad)` clips the whole headline to `--ui-content-headline-gradient` (retune via that property). Prefer a partial highlight? Skip the token and wrap words in `<b>` inside the headline — inner `<b>` gets the same gradient on its own.

### 12 · Monospace / changelog card

```html
<ui-card content="fnt(mono) scl(sm) eb(flat) eb(med)">
  <cq-box>
    <ui-content>
      <small data-part="eyebrow">v4.2.0</small>
      <h3 data-part="headline">content: relational ladder</h3>
      <ul data-part="list">
        <li>hl()/tx()/eb()/mt() take sizes</li>
        <li>poster → 3xl</li>
      </ul>
    </ui-content>
  </cq-box>
</ui-card>
```

`fnt(mono)` sets the **whole column** (headline follows the container font unless `hl(<font>)` says otherwise). `eb(flat)` drops the eyebrow's uppercase — version strings shouldn't shout.

### 13 · Deck-level typography (one spec, many cards)

`content=` inherits, so a whole section can share one type spec:

```html
<lay-out md="columns(2)" lg="grid(3a)" content="scl(sm) mt(med) eb(accent)">
  <ui-card>…</ui-card>
  <ui-card>…</ui-card>
  <ui-card content="scl(md) hl(lg)">…</ui-card>   <!-- the feature card opts up -->
</lay-out>
```

Nesting is **nearest-host-wins**: the third card's own `scl(md)` beats the deck's `scl(sm)` for everything inside it. `scl(md)` is not a no-op — it *explicitly resets* an inherited step (identity ladder), which is exactly how a feature card escapes a damped deck. Its `hl(lg)` then reads its own ladder: lg stop, not shifted.

### 14 · Tones and weights cookbook

The tone ramp is an opacity scale of the *current* ink, so it survives theme flips (dark cards re-tone for free):

```html
content="tx(drk)"            <!-- body at 85% — softer than solid, darker than muted -->
content="mt(shr)"            <!-- whisper-quiet meta at 30% -->
content="hl(sld) tx(med)"    <!-- max-contrast title over 65% body -->
content="eb(700) eb(sld)"    <!-- heavy, full-ink eyebrow -->
content="hl(300) hl(serif)"  <!-- light serif display -->
```

On overlays, prefer `inv` (true white) over `sld` (theme text) — `content="hl(inv) mt(inv) mt(shd)"`.

### 15 · Off-ladder sizes and other escape hatches

Every token writes a property; write the property yourself when the ladder doesn't fit:

```html
<!-- one-off headline size, still fluid -->
<ui-content style="--ui-content-headline: clamp(3rem, 2rem + 9cqi, 7rem)">…</ui-content>

<!-- pin a group base to an exact value -->
<ui-content content="scl(sm)" style="--ui-content-body-fs: 1rem">…</ui-content>

<!-- retune a single part -->
<ui-content style="--ui-content-tags-fs: 0.65em; --ui-content-headline-wrap: pretty">…</ui-content>
```

Group bases: `--ui-content-body-fs` (Body), `--ui-content-meta-base` (Meta), `--ui-content-eyebrow-fs` (Eyebrow). A directly-set property is absolute — it deliberately does **not** ride the ladder.

### 16 · Designer-fixed scales — `scl(fix)`

Designers often spec **exact sizes per breakpoint**, not fluid ranges. `scl(fix)` re-points every stop from its fluid clamp to the **global static type scale** (`--font-size-*` — the familiar 0.875 / 1 / 1.125 / 1.25 / 1.5rem text sizes, headlines on `xl`–`7xl`):

```html
<!-- exactly 1.875rem, then exactly 3rem past the lg breakpoint — nothing in between -->
<ui-card content="scl(fix) hl(lg) lg:hl(xl)">…</ui-card>

<!-- the whole relational system still works, just discrete: -->
<ui-card content="scl(fix) scl(sm) lg:scl(md) hl(2xl) tx(xl)">…</ui-card>
```

Everything composes as before — steps, the ladder, responsive prefixes, the ×-factor parts — the only thing that changes is *what a stop is*: a static token instead of a clamp. Type now changes **only at the container breakpoints**, which is precisely the Figma mental model. The full stop→token mapping is in [content.md](content.md) (*Static scale*).

Escape back per card with `scl(fluid)` — a fixed deck can hold one fluid hero:

```html
<lay-out lg="grid(3a)" content="scl(fix) scl(sm)">
  <ui-card content="scl(fluid) scl(lg) hl(2xl)">…</ui-card>  <!-- fluid feature card -->
  <ui-card>…</ui-card>                                        <!-- static, per the deck -->
</lay-out>
```

Rebrand the static scale in one place by overriding `--font-size-*` globally — the cards follow.

---

## How resolution works (when you need to reason about it)

- **Co-located tokens compose relationally.** `scl()` + any size on the same host (or inherited without an intermediate override): the size reads the shifted ladder. This is the normal case and the one to reach for.
- **Nesting is nearest-host-wins.** A `scl()`/size on a nested card beats a group-level size for that card's subtree — decks stay predictable, feature cards can opt out (use-case 13).
- **`hl()` beats `scl()`'s own headline write** at every breakpoint when both sit on one host — an explicit headline step always wins over the master default, while still shifting with the master via the ladder.
- **Saturation.** The ladder clamps at its ends: under `scl(xl)` the three display steps merge at 3xl; under `scl(sm)` the small steps merge at sm. If two parts must stay distinct at extreme steps, keep them ≥ 2 steps apart or pin one via `style=`.
- **Responsive needs a queryable box.** `md:`/`lg:` forms target the card's `cq-box` / reveal's `summary`. On a bare `<ui-content>` they're inert — wrap it in a container or use the base tokens.
- **Subheadline follows the body**, not `hl(<size>)` — it's Headings group for *ink*, but its size stays proportional (×0.88) so a display title never drags the standfirst with it.

## Gotchas

- **`poster` is gone** — write `hl(3xl)`. Same clamp, regular name.
- **No `scl(2xl)` / `tx(2xl)`.** The body ramp's `2xl` stop is ladder headroom only — you reach it when `scl(lg)`/`scl(xl)` shift `tx(lg)`/`tx(xl)` up.
- **Group sizes have no `md:` forms — by design.** Don't look for `md:tx(lg)`; write `tx(lg)` and let `md:scl()` move it.
- **`ch` widths, `cqi` values and animation endpoints are not tokens** — content-relative values stay literal (see *What NOT to Do* in [docs/design-system-agent.md](../../../docs/design-system-agent.md)).
- **`scl(fix)`/`scl(fluid)` are modes, not steps** — no `md:` forms, and the nearest mode token wins in nesting, with one asymmetry: an explicit `scl(fluid)` can't be re-fixed further down its subtree.
- **`scl(fix)` changes rendered sizes slightly** vs. the fluid clamps at most widths — the static values are the global scale's round numbers, not frozen snapshots of the clamps. That's the point: designers get the sizes they spec'd.

## Where everything is defined

| You're looking for | File |
|--------------------|------|
| The ramps, ladder, `scl()`/`hl()`/`eb()`/`tx()`/`mt()`/`fnt()` rules | [content.typography.css](../content.typography.css) |
| Parts, spacing (`pad()`/`gap()`), scroll (`scr`), container | [content.css](../content.css) |
| Full token tables + cascade internals | [content.md](content.md) |
| Live examples of every ramp and the relational scale | [content.typography.html](../demo/content.typography.html) |
| Card arrangement (`variant=`), overlays (`ovr()`), themes | [ui-card-tokens.md](ui-card-tokens.md), [../base/theme.md](../../base/theme.md) |
| Media frame + scrim (`media=`, `scm`) | [media.md](media.md) |
