# Grouping `demo/schema.html` into logical sections

> **Implemented.** Written 2026-08-16 as a proposal against `v4` at `1c3d9aa`; the sections
> and card order below shipped the same day, so this now documents the page as it is rather
> than a plan for it. Every count and measurement is from that revision.
>
> The grid spec stayed **parked** — the page is still `md="columns(2) items(start)"`, one
> `<lay-out>` per section. The three-column / page-width discussion is recorded in
> [§ The grid](#the-grid--parked) so it need not be re-derived; nothing was decided.

## Context

`demo/schema.html` **was** one `<lay-out md="columns(2) items(start)">` holding all 57 cards, in
accretive order: the original card types first, the model v1.3 additions next, the
[markup-first types](../../ui/card/docs/schema.md) appended at the end as they were written. It
reads as a changelog. A developer arriving with "how do I mark up a podcast?" has to scan the
whole grid.

## First: 57 cards, 59 items — both numbers are right

They measure different things, and conflating them is the trap
[`ui/card/docs/schema.md`](../../ui/card/docs/schema.md) opens with. **59** is the count of
top-level microdata items — what a structured-data validator reports. **57** is the count of
*cards*. The two non-cards need no section, and neither is a `WebPage`:

- **`WebSite`** (`demo/schema.html:94`) — a `<div … hidden>` sitting **before** the first
  section opens at `:116`. Outside every grid; it never was a cell.
- **`EmployerAggregateRating`** (`:1181`) — a top-level *item* but a nested *element*, inside the
  JobPosting card as `data-part="rating"`. It travels with the job card wherever that goes.

The page *does* carry four `WebPage` **subtypes** — FAQPage, QAPage, MedicalWebPage,
RealEstateListing — but those are cards, and they are the subject of a callout below.

Reproduce either number:

```sh
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const html = readFileSync('ui/card/demo/schema.html', 'utf8');
console.log((html.match(/<ui-(card|reveal)(?![^>]*itemprop=)[^>]*itemtype=/g) || []).length)"  # → 57
```

…or in a browser console on the page: `document.querySelectorAll('[itemscope]:not([itemprop])').length` → **59**.

## There is already a taxonomy — and why it can't be used as-is

Every UCF instance carries `meta.folder` (`ui/card/data/*.json`): `Cards/Media`,
`Cards/Commerce`, `Cards/Editorial`… **22 folders for 57 cards**, and the distribution is
unusable as sections: **Media 12, Commerce 12, and eleven singletons** (Careers, Guides, Health,
Generic, News, Operations, Property, Reference, Business, Events, Support…).

It is a CMS filing tree — optimised for "where does this content live" — not a reading order.
The right starting signal at the wrong granularity. The sections below merge the singletons and
split the two giants.

```sh
for f in ui/card/data/*.json; do
  python3 -c "import json,sys;print(json.load(open('$f')).get('meta',{}).get('folder','—'))" 2>/dev/null
done | sort | uniq -c | sort -rn
```

## The ten sections, in page order

| § | Section | Cards |
|---|---|---|
| 1 | **Editorial & journalism** (5) | CreativeWork · Article · NewsArticle · Quotation · ClaimReview |
| 2 | **Commerce & offers** (9) | Product · ProductGroup · SoftwareApplication · ItemList *(comparison)* · Review · Review *(testimonial)* · Offer *(membership)* · MemberProgram · Reservation |
| 3 | **Screen** (4) | Movie · TVSeries · TVEpisode · VideoObject |
| 4 | **Audio** (4) | PodcastSeries · PodcastEpisode · MusicGroup · MusicAlbum |
| 5 | **Page & picture** (4) | Book · ComicSeries · ComicIssue · ImageGallery |
| 6 | **Learning & reference** (7) | Course · EducationalOccupationalCredential · Quiz · Quiz *(graded)* · Quiz *(flashcard `ui-reveal`)* · HowTo · DefinedTermSet |
| 7 | **People, work & history** (6) | Person *(profile)* · Person *(artist)* · Organization · JobPosting · EventSeries ×2 |
| 8 | **Places, venues & property** (7) | Place · Place *(map)* · CafeOrCoffeeShop · Menu · Recipe · Event · RealEstateListing |
| 9 | **Community & support** (6) | FAQPage · QAPage · Question *(poll)* · ContactPoint · SocialMediaPosting · DiscussionForumPosting |
| 10 | **Data, health & operations** (5) | Observation · Dataset · MedicalWebPage · SpecialAnnouncement · Service |

5 + 9 + 4 + 4 + 4 + 7 + 6 + 7 + 6 + 5 = **57**, every card placed exactly once — asserted by the
reorder script rather than trusted. Each section is an `<h2 id="sec-…">` followed by its own
`<lay-out md="columns(2) items(start)">`.

**Why the Media dozen splits three ways.** Twelve cards is too long a section and the natural
seam is the *medium* — screen, audio, page. Each arm lands on four cards, and each arm carries a
container/part pair, so the sections teach the same lesson three times in three vocabularies.

## Two things this grouping hides — call them out, don't section by them

1. **Four cards are `WebPage` subtypes, not what they look like.** FAQPage, QAPage,
   MedicalWebPage and RealEstateListing are pages *about* a thing. That is why
   RealEstateListing hangs the home off `mainEntity`, and why MedicalWebPage's
   `specialty` / `reviewedBy` / `lastReviewed` are WebPage properties it merely inherits. A
   domain grouping scatters them across §8, §9 and §10 and a reader never notices they are one
   shape. Worth a cross-reference note, not a section of its own.
2. **Container/part is the page's most repeated pattern** — ProductGroup↔Product,
   PodcastSeries↔Episode, TVSeries↔Episode, MusicGroup↔Album, ComicSeries↔Issue,
   Organization↔JobPosting, CafeOrCoffeeShop↔Menu, Person(artist)↔ComicSeries. Sectioning puts
   each pair side by side for the first time; the pattern deserves naming once.

## Three inconsistencies the exercise surfaced — two fixed by the reorder

- ✅ **Podcast was ordered backwards.** Every other pair runs container-then-part
  (TVSeries→TVEpisode, MusicGroup→MusicAlbum, ComicSeries→ComicIssue); podcast ran
  Episode→Series. §4 now leads with `PodcastSeries`. The inter-card comment that read *"the card
  above is one episode"* was rewritten with it — it encoded the old adjacency.
- ⬜ **Two linking conventions for one relationship — still open.** `ComicIssue` and `MusicAlbum`
  link to their sibling card with a real crawlable `<a itemprop="url">`. `TVEpisode` and
  `PodcastEpisode` emit `partOfSeries` as a **hidden, name-only scope** with no url — and now the
  sibling card is not merely on the same page but directly adjacent, which makes the gap starker.
  A renderer change, so out of scope for a reorder.
- ✅ **`Person` appeared twice, 38 cards apart** — profile and comic artist. They are now the
  first two cards of §7, so the two Person shapes sit side by side.

## The grid — parked

The page stays `md="columns(2) items(start)"`. Recorded so it need not be re-measured:

**The two page-container tokens**, generated into `:root` from `layout/layout.config.json` →
`layoutContainer`:

| Token | Value | Config source | Applied as |
|---|---|---|---|
| `--layout-bleed-mw` | `1024px` | `maxWidth: 1024` | `body:has(lay-out) { margin-inline: max(var(--layout-mi), 50cqw - var(--layout-bleed-mw)/2) }` |
| `--layout-mi` | `1rem` | `margin: "1rem"` | the same rule — it is a **margin**, not padding; `lay-out` itself computes `padding-inline: 0` |

**"Inline inset = column gap" is already true.** `--layout-mi` is `1rem` = **16px**; the measured
`column-gap` is **16px** (`--layout-colmg: 1` × `--layout-space-unit: 1rem`). Row-gap matches.

**If three columns is ever revisited**, three findings decide it:

- Cells go **504px → 331px**, viewport-independent above ~1080px because of the 1024 cap. 331px
  is **below the card engine's first container tier** (`md:` = 25rem = 400px). Nothing breaks
  today — the page writes *zero* `md:`/`lg:` tokens, and `ui-card.css`'s only size-based
  `@container` rules (25rem / 44rem) fire exclusively for those tokens, the other two being
  `style()` queries for the unused `variant~="sub"`. But the page would then sit permanently
  under tier one, so any `md:` token added to a card later would silently never arm here.
- **The ProductGroup collage cannot adapt.** Its nested
  `<lay-out xs="cg(3xs) rg(3xs)" md="columns(2)">` uses *viewport* breakpoints (md = 540px), not
  container tiers, so it would stay two columns inside a 331px cell — roughly 160px tiles.
- **`items(start)` is load-bearing and repeats per breakpoint.** Measured first-six card heights
  with it: `676 · 576 · 509 · 523 · 747 · 681` (natural height). Without it `align-items` falls
  back to `normal` and cards **stretch to the tallest in their row**:
  `676 · 676 · 523 · 523 · 747 · 747`.

## The one structural cost of sectioning

Every card headline used to be an `<h2>` under a single `<lay-out>`. Sections need `<h2>` for the
section heading and the card headlines one level down — which is a **preset** concern, not
markup, and is the subject of point 2 below. Mechanically each section is one plain `<lay-out>`;
no `<section>` wrapper and no `lay-out-group` were needed, because nothing in the layout CSS
assumes a direct-child relationship (`[data-layout-root]` is a bare rule and `body:has(lay-out)`
matches descendants).

## How it shipped, and the two things that turned out differently

1. **The compare gate was never order-sensitive.** This document originally warned that bare-key
   pairs in `schema.compare.js` would need re-checking, because that regex matches the first card
   of a type *without* an `id`. Checked mechanically before touching anything: **zero** bare pairs
   have more than one id-less card. Every duplicated type is either disambiguated
   (`Place#schema-map`, `Person#schema-artist`, `Quiz#schema-quiz-mc`, `ui-reveal:Quiz`) or not
   paired at all (`Review`, `EventSeries`). Reordering could not break it, and did not — 25/25
   before and after.
2. **Heading level moved through the presets, not through the page.** The original plan floated a
   per-page override in the compare gate. The better answer, and the one taken: *no card
   hardcodes a heading tag*. `headingTag` already defaults to `h3` in
   [`card-preset.schema.json`](../../cms/baseline/models/card-preset.schema.json), so the fifteen
   grid presets simply **dropped their redundant `"headingTag": "h2"`** and inherit it. The two
   presets backing a standalone single-entity page — `prose-article` and `product-page` — keep an
   explicit `h2`, because there the card headline is the page's own top heading.

   That containment matters: `demo/articles/*.html` and `demo/products/*.html` have **no `<h1>`**
   at all, so demoting them would have pushed those pages to start at `h3` — and they are the
   real rich-result candidates. `demo/render.html` needed nothing either: it already prints an
   `<h2>` label per card, so the change turned a flat `h2`-over-`h2` into a correct `h2`-over-`h3`.

The 11 comments interleaved between cards were carried with the card each one introduces, and the
five that assert adjacency (*"the card above…"*) were checked individually: four are preserved by
the new order, one — the podcast note — was rewritten.

`ui/card/data/index.json` was reordered to the same sequence so `demo/render.html` reads in step;
its shape is unchanged, since that page labels every card individually and needs no section
metadata.

**Not done:** rewriting `meta.folder` so the sections become the CMS tree too. Left deliberately —
the folder tree answers "where does this content live", which is a different question from "how
does this page read".

## Verification

| Check | Result |
|---|---|
| `node ui/card/tokens.lint.js` | ok |
| `node --test ui/card/render.test.js` | 185/185 |
| `node ui/card/schema.compare.js` | **25/25** — unchanged, both sides now `h3` |
| SSR snapshot vs the pre-change baseline | 114 changed lines, **every one** a `data-part="headline"` tag; nothing else moved |
| Heading outline in the browser | `h1` ×1 → `h2` ×10 → `h3` ×54, **zero skips** |
| Card and comment count | 57 cards and 27 comments before and after |

## Unrelated finding, worth its own issue

`ui/card/demo.layout.css` sets `--layout-space-unit: var(--spacing-lg, 1.5rem)` for page-level
lay-outs — *"match the old `.grid` rhythm"* — but that shim is **not present in
`dist/demo.min.css`**, and `demo/schema.html` links only the bundle. The effective unit is the
system default `1rem`, so page gaps are 16px where the shim intends 24px. Not part of this.
