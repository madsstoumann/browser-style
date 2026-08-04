# The layout & card system — a user guide

> **Guide, not reference.** This walks you through *using* the whole system, from a single card to a full page — sections, carousels, themes, reveals and motion. The full token references live with each package (see the table at the end); the type system has its own use-case guide in [ui/card/docs/typography.md](../ui/card/docs/typography.md). Everything here is pure CSS unless marked otherwise.

It's written to be read top to bottom: each section builds on the one before, and every example is real, working markup you can paste into a page.

The short version of the whole philosophy:

- **It's CSS-first.** Everything in this guide works with stylesheets alone. JavaScript exists, but only as progressive enhancement (seamless carousel loops, video facades, responsive images) — nothing breaks without it.
- **You style with tokens, not classes.** A handful of attributes — `variant=`, `theme=`, `media=`, `content=` — each hold a short, space-separated string of tokens like `asr(16/9)` or `scl(lg)`. One attribute, one little language.
- **Everything is light DOM.** No Shadow DOM anywhere, so your own CSS, your framework, and the browser's accessibility tree all see plain HTML.

---

## The cast

Four custom elements do the composing, two do the content:

| Element | Role |
|---|---|
| `<lay-out>` | arranges a **section** — a responsive grid of cards (or anything else) |
| `<lay-out-group>` | wraps a section with a header band (headline + "view all" link) |
| `<ui-card>` | one **card** — the static host that arranges its media and text |
| `<ui-reveal>` | the interactive sibling — a card that flips, expands, slides or scales open |
| `<ui-media>` | the **picture half**: images, video, carousels, overlaid chips & buttons |
| `<ui-content>` | the **text half**: eyebrow, headline, summary, byline, tags, actions … |

Only `<ui-media>` is a registered web component (it upgrades images with `srcset`). Everything else is styled purely through CSS attribute selectors — the elements are just names.

---

## Setup

Three stylesheets — the shared base (design tokens, carousel controls, animation engine), the layout system, and the card system:

```html
<link rel="stylesheet" href="@browser.style/base/index.css">
<link rel="stylesheet" href="@browser.style/layout/dist/layout.css">
<link rel="stylesheet" href="@browser.style/card/ui-card.css">
```

Optionally, the JS enhancements (carousel loop/autoplay, video facades, image srcset):

```html
<script type="module" src="@browser.style/card/index.js"></script>
```

Using reveals too? Swap the card stylesheet for `@browser.style/reveal/ui-reveal.css` — it imports the card CSS for you.

---

## Your first card

A card is a host, a query box, and the two primitives:

```html
<ui-card variant="col" media="asr(16/9)" content="scl(md)">
  <cq-box>
    <ui-media>
      <img src="/assets/images/hubble.png" alt="A nebula photographed by Hubble">
    </ui-media>
    <ui-content>
      <small data-part="eyebrow">Science</small>
      <h2 data-part="headline">Deep field, deeper questions</h2>
      <p data-part="summary">What the latest survey tells us about the early universe.</p>
    </ui-content>
  </cq-box>
</ui-card>
```

Three things to notice:

- **`<cq-box>`** is a thin wrapper the card needs for container queries — a CSS container can't query its own size, so the grid lives one level down. Just always include it; that's the whole story.
- **`data-part`** names each piece of text (`eyebrow`, `headline`, `summary`, `byline`, `tags`, `actions`, and many more). The styling keys off the part name, never the tag — so use whatever heading level is semantically right.
- **The three attributes** on the host are the token DSLs. Let's talk about those.

---

## How tokens work

Every styling attribute holds a space-separated list of small tokens. A token is either a bare word (`scm`, `loop`, `ctr`) or a word with a value — `asr(16/9)`, `scl(lg)`, `pad(md)`. You combine them freely:

```html
<ui-card variant="row spl(1/2) rds(lg)" media="asr(4/3) scm" content="scl(lg) pad(lg)">
```

