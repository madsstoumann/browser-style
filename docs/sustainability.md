# Sustainability — the Web Sustainability Guidelines against this repo

> An audit of v4.browser.style against the W3C **Web Sustainability Guidelines** (WSG, Group
> Draft Note of 2026-08-20), and the one thing the WSG asks for but does not supply: a budget.
> Performance *policy* stays in `docs/performance.md`; this file holds only what performance
> does not — the transfer-weight budget and rating scale, the disclosure-file audit, and a
> status per guideline. The *procedure* is the `perf-pass` skill (§ 0.3, § 2 and § 4); the
> measurement helper is `scripts/co2.js`. Status verified live on 2026-09-04.

---

## 1. What the WSG is, and what applies to a static demo site

The WSG is a W3C Group Note (Draft), not a Recommendation — guidance, not a conformance
standard with legal weight, and the TR URL always serves the latest draft. It carries **71
guidelines** in four sections, each with one to five **success criteria**, plus examples and
tags:

| Section | Guidelines | Audience |
|---|---|---|
| 2. User Experience Design | 17 | design, content |
| 3. Web Development | 16 | this repo's live surface |
| 4. Hosting, Infrastructure and Systems | 12 | Cloudflare Pages, `_headers` |
| 5. Business Strategy and Product Management | 26 | organisations |

Four **conformance levels** may be claimed — a single success criterion, a whole guideline, a
whole section, or full conformance — and every claim must carry a date, the WSG title and URI,
and the exact criteria met. The WSG's own **anti-greenwashing** clause is the rule this file
follows: conformance is not evidence of overall sustainability, and a partial improvement must
never be presented as full achievement. Where the WSG conflicts with another standard, follow
the lower-sustainability-risk recommendation unless a higher authority (legislation) overrides.

Two companion documents matter here:

- **Impact Ratings** (`/TR/wsg-ir/`) rate every guideline Low / Medium / High / Indeterminate
  on **People, Planet, Prosperity**, with a Short / Medium / Long timeframe. For Web
  Development the Planet column is almost entirely *Indeterminate*; the only **Planet-High**
  guidelines in this repo's scope are **2.9 Optimize media** and **2.10 Animation**, with
  4.1 hosting, 4.2 caching, 4.3 compression and 4.10 CDN on the infrastructure side. That is
  the priority order the budget below follows.
- **STAR** — *Sustainable Tooling And Reporting* (editor's draft, `star.json` dated
  2026-07-03, in `github.com/w3c/sustainableweb-ig/docs/`) carries 160 advisory
  **techniques**, each with a `tests.procedure` checklist and a test-suite page. It is the
  closest thing to machine-testability the WSG has; the WSG itself only says it "is designed
  to be testable through automated tools and human evaluation". This repo cites STAR by date
  and does not mirror its techniques — they change between drafts.

**Scope for a static, dependency-free demo site on Cloudflare Pages.** Of the 26 Business
guidelines, about six have a repo-level answer (§ 3.4); the rest concern an organisation. Of
the 12 Hosting guidelines, five apply and four of those are satisfied by the host. The live
surface is sections 2 and 3 — and most of it is met *by construction*: CSS-first, light DOM,
zero runtime dependencies, zero web fonts, system font stacks, native elements, one
content-hashed bundle per page, and not one analytics or third-party script *in the repo*. What
the **zone** injects at the edge is a separate inventory (§ 2, § 3 row 3.5): Cloudflare Zaraz
carrying GA4 page views behind a consent banner, the Cloudflare Web Analytics beacon, and
bot-defence — none of it in this repository, all of it on the wire. What was **not** in place
before this file is the number.

## 2. The budget — transfer weight, requests, rating

WSG 3.1 and 5.24 require "clear performance and environmental targets including limits on
requests, elements rendered, or other measurable resource use" and give no figure. The scale
adopted here is the **Sustainable Web Design model v4** and its **Digital Carbon Ratings**,
because it is public, versioned, has a reference implementation (CO2.js), and the letters map
one-to-one onto a transfer size — which is the quantity a code change actually moves:

