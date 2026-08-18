# Schema.org cards — type-by-type notes

> Companion to [`demo/schema.html`](../demo/schema.html) — the hand-authored reference markup
> for every schema.org card type (the markup `render.js` reproduces). The intro prose, the
> per-type notes and the structured-part vocabulary used to live inline on that page; they moved
> here so the demo stays one card grid.

**Four counts, four different quantities — do not conflate them.** The page carries **57
cards** with **51 distinct root itemtypes**; a structured-data validator reports **59 items**;
the renderer knows **50 `schemaType` keys**.

| Count | What it measures | Reproduce it |
|---|---|---|
| **57** | card hosts on the page — `<ui-card>` plus the one `<ui-reveal>` | `grep -oE '<ui-(card\|reveal)[^>]*itemtype="[^"]*"' ui/card/demo/schema.html \| grep -vc 'itemprop='` |
| **59** | top-level microdata items — **what schema.org's validator reports** | `grep -o '<[a-z-]*[^<>]*itemscope[^<>]*>' ui/card/demo/schema.html \| grep -v 'itemprop=' \| grep -c 'itemtype='` |
| **51** | distinct root `itemtype` values | `grep -oE '<ui-(card\|reveal)[^>]*itemtype="[^"]*"' ui/card/demo/schema.html \| grep -v 'itemprop=' \| grep -o 'itemtype="[^"]*"' \| sort -u \| wc -l` |
| **50** | `schemaType` keys `render.js` supports (`SCHEMA_TYPES`) | `node -e "import('./ui/card/render.js').then(m => console.log(Object.keys(m.SCHEMA_TYPES).length))"` |

The flashcard Quiz is the page's one **`<ui-reveal>`** host rather than a `<ui-card>` — a
question on the front face, its answer on the flipside, which is what a flashcard actually is.
It counts identically in every column below; only the element differs.

**Items ≠ cards.** A validator counts every *top-level* item — an `itemscope` with no `itemprop`
of its own — so it sees the 57 cards plus **two items that are not cards**: the standalone
`EmployerAggregateRating` on the job card, and the page-level `WebSite` (site identity plus the
sitelinks-searchbox `potentialAction`, which describes the *site*, not any card on it) — 59. Nested scopes (`author` → `Person`, `offers` → `Offer`, …) are properties of their
parent, not items, and are not counted. The `grep -c 'itemtype='` on the end of that command is
load-bearing: without it the page's own `<meta name="description">` is counted, because its text
mentions "itemscope/itemtype" — that is how a naive scan reports 57.

**Cards ≠ types.** `Quiz` runs three cards, and `Review`, `EventSeries`, `Place` and `Person`
run two each — so 57 − 2 − 4 = 51. The `grep -v itemprop=` in those commands is load-bearing: the
collage `ProductGroup` nests a `<ui-card>` per variant, and a nested card is a **property** of
its parent item, not a card of its own. Note the second `grep` in that command: **reduce to the `itemtype=`
substring before `sort -u`**. Uniquing the whole `<ui-card …>` match counts one type twice
whenever its two cards differ in any other attribute (an `id`, a `style`) — that is how this
count once read 50.

