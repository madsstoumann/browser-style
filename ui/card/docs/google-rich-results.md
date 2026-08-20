# Google rich results — coverage audit of the card itemtypes

> Moved here from `docs/plans/2026-08-15-google-rich-results-audit.md` on 2026-08-19 — the
> living companion to [`schema.md`](schema.md) § Rich results vs. structured data.

> **Report only. No code changed by this document.** Audited 2026-08-15 against `v4` at
> `c42e63f`, and refreshed since: on 2026-08-15 when the `ComicIssue` card took the
> inventory from 47 to 48, on 2026-08-16 when `MusicGroup` took it to 49, and on
> 2026-08-19 when `VacationRental` took it to 50 (51 `schemaType` keys; the demo page's
> cards carry 52 distinct root itemtypes — the count bridge is at the top of `schema.md`).
> The question: how many of the card system's schema.org types have a live Google rich
> result, which do not, and is it worth adding or reshaping anything to close the gap.
>
> ⛔ **The gallery itself could not be fetched.**
> `developers.google.com` is a **policy denial** at this session's egress proxy
> (`connect_rejected`, gateway 403 to CONNECT; `google.com` likewise), and
> `/root/.ccr/README.md` is explicit: *"do not retry organization policy denials (403/407) —
> report them instead."* Unlike the schema.org vocabulary — which has an open mirror at
> `raw.githubusercontent.com/schemaorg/schemaorg`, the route recorded in
> [`ui/card/docs/schema.md`](schema.md) — Google's search documentation is
> not published in any public repository. The one candidate checked,
> `glitchdigital/structured-data-testing-tool`, ships a 2019-era *"common markup used by
> Google"* preset, not the current gallery.
>
> **So the Google column is not uniformly sourced, and every row says which it is.**

## How to read this

Our side is mechanical. The Google side is not. Each row carries one marker:

