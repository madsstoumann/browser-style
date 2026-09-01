# Schema.org cards — type-by-type notes

> Companion to [`demo/schema.html`](../demo/schema.html) — the hand-authored reference markup
> for every schema.org card type (the markup `render.js` reproduces). The intro prose, the
> per-type notes and the structured-part vocabulary used to live inline on that page; they moved
> here so the demo stays one card grid.
>
> **The matching CMS content model** is
> [`cms/baseline/models/card.schema.json`](../../../cms/baseline/models/card.schema.json): a
> structured envelope + a `schemaType` discriminator + one `details` object per type. Sibling
> demo pages: [cards.html](../demo/cards.html) · [media.html](../demo/media.html) ·
> [content.html](../demo/content.html). Satellite pages hand-authored **outside** the
> comparator gate: [schema.place.html](../demo/schema.place.html) (the Place card across the
> OpenStreetMap embed layers) and [schema.goals.html](../demo/schema.goals.html) (personal
> goals as `AchieveAction` — target and progress as `object`/`result` `QuantitativeValue`
> scopes, a `<progress>` bar or `<ui-progress-circular>` ring as the visible face).

**Four counts, four different quantities — do not conflate them.** The page carries **64
cards** with **55 distinct root itemtypes**; a structured-data validator reports **68 items**;
the renderer knows **56 `schemaType` keys**. Last validated by hand on 2026-08-28, at 62 cards: validator.schema.org reported the 66 items of that revision, and Google's Rich Results Test **73** valid items — more, because it also counts the nested `LocalBusiness`/`Product` entities as items (`open-items.md` § 36). The `BookSeries` card added on 2026-08-29 and the `MovieSeries` card added on 2026-08-31 take the mechanical counts to the numbers above and are **not** yet in either validator's tally: both hosts were unreachable at those sessions (the offline route is the vocabulary dump — see [Types authored markup-first](#types-authored-markup-first)), so their itemprops were checked against the schema.org 30.0 dump instead. Re-run both validators next time they are reachable.

| Count | What it measures | Reproduce it |
|---|---|---|
| **64** | card hosts on the page — `<ui-card>` plus the one `<ui-reveal>` | `grep -oE '<ui-(card\|reveal)[^>]*itemtype="[^"]*"' ui/card/demo/schema.html \| grep -vc 'itemprop='` |
| **68** | top-level microdata items — **what schema.org's validator reports** | `grep -o '<[a-z-]*[^<>]*itemscope[^<>]*>' ui/card/demo/schema.html \| grep -v 'itemprop=' \| grep -c 'itemtype='` |
| **55** | distinct root `itemtype` values | `grep -oE '<ui-(card\|reveal)[^>]*itemtype="[^"]*"' ui/card/demo/schema.html \| grep -v 'itemprop=' \| grep -o 'itemtype="[^"]*"' \| sort -u \| wc -l` |
| **56** | `schemaType` keys `render.js` supports (`SCHEMA_TYPES`) | `node -e "import('./ui/card/render.js').then(m => console.log(Object.keys(m.SCHEMA_TYPES).length))"` |

The flashcard Quiz is the page's one **`<ui-reveal>`** host rather than a `<ui-card>` — a
question on the front face, its answer on the flipside, which is what a flashcard actually is.
It counts identically in every column below; only the element differs.

**Items ≠ cards.** A validator counts every *top-level* item — an `itemscope` with no `itemprop`
of its own — so it sees the 64 cards plus **three items that are not cards**: the standalone
`EmployerAggregateRating` on the job card, the page-level `WebSite` (site identity plus the
sitelinks-searchbox `potentialAction`, which describes the *site*, not any card on it), and the
page-trail `BreadcrumbList` on the breadcrumb `<ol>` — 68. Nested scopes (`author` → `Person`,
`offers` → `Offer`, …) are properties of their
parent, not items, and are not counted. The `grep -c 'itemtype='` on the end of that command is
load-bearing: without it the page's own `<meta name="description">` is counted too, because its
text mentions "itemscope" — that is how a naive scan reports 68. (It read 64 while an HTML
comment on the job card also spelled the word out; that comment is gone, but the guard is not
about any one line — any future prose mentioning `itemscope` walks into the same trap.)

**The count is of the card hosts, and only those.** A "card" is a **top-level**
`<ui-card>`/`<ui-reveal>` carrying an `itemtype`: the four nested `<ui-card>` Product tiles
inside the [ProductGroup collage](#the-collage-presentation)'s `<ui-media>` are not cards, and a
nested property scope (`AggregateRating`, a byline `Person`, `Organization`, `ComicIssue`,
`Occupation`, …) is not an itemtype *on a card host*.

**Cards ≠ types.** `Quiz` runs two card *hosts* (the `<ui-card>` and the `<ui-reveal>`; the third Quiz is a `<section>` deck, not a host), `Review`, `EventSeries`, `Place`, `Person` and
`NewsArticle` run two each, and ItemList four (the comparison card, the two collection cards,
and the file list) — so 63 − 1 − 5 − 3 = 54. The `grep -v itemprop=` in those commands is load-bearing: the
collage `ProductGroup` nests a `<ui-card>` per variant, and a nested card is a **property** of
its parent item, not a card of its own. Note the second `grep` in that command: **reduce to the `itemtype=`
substring before `sort -u`**. Uniquing the whole `<ui-card …>` match counts one type twice
whenever its two cards differ in any other attribute (an `id`, a `style`) — that is how this
count once read 50.

**Types ≠ renderer keys.** The 54 is the **52** distinct base itemtypes behind the 55
`schemaType` keys (`profile` and `artist` both resolve to `Person`; `comparison`, `places` and `filelist` all to `ItemList`), minus the **two** never shown
plain — `LocalBusiness` and `SoftwareApplication`, whose cards are always sharpened — plus the
four sharpened [subtypes](#subtypes) `ProductGroup`, `CafeOrCoffeeShop`, `DiscussionForumPosting`
and `VideoGame`, which `details.subtype` produces with no key of their own. Three further types appear as **top-level items that are not cards**
(`itemscope`, no `itemprop`) and so are outside all three card counts: `EmployerAggregateRating`
on the job card, the page-level `WebSite`, and the page-trail `BreadcrumbList`. None has a
renderer key — `WebSite` and the breadcrumb trail are authored
markup only, because they describe the page rather than any content instance.

Every card type from the legacy `content/card` package — plus the nine types added in model
v1.3 (organization, video, howto, qa, podcast, movie, book, dataset, claim), plus the
[authored markup-first](#types-authored-markup-first) additions — re-created with
the modern engine: `<ui-card>` + `<ui-media>` + `<ui-content>`, with satellites `<ui-chip>`,
`<ui-sticker>`, `<ui-save>`, `<ui-avatar>`, `<ui-quote>` and `<ui-accordion>`. Every card uses
the same composition: media on top, text below. Structured data is inline **microdata**
(`itemscope`/`itemtype`/`itemprop` + hidden `<meta>` values) — no JSON-LD. Both end-of-body
scripts are optional: `video.js` polyfills the proposed media invoker commands
(`command="--play-pause"`) behind the podcast play button, and `save.js` flips `aria-pressed`
on the save toggles; every card renders identically without either — see
[Demo-page head and scripts](#demo-page-head-and-scripts). Each media frame also carries a `<ui-chip data-type>` naming the card's schema.org
type — a demo affordance, emitted by `render.js` only when `renderCard` gets `{ typeChip: true }`.

## Page structure — eleven sections, and where the heading level comes from

The page groups its 64 cards into **eleven sections by what the thing *is*** — Editorial &
journalism · Commerce & offers · Screen · Audio · Page & picture · Learning & reference ·
People, work & history · Food & drink · Places, events & property · Community & support ·
Data, health & operations. Each section is a bare `<h2>` followed by its own
`<lay-out md="columns(2) items(start)">`. The sectioning groups by what the thing *is*
(the subject), never by schema.org type family — the allocation is the page itself. The
questions the 2026-08-16 reorder parked (the episode→series linking convention, and whether
the grid should ever go 3-column) live in
[`docs/plans/open-items.md`](../../../docs/plans/open-items.md), item 12.

⚠️ **No card hardcodes its heading tag.** The level is `preset.headingTag`, whose default is
declared in [`card-preset.schema.json`](../../../cms/baseline/models/card-preset.schema.json) as
`h3` — heading level is *placement*, so it belongs to the preset, not the content. Grid presets
carry no override and therefore render `<h3>` under the section `<h2>`; the two presets that back
a **standalone single-entity page** — `prose-article` and `product-page` — keep an explicit `h2`,
because there the card headline is the page's own top heading rather than an item in a list.
That is the whole mechanism: sections own `<h2>`, cards render whatever their preset says.

## Rich results vs. structured data

> **The full cross-map lives in
> [`google-rich-results.md`](google-rich-results.md)** —
> every itemtype in the system (52 distinct behind the 55 renderer keys) against the Google gallery, bucketed Live / Withdrawn / None, with a
> per-row marker saying whether each Google claim was researched here or is unverified model
> knowledge. This section stays the source of truth for the withdrawn dates below; that
> document defers to it.
>
> The rationale for the page's **sections** — why the cards are grouped as they are, and why
> the card and validator-item counts are both correct — is summarised under
> [Page structure](#page-structure--eleven-sections-and-where-the-heading-level-comes-from)
> above; the counting rules live at the top of this document.

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
| `cover` | `<a>` inside the headline, `::after` covering the card | Clickable card — one link, no nested anchors; tag/action links stay above it. From content it is the envelope field `fields.cover`. Safe over a carousel: the `::scroll-button()`/`::scroll-marker-group` pseudos are `z-index: 3` and the overlay furniture `2`, against the cover's `1` | article, news (→ the [full-article pages](../demo/articles/article.html)), real estate |

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

## Reviews

`reviewItems(reviews)` is the one emitter for individual `Review` blocks, shared by every detail page
that shows them — the rental page and the five product pages today. One seam, so two builders cannot
spell a review two ways. Each entry becomes a `<div itemprop="review" itemscope>` holding
`reviewRating` → `Rating`, an `author` → `Person` byline with `datePublished`, an optional `name`
headline and `reviewBody`.

**Reviews never render on a teaser card.** No `DETAILS.*` renderer reads `details.reviews`; the page
builder calls the emitter itself and places the result where the microdata is still inside the item's
scope. That is a content decision as much as a layout one — a card in a grid states the aggregate,
the page states the individual opinions.

**`contentReferenceTime` is dropped.** Its range is `DateTime`, and the thing a reviewer actually
reports — "stayed June 2026", "Verified purchase" — is not one. It rides the `context` field as
plain text in the byline instead, unmarked, rather than being forced into a property whose type it
does not satisfy.

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

The 2026-08 additions — `software`'s first list, the local-service trades under `business`,
`EventVenue`/`StadiumOrArena`, `BroadcastEvent` — were picked from the [schema.org usage
statistics](https://schema.org/docs/usage_stats.html) (July 2026 release): every subtype in the
100K–1M-domain bucket of a base we render, plus the 10K–100K local-SEO trades (`Plumber`,
`Attorney`, `HairSalon`…). No new card type came out of it — the top 25 types by domain count
were already covered.

| schemaType | Base itemtype | Allowed subtypes |
|---|---|---|
| `article` | `Article` | BlogPosting, TechArticle, APIReference, ScholarlyArticle, Report, SatiricalArticle, AdvertiserContentArticle |
| `business` | `LocalBusiness` | Restaurant, CafeOrCoffeeShop, Bakery, BarOrPub, FastFoodRestaurant, IceCreamShop, Winery, Brewery, Distillery, Store, Hotel, Resort, BedAndBreakfast, Motel, Hostel, Campground, BeautySalon, DaySpa, HealthClub, AutoRepair, AutoDealer, AutoRental, GasStation, Dentist, MedicalClinic, Pharmacy, Physician, RealEstateAgent, TravelAgency, Library, GovernmentOffice, ProfessionalService, LegalService, Attorney, FinancialService, AccountingService, InsuranceAgency, HomeAndConstructionBusiness, GeneralContractor, Plumber, Electrician, RoofingContractor, HVACBusiness, MovingCompany, Locksmith, MedicalBusiness, Hospital, HealthAndBeautyBusiness, HairSalon, FoodEstablishment, LodgingBusiness, AutomotiveBusiness, ClothingStore, FurnitureStore, JewelryStore, Florist, SelfStorage, EntertainmentBusiness, SportsActivityLocation, ShoppingCenter |
| `event` | `Event` | SportsEvent, MusicEvent, TheaterEvent, ScreeningEvent, ComedyEvent, DanceEvent, ExhibitionEvent, FoodEvent, LiteraryEvent, BusinessEvent, EducationEvent, ChildrensEvent, SocialEvent, SaleEvent, Festival, Hackathon, PublicationEvent, CourseInstance, BroadcastEvent |
| `location` | `Place` | TouristAttraction, TouristDestination, LandmarksOrHistoricalBuildings, Accommodation, Apartment, House, SingleFamilyResidence, Room, Suite, Residence, ApartmentComplex, GatedResidenceCommunity, CivicStructure, Park, Beach, Campground, Church, Museum, Airport, TrainStation, Mountain, EventVenue, StadiumOrArena |
| `news` | `NewsArticle` | ReportageNewsArticle, OpinionNewsArticle, AnalysisNewsArticle, BackgroundNewsArticle, ReviewNewsArticle |
| `organization` | `Organization` | NGO, Corporation, OnlineStore, OnlineBusiness, EducationalOrganization, School, CollegeOrUniversity, GovernmentOrganization, NewsMediaOrganization, MedicalOrganization, ResearchOrganization, PerformingGroup, MusicGroup, SportsOrganization, SportsTeam, Airline, LibrarySystem, WorkersUnion, PoliticalParty, FundingScheme, Consortium, Project |
| `product` | `Product` | ProductGroup, ProductModel, IndividualProduct, Vehicle, Car, Motorcycle, Drug, DietarySupplement |
| `social` | `SocialMediaPosting` | DiscussionForumPosting, BlogPosting, LiveBlogPosting |
| `software` | `SoftwareApplication` | MobileApplication, WebApplication, VideoGame |

**`VideoGame` is the one subtype that unlocks new properties** rather than only narrowing the
itemtype — `gamePlatform`, `playMode`, `numberOfPlayers`, `quest` and the rest are out of domain
on a plain `SoftwareApplication`, so the renderer gates them on the sharpened itemtype. See
[Video game](#video-game--videogame).

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

Note the near misses: `Museum` is **only** a `CivicStructure`, never a `LocalBusiness`, so it
sharpens `location` and is absent from `business`; `TaxiService` is a `Service`, not a
`LocalBusiness`; `Game` is a `CreativeWork`, so only `VideoGame` (which is also a
`SoftwareApplication`) sharpens `software`. `StadiumOrArena` is both a `CivicStructure` and a
`SportsActivityLocation` but is listed under `location` only. `Casino` is a `LocalBusiness` and
sits in the 100K–1M bucket, yet is left off on purpose: that count is affiliate volume, not
content anyone authors here.

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

The **second `NewsArticle` card** (`#schema-news-paywall`, `data/news-paywall.json`) is the paywalled teaser: the same envelope, a text-column `chip` (“Subscribers only”) instead of the live beacon, and `details.paywalled: true` — see [§ Paywall](#paywall--isaccessibleforfree). It is paired in `schema.compare.js`.

### Paywall — `isAccessibleForFree`

`details.paywalled: true` emits `<meta itemprop="isAccessibleForFree" content="https://schema.org/False">` — schema.org’s Boolean spelled as its enumeration URL, the house style for every other enumeration member. The property’s domain is **CreativeWork, Event and Place**, so the flag is accepted on the 39 keys whose itemtype is one of those (verified against the schema.org 30.0 dump: `article`, `news`, `content`, `recipe`, `video`, `event`, `location`, `business`, `software`, `book`, `bookseries`, `movie`, …) and dropped silently on `product`, `job`, `profile`/`artist`, `membership`, `organization`, `service`, `contact`, `booking`, `statistic`, `goal`, `loyalty`, `musicgroup` and the three `ItemList` keys. Only the boolean `true` counts — a string `"true"` is refused, because the meta is a claim about access and must never be set by accident.

**Two arms, and the second is gated on the body.** Google’s *Subscription and paywalled content* feature reads the boolean **plus** `hasPart → WebPageElement { isAccessibleForFree: False, cssSelector }` naming the gated section of the DOM. A teaser card carries the boolean only: the paywalled text is not on the listing page, so a selector pointing at it would be a lie. The full view — a preset with `text: "body"`, the shape `articles/build.js` renders — adds the part, hidden, with `cssSelector: [data-part=body]` — the wrapper the same render wrote around the body is `<div data-part="body" itemprop="articleBody">`, and `data-part` survives the `raw`/`jsonld` schema modes (`stripSchema()` removes microdata attributes only), so the selector holds in every mode.

**Presentation is not a disabled card.** The link still works (it is the conversion path), a tinted or `muted` treatment fails the muted-compounding contrast rule, and a publisher wants gated content to look *more* desirable, not less. The paywalled news card uses the envelope `chip` — a status flag above the eyebrow, the same slot “New” and “Sold” use — and keeps the type chip on the media. Nothing about the flag is automatic on the visual side; the editor chooses the label.

**The fade is a token, not a flag.** `content="gate"` fades the text column out towards its block-end — the shared scroll-fade gradient held static, default `100cqb` (see [content.md § gate](content.md#gate-holds-the-same-gradient-still)). The demo card gets it from the `stack-gate` preset; `details.paywalled` never appends it, because the machine claim and the look are two decisions. And a mask hides nothing from a crawler or view-source: the visual is a courtesy, enforcement is server-side.

**The page — [`articles/news-paywall.html`](../demo/articles/news-paywall.html) — is the article's own URL, not a redirect.** Google indexes gated text *at the canonical URL*: the crawler is served the full body, and `isAccessibleForFree: False` + `hasPart`/`cssSelector` tell it which part readers don't get. Sending anonymous visitors to a generic subscribe page instead leaves the article un-indexable and reads as cloaking (crawler and reader see different documents at one URL). So the paywalled page has the same shape as the other two article pages, built by `articles/build.js` from the **same instance as the teaser**: the hero, then the [`prose-article-gate`](../data/card.presets.json) preset (`prose-article` + `content="gate"` at its default — the same full-column ramp as the teaser card; `--ui-content-gate-size` is the knob if a page wants the lede fully legible), then the **wall** — [`data/subscription.json`](../data/subscription.json), a `membership` card (`Offer`, `panel-brand` preset — `black dark`; its two buttons failed AA at 3.74:1 / 4.35:1 until the dark button tokens were retuned, open-items § 29) with the Subscribe / Sign in actions, placed *after* `</article>` in an `<aside>` so it is a top-level item and never a property of the article. The teaser's headline `cover` links there and the `data-view` names (`card-news-paywall` / `hero-news-paywall`) morph card → page like the other two. It is the Rich Results Test target for the feature.

### Quote — `Quotation`

Envelope `summary` as `<ui-quote>` wrapping `<blockquote itemprop="text">` + author. Proposed part: `quote`.

### Product — `Product` (subtype `ProductGroup`)

Offer + AggregateRating, discount `<ui-sticker>`, save toggle. Proposed parts: `price`, `rating`. `details.brand` renders under the headline in the **subheadline slot** as `brand → Brand` (`name`, plus a crawlable `<a itemprop="url">` when `brandUrl` is set) — the album card’s `artist`/`artistUrl` shape, and the PDP convention of brand above the fold rather than down among price and stock. Google lists `brand` as recommended for merchant listings; a chip on the media stays an editor’s `furniture.chip` choice, never the machine property.

**Individual reviews are a detail-page property.** `details.reviews[]` renders nowhere on the
teaser — `DETAILS.product` never reads it — and the five generated product pages compose it into a
band under the card through the shared [`reviewItems()`](#reviews) emitter. `review` is in domain of
`Product`, and a `ProductGroup` **is** a `Product`, so the same band serves the four colourway pages.
The band's placement is what forces the page shape: a property has to sit inside its item's subtree,
so the page wraps card + reviews in one `<article itemscope>` and the card renders **descoped** — the
same structure the rental page uses, and the reason `productCard()` reads the itemtype off the raw
render before stripping it (a gown resolves to `ProductGroup`, the headphones to `Product`).

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

A grid of photos with plain labels reads as a *gallery*, so each tile also declares that it is a link:
the chip carries a trailing chevron (`data-icon="chevron-right" data-icon-at="end"` — the same "go
to" convention as the card CTAs, deliberately **not** ↗, which promises an external site or a new
tab), the frame has `hov(zoom)`, and a hovered/focused tile paints its chip accent (`content.css`).
The link's name says navigate, not select — `"Indigo Floral — view this colourway"` — and keeps the
chip's visible text inside it (WCAG 2.5.3).

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
pairs. One page-only thing remains in the way: plain local `src` + `width`/`height` on the tiles
instead of a CDN `srcset`, because the four crops are new assets that do not exist on the zone yet —
a temporary deployment state, and encoding it in the comparator would outlast it. (The tiles' other
divergence, the `data-view` names driving the morph into the per-colour pages, stopped mattering when
`H3` widened to drop `data-view` **everywhere** rather than on the card root alone.) The collage
renderer is covered by unit tests instead.

### Event — `Event`

Standard column layout with a participate CTA. Location → `Place` → `PostalAddress`, organizer → `Organization`.

### Recipe — `Recipe`

Ingredients as proposed part `list`. The card is the **teaser** of the recipe app: `cover` on the headline and a
*Start cooking* action both lead to `demo/recipes/recipe.html?id=recipe-1`, and `details.instructions` stays off the
teaser — the `HowToStep` list (with `name`, `text` and `timeRequired`) is the page's. (The renderer still emits a
nested `<ui-accordion>` of `HowToStep` items, or the `popover` form, for any recipe whose data carries instructions —
the HowTo card below is the live example.)

**The kitchen-app demo pair.** [`demo/schema.recipe.html`](../demo/schema.recipe.html) shows this
card exactly as above with two edits — the headline is a cover link and the steps accordion is a
*Start cooking* button, both to [`demo/recipes/recipe.html?id=recipe-1`](../demo/recipes/recipe.html?id=recipe-1)
— and the page is the entity view, built by `demo/recipes/build.js` the way the product and
real-estate pages are: `data/recipe.json` deep-merged with the page-local `recipes/carbonara.json`
(six steps as `{name, text, duration, audio}`, richer than the card model's `string[]`), one static
`renderCard()` through the `recipe-page` demo preset, and a cross-document view transition on the
`card-recipe-1` / `hero-recipe-1` pair. The card is handed a `details` object **without**
`ingredients`/`instructions`, so the renderer emits no accordion; both bands are hand-authored in the
page's one Recipe scope — ingredients as `<data itemprop="recipeIngredient" value="…">` (the machine
text stays as authored while the servings scaler and the metric ↔ imperial toggle rewrite only the
visible `<span data-qty data-unit>`), steps as `recipeInstructions` → `ItemList` of `HowToStep` with
`name` + `text` + `timeRequired`. The fullscreen cook-mode `<section popover>` carries no itemprops
and no `data-view` (morph names must stay unique per document); it animates open from the invoking
button (`@starting-style` + `display`/`overlay` `allow-discrete`; Safari has no `overlay`, so its
exit is instant). `?id=` is a route mimic — the page is static and `recipe.js` reads the id only to
namespace `localStorage`. Narration plays each step's recorded file (the exact script is the generated `recipes/narration.md`)
and falls back to the Speech API for any step without one — hands-free and the Media Session
transport (headset / lock screen: play, pause, next, previous) drive the same player. Back-button
close of cook mode is a follow-up (the lightbox's `syncHistory` pattern).

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

⚠️ **`Course.provider` is REQUIRED by Google** — it is not the optional twin of the instructor. The card emits it as a hidden `Organization` scope on the course root, beside the `CourseInstance` that carries the instructor.

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

### Goal — `AchieveAction`

schema.org has no `Goal` type; a personal goal with progress is an `AchieveAction` — "an incremental achievement". `actionStatus` is an **allowlist** (`active`/`completed`/`failed`/`potential` → `ActionStatusType` URLs; anything else emits nothing), the time span rides `startTime`/`endTime` metas, `agent` → `Person`. The two numbers are two hidden `QuantitativeValue` scopes: **`object` carries the target** (the thing being worked toward), **`result` the current value** (what the effort has produced so far). The `<ui-progress-circular>` ring is **presentation only** — no itemprop anywhere on it, and its arc percent is *computed* from `current/target` (clamped 0–100), so the drawn progress can never contradict the machine numbers; `details.hue` themes the ring through the nine-hue allowlist. Tag chips emit no `keywords` — out of domain on an Action. The `goal` preset is the overlay treatment: `ovr(ts)`, rest-blurred frame (`hov(blur)`), `scm(lg)` dark scrim, `eb(inv)` eyebrow. The satellite page [schema.goals.html](../demo/schema.goals.html) runs six hand-authored variations of the same shape.

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

The property is **`hasMap`** — valid on `Place` and everything below it (`LocalBusiness` included), so it is gated to the `business` and `location` types; a map on any other type renders unmarked. The one caller that overrides the gate is the real-estate detail page, whose map sits inside a `mainEntity` → `Apartment` scope that *does* descend from `Place`; `mapFrame()` takes `hasMap` as an explicit argument for it. See [Real estate](#real-estate--realestatelisting). It rides the `<iframe>` itself, because HTML takes a frame's microdata value from its `src`. The "Open in Maps" action link stays unmarked so `hasMap` is declared exactly once — see [One property, one value](#one-property-one-value).

### Places — `ItemList` (two cards)

A **collection** of places on one clustered map — `<ui-map>` from
[`@browser.style/map`](../../map/readme.md), not the single-point `<iframe>`. The page runs two:
`#schema-places-offices` (studios worldwide) and `#schema-places-homes` (homes for sale in one
city). Both are keyed by `id` in `schema.compare.js`, because the page's *bare* `ItemList` is the
comparison card and the bare form matches only an id-less card.

**The list is the map's data source.** `<ui-map>` reads `latitude`/`longitude`/`name`/`url`
straight off these `ListItem`s, so the drawn pin and the machine-readable point cannot drift —
the collection-scale version of the contract `mediaType: "map"` already has with `details.geo`.
Nothing is duplicated into a JSON payload or per-pin attributes.

**The root is an Intangible, and that constrains almost everything.** `ItemList` owns
`numberOfItems`, `itemListOrder` and `itemListElement`, and inherits `name`/`description`/`url`
from `Thing`. That is the whole vocabulary. Out of domain on it, verified against the schema.org
30.0 dump: `keywords`, `about`, `spatialCoverage`, `contentLocation`, `areaServed`, `location`,
`geo`, `hasMap`, `datePublished`, `author`. Consequences:

- **`TAGS_PROP.places = null`** — tags still render, unmarked. Re-adding `keywords` here would be
  invalid, the same call as `comparison`.
- **`places` is deliberately absent from `HAS_MAP_TYPES`.** `hasMap` is a `Place` property,
  and the frame's enclosing scope is the list. It moves **down** to each item, where it is
  **machine-only** — the map itself is the affordance, so there is no card-level "Open in
  Maps" CTA at all (`DETAILS_ACTIONS` has no `places` entry). An estate slide instead
  carries a **"See More"** CTA to its own listing, unmarked because the `cover` link already
  supplies `itemprop="url"`. Override the label with `details.slide.cta`.

**Two shapes, one type, chosen by `details.kind` — not `subtype`.** `details.subtype` feeds
`resolveItemtype()` and sharpens the **root**, and the root is an `ItemList` in both shapes; what
varies is the **item**. `kind` is allowlisted all the same, because the value it selects lands in
an `itemtype`.

| kind | item itemtype | why |
|---|---|---|
| `business` | `LocalBusiness` + its allowlisted subtypes | every member *is* a `LocalBusiness`, so the flat `openingHours` string is uniformly in domain — one gate, no per-member test. A bare `Place` item would need `hoursPart(…, { flat: false })`, which is why the allowlist stops here |
| `residence` | `RealEstateListing` wrapping the Accommodation in `mainEntity` | see below |

**Why a listing wraps the home instead of being it.** `offers` is out of domain on `Apartment`,
on `Place` **and** on `ListItem`. A priced home has nowhere else to state its price, so the item
is a `RealEstateListing` — a `WebPage`, hence a `CreativeWork`, which owns `offers` — and the
`Apartment`/`House` hangs off `mainEntity`, carrying `geo`, `hasMap`, `floorSize`,
`numberOfBedrooms`, `numberOfRooms` and `yearBuilt`. That is the same shape
[§ Real estate](#real-estate--realestatelisting) already uses, with the same spellings, so a
portal card and the detail page it links to cannot spell one home two ways.

The item allowlist reuses `RESIDENCE_TYPES` **verbatim**. It excludes `Residence` and
`ApartmentComplex` on purpose: both descend from `Place`, not `Accommodation`, so `floorSize`,
`numberOfRooms`, `numberOfBedrooms`, `numberOfBathroomsTotal` and `yearBuilt` are all out of
domain on them — a listing typed `Residence` could state none of its own facts.

**Two presentations, one content model.** A collection card is long by nature — eight offices
with address, phone and hours is fifty lines of page — so neither shape prints everything.

*Compact rows.* An office row shows the linked name and, when it differs, its locality —
linked to its own office page, built by
[`demo/offices/build.js`](../demo/offices/build.js). That page is the simplest of the four
detail builders on purpose: real estate and rentals are banded because their subject spans
two scopes, while an office is one `LocalBusiness`, so a single card states every property
exactly once and there is nothing to split.

**Every entry needs a distinct `url`.** Only one office page exists in this demo, so each row
points at it with a per-office query string (`?studio=berlin`). That is not decoration:
Google's carousel validation rejects an `ItemList` whose entries share a property value —
*"Identical property values given, but unique values are required"* — because entries a
consumer cannot tell apart are not a list. Each `ListItem` also carries its **own** `name`,
which is what the same validation reads; without it every entry reports as *"Unnamed item"*.
That name is not a duplicate of `item.name`: they are different nodes, the list entry and the
place it points at, each naming itself once. In production the query string is a real
per-office URL — the shape is the point, the placeholder is not. The address, hours and `hasMap` link stay fully marked up inside one bare
`<div hidden>`, and the phone becomes a `<meta>`. A reader gets them from the map popup,
which `<ui-map>` builds out of exactly those nodes.

**`details.list: "sr"`** goes further and takes the list off the visible card altogether,
using [`data-sr`](../../base/core.css) rather than `hidden` — and that distinction is the
whole point. The list cannot simply be deleted: it **is** the `itemListElement` set
`numberOfItems` counts, it is where `<ui-map>` reads its points, and it is the map's text
alternative, since the pins are `aria-hidden` decoration. `hidden` would take it out of the
accessibility tree along with the page; `data-sr` takes it out of the page only. Sighted
readers reach the same data by clicking a pin.

**The `<div hidden>` wrapper inside a row must be a bare `<div>`:**
`content.css` gives `[data-part="address"]` `display: flex` and `[data-part="hours"]`
`display: grid`, and an author `display` beats the UA `[hidden] { display: none }` rule — put
`hidden` on the parts themselves and they stay fully visible.

*Card slides (`details.slides: true`).* The media frame becomes a carousel: the clustered map
is slide one, and every place after it is a nested `<ui-card>`. **The slides then ARE the
`itemListElement` set** — `DETAILS.places` emits no `<ol>`, because a list would be a second
copy of the same items. The nested card carries `itemprop`, so it is a *property* of the list
and the page's card counts skip it; `<cq-box>` holds the `item` scope so the photo and the
text sit inside one item.

Two constraints on a slide, both learned the hard way in the browser:

- **The slide's `asr()` must match the frame's.** The frame owns the height; a taller slide
  overflows it and the scroller clips the overlay. Override both together via `details.slide`.
- **The title is a `cover` link inside the headline, not a plain anchor.** An `<a>`'s own
  colour beats inheritance, so a bare link renders link-blue on a photo under `ovr()`; the
  `cover` part takes `color: inherit`. But its stretched `::after` must **not** apply on a
  slide — it would make the whole slide a link, so tapping the photo navigates away and a
  swipe lands on the link instead of the scroller. `content.css` drops the stretch for a
  card inside a `nav` frame; only the title stays clickable. The guard written for a plain
  carousel card cannot cover this: it re-anchors the `::after` to `<ui-content>`, which is
  the wrong element here (the scroller is the *parent* frame) and the wrong size (under
  `ovr()` the text column fills the whole card).

**Slides are anchor-addressable.** Each one gets a minted `id` (`<cardId>-place-<n>`), and a
scroll-snap child is reachable by plain in-page anchor — `<a href="#…">` reaches a home with
no JavaScript. The map popup links that way; its engine intercepts the click to scroll the
carousel only (`scrollIntoView({ block: 'nearest' })` — native fragment navigation would
scroll the page to put the slide at the top), and falls back to the listing's own URL when
there are no slides.

**Complement, not competitor, to `organization`.** That type already emits branch offices as
`department` → `LocalBusiness`. It is the right answer when the card's subject is *the company*;
`places` is for when the subject is *the list*. Do not merge them.

**Google rich result: none**, and that is expected — the host carousel takes `ItemList` only
alongside Course list, Movie, Recipe or Restaurant. See
[google-rich-results.md](./google-rich-results.md).

### Membership — `Offer`

Dark theme, `PriceSpecification`, features as check-`list` with the excluded ones as a `crossed` list. `details.isPopular` renders the promotional chip — a state, so it keeps the eyebrow free for the actual category.

The demo card takes plain `theme="gray"`, **not `gray muted`**: the `muted` modifier washes the ink by a further ~50%, which is unreadable at card scale in dark mode.

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

The multi-office shape: HQ address, employees, `sameAs` — and each local office as `department` → `LocalBusiness` (part `office`) with its own address, phone and **per-day opening hours** in the tabular `hours` part (a two-column `<dl>`). Each row carries both the flat `openingHours` string and a structured `OpeningHoursSpecification`, so single days (`Th 09:00-16:00`) and ranges (`Mo-We 09:00-17:00`) both work. The demo card boxes each office as a light-gray plate (preset `stack-boxed-offices`: `parts.office` `box brd` + `parts.officeTheme` `gray light` → `data-theme` + `data-box="brd"`, [base/theme.md § Box](../../base/theme.md#box)); the pair is guarded by the `schema.compare.js` transcription gate.

### Video — `VideoObject`

The card ROOT is the VideoObject, so media facts (`contentUrl`, `thumbnailUrl`, `uploadDate`, `duration`) emit as root-level props — no nested `video` scope. Eyebrow → `genre`, published → `uploadDate`.

### How-to — `HowTo`

Recipe's sibling: supplies/tools as part `list` (`HowToSupply`/`HowToTool`), steps as a nested `<ui-accordion>` of `HowToStep`, plus `totalTime` and `estimatedCost` → `MonetaryAmount`. The demo card opens its steps as a popover (preset `stack-accordion-popover`, the `parts.accordion` word `popover`) — same microdata, the outer Steps wrapper is a `<button popovertarget>` + `<div popover>` pair instead of a `<details>`; this pair is guarded by the `schema.compare.js` transcription gate.

### Q&A — `QAPage`

Distinct from FAQ: one `mainEntity` → `Question` with community answers as `<ui-quote>` (third-party voice, same convention as review/social) — accepted answer first (green `<ui-chip>`), then by votes; `acceptedAnswer` / `suggestedAnswer` → `Answer` with author and `upvoteCount`.

### Podcast — `PodcastEpisode`

Episode metas plus hidden `partOfSeries` → `PodcastSeries`. The episode audio is an `<audio controls>` inside `<ui-media>` (scoped `associatedMedia` → `AudioObject`), author-hidden while scripting runs (`media.video.css` reproduces the UA's chromeless default) — the poster stays the visual, and `<ui-play>` drives playback via `command="--play-pause"` (video.js polyfills the media invoker commands until browsers ship them). With scripting disabled, `@media (scripting: none)` surfaces the native bar at the frame's block-end and hides the inert `<ui-play>`, so the card plays with no JS at all — exactly one accessible play control exists in either state.

### Movie series — `MovieSeries`

`MovieSeries` ⊂ `CreativeWorkSeries` ⊂ (`Series`, `CreativeWork`) — the [BookSeries](#book-series--bookseries) shape one medium over, with one difference: `director` and `actor` are the series' **own** properties (the cast shared across the films), so the credit rows sit on the series scope itself, exactly as they would on a `Movie`. `startDate`/`endDate` are `CreativeWorkSeries`'; the film list, the rating and the `productionCompany` colophon arrive from `CreativeWork`. Eyebrow → `genre`.

⚠️ **There is no count property** — the same trap as every other series type: "3 films" is prose, `hasPart` → `Movie` is the machine answer. Each film carries `position` and `datePublished` on its own `Movie` scope; the list is an `<ol>` by default because films ascend (`details.ordered` overrides per instance), and a film with a `url` gets a real anchor — the BookSeries volume rule. On the demo page film 3 links to the Movie card beside it (`#schema-movie`), the same series → item wiring as BookSeries → Book. Every film row also carries a `<link itemprop="image">` reusing the **series' own key art**: Google's Rich Results Test evaluates each nested `Movie` against the Movie feature's requirements, where `image` is critical — franchise art is each film's honest image, the renderer takes it from the card's own media, and no per-film asset exists or is needed. `aggregateRating` reaches the series through `CreativeWork`, and Google's review-snippet allowlist carries `CreativeWorkSeries`, so the star row is feature-eligible.

### Movie — `Movie`

Director and cast as `Person` scopes, `contentRating`, release date and an `AggregateRating` star row. Eyebrow → `genre`. The demo card is *The Last Ford* — the finale of the MovieSeries card above it, which links here via its `hasPart` film list; that link is why this card carries `id="schema-movie"`.

### Video game — `VideoGame`

Not a type of its own: `software` + [`details.subtype: "VideoGame"`](#subtypes). `VideoGame` ⊂
`Game` ⊂ `SoftwareApplication`, so the sharpened card keeps every software property *and* gains
a vocabulary a plain `SoftwareApplication` is not in the domain of. The renderer gates that arm
on the **itemtype actually written on the scope**, never on `details.subtype` — a subtype off the
allowlist falls back to `SoftwareApplication`, and the game properties must fall back with it.

| Property | From | Note |
|---|---|---|
| `gamePlatform` | VideoGame | many-valued: PS5 / Xbox / Switch / PC |
| `playMode` | VideoGame | range `GamePlayMode` — **allowlisted** (`SinglePlayer`, `MultiPlayer`, `CoOp`), never verbatim, same discipline as `SUBTYPES` and `BOOK_FORMATS` |
| `numberOfPlayers` | Game | range `QuantitativeValue` → `minValue`/`maxValue`. "Up to four raiders" was prose only |
| `gameEdition` | VideoGame | a single `Text`. It names ONE edition and cannot express a matrix — see below |
| `quest` · `characterAttribute` · `gameItem` | Game | all range `Thing`, so a row is a name and at most a description. Nothing invents a richer type than the vocabulary has |
| `trailer` | VideoGame | range `VideoObject` |
| `screenshot` | SoftwareApplication | range `URL` \| `ImageObject` |
| `processorRequirements` · `memoryRequirements` · `storageRequirements` | SoftwareApplication | the typed split of the teaser's one `softwareRequirements` summary line |

#### Platform, edition, storefront — three axes, and the trap

A store page mixes three things that look like one. The demo page
([`demo/games/pixel-raiders.html`](../demo/games/pixel-raiders.html)) exists mostly to keep them apart:

- **Platform** — PS5, PC, Switch. `gamePlatform` **on the game**.
- **Edition** — Standard, Deluxe. The `name` of each `Offer`. `gameEdition` is a single `Text` on
  the item, so it can name the edition a listing *is* — it cannot carry a matrix.
- **Storefront** — Steam, PlayStation Store, eShop. **Neither of the above.** A shop is a
  `seller` → `Organization` on the Offer, with `url` pointing at its product page.

The matrix rolls up as one `offers` → `AggregateOffer` (`lowPrice`, `highPrice`, `offerCount`)
wrapping one `Offer` per platform × storefront. ⚠️ **`isVariantOf` does not reach a `VideoGame`** —
its domain is `Product`/`ProductModel` — so the [ProductGroup](#product--product) variant markup is
*not* reusable here. The picker UI is; the microdata underneath has to be Offers.

The page declares `offers` exactly once, at the AggregateOffer: `data/software.json`'s single $29
Offer is nulled out in the page's own data file, or the item would carry a bare Offer beside the
matrix ([One property, one value](#one-property-one-value)).

`gamePlatform`, `playMode`, `quest`, `characterAttribute`, `gameItem` and `screenshot` are all
declared multi-valued in `render.test.js` § *one property, one value* — a repeat that is not on
that allowlist is a collision between two emitters.

**One deliberate limit.** The gallery shows **one** truthful `screenshot`: the other
`game_0*.png` assets in `/assets/images` are two entirely different games, and claiming them as
screenshots of this one would be exactly the sort of false statement this page is built to avoid.

The requirements table is where the generic **`specs`** part came from — it shipped first as a
reuse of `data-part="hours"`, the system's only two-column `<dl>`, whose CSS turned out to be
pure layout with nothing hours-specific in it. `specs` is now that rule under an honest name;
`hours` keeps the same styling because `ui/map` reads `[data-part="hours"]` to pull opening hours
into a map popup, so the two names are semantically distinct even though they render identically.
See [card.md § data-part vocabulary](card.md).

### Book series — `BookSeries`

`BookSeries` ⊂ `CreativeWorkSeries` ⊂ (`Series`, `CreativeWork`). `startDate`/`endDate` are the
series' own, from `CreativeWorkSeries`; the author byline, the volume list, the rating and the
publisher colophon all reach it through `CreativeWork`. The card is the book card's shape one
level up: byline leads (`BYLINE_EARLY`), then the span row, the rating, the volumes, the
colophon. Eyebrow → `genre`.

⚠️ **There is no count property.** `numberOfItems` belongs to `ItemList` alone, and
`numberOfEpisodes` to `CreativeWorkSeason`/`RadioSeries`/`TVSeries`/`VideoGameSeries` — the same
trap the podcast and comic series walk around. "3 books" is prose; `hasPart` → `Book` is the
machine answer.

Unlike the comic series, this card **does** enumerate its parts: a book series is a finite,
ordered shelf, and each volume carries `position`, `datePublished` and `isbn` on its own `Book`
scope. The list is an `<ol>` by default because volumes ascend, so the ordinal markers are true
(`details.ordered` overrides it per instance — the album-track rule). A volume with a `url` gets
a **real anchor**, not a hidden meta: only a link is crawlable, which is the comic issue's
`isPartOf` reasoning run downwards. On the demo page volume 2 links to the `Book` card below it
(`#schema-book`).

`aggregateRating` reaches the series through `CreativeWork`, and Google's review-snippet type
allowlist carries `CreativeWorkSeries` — so the star row is legal in the vocabulary *and*
eligible for the feature, unlike the one a bare `Place` is refused.

### Book — `Book`

Author byline leads (photo via `<ui-avatar>`); then facts, rating, `Offer` — publisher is the colophon. `isbn`, pages, allowlisted `bookFormat` (schema.org `BookFormatType`).

⚠️ **A page showing a Book card should carry `<meta name="format-detection" content="telephone=no">`.** iOS Safari's data detectors read the hyphenated 13-digit ISBN as a phone number and link it `tel:`; the page-level meta is the mechanism that stops them, and explicit `tel:` anchors keep working alongside it. Both demo pages set it (`demo/schema.html`, `demo/render.html`), and consumers embedding this card elsewhere need to do the same.

The visible ISBN itself is emitted **raw**, in the renderer and in reference markup alike. It used to interleave a WORD JOINER (U+2060) after each hyphen — a second, redundant defence that cost more than it bought: invisible characters in the output, an `&#8288;` entity to hand-transcribe, and a Book card that could not be checked by `schema.compare.js` because the two sides spelled the same string differently. The machine value in `<meta itemprop="isbn">` was always raw and is unchanged.

### Dataset — `Dataset`

License, temporal/spatial coverage and `variableMeasured` metas; each download is `distribution` → `DataDownload` with `encodingFormat` + `contentUrl` on the button. The button is a real download link (`download` — browsers honour it same-origin only, the intent still reads), carries the format glyph (`csv` → `table-view`, `json` → `data-object`, a closed map), and shows `distribution[].size` as **visible** text (`<small>`, also `contentSize` meta) — never as an `aria-label`: that would replace the visible name, and WCAG 2.5.3 wants the visible label inside the accessible one. `temporalCoverageDisplay` carries the human range ("Jan 2019 – Dec 2025", en dash) — the machine meta keeps the ISO 8601 slash interval.

### Fact check — `ClaimReview`

The verdict chip leads — it is the answer (`reviewRating` → `Rating`, `alternateName` visible, hue from the rating value); the quoted claim (`claimReviewed`) follows.

### File list — `ItemList`

A collection of downloadable files — a press kit, report annexes, a resource pack. The root is
the same Intangible `ItemList` the comparison and places cards use (`numberOfItems`, no
`keywords` on tags); each file is `itemListElement` → `MediaObject` carrying `name`,
`contentUrl`, `contentSize` and `encodingFormat` — all four in domain on `MediaObject`, which
is why the rows are not `DigitalDocument` (a plain CreativeWork: no `contentUrl`, no
`contentSize`). The visible row is a real download link — `<a itemprop="contentUrl" download>`
with the suggested filename in the `download` attribute value (`details.files[].download`);
absent, the bare attribute keeps the served filename, and cross-origin the browser ignores it
either way — an HTML rule, not a schema one.

The file **kind** (`pdf` | `excel` | `word` | `txt` | `zip`) is a closed allowlist in
`render.js` (`FILE_TYPES`), because it lands in two machine surfaces at once: the row's
`data-icon` ::marker glyph (a name in `ui/icon/icons.json` — `picture-as-pdf`, `table-view`,
`description`, `text-snippet`, `folder-zip`) and the `encodingFormat` MIME type. An unknown
kind gets the generic `draft` glyph and **no** `encodingFormat` — author data never reaches
either surface, and every row still carries a glyph because a partially-iconed list renders
mixed markers ([content.md § Icon markers](content.md)). The size is one human string
("2.4 MB") emitted verbatim as `contentSize`, whose range is Text — no display/machine split.
Always an unordered `<ul>`: the glyphs ride `list-style-type`, so ordinal markers cannot
coexist with them — no `ordered` switch, no per-row `position`.

## Types authored markup-first

The types below — plus `EmployerAggregateRating` on the job card — were authored **markup
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
> (current version from `.../main/versions.json`; `ComicSeries`, `Artist` and `BookSeries` were verified
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
39 mapped cards are an exact match.

**A card with an `id=` must be keyed by it.** The comparator's bare form is
`<ui-card(?![^>]*\bid=)…>` — it deliberately matches only cards *without* an id, so that a bare
key can never accidentally grab the id'd sibling it was meant to be distinguished from. That is
why `ComicSeries#schema-comicseries` carries its id even though it is the only ComicSeries on
the page: the id is the artist card's link target, so the bare key would find nothing. `Book`
moved to `Book#schema-book` for the same reason when the book series started linking to it.

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
| Multiple choice | several `suggestedAnswer` **+** one `acceptedAnswer` | select, then check the key | Quiz — *check yourself* (a scroller **deck**, one slide per question — or one card, `stack` preset) |
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

The graded shape has a **second presentation**, and — like the flip card — it is a preset, not a
field: `card-preset/quiz-carousel` sets `element: "lay-out"` and the renderer emits one
`<ui-card>` slide per question inside a `<lay-out overflow>` scroller, the Quiz's own properties
(`name`, `description`, `learningResourceType`, `about`, `educationalAlignment`) as machine
metadata on a wrapping `<section itemscope>` — never on the `<lay-out>`, whose children the
controls polyfill counts as slides. The item count is unchanged: one Quiz, three Questions, twelve
Answers, so the page's card count treats the deck as one card. Each slide is the same fieldset the
single card renders (one shared builder, byte-identical minus one attribute), headed by the deck
name as a label and a "Question *n* of *N*" eyebrow. The preset's `carousel.media` is the scroller's
token string — `nav(end) arw(drk)` puts filled arrows and dots inside each slide's content end —
and its bare `gate` token is the one behaviour: the renderer marks the first radio of every question
`required`, and the token hides every slide after an unanswered one, so the next arrow stays
natively disabled until the current question is answered
([carousel.md § gate](./carousel.md)). `quiz-carousel-free` is the same deck without the gate. A
flashcard deck sent through a lay-out preset renders the card with a loud comment — the reveal idiom
is the accordion's. The page's graded Quiz is the gated deck; the single-card form stays renderable
(`data/quiz-mc.json`, `stack` preset) and covered by the renderer suite.

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

The demo pair models a property portal: a short **teaser** on `demo/schema.html` (photo
carousel via `card-preset/carousel`, two square status chips, the facts row) linking to a
generated **detail page**, `demo/realestate/havnegade-44.html`, built by
`demo/realestate/build.js`.

**The teaser is a morph target.** It carries `data-view="card-realestate-1"`, matching the
detail page's `<article>`, so a cross-document view transition grows the card into the page
([card.md § Article pattern](card.md#article-pattern--teaser-card--full-page-view)). Only the
card **root** is named on the grid: the detail page's hero `<img>` carries
`data-view="hero-realestate-1"`, but the teaser's first `<img>` names nothing, so the box
morphs and the image dissolves inside it rather than scaling. That is an authoring choice, not
a gate constraint — `schema.compare.js`'s H3 normalisation drops `data-view` **everywhere**,
not only on the card root, so naming the teaser's hero would not break the transcription pair.
The same shape applies to the [vacation rental](#vacation-rental--vacationrental) teaser.

**Two data files, deep-merged by the builder.** `data/realestate.json` is shared with the
teaser and stays short; `demo/realestate/havnegade-44.json` carries what only the page has —
the long sales copy, `amenities[]`, the coordinates behind the map band, the gallery invoker
and the page's own CTA. That split is why the teaser shows no amenity list and does not
self-link. It is the same shape the product pages use, and it is what
[`build.js`](../demo/realestate/build.js) already documented for the lightbox invoker alone.

**The page is banded, not one card.** One `<article>` carries the listing scope; band 1 is
the gallery card; the residence bands sit inside **one** `<section itemprop="mainEntity">`.
They have to: microdata scopes are DOM subtrees, and each property is stated exactly once
([One property, one value](#one-property-one-value)).

```
<article itemscope itemtype=".../RealEstateListing">   ← name, description, datePosted, offers, image
  band 1  gallery + eyebrow/headline/summary/price/agent/CTA
  <section itemprop="mainEntity" itemscope itemtype=".../Apartment">
    band 2  key figures    floorSize · rooms · bedrooms · bathrooms · yearBuilt · floorLevel
    band 3  sales copy (a ui-reveal read-more) + amenityFeature
    band 4  address + geo + hasMap
  </section>
</article>
```

**`realestateSections(details, fields)` is the seam**, exported from `render.js`. The teaser
composes its pieces into one text column (that is all `DETAILS.realestate` does now); the
builder wraps bands of the same pieces in its own markup. One source, two compositions, so
they cannot drift — and `schema.compare.js` still proves the teaser half.

⚠️ **`factsRun` and `figures` are ALTERNATIVES.** They state the same properties —
`floorSize`, `numberOfBedrooms`, `numberOfBathroomsTotal`, `numberOfRooms`, `yearBuilt` — one
as an interpunct run, one as a grid of `data-part="stat"` figures. A page emitting both
restates every one of them and is invalid. The teaser takes the run, the page takes the grid.
In a figure the value is always the **first element**: `content.css` sizes `> :first-child`,
so a leading `<meta>` would silently steal the big type off the number.

**Band 1 is kept listing-level by its data, not by a flag.** The builder hands that
`renderCard()` call a `details` object with no `property`, so `DETAILS.realestate` emits
`datePosted`, the price and the agent line and no `mainEntity` block — which the bands below
own.

Two other things about the pair are easy to get wrong:

- **The status chips are `fields.chip`, not `fields.furniture.chip`.** A frame gets one chip
  family, so a furniture chip *suppresses* the `<ui-chip data-type>` type label — putting the
  flags on the media would silently delete `RealEstateListing` from the card. `fields.chip`
  renders them at the top of the text column instead. It takes one object **or an array**;
  each entry carries `ui/chip`'s own attributes (`theme`, `size`, `radius`, `variant`), and
  this listing uses `radius: "non"` for square corners. A meta row holding more than
  one chip gains flex + gap — see [content.md](./content.md).
- **The gallery carries no `open:` token.** The lightbox promotes the *same* frame into the
  top layer, so a bare `nav` frame already opens as a fullscreen, one-image-at-a-time carousel
  with arrows and dots — that is its default open presentation, and it is what a listing wants.
  (`open:grid(3c)` would make it a three-column contact sheet instead; `collagePart()` is not an
  option either way, being gated to `ProductGroup` variant tiles.) Chromium does not carry
  scroll-control pseudos into the top layer, so the open state's controls are real DOM built by
  `lightbox.js` — the page loads it, non-render-blocking. The `realestate-page` preset is
  `variant="col shd(non)"`: the gallery stays **above** the text column at every width, and its
  bare `nav` leaves the default round dot markers.

Three structural traps, all worth knowing before writing a renderer:

1. **It is a `WebPage` subtype.** The home is not the card's subject; it hangs off `mainEntity` →
   `Apartment` (or `House` / `SingleFamilyResidence` / `Accommodation`), which carries `floorSize`
   → `QuantitativeValue` (`unitCode` `MTK`), `numberOfBedrooms`, `numberOfBathroomsTotal`,
   `numberOfRooms`, `yearBuilt`, `floorLevel`, `petsAllowed`, `address` → `PostalAddress` and
   `amenityFeature` → `LocationFeatureSpecification` (`name` + boolean `value`).
2. ⚠️ **`offers` is not valid on `Accommodation`, `Place` or `Residence`.** Its domain is
   `AggregateOffer`, `CreativeWork`, `EducationalOccupationalProgram`, `Event`, `MenuItem`,
   `Product`, `Service`, `Trip` — so the price rides the **listing** (a `CreativeWork`), *outside*
   the `mainEntity` scope. Putting it on the residence is invalid markup, not merely unread.
3. ⚠️ **`geo` and `hasMap` are the mirror image of that.** Both are `Place` properties, and
   `RealEstateListing` is a `WebPage` — so they are invalid on the listing root and valid
   **inside** the residence scope (`Apartment` ⊂ `Accommodation` ⊂ `Place`). That is why the map
   band lives under `mainEntity`, why the coordinates are `details.property.geo`, and why
   `HAS_MAP_TYPES` still does **not** list `realestate`: a `{ "mediaType": "map" }` item on the
   listing's own media would render the frame unmarked, which is correct. `mapFrame()` takes an
   explicit `hasMap` argument for the one caller that knows its enclosing scope. `hasMap` is
   declared once, on the `<iframe>`; the "Open in Maps" link stays unmarked.

`datePosted` and `leaseLength` are the listing's only two own properties. Note also that
`SingleFamilyResidence` descends from `House` → `Accommodation`, **not** from `Residence`.

**There is no Google rich result for `RealEstateListing`** — see the
[rich-results audit](google-rich-results.md). The markup
is valid, complete schema.org that any consumer can read; the page's Google-eligible surface is
its `BreadcrumbList` and its images, not a listing card.

### Vacation rental — `VacationRental`

`VacationRental` ⊂ `LodgingBusiness` ⊂ `LocalBusiness` ⊂ (`Organization`, `Place`). That double
descent is the whole shape of the card: `brand`, `knowsLanguage` and `review` arrive from
**`Organization`**, `latitude`/`longitude`, `containsPlace`, `hasMap` and `amenityFeature` from
**`Place`**, `checkinTime`/`checkoutTime` from **`LodgingBusiness`**, and `priceRange` from
**`LocalBusiness`** — all on one element. Only the rooms nest:

```
<ui-card itemscope itemtype=".../VacationRental">     ← additionalType, identifier, brand,
  <ui-media> photos → itemprop="image"                   lat/long, knowsLanguage, rating,
  <ui-content>                                           priceRange, address, check-in/out
    <div itemprop="containsPlace" itemscope Accommodation>  ← floorSize, bedrooms, bathrooms,
      facts run · beds                                        rooms, occupancy, bed, amenities
    </div>
```

Like [real estate](#real-estate--realestatelisting), the pair shares one source:
**`vacationrentalSections(details, fields)` is the seam**, exported from `render.js`. The teaser
composes `machine + rating + price + containsPlace{factsRun, beds} + address + stay + brand`;
[`demo/rentals/build.js`](../demo/rentals/build.js) wraps the same strings in bands and adds the
amenity list, the map and the reviews. `factsRun` and `figures` are ALTERNATIVES — a page emitting
both restates floorSize/numberOfBedrooms/… and fails *one property, one value*. The page also
strips `address`, `checkin` and `checkout` from band 1's details, because its location band owns
them.

The teaser is a morph target the same way the real-estate one is:
`data-view="card-vacationrental-1"` on the card **root** only, pairing with
`demo/rentals/masseria-lucia.html` — see [Real estate](#real-estate--realestatelisting).

Four traps, each one a property that had to move or go:

1. ⚠️ **`offers` is out of domain.** Its domain is `AggregateOffer, CreativeWork,
   EducationalOccupationalProgram, Event, MenuItem, Product, Service, Trip` — no `Organization`,
   no `Place`. A nightly rate on this type is **`priceRange`** (`LocalBusiness`, range `Text`).
   Same shape of refusal as `RealEstateListing`, opposite resolution: there the price moved *out*
   of the residence scope, here there is no offer to move.
2. ⚠️ **The coordinates are stated once, flat.** `latitude`/`longitude` are valid directly on a
   `Place`, and that is what Google's reference payload uses. Emitting `geo` → `GeoCoordinates`
   *as well* would state the same location twice. `hasMap` is declared once, on the map `<iframe>`
   — and unlike the real-estate page it rides the **root**, because this type *is* a `Place`.
3. ⚠️ **`bed` and `occupancy` are `Accommodation` properties**, not business ones (`bed`:
   `Accommodation, HotelRoom, Suite`; `occupancy`: `Accommodation, Apartment, HotelRoom,
   SingleFamilyResidence, Suite`). They are the reason `containsPlace` exists on this card at
   all. `numberOfBeds` is the count on a `<meta>`; `typeOfBed` is the visible text.
4. ⚠️ **`contentReferenceTime` is dropped from the reviews.** Its range is `DateTime`, and a stay
   is known only to the month — so the month is plain text ("stayed June 2026") and the property
   is not asserted. Google's own sample payload gives it a bare date, which is out of range.

`additionalType` (`HolidayVillageRental` on the rental, `EntirePlace` on the accommodation) is
**Google's vocabulary, not schema.org's** — neither name exists as a class in the 30.0 dump. That
is legal precisely because `additionalType` takes `Text|URL`; it would not be legal as an
`itemtype`.

**No open rich result.** Google's *Vacation rental* feature is fed through its vacation-rental
**partner programme**, not by markup a site publishes on its own — so, as with `RealEstateListing`,
what ships here is valid, complete schema.org plus a `BreadcrumbList` and images. The
[rich-results audit](google-rich-results.md) previously listed
this type as *not to build*; it exists now because content needed expressing, and that note has
been corrected rather than left contradicting the code.

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
[the rich-results cross-map](google-rich-results.md).

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
link is crawlable, the same reasoning as the [ProductGroup variant URLs](#product--product-subtype-productgroup).
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


## Demo-page head and scripts

Every line in `demo/schema.html`'s `<head>` is there for a measured reason. The page itself
carries only one-line markers pointing here, per the repo's rule that prose belongs in the
docs; the reasoning is below and the measurements behind it are in
[`docs/performance.md`](../../../docs/performance.md).

### Two metas

```html
<meta name="referrer" content="no-referrer">
<meta name="format-detection" content="telephone=no">
```

- **`referrer`.** The page's `srcset` candidates are absolute `https://v4.browser.style/cdn-cgi/image/…`
  URLs, and the zone's Hotlink Protection **403s any cross-origin `Referer`** — which is what a
  page served from `pages.dev` or `localhost` sends. `no-referrer` passes. (A *CSS*-initiated
  fetch uses the stylesheet's referrer policy, not the document's, so `/dist/*` needs the same
  policy from `_headers` — see performance.md § Environments.)
- **`format-detection`.** iOS Safari's data detectors read the [Book](#book--book) card's
  hyphenated ISBN — and the [ComicSeries](#comic-series--comicseries) ISSN — as a phone number
  and link them `tel:`. The page-level meta is the mechanism that stops them; explicit `tel:`
  links elsewhere on the page keep working alongside it. Any page embedding those cards needs
  it too.

### Resource hints and the stylesheet

- **`<link rel="preconnect" href="https://v4.browser.style">`** — the srcset origin. The
  handshake runs in parallel with the CSS download, taking ~3 RTTs off the eager LCP image on
  `pages.dev`/`localhost`; on the zone itself it is a same-origin no-op.
- **One bundle for every card-demo package**, `/dist/demo.<hash>.min.css`. The source list is
  [`ui/card/components.md`](../components.md); it is built by `npm run build:demo-css` from
  `demo.css`. The filename hash is what makes the one-year `immutable` cache safe, so the link
  is rewritten on every rebuild.
- **`<link rel="expect" href="#schema-product-variants" blocking="render">`** blocks first
  paint — *and the incoming snapshot on Back* — until the morphing cards are parsed: the article,
  news, product and four variant pairs, `data-view` names at lines 110–269. The page's three
  other morph pairs — `card-recipe-1`, `card-realestate-1`, `card-vacationrental-1`, at lines
  1618/1788/1803 — are **outside** that anchor on purpose, and rely on bfcache. Adding anchors
  for them would not help: render-blocking is a union over sequential parsing, so it would amount
  to moving the anchor to 84% of the document and paying first paint for it. Rationale:
  [`docs/performance.md` § render-blocking](../../../docs/performance.md). See also
  [card.md § Article pattern](card.md#article-pattern--teaser-card--full-page-view).
- **Speculation rules** prerender the linked detail pages at `eagerness: "moderate"` via a
  document rule — `"where": { "href_matches": "/ui/card/demo/*/*" }` — which covers all six
  detail directories (`articles/ offices/ products/ realestate/ recipes/ rentals/`) including
  the `?home=` / `?studio=` / `?id=` query variants, and excludes the sibling demo pages.
  Prerender plus a cross-document view transition makes the morph instant; the feature is
  Chromium-only and inert everywhere else. The cap is 2 **in-flight** speculations (FIFO), and
  `moderate` only speculates on hover, so the size of the candidate set is not a cost.

### The typed-`attr()` polyfill block

The polyfill names the view-transition morph targets where typed `attr()` is unsupported
(Safari). It **must** be render-blocking in `<head>`: the incoming page is snapshotted at first
paint, so a deferred script names the targets too late and the forward morph degrades to a
cross-fade. See [`ui/base/polyfills/readme.md`](../../base/polyfills/readme.md).

⚠️ **The `<!-- polyfill:start -->` / `<!-- polyfill:end -->` comments are functional, not
documentation.** [`scripts/inline-polyfill.js`](../../../scripts/inline-polyfill.js) parses them
and rewrites everything between from `ui/base/polyfills/attr-fallback.iife.min.js` on every
`npm run build:demo` (`--check` fails CI if the copy is stale). Do not edit, move or reword the
markers or the generated block between them — including the generated comment inside it, which
the script emits verbatim. The emitted tag is a **classic** `<script>` on purpose: an inline
`type="module"` is deferred by spec and would run after first paint, silently restoring the bug.

### The page-level `WebSite` item

A hidden `<div itemscope itemtype="https://schema.org/WebSite">` sits in `<body>` **beside** the
card grid, not in it — it describes the site this page belongs to, so it is one of the three
top-level items that are not cards (see *Items ≠ cards* at the top of this document).

Its `potentialAction` is the **sitelinks searchbox**. The template variable is named by
`query-input`'s `valueName`, **not by any form field on the page** — a consumer substitutes the
user's term into `urlTemplate` itself. Google only honours the searchbox on a site's *homepage*;
here it is the markup shape that is being demonstrated, nothing more.

### The breadcrumb trail

`@browser.style/breadcrumbs` in its **hand-authored CSS-only form**, so the page needs no
script for it. The `<ol>` is the `BreadcrumbList` — the third non-card top-level item — and
**the last crumb is this page, so it takes no `item`**: see
[`ui/breadcrumbs/readme.md` § Structured data](../../breadcrumbs/readme.md).

### The two end-of-body scripts

Both are optional; every card renders identically without them while scripting is *enabled*. With scripting *disabled* the podcast and video cards swap their `<ui-play>` for the media element's native controls via `@media (scripting: none)` — the UA exposes them on `<video>` per spec, audio always ships `controls` — a static query evaluated once, which detects browser capability, not a merely-missing script.

| Script | What it does |
|---|---|
| `../video.min.js` | Polyfills the proposed media invoker commands (`command="--play-pause"`) behind the podcast card's `<ui-play>` button. The **bundled** build, deliberately: the source module imports `shared.js`, which adds a sequential request chain. |
| `/ui/save/save.min.js` | Fills the heart on click by flipping `aria-pressed` — the attribute `ui-save.css` keys its active state on. It listens for the `--save` invoker command on each `commandfor` target, with a delegated-click fallback: [`ui/save/readme.md` § Toggling](../../save/readme.md). |

## Demo-page CSS

`demo/schema.html` carries a small page-scoped `<style>` block. It is deliberately page
CSS, not system CSS — the reasoning lives here, per the repo's one-line-marker rule for
stylesheets.

### Off-screen cards skip style and layout

```css
main > lay-out > ui-card,
main > lay-out > ui-reveal { content-visibility: auto; contain-intrinsic-size: auto 567px; }
```

The page is ~60 cards / ~2,600 elements, and its top PageSpeed diagnostic was Style &
Layout — 1,670 ms of a 2.4 s main thread (not script: Script Evaluation was 22 ms there,
3 ms locally). Measured at an iPhone viewport, before → after: layout 550 → 132 ms, style
recalc 230 → 77 ms, layout objects 2,945 → 459, CLS unchanged at 0. `auto` remembers each
card's real size once rendered; **567px is this page's measured median card height**, so
the initial scrollbar starts close to the truth.

Verified still working while contained: in-page anchors (`#schema-music`), carousel
scroll-snap, `<ui-reveal>` disclosure, and accordion `<details>`.

**Why it is not in the card system.** A lone card on a product page must *not* skip
layout, and the intrinsic size is per-page data. The layout package already exposes the
same mechanism as a first-class attribute — `<lay-out size="…">` writes
`content-visibility: auto` + `contain-intrinsic-size` (`layout/core/base.css`) — but it
applies to the section, not to each card inside it. This page wants per-card granularity,
which has no token today; see `docs/plans/open-items.md`.

### Paywalled teaser fade — now a token

The paywalled news card's bottom fade shipped first as a page rule here
(`#schema-news-paywall ui-content { --ui-scroll-fade-end: 100cqb; mask: … }`) and was promoted
the same day to `content="gate"` — the `stack-gate` preset — so nothing page-scoped remains.
The reasoning (why not `scr`, why `100cqb`) lives with the token in
[content.md § gate](content.md#gate-holds-the-same-gradient-still).

### Accessibility overrides

```css
ui-content { --ui-content-muted: color-mix(in oklab, currentColor 85%, transparent); }
```

The card default is 65%, and `dateline` re-applies muting inside an already-muted
`byline` — 0.65² ≈ 0.42 of the original, which fails WCAG AA. 85% survives one
double-application and still clears 4.5:1, gray theme included. The real fix is stopping
the double application in `content.css`; tracked in `docs/plans/open-items.md`.

The page previously also overrode six `--color-*` tokens. Those values were **ported into
`ui/base/tokens.css`** on 2026-08-19 (light arms only — the dark arms of accent/info/
error/success double as theme-bundle plates under fixed white ink, so lightening them
lowers ink contrast). The override is gone; the tokens are global.

### Demo-only styling

`ui-chip[data-type]` and the media-less card's absolute chip placement are presentation
for this gallery alone — a type label on every card is a demo affordance, not a card-system
feature. They stay page-scoped.
