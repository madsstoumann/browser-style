# schema.html performance pass — 2026-08-12

> What was done to take `ui/card/demo/schema.html` from Lighthouse **69 / 50.4 MB / LCP 119 s**
> (simulated mobile) to **97–98 / ~1 MB / LCP ~2.4 s**, accessibility from **95 → 100**, and what
> was learned about the hosting stack on the way. Numbers below are Lighthouse 12.x mobile
> emulation unless marked otherwise. Companion docs: `ui/card/docs/media.md` § Responsive images
> (the srcset contract), `ui/card/docs/schema.md` (the page's type-by-type notes),
> `layout/docs/card-integration.md` Phase 3 (the sizes bridge).

## Starting point

37 distinct images, all full-size PNG/JPEG originals (avg 1.45 MB, `movie_01.png` 2.5 MB,
`summer.jpg` 4405×6607 px), all loading eagerly into ~500 px card cells. 17 stylesheet links
fanning out to 41 requests / ~117 kB gzip. Everything served `cache-control: max-age=0`.

## The image pipeline (the big win)

- **Cloudflare Image transformations, SSR'd into the markup.** Every local `<img>` carries a
  five-width srcset (`240/320/480/720/1200`) of `/cdn-cgi/image/format=auto,quality=80,fit=cover`
  URLs with `asr()`-derived heights. `format=auto` lets Cloudflare negotiate AVIF/WebP per request
  (verified: 1.9 MB PNG → 11.9 kB AVIF at 400 w). Fixed-size images (48 px comparison thumbs,
  64 px avatars) use square 1x/2x pairs instead of a width ladder.
- **`sizes`**: lazy images get `auto, (min-width: 540px) min(50vw, 512px), 100vw` — Chromium and
  Firefox use the real layout width (`auto`, also what makes the lightbox re-fetch hi-res
  candidates), Safari uses the fallback list. The one eager image gets the list **without**
  `auto` (spec-invalid on eager). The fallback list comes from layout's
  `generateSrcsets`/`calculateSizes` (whose final entry was fixed to `100vw` — it used to repeat
  the largest breakpoint's fraction, under-requesting 2× below the smallest breakpoint).
- **Priority**: exactly one `loading="eager" fetchpriority="high"` image (the LCP candidate,
  first card); everything else `loading="lazy" decoding="async"`. The `load(eager)` media token
  marks the card for JS-path parity.
- **The same output is SSR-able**: `renderCard(ucf, presets, cards, { images: { cdnBase, sizes, … } })`
  emits identical attributes; no options → byte-identical legacy output. `demo/render.html` shows
  the wiring. The runtime `ui-media-srcset.js` upgrader stays only for pages without SSR markup.

### Hosting gotchas that cost real debugging time

- **`/cdn-cgi/image/` only resolves on the zone** — 200 on `v4.browser.style`, 404 on
  `*.pages.dev` and localhost — and a failed srcset candidate does **not** fall back to `src`.
  Hence absolute `https://v4.browser.style/…` srcset URLs in the demo markup, and a configurable
  `cdnBase` in the renderer. Sweep these when v4 moves to the apex domain.
- **Hotlink Protection 403s any cross-origin Referer** (pages.dev, localhost) on the same zone.
  Fixed with `<meta name="referrer" content="no-referrer">` — verified: no-referrer 200,
  cross-origin referer 403. Without this, every image broke off-zone *and the first Lighthouse
  run scored 97 against 403 stubs* — always check `naturalWidth`/4xx counts, not just scores.
- **Cloudflare bot features are injected into zone-served HTML**: an AI-Labyrinth honeypot link
  plus the `challenge-platform/jsd` script (iframe). Measured cost on `v4.browser.style` vs the
  identical page on pages.dev: **~90–130 ms TBT, +0.3 s FCP, score 89–94 vs 96–97**. PSI (Google
  datacenter hardware) sits another 10–20 points below a local M-series run — a PSI 75 on the
  custom domain decomposes into bot-JS + slower lab hardware, not page regressions.

## CSS: one bundle

17 `<link>`s → one `/dist/demo.min.css` (~60 kB gzip / 47 kB brotli vs ~117 kB gzip across 41
requests), built from the `ui/card/components.md` inventory by `npm run build:demo-css`
(`scripts/css-bundle.js` with the repo root as package dir, so the peer-exclusivity gate holds
for real packages; root-absolute `/assets/*` urls are marked external — site references, not
bundle inputs). Also killed the one duplicate: `ui-accordion.css` @imports `icon/index.css`,
which the page also linked (9.5 kB parsed twice); esbuild dedupes it.

## Caching (`_headers`, Cloudflare Pages only)

`/assets/*` → `max-age=31536000, immutable`; `/dist/*` → `max-age=86400,
stale-while-revalidate=604800`. Default Pages caching is `max-age=0, must-revalidate` for
everything. Note `/ui/*` (e.g. the render-blocking polyfill) still has no TTL — a measured
576 ms blocking re-fetch per visit on Slow 4G; add a rule when the churn settles.

## JavaScript

- **`attr-fallback.js` forced reflow killed**: the typed-`attr()` probe (append div +
  `getComputedStyle`) ran from a render-blocking script after DOM parse, forcing a
  full-document style pass — 618 ms throttled / 106 ms unthrottled. Replaced with
  `CSS.supports('background-color', 'attr(x type(<color>), red)')` — parser-level, no DOM, and
  the same expression the components' `@supports` fallback blocks gate on, so the CSS and JS
  layers flip together. (Detecting on a *custom* property is the trap: `CSS.supports('--x', …)`
  is true even in Safari.)
- **`video.js` → `video.min.js`**: the source module imports `shared.js`, a sequential
  discovery chain (937 ms critical-path). The esbuild bundle is one request.

## Resource hints

- `<link rel="preconnect" href="https://v4.browser.style">` — the srcset origin's DNS+TLS runs
  parallel with the CSS download (~3 RTTs off the eager image's start on pages.dev/localhost;
  same-origin no-op on the zone).
- Speculation rules (`prerender`, `eagerness: moderate`) for `articles/article.html` +
  `articles/news.html` — hover prerenders the morph target, so the cross-document view
  transition navigates instantly. Chromium-only, inert elsewhere.
- Deliberately **not** added (all measured ≥0 ms): preload for the CSS/polyfill (already the
  first two requests), preload for the LCP image (already `fetchpriority=high` + early in the
  scanner), `modulepreload` for the non-critical video polyfill.

## Accessibility (95 → 100, 97 contrast nodes → 0)

Page-scoped `<style>` block in schema.html retunes six tokens — values to port into
`ui/base/tokens.css` / `content.typography.css` in a proper design-system pass:

| Token | Old (light arm) | Page override |
|---|---|---|
| `--color-link` | 73% lightness (2.53:1) | `light-dark(hsl(221,100%,44%), hsl(221,70%,70%))` |
| `--color-accent` | 50% (3.97 text / 3.5 button) | `light-dark(hsl(211,100%,38%), hsl(211,70%,72%))` |
| `--color-success` | 41% (3.01 pale chip) | `light-dark(hsl(136,45%,30%), hsl(136,25%,60%))` |
| `--color-error` | 46%/56% (4.25/4.24) | `light-dark(hsl(360,65%,41%), hsl(360,45%,62%))` |
| `--color-text-muted` | 60% (2.84) | `light-dark(hsl(0,0%,42%), hsl(0,0%,65%))` |
| `--ui-content-muted` | 65% alpha mix | 85% mix |

Pale chips inherit the raw hue token as ink (theme.css pale chain), so darkening one hue fixes
pale ink and white-on-solid together. The worst failures (#a3a3a3, 2.52:1) came from **muted
compounding** — dateline re-applies the alpha mix inside an already-muted byline (0.65² ≈ 0.42);
the 85% mix survives one compounding step, but the real fix is stopping the double application
in `content.css`. Structural: `<main data-layout-root>` landmark (row-gap needs the direct
parent), and the cart button's visible text made a contiguous part of its `aria-label`.

## Still open

- Port the contrast values into the global tokens; fix muted compounding in `content.css`.
- `_headers` TTL for `/ui/*` (576 ms render-blocking polyfill re-fetch).
- `content-visibility: auto` on below-fold content — the throttled trace shows a 420 ms
  whole-page layout of 923 nodes (1,512-element DOM); this is the biggest remaining mobile
  lever. Needs care around the `rel=expect` morph target and container queries.
- Mobile picks 1200 w candidates at DPR 2.625 (~123 kB over the DPR-2 convention) — cap via
  `sizes` if it ever matters.
- Zone decision: exempt the demo host from JS detections / AI Labyrinth, or accept ~5 pts.
- Per-width format/quality ladder (feature-gap #1) and `width`/`height` on frame images
  (needs UCF model fields) — tracked in `docs/plans/2026-08-10-card-feature-gaps.md`.