| Rating | gCO2e per view | Transfer size ≤ | HTTP Archive percentile |
|---|---|---|---|
| A+ | 0.040 | 272.5 KB | 5th |
| A | 0.079 | 531 KB | 10th |
| B | 0.145 | 976 KB | 20th |
| C | 0.209 | 1,410 KB | 30th |
| D | 0.278 | 1,875 KB | 40th |
| E | 0.359 | 2,420 KB | 50th |
| F | above | above | — |

The grams are grey hosting, all first visits, 494 gCO2e/kWh global grid, HTTP Archive crawl of
2023-06 (percentiles). Under the same model 1 GB grey is 148.2 g; a green host zeroes the
data-centre *operational* term only, so the green figure is ~82% of grey. **Grams are an
estimate from a model and are report-only; the gate is KB.**

**Two tiers**, in the "cannot list" spirit of `docs/performance.md` § 1:

1. **Component and demo pages — rating A, ≤ 531 KB transfer.** Every page whose media is
   illustration rather than subject: component readmes, `schema.html`, the layout demos, the
   card demo pages with a handful of images.
2. **Media-heavy by design — report, do not fail.** `media.video.html` (14 autoplay videos are
   the content), `schema.place.html` (eight map embeds, open-items § 33), `cards.html` (24
   images from the v1 host), the carousel and lightbox galleries. The gate is *no regression
   against the recorded baseline*, and the new number is written back into the table.

Requests are recorded, not gated, until the sweep below covers every page family. Elements
rendered: `schema.html` is 2,482 elements and the microdata *is* the demo — DOM size is not a
lever there (`docs/performance.md` § Big DOMs).

**Where and how to measure.** Transfer weight on **`v4.browser.style`**, never pages.dev —
the `/cdn-cgi/image/` transforms 404 off the zone, so image bytes are only real on the custom
domain; the zone's bot-defence script adds a few KB, which is noted, not subtracted. Scores stay
on pages.dev exactly as `docs/performance.md` establishes. Lighthouse's `total-byte-weight` is
the compressed transfer size; one run is enough for bytes (they do not swing the way scores do):

```bash
npx -y lighthouse "https://v4.browser.style/<page>" --quiet --only-categories=performance \
  --output=json --output-path=./lh.json --chrome-flags="--headless=new"
node scripts/co2.js ./lh.json            # one page: block with the budget line
node scripts/co2.js a.json b.json …      # several: the table below
```

`scripts/co2.js` pins the SWD v4 constants and the rating thresholds in its header with their
sources and the CO2.js version they were checked against (0.19.0); it has no dependency on
purpose (WSG 3.12). Its `--grey` flag prints the comparable grey figure.

**Baseline** — Lighthouse mobile emulation, `v4.browser.style`, one run per page:

<!-- baseline:start -->
| Page | Tier | Transfer KB | Requests | Third-party KB | gCO2e (green) | Rating | Measured |
|---|---|---|---|---|---|---|---|
| `/` | 1 | 89.2 | 29 | 10.3 | 0.011 | A+ | 2026-09-04 |
| `/layout/` | 1 | 122.0 | 33 | 50.1 | 0.015 | A+ | 2026-09-04 |
| `/ui/card/demo/schema.html` | 1 | 358.5 | 30 | 10.3 | 0.043 | A | 2026-09-04 |
| `/ui/card/demo/media.lightbox.html` | 1 | 385.0 | 29 | 10.3 | 0.047 | A | 2026-09-04 |
| `/ui/card/demo/cards.html` | 2 | 2,176.5 | 31 | 10.3 | 0.263 | D | 2026-09-04 |
| `/ui/card/demo/media.video.html` | 2 | 4,382.6 | 127 | 1,702.1 | 0.530 | F | 2026-09-04 |
<!-- baseline:end -->

