# Schema.org cards — type-by-type notes

> Companion to [`demo/schema.html`](../demo/schema.html) — the hand-authored reference markup
> for all 34 schema.org card types (the markup `render.js` reproduces). The intro prose, the
> per-type notes and the structured-part vocabulary used to live inline on that page; they moved
> here so the demo stays one card grid.

Every card type from the legacy `content/card` package — plus the nine types added in model
v1.3 (organization, video, howto, qa, podcast, movie, book, dataset, claim) — re-created with
the modern engine: `<ui-card>` + `<ui-media>` + `<ui-content>`, with satellites `<ui-chip>`,
`<ui-sticker>`, `<ui-save>`, `<ui-avatar>`, `<ui-quote>` and `<ui-accordion>`. Every card uses
the same composition: media on top, text below. Structured data is inline **microdata**
(`itemscope`/`itemtype`/`itemprop` + hidden `<meta>` values) — no JSON-LD. The single script on
the page is optional: `video.js` polyfills the proposed media invoker commands
(`command="--play-pause"`) behind the podcast play button; every card renders identically
without it. Each media frame also carries a `<ui-chip data-type>` naming the card's schema.org
type — a demo affordance, emitted by `render.js` only when `renderCard` gets `{ typeChip: true }`.

## Structured `data-part` vocabulary

The eleven parts the typed cards add on top of the envelope. All are **styled** in [`content.css`](../content.css) — this page is the reference markup `render.js` follows, not a wish list. Envelope parts carry the rest: `eyebrow`, `headline`, `subheadline`, `summary`, `meta` (salaries, specs, dates), `byline` + `byline-who` + `dateline` (people), `tags`, `actions` and `footer` (totals, recommendations). `caption` belongs to the media frame — see [media.html](../demo/media.html).

| data-part | Element | Purpose | Used by |
|---|---|---|---|
| `price` | `<p>` + `<data>`/`<del>`/`<ui-chip>` | Price row (Offer / MonetaryAmount microdata), currency-formatted | product, job, course, booking, membership, software, book |
| `rating` | `<div>` + readonly `.ui-rating` + `[data-sr]` label + count | Star rating (AggregateRating / Rating) | product, review, business, movie, book |
| `list` | `<ul>` / `<ol>`; marker via `--ui-content-list-marker`, `data-variant="crossed"` for excluded items | Ingredients, qualifications, features, amenities, answers | recipe, job, course, booking, location, membership, how-to, Q&A, dataset |
| `links` | `<ul>` of plain link rows | Related links — the envelope `links[]`, deliberately not buttons | any type |
| `address` | `<address>` of stacked lines | Postal address (PostalAddress scope); a 2-letter country code stays machine-only | business, location, organization |
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

### Product — `Product`

Offer + AggregateRating, discount `<ui-sticker>`, save toggle. Proposed parts: `price`, `rating`.

### Event — `Event`

Standard column layout with a participate CTA. Location → `Place` → `PostalAddress`, organizer → `Organization`.

### Recipe — `Recipe`

Ingredients as proposed part `list`; instructions as a nested `<ui-accordion>` with `HowToStep` items.

### Review — `Review`

Summary emits `reviewBody`; rating → `Rating`, reviewer → `Person` (`reviewer.title` → `jobTitle`), reviewed item → `Product` by default. `details.reviewedType` sharpens `itemReviewed` to `Organization` or `Service` (allowlisted, never verbatim data — same pattern as [`subtype`](#subtypes)); no offer is emitted for `Organization`, which has no `offers` property.

**Testimonial** — schema.org has no `Testimonial` type; a testimonial is a `Review` of your organization or service: `reviewedType: "Organization"`, a 5-star rating, quote and byline, usually media-less (the `testimonial` preset, which also tints the stars via `--ui-rating-c`). Note Google excludes "self-serving" reviews — testimonials about your own org on your own site stay valid microdata but get no star rich results.

### Job — `JobPosting`

Headline emits `title`. Salary → `MonetaryAmount` → `QuantitativeValue`; requirements/benefits in a nested `<ui-accordion>`.

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
`DiscussionForumPosting` via [`details.subtype`](#subtypes) — same parts, an eyebrow for the
board and reply/view counters instead of likes and shares.

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

