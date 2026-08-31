# Card model — the editor-facing data model

The `card` content model as a **CMS and editor** sees it: which fields exist, what type each
one is, which values are legal, and which control an editor should render. It is the reference
a visual card editor gets built from.

It is deliberately **not** the renderer's view. For how a field becomes markup see
[card.md](./card.md); for microdata and schema.org semantics see [schema.md](./schema.md); for
what a card *looks* like see the `card-preset` model, summarised in § Preset.

**Sources of truth.** Every table below is transcribed from one, and says which:

| Content | Source |
|---|---|
| Envelope fields, types, localization, editor groups | [`cms/baseline/models/card.schema.json`](../../../cms/baseline/models/card.schema.json) |
| `schemaType` → itemtype | `SCHEMA_TYPES`, `render.js` |
| `subtype` allowlists | `SUBTYPES`, `render.js` — mirrored in [schema.md § Subtypes](./schema.md#subtypes), checked both ways by `tokens.lint.js` |
| Per-type `details` keys | [`data/details.json`](../data/details.json) — the machine manifest; the tables below are **generated** from it by `details.build.js`, and `details.lint.js` holds it against `DETAILS` in `render.js` and the whole `data/` corpus |
| Enumerated value sets | the allowlist `Set`s in `render.js` (+ the manifest's `vocab` block) — § Lookups |
| Token dropdowns | generated blocks from [`data/tokens.json`](../data/tokens.json) |
| Field-declaration format | [`cms/baseline/models/README.md`](../../../cms/baseline/models/README.md) (UCM) |
| Instance value markers | `cms/baseline/pages/UCF.md` — `$ref`, `$asset`, `$richtext` |

---

## The storage contract

**One content model, 55 payloads.** Everything shared is a native CMS field; everything
type-specific lives in a single JSON field called **`details`**, discriminated by
`schemaType`. A CMS therefore needs one card content type, not fifty-five.

```
card
├── internalName, schemaType, headline, summary, media, tags …   ← native CMS fields
├── preset  →  $ref card-preset                                  ← presentation, separate model
└── details { … }                                                ← one JSON field, shape varies
```

This is already how the integrations bind it.
`cms/integrations/contentful/card/index.html` hands the JSON field to the editor component and
denormalises the chosen type into a sibling field so the CMS can filter on it; the Umbraco
wrapper does the same over `postMessage`.

> **A note on the name.** The older `content-card.schema.json` (25 types) calls this field
> `data`. The current model calls it **`details`**, and so do `render.js` and all 67
> instances in `ui/card/data/`. `details` is the name.

**Where the machine contract lives.** In `card.schema.json` the envelope is fully
machine-readable; `details` stays a bare `object` there (its `description` is a generated
compact digest), and its per-type contract is [`data/details.json`](../data/details.json) —
fields, controls, lookups, shared shapes, conditional gates. `details.build.js` compiles it
into the card editor (`cms/editors/card/src/details.data.js`) and regenerates the tables
below; `details.lint.js` fails the build when the manifest, `render.js` and the corpus
disagree.

---

## Field-declaration format

UCM field types — the vocabulary a field may declare:

| Group | Types |
|---|---|
| Core | `string` · `text` · `number` · `boolean` · `date` · `datetime` |
| Structural | `richtext` · `media` · `reference` · `array` · `select` · `url` · `object` |
| Special | `slug` · `tags` · `color` · `geopoint` |

A field carries `type`, `title`, `description`, optional `validation`
(`required`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `minItems`, `maxItems`),
optional `options` (type-specific — `choices` for `select`, `accept`/`maxSize` for `media`,
`referenceType`/`multiple` for `reference`) and optional `ui.widget`.

**Localization default:** `string`, `text` and `richtext` are localized; `number`, `boolean`,
`date`, `media` and `reference` are invariant. Fields that opt out say so explicitly.

The tables below add one column the schema does not have — **control**, the widget an editor
should render. It is a hint, not a layout: `text`, `textarea`, `richtext`, `number`, `date`,
`datetime`, `time`, `tel`, `email`, `url`, `toggle`, `select`, `media`, `geopoint`, `repeater`,
`fieldset`, `reference`, `tags`.

---

## The envelope

The fields every card has, whatever its type.

| Field | Type | Loc. | Req. | Control | Lookup / notes |
|---|---|---|---|---|---|
| `internalName` | string | no | **yes** | text | the CMS `displayField`; locale-independent, free-form |
| `schemaType` | select | no | **yes** | select | § Discriminator — 55 values, default `content`; the editor groups the dropdown by the eleven `schema.html` sections (`groups` in the manifest) |
| `chip` | object \| array | — | — | fieldset / repeater | text-column status flag. **Not the same as `furniture.chip`** |
| `cover` | url | no | — | url | makes the whole card a link |
| `eyebrow` | string | yes | — | text | |
| `headline` | richtext | yes | **yes** | richtext | max 256; images and embeds disabled |
| `subheadline` | string | yes | — | text | some types fill this from `details` — § Discriminator |
| `summary` | text | yes | — | textarea | `review` overrides it from `details` |
| `body` | richtext | yes | — | richtext | images and embeds disabled |
| `published` / `modified` | datetime | — | — | datetime | |
| `readingTime` | string | yes | — | text | |
| `media` | array | — | — | repeater | § Media item |
| `authors` | array | — | — | repeater | `{name (req), role, avatar}` → person |
| `tags` | tags | yes | — | tags | |
| `actions` | array | — | — | repeater | `{link, style, ariaLabel, icon, iconAt}`; style ∈ `primary` `secondary` `ghost`; `icon` an `ui/icon` glyph name, `iconAt` `end` to place it after the text |
| `links` | array | — | — | repeater | |
| `furniture` | object | — | — | fieldset | § Furniture |
| `engagement` | object | — | — | fieldset | `{viewCount, likeCount, shareCount, commentCount}` — all numbers |
| `preset` | reference | no | — | reference | → `card-preset`, single |
| `flipside` | reference | no | — | reference | → `card`, single; resolved one level deep |
| `details` | object | — | — | *per type* | § Per-type details |

**Editor groups** (`structure.layout`): Basics · Body & Dates · Media · People & Engagement ·
Navigation · Type Details.

> ⚠️ **`chip` and `cover` are in no layout group.** An editor generated from
> `structure.layout` alone will silently omit both. Drive the form from `properties`, and use
> `structure.layout` only for ordering.

> ⚠️ **Two different chips.** `chip` is a status flag in the text column;
> `furniture.chip` is an overlay on the media — and setting it *suppresses* the automatic
> type label. They are unrelated fields with the same name one level apart.

### Furniture

Overlay elements on the media frame. Content decides *what* and *whether*; the preset decides
how it looks. Each accepts a free-string `style` token override.

| Key | Shape |
|---|---|
| `chip` | `{text, badge, style}` |
| `beacon` | `{text, style}` |
| `sticker` | `{lines: [{role, text, sup}], style}` — role ∈ `label` `lead` `plain` |
| `marquee` | `{text, style}` — a full-width band, not 3×3 furniture |
| `save` | `{shape, saved, style}` — shape ∈ `heart` `bookmark` `star`; bare `true` accepted |
| `lightbox` | `{label, shape, style}` — shape ∈ `photos` `maximize`; bare `true` accepted |
| `play` | `{label, style}` — bare `true` accepted |

---

## The discriminator

`schemaType` selects the itemtype, the microdata mapping, and which `details` shape applies.
**55 values, 52 distinct itemtypes** — `profile`/`artist` both emit `Person`,
`comparison`/`places`/`filelist` all emit `ItemList`.

`subtype` narrows it. **Only 9 of the 55 types have a subtype allowlist**, so the control is
conditional on `schemaType` and must be absent for the other 46:

| schemaType | Base itemtype | Values |
|---|---|---|
| `article` | Article | 7 |
| `business` | LocalBusiness | 60 |
| `event` | Event | 19 |
| `location` | Place | 23 |
| `news` | NewsArticle | 5 |
| `organization` | Organization | 22 |
| `product` | Product | 8 |
| `social` | SocialMediaPosting | 3 |
| `software` | SoftwareApplication | 3 |

The full value lists are in [schema.md § Subtypes](./schema.md#subtypes) — one table, kept in
sync with `SUBTYPES` by `tokens.lint.js`, so an editor should read them from `render.js`
rather than copying them.

Three rules an editor must honour:

1. **Allowlisted, never verbatim.** A value off the list is ignored and the base type is used —
   silently. No error surfaces, so validate in the editor.
2. **A value from another type's list is refused.** The lists are not interchangeable.
3. `details.businessType` is the legacy business-only spelling. When both are present,
   `subtype` wins. New content should not write `businessType`.

`Campground` and `BlogPosting` are the only values appearing on two lists. Picking one over the
other changes which renderer runs, not the emitted itemtype.

### Fields some types take from `details`

Four types fill the envelope's `subheadline` from `details` instead
(`SUBHEADLINE_SLOT`). An editor should show those fields under the type panel, not the Basics
group:

<!-- details:subheadline -->
| schemaType | Fields filling the envelope subheadline |
|---|---|
| `product` | `brand` |
| `profile` | `jobTitle` `organization` |
| `music` | `artist` `artistUrl` |
| `artist` | `jobTitle` `organization` |
<!-- /details -->

**`paywalled`** (boolean) is accepted in `details` on any type whose itemtype is a CreativeWork,
Event or Place — including `article`, `news` and `content`, which otherwise take no `details`.
Show it as a checkbox on those types; it emits `isAccessibleForFree: False` and is dropped
silently on Product, JobPosting, Person, Offer and Organization (out of domain). See
[schema.md § Paywall](./schema.md#paywall--isaccessibleforfree).

---

## Shared sub-shapes

Recurring structures. Each is one reusable editor fieldset; the per-type tables reference them
by name rather than repeating the fields.

| Name | Shape | Consumed by |
|---|---|---|
| **rating** | `{value, max (default 5), count}` | `ratingPart()` |
| **price** | `{current, original, currency, discountText}` — variants per type | — |
| **geo** | `{latitude, longitude, url, links[]}` — `links` is the external-map row: provider ids (`google` `apple` `osm`) or `{provider, label?, url?}`, allowlisted. The brand marks are **not** content: they come from the `mapIcons` render option | `geoPart()` / `mapLinks()` |
| **address** | `{streetAddress, postalCode, addressLocality, addressRegion, addressCountry}` | `addressPart()` |
| **openingHours** | `[{schema: "Mo-Fr 09:00-17:00", days, time, display}]` | `hoursPart()` |
| **contacts** | `[{type: email\|phone\|url, value, label}]` | `contactLink()` |
| **person** | `{name, role, avatar}` | `avatarPart()` / `byline()` |
| **list item** | string **or** `{text, icon, href, itemprop}` | `listPart()` |
| **key row** | a `key: value` pair in a meta run — the label is emitted as `<strong data-part="key">`, colon normalised; the value keeps the `itemprop` | `keyed()` |
| **accordion** | `[{summary, body}]` | `accordion()` |

**Machine value + display twin.** Many types carry both a machine value and a pre-formatted
string — `duration` / `durationDisplay`, `datePosted` / `datePostedDisplay`. The machine value
stays schema-ready (`PT15M`, ISO dates, raw numbers); the `*Display` twin exists only where the
formatting is not derivable. An editor should treat the twin as optional and never as the
source of truth.

**The `*Display` suffix is load-bearing, not a habit.** It is the one marker that separates
presentation from schema data inside `details`, so a structured-data serializer needs exactly
one rule — skip any key ending `Display`. Measured over the shipped corpus, the 24 keys that
emit no microdata at all are *precisely* the `*Display` twins. Keep the convention when adding
a field; moving the twins into a separate object was evaluated and rejected
([open-items.md § 34](../../../docs/plans/open-items.md)) because it would split one fact
across two places for no gain.

### Three kinds of key live in `details`

| Kind | How to recognise it | Share of the corpus |
|---|---|---|
| **Schema-bearing** | changes the emitted microdata | 73% |
| **Display twin** | ends in `Display`; a pre-formatted string beside a machine value | 8% |
| **Unmapped content** | real card content with no schema.org property — `amenities`, `prerequisites`, `venue`, `capacity`, `note`, `disclaimer` | 16% |

The third kind is the one that surprises people. It is **not** a gap to be fixed: those facts
are shown to readers and simply have no property in the vocabulary that would be in domain.
They belong in `details` as ordinary content, and a serializer ignores them the same way it
ignores a display twin. Do not go hunting for a mapping that does not exist.

---

## Per-type `details`

<!-- details:counts -->
**4 types are envelope-only** — no `DETAILS` renderer: `content`, `article`, `news`, `quote` (`article` and `news` still accept `details.subtype`, and every PAYWALL_TYPES member accepts `details.paywalled`). The remaining **51** are below.
<!-- /details -->

`→ name` in the Lookup column points at § Shared sub-shapes; a `SCREAMING_CASE` name points at
§ Lookups.

### `product` — Product

<!-- details:fields type=product -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `rating` | object | fieldset | {value, max, count} |
| `price` | object | fieldset | {current, original, currency, discountText} |
| `availability` | string | text |  |
| `validUntil` | date | date |  |
| `validUntilDisplay` | string | text | display twin |
| `sku` | string | text |  |
| `brand` | string | text | → Brand.name, rendered in the subheadline slot |
| `brandUrl` | url | url | crawlable &lt;a itemprop="url"&gt; around the brand name |
| `subtype` | select | select | SUBTYPES.product |
| `variants` | object | fieldset | {variesBy, productGroupID, control, tile, layout, items} · ProductGroup — emits only when subtype resolves to ProductGroup |
| `reviews` | array | repeater | {author, rating, max, datePublished, dateDisplay, context, headline, body} · detail pages only, never the teaser |
<!-- /details -->

### `event` — Event

<!-- details:fields type=event -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `startDate` | datetime | datetime |  |
| `endDate` | datetime | datetime |  |
| `dateDisplay` | string | text | display twin |
| `attendanceMode` | select | select | ATTENDANCE_MODES |
| `status` | string | text |  |
| `subtype` | select | select | SUBTYPES.event |
| `location` | object | fieldset | {name, address} |
| `organizer` | object | fieldset | {name} |
| `offers` | array | repeater | {name, price, currency, availability, validThrough} |
<!-- /details -->

### `recipe` — Recipe

<!-- details:fields type=recipe -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `prepTime` | string | text | ISO 8601 duration, e.g. PT15M |
| `cookTime` | string | text | ISO 8601 duration |
| `servings` | number | number |  |
| `ingredients` | array | repeater |  |
| `instructions` | array | repeater | → HowToStep accordion |
<!-- /details -->

### `review` — Review

<!-- details:fields type=review -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `rating` | object | fieldset | {value, max, count} |
| `aggregateRating` | object | fieldset | {value, max, count} |
| `reviewer` | object | fieldset | {name, title, avatar, verified} |
| `reviewDate` | date | date |  |
| `reviewDateDisplay` | string | text | display twin |
| `reviewerVerifiedText` | string | text | override for the "Verified purchase" badge |
| `reviewedType` | select | select | REVIEWED_TYPES |
| `productReviewed` | string | text |  |
| `productImage` | url | url |  |
| `productPrice` | object | fieldset | {amount, currency, current} |
<!-- /details -->

### `job` — JobPosting

<!-- details:fields type=job -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `company` | string | text |  |
| `industry` | string | text | suppressed when the envelope owns it |
| `employmentType` | string | text | e.g. FULL_TIME |
| `employmentTypeDisplay` | string | text | display twin |
| `location` | string | text |  |
| `locationCountry` | string | text | ISO country code |
| `salaryRange` | object | fieldset | {min, max, currency, period, periodDisplay} |
| `applicationDeadline` | date | date |  |
| `applicationDeadlineDisplay` | string | text | display twin |
| `employerRating` | object | fieldset | {value, count, max, organization, sameAs} · a 2nd top-level item (EmployerAggregateRating) |
| `qualifications` | array | repeater |  |
| `benefits` | array | repeater |  |
<!-- /details -->

### `course` — Course

<!-- details:fields type=course -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `duration` | string | text |  |
| `courseWorkload` | string | text |  |
| `difficultyLevel` | string | text |  |
| `instructor` | object | fieldset | {name, title} |
| `provider` | string | text |  |
| `price` | object | fieldset | {current, original, currency, discountText} |
| `prerequisites` | array | repeater | string items allowed · {text, icon, href, itemprop} |
| `learningOutcomes` | array | repeater | string items allowed · {text, icon, href, itemprop} |
<!-- /details -->

### `booking` — Reservation

<!-- details:fields type=booking -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `serviceName` | string | text |  |
| `venue` | string | text |  |
| `capacity` | number | number |  |
| `duration` | string | text |  |
| `price` | object | fieldset | {hourlyRate, currency} |
| `amenities` | array | repeater | string items allowed · {text, icon, href, itemprop} |
| `cancellationPolicy` | text | textarea |  |
| `specialRequests` | text | textarea |  |
<!-- /details -->

### `poll` — Question

<!-- details:fields type=poll -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `options` | array | repeater | {headline, votes} |
| `totalVotes` | number | number |  |
| `closes` | date | date |  |
| `closesDisplay` | string | text | display twin |
<!-- /details -->

### `profile` — Person

<!-- details:fields type=profile -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `jobTitle` | string | text | subheadline slot |
| `organization` | string | text | subheadline slot |
| `location` | string | text |  |
| `contacts` | array | repeater | {type, value, label} |
<!-- /details -->

### `faq` — FAQPage

<!-- details:fields type=faq -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `items` | array | repeater | {question, answer} · → accordion |
<!-- /details -->

### `timeline` — EventSeries

<!-- details:fields type=timeline -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `items` | array | repeater | {date, endDate, headline, location, locationUrl, text, theme} |
| `locationUrl` | url | url | emits a VirtualLocation |
<!-- /details -->

### `gallery` — ImageGallery

<!-- details:fields type=gallery -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `albumName` | string | text |  |
| `totalCount` | number | number |  |
| `license` | url | url |  |
| `acquireLicensePage` | url | url |  |
| `creator` | string | text |  |
| `creditText` | string | text |  |
| `copyrightNotice` | string | text |  |
<!-- /details -->

### `statistic` — Observation

<!-- details:fields type=statistic -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `metricName` | string | text |  |
| `currentValue` | number | number |  |
| `displayValue` | string | text | display twin |
| `unit` | string | text |  |
| `trend` | string | text |  |
| `trendPercentage` | number | number |  |
| `comparisonPeriod` | string | text |  |
| `note` | text | textarea |  |
<!-- /details -->

### `achievement` — EducationalOccupationalCredential

<!-- details:fields type=achievement -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `status` | string | text |  |
| `issuingOrganization` | string | text |  |
| `dateEarned` | date | date |  |
| `dateEarnedDisplay` | string | text | display twin |
| `expirationDate` | date | date |  |
| `expirationDateDisplay` | string | text | display twin |
| `skillLevel` | string | text |  |
| `credentialId` | string | text |  |
| `verificationUrl` | url | url |  |
<!-- /details -->

### `goal` — AchieveAction

<!-- details:fields type=goal -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `status` | select | select | GOAL_STATUS · mapped to ActionStatusType URLs; anything else emits no actionStatus |
| `startDate` | date | date |  |
| `endDate` | date | date |  |
| `dateRangeDisplay` | string | text | display twin |
| `agentName` | string | text | agent → Person |
| `target` | object | fieldset | {name, value, unitText} · → QuantitativeValue (the goal) |
| `current` | object | fieldset | {value, unitText} · → QuantitativeValue (progress so far) |
| `progressLabel` | string | text | the ring's small caption |
| `progressDisplay` | string | text | display twin · human line, e.g. "6 of 10 minutes" |
| `hue` | select | select | HUES · ring theme; unknown values drop the attribute |
<!-- /details -->

### `announcement` — SpecialAnnouncement

<!-- details:fields type=announcement -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `announcementType` | string | text |  |
| `priority` | string | text |  |
| `priorityDisplay` | string | text | display twin |
| `effectiveDate` | object | fieldset | {start, startDisplay, end, endDisplay} |
| `targetAudience` | string | text |  |
| `actionRequired` | text | textarea |  |
<!-- /details -->

### `business` — LocalBusiness

<!-- details:fields type=business -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `subtype` | select | select | SUBTYPES.business |
| `businessType` | string | text | legacy alias — subtype wins; new content should not write it |
| `address` | object | fieldset | {streetAddress, postalCode, addressLocality, addressRegion, addressCountry} |
| `geo` | object | geopoint | {latitude, longitude, url, links} |
| `telephone` | string | tel |  |
| `email` | string | email |  |
| `website` | url | url |  |
| `priceRange` | string | text |  |
| `rating` | object | fieldset | {value, max, count} |
| `sameAs` | array | repeater |  |
| `foundingDate` | date | date |  |
| `openingHours` | array | repeater | {schema, days, time, display} |
<!-- /details -->

### `comparison` — ItemList

<!-- details:fields type=comparison -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `items` | array | repeater | {name, price, image, score, scoreDisplay} |
| `recommendation` | string | text |  |
| `summary` | text | textarea |  |
<!-- /details -->

### `contact` — ContactPoint

<!-- details:fields type=contact -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `contactType` | string | text |  |
| `department` | string | text |  |
| `availableHours` | string | text |  |
| `availableHoursDisplay` | string | text | display twin |
| `responseTime` | string | text |  |
| `languages` | array | repeater | array OR comma-separated string |
| `contactMethods` | array | repeater | {type, value, label} |
<!-- /details -->

### `location` — Place

<!-- details:fields type=location -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `subtype` | select | select | SUBTYPES.location |
| `address` | object | fieldset | {streetAddress, postalCode, addressLocality, addressRegion, addressCountry} |
| `geo` | object | geopoint | {latitude, longitude, url, links} · also feeds the map frame and the external-map link row |
| `openingHours` | array | repeater | {schema, days, time, display} |
| `hours` | string | text | plain-string alternative to openingHours |
| `contact` | string | text |  |
| `amenities` | array | repeater | string items allowed · {text, icon, href, itemprop} |
<!-- /details -->

### `places` — ItemList

<!-- details:fields type=places -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `kind` | select | select | PLACE_KINDS |
| `items` | array | repeater | shape depends on kind — LocalBusiness rows (name, url, branchCode, geo, address, telephone, openingHours[]) or residence rows (type ∈ RESIDENCE_TYPES, name, url, image, imageAlt, datePosted, price{amount,currency}, geo, address, floorSize, numberOfBedrooms, numberOfRooms, yearBuilt) |
| `center` | object | geopoint | {latitude, longitude, url} · map centre — NOT details.geo |
| `regionDisplay` | string | text | display twin |
| `order` | select | select | ITEM_LIST_ORDERS |
| `ordered` | boolean | toggle |  |
| `description` | text | textarea |  |
| `list` | string | text | "sr" renders the list screen-reader-only |
| `slides` | boolean | toggle | turns the frame into a carousel |
| `slide` | object | fieldset | only when `slides` · {variant, media, content, cta} |
<!-- /details -->

### `filelist` — ItemList

<!-- details:fields type=filelist -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `files` | array | repeater | {name, type, size, url, download} |
| `description` | text | textarea | fallback only — the envelope summary owns description when filled |
| `note` | text | textarea |  |
<!-- /details -->

### `membership` — Offer

<!-- details:fields type=membership -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `price` | object | fieldset | {monthly, yearly, currency, savings} |
| `trialPeriod` | string | text |  |
| `trialText` | string | text |  |
| `features` | array | repeater |  |
| `limitations` | array | repeater |  |
| `isPopular` | boolean | toggle |  |
| `popularText` | string | text |  |
<!-- /details -->

### `social` — SocialMediaPosting

<!-- details:fields type=social -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `subtype` | select | select | SUBTYPES.social |
| `platform` | string | text |  |
| `author` | string | text | suppressed when the envelope owns it |
<!-- /details -->

### `software` — SoftwareApplication

<!-- details:fields type=software -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `subtype` | select | select | SUBTYPES.software |
| `version` | string | text |  |
| `applicationCategory` | string | text |  |
| `operatingSystem` | array | repeater |  |
| `developer` | object | fieldset | {name, website} |
| `price` | object | fieldset | {current, currency, note} |
| `fileSize` | string | text |  |
| `gamePlatform` | array | repeater | VideoGame only |
| `playMode` | array | repeater | VideoGame only — off-list values dropped |
| `gameEdition` | string | text | VideoGame only |
| `contentRating` | string | text | VideoGame only, e.g. PEGI 12 |
| `numberOfPlayers` | object | fieldset | {min, max} · VideoGame only → QuantitativeValue |
| `systemRequirements` | object | fieldset | {processor, ram, storage} · one readable line, or {processor, ram, storage} |
<!-- /details -->

#### `software` + `subtype: "VideoGame"` — the game keys

Only emitted when the sharpened itemtype is actually written — an off-allowlist `subtype`
falls back to `SoftwareApplication`, which is not in these properties' domain.

| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `gamePlatform` | array | repeater | free text — PS5 / Xbox / Switch / PC |
| `playMode` | array | multiselect | GAME_PLAY_MODES — SinglePlayer, MultiPlayer, CoOp |
| `numberOfPlayers` | object | fieldset | `{min, max}` → QuantitativeValue |
| `gameEdition` | string | text | ONE edition name; the buy matrix lives in `editions` |
| `contentRating` | string | text | PEGI / ESRB |
| `screenshots` | array | repeater | `{src, alt}` → hidden ImageObject scopes |
| `trailer` | object | fieldset | `{id, name, description, src, thumbnail, duration, uploadDate}` → VideoObject |
| `editions` | object | fieldset | `{currency, lowPrice, highPrice, items[]}` → AggregateOffer — § below |
| `quests` / `characters` / `items` | array | repeater | `{name, description}` → quest / characterAttribute / gameItem, all Thing |

**Buy row** (`editions.items[]`, one `Offer` each):

| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `edition` | string | text | Standard, Deluxe — becomes half the Offer's `name` |
| `platform` | string | text | the other half; the machine platform list is `gamePlatform` |
| `seller` | string | text | the storefront → `seller` → Organization. **Not** a platform |
| `url` | url | url | the store's product page — a real crawlable anchor |
| `price` / `currency` / `availability` | — | — | per row; currency falls back to `editions.currency` |

### `organization` — Organization

<!-- details:fields type=organization -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `subtype` | select | select | SUBTYPES.organization |
| `foundingDate` | date | date |  |
| `foundingDateDisplay` | string | text | display twin |
| `numberOfEmployees` | number | number |  |
| `sameAs` | array | repeater |  |
| `email` | string | email |  |
| `headquarters` | object | fieldset | {address, geo} |
| `offices` | array | repeater | {name, address, geo, telephone, email, openingHours} |
<!-- /details -->

### `video` — VideoObject

<!-- details:fields type=video -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `durationDisplay` | string | text | display twin · the machine duration lives on the media item |
| `viewsDisplay` | string | text | display twin |
| `creator` | object | fieldset | {name} |
<!-- /details -->

### `howto` — HowTo

<!-- details:fields type=howto -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `totalTime` | string | text | ISO 8601 duration |
| `estimatedCost` | object | fieldset | {value, currency} |
| `difficulty` | string | text |  |
| `supplies` | array | repeater |  |
| `tools` | array | repeater |  |
| `steps` | array | repeater | {name, text} · → accordion |
<!-- /details -->

### `qa` — QAPage

<!-- details:fields type=qa -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `question` | text | textarea |  |
| `upvotes` | number | number |  |
| `answers` | array | repeater | {text, author, upvotes, accepted} |
<!-- /details -->

### `podcast` — PodcastEpisode

<!-- details:fields type=podcast -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `seriesName` | string | text |  |
| `episodeNumber` | number | number |  |
| `duration` | string | text | ISO 8601 duration |
| `durationDisplay` | string | text | display twin |
| `audioUrl` | url | url |  |
<!-- /details -->

### `movie` — Movie

<!-- details:fields type=movie -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `dateReleased` | date | date |  |
| `dateReleasedDisplay` | string | text | display twin |
| `duration` | string | text | ISO 8601 duration |
| `durationDisplay` | string | text | display twin |
| `contentRating` | string | text |  |
| `rating` | object | fieldset | {value, max, count} |
| `director` | object | fieldset | {name, label} |
| `actors` | array | repeater |  |
<!-- /details -->

### `bookseries` — BookSeries

<!-- details:fields type=bookseries -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `startDate` | date | date | first volume — the CreativeWorkSeries property |
| `endDate` | date | date | last volume; omit for an open-ended series |
| `bookCount` | number | number | prose only — no count property on the type |
| `publisher` | string | text |  |
| `rating` | object | fieldset | {value, max, count} |
| `ordered` | boolean | toggle | default TRUE — volumes ascend |
| `books` | array | repeater | {position, name, datePublished, isbn, url} · one hasPart → Book scope per row |
<!-- /details -->

**Series volume** (`books[]`, one `hasPart` → `Book` scope per row):

| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `name` | string | text | required |
| `position` | number | number | |
| `datePublished` | date | date | the visible year is derived from it |
| `isbn` | string | text | machine-only here — no visible digits, so no data-detector risk |
| `url` | url | url | renders the row as a crawlable `itemprop="url"` anchor |

### `book` — Book

<!-- details:fields type=book -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `isbn` | string | text | shown raw — the page carries the format-detection meta (schema.md § Book) |
| `numberOfPages` | number | number |  |
| `bookFormat` | select | select | BOOK_FORMATS |
| `bookFormatDisplay` | string | text | display twin |
| `publisher` | string | text |  |
| `rating` | object | fieldset | {value, max, count} |
| `price` | object | fieldset | {current, original, currency, discountText} |
<!-- /details -->

### `dataset` — Dataset

<!-- details:fields type=dataset -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `license` | url | url |  |
| `licenseDisplay` | string | text | display twin |
| `temporalCoverage` | string | text | ISO 8601 interval |
| `temporalCoverageDisplay` | string | text | display twin |
| `spatialCoverage` | string | text |  |
| `variableMeasured` | array | repeater |  |
| `distribution` | array | repeater | {format, url, size} |
<!-- /details -->

### `claim` — ClaimReview

<!-- details:fields type=claim -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `claim` | text | textarea |  |
| `claimant` | string | text |  |
| `reviewDate` | date | date |  |
| `verdict` | object | fieldset | {value, max, label} |
<!-- /details -->

### `loyalty` — MemberProgram

<!-- details:fields type=loyalty -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `hostingOrganization` | string | text |  |
| `joinUrl` | url | url |  |
| `joinText` | string | text |  |
| `joinIcon` | select | select | ICON_NAMES |
| `tiers` | array | repeater | {name, pointsEarned, url, requirement, requirementAmount, requirementNote, benefits} |
<!-- /details -->

### `quiz` — Quiz

<!-- details:fields type=quiz -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `format` | select | select | QUIZ_FORMATS · falls back to flashcard |
| `subject` | string | text |  |
| `pace` | string | text |  |
| `cards` | array | repeater | {question, answer, options} |
<!-- /details -->

### `service` — Service

<!-- details:fields type=service -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `serviceType` | string | text |  |
| `provider` | string | text |  |
| `areaServed` | string | text |  |
| `catalog` | object | fieldset | {name, period, items} |
| `channel` | object | fieldset | {languages, processingTime, url, urlText, urlIcon, telephone, contactType} |
<!-- /details -->

### `realestate` — RealEstateListing

<!-- details:fields type=realestate -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `property` | object | fieldset | {type, name, floorLevel, petsAllowed, floorSize, floorSizeUnit, floorSizeLabel, bedrooms, bathrooms, rooms, yearBuilt, address, geo, amenities} |
| `price` | object | fieldset | {amount, currency, note} |
| `datePosted` | date | date |  |
| `datePostedDisplay` | string | text | display twin |
| `agent` | string | text |  |
| `viewings` | string | text |  |
| `availability` | string | text |  |
| `map` | object | fieldset | map provider options, e.g. {key} |
| `mapMedia` | object | fieldset | the map frame's media item |
<!-- /details -->

### `vacationrental` — VacationRental

<!-- details:fields type=vacationrental -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `additionalType` | string | text |  |
| `identifier` | string | text |  |
| `brand` | string | text |  |
| `priceRange` | string | text |  |
| `checkin` | string | time |  |
| `checkout` | string | time |  |
| `checkinDisplay` | string | text | display twin |
| `checkoutDisplay` | string | text | display twin |
| `languages` | array | repeater | BCP 47 tags |
| `rating` | object | fieldset | {value, max, count} |
| `geo` | object | geopoint | {latitude, longitude, url, links} · rides the ROOT — this type IS a Place |
| `address` | object | fieldset | {streetAddress, postalCode, addressLocality, addressRegion, addressCountry} |
| `property` | object | fieldset | {additionalType, name, petsAllowed, floorSize, floorSizeUnit, floorSizeLabel, bedrooms, bathrooms, rooms, sleeps, beds, amenities} · → containsPlace |
| `map` | object | fieldset | map provider options, e.g. {key} |
| `mapMedia` | object | fieldset | the map frame's media item |
| `reviews` | array | repeater | {author, rating, max, datePublished, dateDisplay, context, headline, body} · detail pages only |
<!-- /details -->

### `menu` — Menu

<!-- details:fields type=menu -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `note` | text | textarea |  |
| `sections` | array | repeater | {name, items} |
<!-- /details -->

### `tvseries` — TVSeries

<!-- details:fields type=tvseries -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `numberOfSeasons` | number | number |  |
| `numberOfEpisodes` | number | number |  |
| `startDate` | date | date |  |
| `contentRating` | string | text |  |
| `rating` | object | fieldset | {value, max, count} |
| `ordered` | boolean | toggle |  |
| `seasons` | array | repeater | {seasonNumber, numberOfEpisodes, name, display} |
| `director` | object | fieldset | {name, label} |
| `actors` | array | repeater |  |
<!-- /details -->

### `tvepisode` — TVEpisode

<!-- details:fields type=tvepisode -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `episodeNumber` | number | number |  |
| `duration` | string | text | ISO 8601 duration |
| `durationDisplay` | string | text | display twin |
| `datePublished` | date | date |  |
| `datePublishedDisplay` | string | text | display twin |
| `seriesName` | string | text |  |
| `season` | object | fieldset | {seasonNumber, name} |
| `director` | object | fieldset | {name, label} |
| `actors` | array | repeater |  |
<!-- /details -->

### `medical` — MedicalWebPage

<!-- details:fields type=medical -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `specialty` | select | select | MEDICAL_SPECIALTIES |
| `lastReviewed` | date | date |  |
| `lastReviewedDisplay` | string | text | display twin |
| `reviewedLabel` | string | text |  |
| `audience` | object | fieldset | {type, name} |
| `about` | object | fieldset | {type, name, aspects} |
| `reviewedBy` | object | fieldset | {name, role, avatar} |
| `disclaimer` | text | textarea |  |
<!-- /details -->

### `music` — MusicAlbum

<!-- details:fields type=music -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `artist` | string | text | subheadline slot |
| `artistUrl` | url | url | subheadline slot |
| `numTracks` | number | number |  |
| `datePublished` | date | date |  |
| `datePublishedDisplay` | string | text | display twin |
| `durationDisplay` | string | text | display twin |
| `productionType` | select | select | ALBUM_PRODUCTION_TYPES |
| `releaseType` | select | select | ALBUM_RELEASE_TYPES |
| `ordered` | boolean | toggle |  |
| `tracks` | array | repeater | {name, position, duration, durationDisplay, artist} |
| `note` | text | textarea |  |
<!-- /details -->

### `musicgroup` — MusicGroup

<!-- details:fields type=musicgroup -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `genres` | array | repeater |  |
| `foundingDate` | date | date |  |
| `foundingDateDisplay` | string | text | display twin |
| `foundingLocation` | string | text |  |
| `members` | array | repeater | {role, name} |
| `albums` | array | repeater | {name, datePublished, numTracks, url, display} |
| `ordered` | boolean | toggle | defaults FALSE here |
| `sameAs` | array | repeater |  |
| `note` | text | textarea |  |
<!-- /details -->

### `glossary` — DefinedTermSet

<!-- details:fields type=glossary -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `about` | string | text |  |
| `note` | text | textarea |  |
| `terms` | array | repeater | {name, termCode, description} · → accordion |
<!-- /details -->

### `podcastseries` — PodcastSeries

<!-- details:fields type=podcastseries -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `startDate` | date | date |  |
| `cadence` | string | text |  |
| `episodeCount` | number | number |  |
| `feed` | object | fieldset | {url, text} |
| `host` | object | fieldset | {name, role, avatar} |
| `ordered` | boolean | toggle | defaults FALSE |
| `episodes` | array | repeater | {episodeNumber, name, duration, durationDisplay} |
| `note` | text | textarea |  |
<!-- /details -->

### `comicseries` — ComicSeries

<!-- details:fields type=comicseries -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `startDate` | date | date |  |
| `endDate` | date | date |  |
| `cadence` | string | text |  |
| `issn` | string | text | shown raw — the page carries the format-detection meta |
| `issueCount` | number | number |  |
| `publisher` | string | text |  |
<!-- /details -->

### `comicissue` — ComicIssue

<!-- details:fields type=comicissue -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `issueNumber` | number | number |  |
| `datePublished` | date | date |  |
| `datePublishedDisplay` | string | text | display twin |
| `pagination` | string | text |  |
| `variantCover` | string | text |  |
| `coverPrice` | string | text |  |
| `price` | object | fieldset | {current, currency, availability} |
| `series` | object | fieldset | {name, url, issn} |
| `artist` | string | text | COMIC_ROLES: labelled Art |
| `penciler` | string | text | COMIC_ROLES: labelled Pencils |
| `inker` | string | text | COMIC_ROLES: labelled Inks |
| `letterer` | string | text | COMIC_ROLES: labelled Letters |
| `colorist` | string | text | COMIC_ROLES: labelled Colours |
<!-- /details -->

### `artist` — Person

<!-- details:fields type=artist -->
| Key | Type | Control | Lookup / notes |
|---|---|---|---|
| `jobTitle` | string | text | subheadline slot |
| `organization` | string | text | subheadline slot |
| `location` | string | text |  |
| `occupation` | object | fieldset | {name, category, since} |
| `awards` | array | repeater |  |
| `sameAs` | array | repeater |  |
<!-- /details -->

---

## Lookups

Every enumerated vocabulary an editor needs, and where it comes from.

### Declared in `card.schema.json`

| Field | Values |
|---|---|
| `media[].mediaType` | `image` (default) · `video` · `youtube` · `vimeo` · `audio` · `map` · `places` |
| `media[].provider` | `osm` (default) · `google` |
| `actions[].style` | `primary` (default) · `secondary` · `ghost` |
| `actions[].iconAt` | (before, default) · `end` |
| `furniture.sticker.lines[].role` | `label` (default) · `lead` · `plain` |
| `furniture.save.shape` | `heart` (default) · `bookmark` · `star` |
| `furniture.lightbox.shape` | `photos` (default) · `maximize` |

### Declared in `render.js`

These are allowlist `Set`s. A value off the list falls back to the default, silently — so the
editor is the only place a mistake is catchable.

<!-- details:lookups -->
| Name | Used by | Values |
|---|---|---|
| `CONTACT_KINDS` | profile contact | `email` `phone` `url` |
| `ICON_NAMES` | course booking location loyalty service realestate vacationrental | 72 values — read from the generated LOOKUPS |
| `VARIANT_AXES` | product | `color` `size` `material` `pattern` |
| `VARIANT_CONTROLS` | product | `list` `buttons` `collage` |
| `ATTENDANCE_MODES` | event | `Offline` `Online` `Mixed` |
| `REVIEWED_TYPES` | review | `Product` `Organization` `Service` |
| `HUES` | timeline goal menu | `red` `orange` `green` `blue` `accent` `black` `white` `gray` `slate` |
| `GOAL_STATUS` | goal | `active` `completed` `failed` `potential` |
| `PLACE_KINDS` | places | `business` `residence` |
| `ITEM_LIST_ORDERS` | places | `ItemListOrderAscending` `ItemListOrderDescending` `ItemListUnordered` |
| `FILE_TYPES` | filelist | `pdf` `excel` `word` `txt` `zip` |
| `GAME_PLAY_MODES` | software | `SinglePlayer` `MultiPlayer` `CoOp` |
| `BOOK_FORMATS` | book | `Hardcover` `Paperback` `EBook` `AudiobookFormat` `GraphicNovel` |
| `TIER_BENEFITS` | loyalty | `TierBenefitLoyaltyPoints` `TierBenefitLoyaltyPrice` `TierBenefitLoyaltyReturns` `TierBenefitLoyaltyShipping` |
| `QUIZ_FORMATS` | quiz | `flashcard` `multiple-choice` |
| `RESIDENCE_TYPES` | realestate | `Accommodation` `Apartment` `House` `SingleFamilyResidence` `Suite` `Room` |
| `RESTRICTED_DIETS` | menu | `DiabeticDiet` `GlutenFreeDiet` `HalalDiet` `HinduDiet` `KosherDiet` `LowCalorieDiet` `LowFatDiet` `LowLactoseDiet` `LowSaltDiet` `VeganDiet` `VegetarianDiet` |
| `MEDICAL_SPECIALTIES` | medical | 41 values — read from the generated LOOKUPS |
| `MEDICAL_AUDIENCES` | medical | `MedicalAudience` `Patient` |
| `MEDICAL_ABOUT_TYPES` | medical | `MedicalCondition` `Drug` `MedicalProcedure` |
| `MEDICAL_ASPECTS` | medical | `signOrSymptom` `riskFactor` `possibleTreatment` |
| `ALBUM_PRODUCTION_TYPES` | music | `CompilationAlbum` `DJMixAlbum` `DemoAlbum` `LiveAlbum` `MixtapeAlbum` `RemixAlbum` `SoundtrackAlbum` `SpokenWordAlbum` `StudioAlbum` |
| `ALBUM_RELEASE_TYPES` | music | `AlbumRelease` `BroadcastRelease` `EPRelease` `SingleRelease` |
<!-- /details -->

---

## The media item

`media` is an array of polymorphic objects that branch on `mediaType`. Only `image` needs no
extra fields.

| Key | Type | Control | Applies to | Notes |
|---|---|---|---|---|
| `mediaType` | select | select | all | the branch key; default `image` |
| `asset` | media | media | image, video, audio | UCF `$asset`; **wins over `src`** |
| `src` | url | url | all | external URL, or the provider's video id, or an explicit map embed URL |
| `alt` | string | text | all | on a map frame this becomes the iframe `title` — an iframe needs one |
| `caption` | string | text | all | |
| `provider` | select | select | map | `osm` (default) · `google`; Google needs `details.map.key` or it falls back to OSM |
| `zoom` | number | number | map | **1–20, default 16** |
| `layer` | select | select | map | `mapnik` (default) · `cyclosm` · `cyclemap` · `transportmap` · `hot` · `shortbread` — allowlisted; anything else renders `mapnik` |
| `latitude` / `longitude` | number | geopoint | map | per-item override of `details.geo` |
| `map` | string | text | places | the `map=` token string for `<ui-map>` |
| `uploadDate` | datetime | datetime | video | |
| `duration` | string | text | video | ISO 8601 |
| `description` | string | textarea | video | |

**Zoom is not a URL parameter.** The OSM embed has none — the builder turns `zoom` into a
`bbox` half-span of `180 / 2 ** zoom`, latitude-corrected. A *wider* subject therefore takes a
*lower* number. See [media.md § Zoom is a bbox](./media.md#zoom-is-a-bbox-not-a-parameter).

**`layer` picks the basemap** and is allowlisted to the six OSM can actually embed — an
unlisted value is silently Standard in the embed, so the renderer refuses it rather than
passing it through. There is **no `bbox` field**: it is derived from `zoom`, and every map on
`demo/schema.place.html` is reproducible from `layer` + `zoom` + `geo` alone.
[media.md § Basemap layer](./media.md#basemap-layer).

> ⚠️ **`details.center` vs `details.map`.** On a `places` card, `center` is the map's centre
> point (a geo shape) and `map` is the *provider options* object (`{key}`). Two unrelated
> things one word apart. `details.geo` is a third — the single point a `location` card sits on.

Keys the renderer reads that the schema does not declare: `poster`, `width`, `height`,
`controls`, `autoplay`, `muted`, `loop`, `map`, and per-item `creditText` / `copyrightNotice`.

---

## Preset — presentation, and a separate model

No token ever belongs in `card`. All presentation lives in `card-preset`, referenced as
`{"$ref": "card-preset/<id>"}`; an unknown or missing reference falls back to a built-in
default.

| Field | Values |
|---|---|
| `element` | `ui-card` (default) · `ui-reveal` · `ui-media` · `ui-content` · `lay-out` (scroller deck — a graded quiz, one card per question) |
| `variant` / `media` / `media-open` / `content` | token strings — § Token vocabularies |
| `theme` | § Token vocabularies |
| `text` | `summary` (default) · `body` · `both` |
| `headingTag` | `h2` · `h3` (default) · `h4` · `h5` |
| `byline` | `tail` (default) · `lede` |
| `parts` | `{quote, accordion, buttonGroup, buttonGroupSize, buttonGroupTheme, office, officeTheme}` |
| `styles` | custom-property → value |
| `reveal` | `{type, typeLg, to, icon, iconType, iconClose, from, trigger, scroll, name}` |

The shipped presets are listed in [card.md § Shipped presets](./card.md).

---

## Token vocabularies

The four token DSLs, as dropdown data. **These tables are generated** from
[`data/tokens.json`](../data/tokens.json) by `tokens.build.js` — never edit them by hand.

Four values cannot be enumerated and need a free-text control:
`sticker(sh:<custom>)`, `auto(<n>)`, `cluster(<n>)`, `zoom(<n>)`.

There are currently **zero deprecated tokens and zero argument aliases**, so every value below
is live. One value per token instance — `chip(ts) chip(red)`, never `chip(ts red)`.

### `media=`

<!-- tokens:args attr=media -->
| token | arg class | values | aliases |
|---|---|---|---|
| `asr()` | **ratio** | 1/1 1/2 6/7 3/4 4/3 3/2 2/3 16/9 21/9 | — |
| `obp()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `rds()` | **size** | non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | — |
| `obf()` | **mode** | cover contain fill none | — |
| `flp()` | **mode** | h v hv | — |
| `shp()` | **shape** | pt-d pt-u pt-l pt-r cut-r cut-l skew-r skew-l para rhomb inset hex chev-l chev-r arr-l arr-r star plus minus close bolt msg frame frame-in blinds-h blinds-v curve-d curve-u curve-r curve-l circle circ-45 | — |
| `hov()` | **mode** | zoom pan track drift tilt tilt-out tilt-in rot-r rot-l shape shape-rev gray blur bright sat dim tint | — |
| `tnt()` | **hue** | red orange green blue accent black white gray slate | — |
| `scm()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `scm()` | **size** | sm md lg xl | — |
| `scm()` | **tone** | shr lgt med drk sld | — |
| `chip()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `chip()` | **hue** | red orange green blue accent black white gray slate | — |
| `chip()` | **mode** | pale muted | — |
| `chip()` | **variant** | lgt out | — |
| `chip()` | **size** | sm lg xl 2xl | — |
| `chip()` | **disc** | non rnd pll crc sqr | — |
| `sticker()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `sticker()` | **hue** | red orange green blue accent black white gray slate | — |
| `sticker()` | **mode** | pale muted | — |
| `sticker()` | **size** | sm lg xl 2xl 3xl | — |
| `sticker()` | **disc** | non rnd pll crc sqr | — |
| `sticker()` | **shape** | text spl spr sh:burst sh:blob sh:spark sh:sunburst sh:heart sh:&lt;custom&gt; | — |
| `sticker()` | **flag** | fit | — |
| `save()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `save()` | **hue** | red orange green blue accent black white gray slate | — |
| `save()` | **size** | sm lg xl | — |
| `save()` | **disc** | non rnd crc sqr | — |
| `play()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `play()` | **hue** | red orange green blue accent black white gray slate | — |
| `play()` | **size** | sm md lg xl | — |
| `play()` | **disc** | non rnd pll crc sqr | — |
| `beacon()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `beacon()` | **hue** | red orange green blue accent black white gray slate | — |
| `beacon()` | **mode** | pale muted | — |
| `beacon()` | **size** | xs sm md lg xl 2xl | — |
| `beacon()` | **face** | sld tck ldr dts | — |
| `beacon()` | **anim** | bln pls brt | — |
| `beacon()` | **disc** | pll rnd sqr non | — |
| `lightbox()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `lightbox()` | **hue** | red orange green blue accent black white gray slate | — |
| `lightbox()` | **size** | sm lg xl | — |
| `lightbox()` | **disc** | non rnd crc sqr | — |
| `marquee()` | **pos** | top bot | — |
| `marquee()` | **hue** | red orange green blue accent black white gray slate | — |
| `marquee()` | **mode** | rpt seam fade pale muted | — |
| `marquee()` | **size** | sm lg xl 2xl | — |
| `marquee()` | **disc** | non rnd pll crc sqr | — |
| `marquee()` | **value** | right up down slow fast faster gap-sm gap-lg | — |
| `vid()` | **mode** | cc pip fls | — |
| `vid()` | **size** | sm md lg xl | — |
| `load()` | **mode** | eager lazy | — |
| `nav()` | **mode** | mrk arw blw abv end non | — |
| `arw()` | **variant** | arr bare sqr sft lgt drk hid rev set | — |
| `arw()` | **size** | sm lg xl | — |
| `arw()` | **pos** | ts tc te cs cc bs bc be | — |
| `arw()` | **mode** | blw abv out | — |
| `mrk()` | **variant** | pll hyb bar tmb tml rail non lgt drk sbr lbl dyn | — |
| `mrk()` | **size** | sm md lg xl | — |
| `mrk()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `mrk()` | **mode** | blw abv | — |
| `tmb()` | **ratio** | 1/1 4/3 3/4 16/9 3/2 2/3 | — |
| `axis()` | **value** | y | — |
| `auto()` | **value** | &lt;n&gt; &lt;n&gt;s &lt;n&gt;ms | — |
| `ani()` | **anim** | rise fall lft rgt zom blr fde | — |
| `crd()` | **anim** | rise fall lft rgt zom blr fde | — |
| `open:grid()` | **cols** | 2c 3c 4c | — |
| `hug` | *(bare flag)* | — | — |
| `clip` | *(bare flag)* | — | — |
| `loop` | *(bare flag)* | — | — |
| `stagger` | *(bare flag)* | — | — |
| `gate` | *(bare flag)* | — | — |
| `pages` | *(bare flag)* | — | — |
| `open:furniture` | *(bare flag)* | — | — |
<!-- /tokens -->

### `variant=`

<!-- tokens:args attr=variant -->
| token | arg class | values | aliases |
|---|---|---|---|
| `rds()` | **size** | non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | — |
| `shd()` | **size** | non sm md lg xl | — |
| `bdr()` | **size** | sm md lg | — |
| `bdr()` | **tone** | lgt drk | — |
| `spl()` | **ratio** | 1/1 1/2 2/1 1/3 3/1 | — |
| `vis()` | **value** | media content | — |
| `ovr()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `flp()` | **pos** | top btm lft rgt | — |
| `sld()` | **pos** | top btm lft rgt | — |
| `grw()` | **pos** | ts te bs be | — |
| `trg()` | **value** | card | — |
| `ico()` | **pos** | ts te bs be | — |
| `ico()` | **tone** | drk sem | — |
| `ico()` | **size** | sm lg | — |
| `icc()` | **pos** | ts te bs be | — |
| `icc()` | **tone** | drk sem | — |
| `icc()` | **size** | sm lg | — |
| `col` | *(bare flag)* | — | — |
| `col-r` | *(bare flag)* | — | — |
| `row` | *(bare flag)* | — | — |
| `row-r` | *(bare flag)* | — | — |
| `exp` | *(bare flag)* | — | — |
| `pop` | *(bare flag)* | — | — |
| `scr` | *(bare flag)* | — | — |
| `sub` | *(bare flag)* | — | — |
<!-- /tokens -->

### `content=`

<!-- tokens:args attr=content -->
| token | arg class | values | aliases |
|---|---|---|---|
| `pad()` | **size** | none xs sm md lg xl 2xl | — |
| `pb()` | **size** | none xs sm md lg xl 2xl | — |
| `pi()` | **size** | none xs sm md lg xl 2xl | — |
| `pbs()` | **size** | none xs sm md lg xl 2xl | — |
| `pbe()` | **size** | none xs sm md lg xl 2xl | — |
| `pis()` | **size** | none xs sm md lg xl 2xl | — |
| `pie()` | **size** | none xs sm md lg xl 2xl | — |
| `gap()` | **size** | none xs sm md lg | — |
| `scl()` | **size** | sm md lg xl | — |
| `scl()` | **mode** | fix fluid | — |
| `hl()` | **size** | sm md lg xl 2xl 3xl | — |
| `hl()` | **tone** | shr lgt med drk sld accent inv | — |
| `hl()` | **weight** | 300 400 500 600 700 800 900 | — |
| `hl()` | **font** | body head serif mono form | — |
| `hl()` | **flag** | shd | — |
| `eb()` | **size** | sm md lg xl | — |
| `eb()` | **tone** | shr lgt med drk sld accent inv | — |
| `eb()` | **weight** | 300 400 500 600 700 800 900 | — |
| `eb()` | **flag** | flat shd | — |
| `tx()` | **size** | sm md lg xl | — |
| `tx()` | **tone** | shr lgt med drk sld accent inv | — |
| `tx()` | **weight** | 300 400 500 600 700 800 900 | — |
| `tx()` | **flag** | shd | — |
| `mt()` | **size** | sm md lg xl | — |
| `mt()` | **tone** | shr lgt med drk sld accent inv | — |
| `mt()` | **weight** | 300 400 500 600 700 800 900 | — |
| `mt()` | **flag** | shd | — |
| `fnt()` | **font** | body head serif mono form | — |
| `rds()` | **size** | non sm md lg xl 2xl full pill sm-sq md-sq lg-sq xl-sq | — |
| `plc()` | **pos** | ts tc te cs cc ce bs bc be | — |
| `wid()` | **size** | sm md lg xl 2xl | — |
| `tal()` | **value** | start ctr end | — |
| `scr()` | **value** | x y | — |
| `gate` | *(bare flag)* | — | — |
<!-- /tokens -->

### `map=`

<!-- tokens:args attr=map -->
| token | arg class | values | aliases |
|---|---|---|---|
| `tiles()` | **provider** | auto positron dark voyager osm topo sat | — |
| `tint()` | **look** | vivid navy gray mono sepia invert warm cool soft | — |
| `pin()` | **look** | dot pin label price | — |
| `cluster()` | **radius** | sm md lg &lt;n&gt; | — |
| `zoom()` | **level** | &lt;n&gt; | — |
| `ctl()` | **control** | zoom non | — |
| `fit` | *(bare flag)* | — | — |
| `scroll` | *(bare flag)* | — | — |
<!-- /tokens -->

### `theme=`

Not in the token manifest — this vocabulary lives in `ui/base/theme.css`. Pick **one** hue and
add any number of modifiers.

| Axis | Values |
|---|---|
| Hue | `red` `orange` `green` `blue` `accent` `black` `white` `gray` `slate` |
| Modifier | `pale` `muted` `ink` `light` `dark` `border` `glass` |
| `border()` | sides `bs` `be` `is` `ie` `bk` `in` · widths `sm` `md` `lg` `xl` `2xl` · styles `dashed` `dotted` `double` |

---

## Known drift

Where the sources still disagree. Everything here was re-verified on 2026-08-20; the rows that
were fixed that day are listed underneath so they are not re-reported.

| Drift | Detail |
|---|---|
| ~~`details` has no machine schema~~ | **Closed.** The machine contract is [`data/details.json`](../data/details.json) — per-type fields, controls and lookup names, built into the card editor by `details.build.js` and held against `render.js` and the whole `data/` corpus by `details.lint.js` (every `details` key in every instance must be declared, kinds must match, and an advisory check flags any `d.*` a `DETAILS` renderer reads that the manifest lacks). The tables in this document are generated from it. |
| ~~Renderer-only `details` keys~~ | **Closed** by the same manifest — `format` (quiz), `variants.control`/`.tile`/`.layout`, `slides`/`slide`/`list` (places), `mapMedia`, `hours` (location's string form) and `reviews[]` (product) are all declared. |
| Renderer-only envelope keys | `modifiedDisplay`, and `tags[]` in its `{name, url}` object form. |
| Media keys not in the schema | `width`, `height`, `map`, per-item `creditText`/`copyrightNotice`. |
| Bedroom naming split | `places` residence items use `numberOfBedrooms`/`numberOfRooms`; `realestate.details.property` uses `bedrooms`/`bathrooms`/`rooms` — 12 call sites. A rename would be gated by the SSR snapshot staying byte-identical. |

**Closed 2026-08-20:** `51` vs `52` (card.md said 51 in three places) · `cover` and `modified`
missing from card.md's envelope table · `media-open` missing from its preset table ·
`reveal.name`, which turned out to be declared after all · `card.schema.json` not declaring
`layer`, `poster`, `controls`, `autoplay`, `muted`, `loop` · the composite `link` type being
undocumented in the UCM format spec · `cms/baseline/CLAUDE.md` describing only `content-card` ·
`UCF.md` calling the model side "UDM".

---

## Notes for an editor

**Conditional rules that must be honoured.** These are the only places the form changes shape:

1. `subtype` is visible for exactly 9 of the 54 types (the `SUBTYPES` families — including
   `article` and `news`, which are otherwise envelope-only), and its options depend on which.
2. The whole `details` panel swaps on `schemaType`; 4 types have no panel at all.
3. `media[]` item fields branch on `mediaType` — `zoom`/`provider`/`latitude`/`longitude` only
   for `map`, `map` only for `places`, `uploadDate`/`duration`/`description` only for `video`.
4. `details.slides` (places) unlocks `details.slide`.
5. `profile`, `artist`, `music` and `product` move `subheadline` into the type panel
   (`SUBHEADLINE_SLOT` — see § Fields some types take from `details`).

**The reference implementation is `cms/editors/card` (`<editor-card>`).** It renders every
table in this document from the generated `src/details.data.js` — the schemaType dropdown
(grouped by the eleven `schema.html` sections), the per-type panels, the materialized lookup
vocabularies, the `requires` gates and the round-trip guarantees. A CMS that cannot embed the
web component can build its own form from the same file, or from `data/details.json` directly;
nothing in this document needs to be transcribed by hand.

**Import `data/tokens.data.js`, not `data/tokens.json`.** It is a byte-for-byte ES-module
mirror of the manifest, importable in Node and the browser without JSON import attributes. It
is what `render.js` itself uses.