**Types ≠ renderer keys.** The 51 is the **49** distinct base itemtypes behind the 50
`schemaType` keys (`profile` and `artist` both resolve to `Person`), minus `LocalBusiness` (never
shown plain — the business card is always sharpened), plus the three sharpened [subtypes](#subtypes)
`ProductGroup`, `CafeOrCoffeeShop` and `DiscussionForumPosting`, which `details.subtype` produces
with no key of their own. Two further types appear as **top-level items that are not cards**
(`itemscope`, no `itemprop`) and so are outside all three card counts: `EmployerAggregateRating`
on the job card, and the page-level `WebSite`. Neither has a renderer key — `WebSite` is authored
markup only, because it describes the page's site rather than any content instance.

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

## Page structure — ten sections, and where the heading level comes from

The page groups its 57 cards into **eleven sections by what the thing *is*** — Editorial &
journalism · Commerce & offers · Screen · Audio · Page & picture · Learning & reference ·
People, work & history · Food & drink · Places, events & property · Community & support ·
Data, health & operations. Each section is a bare `<h2>` followed by its own
`<lay-out md="columns(2) items(start)">`. Rationale, and the card-by-card allocation:
[`docs/plans/2026-08-16-schema-card-sections.md`](../../../docs/plans/2026-08-16-schema-card-sections.md).

⚠️ **No card hardcodes its heading tag.** The level is `preset.headingTag`, whose default is
declared in [`card-preset.schema.json`](../../../cms/baseline/models/card-preset.schema.json) as
`h3` — heading level is *placement*, so it belongs to the preset, not the content. Grid presets
carry no override and therefore render `<h3>` under the section `<h2>`; the two presets that back
a **standalone single-entity page** — `prose-article` and `product-page` — keep an explicit `h2`,
because there the card headline is the page's own top heading rather than an item in a list.
That is the whole mechanism: sections own `<h2>`, cards render whatever their preset says.

## Rich results vs. structured data

> **The full cross-map lives in
> [`docs/plans/2026-08-15-google-rich-results-audit.md`](../../../docs/plans/2026-08-15-google-rich-results-audit.md)** —
> all 49 itemtypes against the Google gallery, bucketed Live / Withdrawn / None, with a
> per-row marker saying whether each Google claim was researched here or is unverified model
> knowledge. This section stays the source of truth for the withdrawn dates below; that
> document defers to it.
>
> A companion document,
> [`docs/plans/2026-08-16-schema-card-sections.md`](../../../docs/plans/2026-08-16-schema-card-sections.md),
> is the rationale for the page's **ten sections** — why the cards are grouped as they are, why
> 57 cards and 59 validator items are both correct, and the inconsistencies the grouping
> surfaced.

Google has withdrawn or narrowed the search feature behind six of the types on this page.
`FAQPage` results stopped appearing on **2026-05-07** and the documentation was removed on
**2026-06-15**. `HowTo` was deprecated in **August 2023**, its documentation removed
**2023-09-14**. `SpecialAnnouncement` was deprecated **2025-07-31**, documentation removed
**2025-09-09**. `ClaimReview` is phasing out of Search, though it still powers the Fact Check
Explorer. `Dataset` only ever reached Dataset Search, never a mainstream result. And `Course`
lost *Course info* on **2025-09-09** — only **Course list** survives, which needs three or more
courses in an `ItemList`.

**All six stay, deliberately.** What Google withdrew is a rendering promise, not a vocabulary:
every one of these is still valid schema.org. A SERP feature is one consumer among several — AI
agents, answer engines and GEO pipelines parse the microdata straight off the page and never ask
whether Google would have drawn a box around it. A machine-readable FAQ or how-to is arguably
*more* useful to them than it ever was to a search result.

So describe them accurately in both directions: **not** as rich-result features, because the
feature is gone; and **not** as deprecated markup, because it is not. Neither the types nor their
renderers get "cleaned up" because a Google help page disappeared.

Two riders. `HowTo` remains fully supported **inside** `Recipe` — `recipeInstructions` →
`ItemList` of `HowToStep` — which is exactly how the recipe renderer uses it. And the graded
multiple-choice [Quiz card](#quiz--quiz-three-cards-one-type-different-eligibility) is the same
story one step further on: Google's Practice Problems feature consumed that shape and was retired
in January 2026, leaving valid markup with no live rich result. The eligibility split between the
Quiz cards — flashcards eligible, multiple choice not — is documented in that section.

## Structured `data-part` vocabulary

The twelve parts the typed cards add on top of the envelope. All are **styled** in [`content.css`](../content.css) — this page is the reference markup `render.js` follows, not a wish list. Envelope parts carry the rest: `eyebrow`, `headline`, `subheadline`, `summary`, `meta` (salaries, specs, dates), `byline` + `byline-who` + `dateline` (people), `tags`, `actions` and `footer` (totals, recommendations). `caption` belongs to the media frame — see [media.html](../demo/media.html).

| data-part | Element | Purpose | Used by |
|---|---|---|---|
| `price` | `<p>` + `<meta itemprop="price">` + text/`<del>`/`<ui-chip>` | Price row (Offer / MonetaryAmount microdata), currency-formatted — see [Price](#price) | product, job, course, booking, membership, software, book, real estate |
| `rating` | `<div>` + readonly `.ui-rating` + `[data-sr]` label + count | Star rating (AggregateRating / Rating / EmployerAggregateRating) | product, review, business, movie, book, job, TV series |
| `list` | `<ul>` / `<ol>`; marker via `--ui-content-list-marker`, `data-variant="crossed"` for excluded items | Ingredients, qualifications, features, amenities, answers, tracks, seasons, episodes, menu items, terms | recipe, job, course, booking, location, membership, how-to, Q&A, dataset, menu, glossary, album, TV series, podcast series, real estate, service, loyalty, health |
| `links` | `<ul>` of plain link rows | Related links — the envelope `links[]`, deliberately not buttons | any type |
| `address` | `<address>` of stacked lines | Postal address (PostalAddress scope); a 2-letter country code stays machine-only | business, location, organization, real estate |
| `hours` | two-column `<dl>` | Opening hours, one row per pattern (`openingHoursSpecification`; the flat string only where the type owns it) | business, location, organization offices |
| `office` | `<div>` wrapping name + address + contacts + hours | One local branch (`department` → LocalBusiness) | organization |
| `stat` | `<p>` + `<meta itemprop="value">` + `<data>` display + unit + trend | Big-number display | statistic |
| `timeline` | `<ol>` of `<time>` + text | Milestone list (`subEvent` scopes) | timeline |
| `quote` | `<ui-quote>` + `<blockquote>` (+ `<cite>`) | Third-party voice: pull-quote, review body, post, answer, reviewed claim | quote, review, social, Q&A, fact check |
| `options` | `<ul>` of `<label>` + `<progress>` | Poll answers / comparison rows with bars | poll, comparison |
| `cover` | `<a>` inside the headline, `::after` covering the card | Clickable card — one link, no nested anchors; tag/action links stay above it | article, news (→ the [full-article pages](../demo/articles/article.html)) |

## Price

Every priced row states the number **once, on a `<meta itemprop="price">`**, with the
currency-formatted string as the plain text node beside it (`priceValue()` in `render.js`):

```html
<p data-part="price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
  <meta itemprop="priceCurrency" content="USD">
  <meta itemprop="price" content="279">$279 <del>$329</del>
</p>
```

The old `<data itemprop="price" value="279">$279</data>` **validated** — `Offer.price` accepts
Text as well as Number — but it was surviving on that Text arm, not on being read correctly:

- Google's guidance is explicit that the price value carries **no currency symbol and no
  thousands separator**. The currency already rides `priceCurrency` beside it, so `$` and the
  commas in `DKK 7,250,000` are display, not data.
- The consumers measured in this repo read the **text node**, not `<data value>`. That
  asymmetry is why `numberOfBedrooms` failed on "3 bedrooms" while `yearBuilt` passed on
  "2018" — and it makes a `<data>` answer two different numbers, one per reader.

`<data>` is not salvageable for a formatted price for exactly that reason, and the `value=` it
requires would only restate the `<meta>`. It survives in one place — part `stat`, where the
`<data>` is display-only (no `itemprop`) and earns its keep as the big-number style hook.
`priceCurrency`/`priceValidUntil`/`availability` and the crossed-out original price are
unaffected; the original is display text in a `<del>` and never carried an `itemprop`.

## One property, one value

Two emitters can reach the same root-scope `itemprop` on one card: the **envelope** (eyebrow,
headline, summary, byline, tags, dates — each driven by a per-type map in `render.js`) and the
type's own **`DETAILS` renderer**. A record filling both fields declares one property twice with
two *different* values, which is the failure the validator cannot see and the author never meant:
`itemprop="industry"` shipped as both "Engineering" (eyebrow) and "Software" (`details.industry`)
until the eyebrow entry was dropped.

**The envelope wins.** Its field is the canonical one in `card.schema.json` and it renders for
every type, so the `DETAILS` side is the one that yields. `envelopeProps(fields, type)` builds the
set of properties the envelope will claim for this record — read off `EYEBROW_PROP`,
`HEADLINE_PROP`, `SUMMARY_PROP`, `PUBLISHED_PROP`, `TAGS_PROP` and the byline, not from a
hand-written list of known pairs — and each colliding `DETAILS` renderer takes it as a fifth
argument and asks before emitting:

```js
job(d, fields, parts = {}, itemtype = null, owned = NO_PROPS) {
	let html = (owned.has('industry') ? '' : meta('industry', d.industry)) + …
```

Because the claim set is *derived*, adding an envelope itemprop cannot silently resurrect a
collision: re-add `EYEBROW_PROP.job = 'industry'` and `DETAILS.job` stops emitting its `<meta>`
without being edited. `render.test.js` re-adds exactly that entry and asserts the property still
appears once.

Two sites are guarded today — `industry` (`DETAILS.job`) and `author` (`DETAILS.social`, where
`details.author` is the byline *fallback*, so it keeps the name visible but drops the microdata
once `authors[]` has declared one).

**Repeating a property is not itself wrong.** Most schema.org properties are multi-valued, and
the demo corpus repeats 36 of them deliberately (`keywords`, `hasPart`, `image`, `actor`,
`author`, `dayOfWeek`, …). The corpus invariant in `render.test.js` is therefore an allowlist: it
renders every `data/*.json`, attributes each `itemprop` to its nearest enclosing `itemscope`, and
fails on any repeat of a property not declared multi-valued. That check is what found the two
remaining live collisions — `SpecialAnnouncement.datePosted` and `VideoObject.uploadDate` — which
are exempted by name pending a decision on their precedence direction (the reference page keeps
the *envelope* value for the first and the *media item's* for the second, so "envelope wins" is
not the answer at both).

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

**`variants.control` picks the shape the rows take.** `"list"` (default) is the `<ul data-part="list">`
above; `"buttons"` renders the [`ui/button-group`](../components.md) picker the product pages use —
one `<label class="ui-button">` per variant, each carrying that variant's `hasVariant` scope and
metas. The picker **replaces** the list rather than accompanying it, so a size is declared once.
An unrecognised value falls back to `"list"`. The look is that package's segmented control
(`data-variant="inline rounded border"` + `fs-sm`), overridable per preset via
[`parts.buttonGroup`](content.md#variant-picker--who-owns-the-look).

Two differences from the list form, both deliberate. The radio `name` is **minted** from the
headline through `slug()` — never author data, and per-headline so two pickers on a page cannot
capture each other's clicks (the same guard the graded quiz's options use). And `item.url` becomes
a `<meta>`, not an anchor: an `<a>` inside a `<label>` is a second interactive control fighting the
radio for one click. Where crawlable per-variant URLs matter, the axis belongs on the *list* form
or on separate pages — which is what [`demo/products/`](../demo/products/) does for the colour
axis: four pages, one per colourway, each a `ProductGroup` varying by size and pointing back at the
parent group with `isVariantOf`. They are what the collage card's four covers link to.

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

#### The collage presentation

The same `hasVariant` set has a second shape: instead of a `<ul>` in the text column, each variant
becomes a nested `<ui-card>` tile inside a `<lay-out>` grid that fills the **media** area. Every tile
carries the variant's own image, chip label, machine metas, and a stretched `data-part="cover"` link —
so the whole tile is the one hit target, which is what makes each variant "preselectable directly with
a distinct URL".

It is the third `variants.control` value, beside `list` and `buttons` — but the only one with a
**data precondition**: the tiles *are* the images, so a collage renders only if every variant carries
an `image.src`. Ask for one without them and the set falls back to the `<ul>` rather than rendering a
ragged grid, the same loud-degrade discipline as an unknown axis. Both halves of that decision read
the same `isCollage()` predicate — the text column (which suppresses its rows) and `buildMedia`
(which emits the tiles) — so they cannot disagree.

The **look** is the preset's: `variants.tile` (the per-tile `variant`/`media`/`content` strings) and
`variants.layout` (the `<lay-out>` breakpoint attributes), both read in `buildMedia`, the one place
holding the preset and the variant data together.

```json
"product-collage": {
  "element": "ui-card", "variant": "col", "media": "chip(tc)",
  "variants": {
    "layout": { "xs": "cg(2xs) rg(2xs)", "md": "columns(2)" },
    "tile": { "variant": "rds(non)", "media": "asr(1/1) chip(bs) chip(green) chip(pale)", "content": "pad(none)" }
  }
}
```

The group's own machine metas (`productGroupID`, `variesBy`) stay in the text column either way —
that is where the `ProductGroup` scope lives. Data: `data/product-group-collage.json`.

The page's collage card (`#schema-product-variants`) is deliberately **not** in `schema.compare`'s
pairs. It carries two page-only things the renderer has no reason to emit: `data-view` names on the
tiles, which drive the view-transition morph into the per-colour product pages, and plain local
`src` + `width`/`height` instead of a CDN `srcset`, because the four crops are new assets that do not
exist on the zone yet. The first is a page-authoring hook of the same class `H3` already drops; the
second is a temporary deployment state, and encoding it in the comparator would outlast it. The
collage renderer is covered by unit tests instead.

### Event — `Event`

Standard column layout with a participate CTA. Location → `Place` → `PostalAddress`, organizer → `Organization`.

### Recipe — `Recipe`

Ingredients as proposed part `list`; instructions as a nested `<ui-accordion>` with `HowToStep` items.

### Review — `Review`

Summary emits `reviewBody`; rating → `Rating`, reviewer → `Person` (`reviewer.title` → `jobTitle`), reviewed item → `Product` by default.

**`details.productImage` is not decorative.** A reviewed `Product` that carries `offers` is a merchant listing to Google, and merchant listings **require** `image` — without it the item is invalid even though the review itself is fine. Set it whenever `productPrice` is set. `details.reviewedType` sharpens `itemReviewed` to `Organization` or `Service` (allowlisted, never verbatim data — same pattern as [`subtype`](#subtypes)); no offer is emitted for `Organization`, which has no `offers` property.

**Testimonial** — schema.org has no `Testimonial` type; a testimonial is a `Review` of your organization or service: `reviewedType: "Organization"`, a 5-star rating, quote and byline, usually media-less (the `testimonial` preset, which also tints the stars via `--ui-rating-c`). Note Google excludes "self-serving" reviews — testimonials about your own org on your own site stay valid microdata but get no star rich results.

### Job — `JobPosting`

Headline emits `title`. Salary → `MonetaryAmount` → `QuantitativeValue`; requirements/benefits in a nested `<ui-accordion>`. The card also carries a **second top-level item** — see [Employer rating](#employer-rating--employeraggregaterating).

**`jobLocation` carries a `PostalAddress`, never a bare `Place.name`.** Google requires `jobLocation.address`; a `Place` with only a name is valid schema.org and an invalid job posting. `details.location` becomes `addressLocality` and `details.locationCountry` (ISO code) becomes `addressCountry` — the visible text is unchanged, the city simply sits one scope deeper.

**The eyebrow is display text here, deliberately unmarked.** `industry` is emitted once, from `details.industry`, as a hidden `<meta>`. The eyebrow used to carry `itemprop="industry"` as well, so a card whose eyebrow named the department ("Engineering") and whose data named the sector ("Software") published *both* values for one property and left the consumer to pick. A `details` field that owns a property wins: the visible kicker stays free to say whatever reads best on the card.

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

Part `timeline` — styled by `@browser.style/timeline`: a dot per entry on a continuous rail. Each entry is `subEvent` → `Event`. Add `variant="horizontal"` for the inline rail (second card).

**Each entry is a real `Event`, so it carries `startDate`, a Text `name` and a `location`.** Two rules keep Google's Event profile satisfied (schema.org alone accepts less):

- **`name` never rides the `<time>`.** Microdata takes a `<time>`'s value from its `datetime` attribute, so `itemprop="name"` there publishes a *date* where Google wants Text — it reports "invalid value type for field name". The `<time>` is presentation only (no `itemprop`; `startDate` already carries the machine date) and the visible sentence is the `name`.
- **`location` is required**, and a milestone has no venue. `details.locationUrl` (or a per-item `locationUrl`) emits `eventAttendanceMode: OnlineEventAttendanceMode` + a hidden `location` → `VirtualLocation` with that `url` — honest for a software project's history. A per-item `location` string emits a hidden `Place` instead, for milestones that really happened somewhere. Without either, no location is emitted: the renderer will not invent one. Colour a single entry with `data-theme="accent"` (the `theme=` palette names) or an arbitrary `data-fill="#c9b8ff"` — `data-` prefixed, because a bare attribute is invalid on a built-in `<li>`. A coloured dot is filled; in `variant="minimal"` the bullets default to the rail grey; in `variant="horizontal"` plain dots are open rings (transparent centre, rail stops at the dot edge) — only a `data-theme`/`data-fill` entry fills.

### Gallery — `ImageGallery`

Multiple media items become a carousel — `nav(mrk)` — each image carrying `itemprop="image"`.

**Image licensing — `ImageObject`, and it lives in the text column.** Give `details` any of
`license` · `acquireLicensePage` · `creator` · `creditText` · `copyrightNotice` and each photo
emits a full `ImageObject` (`contentUrl` + `caption` + those) instead of a bare
`itemprop="image"`. That is what Google's *Image metadata* feature reads; `license` is the one
that earns the **Licensable** badge.

Two constraints shape the markup, and both are easy to undo by accident:

- **The scopes sit in `<ui-content>`, not around the images.** The frame is a carousel whose
  slides are the **direct children** of `<ui-media>` (`slidesOf()`/`NOT_SLIDE` and the CSS
  `:not()` list both key on that), so wrapping each `<img>` in an `ImageObject` span would
  change what a slide *is* — and `<img>` is void, so the scope cannot ride the image either.
  Hidden scopes in the text column are the page's existing machine-metadata convention and
  leave the carousel untouched.
- **The suppression is keyed on the DATA, not the type.** `itemprop="image"` is dropped from
  the `<img>` only when an `ImageObject` is actually emitted (`hasImageObject()`), because the
  carousel demos are `gallery` cards too and carry no licensing — keying it on the type alone
  stripped `image` from every one of them and gave nothing back.

### Statistic — `Observation`

Part `stat`: big number + unit + trend, value → `QuantitativeValue` (`Observation` *is* a
`QuantitativeValue`, so the nested node is a legal `StructuredValue` — it keeps the whole
measurement in one part). **The machine value rides `<meta itemprop="value">`, never the
visible text**: `displayValue` is a human abbreviation (`2.4M`) and the consumers this repo
measured read the text node, so `<data itemprop="value" value="2400000">2.4</data>` answered
2.4 — off by 10⁶. The `<data>` keeps a `value=` for the text it wraps (HTML's own machine
pair, and the big-number style hook) but carries no `itemprop`. `unit` is a **real unit of
measurement** (`s`, `ms`, `kg`) and becomes `unitText` beside the machine value; a magnitude
abbreviation (`M`, `k`, `bn`) belongs in `displayValue`, because `unitText: "M"` on a value of
2,400,000 claims 2.4 million *million*.

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

**A `Place` emits no `aggregateRating` — do not re-add it.** `aggregateRating` *is* a valid property of `Place` in the vocabulary, so schema.org's validator accepts it; Google's review-snippet feature has its own type allowlist (Book, Course, Event, LocalBusiness, Movie, Product, Recipe, SoftwareApp, plus `CreativeWorkSeason`, `CreativeWorkSeries`, `Episode`, `Game`, `MediaObject`, `MusicPlaylist`, `MusicRecording`, `Organization`) and `Place` is not on it — the item fails with "invalid object type for field `<parent_node>`". The `location` renderer therefore drops `details.rating` on the floor. [Business](#business--localbusiness-subtype-cafeorcoffeeshop) keeps its rating: `LocalBusiness` **is** allowlisted.

### Map — `Place` (second card)

The same type as [Location](#location--place), with the **map** as the media instead of a photo: a `{ "mediaType": "map" }` item whose coordinates come from `details.geo` — the very object that emits the card's `GeoCoordinates` scope, so the drawn point and the machine-readable one cannot drift. OpenStreetMap is the only keyless provider and is the default; the frame is a plain `<iframe>` because `media.css` already sizes one like an `<img>`. Full field list, the provider table and the coordinate-validation rule: [media.md § Map](./media.md#map--the-frame-as-an-embedded-map).

The property is **`hasMap`** — valid on `Place` and everything below it (`LocalBusiness` included), so it is gated to the `business` and `location` types; a map on any other type renders unmarked. It rides the `<iframe>` itself, because HTML takes a frame's microdata value from its `src`. The "Open in Maps" action link stays unmarked so `hasMap` is declared exactly once — see [One property, one value](#one-property-one-value).

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

⚠️ **A page showing a Book card should carry `<meta name="format-detection" content="telephone=no">`.** iOS Safari's data detectors read the hyphenated 13-digit ISBN as a phone number and link it `tel:`; the page-level meta is the mechanism that stops them, and explicit `tel:` anchors keep working alongside it. Both demo pages set it (`demo/schema.html`, `demo/render.html`), and consumers embedding this card elsewhere need to do the same.

The visible ISBN itself is emitted **raw**, in the renderer and in reference markup alike. It used to interleave a WORD JOINER (U+2060) after each hyphen — a second, redundant defence that cost more than it bought: invisible characters in the output, an `&#8288;` entity to hand-transcribe, and a Book card that could not be checked by `schema.compare.js` because the two sides spelled the same string differently. The machine value in `<meta itemprop="isbn">` was always raw and is unchanged.

### Dataset — `Dataset`

License, temporal/spatial coverage and `variableMeasured` metas; each download is `distribution` → `DataDownload` with `encodingFormat` + `contentUrl` on the button. `temporalCoverageDisplay` carries the human range ("Jan 2019 – Dec 2025", en dash) — the machine meta keeps the ISO 8601 slash interval.

### Fact check — `ClaimReview`

The verdict chip leads — it is the answer (`reviewRating` → `Rating`, `alternateName` visible, hue from the rating value); the quoted claim (`claimReviewed`) follows.

## Types authored markup-first

The fourteen types below — plus `EmployerAggregateRating` on the job card — were authored **markup
first**: `demo/schema.html` was the specification and `render.js` was written to reproduce it, not
the other way round. They now have a `schemaType` key, a `DETAILS` renderer and an instance in
`data/`, and the transcription was verified by a mechanical comparator rather than by eye.

**Every `itemprop` below was checked mechanically** against the schema.org vocabulary dump —
`domainIncludes` walked up the `rdfs:subClassOf` chain, so a property counts as available only
if the type or one of its ancestors is in its domain.

> **Where the dump comes from when `schema.org` is unreachable.** Some sandboxes block
> `schema.org` and `validator.schema.org` outright. The official release dump is also published
> in the vocabulary's own repository, which is usually reachable:
> `raw.githubusercontent.com/schemaorg/schemaorg/main/data/releases/<version>/schemaorg-current-https.jsonld`
> (current version from `.../main/versions.json`; `ComicSeries` and `Artist` were verified
> against **30.0**). Walk `schema:domainIncludes` against the transitive closure of
> `rdfs:subClassOf` — that check is what caught `issn` being a `CreativeWorkSeries` property
> rather than a `Periodical` one. Where a property turns out to be out of domain, **drop it**
> rather than keep it because it renders.

**Two page conventions the renderer does not reproduce**, both pre-dating these types and visible
on every card: the page hoists `media=` onto `<ui-card>` where the renderer emits it on
`<ui-media>`, and it places the machine `<meta>` block *above* the eyebrow where the renderer emits
it after the summary (`DETAILS` runs after the envelope and has no hook to reorder). The comparator
normalises both on both sides; nothing else is allowed to differ.
Run it with `node ui/card/schema.compare.js` ([`schema.compare.js`](../schema.compare.js)); all
22 mapped cards are an exact match.

**A card with an `id=` must be keyed by it.** The comparator's bare form is
`<ui-card(?![^>]*\bid=)…>` — it deliberately matches only cards *without* an id, so that a bare
key can never accidentally grab the id'd sibling it was meant to be distinguished from. That is
why `ComicSeries#schema-comicseries` carries its id even though it is the only ComicSeries on
the page: the id is the artist card's link target, so the bare key would find nothing.

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

### Quiz — `Quiz` (three cards, one type, different eligibility)

`Quiz` has *no properties of its own* — it is a `LearningResource`, and everything comes from
there or from `CreativeWork`. ⚠️ **`eduQuestionType` is a property of `Question`, not of `Quiz`**
(its domain is `Question` and `SolveMathAction`).

The thing that makes two cards out of one type: **`Question` accepts `suggestedAnswer` and
`acceptedAnswer` at the same time**, so three shapes exist and the page shows all three.

| shape | properties on the `Question` | interaction | card |
|---|---|---|---|
| Flashcard | one `acceptedAnswer` | reveal | Quiz — *flashcards* (deck) and *flashcard* (flip card) |
| Multiple choice | several `suggestedAnswer` **+** one `acceptedAnswer` | select, then check the key | Quiz — *check yourself* |
| Poll | several `suggestedAnswer`, no accepted one | select, see results | the [`Question` card](#poll--question) |

The flashcard shape runs **two** cards, because the reveal it asks for can be a `<ui-card>`
accordion deck (several questions, open one at a time) or a `<ui-reveal>` flip card (one question,
question front / answer back). Same content, same properties — only the host differs, which is why
the choice is a **preset** (`element: "ui-reveal"`) and never a field on the card.

**Read the eligibility difference before copying either shape.** Flashcards and multiple choice are
markup siblings with *opposite* rich-result status, and nothing in the markup says so:

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
  same reason we keep `FAQPage`, `HowTo` and `ClaimReview` — see
  [§ Rich results vs. structured data](#rich-results-vs-structured-data).

**In the renderer**, `details.format` picks the shape — `flashcard` or `multiple-choice` — and it
is deliberately **explicit rather than inferred** from whether questions carry options: the same
`details` shape must not silently produce a flashcard when the author meant a graded question. An
unrecognised format falls back to `flashcard`, and options under an ungraded deck are dropped with
an HTML comment, the same loud-skip discipline as [`ProductGroup` variants](#product--product-subtype-productgroup).

The **flip card** is the one place the generic reveal shape does not fit. A reveal normally shows one
item twice — a teaser front, a fuller back, both in the host's scope — but a flashcard's question is
on the front and its `acceptedAnswer` on the back, and both are properties of a `Question` that is
neither the host nor either face. So the `Question` scope sits on the **`<details>`**, which is the
one element wrapping both faces, and `eduQuestionType` rides the front face *inside* the `<summary>`
(the `<summary>` has to stay the first child). The Quiz's own properties — `name`,
`learningResourceType`, `about` → `Thing`, `educationalAlignment` → `AlignmentObject` — become
machine metadata on the host, so the visible headline can be the **question** (`itemprop="text"`),
not the quiz's name.

`renderReveal` cannot derive that split, so it asks a per-type hook — **`REVEAL_FACES`**, keyed by
base type exactly like `DETAILS` — for the host metadata, the `<details>` attributes and the two
faces, and composes the elements itself. An entry returns `null` to decline, which is what a graded
quiz does: its options have to be visible *with* the question, so it is one face, not two, and the
generic `derivedBack` path renders it. A flashcard deck of several cards sent through a reveal preset
renders the **first** card and drops the rest with an HTML comment — the same loud skip again, since
a reveal has one front and one back and a deck wants a `<ui-card>` preset.

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

The demo pair models a property portal: a **teaser** on `demo/schema.html` (photo carousel via
`card-preset/carousel`, a `pale green` "New" chip, the facts row) linking to a generated
**detail page**, `demo/realestate/havnegade-44.html`, built by `demo/realestate/build.js` —
the same shape as the article and product-colourway pages.

Two things about that pair are easy to get wrong:

- **The "New" chip is `fields.chip`, not `fields.furniture.chip`.** A frame gets one chip family,
  so a furniture chip *suppresses* the `<ui-chip data-type>` type label — putting the flag on the
  media would silently delete `RealEstateListing` from the card. `fields.chip` renders it at the
  top of the text column instead, in the same `<p data-part="meta"><ui-chip theme="pale …">`
  shape as the achievement status and most-popular chips.
- **The gallery is `open:grid(3c)`, not a collage.** `collagePart()` is gated to `ProductGroup`
  and builds *variant* tiles; it cannot express a photo grid. `open:grid()` keeps the frame an
  ordinary carousel while closed and turns it into a full-bleed three-column contact sheet when
  the lightbox opens — the "view all photos" pattern. The lightbox invoker is added by the
  **builder**, not the data file, because that file is shared with the teaser and the teaser must
  not grow a gallery button.

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
`<ul data-part="list" data-variant="menu">` of `hasMenuItem` → `MenuItem`. ⚠️ **`MenuItem` is an `Intangible`**, while
`Menu` and `MenuSection` are `CreativeWork`s; the split matters because `MenuItem` gets `offers`,
`nutrition` and `suitableForDiet`, none of which the two containers have.

**The row is a grid, not a paragraph.** `<strong itemprop="name">`, the label `<ui-chip>` and the
`offers` span are direct children of the `<li>` — `name · label · price` on one line — with
`<small itemprop="description">` on the row below (`grid-column: 1 / -1`). Wrapping the first three
in a `<p>` is what the card did until v5, and a block wrapper pushes the price onto its own line.
The chip's hue is data (`labelTheme`), because a menu labels diets *and* proteins: a green chip on
"Lamb" would read as a claim the markup does not make.

**Prices read as a column, not as prose.** `fmtAmount()` (not `fmtPrice()`) renders the visible
amount: no currency code, always two fraction digits, `font-variant-numeric: tabular-nums` and
right-aligned, so the decimal points line up down the section. The currency is stated once, in the
card summary, and the machine value on `<meta itemprop="price">` is unchanged — that is the string
a validator reads, so dropping the code from the text node costs nothing. `priceValue()` takes the
formatter as its 4th argument; every other type keeps the `fmtPrice()` default.

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

**Every track carries its own `byArtist`.** JSON-LD gives each `MusicRecording` an artist by
referencing the album's with `@id`; microdata has **no reference-by-id for a property value** —
`itemref` pulls properties *into* an item, it does not name one as a value — so the group is
restated per row as a name-only scope, invisibly. Without it a track node only makes sense read
together with its album. `tracks[].artist` overrides the album's, which is what a compilation or
a guest feature needs; it is machine-only, so put it in the track `name` if it should also be
read. `details.artistUrl` wraps the subheadline artist in `<a itemprop="url">`, the reciprocal of
the band card's `album` rows and the closest microdata gets to a cross-reference.

### Band — `MusicGroup`

`MusicGroup` ⊂ `PerformingGroup` ⊂ `Organization`, so the band's own vocabulary is thin: `album`,
`genre` and `track`. `foundingDate`, `foundingLocation` and `member` all arrive from
`Organization`, `sameAs` from `Thing`. **Three superseded spellings sit next to the live ones and
are never emitted** — `albums` (→ `album`), `members` and `musicGroupMember` (both → `member`).

The eyebrow carries the primary `genre` like every other creative type; `details.genres` holds the
rest as machine-only metas, since `genre` is multi-valued and a card has one eyebrow. Members
render as one `meta` row with the instrument as an editorial label **outside** the `Person` scope —
the same shape [comic credits](#comic-issue--comicissue) use, because the label is presentation and
the name is the datum. Schema.org's `Role` wrapper would attach the instrument itself; that is a
heavier nesting than a card needs.

The discography is `album` → `MusicAlbum` rows, newest first, so an `<ul>`: ordinal markers on a
descending list would lie (`details.ordered: true` opts an ascending one back into `<ol>`). Each
row can carry `url`, which renders a real crawlable `<a itemprop="url">` — on the demo page that
points at the album card, whose `artistUrl` points back.

⚠️ **No Google feature.** `MusicAlbum` and `MusicGroup` are both *vocabulary only* — see
[the rich-results cross-map](../../../docs/plans/2026-08-15-google-rich-results-audit.md).

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

### Comic series — `ComicSeries`

`ComicSeries` ⊂ `Periodical` ⊂ `CreativeWorkSeries` ⊂ (`Series`, `CreativeWork`), so the series'
own vocabulary is thin and entirely inherited: `issn`, `startDate` and `endDate` all arrive from
**`CreativeWorkSeries`** — `issn`'s domain is `Dataset, WebSite, CreativeWorkSeries, Blog`, so
`Periodical` is merely on the path and contributes nothing this card uses — plus
`genre` / `publisher` / `keywords` from `CreativeWork`.

**This card introduces the series; it does not enumerate it.** No `hasPart`, no issue list, one
cover. An individual issue is its own card — [Comic issue](#comic-issue--comicissue) — which is
where the five comic credits can actually live, and which points back with `isPartOf`. The two
cards are the vocabulary's own division of labour, not an editorial preference: `artist`,
`penciler`, `inker`, `letterer` and `colorist` exist on `ComicIssue` and `ComicStory` and
nowhere else, so a series card that tried to carry them would be inventing properties.

⚠️ **The issue count has no machine counterpart.** `numberOfEpisodes` is scoped to
`CreativeWorkSeason`, `RadioSeries`, `TVSeries` and `VideoGameSeries` — neither `ComicSeries`
nor any of its ancestors is in its domain — and no `numberOfIssues` exists. `PodcastSeries` hits
the same wall and answers it with `hasPart` cardinality; this card has no `hasPart` at all, so
"12 issues since 2026" is prose in the `meta` part and nothing more.

The ISSN is emitted raw, same as the book card's ISBN — iOS data detectors are held off by the
page-level `<meta name="format-detection" content="telephone=no">`, not by invisible characters
in the text. See § Book.

### Comic issue — `ComicIssue`

`ComicIssue` ⊂ `PublicationIssue` ⊂ `CreativeWork`. `issueNumber` and the page range
(`pageStart` / `pageEnd` / `pagination`) come from `PublicationIssue`; **`artist`, `penciler`,
`inker`, `letterer`, `colorist` and `variantCover` are `ComicIssue`'s own** — the only place in
the whole vocabulary those five roles exist, shared with `ComicStory`. Each is a `Person` scope,
and an unfilled role emits nothing rather than an empty scope.

**`isPartOf` is the link, and it only runs one way.** Its range is `CreativeWork | URL`, so the
issue points up at the series through a **real anchor** rather than a hidden `<meta>` — only a
link is crawlable, the same reasoning as the [ProductGroup variant URLs](#product--product).
There is no inverse to walk back down: a `ComicSeries` cannot point at its issues except through
`hasPart`, which this pair deliberately does not use.

That makes the chain **issue → series** and **issue → artist**, with the
[artist card](#artist--person) as the `Person` the `artist` property names. It is the only
machine-readable tie between the three cards.

**Two prices, and only one is a claim.** The card shows both, labelled so a reader never has to
guess which is which:

- **Cover price** — "cover price 10¢" in the `meta` row, **no `itemprop`**. It is what is
  printed on the artwork, not something anyone can buy at. A bare number with no scope claims
  nothing, which is the honest markup for it.
- **The sellable price** — a real `<p data-part="price" itemprop="offers" itemscope
  itemtype="…/Offer">` carrying `priceCurrency`, `availability` and `price`. `offers` is a
  `CreativeWork` property, so it reaches `ComicIssue`; this is the same block the
  [book card](#book--book) uses.

⚠️ **The Buy button is a `<button>`, and claims no `url`.** The renderer emits a real
`<button type="button">` whenever an action has no `url` — an `<a href="#">` would be an anchor
that goes nowhere. It carries no `itemprop` either: `url` on an `Offer` must point somewhere a
buyer can actually go, and a demo has no checkout. Claiming one would be the same class of
mistake as marking the cover price up as the offer.

### Artist — `Person`

⚠️ **There is no `Artist` type.** schema.org spells types in CamelCase and properties in
lowercase; `artist` is a **property** (domain `ComicIssue` / `ComicStory` / `VisualArtwork`,
range `Person`). So an artist card is a `Person` — the second one on the page, alongside
[profile](#profile--person) — and the `artist` *property* is what a `ComicIssue` uses to point
at it. The `artist` `schemaType` key names the editorial shape, not an itemtype.

**Where the link is actually made:** `artist`'s only domains are `ComicIssue`, `ComicStory` and
`VisualArtwork` — never `ComicSeries` — so the tie runs from the
[comic issue card](#comic-issue--comicissue), which names this `Person` as its `artist` and
points up at the series with `isPartOf`. The series card itself is related to this one by an
`<a href>` and editorial intent only, and that is the vocabulary's doing, not a shortcut.

What it shares with `profile`: the `jobTitle` · `worksFor` subheadline (the same function,
shared through `SUBHEADLINE_SLOT`, not copied), `address`, and `knowsAbout` for the tags —
`Person` has no `keywords`. What it adds: `hasOccupation` → `Occupation` (with
`occupationalCategory` as an O*NET-SOC code) and `award`.

`award` is a repeatable `Text`, so **each award is its own `<span itemprop="award">`**. An
`itemprop` on a wrapping list would make the whole list one value — the concatenated string —
which is the trap `listPart`'s list-level `itemprop` would have walked into.

⚠️ **`artist` has no inverse either.** A `Person` cannot point at the work they drew: there is no
"creatorOf". So even with issue rows present the tie only ever runs one way, and the card's own
link to the series stays a plain `<a href="#schema-comicseries">` with no `itemprop` — an honest
link rather than an invented property.

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