| Marker | Means |
|---|---|
| **`repo`** | Already researched in this repository, with a citation. Trustworthy. |
| **`dump`** | Resolved against the schema.org 30.0 vocabulary dump. Trustworthy. |
| **⚠** | **Model knowledge, not fetched.** Plausible, unverified, and the reason [§ 6](#6-what-to-verify) exists. |

Roughly two thirds of the Google column is ⚠. That is the honest state of it, and the
document is more useful saying so than presenting a uniform-looking table that is half
remembered. **Do not act on a ⚠ row without checking it first.**

The inventory itself is generated, not transcribed:

```sh
node --input-type=module -e "
import { SCHEMA_TYPES } from './ui/card/render.js';
console.log(new Set(Object.values(SCHEMA_TYPES)).size)"   # → 50
```

---

## 1. The headline answer

Of **50 distinct itemtypes** across 52 `schemaType` keys (`profile` and `artist` both resolve
to `Person`):

| Bucket | Count | Meaning |
|---|---|---|
| **Live** | ~18 | A Google feature exists today and this type is its subject |
| **Withdrawn** | 7 | A feature existed and Google retired or narrowed it |
| **None** | ~25 | Valid schema.org, no Google feature ever |

The counts are approximate *because* of the ⚠ rows — several types sit on a Live/None boundary
that only the live gallery can settle (`SoftwareApplication`, `Book`, `MusicAlbum`, `TVSeries`,
`Menu`).

**The short version: coverage of the live gallery is already high, and the remaining gaps are
not card types.** Almost every mainstream feature — Product, Recipe, Event, Job posting, Video,
Local business, Organization, Review, Q&A, Loyalty, Movie, Article, Discussion forum, Education
Q&A — already maps to a type we render, several of them researched against Google's own
documentation when they were built. What is missing is smaller and mostly structural: see
[§ 4](#4-gaps--live-features-with-no-card-type).

---

## 2. Two structural findings

These matter more than any individual row.

### 2.1 Rich results are page-level; cards are components

`demo/schema.html` carries **61 top-level entities**. No page shaped like that is a rich-result
candidate whatever markup it holds, because Google resolves *the page's* main entity. That is
not a defect in the demo — it is a gallery, and a gallery of 61 subjects is what it is meant to
be.

The real candidates already exist and are already shaped correctly:

| Page | Main entity | Supporting scopes |
|---|---|---|
| `demo/articles/article.html` | `Article` | `Person`, `Organization`, `InteractionCounter` ×4 |
| `demo/articles/news.html` | `NewsArticle` | same |
| `demo/products/silk-gown-*.html` ×4 | `ProductGroup` | `Product` ×3, `Offer` ×4, `AggregateRating` |

All six carry `mainEntityOfPage`. **So "is card type X eligible?" is the wrong question.** The
answerable one is "does a single-entity page built from card X carry what Google requires?" —
and today that is testable for exactly two type families. Everything else would need a
standalone page before the question even applies.

### 2.2 Microdata is supported; JSON-LD is a preference

Google reads **microdata for every rich result**. JSON-LD is *recommended*, not required — a
distinction worth stating plainly, because "Google recommends JSON-LD" is the single most
common reason a system like this gets talked into a rewrite.

Inline microdata buys something JSON-LD structurally cannot: **the markup travels with the
component**. A card dropped into any page is annotated with no second payload to keep in sync.
A JSON-LD emitter would create a parallel source of truth that has to agree with the microdata
forever, and the first time they disagree the page ships two contradictory answers.

**Recommendation: keep microdata-only.** Recorded here so it reads as a decision rather than an
oversight the next time a Lighthouse audit suggests otherwise.

**Update.** The renderer now takes a `schema` mode ([card.md § Schema mode](./card.md#schema-mode)):
`"micro"` (the default, unchanged) and `""`, which emits no structured data at all. That does
**not** re-open the decision above — raw mode is *subtractive*, derived from the microdata by
stripping it, so there is no second source of truth to disagree with. A `"jsonld"` mode is
reserved and deliberately unimplemented for exactly the reason this section gives; the design
and the equivalence gate that would answer the objection are in
[open-items.md § 34](../../../docs/plans/open-items.md).

---

## 3. The table

Sorted by bucket, then alphabetically. `key` is the `schemaType` discriminator.

### Live

| itemtype | key | Google feature | Src |
|---|---|---|---|
| `Article` | `article` | Article | ⚠ |
| `NewsArticle` | `news` | Article | ⚠ |
| `Product` | `product` | Product snippets / merchant listings; **Product variants** via the `ProductGroup` subtype | `repo` — [schema.md § Product](schema.md), incl. the distinct-URL requirement and price formatting |
| `Recipe` | `recipe` | Recipe (and the surviving `HowTo` shape, nested as `recipeInstructions`) | `repo` — schema.md § Rich results, rider 1 |
| `Event` | `event` | Event; ticket tiers as `Offer` scopes | `repo` — `render.js` DETAILS.event comment |
| `JobPosting` | `job` | Job posting; `EmployerAggregateRating` as a second top-level item | `repo` — schema.md § Employer rating |
| `VideoObject` | `video` | Video | `repo` — 2026-08-05 coverage doc |
| `LocalBusiness` | `business` | Local business (31 allowlisted subtypes) | ⚠ |
| `Organization` | `organization` | Organization / merchant info; multi-location via `department` | `repo` — 2026-08-05 coverage doc |
| `Review` | `review` | Review snippet | ⚠ |
| `QAPage` | `qa` | Q&A | `repo` — 2026-08-05 coverage doc |
| `MemberProgram` | `loyalty` | Loyalty program (live June 2025; AU BR CA FR DE MX UK US) | `repo` — schema.md § Loyalty programme, incl. the two tier benefits Google reads |
| `Movie` | `movie` | Movie carousel | `repo` — 2026-08-05 coverage doc |
| `Quiz` | `quiz` | Education Q&A — **flashcard arm only**, `eduQuestionType: "Flashcard"` required | `repo` — schema.md § Quiz |
| `SocialMediaPosting` | `social` | Discussion forum, via the `DiscussionForumPosting` subtype (which also flips `headline` on) | `repo` — schema.md § Subtypes |
| `Book` | `book` | Book actions | ⚠ — believed limited to approved partners |
| `SoftwareApplication` | `software` | Software app | ⚠ — **most likely retired; check first** |
| `ItemList` | `comparison` | Carousel host + the surviving *Course list* | ⚠ — we emit `ItemList` as a card subject, not as a carousel host ([§ 4](#4-gaps--live-features-with-no-card-type)) |

### Withdrawn — kept deliberately

Already narrated in [`schema.md` § Rich results vs. structured data](schema.md).
Not restated here; the dates below are that section's, and it is the source of truth.

| itemtype | key | What happened | Src |
|---|---|---|---|
| `FAQPage` | `faq` | Results stopped 2026-05-07; docs removed 2026-06-15 | `repo` |
| `HowTo` | `howto` | Deprecated Aug 2023; docs removed 2023-09-14. Still supported *inside* `Recipe` | `repo` |
| `SpecialAnnouncement` | `announcement` | Deprecated 2025-07-31; docs removed 2025-09-09 | `repo` |
| `ClaimReview` | `claim` | Phasing out of Search; still powers Fact Check Explorer | `repo` |
| `Dataset` | `dataset` | Only ever reached Dataset Search, never a mainstream result | `repo` |
| `Course` | `course` | *Course info* lost 2025-09-09; only *Course list* survives (needs ≥3 in an `ItemList`) | `repo` |
| `Quiz` (MC arm) | `quiz-mc` | Practice Problems retired Jan 2026 | `repo` |

**The policy stands.** What Google withdrew is a rendering promise, not a vocabulary. Every one
is still valid schema.org, and AI agents, answer engines and GEO pipelines read the microdata
off the page without asking whether Google would have drawn a box around it.

### None — valid vocabulary, no Google feature

| itemtype | key | Note | Src |
|---|---|---|---|
| `CreativeWork` | `content` | Generic fallback; no feature by design | `dump` |
| `Person` | `profile`, `artist` | The *feature* is Profile page, which wants a `ProfilePage` **host** — see [§ 4](#4-gaps--live-features-with-no-card-type) | ⚠ |
| `Place` | `location` | `LocalBusiness` is the feature; bare `Place` is not | ⚠ |
| `ItemList` | `places` | Google's host carousel takes `ItemList` only in combination with Course list, Movie, Recipe or Restaurant — a list of offices or of homes is none of those, and there is no real-estate result at all | ✓ |
| `Offer` | `membership` | A component of the Product/Event features, not a subject | `dump` |
| `Question` | `poll` | `QAPage` is the feature; a bare `Question` is not | ⚠ |
| `Reservation` | `booking` | — | ⚠ |
| `ContactPoint` | `contact` | — | ⚠ |
| `ItemList` | *(see Live)* | Listed above; subject vs host is the whole distinction | ⚠ |
| `Quotation` | `quote` | — | `dump` |
| `EventSeries` | `timeline` | `Event` is the feature; the series is not | ⚠ |
| `ImageGallery` | `gallery` | Chosen over legacy `MediaGallery` as the Google-recognised type, but not itself a feature | `repo` — 2026-08-05 coverage doc |
| `Observation` | `statistic` | — | `dump` |
| `EducationalOccupationalCredential` | `achievement` | — | ⚠ |
| `Service` | `service` | — | ⚠ |
| `RealEstateListing` | `realestate` | No Google real-estate result; *Vacation rental* is a separate feature and a different type (now shipped as `vacationrental`, also with no open result — it is a partner-programme feed) | ⚠ |
| `VacationRental` | `vacationrental` | No open rich result — Google's *Vacation rental* feature is fed through its partner programme, not published markup ([§ 5](#5-what-not-to-chase)) | `repo` — schema.md § Vacation rental |
| `Menu` | `menu` | Feeds local-business context, not its own result | ⚠ |
| `MedicalWebPage` | `medical` | — | ⚠ |
| `MusicAlbum` | `music` | Music actions exist for approved partners; not a general result | ⚠ |
| `MusicGroup` | `musicgroup` | Same as `MusicAlbum` — artist/band knowledge-panel data comes from approved music partners, not from page markup | ⚠ |
| `PodcastEpisode` | `podcast` | — | ⚠ |
| `PodcastSeries` | `podcastseries` | — | ⚠ |
| `TVSeries` | `tvseries` | Watch actions exist for approved partners; not a general result | ⚠ |
| `TVEpisode` | `tvepisode` | — | ⚠ |
| `DefinedTermSet` | `glossary` | Both it and `DefinedTerm` are `pending.schema.org` | `repo` — schema.md § Glossary |
| `ComicSeries` | `comicseries` | — | `dump` |
| `ComicIssue` | `comicissue` | — | `dump` |

---

## 4. Gaps — live features with no card type

Three, and only one of them is cheap.

### 4.1 `BreadcrumbList` — the one clear win

Still live, and it applies to **every page on the site**, not one card type.
`ui/breadcrumbs` currently emits **zero microdata**:

```html
<nav aria-label="Breadcrumb">
  <ol data-breadcrumbs>
    <li><a href="…">Books</a></li>
```

No `BreadcrumbList`, no `ListItem`, no `position`, no `item`. The six single-entity pages
([§ 2.1](#21-rich-results-are-page-level-cards-are-components)) have no breadcrumb at all.
Adding it is self-contained: the markup already has the right shape, it needs the attributes.

### 4.2 `ProfilePage` — a host, not a card

Google's profile-page result wants a `ProfilePage` wrapping the `Person`. Our `profile` and
`artist` cards emit a bare `Person`, which is correct as a component and insufficient as a
page. Same shape of problem as 2.1: it is page furniture, not a card type.

### 4.3 `ItemList` as a carousel host

The surviving half of the Course feature (*Course list*, ≥3 in an `ItemList`) and the shape
behind Movie/Recipe carousels. We emit `ItemList` as a card *subject* (`comparison`) but have
no pattern for a page that lists N cards as one `ItemList`. This is the most interesting of the
three, because `<lay-out>` already produces exactly that markup shape — it just carries no
microdata.

---

## 5. What not to chase

`MathSolver`, Vehicle listing, `Speakable`, IPTC image metadata. Each would be a new card type
chasing narrow or region-limited coverage. Adding a type because a gallery lists it — rather than
because content needs expressing — is how a taxonomy rots.

**Superseded 2026-08-18:** `VacationRental` was on this list and is not any more — it shipped as
the `vacationrental` card type, because content needed expressing, not because the gallery lists
it. The reasoning above still stands as the *test*, and the type still has no open rich result:
Google's *Vacation rental* feature is fed through its partner programme, not by published markup.
See [schema.md § Vacation rental](schema.md).

Note also that three of the four SUBTYPE families already cover vertical ground a naive reading
would call missing: `product` allowlists `Vehicle`/`Car`/`Motorcycle`, `social` allowlists
`DiscussionForumPosting`, and `business` allowlists 31 `LocalBusiness` subtypes including
`Hotel` and `Resort`.

---

## 6. What to verify

**This is the section that matters.** The document is worth what its ⚠ rows are worth.

1. **Walk the gallery.** Open
   <https://developers.google.com/search/docs/appearance/structured-data/search-gallery> on a
   machine with egress and check every ⚠ row. Where a feature has been retired since, move the
   row to **Withdrawn** *with its date*, matching the format schema.md § Rich results already
   uses. Priority order: `SoftwareApplication` (most likely wrong), `Book`, `MusicAlbum`,
   `TVSeries`, `Menu`, `RealEstateListing`.
2. **Rich Results Test the two real candidates** —
   `demo/articles/article.html` and `demo/products/silk-gown-indigo.html`. They are the only
   pages in the repo where a pass/fail verdict means anything, and neither has been run through
   it. Any failure there is worth more than any row in § 3.
3. **Re-derive the inventory** before trusting the row count — the one-liner at the top of this
   document. 50 rows, no itemtype missing, none invented.
4. **Dates must agree with `schema.md` § Rich results.** If this table and that section
   disagree, that section wins.
