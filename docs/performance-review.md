# schema.html — performance review, 2026-08-18

> Mobile Lighthouse drifted 99 → 97 over six days of feature commits. This is what was measured,
> what is actually left on the table, and the plan for the three items worth fixing.
> Companion docs: `docs/schema-demo-performance.md` (the 2026-08-12 pass, 69 → 98),
> `docs/performance-handover.md` (the reusable process), `docs/gpu-performance.md`.

---

## Baseline

All figures verified against the deployed `browser-style-v4.pages.dev` with `curl`, not estimated.

| Asset | On the wire | Note |
|---|---|---|
| `/dist/demo.4e89c82e.min.css` | **64,028 B** | brotli — but Cloudflare's *on-the-fly q4*. Local q11 of the same bytes = **50,082 B** |
| `/ui/base/polyfills/attr-fallback.min.js` | 1,265 B | render-blocking, **480 ms** in the posted run; a no-op in Chrome (`CSS.supports` returns early) |
| `schema.html` | 32,317 B | 215 KB raw, 2,482 elements, 608 of them `<meta>` |
| LCP image, 1200w rung | 64,217 B | `quality=80`; slot is ~665–760 device px |

Bundle growth since it was created on 2026-08-12: **386,947 → 405,748 min bytes (+4.9%)**, driven
by new leaf packages (`ui/button-group` +1,405, a new `ui/breadcrumbs` `@import` +1,067) and
card/layout features — not by `ui/base`, whose net diff over the same window is a few hundred bytes.

---

## What is actually left

Three levers, none of which touch a stylesheet:

1. **Brotli quality** — a flat −14 KB (−22%) on the render-blocking CSS for zero CSS change.
2. **The polyfill round trip** — an entire render-blocking request that buys nothing in Chrome.
3. **Per-width image quality ladder** — −19 KB on the LCP image and ~30% off all 69 srcset
   images on the page. This is documented feature-gap #1
   (`docs/plans/2026-08-10-card-feature-gaps.md`).

### Investigated and deliberately not pursued

- **CSS splitting.** The bundle is one immutable artifact shared by 29 demo pages. schema.html
  provably does not use 12 of its 48 sections (`animate`, `easings`, `stagger`, `tint`, `marquee`,
  `timeline`, `highlight`, `button-group`, `lightbox`, `progress`, `breadcrumbs`,
  `media.lightbox` — verified by markup grep: zero `animate=`, `stagger`, `easing=` attributes,
  zero `<ui-marquee>` etc.), and it uses `layout.css` for exactly **four tokens**
  (`md="columns(2)"`, `md="items(start)"`, `xs="cg(3xs)"`, `xs="rg(3xs)"`) against a 68 KB
  generated variant matrix. Simulated at real brotli on the bundle: 70,449 → **58,588** dropping
  the unused sections, → **51,943** also dropping layout. Deliberate call: the shared cached
  bundle is worth more than a ~16 KB one-page win.
- **DOM size.** 2,482 elements, a quarter of them `<meta itemprop>`. The microdata *is* the demo.
  Already mitigated by the page-scoped `content-visibility: auto` block (layout 550 → 132 ms).