Reading the table: every tier-1 page is inside the A line with headroom; `schema.html` — the
heaviest page that is *not* media-by-design — spends 199 KB of its 359 on images, 77 on the
bundle, 42 on the document. **Every page carries ~28 KB of edge-injected script that is not in
the repo:** the 10.3 KB of "third-party" is the Cloudflare Web Analytics beacon
(`static.cloudflareinsights.com/beacon.min.js`); Lighthouse counts the rest as first-party
because it is same-origin — Zaraz (`/cdn-cgi/zaraz/s.js`, 7 KB, GA4 page views behind a
consent banner) and bot-defence (`/cdn-cgi/challenge-platform/…`, 10 KB + a 1 KB XHR, the
~5 points `docs/performance.md` § Hosts prices). Counted, not subtracted; whether two
analytics systems are needed is open-items § 45 (i). `/layout/` adds ~40 KB of
`picsum.photos` placeholder images, its real third-party bytes. `cards.html` lands at D/E on the
24 untransformed images from the v1 host (`docs/performance.md` § 3 item 6) — the one tier-2
page whose weight is debt rather than content. `media.video.html` is 2.4 MB of video and
1.7 MB of YouTube/Vimeo embed script for 14 players; it is recorded, not judged.

## 3. Guideline map — status per guideline

`done` — met, with evidence. `partial` — met in the main, with a named gap. `open` — not met,
tracked in `docs/plans/open-items.md` § 45 unless another § is named. `n.a.` — the criterion
has no object on a static site with no server compute, no accounts and no user data.

### 3.1 Web Development (16)

| # | Guideline | Status | Evidence |
|---|---|---|---|
| 3.1 | Set goals based on performance and energy impact | **done** (this file) | § 2 budget and tiers; `perf-pass` definition of done item 2 |
| 3.2 | Minify and remove unused code | done | esbuild-minified `dist/*.min.css` per package and `*.min.js`; the demo bundle `dist/demo.<hash>.min.css` (`scripts/css-bundle.js`, `hash-asset.js`) |
| 3.3 | Modularize bandwidth-heavy components | done | peer-exclusive bundles, one `<link>` per package in dependency order (`AGENTS.md` § The v4 systems); CSS splitting per page evaluated and rejected — `docs/performance.md` § CSS bundle |
| 3.4 | Avoid redundancy and duplication | done | shared token vocabulary, `:where()` throughout, generated docs from one manifest (`ui/card/data/tokens.json`) |
| 3.5 | Treat third parties the same as first parties | partial | the repo ships zero third-party scripts (verified); the zone injects three on every page — Zaraz→GA4 (7 KB, consent-gated), Cloudflare Web Analytics beacon (10 KB, cookieless) and bot-defence (~11 KB) — all zone settings, none removable from the repo, § 2; OSM iframes on `schema.place.html` cost ~1.5 s third-party CPU — facade held as a product call, open-items § 33; YouTube/Vimeo on `media.video.html` carry a per-frame `referrerpolicy`; `/layout/` uses `picsum.photos` placeholders |
| 3.6 | Good semantic practices | done | light DOM, native `<details>`, `<video>`, `<dialog>`/popover; polyfills feature-detect on a real property and are removable (`ui/base/polyfills/readme.md`) |
| 3.7 | Defer non-critical resources | done | one eager `fetchpriority="high"` LCP image per page, everything else `loading="lazy" decoding="async"`; hints measured before use — `docs/performance.md` § Resource hints |
| 3.8 | Structure metadata for machine readability | done | schema.org microdata on every card type (`ui/card/docs/schema.md`), `<head>` audit in `docs/html-head.md`, `llms.txt` |
| 3.9 | Media queries that support sustainability goals | partial | `prefers-reduced-motion` in 13 sheets, `prefers-color-scheme` (`ui/base/utility.css`), `forced-colors`, `prefers-reduced-transparency`; **`prefers-contrast` absent**; `prefers-reduced-data` n.a. — § 4 |
| 3.10 | Layouts for different devices and requirements | done | container queries and viewport breakpoints (`layout/AGENTS.md`), CSS-first with JS as enhancement; carbon-aware design n.a. — § 4 |
| 3.11 | Sustainable JavaScript and APIs | done | JS is progressive enhancement; string SSR renderer; no client-side API calls on the demo surface |
| 3.12 | Dependencies sparingly and maintained | done | zero runtime dependencies in every published package; root `package.json` has no devDependencies |
| 3.13 | Expected and beneficial files | **open** | `robots.txt` ✓ `favicon.ico` ✓ `llms.txt` ✓ `site.webmanifest` present but unlinked and its icons are missing (`docs/html-head.md` § 6); `sitemap.xml` ✗ `humans.txt` ✗ `security.txt` ✗ `carbon.txt` ✗; `opensearch.xml` n.a. (no site search); `ads.txt` n.a. — open-items § 45 (b) |
| 3.14 | The most efficient solution | done | static files on Pages, no CMS at runtime, no framework; content models compile to HTML at build time |
| 3.15 | Latest stable language version | done | the support contract is Chrome 150 / Safari 26.5 (`AGENTS.md` § Browser support baseline) |
| 3.16 | Database queries | n.a. | no database |

