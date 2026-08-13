# Performance pass — handover playbook

> How to run the optimization pass from the 2026-08-12 session (schema.html: Lighthouse 69 → 98,
> a11y 95 → 100) against **any other page in this repo**. The what-happened record with all
> measured numbers is `docs/schema-demo-performance.md`; this file is the reusable process.
> Per-animation CPU price tags: `docs/gpu-performance.md`. Responsive-image contract:
> `ui/card/docs/media.md` § Responsive images.

---

## 0. Before touching anything

1. Read `docs/session-start.md` (repo gates) and this file.
2. **Check whether the target page is generated.** `ui/card/demo/articles/*.html` and
   `article.render.html` come from `ui/card/demo/articles/build.js`; `layout/dist/*` from
   layout's builders. Hand-editing a build artifact = clobbered on rebuild. Fix the generator,
   regenerate.
3. **Know the two hosts.** `v4` branch auto-deploys to Cloudflare Pages within ~1 min of push:
   `v4.browser.style` (custom domain, on the browser.style zone) and
   `browser-style-v4.pages.dev`. Same files, different behavior:
   - `/cdn-cgi/image/` transforms: **work on v4.browser.style only** (404 on pages.dev + localhost).
   - `_headers` honored on both; GitHub Pages (main branch) ignores it.
   - The zone injects bot-defense into HTML (AI-Labyrinth honeypot link + `challenge-platform/jsd`
     script): measured ~90–130 ms TBT + ~0.3 s FCP, ~5 pts. pages.dev is the page's clean score;
     the custom domain includes the bot tax. Don't chase that delta in page code.
4. **Baseline before editing**: 3 Lighthouse runs per host (see § Measuring), and
   `node ui/card/render.snapshot.js . /tmp/ssr-before.txt` if `render.js` might be touched.

## 1. The optimization checklist (in impact order)

### Images (usually the whole problem)
- Originals in `/assets/images/` are full-size PNG/JPEG (avg ~1.4 MB). Any page using them raw
  is broken by default.
- **srcset via Cloudflare transforms**, widths `240/320/480/720/1200`, `format=auto` (Accept-
  negotiated AVIF/WebP), `quality=80`, `fit=cover` + height from the `asr()` ratio. Two paths:
  - SSR / hand markup: absolute `https://v4.browser.style/cdn-cgi/image/…` URLs (root-relative
    404s off-zone **and a failed srcset candidate never falls back to `src`**).
  - `renderCard(ucf, presets, cards, { images: { cdnBase, sizes, … } })` emits the same; no
    options = byte-identical legacy output. Avatars/thumbs get square `1x/2x` pairs.
- **sizes**: compute the fallback list from the layout (`generateSrcsets`/`calculateSizes` from
  `/layout/src/srcsets.js` + `/layout/layouts-map.js` — e.g. `md="columns(2)"` →
  `(min-width: 540px) min(50vw, 512px), 100vw`). Lazy imgs get `auto, ` prefixed (Chromium/FF use
  real layout width; Safari takes the list). **`auto` is spec-invalid on eager images** — eager
  gets the list alone.
- **Priority**: exactly ONE `loading="eager" fetchpriority="high"` — the LCP candidate. All else
  `loading="lazy" decoding="async"`. Never lazy a view-transition morph hero.
- The `<meta name="referrer" content="no-referrer">` in the page head is load-bearing: the zone's
  **Hotlink Protection 403s any cross-origin Referer** (pages.dev, localhost). Verified:
  no-referrer 200, cross-origin referer 403.

### CSS
- Multi-`<link>` demo pages → one `<link href="/dist/demo.min.css">` (~60 kB gzip, built from the
  `ui/card/components.md` inventory). Rebuild after ANY component CSS change:
  `npm run build:demo-css`. Per-package `dist/` bundles and the peer-exclusivity gate in
  `scripts/css-bundle.js` stay untouched (repo root as pkgDir passes the gate legitimately).
- The bundle covers all card-demo packages — pages outside that inventory keep per-package links.

### JavaScript
- Load `*.min.js` bundles, not sources: `video.js` imports `shared.js` = a sequential discovery
  chain (~940 ms critical path); `video.min.js` is one request.
- **Never probe features via DOM + `getComputedStyle` in a render-blocking script** — it forces a
  full-document style pass (measured 618 ms). Parser-level `CSS.supports('background-color',
  'attr(x type(<color>), red)')` on a REAL property (custom-property form is true even where
  unsupported). `attr-fallback.js` is the reference fix.