Two rules govern where tokens can live — worth memorizing, because they explain everything else in this guide:

1. **`content=` flows down.** Its tokens are inherited custom properties, so you can set `content=` on a `<ui-card>`, a `<lay-out>`, or a `<lay-out-group>`, and every `<ui-content>` below picks it up (nearest wins).
2. **`media=` stops at the card.** A `<ui-media>` reads `media=` from itself or its own `<ui-card>`/`<ui-reveal>` host — never further up. That's what lets a `<lay-out>` carry `media=` tokens for **its own** carousel (more on that later) without restyling every image inside its cards.

And when there's no token for what you want, there's always the escape hatch — every token just writes a custom property, so you can set it directly:

```html
<ui-card style="--ui-card-radius: 4px">
```

---

## Arrange it — `variant=`

`variant=` composes the two halves. The default is `col` (media above text):

| Token | Arrangement |
|---|---|
| `col` / `col-r` | media above text / text above media |
| `row` / `row-r` | side by side / side by side, text first |
| `spl(1/1 · 1/2 · 2/1 · 1/3 · 3/1)` | the column ratio for `row`/`row-r` |
| `vis(media)` / `vis(content)` | show only one half |
| `ovr(tl … br)` | overlay the text **on** the media, anchored to one of nine positions |
| `rds(sm · md · lg · xl · 2xl · none · pill)` | corner radius (`rds(lg-sq)` etc. for squircles) |

Now the fun part: **cards respond to their own width, not the screen.** Prefix an arrangement token with `md:` (card ≥ 25rem wide) or `lg:` (≥ 44rem) and the card reshapes itself wherever it happens to be rendered:

```html
<ui-card variant="col md:row md:spl(1/2)" media="asr(4/3)">
```

The same markup is a stacked tile in a narrow sidebar and a split hero in a wide column — no media queries, no extra classes.

One pairing to remember: `ovr()` puts (usually white) text on top of your image, so add `scm` (scrim) to `media=` for contrast:

```html
<ui-card variant="ovr(bs) rds(lg)" media="asr(4/3) scm" content="scl(lg)">
```

---

## Style the words — `content=`

`content=` drives the text column. The big lever is the **type scale**:

| Token | Effect |
|---|---|
| `scl(sm · md · lg · xl)` | the whole column's type scale — every part rides along |
| `hl(sm … 3xl)` | headline size on its own ladder (also `md:`/`lg:` prefixable, like `scl()`) |
| `hl() / eb() / tx() / mt()` | per-part tone & weight: `(accent)` `(lgt)` `(med)` `(drk)` `(inv)` or a weight `(300…900)` |
| `fnt(body · head · serif · mono · form)` | font family for the column |
| `pad(xs … 2xl · none)` / `gap(xs … lg · none)` | column padding / rhythm between parts |
| `ctr` / `end` | align the column |

```html
<ui-content content="scl(lg) hl(2xl) eb(accent) fnt(serif) pad(lg) gap(sm)">
```

Remember rule 1: `content=` can sit on any ancestor. Put `content="scl(sm)"` on a `<lay-out>` and every card in the section quiets down together.

The full type system (the relational ladder, fluid sizing, all the parts) lives in [ui/card/docs/content.md](../ui/card/docs/content.md).

---

## Frame the picture — `media=`

`media=` shapes the media frame:

| Token | Effect |
|---|---|
| `asr(16/9 · 4/3 · 1/1 · 3/4 · 21/9 …)` | aspect ratio |
| `obp(ts … be)` | object-position — which part of the image survives the crop |
| `obf(con)` | object-fit contain (cover is the default) |
| `flp(h · v · hv)` | mirror the image |
| `scm` | scrim gradient for overlaid text |
| `hov(zoom · pan · tilt · dim · bright · gray · blur · track · drift)` | hover effect |

And the **furniture** — little overlays that live on the media, positioned by the same corner grid you'll see everywhere (`t`op/`b`ottom/`c`enter × `s`tart/`c`enter/`e`nd):

