# CSS Carousels — standalone CodePen demos

Fourteen standalone demos for the CSS-carousel article (`article.md`, same folder).
They do **not** use the browser.style styles, the `<ui-media>` element, or the `media=` token
language. Each one is plain HTML with regular class names, plus a small stylesheet.

## Setting the pens up on CodePen

- **Pen 01 (Basics)** is the base. Its CSS panel is `01-basics/style.css`, and its JS panel is
  `01-basics/script.js`.
- **Every other pen:** the HTML panel gets the contents of `<body>`, and the CSS panel gets the
  pen's own `style.css`. Under *Settings → CSS*, add Pen 01's CSS as an external stylesheet
  (`https://codepen.io/<user>/pen/<slug>.css`). Under *Settings → JS*, add Pen 01's JS
  (`…/<slug>.js`).
- Images are loaded from `https://v4.browser.style/assets/images/…` as plain URLs, without the
  `cdn-cgi` resizing, because that path is hotlink-protected. Some of the PNGs are 1–2 MB.
  Before publishing, it is worth swapping them for resized copies.

To view them locally, serve the repo root and open `ui/card/demo/codepen/index.html`.

## No JavaScript required, but there is a fallback

Every demo works with JavaScript turned off. Without JS, a carousel that has no native controls
is still a swipeable scroll-snap row.

`01-basics/script.js` checks `CSS.supports('scroll-marker-group: after')`. If that fails (Safari
and Firefox, as of October 2026), it wraps each `.carousel` in a `.carousel-polyfill`. Inside the
wrapper it adds real `<button>` arrows and dots:

- It copies every custom property from the carousel onto the wrapper, so the fallback buttons use
  the same tokens (`--dot-size`, `--arrow-bg` …).
- It copies a slide's *own* custom properties onto its dot. That covers `--thumb` and the
  per-slide colourway colours.
- It writes `data-label` and `data-date` into the dot as text, for the labels and timeline pens.
- It creates dots only for snap targets (`scroll-snap-align` ≠ `none`). This is how the paged
  pen ends up with one dot per page.
- It marks the current slide with `[data-current]`. The stagger pen uses this when
  `scroll-state` queries are missing.
- It rebuilds the dots on `change`, for the quiz pen.

**Test it in Chrome by adding `?polyfill` to the URL.** That switches the native controls off and
forces the fallback.

Rules for the fallback buttons live at the bottom of each pen's stylesheet, under
`.carousel-polyfill`.

## Analysis: from ~40 variants to 14 pens

`media.carousel.html` shows about 40 token combinations. Most of them are the *same technique
with different values*, so in the pens they collapse into modifier classes:

| Pen | Covers (demo sections / tokens) | Why one pen |
|---|---|---|
| 01 Basics | `nav`, `nav(mrk)`, `nav(arw)`, `nav(non)` | the four on/off states of the same two pseudos |
| 02 Arrow styles | `arw(arr/bare/drk/lgt)`, `arw(sm…xl)`, `arw(sqr/sft)`, `arw(rev)`, `arw(hid)`, *Ink* section | all of them are tokens on one `::scroll-button` rule |
| 03 Placing the controls | `arw(tc/cc/bc)`, `arw(set)` + cells, `arw(out)`, `mrk(ts…be)` | all of them are `anchor()` insets |
| 04 Controls in a band | `nav(blw/abv)`, `mrk(blw/abv)`, `arw(blw/abv)`, band position, band ink | one idea: a static marker group in normal flow |
| 05 Dots, pills, colourways | `mrk(md…xl)`, `mrk(pll)`, `mrk(hyb)`, *Colourways* | marker *shape*, plus per-slide inheritance |
| 06 Thumbnails | `mrk(tmb)` overlay, corners, `mrk(blw)` filmstrip, `tmb(ratio)` | one `--thumb` rule; placement reuses pens 03/04 |
| 07 Labels and a timeline | `mrk(lbl)` (+ overflow), `mrk(tml)` | both are `content: attr()` |
| 08 A bar | `mrk(bar)`, `mrk(sbr)` | "progress line" markers vs. the real scrollbar |
| 09 Vertical | `axis(y)` + arrows/sets | the same carousel on the other axis |
| 10 More than one per view | `<lay-out overflow>`: pages, peek (`frame`), full-screen center | slide width ≠ 100%; snap-align tricks |
| 11 Stagger | `stagger`, `ani(rise/fall/lft/rgt/zom/blr/fde)`, per-slide `ani()` | `scroll-state` container + `sibling-index()` delays |
| 12 Scroll-driven | `<lay-out stagger>` `view(inline)` reveal, `stagger~="trigger"` | `animation-timeline` and `timeline-trigger` |
| 13 Dynamic dots | `mrk(dyn)` | a scroll-driven *number* doing the maths |
| 14 A gated quiz | `nav(end)` + `gate` | `:has(:invalid) ~ * { display: none }` |

**Left out on purpose:**

- *JS-enhanced*: autoplay, `loop`, `<ui-play>` and video. The article is about CSS-only carousels.
  Pen 05's pill timer is the one place that hints at autoplay.
- *Fixed furniture*: `fixed`, stickers and chips. This is card-system specific.
- The *lightbox*: a separate component with its own page.
- `pages` dissolving below `md`. It is a `<lay-out>` breakpoint feature, not a carousel technique.
- *Grid pages staggered* (`crd()` + `ani()` channels). Pen 11's per-slide effects carry the same
  idea in a simpler form.
- *System-bar* fine-tuning (`--ui-carousel-sbr-*`, WebKit scrollbar pseudos). Pen 08 shows the
  standard `scrollbar-color` / `scrollbar-width` version only.
- `mrk(rail)`: a vertical thumbnail rail. It is pen 06 + pen 09 combined.

## Browser notes (October 2026, worth re-checking before publishing)

| Feature | Chrome | Safari | Firefox | Used in |
|---|---|---|---|---|
| `scroll-snap` | ✓ | ✓ | ✓ | all |
| `::scroll-marker`, `::scroll-button()`, `:target-current` | 135+ | ✗ → JS fallback | ✗ → JS fallback | all |
| Anchor positioning | ✓ | 26+ | check | native controls only, the fallback doesn't need it |
| `container-type: scroll-state` | 133+ | ✗ → `[data-current]` fallback | ✗ | 11 |
| `sibling-index()` / `sibling-count()` | 138+ | check | ✗ | 11, 13 (without it there is no stagger delay, and everything animates at once) |
| `animation-timeline: view()` / `scroll()` | ✓ | 26+ | behind a flag | 12, 13 |
| `timeline-trigger` | 145+ | ✗ | ✗ | 12, demo 3 (other browsers just show the cards) |

Known differences in the fallback:

- **Pen 13:** no dynamic dots. It shows a plain dot per slide.
- **Pen 10:** arrows are centred at 40% of the wrapper rather than exactly on the images.
- **Pen 08, "bar below":** the arrows are centred on wrapper + bar.

**Chromium quirk found while building pen 06:** a `::scroll-marker-group` that is `position:
static` *and* a scroll container collapses to almost no height when its markers size themselves
with `aspect-ratio`. An explicit `block-size` fixes it. Also, once the group is static, the base
`justify-self: anchor-center` shrinks it to zero width, so the band pens reset it to `normal`.