### 3.2 User Experience Design (17)

| # | Guideline | Status | Evidence |
|---|---|---|---|
| 2.1 | Identify, assess, disclose, review, mitigate impacts | partial | this file is the disclosure; no external-impact plan (an organisation's, not a repo's) |
| 2.2 | Understand user requirements or constraints | n.a. | no user research programme; the audience is developers using the packages |
| 2.3 | Sustainability in every stage of ideation | n.a. | — |
| 2.4 | Efficient and streamlined user journeys | partial | flat demo index, one bundle per page; no `sitemap.xml` (3.13) |
| 2.5 | Design to assist, not distract | done | no pop-ups, no infinite scroll, no engagement traps; popover/lightbox open only on user action |
| 2.6 | Avoid being manipulative or deceptive | partial | no ads, no deceptive patterns; GA4 page views run only after consent (Zaraz banner, edge-injected), Cloudflare Web Analytics is cookieless — but two analytics systems for one static site is more than "necessary" (2.6.3), open-items § 45 (i); `robots.txt` crawler policy in `docs/llms-txt.md` |
| 2.7 | Deliverables understandable and reusable | done | readme per package, `AGENTS.md` per system, generated token docs, public source |
| 2.8 | A design system for interface consistency | done | this repo is one — tokens, shared theme axis, `:where()` overrides, versioned packages |
| 2.9 | Optimize media to reduce resource use | partial | `format=auto` transforms, srcset ladder, lazy loading, `asr()` sizing; per-width quality ladder measured (−30%) but unshipped — `docs/performance.md` § 3 item 1; eager `sizes` over-declares on 18 pages — open-items § 42; autoplay muted loops on `media.video.html` — § 4 |
| 2.10 | Animation proportionate and easy to control | partial | every always-running animation behind `prefers-reduced-motion` (measured 133.9 ms → 0); carousel `auto()` is opt-in and pairs with `<ui-play>`; always-running `ui-beacon` has no user stop — open-items § 45 (h); the price list is `docs/performance.md` § 1 |
| 2.11 | Optimized web typography | done | system font stacks only (`ui/base/tokens.css`), zero web fonts on any demo page; the icon font is opt-in, subsetted, inline base64 (`ui/icon/readme.md`) |
| 2.12 | Avoid unwanted notifications | n.a. | no notifications, no accounts, no email |
| 2.13 | Downloadable and physical documents | done | no PDFs on the demo surface; docs are served as `text/markdown` (`docs/llms-txt.md` § 4) |
| 2.14 | Involve users early | n.a. | — |
| 2.15 | Audit and test for bugs and issues | partial | renderer suite, token lint, schema compare, SSR snapshot (`docs/v4.md` § gates); no CI — every gate is run by hand |
| 2.16 | Validate usability through real-world usage | partial | page-view data exists (GA4 via Zaraz, Cloudflare Web Analytics RUM); no usability programme reads it |
| 2.17 | Cross-platform compatibility support | done | supported engines and versions documented as a contract (`AGENTS.md` § Browser support baseline), divergences tabled with their handling |