```html
<ui-card variant="col" media="asr(4/3) chip(ts) chip(green) save(te)">
  <cq-box>
    <ui-media>
      <img src="/assets/images/river.png" alt="">
      <ui-chip>New</ui-chip>
      <ui-save><button type="button" aria-label="Save">…</button></ui-save>
    </ui-media>
    …
  </cq-box>
</ui-card>
```

`chip()` and `sticker()` are labels; `save()` and `play()` are interactive. One value per token — `chip(ts) chip(green)`, not `chip(ts green)`.

---

## Make it a carousel

Give `<ui-media>` more than one child and add `nav`:

```html
<ui-media media="asr(16/9) nav">
  <img src="/assets/images/hubble.png" alt="">
  <img src="/assets/images/quantum.png" alt="">
  <img src="/assets/images/websummit.png" alt="">
</ui-media>
```

That's a complete carousel: scroll-snap slides, CSS-only dots and arrows. Everything about the controls is tokens in the same `media=` string (which, remember, can also sit on the card host):

| Token | Effect |
|---|---|
| `nav` | markers + arrows overlaid on the media |
| `nav(mrk)` / `nav(arw)` | just one kind of control |
| `nav(blw)` / `nav(abv)` | move the controls into a reserved band below / above |
| `arw(arr · sm · lg · xl · sqr · sft · bare · set · drk · lgt · hid)` | arrow glyph, size, shape, style; `set` clusters the pair, `hid` auto-hides at the ends |
| `mrk(sm … xl · pll · hyb · tmb · non · drk · lgt)` | dot size and shape — `pll` pills with a fill timer, `tmb` thumbnails |
| `arw(ts … be)` / `mrk(ts … be)` | place arrows / dots on the corner-and-edge grid |
| `axis(y)` | vertical carousel |
| `auto` / `auto(4s)` · `loop` | autoplay and seamless wrap (the JS chunk) |

A polished example — band below, bare full arrows, pill dots, autoplaying:

```html
<ui-card variant="col" media="asr(16/9) nav(blw) arw(bare) arw(arr) mrk(pll) auto(4s) loop">
```

---

## Give it a theme — `theme=`

`theme=` is the shared colour axis: one colour word plus optional modifiers.

```html
<ui-card theme="black dark" …>     <!-- dark surface, dark colour-scheme -->
<ui-card theme="red pale" …>       <!-- tinted red surface -->
<ui-card theme="gray" …>           <!-- quiet neutral -->
```

Colours: `red orange green blue accent white gray slate black` — the neutrals form a light→dark ramp (`white < gray < slate < black`). Modifiers: `pale` (tint), `muted` (fade), `light` / `dark` (flip the colour-scheme so buttons, pills and controls re-tone too). The same axis works on `<lay-out>`, `<lay-out-group>` and other components — details in [ui/base/theme.md](../ui/base/theme.md).

---

## Build the page — `<lay-out>`

Cards don't arrange themselves; sections do. `<lay-out>` is a responsive grid whose pattern you pick **per viewport breakpoint** with the `xs sm md lg xl xxl` attributes:

```html
<lay-out md="columns(2)" lg="grid(3a)">
  <ui-card …>…</ui-card>
  <ui-card …>…</ui-card>
  <ui-card …>…</ui-card>
</lay-out>
```

One column on phones (the default), two from `md` (540px), an asymmetric three-cell grid from `lg` (720px). Patterns include `columns(2…)`, `grid(…)`, `bento(…)`, `mosaic(…)`, `ratios(…)`, `asym(…)`, `lanes(…)` (masonry) and `stack(…)` — the generated demo pages under `layout/dist/` show every one.

The breakpoint attributes also carry **spacing and alignment tokens**, so a section's rhythm lives in the same place as its pattern:

```html
<lay-out xs="pi(1) rg(2)" lg="columns(2) items(start) cg(3)">
```

