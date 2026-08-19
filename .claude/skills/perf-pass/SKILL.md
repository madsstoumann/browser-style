---
name: perf-pass
description: Use when auditing or improving page performance in this repo — a low Lighthouse or PageSpeed score, poor LCP/INP/CLS, heavy images, render-blocking resources, always-running animations, or a final check before shipping a new demo page.
argument-hint: <page path or URL>
allowed-tools: Read, Edit, Bash, Glob, Grep, AskUserQuestion
---

# Running a performance pass

Policy — which properties composite, the `will-change` rules, the measured cost of every
always-running animation, the responsive-image contract, the caching contract — lives in
**`docs/performance.md`**. Read it before touching an animation or a header. This skill is
the *procedure*.

## 0. Before touching anything

1. **Is the page generated?** `ui/card/demo/articles/*.html`, `products/`, `realestate/`,
   `rentals/` come from their own `build.js`; `layout/dist/*` from layout's builders.
   Hand-editing a build artifact is clobbered on the next run — fix the generator and
   regenerate.
2. **Know the two hosts.** The `v4` branch auto-deploys to Cloudflare Pages: `v4.browser.style`
   (custom domain, on the browser.style zone) and `browser-style-v4.pages.dev`. Same files,
   different behaviour — `/cdn-cgi/image/` transforms work on the **custom domain only**
   (404 on pages.dev and localhost), and the zone injects bot-defense into HTML worth
   ~90–130 ms TBT and ~5 points. **pages.dev is the page's clean score**; do not chase the
   zone delta in page code.
3. **Baseline first — always.** 3 Lighthouse runs on the clean host, plus
   `node ui/card/render.snapshot.js . /tmp/ssr-before.txt` if `render.js` may be touched.
   A change without a before-number is not an optimisation, it is a guess.

## 1. Work the checklist in impact order

**Images — usually the entire problem.** Originals in `/assets/images/` average ~1.4 MB;
any page using them raw is broken by default. Use the srcset contract in
`docs/performance.md`: Cloudflare transforms, widths 240/320/480/720/1200, `format=auto`,
`quality=80`, `fit=cover` with the height from the `asr()` ratio, absolute
`https://v4.browser.style/cdn-cgi/image/…` URLs (a root-relative candidate 404s off-zone,
**and a failed srcset candidate never falls back to `src`**). Compute `sizes` from the
layout with `calculateSizes`/`generateSrcsets`. Exactly **one** `loading="eager"
fetchpriority="high"` image — the LCP candidate; everything else `lazy` + `decoding="async"`.
Never lazy a view-transition morph hero. Lazy images get `auto, ` prefixed to the sizes list;
eager images must not (`auto` is spec-invalid there).

**CSS** — demo pages link one bundle; rebuild it after any component CSS change (see the
`demo-css` skill). Per-package bundles and the peer-exclusivity gate stay untouched.

**JavaScript** — load `*.min.js`, not sources (an import chain is sequential discovery).
**Never probe features with DOM + `getComputedStyle` in a render-blocking script** — it
forces a full-document style pass (measured 618 ms). Use parser-level
`CSS.supports('background-color', 'attr(x type(<color>), red)')` on a **real** property;
the custom-property form returns true even where unsupported. An **inline classic script goes
above the stylesheet `<link>`, never below** — a parser-inserted classic script is blocked by
every stylesheet before it, and blocks the parser in turn, so CSS and HTML parsing serialise
instead of overlapping. Render-blocking `<link rel="expect">` and the attr polyfill are
load-bearing for view-transition morphs — do not defer them.

**Caching** — `_headers` at the repo root; the hashed-bundle contract is in
`docs/performance.md` and the `demo-css` skill.

**Resource hints — measure first; most preloads are 0 ms here.** `preconnect` to the CDN
origin when the page uses absolute transform URLs; speculation rules for morph targets —
`eagerness: moderate` caps at **two** concurrent prerenders (FIFO), so a third URL silently
evicts the oldest. Do **not** add preloads for head CSS/scripts (already the first requests),
for a `fetchpriority=high` LCP image, or `modulepreload` for end-of-body polyfills.

**Animations** — check the price list in `docs/performance.md` first. Custom-property clocks
driving layout properties cost an order of magnitude more than composited
`transform`/`opacity`, cost scales with instance count, and off-screen instances still pay
style and layout. PSI's "non-composited animations" diagnostic is the tell.

**Accessibility side-pass** — contrast (watch for muted *compounding*: an alpha mix applied
inside an already-muted ancestor), one `<main>` landmark, heading order, visible button text
contained in its `aria-label`.

## 2. Measuring

Interactive loop — chrome-devtools MCP: `navigate_page`, then `emulate` with
`viewport: "412x915x2.625,mobile,touch"`, `cpuThrottlingRate: 4`,
`networkConditions: "Slow 4G"`; `performance_start_trace` (`reload: true, autoStop: true`);
then `performance_analyze_insight` per finding (`LCPBreakdown`, `RenderBlocking`,
`ForcedReflow`, `ImageDelivery`, `NetworkDependencyTree`, `DOMSize`, `Cache`).
`list_network_requests` for headers and timing, `list_console_messages` after every change.

Scoring — Lighthouse CLI:

```bash
npx -y lighthouse "<url>" --quiet --only-categories=performance \
  --output=json --output-path=./lh.json --chrome-flags="--headless=new"
```

**Median of 3.** Single runs swing ±3–5 points; local Apple-silicon runs land 10–20 points
above PSI on the same URL. Do not chase a one-run delta.

## 3. Ground truth beats scores

- **Check `naturalWidth > 0` and 4xx counts, not `currentSrc`.** `currentSrc` is set even
  when the candidate 403s, and a page full of broken images **scores higher** because there
  is nothing to download. A 97 was once measured against 403 stubs.
- `curl -sI` the URLs from the markup: `cf-resized` proves the transform ran, `cache-control`
  proves `_headers` deployed. Test with and without `Referer` when hunting 403s — hotlink
  protection is header-dependent, and a CSS-initiated fetch uses the **stylesheet's**
  referrer policy, not the document's.
- Serving locally with `python3 -m http.server`: use a **fresh port** after a CSS change, and
  remember localhost serves uncompressed files.

## 4. Definition of done (per page)

1. Lighthouse performance in the high 90s **and** accessibility 100 on pages.dev, 3-run median.
2. Zero 4xx in the network log; the LCP image has `naturalWidth > 0`.
3. Zero console errors or warnings on the page and its render-driven twin.
4. Snapshot and token gates clean; demo bundle rebuilt if component CSS changed.
5. Generated pages regenerated from their builder, never hand-patched.
6. Anything still open recorded in `docs/plans/open-items.md`; durable policy learned in the
   pass folded into `docs/performance.md`.
7. Changes left in the working tree — the user reviews before committing (a push rebuilds
   Cloudflare Pages).
