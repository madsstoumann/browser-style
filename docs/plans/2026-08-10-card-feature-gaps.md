# Card feature gaps — legacy vs v4 (status after the 2026-08-10 parity pass)

> Feature-level backlog from the three-way comparison of `ui/card` (new),
> `content/card/demo` (old prototype) and `content/card/src`→`dist` (intermediary).
> Type/schema parity was never the issue — v4 carries 35 schemaTypes against the legacy 26.
> This file now records what **shipped**, what is **deferred**, and what is **rejected**.

## Shipped in the parity pass (branch `claude/card-final-parity`)

**Microdata correctness** — `timeline` subEvents now emit the required `startDate` (the date used to
sit on `itemprop="name"`, so machines read it as the event's name); `course` puts the teacher on
`CourseInstance.instructor` → `Person` instead of misdeclaring them as `Course.provider`; `contact`
emits one `availableLanguage` per language instead of a joined string; `col-r`/`row-r` pair
`reading-order` with `order: -1` so tab/AT order stops diverging from the visual one.

**Dead detail fields resolved** — `membership.isPopular` renders a promotional chip (the eyebrow
went back to being a category); `profile.skills[]` and `gallery.categories[]` were *redundant* with
the envelope `tags` and were removed from the data rather than rendered twice; `contact.department`
and `responseTime` now surface.

**Per-type fields ported** — `event.offers[]` (one `Offer` per ticket tier) + allowlisted
`attendanceMode`; `review` `aggregateRating`/`productPrice`/`productImage` inside `itemReviewed`;
`course.learningOutcomes` → `teaches` + `courseWorkload` + a real `provider`; `location.rating` +
`contact`; `software.systemRequirements` → `softwareRequirements`; `announcement.announcementType` +
visible effective-date range; `booking.specialRequests`; `comparison` item thumbnails;
`profile.sameAs` (absolute http(s) only — a placeholder `#` is not an identity claim);
`statistic.comparisonPeriod`.

**Renderer affordances** — `headingTag` as a *preset* field (`h2`–`h5`); tags accept `{name, url}`;
an action with no `link.url` renders a real `<button>` with optional `ariaLabel`; `modifiedDisplay`
gives a visible "Updated …" line; `--ui-content-summary-clamp` opts a teaser into line-clamping.

## Deferred — the image pipeline (do this next; it is the one substantial gap left)
The legacy pipeline did four things v4 does not. All of it is documented here so the next pass
starts from evidence, not archaeology:

1. **Per-breakpoint format + quality ladder** — webp/q65 at 240w … avif/q85 at 1200w
   (`content/card/config.json:58-65`, `src/js/base/utils.js:608-650`). `ui/card/srcset.js:33-43`
   applies a single format+quality to every width.
2. **Real `sizes` from the grid slot** — `layout/src/srcsets.js` `calculateSizes` + the
   `<lay-out srcsets>` attribute produced `sizes="(min-width:720px) min(66.67vw,800px)…"`.
   `ui-media-srcset.js:27` hardcodes `sizes: 'auto'`. Note `auto` is *better* than a computed value
   for lazy images in Chromium 130+; the gap is Safari/Firefox (fall back to 100vw and over-fetch)
   and eager/LCP images, which cannot use it at all. So: emit a computed `sizes` as the fallback and
   let `auto` win where supported. The layout-side code already exists.
3. **Document-position priority** — first N cards got `loading="eager" fetchpriority="high"`
   (`config.json:6`, `utils.js:214-227`); v4 only honours a `load(eager)` token, and only for the
   first slide of one carousel.
4. **`width`/`height` on fixed-dimension images + avatar `dpr:2`** (`utils.js:42-58,73-74`,
   `config.json:66-71`) — v4 emits no dimensions (CLS) and never CDN-transforms avatars.

Lower value from the same tier: a provider-abstracted transform builder (obsolete unless multi-CDN
becomes a goal) and a default aspect ratio when the layout declares none.

## Still open, low priority
Renderer i18n — ~20 hardcoded English strings ("Serves", "Director:", "Requires", "Updated") block
localized consumers; UCF already carries `meta.locale`, so the fix is one exported `STRINGS` table
overridable per `renderCard` call. Also: `attr(col-gap)`-derived internal gap (layout coupling,
wants its own design pass), legacy `timeline` item `location`/`endDate` are supported by the
renderer but not demoed, and `statistic` trend-direction styling hooks.

## Rejected, with reasons (do not re-litigate)
- **`role="status"` on ribbon/sticker** (legacy `utils.js:197,205`) — a live region would announce
  promo text on page load. Wrong pattern, not a gap.
- **Poll live voting · booking slot picker · business map iframe · statistic sparkline/target ·
  comparison criteria matrix + derived pros/cons · review helpful votes · announcement dismiss** —
  app state or wrong density at card widths.
- **JSON-LD** — microdata only, deliberate, matched by both legacy tiers.
- **Legacy CMS-shape normalizer** (`runtime.js:22-79`) — only needed if v4 must ingest the legacy
  payload shape.
- **Action-popovers with lazy YouTube embeds** — v4's lightbox/video cover the media case.
- **Puppeteer prerender** — `render.js` is already a pure string function; a plain Node script beats
  driving a browser (that is what `demo/articles/build.js` does).
- **`src/css/components/*.css`** — all 25 files are empty stubs in the legacy repo. There was never
  anything to port.
- **Page-level SEO from `dist/`** — no JSON-LD, breadcrumbs, canonical, OG/Twitter or print styles
  exist in any of the 27 built pages.
- **`card-visualizer.html`** — tooling, superseded in spirit by `demo/media.carousel.builder.html`.