- `p() pi() pb() pbs() pbe()` — padding · `mbs() mbe()` — block margins · `cg() rg()` — column/row gaps (all multiples of the space unit)
- `items(start · center · end · stretch)` — stop unequal-height cells from stretching to the tallest

Plus a few element-level attributes: `bleed` (break out to full viewport width), `width="xs…xxl"` (cap the section), `gap-decorations="cols rows"` (rules in the gaps).

**Two "md/lg" axes, on purpose.** `<lay-out md= lg=>` reacts to the *viewport* and picks the section pattern; a card's `md:`/`lg:` token prefixes react to the *cell width* the layout produced. They compose beautifully: the layout decides how many columns, each card decides how to use the width it got.

### Section headers — `<lay-out-group>`

Wrap a section to give it a header — and since `content=` flows down, style the header right on the group:

```html
<lay-out-group theme="gray" content="ctr pad(none)">
  <ui-content>
    <small data-part="eyebrow">From the archive</small>
    <h2 data-part="headline">Editor's picks</h2>
    <a data-part="link" href="/archive">View all</a>
  </ui-content>
  <lay-out lg="columns(3)"> … </lay-out>
</lay-out-group>
```

---

## Layout carousels

A section can *be* a carousel: `overflow` turns the layout into a scroll-snap row, and — here's rule 2 paying off — the layout's **own** `media=` attribute configures its controls with the exact same tokens you already know:

```html
<lay-out md="columns(2)" lg="columns(3)" overflow media="nav(blw) arw(bare) mrk(pll) pages">
  <ui-card …>…</ui-card>
  <ui-card …>…</ui-card>
  <ui-card …>…</ui-card>
  <ui-card …>…</ui-card>
</lay-out>
```

- `overflow` values tune the scroller: `preview`/`preview-lg`/… peek the next item, `center` and `frame` add a peek on both sides, `gaps` adds end gutters, `fade` adds edge masks, `stop` snaps one item per fling.
- `pages` (a `media=` token) gives you one dot per **page** of items instead of per item — the count adapts per breakpoint automatically.
- `auto(4s)` and `loop` work here too.

And because `media=` inheritance stops at the card, none of this leaks: the cards inside can have their own image carousels (or none), completely unaffected by the layout's controls.

---

## Open it up — `<ui-reveal>`

`<ui-reveal>` is a card built on native `<details>/<summary>`: the front face is the `<summary>`, the hidden panel is whatever follows it. No JavaScript — the browser owns the open/close state.

```html
<ui-reveal variant="flp ovr(bs) rds(lg) ico(te) ico(sm) icc(drk)"
           media="asr(1/1) hov(zoom) scm">
  <details name="cards">
    <summary>
      <ui-face>
        <ui-media><img src="/assets/images/finance.png" alt=""></ui-media>
        <ui-content><h3 data-part="headline">Q3 in five charts</h3></ui-content>
      </ui-face>
      <ui-icon type="plus-cross" aria-hidden="true"></ui-icon>
    </summary>
    <ui-content>
      <h3 data-part="headline">The details</h3>
      <p data-part="summary">Everything behind the front face.</p>
    </ui-content>
  </details>
</ui-reveal>
```

All reveal behaviour lives in the same `variant=` attribute the card uses:

| Token | Effect |
|---|---|
| `exp` · `flp(top|btm|lft)` · `sld(top|btm|lft|rgt)` · `grw(ts|te|bs|be)` | the animation — **exp**and below, **fl**i**p** 180°, **sl**i**d**e in, **gr**o**w** from a corner. One token; the direction/origin rides in the value (bare `flp`/`sld` = from the right, bare `grw` follows the `ico()` corner) |
| `lg:grw` | switch animation when the card is wide (expand on mobile, morph on desktop) |
| `pop` | expand becomes a centered popup with a backdrop |
| `trg(card)` | the whole card is the toggle (no icon needed) |
| `scr` | long panels scroll inside the card frame |
| `ico(ts · te · bs · be)` + `ico(drk · sem · sm · lg)` | toggle-icon corner, ink, size — one word per token |
| `icc(…)` | the same words, applied while **open** — move or re-tone the close icon |