- **`rel="expect"`.** Verified correct, not a regression: `#schema-product-variants` sits at byte
  22,340 (10.4% of the document) and is the *deepest* cross-document morph target — the
  `products/silk-gown-*.html` pages morph to it. Only its comment is stale (it says "the morphing
  article card").
- **Stale memory note.** *"Pages loading both base + layout.css ship carousel/animations/
  stagger.css twice (~13 KB gzip)"* is **wrong**. `layout/dist/layout.css` contains one
  `@keyframes` and zero stagger rules; the engine moved to `ui/base` in `9e142765` (2026-07-17),
  before the demo bundle existed, and esbuild dedupes `shapes-glyphs.css` / `icon/index.css`
  within the bundle. The real redundancy on any page is *unused* CSS, not duplicated CSS.

---

## 1. Serve the CSS at brotli q11 via a Pages Function — ❌ TRIED, DOES NOT WORK

> **Attempted 2026-08-18 and reverted (`50483ba7`, reverted by `4c9bd070`). Do not retry.**
>
> Cloudflare **normalises `Accept-Encoding` before the Worker sees it.** Measured on
> `wrangler pages dev` with a Function that echoed the header back:
>
> ```
> sent identity                 -> worker saw: [br, gzip]
> sent gzip                     -> worker saw: [br, gzip]
> sent gzip, deflate, br, zstd  -> worker saw: [br, gzip]
> ```
>
> So the `accept-encoding.includes('br')` guard below is **always true** and the Function
> serves the precompressed body to every client. For a br-capable browser the edge keeps
> `content-encoding: br` and it works; for anything else the edge strips the header but not
> the compression, so the client receives brotli bytes labelled `text/css` and renders an
> unstyled page. Verified live: `Accept-Encoding: identity` returned 50,090 B byte-identical
> to the `.br` sibling.
>
> A Function cannot recover the client's real `Accept-Encoding`, so it can never decide
> safely whether to serve a precompressed body. The `vary: accept-encoding` mitigation does
> not help — the wrong body has already been chosen.
>
> Two testing traps this cost, worth remembering: **`curl -I` sends HEAD**, which
> `onRequestGet` does not handle, so every header check silently bypassed the Function and
> measured the static asset instead; and **`curl --raw`** leaves chunked-transfer framing in
> the body, which then fails to brotli-decode and looks like corruption that is not there.
>
> Ruled out along the way: Pages does **not** auto-serve `.br` siblings. With the sibling
> present and the Function removed, `identity` correctly returns the full 405,998 B stylesheet.
>
> The 14 kB is real but not reachable this way. Go after § 3 instead — it is a bigger number
> (−19 kB on the LCP image alone) and it is entirely ours to control.

<details>
<summary>Original plan, kept for the record</summary>


Cloudflare Pages compresses dynamically at ~q4. Verified: the deployed response is 64,028 B;
locally `brotli -q 4` gives 64,097 and `brotli -q 11` gives 50,082. Precompressing is the whole
win — the CSS itself does not change a byte.

**Build side** — `scripts/hash-asset.js` already owns the hashed name and already deletes previous
builds; extend it to emit and clean the sibling. Reuse the `brotliCompressSync` +
`BROTLI_PARAM_QUALITY: 11` idiom already in `scripts/css-bundle.js` (its `brotli()` helper, used
today only for the console report — lift it to a shared export rather than re-writing it).

- write `dist/demo.<hash>.min.css.br` next to the hashed CSS
- delete stale `*.br` alongside the stale `*.min.css` in the existing cleanup pass
- fix the drifted comment at the top of `hash-asset.js` — it still claims
  `max-age=86400, stale-while-revalidate=604800`, but `_headers` says `max-age=31536000, immutable`

**Serve side** — new `functions/dist/[[path]].js` (first Pages Function in this repo):

```js
export async function onRequestGet({ request, env, next }) {
  const url = new URL(request.url);
  if (!/\.(css|js)$/.test(url.pathname)) return next();
  if (!(request.headers.get('accept-encoding') || '').includes('br')) return next();
  const pre = await env.ASSETS.fetch(new URL(url.pathname + '.br', url.origin));
  if (!pre.ok) return next();
  const headers = new Headers(pre.headers);
  headers.set('content-encoding', 'br');
  headers.set('content-type', url.pathname.endsWith('.css')
    ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8');
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('vary', 'accept-encoding');
  return new Response(pre.body, { status: 200, headers });
}
```

Any client without `br` falls through to `next()` and the normal static asset — no garbage-bytes
risk. Two things `_headers` cannot do here, so the Function must: `_headers` does **not** apply to
Function responses (hence the explicit `cache-control`), and `vary` must be set so a non-`br`
client is never served a cached `br` body.

**Must be verified after deploy, not assumed:**

- `curl -sI -H 'Accept-Encoding: br'` → `content-encoding: br`, body ≈ 50 KB
- `curl -sI -H 'Accept-Encoding: identity'` → no `content-encoding`, valid CSS
- `cf-cache-status` reaches `HIT` on a second request. A Function response that is not edge-cached
  would trade 14 KB for an invocation on every load — a bad trade, and the fallback is then the
  `_headers` `.br`-direct-link approach
- the page still renders (double-encoding fails silently: the browser just shows unstyled HTML)

</details>

## 2. Inline the typed-`attr()` polyfill

`attr-fallback.min.js` is loaded `type="module" blocking="render"` and is **load-bearing** — the
cross-document view transition snapshots the incoming page at first paint, so it cannot be
deferred (`ui/base/polyfills/readme.md`). But in Chrome `isTypedAttrSupported()` returns true and
it does nothing: the page pays a full render-blocking round trip (480 ms in the posted run) for a
no-op. It also sits under `/ui/*`, which has no cache TTL, so it re-fetches every visit.

Inlining removes the request entirely and keeps the before-first-paint guarantee — a classic
inline script in `<head>` executes at parse time by definition.

- add an esbuild IIFE build alongside the existing minified one: `attr-fallback.iife.min.js`
  (~3 KB raw, ~1.2 KB compressed inside the HTML). IIFE is required because the source ends in
  `export { apply, isTypedAttrSupported }`
- inject between markers. `ui/card/demo/build.shared.js` (`HEAD_COMMON`) covers the generated
  pages; `schema.html` is hand-authored, so add a small `scripts/inline-polyfill.js` that rewrites
  everything between `<!-- polyfill:start -->` / `<!-- polyfill:end -->` across the page list, and
  chain it into `build:demo-css` so it can never drift from the source
- keep the standalone `.min.js` — it is the documented public entry for consumers

Net on this page: one fewer render-blocking request, +1.2 KB on a 32 KB HTML document.

## 3. Per-width image quality ladder

Every rung is `quality=80` today. Measured on the LCP image (`popovers.png`, live zone):

| width | q80 | q70 | q60 | q50 |
|---|---|---|---|---|
| 480 | 15,459 | 12,850 | 11,103 | 9,233 |
| 720 | 26,785 | 22,634 | 19,004 | 15,683 |
| 1200 | **64,217** | 53,396 | **44,788** | 36,980 |

Wide rungs are only ever chosen by high-DPR devices, where each stored pixel covers less physical
area and compression artefacts are correspondingly less visible — so quality can fall as width
rises with no perceived loss. Proposed ladder (tune against the verification screenshots):

```
240 → 80   320 → 80   480 → 76   720 → 68   1200 → 60
```

LCP image: 64,217 → 44,788 B (**−19 KB, −30%**), and the same cut lands on all 69 srcset images
on the page.

**Single choke point**: `buildSrcset()` in `ui/card/srcset.js` already maps over rungs and calls
`buildCfUrl(src, { format, quality, fit, width })`. Widen `quality` from a number to
`number | Record<number, number> | (width) => number`, resolve per rung, keep a plain number
working unchanged. Then thread the default through the three producers:

- `ui/card/render.js:262` — `IMG_DEFAULTS.quality`
- `ui/card/ui-media-srcset.js:25,124` — `DEFAULTS.quality` and the `quality` attribute read
  (a scalar attribute value must keep overriding the ladder)
- `ui/card/render.test.js` — update expectations

**Sweep the existing markup.** 321 `cdn-cgi/image` URLs in `schema.html` alone, ~38 HTML files in
total. Every URL already carries its own `width=N`, so rewriting `quality=80` → the ladder value
for that rung is deterministic. Two classes of file:

- hand-authored (`ui/card/demo/*.html`, `products/`, `realestate/`, `rentals/`) → sweep in place
- generated (`ui/card/demo/articles/*.html` via `articles/build.js`, `content/card/dist/*.html`)
  → **regenerate from the builder**, never hand-patch (`docs/performance-handover.md` § 0.2)

Leave the fixed-size 1x/2x pairs (48 px comparison thumbs, 64 px avatars) at q80 — the ladder is a
DPR-compensation argument and does not apply below 480w.

Out of scope: the second Lighthouse image finding (`assets.stoumann.dk/img/avatar2.webp`, 205×205
served for an 80×80 slot, 4.3 KiB). Cross-origin, no transform in front of it. Noted, not fixed.

## 4. Cache TTL for `/ui/*`

Still the open item from `docs/schema-demo-performance.md`. After §2 the only unhashed
render-path file left is `ui/card/video.min.js`. These names are unhashed, so `immutable` is
unsafe — add to `_headers`:

```
/ui/*
  Cache-Control: public, max-age=600, stale-while-revalidate=86400
```

Repeat-visit only; it will not move a cold Lighthouse run. Cheap, and it closes a documented gap.

## 5. Attribute the 55 ms forced reflow

Lighthouse reports it as `[unattributed]`. Prime suspect is `ui/card/video.min.js` upgrading
custom elements at end-of-body. Trace it rather than guess: `performance_start_trace`
(`reload: true`) → `performance_analyze_insight ForcedReflow` with the script attributed. If it is
a geometry read in a `connectedCallback`, batch the read before the writes. If it turns out to be
unavoidable custom-element upgrade cost, record that and stop.

---

## Verification

Follow `docs/performance-handover.md` § 2. Order matters — deploy is where §1 becomes testable.

1. **Ground truth before scores.** After the image sweep, in the page:
   `[...document.images].filter(i => !i.naturalWidth).length` must be `0`, and the Lighthouse
   network log must contain zero 4xx. A page of broken images scores *higher* — this trap has
   already cost this repo a false 97.
2. **Header checks** (§1 list) on `browser-style-v4.pages.dev` after the Pages deploy (~1 min
   after push to `v4`).
3. **Visual regression on the quality ladder** — `take_screenshot` at
   `viewport: "412x915x2.625,mobile,touch"` before/after on the LCP card and one photographic card
   (`quantum.png`, `summer.jpg`). Artefacts at q60 show up on *photos*, not on the abstract LCP
   illustration. Back the ladder off if visible.
4. **Console** — `list_console_messages` types `["error","warn"]` empty, on `schema.html` *and* its
   render-driven twin `render.html`.
5. **Repo gates** — `node ui/card/render.snapshot.js . /tmp/ssr-after.txt` + `cmp` against a
   before-file (diffs must be exactly the `quality=` blocks); `node ui/card/tokens.build.js &&
   node ui/card/tokens.lint.js`; `npm test` for `ui/card/render.test.js`.
6. **Score** — Lighthouse mobile, **median of 3**, on `browser-style-v4.pages.dev` (the clean host;
   the zone adds ~5 pts of bot-defense tax that is not ours). Single runs swing ±3–5. Target: the
   "Render-blocking requests" audit loses the polyfill row and drops the CSS row to ~49 KiB;
   "Improve image delivery" drops ~19 KiB on the LCP row.
7. **Record it** — append the measured numbers to `docs/schema-demo-performance.md`, and strike the
   `/ui/*` TTL and per-width quality ladder items from its "Still open" list.
