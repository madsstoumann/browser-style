# Demo-pages performance pass — 2026-08-13

> The schema.html playbook (`docs/performance-handover.md`) applied to the other 19 card demo
> pages. Baseline numbers are Lighthouse 13.4 mobile single runs on **browser-style-v4.pages.dev**
> (2026-08-13); "after" numbers are localhost runs — see the caveat below before comparing scores.
> Companion record: `docs/schema-demo-performance.md`.

## What was applied (per the handover playbook)

- **Images**: every local `<img>` got the five-width CDN srcset (240/320/480/720/1200,
  `format=auto,quality=80`, `fit=cover`+height only when the enclosing frame has `asr()` —
  no asr = width-only, Cloudflare keeps the natural ratio, mirroring `render.js`). `sizes`
  computed per enclosing `<lay-out>` via layout's `generateSrcsets`/`calculateSizes` (not one
  global list — each grid gets its own). Exactly one `loading="eager" fetchpriority="high"`
  per page; everything else `lazy` + `decoding="async"` + `auto,`-prefixed sizes.
  `<video poster>` → single 720-wide transform. Done by two scratchpad transform scripts
  (cheerio-free, surgical string edits) — the markup diff is attribute-only.
- **CSS**: multi-`<link>` stacks (4–17 sheets, 25–40 render-blocking requests) → one
  `/dist/demo.min.css` (62 kB gzip) + the page's opt-in sheets (`media.shapes.css`,
  `media.tint.css`, `demo.layout.css`) where used.
- **JS**: source modules → `.min.js` bundles (`carousel/video/hover/lightbox/index`), including
  inline `import` sites. `render.html` + `video.render.html` serial await-per-file data loops →
  `Promise.all` (render.html was a 38-request waterfall).
- **Heads**: `<meta name="referrer" content="no-referrer">` (hotlink protection), preconnect to
  `v4.browser.style`, the schema.html page-scoped contrast `<style>` block.
- **Landmarks**: every page wrapped in `<main>` (schema pattern: `data-layout-root` moves with
  it; `body > lay-out` selectors rewritten to `main > lay-out`).
- **Generators fixed, not their output**: `articles/build.js` now passes
  `renderCard(…, { images })` (prose pages `(min-width: 720px) 42rem, 100vw`; the teaser grid
  the `columns(2)` list), swaps the link stack for the bundle, adds the contrast block +
  `<main>`, marks the first grid teaser eager; `carousel.render.html` / `video.render.html`
  inline scripts pass the same `images` option.

## Bugs found on the way

- **Page-relative src + CDN transform = broken image.** `render.js cdnEligible` (and
  `ui-media-srcset.js #eligible`) accepted any non-http src; a page-relative
  `youtube-data/previews/x.jpg` became `/cdn-cgi/image/…/youtube-data/…` — wrong zone path,
  404, and a failed candidate never falls back to `src`. Both now require root-relative
  (`/…`, not `//…`). Kept in sync (comments cross-reference).
- **Hand-set `--ui-carousel-thumb-url` vars loaded full originals.** 66 inline styles on
  media.carousel.html (+ builder template) pointed CSS backgrounds at raw `/assets` PNGs —
  a 48 px thumbnail dot fetching 1.9 MB, ~16 MB total on one page (CSS background fetches
  ignore `loading="lazy"`). Now `width=160` transforms.
- **A11y one-offs**: media.rtl `h3`→`h2` (heading order); 34 `alt="" aria-label` conflicts on
  media.carousel folded into real `alt`; empty `"alt": ""` on 7 video UCF image items filled;
  customizable-`<select>` inner buttons got `aria-label`; landmark + contrast everywhere.
- **Carousel polyfill dot hit areas** (axe `target-size`): dots were 10×10, pills 24×6. The
  polyfill sheet now grows every `[data-dot]` hit box to ≥24×24 via content-box padding + a
  cancelling negative margin — painted size, spacing and layout are unchanged
  (`background-clip/origin: content-box`; every `background:` shorthand on dots re-asserts it).
  `mrk(tmb)`/`mrk(tml)`/`mrk(bar)` opt out (`--_hit-*: 0`); `mrk(bar)` instead raised its
  track hit (`--ui-carousel-bar-hit` default 0.875rem → 1.5rem, painted line still 1px).
  Native `::scroll-marker` path untouched (pseudos are invisible to axe; revisit separately).

## Numbers

Baseline (pages.dev, single runs): perf 58–79 on image pages, LCP 8–73 s, 2–25 MB.
Standouts: content.html LCP **73 s** (25 eager raw images), media.carousel 17.8 MB,
media.video 58/FCP 7.1 s. A11y 85–96 across the board (color-contrast on all 20,
landmark-one-main on 15).

After (localhost, single runs): weight collapsed — content 25.2 MB → **0.5 MB**,
media.carousel 17.8 → **3.3 MB**, media.lightbox 9.2 → **0.8 MB**, cards 14.5 → **2.4 MB**,
articles/article 3.3 → **0.44 MB**. A11y **100** on media.video/collage/hover/render/articles;
93–96 remain where axe still flags pieces (see below). Zero 4xx, zero console errors,
`naturalWidth > 0` on every page, exactly one eager LCP each.

**Localhost score caveat**: `python3 -m http.server` serves `/dist/demo.min.css` uncompressed
(392 kB raw vs 62 kB gzip / 47 kB brotli on Pages), so local FCP carries a ~3 s penalty and
perf scores read 56–86. The deployed numbers are the real ones — re-measure on
**browser-style-v4.pages.dev** after push (playbook § Measuring: median of 3).

## Still open

- media.video stays video-bound: 14 autoplay `<video>` are the page's *content* — each fetches
  its mp4 at load regardless of `preload`. Score on this page measures the demo's nature.
- video.render preview thumbs (`youtube-data/`, `vimeo-data/` page-relative) are now correctly
  left untransformed; root-relativizing those data paths would let them on the CDN too.
- cards.html still pulls ~2 MB of full-size images from `https://browser.style` (v1 host,
  external → untransformable). Swap to local `/assets` copies if the weight matters.
- Native `::scroll-marker` dot hit-size (Chromium path) — axe can't see pseudos; not audited.
- Contrast overrides remain page-scoped — the global `tokens.css` retune is still the real fix.