Wrap the front face in `<ui-face>` for `flp`/`sld`/`scl` (it's what transforms). A shared `name` on the `<details>` makes a group mutually exclusive — open one, the others close. Native behaviour, free of charge.

---

## Set it in motion

Scroll-driven animation is attribute-based too, and works on **any** element:

```html
<lay-out lg="columns(3)" animate="fade-up() trigger slow">   <!-- children animate in -->
<ui-card animate-self="reveal(circle)">                       <!-- the element itself -->
```

- `animate=` runs a named keyframe on each child as the container scrolls into view; `animate-self=` animates the element itself. Names always take parentheses: `fade-up()`, `bounce-in-up()`, `flip-left()`, `zoom-in(2)` …
- **Pace words ride the same attribute**: `very-slow slow fast very-fast` shape the entry, `exit exit-fast exit-slow` add a mirrored exit — `animate="fade-up() slow exit-fast"`.
- `trigger` makes it a one-shot; by default it's scroll-linked and reverses when you scroll back. `easing="ease-spring-3"` (its own attribute) picks a curve.
- `stagger` on a `<lay-out>` (or `data-stagger` on native elements) cascades the children in one after another — and inside carousels, `media="stagger"` reveals each slide's content as it snaps in.

---

## Putting it all together

A complete section, using most of the guide:

```html
<lay-out-group theme="gray" content="pad(none)">
  <ui-content>
    <small data-part="eyebrow">Field notes</small>
    <h2 data-part="headline">This week</h2>
    <a data-part="link" href="/notes">All notes</a>
  </ui-content>

  <lay-out md="columns(2)" lg="columns(3)" overflow media="nav(blw) arw(bare) pages" stagger>
    <ui-card variant="col md:row md:spl(1/2) rds(lg)" media="asr(4/3) hov(zoom)" content="scl(sm)">
      <cq-box>
        <ui-media><img src="/assets/images/river.png" alt=""></ui-media>
        <ui-content>
          <small data-part="eyebrow">Nature</small>
          <h3 data-part="headline">Where the river bends</h3>
          <p data-part="summary">A slow walk upstream.</p>
        </ui-content>
      </cq-box>
    </ui-card>
    <!-- … more cards … -->
  </lay-out>
</lay-out-group>
```

Read it back and notice how much is *not* there: no classes, no media queries, no JS hooks. The section is a carousel with paged dots in a band; each card reshapes at its own widths; the header is styled from the group; everything staggers in on scroll.

---

## Where to go next

| You want… | Read |
|---|---|
| the `<ui-card>` API & quick-start | [ui/card/readme.md](../ui/card/readme.md) |
| every `variant=` token + reveal tokens | [ui/card/docs/ui-card-tokens.md](../ui/card/docs/ui-card-tokens.md) |
| to *use* the type system (use-case guide) | [ui/card/docs/typography.md](../ui/card/docs/typography.md) |
| the type system reference | [ui/card/docs/content.md](../ui/card/docs/content.md) |
| the media frame, furniture, video | [ui/card/docs/media.md](../ui/card/docs/media.md) |
| every carousel token | [ui/card/docs/carousel.md](../ui/card/docs/carousel.md) |
| `<ui-reveal>` in depth | [ui/reveal/readme.md](../ui/reveal/readme.md) |
| every layout pattern & attribute | [layout/core/base.md](../layout/core/base.md) |
| keyframes & the animation engine | [ui/card/docs/animations.md](../ui/card/docs/animations.md) |

Driving pages from a CMS? Cards can be rendered from JSON: a **preset** (a named bundle of these same token strings) plus a content object, turned into HTML by a small Node-safe renderer — see [ui/card/docs/card.md](../ui/card/docs/card.md).

Happy building!
