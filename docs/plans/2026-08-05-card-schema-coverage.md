# Card schema coverage — legacy diff, web-usage research, taxonomy extension (v1.3)

> Analysis behind the 2026-08-05 taxonomy extension of the universal card system
> (`ui/card` + `cms/baseline/models/card.schema.json`). Three questions: does the
> new system miss anything the legacy `content/card` package had? Are there
> obvious schema.org candidates missing? What do the most-used schema.org types
> on major websites say about the taxonomy? The answers drove card.schema.json
> v1.2.0 → v1.3.0 (26 → 35 `schemaType` values).

## 1. Type parity with the legacy systems: complete

The legacy package (`content/card/` — 26 `BaseCard` classes in `src/`, plus the
single-class `demo/` prototype with its `TYPE_RENDERERS` table) and the v4
system agree on the identical 26-type taxonomy: content, article, news, product,
event, recipe, review, job, course, booking, poll, profile, faq, quote,
timeline, gallery, statistic, achievement, announcement, business, comparison,
contact, location, membership, social, software. Verified in three agreeing
places: `SCHEMA_TYPES` in `ui/card/render.js`, the `schemaType` enum in
`card.schema.json`, and the `data/index.json` manifest. Nothing was dropped,
and the legacy data's orphan `type: "spot"` fell back to content in both
systems.

Deliberate schema-mapping improvements over legacy (the legacy code, not its
docs — `content/card/AGENTS.md` misdocuments its own schema emission in four
places):

| Type | Legacy emitted | v4 emits | Note |
|---|---|---|---|
| gallery | `MediaGallery` | `ImageGallery` | Google-recognized type |
| comparison | `Table` | `ItemList` | legacy AGENTS.md claimed ItemList; the code said Table |
| contact | `ContactPoint` | `ContactPoint` | legacy AGENTS.md claimed ContactPage |
| business/location hours | flat `openingHours` string only | flat string **+ structured `OpeningHoursSpecification`** (v1.3) | legacy AGENTS.md claimed OpeningHoursSpecification; the code never emitted it |

Legacy **dynamic-subtype** behaviours and their v4 status:

- EventCard used `content.category` verbatim as the root itemtype
  (`BusinessEvent`). Not carried forward (unvalidated data in itemtype).
- ReviewCard's `itemReviewed` type was data-driven (`itemType`); v4 hardcodes
  `Product`. Not carried forward.
- LocationCard switched to `TouristDestination` for one category value; v4
  hardcodes `Place`. Not carried forward.
- **v1.3 reintroduces the useful part of this pattern safely**: `business` may
  sharpen `LocalBusiness` to an ALLOWLISTED subtype via `details.businessType`
  (`BUSINESS_SUBTYPES` in render.js — Restaurant, CafeOrCoffeeShop, Store,
  Hotel, …). Allowlist, never verbatim data.

## 2. Capability diffs vs legacy (documented, mostly deferred)

Variant/layout coverage is **not** a gap: every legacy layout token (overlay
9-position grid, `ar*` aspect ratios, `flip`, `th` thumbnail, `pa*`/`pi*`/`pb*`
padding steps, `thd`/`thl` themes, `w*` widths — and the demo prototype's
`vertical`/`horizontal`/`overlay()`/`ar()`/`split()` tokens) maps onto the
strictly richer v4 DSLs (`ovr()`, `asr()`, `col-r`/`row-r`, `pad()`, `theme=`,
`spl()`). Microdata-only output (no JSON-LD) is unchanged and deliberate.

Field-level drops the legacy renderers had that v4 does not (candidate
follow-ups, grouped by kind — **not** addressed by v1.3 except where noted):

**SEO-relevant microdata**
- event: `offers[]` (ticket name/price/currency → Offer) and real
  `eventStatus`/`eventAttendanceMode` values (v4 hardcodes
  `OfflineEventAttendanceMode`)
- review: `aggregateRating` + `offers` price on the reviewed item
- recipe: `aggregateRating`, `totalTime`
- business: `sameAs[]`, `foundingDate` — **restored in v1.3**
- profile: `sameAs`

**Features (some are deliberate CSS-first simplifications)**
- poll: live voting (endpoint, `VoteAction`, allowMultiple, showResults modes) —
  v4 renders static results
- booking: `availableSlots[]` slot picker + `booking-slot-selected` event
- business: templated map embed (`mapProvider`, OSM default) — v4 renders
  address/geo metas + links only
- comparison: criteria matrix (feature × item + winner) with auto-generated
  pros/cons — v4 has the flat name/price/score list
- statistic: `targetValue` progress bar, `chartData` CSS sparkline,
  `comparisonPeriod`
- software: `screenshots[]`, `systemRequirements{ram,storage,processor}`
- gallery: `downloadOptions[]`, slideshow flag · membership: `limitations[]`
  (✗ list) · social: `mediaAttachments[]` · contact: `department`, per-method
  availability · course: `learningOutcomes[]`, instructor title/experience,
  `courseWorkload` · announcement: `isDismissible` · location: `amenities[]`,
  rating