### 3.3 Hosting, Infrastructure and Systems (12)

| # | Guideline | Status | Evidence |
|---|---|---|---|
| 4.1 | Sustainable hosting | done | Green Web Foundation greencheck for `v4.browser.style` and `browser.style`: `green: true`, hosted by Cloudflare (provider id 779, listed), supporting document "Cloudflare 2023 Emissions Inventory" — checked 2026-09-04 |
| 4.2 | Caching and offline access | partial | `_headers`: `/assets/*` and `/dist/*` `max-age=31536000, immutable` (content-hashed or never-edited); HTML `max-age=0, must-revalidate`; unhashed `/ui/*` falls to the Pages default `max-age=1800` — `docs/performance.md` § 3 item 2; offline/service worker n.a. |
| 4.3 | Reduce data transfer with compression | done | `content-encoding: br` and HTTP/3 on the zone (zone-only knob — `docs/performance.md` § Hosts); precompression at q11 tried, rejected, do not retry — `docs/performance.md` § 3 |
| 4.4 | Error pages and redirection | **open** | no `404.html`: every unknown path returns `index.html` **with HTTP 200** — `/carbon.txt`, `/sitemap.xml`, `/humans.txt`, `/security.txt` all "exist" as the homepage (verified with `curl`) — open-items § 45 (a); no redirect chains |
| 4.5 | Unnecessary virtualized environments | n.a. | no servers, no containers |
| 4.6 | Automation wisely | done | `v4` push → one Pages build; `npm run build` is an explicit workspace list so a root build never sweeps the Docusaurus site (`AGENTS.md` § Development) |
| 4.7 | Frequency of data refreshes | n.a. | static |
| 4.8 | Back up critical data | done | the repository is the data (git, GitHub, npm registry) |
| 4.9 | Impact of data processing | n.a. | no processing, no AI at runtime |
| 4.10 | CDNs when beneficial | done | Cloudflare edge for every byte; image transforms at the edge |
| 4.11 | Infrastructure fits requirements | done | static hosting for a static site |
| 4.12 | Store data according to user needs | n.a. | no user data |

### 3.4 Business Strategy and Product Management — the applicable subset

| # | Guideline | Status | Evidence |
|---|---|---|---|
| 5.5 | Calculate the environmental impact | done | § 2 model and baseline |
| 5.6 | Clear sustainability goals and metrics | done | § 2 tiers; `perf-pass` definition of done |
| 5.12 | Document updates and evolutions | done | git history, per-package readmes, `docs/plans/open-items.md` as the ledger |
| 5.19 | Responsible practices around AI | partial | crawler policy and `llms.txt` — `docs/llms-txt.md`; no AI at runtime |
| 5.22 | Care and end-of-life | partial | `AGENTS.md` § Legacy names what is superseded and why; unconverted v3 folders still ship in the repo |
| 5.24 | Performance, environmental and human budgets | done (perf, env) | § 2; human budget n.a. |
| 5.25 | Use and contribute to open source | done | public repository and npm packages |

The other 19 Business guidelines (advocate, training, reporting, DEJI, philanthropy, supplier
standards, e-waste, continuity, …) describe an organisation, not a repository — n.a. here.

## 4. Deliberately not done

