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

Summary emits `reviewBody`; rating → `Rating`, reviewer → `Person`, reviewed item → `Product`.

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

Part `timeline` — styled by `@browser.style/timeline`: a dot per entry on a continuous rail. Each entry is `subEvent` → `Event`. Add `variant="horizontal"` for the inline rail (second card). Colour a single entry with `data-theme="accent"` (the `theme=` palette names) or an arbitrary `data-fill="#c9b8ff"` — `data-` prefixed, because a bare attribute is invalid on a built-in `<li>`. A coloured dot is filled; in `variant="minimal"` the bullets default to the rail grey.

### Gallery — `ImageGallery`

Multiple media items become a carousel — `nav(mrk)` — each image carrying `itemprop="image"`.

### Statistic — `Observation`

Proposed part `stat`: big number + unit + trend, value → `QuantitativeValue`.

### Achievement — `EducationalOccupationalCredential`

Status `<ui-chip>` (a burst sticker clips long words), issuer → `recognizedBy`, hidden `dateCreated`/`expires`/`identifier` metas.

### Announcement — `SpecialAnnouncement`

Dark theme; priority as a hue-mapped `<ui-chip>` (low=gray · medium=orange · high/critical=red); audience → `Audience`.

### Business — `LocalBusiness` (subtype `CafeOrCoffeeShop`)

Part `address` (`PostalAddress` scope), geo metas, opening hours (flat `openingHours` + structured `OpeningHoursSpecification`), rating, price range and a map CTA. `details.businessType` sharpens the itemtype to an allowlisted `LocalBusiness` subtype.

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

### Dataset — `Dataset`

License, temporal/spatial coverage and `variableMeasured` metas; each download is `distribution` → `DataDownload` with `encodingFormat` + `contentUrl` on the button.

### Fact check — `ClaimReview`

The verdict chip leads — it is the answer (`reviewRating` → `Rating`, `alternateName` visible, hue from the rating value); the quoted claim (`claimReviewed`) follows.