## 3. Web-usage research → the nine new types

Baselines: the Google/Schema.org usage-statistics dataset (first published
2026; top tiers after the site-structure types WebPage/WebSite/Organization/
BreadcrumbList are Product, Offer, AggregateRating, Review, Person,
Article/NewsArticle, ImageObject, PostalAddress, LocalBusiness, Event, Recipe,
FAQPage, JobPosting, VideoObject) and the Google rich-results gallery (adds
Course, Dataset, Discussion forum, Q&A, Profile page, Software app, Movie,
Vacation rental, Vehicle listing, Fact check, Video; HowTo rich results were
deprecated by Google but the type remains widely deployed). Page-level types
(WebSite, BreadcrumbList, Speakable) are out of scope for a card component.

Already well covered: Product/Offer/AggregateRating, Article/NewsArticle,
Person, LocalBusiness, Event, Recipe, FAQPage, JobPosting, Course,
SoftwareApplication, Review, ImageGallery.

**Added in v1.3** (schemaType → root itemtype):

| schemaType | itemtype | Why |
|---|---|---|
| `organization` | `Organization` | top-tier usage; the "large business with local offices" shape — HQ + `department` → `LocalBusiness` per office (Google's multi-location pattern), `numberOfEmployees`, `sameAs`, `foundingDate`. Previously missing entirely: `business` is single-location LocalBusiness |
| `video` | `VideoObject` | top-tier usage + Google Video rich results; the legacy system had six `video-*` items (article sub-variant), v4 previously only nested VideoObject inside other types. Root-scope media emission via `ROOT_VIDEO_TYPES` |
| `howto` | `HowTo` | widely deployed; sibling of recipe — reuses the HowToStep/accordion machinery, adds `HowToSupply`/`HowToTool`/`estimatedCost` |
| `qa` | `QAPage` | Google Q&A rich results; distinct from FAQ (one question, community answers, accepted/suggested + upvotes) |
| `podcast` | `PodcastEpisode` | `partOfSeries` → PodcastSeries, `associatedMedia` → AudioObject |
| `movie` | `Movie` | Google movie carousel; director/actor Person scopes, contentRating, aggregateRating |
| `book` | `Book` | isbn, numberOfPages, allowlisted `bookFormat` (BookFormatType), publisher, offers |
| `dataset` | `Dataset` | Google dataset search; license, coverage, `variableMeasured`, `distribution` → DataDownload |
| `claim` | `ClaimReview` | fact-check rich results; `claimReviewed` + `reviewRating` → Rating with `alternateName` verdict |

Plus the **business depth upgrade** (same release, not a new type):
allowlisted subtype itemtype, structured `OpeningHoursSpecification` parsed
from the existing `{schema, display}` hour strings, `priceRange`,
`aggregateRating`, `sameAs`, `foundingDate`.

**Evaluated, not added** (add on demand):

- Tier 2: `discussion` (`DiscussionForumPosting` — could be a data-driven
  subtype of `social`), `music` (`MusicRecording`/`MusicAlbum`)
- Industry verticals: `lodging` (`LodgingBusiness`/`VacationRental` — shipped
  2026-08-18 as `vacationrental`; there is no open rich result, Google's
  vacation-rental feature is a partner-programme feed), `vehicle` (`Car`/`Vehicle` listings),
  `realestate` (`RealEstateListing`/`Apartment`), `restaurant` + `menu`
  (`Restaurant`/`Menu`/`MenuItem` — the Restaurant *subtype* is covered by
  `businessType`; a structured menu is not), `service` (`Service` — already
  nested inside booking)
- Declining/niche: `SpecialAnnouncement` is already carried (legacy parity)
  despite declining post-COVID usage

## 4. Where things landed (files)

- `ui/card/render.js` — 9 × `SCHEMA_TYPES` + `DETAILS` renderers,
  `BUSINESS_SUBTYPES`/`resolveItemtype`, `ROOT_VIDEO_TYPES` + root-scope video
  metas, `hoursSpec()`/`openingHoursMetas()`, `BOOK_FORMATS`, prop-override
  additions (eyebrow → `genre`, published → `uploadDate`)
- `cms/baseline/models/card.schema.json` — v1.3.0: 9 enum values + `details`
  shape prose
- `ui/card/data/` — 9 new UCF instances + `index.json`; `business.json` gained
  businessType/priceRange/rating/sameAs/foundingDate
- `ui/card/docs/card.md` — details shapes, microdata conventions, parts/sub-
  component tables, counts resynced (25 presets / 129 demo presets / 35 types)

SSR snapshot verification: against the pre-change baseline, the only differing
blocks are the nine new cards and the business card (structured hours + new
demo fields) — all other output byte-identical. `tokens.build.js` +
`tokens.lint.js` green and idempotent.

Open follow-ups from §2: restore event offers / review aggregateRating /
recipe aggregateRating + totalTime / profile sameAs (small renderer edits);
decide per-feature on the interactive drops (poll voting, booking slots, map
embed, comparison matrix, statistic sparkline).
