# Schema.org cards — type-by-type notes

> Companion to [`demo/schema.html`](../demo/schema.html) — the hand-authored reference markup
> for all 48 schema.org card types (the markup `render.js` reproduces). The intro prose, the
> per-type notes and the structured-part vocabulary used to live inline on that page; they moved
> here so the demo stays one card grid.

**The count is mechanical:** 48 = distinct `itemtype` values on the page's `<ui-card>` roots
(`grep -o '<ui-card[^>]*itemtype="[^"]*"' | sort -u`). It counts sharpened
[subtypes](#subtypes) — `ProductGroup`, `CafeOrCoffeeShop`, `DiscussionForumPosting` — as their
own entry, which is why it runs ahead of the model's `schemaType` list. A 49th type,
`EmployerAggregateRating`, appears on the job card as a **second top-level item** rather than a
card of its own.

Every card type from the legacy `content/card` package — plus the nine types added in model
v1.3 (organization, video, howto, qa, podcast, movie, book, dataset, claim), plus the eleven
[authored markup-first](#types-authored-markup-first) — re-created with
the modern engine: `<ui-card>` + `<ui-media>` + `<ui-content>`, with satellites `<ui-chip>`,
`<ui-sticker>`, `<ui-save>`, `<ui-avatar>`, `<ui-quote>` and `<ui-accordion>`. Every card uses
the same composition: media on top, text below. Structured data is inline **microdata**
(`itemscope`/`itemtype`/`itemprop` + hidden `<meta>` values) — no JSON-LD. The single script on
the page is optional: `video.js` polyfills the proposed media invoker commands
(`command="--play-pause"`) behind the podcast play button; every card renders identically
without it. Each media frame also carries a `<ui-chip data-type>` naming the card's schema.org
type — a demo affordance, emitted by `render.js` only when `renderCard` gets `{ typeChip: true }`.

## Structured `data-part` vocabulary

The twelve parts the typed cards add on top of the envelope. All are **styled** in [`content.css`](../content.css) — this page is the reference markup `render.js` follows, not a wish list. Envelope parts carry the rest: `eyebrow`, `headline`, `subheadline`, `summary`, `meta` (salaries, specs, dates), `byline` + `byline-who` + `dateline` (people), `tags`, `actions` and `footer` (totals, recommendations). `caption` belongs to the media frame — see [media.html](../demo/media.html).

| data-part | Element | Purpose | Used by |
|---|---|---|---|
| `price` | `<p>` + `<data>`/`<del>`/`<ui-chip>` | Price row (Offer / MonetaryAmount microdata), currency-formatted | product, job, course, booking, membership, software, book, real estate |
| `rating` | `<div>` + readonly `.ui-rating` + `[data-sr]` label + count | Star rating (AggregateRating / Rating / EmployerAggregateRating) | product, review, business, movie, book, job, TV series |
| `list` | `<ul>` / `<ol>`; marker via `--ui-content-list-marker`, `data-variant="crossed"` for excluded items | Ingredients, qualifications, features, amenities, answers, tracks, seasons, episodes, menu items, terms | recipe, job, course, booking, location, membership, how-to, Q&A, dataset, menu, glossary, album, TV series, podcast series, real estate, service, loyalty, health |
| `links` | `<ul>` of plain link rows | Related links — the envelope `links[]`, deliberately not buttons | any type |
| `address` | `<address>` of stacked lines | Postal address (PostalAddress scope); a 2-letter country code stays machine-only | business, location, organization, real estate |
| `hours` | two-column `<dl>` | Opening hours, one row per pattern (`openingHoursSpecification`; the flat string only where the type owns it) | business, location, organization offices |
| `office` | `<div>` wrapping name + address + contacts + hours | One local branch (`department` → LocalBusiness) | organization |
| `stat` | `<p>` + `<data>` value + unit + trend | Big-number display | statistic |
| `timeline` | `<ol>` of `<time>` + text | Milestone list (`subEvent` scopes) | timeline |
| `quote` | `<ui-quote>` + `<blockquote>` (+ `<cite>`) | Third-party voice: pull-quote, review body, post, answer, reviewed claim | quote, review, social, Q&A, fact check |
| `options` | `<ul>` of `<label>` + `<progress>` | Poll answers / comparison rows with bars | poll, comparison |
| `cover` | `<a>` inside the headline, `::after` covering the card | Clickable card — one link, no nested anchors; tag/action links stay above it | article, news (→ the [full-article pages](../demo/articles/article.html)) |

## Subtypes

A large share of schema.org is **subtypes that inherit every property of a type we already
render**. A `SportsEvent` is an `Event`; a `DiscussionForumPosting` is a `SocialMediaPosting`.
For those the existing renderer already emits valid markup — only the `itemtype` string is less
specific than it could be. `details.subtype` sharpens it, with no new renderer code:

```json
{ "schemaType": "social", "headline": "Thread", "details": { "subtype": "DiscussionForumPosting" } }
```

→ `itemtype="https://schema.org/DiscussionForumPosting"`. The `<ui-chip data-type>` label
follows the sharpened type too.

**"Already valid" is a claim about validity, not about rich-result completeness.** Inheritance
guarantees the base type's properties remain *legal* on the subtype; it does not guarantee they
are the ones a consumer reads. `DiscussionForumPosting` is the first case to break the tie both
ways: Google documents `headline` as its title property and says it "is not recommended for a
`SocialMediaPosting`", and its supported `interactionType` list contains `ViewAction` but not
`WatchAction` — so the base type's `name` and the renderer's old blanket `WatchAction` were
valid and silently ignored.

**The rule that follows:** when a subtype needs a *different* property than its base, resolve it
from the **resolved itemtype** (`resolveItemtype(fields)`), not from the `schemaType` key — the
key cannot distinguish a plain post from a forum posting. `HEADLINE_PROP_BY_ITEMTYPE` is that
seam, consulted before the `schemaType`-keyed `HEADLINE_PROP`. Populate it only for subtypes
with a documented difference; a subtype that inherits cleanly still needs no renderer code.

Two shapes of difference exist, and both resolve from the itemtype — neither reads
`details.subtype` directly:

| The subtype needs… | Seam | Case |
|---|---|---|
| a different **property spelling** for something the base already emits | `HEADLINE_PROP_BY_ITEMTYPE` | `DiscussionForumPosting` → `headline` |
| **additional properties** that are invalid on the base type | a gate on the `itemtype` threaded into the `DETAILS` renderer | `ProductGroup` → `hasVariant` ([§ Product](#product--product-subtype-productgroup)) |

The second shape is the dangerous one: emitting a subtype-only property while the `itemtype`
stayed on the base is *invalid markup*, not merely unspecific. Gate it on the itemtype the
renderer **wrote**, which `contentColumn` threads down as the last argument to
`DETAILS[type](d, fields, parts, itemtype)` — not on a fresh `resolveItemtype(fields)`, which
on the flipside path resolves a different object than the one that produced the attribute.

**The value is allowlisted, never taken verbatim.** Two reasons, both load-bearing:

1. **Security.** The resolved string is interpolated into `itemtype="https://schema.org/…"`.
   Data must never reach an attribute value unfiltered — an allowlist is the only check that
   holds regardless of what the input looks like. (`esc()` still runs on top; that is the
   second layer, not the first.)
2. **Correctness.** Sharpening is only valid when the subtype really inherits the properties
   the renderer emits. Accepting an arbitrary name would emit markup asserting a type
   relationship that does not exist — worse than staying on the base type. A value that is not
   on its type's list is ignored and the base type is used; a value from *another* type's list
   is refused for the same reason.

Every entry below was verified against the schema.org vocabulary as a transitive subclass of
the base type. Add to a list only after checking the same.

| schemaType | Base itemtype | Allowed subtypes |
|---|---|---|
| `article` | `Article` | BlogPosting, TechArticle, APIReference, ScholarlyArticle, Report, SatiricalArticle, AdvertiserContentArticle |
| `business` | `LocalBusiness` | Restaurant, CafeOrCoffeeShop, Bakery, BarOrPub, FastFoodRestaurant, IceCreamShop, Winery, Brewery, Distillery, Store, Hotel, Resort, BedAndBreakfast, Motel, Hostel, Campground, BeautySalon, DaySpa, HealthClub, AutoRepair, AutoDealer, AutoRental, GasStation, Dentist, MedicalClinic, Pharmacy, Physician, RealEstateAgent, TravelAgency, Library, GovernmentOffice |
| `event` | `Event` | SportsEvent, MusicEvent, TheaterEvent, ScreeningEvent, ComedyEvent, DanceEvent, ExhibitionEvent, FoodEvent, LiteraryEvent, BusinessEvent, EducationEvent, ChildrensEvent, SocialEvent, SaleEvent, Festival, Hackathon, PublicationEvent, CourseInstance |
| `location` | `Place` | TouristAttraction, TouristDestination, LandmarksOrHistoricalBuildings, Accommodation, Apartment, House, SingleFamilyResidence, Room, Suite, Residence, ApartmentComplex, GatedResidenceCommunity, CivicStructure, Park, Beach, Campground, Church, Museum, Airport |
| `news` | `NewsArticle` | ReportageNewsArticle, OpinionNewsArticle, AnalysisNewsArticle, BackgroundNewsArticle, ReviewNewsArticle |
| `organization` | `Organization` | NGO, Corporation, OnlineStore, OnlineBusiness, EducationalOrganization, School, CollegeOrUniversity, GovernmentOrganization, NewsMediaOrganization, MedicalOrganization, ResearchOrganization, PerformingGroup, MusicGroup, SportsOrganization, SportsTeam, Airline, LibrarySystem, WorkersUnion, PoliticalParty, FundingScheme, Consortium, Project |
| `product` | `Product` | ProductGroup, ProductModel, IndividualProduct, Vehicle, Car, Motorcycle, Drug, DietarySupplement |
| `social` | `SocialMediaPosting` | DiscussionForumPosting, BlogPosting, LiveBlogPosting |

**Two values appear on two lists — `Campground` and `BlogPosting` — and they are the complete
set.** Both are deliberate: schema.org gives each of them two truthful parents.

**The choice never changes the `itemtype`.** Once a value is allowlisted the resolver returns
*the subtype*, so the base type never reaches the output — `Campground` under `business` and
under `location` both emit `itemtype="https://schema.org/Campground"`. What the choice changes
is which `DETAILS` renderer runs, and therefore **which properties the card carries**:

| Value | Pick this | …to also get | vs. the other spelling |
|---|---|---|---|
| `Campground` | `business` | `priceRange`, `telephone` | `location` emits the shared set only |
| `BlogPosting` | `social` | `name` + `text`, the platform as `publisher`, `details.author` as `author` | `article` emits `headline` + `description` |

So pick by the property set, not by the type name: `business` for a campground you want to
carry commercial properties, `location` for one you do not; `social` for a post that has a
platform or a `details.author` handle, `article` otherwise. Neither spelling is wrong in
either case, which is why nothing guards this.

Note the near miss: `Museum` is **only** a `CivicStructure`, never a `LocalBusiness`, so it
sharpens `location` and is absent from `business`.

`details.businessType` is the **legacy alias** — the business-only spelling that predates
`subtype`, kept working for existing content. `subtype` is the general spelling; prefer it in
new content. When both are present, `subtype` wins.

## The types

### Content — `CreativeWork` (fallback)

The plain envelope, no `details`: eyebrow, headline, summary, tags, actions, plus `links` — plain related-link rows (part `links`), deliberately not buttons. Unknown `schemaType` values fall back to this. A tag may be a string or `{name, url}` — the linked one renders an anchor inside the chip; an action with no `link.url` renders a real `<button>`.

### Article — `Article`

Envelope only: byline (author → `Person`), published date, reading time, engagement (`InteractionCounter`). The headline is a stretched `cover` link into the full article — the `data-view` names morph the card into [that page](../demo/articles/article.html) across the navigation (see [article.render.html](../demo/article.render.html)).

### News — `NewsArticle`

As Article, plus a “Breaking” `<ui-chip>` on the media and `dateModified`. Same `cover` link + `data-view` morph into [its full page](../demo/articles/news.html).

### Quote — `Quotation`

Envelope `summary` as `<ui-quote>` wrapping `<blockquote itemprop="text">` + author. Proposed part: `quote`.

### Product — `Product` (subtype `ProductGroup`)

Offer + AggregateRating, discount `<ui-sticker>`, save toggle. Proposed parts: `price`, `rating`.

**Variants — `ProductGroup`.** Google's *Product variants* rich result is **not a new card type**:
it is this type plus `details.subtype: "ProductGroup"` plus an optional `details.variants` block. A
variant group carries every property the plain product card already emits. Demo instance:
[`data/product-group.json`](../data/product-group.json).

```json
"details": {
  "subtype": "ProductGroup",
  "variants": {
    "variesBy": ["color", "size"],
    "productGroupID": "NL-COAT",
    "items": [{ "name": "…, Ivory, S", "url": "/gown?color=ivory&size=s", "sku": "PSG-01-IVY-S", "color": "Ivory", "size": "S", "price": 249, "currency": "USD", "availability": "Out of stock" }]
  }
}
```

Three points follow Google's live documentation rather than intuition:

1. **`variesBy` takes full schema.org URLs**, not bare property names — it references a property
   "through their full Schema.org URL (for example, `https://schema.org/color`)". Content authors
   write the bare name; the renderer prefixes it.
2. **`productGroupID` belongs to the group alone.** With nested `hasVariant` it "doesn't need to be
   repeated under the `Product` properties using `inProductGroupWithID`" — so the renderer never
   emits `inProductGroupWithID`. (That property is for the *unnested* form, which this engine does
   not produce.)
3. **Each variant needs its own `sku`** (or `gtin`) and carries the varying properties itself.
4. **Each variant needs a distinct URL.** Google: "The site must have the ability to preselect each
   variant directly with a distinct URL (using URL query parameters)… This allows Google to crawl
   and identify each variant." An optional `item.url` therefore renders as a **real `<a>` around
   the variant name**, not a `<meta>` — only a link is crawlable. Google's own example puts the URL
   on `offers.url`; the docs confirm individual `Product` entities may carry `url` too, and the
   Product level is where the anchor can wrap the variant's own name.

The axis vocabulary is an allowlist — `color`, `size`, `material`, `pattern` — and it is the **same
list on both sides**: what `variesBy` may name is exactly what an item may emit, and an item
property outside it is never turned into a `<meta>`. An axis a variant cannot carry would advertise
a property appearing nowhere in the markup, so unknown axes are dropped with their own comment:

```html
<!-- variesBy axes ignored: not one of color, size, material, pattern -->
```

(Google also documents `suggestedAge`/`suggestedGender`. They describe an audience rather than a
per-item property and the variant shape has no field for them — which is exactly why dropping them
needed a signal rather than silence.)

`item.price` is tested with `== null`, not truthiness: a free variant prices at **0**.

**The gate is the WRITTEN itemtype, never `details.subtype`.** `hasVariant`, `variesBy` and
`productGroupID` are `ProductGroup`-**only** properties. `details.subtype` and `details.variants`
are two independently typo-able fields that must agree, so nothing checks them against each other —
the renderer instead threads the itemtype it actually wrote on the enclosing scope down through
`contentColumn` into `DETAILS[type](d, fields, parts, itemtype)`, and gates on
`itemtype === 'ProductGroup'`.

**Threading it beats re-deriving it**, and `<ui-reveal>` is why. A reveal's back panel renders the
*flipside's* content column into the **host's** itemscope — one scope, two content objects. A gate
that called `resolveItemtype(fields)` for itself would consult the flipside's fields, whose itemtype
was never written anywhere: an `article` host with a `ProductGroup` flipside emitted `hasVariant`
under `itemtype="…/Article"`. Threading the written value makes the gate literally what this
paragraph claims, on every path, so no input can hang these properties on a non-`ProductGroup`
scope.

⚠️ **The itemscope sharing itself is broader than this one property, and is not fixed.** Any
flipside renders its `DETAILS` into the host's scope, so an `article` host with a plain `product`
flipside still emits `itemprop="offers"` under `Article`. `ProductGroup` is the sharpest instance —
`hasVariant` on a `Product` is *invalid*, where a stray `offers` on an `Article` is merely ignored —
and the `itemtype` parameter now threaded through `contentColumn` is the seam a general fix would
use. Until then, prefer a flipside whose type matches its host.

When `variants` is present but the scope is not a group, the block is dropped — but **not
silently**: a fixed comment takes its place, so an author whose variants vanished can see why in
view-source instead of guessing. It names the *itemtype*, not `details.subtype`, because the
itemtype is what the gate consults — and on the flipside path the subtype and the itemtype belong
to two different objects.

```html
<!-- variants ignored: itemtype did not resolve to ProductGroup -->
```

The comment is a fixed string with no interpolated data, and it ships only in the mis-authored
case. It is the loudest signal available to a pure string function with no error channel: `render.js`
degrades rather than throws, so raising here would be a new failure mode for one authoring slip.

### Event — `Event`

Standard column layout with a participate CTA. Location → `Place` → `PostalAddress`, organizer → `Organization`.

### Recipe — `Recipe`

Ingredients as proposed part `list`; instructions as a nested `<ui-accordion>` with `HowToStep` items.

### Review — `Review`

Summary emits `reviewBody`; rating → `Rating`, reviewer → `Person` (`reviewer.title` → `jobTitle`), reviewed item → `Product` by default. `details.reviewedType` sharpens `itemReviewed` to `Organization` or `Service` (allowlisted, never verbatim data — same pattern as [`subtype`](#subtypes)); no offer is emitted for `Organization`, which has no `offers` property.

**Testimonial** — schema.org has no `Testimonial` type; a testimonial is a `Review` of your organization or service: `reviewedType: "Organization"`, a 5-star rating, quote and byline, usually media-less (the `testimonial` preset, which also tints the stars via `--ui-rating-c`). Note Google excludes "self-serving" reviews — testimonials about your own org on your own site stay valid microdata but get no star rich results.

### Job — `JobPosting`

Headline emits `title`. Salary → `MonetaryAmount` → `QuantitativeValue`; requirements/benefits in a nested `<ui-accordion>`. The card also carries a **second top-level item** — see [Employer rating](#employer-rating--employeraggregaterating).

### Course — `Course`

`timeRequired`/`educationalLevel` metas; the teacher is `CourseInstance.instructor` → `Person` (`Course.provider` is the *organisation*, so naming the instructor there misdeclares both), `courseWorkload` rides the same instance; offer uses part `price`.

### Booking — `Reservation`

Service → `reservationFor`, venue → `provider`, hourly rate with `totalPrice`/`priceCurrency` metas.

### Poll — `Question`

Proposed part `options`: each answer is a `<label>` + `<progress>`, emitted as `suggestedAnswer` → `Answer`.

### Profile — `Person`

Square portrait, skills as `tags`, contact links as `contactPoint`.

### FAQ — `FAQPage`

The type that moves *out* of `<ui-content>` parts: a nested `<ui-accordion>`, each item `mainEntity` → `Question` / `acceptedAnswer` → `Answer`.

### Timeline — `EventSeries`

Part `timeline` — styled by `@browser.style/timeline`: a dot per entry on a continuous rail. Each entry is `subEvent` → `Event`. Add `variant="horizontal"` for the inline rail (second card). Colour a single entry with `data-theme="accent"` (the `theme=` palette names) or an arbitrary `data-fill="#c9b8ff"` — `data-` prefixed, because a bare attribute is invalid on a built-in `<li>`. A coloured dot is filled; in `variant="minimal"` the bullets default to the rail grey; in `variant="horizontal"` plain dots are open rings (transparent centre, rail stops at the dot edge) — only a `data-theme`/`data-fill` entry fills.

### Gallery — `ImageGallery`

Multiple media items become a carousel — `nav(mrk)` — each image carrying `itemprop="image"`.

### Statistic — `Observation`

Proposed part `stat`: big number + unit + trend, value → `QuantitativeValue`.

### Achievement — `EducationalOccupationalCredential`

Status `<ui-chip>` (a burst sticker clips long words), issuer → `recognizedBy`, hidden `dateCreated`/`expires`/`identifier` metas.

### Announcement — `SpecialAnnouncement`

Dark theme; priority as a hue-mapped `<ui-chip>` (low=gray · medium=orange · high/critical=red); audience → `Audience`.

### Business — `LocalBusiness` (subtype `CafeOrCoffeeShop`)

Part `address` (`PostalAddress` scope), geo metas, opening hours (flat `openingHours` + structured `OpeningHoursSpecification`), rating, price range and a map CTA. `details.subtype` (or its legacy alias `details.businessType`) sharpens the itemtype to an allowlisted `LocalBusiness` subtype — see [Subtypes](#subtypes). The hours `<dl>` renders with `tabular-nums` so times align column-wise, and day/time ranges use en dashes (`Mon–Fri`, `9:00–17:00`) — both derived from the machine string by `hoursRow()`.

### Comparison — `ItemList`

Items as `ListItem` with position metas; recommendation in the footer.

### Contact — `ContactPoint`

`contactType`/`hoursAvailable` metas, one `availableLanguage` per language (a list, not a joined string); department and response time ride the meta row. Each method is a real `mailto:`/`tel:` link.

### Location — `Place`

Overlay over a destination shot; address + geo, amenities as `list`, hours in the tabular `hours` part. **Place-only hours:** the flat `openingHours` string is a `LocalBusiness`/`CivicStructure` property, so a plain `Place` emits *only* `openingHoursSpecification` (business and organization offices emit both).

### Membership — `Offer`

Dark theme, `PriceSpecification`, features as check-`list` with the excluded ones as a `crossed` list. `details.isPopular` renders the promotional chip — a state, so it keeps the eyebrow free for the actual category.

### Social — `SocialMediaPosting`

Byline + post text as `quote` part, hashtags as tags, engagement as three `InteractionCounter`s.
The demo page carries the type twice: a plain post, and a forum thread sharpened to
`DiscussionForumPosting` via [`details.subtype`](#subtypes) — same parts, plus **two**
additions: an eyebrow for the board with reply/view counters instead of likes and shares, and a
**headline**, which the plain post does not have. The headline is not cosmetic: Google documents
`headline` as the title property for `DiscussionForumPosting` and states it "is not recommended
for a `SocialMediaPosting`", so the forum spelling emits `itemprop="headline"` while the plain
post keeps `itemprop="name"`. Its view counter is a `ViewAction` for the same reason — see
[§ Subtypes](#subtypes).

### Software — `SoftwareApplication`

Standard column card — media on top, specs, developer and offer below. Microdata sits on the card root.

### Organization — `Organization`

The multi-office shape: HQ address, employees, `sameAs` — and each local office as `department` → `LocalBusiness` (part `office`) with its own address, phone and **per-day opening hours** in the tabular `hours` part (a two-column `<dl>`). Each row carries both the flat `openingHours` string and a structured `OpeningHoursSpecification`, so single days (`Th 09:00-16:00`) and ranges (`Mo-We 09:00-17:00`) both work.

### Video — `VideoObject`

The card ROOT is the VideoObject, so media facts (`contentUrl`, `thumbnailUrl`, `uploadDate`, `duration`) emit as root-level props — no nested `video` scope. Eyebrow → `genre`, published → `uploadDate`.

### How-to — `HowTo`

Recipe's sibling: supplies/tools as part `list` (`HowToSupply`/`HowToTool`), steps as a nested `<ui-accordion>` of `HowToStep`, plus `totalTime` and `estimatedCost` → `MonetaryAmount`.

### Q&A — `QAPage`

Distinct from FAQ: one `mainEntity` → `Question` with community answers as `<ui-quote>` (third-party voice, same convention as review/social) — accepted answer first (green `<ui-chip>`), then by votes; `acceptedAnswer` / `suggestedAnswer` → `Answer` with author and `upvoteCount`.

### Podcast — `PodcastEpisode`

Episode metas plus hidden `partOfSeries` → `PodcastSeries`. The episode audio is a chromeless `<audio>` inside `<ui-media>` (scoped `associatedMedia` → `AudioObject`) — the poster stays the visual, and `<ui-play>` drives playback via `command="--play-pause"` (video.js polyfills the media invoker commands until browsers ship them).

### Movie — `Movie`

Director and cast as `Person` scopes, `contentRating`, release date and an `AggregateRating` star row. Eyebrow → `genre`.

### Book — `Book`

Author byline leads (photo via `<ui-avatar>`); then facts, rating, `Offer` — publisher is the colophon. `isbn`, pages, allowlisted `bookFormat` (schema.org `BookFormatType`).

The *visible* ISBN carries a WORD JOINER (U+2060) after each hyphen: iOS Safari's data detectors otherwise read the digit run as a phone number and link it `tel:`. The joiner breaks the pattern's contiguity, is invisible, and stops the ISBN wrapping mid-number; the machine value in `<meta itemprop="isbn">` stays raw. The renderer emits this from `book()`; hand-authored pages use the `&#8288;` entity (see demo/schema.html) and can add `<meta name="format-detection" content="telephone=no">` as a page-level belt — explicit `tel:` anchors keep working either way.

### Dataset — `Dataset`

License, temporal/spatial coverage and `variableMeasured` metas; each download is `distribution` → `DataDownload` with `encodingFormat` + `contentUrl` on the button. `temporalCoverageDisplay` carries the human range ("Jan 2019 – Dec 2025", en dash) — the machine meta keeps the ISO 8601 slash interval.

### Fact check — `ClaimReview`

The verdict chip leads — it is the answer (`reviewRating` → `Rating`, `alternateName` visible, hue from the rating value); the quoted claim (`claimReviewed`) follows.

## Types authored markup-first

The eleven types below — plus `EmployerAggregateRating` on the job card — were authored **markup
first**: `demo/schema.html` was the specification and `render.js` was written to reproduce it, not
the other way round. They now have a `schemaType` key, a `DETAILS` renderer and an instance in
`data/`, and the transcription was verified by a mechanical comparator rather than by eye — eleven
of the twelve reproduce their reference card exactly. Every `itemprop` below was checked
mechanically against the schema.org vocabulary dump (`domainIncludes` walked up the
`rdfs:subClassOf` chain).

**Two page conventions the renderer does not reproduce**, both pre-dating these types and visible
on every card: the page hoists `media=` onto `<ui-card>` where the renderer emits it on
`<ui-media>`, and it places the machine `<meta>` block *above* the eyebrow where the renderer emits
it after the summary (`DETAILS` runs after the envelope and has no hook to reorder). The comparator
normalises both on both sides; nothing else is allowed to differ.
Run it with `node ui/card/schema.compare.js` ([`schema.compare.js`](../schema.compare.js)); eleven
of the twelve are an exact match, and the job card's three residual lines are older data/renderer
divergences it shares with `job.json`, not anything the employer rating introduced.

**Where a scope needs several rows** (`mainEntity`, `hasOfferCatalog`, `about`) it wraps them in a
bare `<div itemscope>`. That div is grouping, not a box: `content.css` gives
`ui-content > div[itemscope]:not([data-part], [hidden])` `display: contents` so its rows join the
column's flex gap instead of collapsing to zero. The `:not([hidden])` arm matters — `display:
contents` would otherwise defeat the hidden metadata scopes.

**Ordered or unordered is data, not a type constant.** These cards introduce the page's first
`<ol data-part="list">` — album tracks and TV seasons ascend, so ordinal markers are true — while
podcast episodes stay `<ul>` because they descend and markers would lie. `details.ordered` carries
the switch; each type defaults to the direction it usually runs in.

**Two conventions the SSR engine fixes for you.** ISO durations are written **unpadded**
(`PT39M2S`, not `PT39M02S`); both parse, and the shorter form is the one not to enshrine. And
`Intl` separates an *alphabetic* currency code from its amount with **U+00A0** (`DKK 145`), so the
code cannot wrap away from the number — invisible in a browser, and invisible to a
whitespace-normalising diff, so `render.test.js` pins it explicitly.

**Prose in these fields is plain text.** `render.js` escapes every interpolated value and re-allows
only `<b>`, `<ui-gradient-text>` and `<high-light>`, and only in the headline and body. Two strings
here originally carried an `<em>` and a `<code>`; they are now unmarked, because a reference the
renderer provably cannot reproduce is not a reference. Widening that allowlist is the alternative
if inline markup in `details` prose ever becomes worth the security surface.

They reuse the existing `data-part` vocabulary unchanged — no new part was needed. Where a scope
needs several rows (`mainEntity`, `hasOfferCatalog`, `about`), it wraps them in a bare `<div>`,
which is the shape the `QAPage` card already uses for `mainEntity` → `Question`.

### Loyalty programme — `MemberProgram`

The loyalty **scheme**, deliberately placed next to the [`Offer`](#membership--offer) membership
card, which is a subscription **price**. Both are "membership" in English; neither is the other.

`MemberProgram` owns exactly two properties — `hasTiers` and `hostingOrganization`; the visible
copy is all `Thing` (`name`, `description`, `url`, `image`). Each tier is a `<details>` in a
`<ui-accordion>` carrying `hasTiers` → `MemberProgramTier`:

- `hasTierBenefit` accepts **`TierBenefitEnumeration` members only**, and the complete set is four:
  `TierBenefitLoyaltyPoints`, `TierBenefitLoyaltyPrice`, `TierBenefitLoyaltyReturns`,
  `TierBenefitLoyaltyShipping`. One URL-valued `<meta>` per benefit, same spelling as `availability`.
  ⚠️ **All four are valid schema.org; Google reads only two** — `TierBenefitLoyaltyPoints` and
  `TierBenefitLoyaltyPrice`. A tier whose *only* benefits are Returns/Shipping is ineligible, so
  every tier here leads with a supported value and the renderer keeps all four in its allowlist.
- `hasTierRequirement` is polymorphic — free text on Blue, a nested `MonetaryAmount` on Silver and
  Gold. Both are legal (`CreditCard` / `MonetaryAmount` / `Text` / `UnitPriceSpecification`).
- `membershipPointsEarned` belongs to the **tier**, and sits inside the `<summary>`: `<summary>`
  must be the first child of `<details>`, so a `<meta>` cannot precede it.

**Google** (loyalty program, live since June 2025) requires `name`, `description` and `hasTiers`
on the programme and `name` + `hasTierBenefit` on every tier — all satisfied — plus the
recommended `url`, `hasTierRequirement` and `membershipPointsEarned`, also all present. Google
lists `url` as recommended on **each `MemberProgramTier`** as well as on the programme; the
renderer takes `tiers[].url` for that, and these three demo tiers simply have no per-tier page.
⚠️ **Placement differs from this card.** Google wants the programme nested under the site's
`Organization` via `hasMemberProgram`, and member *prices* on product pages as
`Offer.priceSpecification` → `UnitPriceSpecification` with `validForMemberTier` pointing at a
tier's `@id`. When the programme is the card's own subject that link can only run the other way,
so the card emits `hostingOrganization` → `Organization` instead.

### Quiz — `Quiz` (two cards, one type, different eligibility)

`Quiz` has *no properties of its own* — it is a `LearningResource`, and everything comes from
there or from `CreativeWork`. ⚠️ **`eduQuestionType` is a property of `Question`, not of `Quiz`**
(its domain is `Question` and `SolveMathAction`).

The thing that makes two cards out of one type: **`Question` accepts `suggestedAnswer` and
`acceptedAnswer` at the same time**, so three shapes exist and the page shows all three.

| shape | properties on the `Question` | interaction | card |
|---|---|---|---|
| Flashcard | one `acceptedAnswer` | reveal | Quiz — *flashcards* |
| Multiple choice | several `suggestedAnswer` **+** one `acceptedAnswer` | select, then check the key | Quiz — *check yourself* |
| Poll | several `suggestedAnswer`, no accepted one | select, see results | the [`Question` card](#poll--question) |

**Read the eligibility difference before copying either.** The two Quiz cards are markup siblings
with *opposite* rich-result status, and nothing in the markup says so:

- **Flashcards are Google-eligible.** Education Q&A is live and still expanding by language.
  `eduQuestionType: "Flashcard"` is required — any other value makes the card ineligible. Google
  requires only `hasPart`; `about` → `Thing` and `educationalAlignment` → `AlignmentObject` are
  recommended, and Google reads just two of `AlignmentObject`'s properties, `alignmentType` and
  `targetName`. Both are here. `learningResourceType: "Flashcard"` is valid `LearningResource`
  vocabulary that Google never mentions — semantic value only, not a requirement.
- **Multiple choice has no live rich result.** It is the shape Google's *Practice Problems* feature
  consumed (`eduQuestionType: "Multiple choice"`, `learningResourceType: "Practice problem"`), and
  that feature was **retired in January 2026**; the documentation page now redirects to Education
  Q&A. The **markup is not deprecated** — `eduQuestionType` is core schema.org, which documents
  exactly three spellings ("Multiple choice", "Open ended", "Flashcard"). We keep the card for the
  same reason we keep `FAQPage`, `HowTo` and `ClaimReview`: see
  [the type-expansion plan § Deprecated rich results](../../../docs/plans/2026-08-13-schema-type-expansion.md)
  — SERP features are one consumer among several.

**In the renderer**, `details.format` picks the shape — `flashcard` or `multiple-choice` — and it
is deliberately **explicit rather than inferred** from whether questions carry options: the same
`details` shape must not silently produce a flashcard when the author meant a graded question. An
unrecognised format falls back to `flashcard`, and options under an ungraded deck are dropped with
an HTML comment, the same loud-skip discipline as [`ProductGroup` variants](#product--product-subtype-productgroup).

The graded card marks the correct option with a visible **answer key** (a `pale green` chip) rather
than hiding it behind a `<details>`. Two reasons: the cards are CSS-only with no JS to grade with,
and the flashcard deck already owns the reveal idiom — reusing it here would blur exactly the
distinction the pair exists to draw. Options reuse the poll card's `options` part unchanged: one
`<input type="radio" class="--check">` per answer, one shared `name` per question (the renderer
slugs it from the deck headline, so two graded decks on a page cannot share a group).

### Service — `Service`

`serviceType`, `provider` → `Organization`, `areaServed` → `Place`. The catalogue is
`hasOfferCatalog` → `OfferCatalog` → `itemListElement` → `Offer` → `itemOffered` → `Service`:
`OfferCatalog` is an `ItemList`, so `itemListElement` is the nesting property. The scope is a bare
`<div>` around the `<ul data-part="list">` because a `<meta itemprop="name">` cannot be a child of
`<ul>`. `availableChannel` → `ServiceChannel` wraps the actions row — ⚠️ **`servicePhone` expects a
`ContactPoint`, not a phone string**, so the `tel:` link carries `telephone` inside that scope,
while `serviceUrl` sits directly on the CTA.

### Real estate — `RealEstateListing`

Two structural traps, both worth knowing before writing a renderer:

1. **It is a `WebPage` subtype.** The home is not the card's subject; it hangs off `mainEntity` →
   `Apartment` (or `House` / `SingleFamilyResidence` / `Accommodation`), which carries `floorSize`
   → `QuantitativeValue` (`unitCode` `MTK`), `numberOfBedrooms`, `numberOfBathroomsTotal`,
   `numberOfRooms`, `yearBuilt`, `floorLevel`, `petsAllowed`, `address` → `PostalAddress` and
   `amenityFeature` → `LocationFeatureSpecification` (`name` + boolean `value`).
2. ⚠️ **`offers` is not valid on `Accommodation`, `Place` or `Residence`.** Its domain is
   `AggregateOffer`, `CreativeWork`, `EducationalOccupationalProgram`, `Event`, `MenuItem`,
   `Product`, `Service`, `Trip` — so the price rides the **listing** (a `CreativeWork`), *outside*
   the `mainEntity` scope. Putting it on the residence is invalid markup, not merely unread.

`datePosted` and `leaseLength` are the listing's only two own properties. Note also that
`SingleFamilyResidence` descends from `House` → `Accommodation`, **not** from `Residence`.

### Menu — `Menu`

Sections are `<details>` in a `<ui-accordion>` — `hasMenuSection` → `MenuSection` — each holding a
`<ul data-part="list">` of `hasMenuItem` → `MenuItem`. ⚠️ **`MenuItem` is an `Intangible`**, while
`Menu` and `MenuSection` are `CreativeWork`s; the split matters because `MenuItem` gets `offers`,
`nutrition` and `suitableForDiet`, none of which the two containers have.

`suitableForDiet` takes `RestrictedDiet` members by URL (11 of them: `DiabeticDiet`,
`GlutenFreeDiet`, `HalalDiet`, `HinduDiet`, `KosherDiet`, `LowCalorieDiet`, `LowFatDiet`,
`LowLactoseDiet`, `LowSaltDiet`, `VeganDiet`, `VegetarianDiet`) — every visible `<ui-chip>` has a
matching `<meta>`, so a reader never sees a claim the markup does not make. The converse does not
hold and need not: a dish may declare more diets than it advertises (the cabbage is both vegetarian
and gluten-free but only chips the first). `nutrition` →
`NutritionInformation` is hidden; its `calories` is an `Energy` and `servingSize` is **`Text`**,
so both are written as unit-bearing strings ("620 calories", "1 bowl"). A restaurant links to a
menu with `hasMenu` (`menu` is the older synonym) — **no card on this page demonstrates that link**,
because the menu is its own card subject here rather than a property of the café card above it.

### TV series — `TVSeries`

`numberOfSeasons`, `numberOfEpisodes`, `startDate` (from `CreativeWorkSeries`), `contentRating`,
`aggregateRating`, `director` → `Person` and one `actor` scope per name — `actor` accepts
`Person` **or** `PerformingGroup`. Seasons are `containsSeason` → `TVSeason` list items, each with
its own `seasonNumber` and `numberOfEpisodes`; the property's range is `CreativeWorkSeason`, which
`TVSeason` satisfies. Do not emit the superseded `actors` / `episodes` / `seasons` spellings.

### TV episode — `TVEpisode`

`TVEpisode` adds almost nothing of its own — `episodeNumber`, `partOfSeason` → `TVSeason`,
`partOfSeries` → `TVSeries` and `duration` are all inherited from **`Episode`**, so a renderer that
looks them up on `TVEpisode` will not find them documented there. `duration` is an ISO 8601
`Duration` literal (`PT58M`). The series and season are hidden scopes; the visible eyebrow
(`Nordlight · S3 E4`) is prose. Same shape as [Podcast](#podcast--podcastepisode), which is also an
`Episode`.

### Health — `MedicalWebPage`

`MedicalWebPage` owns exactly one usable property, `medicalAudience` (the other, `aspect`, is
superseded by `mainContentOfPage`). ⚠️ **`specialty`, `reviewedBy` and `lastReviewed` are `WebPage`
properties** that `MedicalWebPage` merely inherits — `specialty` takes a `Specialty`, and
`MedicalSpecialty` members (`PrimaryCare`, `Psychiatric`, `Cardiovascular`…) qualify.
`medicalAudience` accepts the **type** `MedicalAudience` (subtype `Patient` — used here) or the
**enumeration** `MedicalAudienceType`, whose only two members are `Clinician` and
`MedicalResearcher`; they are different things with confusingly similar names.

`about` → `MedicalCondition` carries `signOrSymptom` → `MedicalSignOrSymptom`, `riskFactor` →
`MedicalRiskFactor` and `possibleTreatment` → `MedicalTherapy` (`Drug` and `MedicalProcedure` are
the other two `about` shapes). **The `reviewedBy` byline is visible markup, never a hidden
`<meta>`:** it is the E-E-A-T signal, and a signal a reader cannot see is not one. Google has no
medical rich result — this markup is semantic value only.

### Album — `MusicAlbum`

`byArtist` → `MusicGroup` in the `subheadline` part, `numTracks`, `datePublished`, plus the two
enumerations `albumProductionType` (`StudioAlbum`) and `albumReleaseType` (`AlbumRelease`).
Tracks are `track` → `MusicRecording` in an `<ol data-part="list">`, each with `position` (valid:
its domain is `CreativeWork`, which `MusicRecording` is) and an ISO `duration`. `numTracks` and
`track` come from `MusicPlaylist`, the album's parent — `tracks` is superseded. **`numTracks`
derives from the track list** unless `details.numTracks` states otherwise: a hand-kept count goes
stale silently (this card once said nine over four rows), and the field survives only so a partial
listing can still name the album total.

### Glossary — `DefinedTermSet`

`hasDefinedTerm` → `DefinedTerm` per `<details>`: `name` in the summary, `description` in the
panel, `termCode` as the slug. `DefinedTerm` is an **`Intangible`**, `DefinedTermSet` a
`CreativeWork`; both are `pending.schema.org`, stable enough to ship but not core vocabulary.
`about` → `Thing` names the domain the set belongs to.

### Podcast series — `PodcastSeries`

The series as the card's subject — the [podcast card](#podcast--podcastepisode) is one episode with
a nested series. `webFeed` (range `DataFeed` or `URL`) rides a real `<a href>` so the feed is
crawlable, `author` → `Person` is the visible host byline, and episodes are `hasPart` →
`PodcastEpisode` in a `<ul>` — newest first, so ordinal markers would misnumber them.

⚠️ **There is no episode-count property.** `numberOfEpisodes` is used on `CreativeWorkSeason`,
`RadioSeries`, `TVSeries` and `VideoGameSeries` — `PodcastSeries` and `CreativeWorkSeries` are not
in its domain. The count ("42 episodes since 2022") is therefore prose in the `meta` and `footer`
parts, and the machine-readable answer is the `hasPart` cardinality. `startDate` comes from
`CreativeWorkSeries`.

### Employer rating — `EmployerAggregateRating`

Not a card: a **second top-level item inside the [job card](#job--jobposting)** — an element with
`itemscope itemtype` and **no `itemprop`**, which is what makes microdata treat it as its own item
rather than a property of the enclosing `JobPosting`. `itemReviewed` → `Organization` is the
hiring company (the same `Nordlys ApS`). `ratingValue` is required and Google's wording for the
count is "**at least one of `ratingCount` or `reviewCount`**"; `bestRating` / `worstRating` are
recommended and default to 5 / 1. The `itemReviewed` scope is `hidden`: a machine-only scope is
still a flex item and would otherwise consume a gap slot, indenting the star row against every
other rating row on the page.

**Why not `aggregateRating` on the `JobPosting`:** the rating is of the *employer*, not of the
posting, and Google's `JobPosting` documentation does not list `aggregateRating` among the
supported properties at all — a nested rating is simply ignored. Google's own example is a
standalone top-level item, and it requires the rating to be **visible** to the reader ("It must be
immediately obvious to users that the page has rating content"), which is why the card renders a
real star row rather than hidden `<meta>`s. Google states no explicit prohibition on nesting; the
separate-item shape follows from its example and its property list, not from a rule.