- Render-blocking `<link rel="expect">` + `attr-fallback.js` are load-bearing for view-transition
  morphs — do not defer them; the W3C validator's complaint about `rel="expect"` +
  `blocking="render"` is a stale rule (spec: whatwg/html #9970).

### Caching (`_headers`, repo root)
- `/assets/*` → `max-age=31536000, immutable`; `/dist/*` → `max-age=86400,
  stale-while-revalidate=604800`. Everything else is Pages default `max-age=0`.
- Gap to close when touching this: `/ui/*` has no rule — the render-blocking polyfill re-fetches
  every visit (576 ms on Slow 4G).

### Resource hints (measure first — most preloads are 0 ms here)
- `preconnect` to `https://v4.browser.style` when the page uses absolute CDN srcset — handshake
  parallel to CSS (~3 RTTs off the eager image on off-zone hosts).
- Speculation rules (`prerender`, `eagerness: moderate`) for morph-target pages — instant
  cross-document view transitions. Chromium-only, inert elsewhere.
- Do NOT add: preload for head CSS/scripts (already first requests — RenderBlocking insight shows
  0 ms), preload for a `fetchpriority=high` LCP image, `modulepreload` for end-of-body polyfills.

### Always-running animations
- Check the price list in `docs/gpu-performance.md` before using any. The ladder that matters:
  custom-property clocks driving layout props (`beacon-slide`, ~87 ms/2.5 s idle) ≫ paint props
  (`beacon-dots` 37, `background-position` hops 8) ≫ composited `transform`/`opacity`
  (`beacon-blink` 10). Cost scales linearly with instance count; off-screen instances still pay
  style+layout. `beacon(ldr)` exists as the ticker's cheap static twin.
- PSI's "non-composited animations" diagnostic is the tell.

### Accessibility side-pass (Lighthouse a11y category)
- Contrast: page-scoped unlayered `<style>` overrides beat the `bs-core` layer — see the token
  table in `docs/schema-demo-performance.md` (values pending the global `tokens.css` retune).
  Traps found: muted **compounding** (alpha mix applied inside an already-muted ancestor),
  pale-chip ink = the raw hue token, theme relays handing chips low-contrast plates.
- Structure: one `<main>` landmark (`data-layout-root` on it if sections need row-gap), heading
  order (cards emit `h2` via preset `headingTag`), visible button text contained in `aria-label`.

## 2. Measuring

### chrome-devtools MCP (the interactive loop)
Configured via `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest`. Workflow:

1. `navigate_page` → target URL.
2. Mobile conditions: `emulate` with `viewport: "412x915x2.625,mobile,touch"`,
   `cpuThrottlingRate: 4`, `networkConditions: "Slow 4G"`. Reset with rate 1 / omit.
3. `performance_start_trace` (`reload: true, autoStop: true`) → summary lists insight sets,
   LCP breakdown, CLS.
4. `performance_analyze_insight` per finding: `LCPBreakdown`, `RenderBlocking`, `ForcedReflow`,
   `ImageDelivery`, `NetworkDependencyTree`, `DOMSize`, `Cache`.
5. `list_network_requests` / `get_network_request` for per-request headers and timing;
   `list_console_messages` (types `["error","warn"]`) after every change;
   `evaluate_script` for ground truth (see verification below); `take_screenshot` for visuals.

### Lighthouse CLI (scoring)
```bash
npx -y lighthouse "<url>" --quiet --only-categories=performance \
  --output=json --output-path=./lh.json --chrome-flags="--headless=new"
```
- Default = mobile emulation + throttling. Parse `categories`, `audits`, `network-requests`.
- **Median of 3** — single runs swing ±3–5 pts; don't chase one-run deltas. Local M-series runs
  ~10–20 pts above PSI (Google datacenter hardware) on the same URL.
- PSI API: anonymous quota exhausts fast; use a free API key or the local CLI.

### Ground truth beats scores
- **Check `naturalWidth > 0` / 4xx counts, not `currentSrc`** — `currentSrc` is set even when the
  candidate 403s, and a page full of broken images can SCORE HIGHER (nothing to download).
  A 97 was once measured against 403 stubs.
- `curl -sI` the actual URLs from the markup: `cf-resized` header proves the transform ran;
  `cache-control` proves `_headers` deployed; test with/without `Referer` and browser/bot UAs
  when hunting 403s (hotlink protection and bot rules are header-dependent).

## 3. Repo-specific gotchas (each cost real time once)

- **Fresh port per CSS change** when serving with `python3 -m http.server` — Chromium serves
  stale `@import`ed sheets even after reload (documented in `docs/session-start.md`).
- `playwright-core` is NOT installed on this machine — use the chrome-devtools MCP (or Playwright
  MCP) tools, not node scripts.
- After editing any component CSS that's in the demo bundle: `npm run build:demo-css`, or the
  page keeps the old styles.
- After editing `render.js` / presets / data: snapshot gate
  (`node ui/card/render.snapshot.js . /tmp/after.txt` + `cmp` against the before file — diffs
  must be exactly the intended blocks) and tokens gates
  (`node ui/card/tokens.build.js && node ui/card/tokens.lint.js`, build run twice = idempotent).
- Renderer parity: `demo/schema.html` is hand-authored reference markup; `renderCard` must be able
  to reproduce it (compare media token sets + furniture per itemtype in the browser). New page
  affordances (type chips, beacons) need BOTH sides: markup and renderer/data.
- The srcset `sizes` math lives in layout: `calculateSizes` final fallback must stay `100vw`.
- JSON edits: surgical `Edit`s, not `json.dumps` rewrites (reformats the whole file, drowns review).
- The user reviews before committing — leave changes in the working tree unless told otherwise.

## 4. Definition of done (per page)

1. Lighthouse perf ≥ high 90s AND a11y 100 on **pages.dev** (clean host), 3-run median.
2. Zero 4xx in the Lighthouse network log; LCP image `naturalWidth > 0` from localhost.
3. Zero console errors/warnings on the page and its render-driven twin.
4. Snapshot + tokens gates clean; demo bundle rebuilt if component CSS changed.
5. Generated pages regenerated from their builder, not hand-patched.
6. Findings + numbers appended to `docs/schema-demo-performance.md` (or a sibling record doc).