- **`prefers-reduced-data`.** MDN: "not supported by any user agent", not Baseline, spec
  subject to change. Under the support contract — do not ship a feature neither baseline engine
  supports — it is n.a. until Chrome 150 / Safari 26.5 ship it. Re-check trigger in § 5.
- **Autoplay video on `media.video.html`.** WSG 2.9.4 says autoplay off by default. The 14
  muted, looping, `playsinline` videos *are* that page's content; they are recorded in tier 2
  rather than removed (`docs/performance.md` § 3 item 6).
- **The edge injections are not fought from the repo.** Zaraz, the Web Analytics beacon and
  bot-defence are zone settings; the consent banner is Zaraz's. The repo records their bytes
  (§ 2) and the decision about them (open-items § 45 (i)) and does not try to block or defer
  them in page code — "the host you score is the host you cannot configure"
  (`docs/performance.md` § Hosts). Zaraz's operating doc, `docs/zaraz.md`, lives on the
  `seo-zaraz` branch and is not on `v4` yet.
- **`opensearch.xml`, `ads.txt`.** No site search, no advertising.
- **Carbon-aware design (3.10.3).** Nothing runs server-side to shed under grid stress; the
  client-side levers (`prefers-reduced-motion`, lazy media) are already the defaults.
- **STAR techniques are not mirrored.** Editor's draft, cited by date; the 160 procedures
  would be a second checklist to keep in sync with someone else's draft.
- **Precompression, Early Hints.** Rejected with reasons in `docs/performance.md` § 3.

## 5. Re-check triggers

- A new WSG draft — the TR URL is "latest"; re-read § 1 counts and § 3 rows against it.
- A new Sustainable Web Design model version or ratings refresh — the table in § 2 is v4 on the
  2023-06 HTTP Archive percentiles; `scripts/co2.js` pins the constants and says so.
- A new third-party embed on any page (3.5) — record its CPU and bytes before it ships.
- A change to the zone's edge injections (Zaraz, Web Analytics, bot-defence, speculation) —
  re-run the sweep; today they are ~28 KB of script per page.
- A new page family — run the sweep, extend the baseline table, decide its tier.
- The browser baseline moving on `prefers-reduced-data` or `prefers-contrast` (3.9).
- Yearly: re-probe the greencheck and the disclosure files with the `curl` pass below.

```bash
curl -s https://api.thegreenwebfoundation.org/greencheck/v4.browser.style
for p in /robots.txt /sitemap.xml /humans.txt /carbon.txt /.well-known/security.txt /site.webmanifest; do
  printf '%-26s ' "$p"; curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "https://v4.browser.style$p"; done
curl -sI -H 'Accept-Encoding: br, gzip' https://v4.browser.style/ | grep -iE 'content-encoding|cache-control|alt-svc'
```

## Sources

- W3C Web Sustainability Guidelines — <https://www.w3.org/TR/web-sustainability-guidelines/>
  (Group Draft Note, 2026-08-20). Machine-readable: `guidelines.json` in
  <https://github.com/w3c/sustainableweb-wsg>.
- WSG Impact Ratings — <https://www.w3.org/TR/wsg-ir/>.
- STAR, Sustainable Tooling And Reporting — `docs/star.json` and `docs/test-suite/` in
  <https://github.com/w3c/sustainableweb-ig> (editor's draft, 2026-07-03).
- Sustainable Web Design model v4 — <https://sustainablewebdesign.org/estimating-digital-emissions/>;
  Digital Carbon Ratings — <https://sustainablewebdesign.org/digital-carbon-ratings/>.
- CO2.js (`@tgwf/co2`, reference implementation, 0.19.0) —
  <https://developers.thegreenwebfoundation.org/co2js/overview/>.
- Green Web Foundation greencheck — `https://api.thegreenwebfoundation.org/greencheck/<domain>`.
- carbon.txt v0.5 syntax — <https://carbontxt.org/syntax>.
- MDN, `prefers-reduced-data` —
  <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-data>.
